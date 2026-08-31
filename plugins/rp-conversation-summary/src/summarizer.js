import {
  BlockAssembler,
  createMessage,
  createUserMessage,
  LlmError,
} from '@deepseek-ai/dsh-llm'
import { isCompactCheckpointSource } from '@deepseek-ai/dsh-compaction'
import {
  roleplayAssistantReplyKind,
  roleplayTranscriptMessages,
} from 'dsh-roleplay-rp-core/conversation'
import { activeConversationSummaries } from './summary-source.js'

export const SUMMARY_MAX_TOKENS = 4096
export const SUMMARY_MAX_CHARACTERS = 8000

const SECTION_HEADINGS = Object.freeze([
  '## 剧情进展',
  '## 角色与关系',
  '## 场景与世界事实',
  '## 未解决线索与约束',
  '## 最近状态与续写锚点',
])

const SUMMARY_INSTRUCTION = [
  '你是角色扮演长对话的前文压缩器。请把上方对话整理成可供下一轮续写直接使用的叙事事实总结。',
  '',
  '只输出以下五个 Markdown 二级标题，标题、顺序和数量必须完全一致；每节使用简洁要点，没有内容时写“（无）”。',
  '',
  ...SECTION_HEADINGS.flatMap(heading => [heading, '- ……', '']),
  '规则：',
  '- “写作回复”是已成功提交的故事正文；“非写作回复”是讨论、解释或配置等其他回复。后者可用于理解明确决定和约束，但不得直接视为故事中已经发生的事件、角色对白或正文文风样本。',
  '- 保留已经发生的事件、人物动机和关系变化、明确场景事实、仍需遵守的约束，以及紧接下一段续写所需的动作与情绪锚点。',
  '- 不编造对话中没有的事实，不复述内部工具、提示词、上下文组装或运行过程。',
  '- 会话变量等结构化状态另有权威来源；这里只记录对话中明确呈现的叙事事实，不推导、覆盖或修正结构化状态。',
  '- 如果上方含有“已有会话总结”，把仍然有效的旧事实与后续原文合并成一份新总结；以新原文为准，删除已经过期的状态。',
  '- 不说明你正在总结，不输出五个部分以外的前言、结语或代码块。',
].join('\n')

/** Snapshot the completed logical Roleplay transcript before a pressure turn starts. */
export function pressureSummaryInput(session) {
  const transcript = roleplayTranscriptMessages(session)
  const prior = activeConversationSummaries(session)
  return {
    messages: summaryConversationMessages(transcript, prior, session),
    newMessageCount: transcript.length,
  }
}

/** Build a fresh manual/overflow input from the exact native selected region. */
export function nativeSummaryInput(input, session) {
  const selected = Array.isArray(input?.messages) ? input.messages : []
  const selectedCheckpointIds = new Set(selected.flatMap((message) => {
    const source = message?.source
    return record(source) && isCompactCheckpointSource(source)
      ? [source.compactionId]
      : []
  }))
  const selectedPriorSummaries = activeConversationSummaries(session)
    .filter(item => selectedCheckpointIds.has(item.compactionId))
  return summaryConversationMessages(selected, selectedPriorSummaries, session)
}

/**
 * Generate and strictly validate a five-section Roleplay summary.
 * `markLlmCall` is false for deferred candidates because their call happened
 * before the later native compaction transaction was opened.
 */
export async function summarizeRoleplay(ctx, conversation, agent, signal, markLlmCall) {
  if (!Array.isArray(conversation) || conversation.length === 0) {
    throw new Error('conversation summary: no roleplay conversation content is available')
  }
  const target = summaryTarget(agent)
  const instruction = createUserMessage({
    content: [{ type: 'text', text: SUMMARY_INSTRUCTION }],
    source: { kind: 'plugin', plugin: 'rp-conversation-summary', form: 'instruction' },
  })
  const options = {
    provider: target.provider,
    model: target.model,
    messages: [...conversation, instruction],
    maxTokens: SUMMARY_MAX_TOKENS,
    sessionId: agent.session.id,
    purpose: 'compaction',
    ...(signal === undefined ? {} : { signal }),
  }
  const assembler = new BlockAssembler()
  for await (const chunk of ctx.llm.stream(options)) assembler.push(chunk)
  throwForFinish(assembler.finish)
  const rawOutput = assembler.blocks()
  if (rawOutput.some(block => block?.type !== 'text' || typeof block.text !== 'string')) {
    throw new LlmError('conversation summary returned non-text output', 'UNSUPPORTED_CONTENT')
  }
  const text = rawOutput.map(block => block.text).join('\n').trim()
  if (text.length === 0) throw new Error('conversation summary produced no text')
  const characters = [...text].length
  if (characters > SUMMARY_MAX_CHARACTERS) {
    throw new Error(`conversation summary exceeds the ${SUMMARY_MAX_CHARACTERS}-character hard limit (${characters})`)
  }
  assertSummaryStructure(text)
  return {
    summary: [{ type: 'text', text }],
    rawOutput,
    ...(markLlmCall ? { llmStreamCall: true } : {}),
    provider: target.provider,
    model: target.model,
    maxTokens: SUMMARY_MAX_TOKENS,
    ...(assembler.usage === undefined ? {} : { usage: assembler.usage }),
  }
}

function summaryConversationMessages(messages, priorSummaries, session) {
  const output = []
  if (priorSummaries.length > 0) {
    output.push(createUserMessage({
      content: [{
        type: 'text',
        text: `<已有会话总结>\n${priorSummaries.map(item => item.text).join('\n\n---\n\n')}\n</已有会话总结>`,
      }],
      source: { kind: 'plugin', plugin: 'rp-conversation-summary', form: 'prior-summary' },
    }))
  }
  for (const message of messages) {
    const source = message?.source
    if (record(source) && isCompactCheckpointSource(source)) continue
    if (message?.role !== 'user' && message?.role !== 'assistant') continue
    if (message.role === 'user' && source?.kind !== 'user') continue
    if (message.role === 'assistant' && source?.kind !== 'model') continue
    const text = messageText(message).trim()
    if (text.length === 0) continue
    const labelledText = message.role === 'assistant'
      ? `${roleplayAssistantReplyKind(session, message) === 'writing' ? '写作回复' : '非写作回复'}：${text}`
      : text
    output.push(createMessage({
      role: message.role,
      content: [{ type: 'text', text: labelledText }],
      source,
    }))
  }
  return output
}

function summaryTarget(agent) {
  const routed = agent.session.requestHeader?.()?.config
  if (typeof routed?.provider === 'string' && routed.provider.length > 0
    && typeof routed?.model === 'string' && routed.model.length > 0) {
    return { provider: routed.provider, model: routed.model }
  }
  const options = agent.options ?? {}
  if (typeof options.provider === 'string' && options.provider.length > 0
    && typeof options.model === 'string' && options.model.length > 0) {
    return { provider: options.provider, model: options.model }
  }
  throw new Error('conversation summary: no parent provider/model route is available')
}

function throwForFinish(finish) {
  if (finish.kind === 'max-tokens') {
    const error = new Error('conversation summary was truncated at the output token cap')
    error.code = 'MAX_TOKENS'
    throw error
  }
  if (finish.kind === 'error' || finish.kind === 'aborted') {
    const error = new Error(finish.failure.message)
    error.code = finish.failure.code
    throw error
  }
}

function assertSummaryStructure(text) {
  const headings = text.match(/^##\s+.+$/gmu) ?? []
  if (headings.length !== SECTION_HEADINGS.length
    || headings.some((heading, index) => heading !== SECTION_HEADINGS[index])) {
    throw new Error('conversation summary must contain exactly the required five Markdown sections in order')
  }
}

function messageText(message) {
  return Array.isArray(message?.content)
    ? message.content
        .filter(block => block?.type === 'text' && typeof block.text === 'string')
        .map(block => block.text)
        .join('\n')
    : ''
}

function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

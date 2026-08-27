import Schema from '@deepseek-ai/schemastery'
import {
  CONVERSATION_SUMMARY_SLOT_ID,
  CONVERSATION_SUMMARY_SOURCE_ID,
  conversationSummaryContext,
} from './summary-source.js'

export const name = 'rp-conversation-summary-bridge'
export const inject = ['rpRuntime']
export const Config = Schema.object({})

const CONVERSATION_SUMMARY_CONTEXT_NOTE = '[Context note: A compressed record of earlier conversation for continuity. Newer Conversation History takes precedence.]'

/** Register the read-only active-checkpoint projection in the Roleplay realm. */
export function apply(ctx) {
  ctx.rpRuntime.registerContextSource({
    id: CONVERSATION_SUMMARY_SOURCE_ID,
    label: '会话总结',
    description: '由当前对话中仍然生效的压缩节点提供的前文叙事事实。',
    kind: 'conversation',
    promptCategory: 'factual',
    delivery: 'native-history',
    order: -1,
    budgetPriority: -1100,
    required: true,
    idleAllowed: false,
    pretransformed: true,
    defaultSlot: {
      id: CONVERSATION_SUMMARY_SLOT_ID,
      label: '会话总结',
      order: -1,
    },
    prepare: ({ agent }) => {
      const context = conversationSummaryContext(agent.session)
      return context === undefined
        ? undefined
        : { ...context, text: `${CONVERSATION_SUMMARY_CONTEXT_NOTE}\n\n${context.text}` }
    },
  })
}

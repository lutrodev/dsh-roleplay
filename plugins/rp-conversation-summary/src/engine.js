import Schema from '@deepseek-ai/schemastery'
import BasicCompactionEngine from '@deepseek-ai/dsh-compaction-basic'
import {
  toolPairingBalancedAfter,
  toolPairingBalancedBefore,
} from '@deepseek-ai/dsh-compaction'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { roleplayTranscriptMessages } from 'dsh-roleplay-rp-core/conversation'
import {
  nativeSummaryInput,
  pressureSummaryInput,
  summarizeRoleplay,
} from './summarizer.js'
import { roleplayCompactionTokenMeter } from './token-meter.js'

const PRESSURE_RATIO = 0.8
const CHECKPOINT_FRAME_RESERVE_TOKENS = 256

/**
 * Deferred Roleplay compaction: pressure work is generated beside turn N and
 * committed by the native transaction at turn N+1's first boundary.
 */
export class RpConversationSummaryEngine extends BasicCompactionEngine {
  static Config = Schema.object({})
  static inject = ['llm', 'tokenMeter', 'sessions']

  constructor(ctx) {
    super(ctx, {
      auto: true,
      thresholdRatio: PRESSURE_RATIO,
      retainTokens: 0,
      maxTokens: 4096,
      compactionRetries: 0,
      maxOverflowRetries: 1,
    })
    this.compactionMeter = roleplayCompactionTokenMeter(ctx.tokenMeter)
    this.candidates = new Map()
    this.landingSummaries = new WeakMap()
    this.disposed = false

    ctx.on('session/event', (session, event) => this.observeSessionEvent(session, event))
    ctx.on('agent/session-start', ({ agent }) => this.discardCandidate(agent, true))
    ctx.on('agent/disposed', ({ agent }) => this.discardCandidate(agent, true))
    ctx.on('session/disposed', session => {
      for (const [agent, candidate] of this.candidates) {
        if (candidate.session === session) this.discardCandidate(agent, true)
      }
    })
    ctx.effect(() => () => {
      this.disposed = true
      for (const agent of [...this.candidates.keys()]) this.discardCandidate(agent, true)
    }, 'rp-conversation-summary: abort deferred summaries')
  }

  async compactIfNeeded(agent, trigger, signal) {
    if (trigger === 'context-overflow') {
      this.discardCandidate(agent, true)
      if (sessionTarget(agent.session) === undefined) return null
      if (latestReplyExchangeStart(agent.session) === undefined) {
        return BasicCompactionEngine.prototype.compactIfNeeded.call(
          this.baseCompactionReceiver(), agent, trigger, signal,
        )
      }
      signal.throwIfAborted()
      this.ctx.get('toolResultPruner')?.pruneSession(agent.session)
      signal.throwIfAborted()
      const range = overflowRangeBeforeLatestReply(agent.session)
      return range === null
        ? null
        : this.compactRegion(range.start, range.end, agent, signal)
    }
    const boundary = firstStepBoundary(agent.session)
    if (boundary === undefined) return null

    const existing = this.candidates.get(agent)
    if (existing !== undefined) {
      if (!existing.eligible) return null
      const landed = await this.landCandidate(agent, existing, signal)
      if (landed !== null) return landed
    }
    if (this.disposed || signal.aborted) return null

    const target = parentTarget(agent)
    if (target === undefined) return null
    const info = await this.ctx.llm.resolveModelInfo(target.provider, target.model, signal)
    const contextWindow = info?.context?.contextWindow
    if (!Number.isSafeInteger(contextWindow) || contextWindow < 1) {
      throw new Error(`conversation summary: no contextWindow is configured for ${target.provider}/${target.model}`)
    }
    const currentBoundary = firstStepBoundary(agent.session)
    if (currentBoundary?.turn !== boundary.turn || currentBoundary.seq !== boundary.seq) return null
    const measurement = this.compactionMeter.measure(agent.session)
    if (measurement.totalTokens < Math.floor(contextWindow * PRESSURE_RATIO)) return null

    const frozenSeqs = [...agent.session.surface.nodes]
    if (frozenSeqs.length === 0 || frozenSeqs.some(seq => seq >= boundary.seq)) return null
    const start = frozenSeqs[0]
    const end = frozenSeqs.at(-1)
    if (!toolPairingBalancedBefore(agent.session, start)
      || !toolPairingBalancedAfter(agent.session, end)) return null
    const input = pressureSummaryInput(agent.session)
    if (input.newMessageCount === 0) return null

    const controller = new AbortController()
    const completion = summarizeRoleplay(
      this.ctx,
      input.messages,
      agent,
      controller.signal,
      false,
    ).then(
      result => ({ ok: true, result }),
      error => ({ ok: false, error }),
    )
    this.candidates.set(agent, {
      session: agent.session,
      triggerTurn: boundary.turn,
      frozenSeqs,
      controller,
      completion,
      eligible: false,
    })
    return null
  }

  async summarize(input, agent, signal) {
    const cached = this.landingSummaries.get(agent)
    if (cached !== undefined) return cached
    return summarizeRoleplay(
      this.ctx,
      nativeSummaryInput(input, agent.session),
      agent,
      signal,
      true,
    )
  }

  async landCandidate(agent, candidate, signal) {
    const completion = await waitForCompletion(candidate.completion, signal)
    if (this.candidates.get(agent) !== candidate) return null
    if (!completion.ok) {
      this.ctx.logger.warn(`conversation summary generation failed: ${errorMessage(completion.error)}; preserving the full conversation`)
      this.discardCandidate(agent, false)
      return null
    }
    if (!validFrozenPrefix(candidate.session, candidate.frozenSeqs)) {
      this.discardCandidate(agent, false)
      return null
    }
    const start = candidate.frozenSeqs[0]
    const end = candidate.frozenSeqs.at(-1)
    if (!toolPairingBalancedBefore(candidate.session, start)
      || !toolPairingBalancedAfter(candidate.session, end)
      || !summaryWillShrink(this.compactionMeter, candidate.session, candidate.frozenSeqs, completion.result)) {
      this.discardCandidate(agent, false)
      return null
    }
    this.candidates.delete(agent)
    this.landingSummaries.set(agent, completion.result)
    try {
      return await this.compactRegion(start, end, agent, signal)
    } finally {
      this.landingSummaries.delete(agent)
    }
  }

  observeSessionEvent(session, event) {
    if (event?.type !== 'turn/end') return
    for (const [agent, candidate] of this.candidates) {
      if (candidate.session !== session || candidate.triggerTurn !== event.data?.turn) continue
      if (event.data?.reason?.kind === 'completed') candidate.eligible = true
      else this.discardCandidate(agent, true)
    }
  }

  discardCandidate(agent, abort) {
    const candidate = this.candidates.get(agent)
    if (candidate === undefined) return
    this.candidates.delete(agent)
    if (abort && !candidate.controller.signal.aborted) {
      candidate.controller.abort(new Error('deferred conversation summary discarded'))
    }
  }

  /** Keep the inherited native transaction while scoping its meter dependency. */
  compactRegion(start, end, agent, signal) {
    return BasicCompactionEngine.prototype.compactRegion.call(
      this.baseCompactionReceiver(), start, end, agent, signal,
    )
  }

  /** Keep the inherited manual transaction while scoping its range measurement. */
  compactNow(agent, signal, sourceCommandId) {
    return BasicCompactionEngine.prototype.compactNow.call(
      this.baseCompactionReceiver(), agent, signal, sourceCommandId,
    )
  }

  /**
   * Cordis normally rebinds a Service's ctx to its caller. Invoke inherited
   * compaction methods through an untracked receiver so only this operation
   * sees the meter view, while every other service and caller keeps the
   * singleton token meter.
   */
  baseCompactionReceiver() {
    const receiver = Object.create(RpConversationSummaryEngine.prototype)
    for (const key of Object.getOwnPropertyNames(this)) {
      if (key === 'ctx') continue
      const descriptor = Object.getOwnPropertyDescriptor(this, key)
      if (descriptor !== undefined) Object.defineProperty(receiver, key, descriptor)
    }
    Object.defineProperty(receiver, 'ctx', {
      configurable: true,
      value: this.ctx.extend({ tokenMeter: this.compactionMeter }),
    })
    return receiver
  }
}

function parentTarget(agent) {
  const routed = sessionTarget(agent.session)
  if (routed !== undefined) return routed
  const options = agent.options ?? {}
  if (typeof options.provider !== 'string' || options.provider.length === 0
    || typeof options.model !== 'string' || options.model.length === 0) return undefined
  return { provider: options.provider, model: options.model }
}

function sessionTarget(session) {
  const routed = session.requestHeader?.()?.config
  if (typeof routed?.provider === 'string' && routed.provider.length > 0
    && typeof routed?.model === 'string' && routed.model.length > 0) {
    return { provider: routed.provider, model: routed.model }
  }
  return undefined
}

/**
 * Select the oldest compactable prefix while retaining the newest completed
 * Roleplay exchange. Provider overflow happens after the current input has
 * entered the Surface, so token-tail retention alone would otherwise keep that
 * input and shadow the latest model prose.
 */
function overflowRangeBeforeLatestReply(session) {
  const nodes = Array.isArray(session?.surface?.nodes) ? session.surface.nodes : []
  if (nodes.length === 0) return null
  const keepFrom = latestReplyExchangeStart(session)
  const keepFromIndex = keepFrom === undefined ? -1 : nodes.indexOf(keepFrom)
  if (keepFromIndex <= 0) return null

  let endIndex = keepFromIndex - 1
  while (endIndex >= 0 && !toolPairingBalancedAfter(session, nodes[endIndex])) endIndex -= 1
  if (endIndex < 0 || !toolPairingBalancedBefore(session, nodes[0])) return null
  return { start: nodes[0], end: nodes[endIndex] }
}

/** Return the first active message in the exchange owning the latest model reply. */
function latestReplyExchangeStart(session) {
  const transcript = roleplayTranscriptMessages(session)
  let replyIndex = transcript.findLastIndex(message => message?.role === 'assistant')
  if (replyIndex < 0) return undefined
  while (replyIndex > 0 && transcript[replyIndex - 1]?.role === 'user') replyIndex -= 1
  const anchorId = transcript[replyIndex]?.id
  if (typeof anchorId !== 'string' || anchorId.length === 0) return undefined
  return session.surface.nodes.find(seq => surfaceMessage(session.events[seq])?.id === anchorId)
}

function surfaceMessage(event) {
  if (event?.type === 'user/message') return event.data
  if (event?.type === 'assistant/message') return event.data?.message
  return undefined
}

function firstStepBoundary(session) {
  const boundary = openTurnBoundary(session.events)
  return boundary !== undefined
    && !session.events.some(event => event?.type === 'step/start' && event.data?.turn === boundary.turn)
    ? boundary
    : undefined
}

function openTurnBoundary(events) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (event?.type === 'turn/end') return undefined
    if (event?.type === 'turn/start') return { turn: event.data?.turn, seq: event.seq }
  }
  return undefined
}

function validFrozenPrefix(session, frozenSeqs) {
  const nodes = session.surface.nodes
  return nodes.length >= frozenSeqs.length
    && frozenSeqs.every((seq, index) => nodes[index] === seq)
}

function summaryWillShrink(tokenMeter, session, seqs, result) {
  const prices = new Map(tokenMeter.measure(session).nodes.map(node => [node.seq, node.tokens]))
  const shadowed = seqs.reduce((sum, seq) => sum + (prices.get(seq) ?? 0), 0)
  const summary = createUserMessage({
    content: result.summary,
    source: { kind: 'plugin', plugin: 'rp-conversation-summary', form: 'shrink-preflight' },
  })
  return tokenMeter.estimateMessage(summary) + CHECKPOINT_FRAME_RESERVE_TOKENS < shadowed
}

function waitForCompletion(completion, signal) {
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const aborted = () => reject(signal.reason ?? new Error('conversation summary landing aborted'))
    signal.addEventListener('abort', aborted, { once: true })
    completion.then(
      value => { signal.removeEventListener('abort', aborted); resolve(value) },
      error => { signal.removeEventListener('abort', aborted); reject(error) },
    )
  })
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

export default RpConversationSummaryEngine

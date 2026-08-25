import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { createAssistantMessage, createToolResultMessage } from '@deepseek-ai/dsh-llm'
import SessionStore, { Session, SessionId } from '@deepseek-ai/dsh-session'
import {
  createRpMessageActionMetadata,
  decodeRpMessageActionEvent,
  roleplayTranscriptMessages,
} from '../../rp-core/src/conversation.js'
import { foldCommitBackedEntities } from '../../rp-core/src/entity-projection.js'
import {
  dispatchMessageAction,
  locateMessageTarget,
  locateRoleplayTurn,
  recoverPendingRerolls,
} from '../src/index.js'
import {
  assistantActionMatch,
  isRoleplaySession,
  messageActionError,
  messageActionValue,
  updateAssistantActionState,
} from '../src/client-state.js'

test('native edits keep message identity, tool calls and committed effects', async t => {
  const harness = await createHarness(t)
  const first = locateRoleplayTurn(harness.session, 1)
  const commitSeqs = harness.session.surface.nodes.filter(seq => (
    harness.session.events[seq]?.data?.meta?.kind === 'rp-agent/turn-commit'
  ))

  await action(harness, 'edit', userTarget(first), { content: '修改后的选择' })
  const userReplacement = harness.session.events.at(-1)
  assert.equal(userReplacement.type, 'user/message')
  assert.equal(userReplacement.data.id, first.user.data.id)
  assert.equal(decodeRpMessageActionEvent(userReplacement).operation, 'edit')

  await action(harness, 'edit', assistantTarget(first), { content: '改写后的正文' })
  const assistantReplacement = harness.session.events.at(-1)
  assert.equal(assistantReplacement.type, 'assistant/message')
  assert.equal(assistantReplacement.data.message.id, first.assistant.data.message.id)
  assert.equal(decodeRpMessageActionEvent(assistantReplacement).operation, 'edit')
  assert.equal(assistantReplacement.data.message.source.replayState, undefined)
  assert.equal(assistantReplacement.data.message.content.at(-1).name, 'rp_commit_turn')
  assert.equal((await get(harness, assistantTarget(first))).forkSeq, first.commit.seq)
  assert.deepEqual(harness.session.surface.nodes.filter(seq => commitSeqs.includes(seq)), commitSeqs)
  assert.deepEqual(transcriptText(harness.session), [
    '修改后的选择', '改写后的正文', '第二个选择', '第二层正文',
  ])
  assert.equal(activeCommitEntities(harness.session.events).length, 2)
})

for (const scenario of [
  { name: 'image-only', content: [imageBlock('image-only')], editedText: '补充图片说明' },
  { name: 'text-and-image', content: [{ type: 'text', text: '请看这张图' }, imageBlock('mixed')], editedText: '修改后的图片说明' },
]) {
  test(`${scenario.name} user messages support get, edit, delete and branch while reroll stays unavailable`, async t => {
    const harness = await createHarness(t, scenario.name)
    const added = appendTurnContent(harness.session, 3, scenario.content, '图片回复')
    const user = userTarget(added)
    const assistant = assistantTarget(added)

    const before = await get(harness, user)
    assert.equal(before.content, scenario.content[0]?.type === 'text' ? scenario.content[0].text : '')
    assert.equal(before.canEdit, true)
    assert.equal(before.canDelete, true)
    assert.equal(before.canReroll, false)
    assert.equal(before.canSaveAndReroll, false)

    await action(harness, 'edit', user, { content: scenario.editedText })
    const replacement = locateMessageTarget(harness.session, user).current
    assert.equal(replacement.type, 'user/message')
    assert.equal(replacement.data.content[0].type, 'text')
    assert.equal(replacement.data.content[0].text, scenario.editedText)
    assert.deepEqual(
      replacement.data.content.filter(block => block.type === 'image'),
      scenario.content.filter(block => block.type === 'image'),
    )

    const assistantDetail = await get(harness, assistant)
    assert.equal(assistantDetail.canReroll, false)
    await assert.rejects(action(harness, 'reroll', assistant), hasCode('REROLL_UNAVAILABLE'))

    const cut = hostForkCut(harness.session.events, assistantDetail.forkSeq)
    const child = harness.root.sessions.fork(
      harness.session, cut - 1, SessionId(`message-actions-${scenario.name}-branch`),
    )
    const childUser = locateMessageTarget(child, user).current
    assert.equal(childUser.data.content[0].text, scenario.editedText)
    assert.deepEqual(
      childUser.data.content.filter(block => block.type === 'image'),
      scenario.content.filter(block => block.type === 'image'),
    )

    await action(harness, 'delete', user)
    await assert.rejects(get(harness, user), hasCode('MESSAGE_NOT_FOUND'))
    assert.equal(harness.session.deriveMessages().some(message => (
      message.id === added.user.data.id
    )), false)
  })
}

test('deleting a user message replaces the complete active suffix with one empty assistant carrier', async t => {
  const harness = await createHarness(t)
  const first = locateRoleplayTurn(harness.session, 1)
  const selectedIndex = harness.session.surface.nodes.indexOf(first.user.seq)
  const expectedSources = [...harness.session.surface.nodes.slice(selectedIndex)]

  const result = await action(harness, 'delete', userTarget(first))
  const carrier = harness.session.events.at(-1)
  const metadata = decodeRpMessageActionEvent(carrier)

  assert.equal(carrier.type, 'assistant/message')
  assert.equal(carrier.data.message.content.length, 0)
  assert.equal(metadata.operation, 'delete')
  assert.equal(metadata.targets.length, 4)
  assert.deepEqual(carrier.sourceEventSeqs, expectedSources)
  assert.equal(result.removedTargets, 4)
  assert.deepEqual(transcriptText(harness.session), [])
  assert.equal(harness.session.deriveMessages().some(message => message.content.length === 0), false)
  assert.equal(activeCommitEntities(harness.session.events).length, 0)

  const replay = Session.create(SessionId('message-actions-delete-replay'), structuredClone(harness.session.events))
  assert.deepEqual(replay.surface.nodes, harness.session.surface.nodes)
  assert.deepEqual(transcriptText(replay), [])
  assert.equal(activeCommitEntities(replay.events).length, 0)

  const fork = harness.root.sessions.fork(
    harness.session, carrier.seq, SessionId('message-actions-delete-fork'),
  )
  assert.deepEqual(fork.surface.nodes, harness.session.surface.nodes)
  assert.deepEqual(transcriptText(fork), [])
  assert.equal(activeCommitEntities(fork.events).length, 0)
})

test('deleting an assistant keeps its prompt and removes every later message and entity', async t => {
  const harness = await createHarness(t)
  const first = locateRoleplayTurn(harness.session, 1)
  const context = first.events.find(event => event.type === 'user/message'
    && event.data.source?.kind === 'plugin')
  assert.ok(context)

  await action(harness, 'delete', assistantTarget(first))
  const carrier = harness.session.events.at(-1)

  assert.deepEqual(transcriptText(harness.session), ['第一个选择'])
  assert.equal(harness.session.surface.nodes.includes(first.user.seq), true)
  assert.equal(harness.session.surface.nodes.includes(context.seq), false)
  assert.equal(carrier.sourceEventSeqs[0], context.seq)
  assert.equal(activeCommitEntities(harness.session.events).length, 0)
  assert.equal(harness.session.deriveMessages().some(message => message.content.length === 0), false)
  await assert.rejects(get(harness, assistantTarget(first)), hasCode('MESSAGE_NOT_FOUND'))
})

test('reroll retracts the complete turn and durably queues pure user text in the same Agent', async t => {
  const harness = await createHarness(t)
  const second = locateRoleplayTurn(harness.session, 2)

  assert.equal((await get(harness, userTarget(second))).canReroll, false)
  assert.equal((await get(harness, userTarget(second))).canSaveAndReroll, true)
  assert.equal((await get(harness, assistantTarget(second))).canReroll, true)
  assert.equal((await get(harness, assistantTarget(second))).canSaveAndReroll, false)
  await action(harness, 'edit', userTarget(second), { content: '{{user}} 的第二个选择' })

  const result = await action(harness, 'reroll', assistantTarget(second))
  const carrier = harness.session.events.findLast(event => decodeRpMessageActionEvent(event)?.operation === 'reroll')
  const metadata = decodeRpMessageActionEvent(carrier)

  assert.equal(result.sameSession, true)
  assert.equal(carrier.type, 'assistant/message')
  assert.equal(carrier.data.message.content.length, 0)
  assert.equal(metadata.replay.length, 1)
  assert.equal(metadata.replay[0].content[0].text, '{{user}} 的第二个选择')
  assert.deepEqual(harness.followups.map(message => message.content[0].text), ['{{user}} 的第二个选择'])
  assert.deepEqual(transcriptText(harness.session), ['第一个选择', '第一层正文'])
  assert.equal(activeCommitEntities(harness.session.events).length, 1)

  recoverPendingRerolls(harness.agent)
  assert.equal(harness.followups.length, 1)
})

test('save and reroll is available only from the last replayable user message', async t => {
  const harness = await createHarness(t, 'save-and-reroll-user')
  const first = locateRoleplayTurn(harness.session, 1)
  const second = locateRoleplayTurn(harness.session, 2)

  assert.equal((await get(harness, userTarget(first))).canSaveAndReroll, false)
  assert.equal((await get(harness, userTarget(second))).canSaveAndReroll, true)
  assert.equal((await get(harness, assistantTarget(second))).canSaveAndReroll, false)

  await action(harness, 'reroll', userTarget(second), { content: '保存后的第二个选择' })
  const carrier = harness.session.events.findLast(event => decodeRpMessageActionEvent(event)?.operation === 'reroll')

  assert.equal(decodeRpMessageActionEvent(carrier).replay[0].content[0].text, '保存后的第二个选择')
  assert.deepEqual(harness.followups.map(message => message.content[0].text), ['保存后的第二个选择'])
  assert.deepEqual(transcriptText(harness.session), ['第一个选择', '第一层正文'])
})

test('reroll recovery closes the append-to-inbox crash window and never revives a later-deleted replay', async t => {
  const crashed = await createHarness(t, 'crash')
  const selected = assistantTarget(locateRoleplayTurn(crashed.session, 2))
  crashed.agent.followup = () => { throw new Error('simulated crash before inbox append') }
  await assert.rejects(action(crashed, 'reroll', selected), hasCode('MESSAGE_OPERATION_FAILED'))
  const reroll = crashed.session.events.findLast(event => decodeRpMessageActionEvent(event)?.operation === 'reroll')
  assert.ok(reroll)

  const resumed = {
    session: Session.create(
      SessionId('message-actions-crash-resumed'), structuredClone(crashed.session.events),
    ),
    followups: [],
    injections: [],
  }
  resumed.agent = {
    session: resumed.session,
    inject: message => appendInbox(resumed, 'next-step', message, false),
    followup: message => appendInbox(resumed, 'next-turn', message, true),
  }
  recoverPendingRerolls(resumed.agent)
  recoverPendingRerolls(resumed.agent)
  assert.equal(resumed.followups.length, 1)

  const abandoned = await createHarness(t, 'abandoned')
  const target = assistantTarget(locateRoleplayTurn(abandoned.session, 2))
  abandoned.agent.followup = () => { throw new Error('simulated crash before inbox append') }
  await assert.rejects(action(abandoned, 'reroll', target), hasCode('MESSAGE_OPERATION_FAILED'))
  const pending = abandoned.session.events.findLast(event => decodeRpMessageActionEvent(event)?.operation === 'reroll')
  const deleteAction = createRpMessageActionMetadata('delete', [{ kind: 'turn', turn: 2 }])
  const replacement = structuredClone(pending.data)
  replacement.message.source = { ...replacement.message.source, rpMessageAction: deleteAction }
  abandoned.session.append('assistant/message', replacement, {
    surfaceOp: { op: 'replace', start: pending.seq, end: pending.seq },
    sourceEventSeqs: [pending.seq],
  })
  abandoned.agent.followup = message => appendInbox(abandoned, 'next-turn', message, true)
  recoverPendingRerolls(abandoned.agent)
  assert.equal(abandoned.followups.length, 0)
})

test('reroll recovery converges if the process stops while re-arming an already-pending wake', async t => {
  const harness = await createHarness(t, 'rearm-crash')
  const target = assistantTarget(locateRoleplayTurn(harness.session, 2))
  await action(harness, 'reroll', target)
  const carrier = harness.session.events.findLast(event => decodeRpMessageActionEvent(event)?.operation === 'reroll')
  const replay = decodeRpMessageActionEvent(carrier).replay[0]
  const nextTurn = [replay]
  const rearming = {
    session: harness.session,
    inbox: {
      nextTurn,
      nextStep: [],
      remove(messageId) {
        const index = nextTurn.findIndex(message => message.id === messageId)
        if (index < 0) return false
        harness.session.append('agent/inbox/spliced', {
          target: 'next-turn', start: index, removedCount: 1, inserted: [], outcome: 'canceled',
        })
        nextTurn.splice(index, 1)
        return true
      },
    },
    inject() { throw new Error('unexpected next-step replay') },
    followup() { throw new Error('simulated crash after pending wake removal') },
    steer() { throw new Error('unexpected next-step wake') },
  }
  assert.throws(() => recoverPendingRerolls(rearming), /simulated crash after pending wake removal/)

  const recovered = { session: harness.session, followups: [], injections: [] }
  recovered.agent = {
    session: harness.session,
    inject: message => appendInbox(recovered, 'next-step', message, false),
    followup: message => appendInbox(recovered, 'next-turn', message, true),
  }
  recoverPendingRerolls(recovered.agent)
  recoverPendingRerolls(recovered.agent)
  assert.deepEqual(recovered.followups.map(message => message.id), [replay.id])
})

test('a surface-free failed turn is hidden by an empty native assistant carrier', async t => {
  const harness = await createHarness(t, 'failed')
  appendPreStepFailure(harness.session, 3, '上下文失败后重试')
  const failed = { kind: 'turn', turn: 3 }

  assert.equal((await get(harness, failed)).canReroll, true)
  await action(harness, 'delete', failed)
  const carrier = harness.session.events.at(-1)
  const metadata = decodeRpMessageActionEvent(carrier)

  assert.equal(carrier.type, 'assistant/message')
  assert.equal(carrier.surfaceOp, 'append')
  assert.equal(carrier.data.message.content.length, 0)
  assert.deepEqual(metadata.targets, [failed])
  assert.equal(harness.session.deriveMessages().some(message => message.content.length === 0), false)
  await assert.rejects(get(harness, failed), hasCode('MESSAGE_NOT_FOUND'))
})

test('an interrupted native assistant keeps message actions and rerolls in the same Session', async t => {
  const editable = await createHarness(t, 'interrupted-actions')
  const interrupted = appendInterruptedFailure(editable.session, 3, '继续这一段', '生成到这里时被中断')
  const target = assistantTarget(locateRoleplayTurn(editable.session, 3))
  const detail = await get(editable, target)

  assert.equal(interrupted.data.interrupted, true)
  assert.equal(detail.content, '生成到这里时被中断')
  assert.equal(detail.canEdit, true)
  assert.equal(detail.canDelete, true)
  assert.equal(detail.canReroll, true)
  assert.equal(detail.forkSeq, interrupted.seq)

  await action(editable, 'edit', target, { content: '人工补完后的中断回复' })
  const replacement = editable.session.events.at(-1)
  assert.equal(replacement.type, 'assistant/message')
  assert.equal(replacement.data.interrupted, true)
  assert.equal(replacement.data.message.id, interrupted.data.message.id)
  assert.equal((await get(editable, target)).content, '人工补完后的中断回复')
  const fork = editable.root.sessions.fork(
    editable.session,
    hostForkCut(editable.session.events, detail.forkSeq) - 1,
    SessionId('message-actions-interrupted-actions-fork'),
  )
  assert.deepEqual(surfaceText(fork), [
    '第一个选择', '第一层正文', '第二个选择', '第二层正文',
    '继续这一段', '人工补完后的中断回复',
  ])
  assert.deepEqual(transcriptText(fork), [
    '第一个选择', '第一层正文', '第二个选择', '第二层正文', '继续这一段',
  ])

  await action(editable, 'delete', target)
  assert.deepEqual(transcriptText(editable.session), [
    '第一个选择', '第一层正文', '第二个选择', '第二层正文', '继续这一段',
  ])
  await assert.rejects(get(editable, target), hasCode('MESSAGE_NOT_FOUND'))

  const rerolled = await createHarness(t, 'interrupted-reroll')
  appendInterruptedFailure(rerolled.session, 3, '重新生成这一段', '另一个被中断的片段')
  const rerollTarget = assistantTarget(locateRoleplayTurn(rerolled.session, 3))
  const result = await action(rerolled, 'reroll', rerollTarget)
  const carrier = rerolled.session.events.findLast(event => decodeRpMessageActionEvent(event)?.operation === 'reroll')

  assert.equal(result.sameSession, true)
  assert.deepEqual(decodeRpMessageActionEvent(carrier).targets.map(target => target.kind), [
    'message', 'message', 'turn',
  ])
  assert.deepEqual(rerolled.followups.map(message => message.content[0].text), ['重新生成这一段'])
  assert.deepEqual(transcriptText(rerolled.session), [
    '第一个选择', '第一层正文', '第二个选择', '第二层正文',
  ])
})

test('shared asset writes disable reroll but remain durable after suffix deletion', async t => {
  const harness = await createHarness(t, 'asset')
  const asset = appendAssetTurn(harness.session, 3)
  const selected = assistantTarget(locateRoleplayTurn(harness.session, 3))

  assert.equal((await get(harness, selected)).canReroll, false)
  await assert.rejects(action(harness, 'reroll', selected), hasCode('REROLL_UNAVAILABLE'))
  await action(harness, 'delete', selected)
  assert.equal(harness.session.events.includes(asset), true)
  assert.equal(asset.data.meta.kind, 'rp-agent/asset-mutation')
})

test('compaction checkpoints do not impersonate the messages they replaced', async t => {
  const harness = await createHarness(t, 'compacted')
  const first = locateRoleplayTurn(harness.session, 1)
  const second = locateRoleplayTurn(harness.session, 2)
  const start = harness.session.surface.nodes.indexOf(first.user.seq)
  const end = harness.session.surface.nodes.indexOf(first.commit.seq)
  const shadowed = harness.session.surface.nodes.slice(start, end + 1)
  harness.session.append('user/message', {
    role: 'user', id: 'compaction-checkpoint',
    content: [{ type: 'text', text: '较早对话摘要' }],
    source: { kind: 'plugin', plugin: 'compact', compactionId: 'compact-1' },
  }, {
    surfaceOp: { op: 'replace', start: shadowed[0], end: shadowed.at(-1) },
    sourceEventSeqs: shadowed,
  })

  await assert.rejects(get(harness, userTarget(first)), hasCode('MESSAGE_NOT_FOUND'))
  await assert.rejects(get(harness, assistantTarget(first)), hasCode('MESSAGE_NOT_FOUND'))
  assert.equal((await get(harness, assistantTarget(second))).content, '第二层正文')
  assert.deepEqual(transcriptText(harness.session), ['第二个选择', '第二层正文'])
})

test('a tail edit keeps the turn anchor while the Host fork cut includes its trailing carrier', async t => {
  const harness = await createHarness(t, 'tail-edit-fork')
  const second = locateRoleplayTurn(harness.session, 2)
  await action(harness, 'edit', assistantTarget(second), { content: '分支中的编辑正文' })
  const detail = await get(harness, assistantTarget(second))
  assert.equal(detail.forkSeq, second.commit.seq)
  assert.equal(detail.forkEditRequired, false)

  const cut = hostForkCut(harness.session.events, detail.forkSeq)
  const fork = harness.root.sessions.fork(
    harness.session, cut - 1, SessionId('message-actions-tail-edit-fork-child'),
  )
  assert.deepEqual(transcriptText(fork), [
    '第一个选择', '第一层正文', '第二个选择', '分支中的编辑正文',
  ])
  assert.equal(activeCommitEntities(fork.events).length, 2)
})

test('a historical edit is replayed into the native fork child without inheriting later turns', async t => {
  const harness = await createHarness(t, 'historical-edit-fork')
  const first = locateRoleplayTurn(harness.session, 1)
  const target = assistantTarget(first)
  await action(harness, 'edit', target, { content: '历史消息的最终编辑正文' })
  const detail = await get(harness, target)

  assert.equal(detail.forkSeq, first.commit.seq)
  assert.equal(detail.forkEditRequired, true)
  const cut = hostForkCut(harness.session.events, detail.forkSeq)
  const childId = SessionId('message-actions-historical-edit-fork-child')
  const child = harness.root.sessions.create(childId, {
    seed: harness.session.events.slice(0, cut),
    meta: {
      agentPreset: 'roleplay',
      parentSession: harness.session.id,
      seedLength: cut,
    },
  })
  assert.deepEqual(transcriptText(child), ['第一个选择', '第一层正文'])

  const childAgent = {
    id: childId,
    status: 'idle',
    options: { provider: 'mock', model: 'mock' },
    session: child,
    whenIdle() { return Promise.resolve() },
    runMaintenance(task) { return task(new AbortController().signal) },
  }
  await dispatchMessageAction({ agents: { get: id => id === childId ? childAgent : undefined } }, 'edit', {
    sessionId: childId,
    target,
    content: detail.content,
  }, defaultLimits())

  assert.deepEqual(transcriptText(child), ['第一个选择', '历史消息的最终编辑正文'])
  assert.equal(child.events.some(event => event.type === 'turn/start' && event.data.turn === 2), false)
  assert.equal(activeCommitEntities(child.events).length, 1)
  assert.deepEqual(transcriptText(harness.session), [
    '第一个选择', '历史消息的最终编辑正文', '第二个选择', '第二层正文',
  ])
})

test('a historical opening edit forks from the opening turn and requests replay in the child', async t => {
  const root = new Context()
  await root.plugin(SessionStore)
  t.after(() => root.fiber.dispose())
  const session = root.sessions.create(SessionId('message-actions-opening-fork'), {
    meta: { agentPreset: 'roleplay' },
  })
  session.append('turn/start', { turn: 1 })
  session.append('step/start', { turn: 1, step: 1 })
  const opening = session.append('assistant/message', {
    turn: 1,
    step: 1,
    message: createAssistantMessage({
      content: [{ type: 'text', text: '原始开场白' }],
      source: { provider: 'rp-session', model: 'selected-opening' },
    }),
  }, { surfaceOp: 'append', sourceEventSeqs: [] })
  session.append('step/end', { turn: 1, step: 1 })
  session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
  appendTurn(session, 2, '开场后的输入', '开场后的回复')

  const target = {
    kind: 'message', role: 'assistant', messageId: opening.data.message.id,
  }
  const replacement = structuredClone(opening.data)
  replacement.message.content = [{ type: 'text', text: '历史编辑后的开场白' }]
  replacement.message.source = {
    ...replacement.message.source,
    rpMessageAction: createRpMessageActionMetadata('edit', [target]),
  }
  session.append('assistant/message', replacement, {
    surfaceOp: { op: 'replace', start: opening.seq, end: opening.seq },
    sourceEventSeqs: [opening.seq],
  })

  const agent = { id: session.id, session, status: 'idle' }
  const detail = await dispatchMessageAction({
    agents: { get: () => agent },
    agentPresets: {
      serviceFor: () => ({ get: () => ({ scene: { openingText: '历史编辑后的开场白' } }) }),
    },
  }, 'get', { sessionId: session.id, target }, defaultLimits())
  assert.equal(detail.content, '历史编辑后的开场白')
  assert.equal(detail.forkSeq, opening.seq)
  assert.equal(detail.forkEditRequired, true)
})

test('rejects stale, busy and oversized operations without mutation', async t => {
  const harness = await createHarness(t)
  const eventCount = harness.session.events.length
  await assert.rejects(action(harness, 'edit', userTarget(locateRoleplayTurn(harness.session, 1)), {
    content: '123456',
  }, { maxNarrativeCharacters: 10, maxUserMessageCharacters: 5 }), hasCode('LIMIT_EXCEEDED'))
  await assert.rejects(action(harness, 'delete', {
    kind: 'message', role: 'user', messageId: 'missing',
  }), hasCode('MESSAGE_NOT_FOUND'))
  harness.agent.status = 'running'
  await assert.rejects(action(harness, 'delete', userTarget(locateRoleplayTurn(harness.session, 1))), hasCode('SESSION_RUNNING'))
  assert.equal(harness.session.events.length, eventCount)
})

test('read-only action metadata joins the active turn before resolving its message', async t => {
  const harness = await createHarness(t, 'get-active-turn')
  const turn = 3
  harness.session.append('turn/start', { turn })
  harness.session.append('step/start', { turn, step: 1 })
  const user = harness.session.append('user/message', {
    role: 'user', id: 'user-active-turn',
    content: [{ type: 'text', text: '正在生成的输入' }], source: { kind: 'user' },
  }, { surfaceOp: 'append' })
  harness.agent.status = 'running'
  let joined = 0
  harness.agent.whenIdle = async () => {
    joined++
    harness.session.append('assistant/message', {
      turn, step: 1,
      message: createAssistantMessage({
        content: [{ type: 'text', text: '收尾后的回复' }],
        source: { provider: 'mock', model: 'mock' },
      }),
    }, { surfaceOp: 'append' })
    harness.session.append('step/end', { turn, step: 1 })
    harness.session.append('turn/end', { turn, reason: { kind: 'completed' } })
    harness.agent.status = 'idle'
  }

  const detail = await get(harness, {
    kind: 'message', role: 'user', messageId: user.data.id,
  })

  assert.equal(joined, 1)
  assert.equal(detail.content, '正在生成的输入')
  assert.equal(detail.turn, turn)
})

test('a write action joins the closed-turn driver before claiming maintenance', async t => {
  const harness = await createHarness(t, 'write-closed-turn-tail')
  const target = userTarget(locateRoleplayTurn(harness.session, 2))
  harness.agent.status = 'running'
  let joined = 0
  harness.agent.whenIdle = async () => {
    joined++
    harness.agent.status = 'idle'
  }

  const result = await dispatchMessageAction(harness.ctx, 'delete', {
    sessionId: harness.session.id,
    target,
  }, defaultLimits())

  assert.equal(joined, 1)
  assert.equal(result.target.messageId, target.messageId)
  assert.equal(result.removedTargets, 2)
  assert.equal(harness.session.events.at(-1).data.message.content.length, 0)
})

test('a write action never waits through an open generating turn', async t => {
  const harness = await createHarness(t, 'write-open-turn-tail')
  const target = userTarget(locateRoleplayTurn(harness.session, 2))
  harness.session.append('turn/start', { turn: 3 })
  harness.agent.status = 'running'
  let joined = 0
  harness.agent.whenIdle = async () => { joined++ }

  await assert.rejects(dispatchMessageAction(harness.ctx, 'delete', {
    sessionId: harness.session.id,
    target,
  }, defaultLimits()), hasCode('SESSION_RUNNING'))
  assert.equal(joined, 0)
})

test('client error mapping preserves stable domain outcomes', () => {
  assert.equal(messageActionError({ code: 'REROLL_UNAVAILABLE' }), '只能重新生成当前对话中最后一条可恢复的消息。')
  assert.throws(() => messageActionValue({ ok: true, value: { ok: false, error: { code: 'SESSION_RUNNING' } } }), hasCode('SESSION_RUNNING'))
  assert.deepEqual(messageActionValue({ ok: true, value: { ok: true, value: { done: true } } }), { done: true })
})

test('client actions belong to Roleplay root sessions, never inherited subagent transcripts', () => {
  assert.equal(isRoleplaySession({
    byId: { root: { agentPreset: 'roleplay' } },
  }, 'root'), true)
  assert.equal(isRoleplaySession({
    byId: { writer: { agentPreset: 'roleplay', origin: 'subagent', parentId: 'root' } },
  }, 'writer'), false)
  assert.equal(isRoleplaySession({
    byId: { ordinary: { agentPreset: 'default' } },
  }, 'ordinary'), false)
})

test('assistant action folding keeps the original row anchor across native carriers', async t => {
  const harness = await createHarness(t, 'client-fold')
  const target = assistantTarget(locateRoleplayTurn(harness.session, 2))
  const originalState = { seq: 10, time: 20, target: { current: true }, text: '第二层正文' }

  await action(harness, 'edit', target, { content: '编辑后的第二层正文' })
  const edit = harness.session.events.at(-1)
  assert.deepEqual(assistantActionMatch(edit), { id: target.messageId, role: 'update' })
  assert.deepEqual(updateAssistantActionState(originalState, edit), {
    ...originalState, text: '编辑后的第二层正文', edited: true, deleted: false,
  })

  await action(harness, 'delete', target)
  const deletion = harness.session.events.at(-1)
  assert.deepEqual(updateAssistantActionState(originalState, deletion), {
    ...originalState, deleted: true,
  })
})

async function createHarness(t, suffix = '') {
  const root = new Context()
  await root.plugin(SessionStore)
  t.after(() => root.fiber.dispose())
  const id = suffix === '' ? 'message-actions' : `message-actions-${suffix}`
  const session = root.sessions.create(SessionId(id), {
    meta: { agentPreset: 'roleplay', cwd: '/workspace' },
  })
  appendTurn(session, 1, '第一个选择', '第一层正文')
  appendTurn(session, 2, '第二个选择', '第二层正文')
  const harness = { root, session, followups: [], injections: [] }
  const agent = {
    id,
    status: 'idle',
    options: { provider: 'mock', model: 'mock' },
    session,
    inject(message) { appendInbox(harness, 'next-step', message, false) },
    followup(message) { appendInbox(harness, 'next-turn', message, true) },
    whenIdle() { return Promise.resolve() },
    runMaintenance(task) { return task(new AbortController().signal) },
  }
  const ctx = {
    agents: { get: sessionId => sessionId === id ? agent : undefined },
    typert: { lookups: { get: () => ({ resolve: async () => agent }) } },
    agentPresets: { serviceFor: () => undefined },
  }
  return Object.assign(harness, { agent, ctx })
}

function appendInbox(harness, target, message, wakeup) {
  const start = harness.session.events.reduce((length, event) => {
    if (event.type !== 'agent/inbox/spliced' || event.data?.target !== target) return length
    return length - (event.data.removedCount ?? 0) + (event.data.inserted?.length ?? 0)
  }, 0)
  harness.session.append('agent/inbox/spliced', { target, start, inserted: [message] })
  ;(wakeup ? harness.followups : harness.injections).push(message)
}

function appendTurn(session, turn, userText, narrative) {
  return appendTurnContent(session, turn, [{ type: 'text', text: userText }], narrative)
}

function appendTurnContent(session, turn, userContent, narrative) {
  session.append('turn/start', { turn })
  session.append('step/start', { turn, step: 1 })
  const user = session.append('user/message', {
    role: 'user', id: `user-${turn}`,
    content: structuredClone(userContent), source: { kind: 'user' },
  }, { surfaceOp: 'append' })
  session.append('user/message', {
    role: 'user', id: `context-${turn}`,
    content: [{ type: 'text', text: `第 ${turn} 轮上下文` }],
    source: { kind: 'plugin', plugin: 'rp-core' },
  }, { surfaceOp: 'append' })
  const callId = `rp-commit-${turn}`
  const assistant = session.append('assistant/message', {
    turn, step: 1,
    message: createAssistantMessage({
      content: [
        { type: 'text', text: narrative },
        { type: 'tool-call', id: callId, name: 'rp_commit_turn', arguments: '{}' },
      ],
      source: { provider: 'mock', model: 'mock', replayState: { stale: true } },
    }),
  }, { surfaceOp: 'append' })
  const call = session.append('tool/call', { turn, step: 1, callId, name: 'rp_commit_turn', arguments: '{}' })
  const commit = session.append('tool/result', {
    turn, step: 1,
    message: createToolResultMessage({
      callId, content: [{ type: 'text', text: 'Roleplay turn committed.' }], isError: false,
    }),
    meta: {
      kind: 'rp-agent/turn-commit', version: 2, runId: `run-${turn}`, turn,
      assistant: { seq: assistant.seq, messageId: assistant.data.message.id },
      effects: [{ kind: 'test.effect', target: 'turn', payload: { result: { turn } } }],
    },
  }, { surfaceOp: 'append', sourceEventSeqs: [call.seq] })
  session.append('step/end', { turn, step: 1 })
  session.append('turn/end', { turn, reason: { kind: 'completed' } })
  return { user, assistant, commit }
}

function imageBlock(label) {
  const digest = label === 'mixed' ? `${'a'.repeat(63)}b` : 'a'.repeat(64)
  return {
    type: 'image',
    attachment: {
      attachmentId: `sha256:${digest}`,
      mediaType: 'image/png',
      bytes: 4,
      width: 1,
      height: 1,
      name: `${label}.png`,
    },
  }
}

function appendPreStepFailure(session, turn, text) {
  const message = {
    role: 'user', id: `claimed-${turn}`,
    content: [{ type: 'text', text }], source: { kind: 'user' },
  }
  session.append('agent/inbox/spliced', { target: 'next-turn', start: 0, inserted: [message] })
  session.append('turn/start', { turn })
  session.append('agent/inbox/spliced', { target: 'next-turn', start: 0, removedCount: 1, inserted: [] })
  session.append('turn/end', { turn, reason: { kind: 'error', error: { message: 'context failed' } } })
}

function appendInterruptedFailure(session, turn, userText, partialText) {
  session.append('turn/start', { turn })
  session.append('step/start', { turn, step: 1 })
  session.append('user/message', {
    role: 'user', id: `user-${turn}`,
    content: [{ type: 'text', text: userText }], source: { kind: 'user' },
  }, { surfaceOp: 'append' })
  const chunks = [
    session.append('assistant/chunk', {
      turn, step: 1, chunk: { type: 'block-start', index: 0, blockType: 'text' },
    }),
    session.append('assistant/chunk', {
      turn, step: 1, chunk: { type: 'text-delta', index: 0, text: partialText },
    }),
    session.append('assistant/chunk', {
      turn, step: 1, chunk: { type: 'block-end', index: 0, block: { type: 'text', text: partialText } },
    }),
  ]
  const assistant = session.append('assistant/message', {
    turn,
    step: 1,
    interrupted: true,
    message: createAssistantMessage({
      content: [{ type: 'text', text: partialText }],
      source: { provider: 'mock', model: 'mock' },
    }),
  }, { surfaceOp: 'append', sourceEventSeqs: chunks.map(event => event.seq) })
  session.append('step/end', { turn, step: 1 })
  session.append('turn/end', { turn, reason: { kind: 'aborted', reason: { kind: 'user' } } })
  return assistant
}

function appendAssetTurn(session, turn) {
  session.append('turn/start', { turn })
  session.append('step/start', { turn, step: 1 })
  session.append('user/message', {
    role: 'user', id: `user-${turn}`,
    content: [{ type: 'text', text: '保存资料并继续' }], source: { kind: 'user' },
  }, { surfaceOp: 'append' })
  const assetCall = session.append('tool/call', { turn, step: 1, callId: `asset-${turn}`, name: 'rp_asset', arguments: '{}' })
  const asset = session.append('tool/result', {
    turn, step: 1,
    message: createToolResultMessage({ callId: `asset-${turn}`, content: [{ type: 'text', text: '{}' }], isError: false }),
    meta: { kind: 'rp-agent/asset-mutation', version: 1, turn },
  }, { surfaceOp: 'append', sourceEventSeqs: [assetCall.seq] })
  const callId = `rp-commit-${turn}`
  const assistant = session.append('assistant/message', {
    turn, step: 1,
    message: createAssistantMessage({
      content: [{ type: 'text', text: '资料已保存。' }, { type: 'tool-call', id: callId, name: 'rp_commit_turn', arguments: '{}' }],
      source: { provider: 'mock', model: 'mock' },
    }),
  }, { surfaceOp: 'append' })
  const call = session.append('tool/call', { turn, step: 1, callId, name: 'rp_commit_turn', arguments: '{}' })
  session.append('tool/result', {
    turn, step: 1,
    message: createToolResultMessage({ callId, content: [{ type: 'text', text: 'Roleplay turn committed.' }], isError: false }),
    meta: { kind: 'rp-agent/turn-commit', version: 2, runId: `run-${turn}`, turn, assistant: { seq: assistant.seq, messageId: assistant.data.message.id }, effects: [] },
  }, { surfaceOp: 'append', sourceEventSeqs: [call.seq] })
  session.append('step/end', { turn, step: 1 })
  session.append('turn/end', { turn, reason: { kind: 'completed' } })
  return asset
}

function activeCommitEntities(events) {
  return events.reduce((entities, event) => foldCommitBackedEntities(entities, event, {
    select: commit => commit.effects,
  }).entities, [])
}

function transcriptText(session) {
  return roleplayTranscriptMessages(session).flatMap(message => message.content
    .filter(block => block.type === 'text')
    .map(block => block.text))
}

function surfaceText(session) {
  return session.surface.nodes.flatMap(seq => {
    const event = session.events[seq]
    if (event?.type === 'user/message' && event.data?.source?.kind === 'user') {
      return event.data.content.filter(block => block.type === 'text').map(block => block.text)
    }
    if (event?.type === 'assistant/message' && event.data?.message?.source?.kind === 'model') {
      return event.data.message.content.filter(block => block.type === 'text').map(block => block.text)
    }
    return []
  })
}

function hostForkCut(events, atSeq) {
  const boundary = events.find(event => event.type === 'turn/end' && event.seq >= atSeq)
  assert.ok(boundary)
  let cut = boundary.seq + 1
  while (cut < events.length && events[cut].type !== 'turn/start') cut++
  return cut
}

function userTarget(turn) {
  return { kind: 'message', role: 'user', messageId: turn.user.data.id }
}

function assistantTarget(turn) {
  return { kind: 'message', role: 'assistant', messageId: turn.assistant.data.message.id }
}

function action(harness, endpoint, target, extra = {}, limits = defaultLimits()) {
  return dispatchMessageAction(harness.ctx, endpoint, {
    sessionId: harness.agent.id, target, ...extra,
  }, limits)
}

function get(harness, target) { return action(harness, 'get', target) }
function defaultLimits() { return { maxNarrativeCharacters: 1000, maxUserMessageCharacters: 1000 } }
function hasCode(code) { return error => error?.code === code }

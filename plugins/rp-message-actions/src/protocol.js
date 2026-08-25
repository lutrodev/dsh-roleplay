import {
  decodeRpMessageActionEvent,
  deletedRpMessageActionTargets,
  rpMessageActionTargetKey,
} from 'dsh-roleplay-rp-core/conversation'

export {
  decodeRpMessageActionEvent,
  deletedRpMessageActionTargets,
  rpMessageActionTargetKey,
}

/** Return failed turns hidden by native delete or reroll carriers. */
export function deletedFailedAssistantTurns(events) {
  const deleted = new Set()
  for (const event of events ?? []) {
    const action = decodeRpMessageActionEvent(event)
    if (action?.operation !== 'delete' && action?.operation !== 'reroll') continue
    for (const target of action.targets) {
      if (target.kind === 'turn') deleted.add(target.turn)
    }
  }
  return deleted
}

/** Whether a native action carrier removes one stable message target. */
export function messageActionRemovesTarget(event, target) {
  const action = decodeRpMessageActionEvent(event)
  if (action?.operation !== 'delete' && action?.operation !== 'reroll') return false
  const key = rpMessageActionTargetKey(target)
  return action.targets.some(candidate => rpMessageActionTargetKey(candidate) === key)
}

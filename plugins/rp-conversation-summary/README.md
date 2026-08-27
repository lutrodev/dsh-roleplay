# Roleplay Conversation Summary

`dsh-roleplay-rp-conversation-summary` replaces the generic coding-oriented
compaction backend inside the Roleplay preset. It keeps DSH's native append-only
compaction transaction, checkpoint projection, UI, state-ownership migration,
manual `/compact`, overflow recovery, fork and rollback behavior.

The compaction engine wraps the shared token meter only inside its own Cordis
context. Normal histories still use the native meter unchanged. A history with
an idle Roleplay assistant replacement created by edit, delete, or reroll is
replayed through a detached meter-only view of those validated action carriers.
The wrapper never rewrites the append-only Session log and does not relax
failures for unrelated malformed assistant events. This keeps manual and
automatic compaction available for existing conversations that were edited or
regenerated before a checkpoint.

Automatic pressure uses one 80% threshold. At the first step of turn N the
plugin snapshots the complete active surface before the new user message is
appended, starts a Roleplay-specific summary call, and immediately lets the turn
continue. The candidate becomes eligible only after turn N completes. At turn
N+1's first step it is revalidated and committed through native
`compactRegion`; Writer therefore sees full history in N and “会话总结 + turn N
onward” in N+1. Failed, cancelled, truncated, oversized, stale, or non-shrinking
candidates never create a checkpoint.

The `./bridge` entry belongs in the same Cordis realm as `rp-core`. It registers
the required but movable factual `conversation-summary` Slot and reads only
checkpoint ids that are active on the current Session surface, correlating each
id to its own `compaction/summary` event. The Slot can be reordered or moved into
another active group, but cannot be parked in the idle area. With no active
checkpoint it returns `undefined`, so the Writer prompt gains no label, blank
line, or placeholder. When present, its source text starts with a short English
context note that identifies it as compressed earlier dialogue and gives newer
Conversation History precedence.

## Recovery and message actions

Compaction never deletes original log events or the human transcript. It only
replaces their active model surface. The checkpoint owns every replaced surface
event and any state entities migrated from those events, so it must not receive
ordinary delete, edit, or reroll actions and must not impersonate an RP message.
Already compacted messages remain absent from message-action lookup and return
`MESSAGE_NOT_FOUND`.

Do not delete a `compaction/summary` event to attempt decompression. Exact
recovery is explicit: fork or roll back at a closed turn before the checkpoint
to restore the original floors and state in the new branch; fork after it to
retain the checkpoint, summary, and migrated state. The original Session stays
compacted.

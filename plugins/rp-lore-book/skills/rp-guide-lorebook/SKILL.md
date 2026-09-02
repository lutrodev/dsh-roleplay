---
name: rp-guide-lorebook
description: Apply, inspect, create, edit, or bind Roleplay world books when continuity or an explicit user request requires it.
---

# Roleplay World Book Guide

Use only the world-book entries activated for the current turn.

## Read the three layers

- Use `rp.lore.world-description` for setting facts, locations, history, factions, and background conditions.
- Use `rp.lore.character-descriptions` for character knowledge, relationships, experiences, and scene-relevant acting guidance.
- Use `rp.lore.important-rules` as constraints that must shape the upcoming response.

## Resolve and write

- Prefer entries relevant to the current message and established scene; do not invent inactive entries.
- Reconcile lore with later committed story facts. If a genuine contradiction remains, preserve continuity and avoid silently rewriting history.
- Keep important rules close to execution while still respecting higher-priority instructions and user agency.
- Do not import, create, edit, reorder, or bind world books unless the user explicitly asks.
- Never expose activation diagnostics or raw context wrappers in the narrative.

## Persist explicit changes

- Discuss proposed lore without writing unless the user clearly asks to save or apply it.
- Use `rp_asset_read` with `kind: "lorebook"` and `list`/`get` to inspect. Use the Agent-only `rp_asset` with `create`, or `update` plus the exact `expectedRevision`, to persist changes.
- For `create`, pass `value: { name, entries }`. Every entry requires a stable string `id`, a non-empty human-readable string `name`, non-empty string `content`, and an explicit `level`: `worldDescription` for setting facts, `roleplayGuide` for character or relationship guidance, or `importantRules` for execution constraints. The display `name` and stable `id` serve different purposes: never omit `name` or substitute the `id` for it.
- Prefer the smallest valid entry, such as `{ id: "harbor", name: "雾港", level: "worldDescription", content: "港口终年有雾。", constant: true }`. Omit optional placement and tuning fields unless the requested behavior needs them.
- Every enabled entry also needs an ordinary activation route: set `constant: true` to use it every turn, or provide a non-empty `keys: string[]` so a matching primary keyword activates it. `secondaryKeys: string[]` is optional; when present, the entry also needs a primary key, and at least one primary and one secondary key must both match. Secondary keys never activate an entry by themselves. A disabled entry may omit an activation route.
- Use only canonical optional entry fields returned by `get`: `semanticKey`, `keys`, `secondaryKeys`, `stateCondition`, `enabled`, `constant`, `caseSensitive`, `recursive`, `order`, `position`, `insertionPosition`, `depth`, and `probability`. `position` is a non-negative integer; `probability` is a number from `0` to `1`; `insertionPosition` is one of `before_char`, `after_char`, `before_examples`, `after_examples`, `in_chat`, `before_an`, or `after_an`. Do not invent aliases such as `always`, `keysecondary`, or `instructions`; unknown or invalid native fields are rejected.
- Use native `stateCondition` only when the current capability catalog exposes both `rp_state_read` and `rp-guide-state`. Load that guide before designing or diagnosing the expression. State values are Session-owned; `stateCondition` only references an existing variable and never creates, configures, or binds it. Address a variable by the exact pair of namespace ID and full JSON Pointer—for example, `state("story", "/plot/progress") >= 50`; never use a leaf name such as `progress` alone. A State condition is an additional AND gate, not an activation route: a variable-only entry still needs `constant: true`, while a keyword entry still needs a matching primary key. When the variable capability is not enabled, do not create or change State conditions; existing conditional entries stay inactive until it is enabled again.
- For `update`, first use `rp_asset_read` with `get`, then pass `value: { name?, entries? }`. When `entries` is present it replaces the complete ordered entry array, so preserve every entry the user did not ask to remove and every canonical field on those entries, including the non-empty human-readable `name`, explicit `level`, activation fields, and stable `id`.
- Bind through `changes.lorebookIds`; the array is ordered. Creating with `bindToCurrentSession: true` appends the book without duplicates.
- On an input-validation error, preserve required and already-correct fields while correcting the reported field. If a mutation reports `INVALID_TOOL_OUTPUT` or `returned invalid output`, do not retry it blindly: first inspect the exact-name library result and current bindings because persistence may already have succeeded.
- If a requested write or bind otherwise fails, stop before story continuation and explain the recoverable next step.

## Import an explicit local file

- Only call `import_lore_book` when the user explicitly asks to import a local JSON world book and supplies or identifies its path.
- Pass the path as `{ "path": "..." }`. Import creates a shared world book but does not apply it to this conversation.
- If the user also asked to use it here, first read the current ordered world-book bindings, then bind the complete desired `lorebookIds` array with the returned id added once. Report import and binding as separate outcomes.

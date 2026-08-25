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
- For `create`, pass `value: { name, entries }`. Each entry needs a stable string `id`, string `content`, and an ordinary activation route: set `constant: true` to use it every turn, or provide a non-empty `keys: string[]` so a matching primary keyword activates it. `secondaryKeys: string[]` is optional; when present, at least one primary key and one secondary key must both match. Secondary keys never activate an entry by themselves.
- Use native `stateCondition` only when the current capability catalog exposes both `rp_state_read` and `rp-guide-state`. Load that guide before designing or diagnosing the expression, and use exact namespace IDs and JSON Pointers. A State condition is an additional AND gate, not an activation route: a variable-only entry still needs `constant: true`, while a keyword entry still needs a matching primary key. When the variable capability is not enabled, do not create or change State conditions; existing conditional entries stay inactive until it is enabled again.
- For `update`, first use `rp_asset_read` with `get`, then pass `value: { name?, entries? }`. When `entries` is present it replaces the complete ordered entry array, so preserve every entry the user did not ask to remove.
- Bind through `changes.lorebookIds`; the array is ordered. Creating with `bindToCurrentSession: true` appends the book without duplicates.
- If a requested write or bind fails, stop before story continuation and explain the recoverable next step.

## Import an explicit local file

- Only call `import_lore_book` when the user explicitly asks to import a local JSON world book and supplies or identifies its path.
- Pass the path as `{ "path": "..." }`. Import creates a shared world book but does not apply it to this conversation.
- If the user also asked to use it here, first read the current ordered world-book bindings, then bind the complete desired `lorebookIds` array with the returned id added once. Report import and binding as separate outcomes.

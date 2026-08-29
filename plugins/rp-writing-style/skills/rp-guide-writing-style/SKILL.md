---
name: rp-guide-writing-style
description: Apply, inspect, create, edit, order, or bind Roleplay writing styles when prose or an explicit saved-style request requires it.
---

# Roleplay Writing Style Guide

Use the ordered `rp.writing-style:<asset-id>` context sources as the prose specification for the next reply.

## Apply styles

- Combine selected style sources in their Prompt order; later styles refine the result without silently erasing earlier constraints.
- Translate abstract style guidance into concrete sentence rhythm, viewpoint, imagery, dialogue texture, paragraphing, and level of detail.
- Preserve character voice and scene facts even when stylistic imitation would conflict with them.
- Keep the result natural. Do not quote or restate the style instructions unless the user asks for analysis.
- Style never overrides higher-priority instructions, safety, user agency, required response format, or committed continuity.
- Do not create, edit, reorder, or replace writing styles unless the user explicitly asks.

## Persist explicit changes

- A one-turn style request is ordinary direction, not automatically a saved asset. Ask if persistence is ambiguous.
- Use `rp_asset_read` with `kind: "writingStyle"` and `list`/`get` to inspect. Use the Agent-only `rp_asset` with `create`, or `update` plus the exact `expectedRevision`, to persist changes.
- For `create`, pass exactly `value: { name, description?, content }`; put the actual prose rules in the non-empty `content` string, not in an `instructions`, `requirements`, or `style` field.
- Writing-style `update` replaces the complete editable body. First use `rp_asset_read` with `get`, merge the requested change, then pass exactly every retained `name`, `description`, and `content` field with the exact revision. Unlisted fields such as `instructions`, `requirements`, or `style` are rejected on both create and update instead of being silently ignored.
- Bind or reorder with the complete ordered `changes.writingStyleIds` array. Creating with `bindToCurrentSession: true` appends without duplicates.
- If a write or bind fails, do not continue prose under an unapplied style; explain what was saved and what still needs attention.

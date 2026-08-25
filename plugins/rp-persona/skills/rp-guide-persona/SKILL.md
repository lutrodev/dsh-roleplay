---
name: rp-guide-persona
description: Apply, inspect, create, edit, or bind the user's Roleplay persona while preserving agency and explicit persistence intent.
---

# Roleplay User Persona Guide

Use `rp.persona` to understand who the user is playing or how they enter the scene.

## Preserve user ownership

- Use the persona's identity, background, capabilities, relationships, preferences, and stated boundaries as live reference material.
- Never invent the user's consequential choices, consent, inner feelings, private knowledge, or completed dialogue.
- Leave meaningful decisions and reactions open for the user unless they explicitly delegated control.
- Distinguish the user's persona from the current character card and from the narrator.
- Do not create, edit, or replace a persona unless the user explicitly asks.

## Persist explicit changes

- Treat brainstorming as discussion. Ask before writing if “make me like this” could mean either temporary direction or a saved persona.
- Use `rp_asset_read` with `kind: "persona"` and `list`/`get` to inspect. Use the Agent-only `rp_asset` with `create` to save or `update` with the exact `expectedRevision` to edit.
- For `create`, pass `value: { name, description?, personality?, scenario?, firstMessage?, tags?: string[] }`.
- Persona `update` replaces the complete editable body. First use `rp_asset_read` with `get`, merge only the requested change, then pass all retained fields in `value` with the exact revision; omitted optional fields are cleared.
- Bind through `changes.personaId`, or use `bindToCurrentSession: true` during creation, only when the user asks to apply it here.
- If saving succeeds but applying fails, report the saved persona id and do not pretend the conversation uses it.

Write other characters' responses and the world's consequences around the user's declared action without taking the next decisive action for them.

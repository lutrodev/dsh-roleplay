# `rp.state` v2 reference

## Projection

Each Session projection has `protocolVersion: 2`, a projection `revision`, and a `namespaces` map. Each namespace contains:

- `revision`: namespace CAS version;
- `initialValue`: immutable reset baseline until an explicit configuration update;
- `value`: current plain JSON value;
- `definition`: `title`, optional `description`, `updateMode`, restricted `schema`, and semantic `rules`;
- `diagnostics.setup`: durable initialization diagnostics;
- `diagnostics.lastCommit`: diagnostics from only the latest successful commit.

Use Session-local paths such as `/characters/李钰/好感度`. A namespace is only a partition ID, never a character owner or asset alias. `story` is the default initialization namespace.

## Restricted schema

Allowed keywords are:

- common: `type`, `title`, `description`, `enum`, `const`;
- object: `properties`, `required`, `additionalProperties`;
- array: `items`, `minItems`, `maxItems`;
- number: `minimum`, `maximum`;
- string: `minLength`, `maxLength`.

`type` is one JSON type or a finite array of JSON types. Do not use `$ref`, composition or conditional schemas, patterns, scripts, custom keywords, or unknown fields. The definition, initial value, and current value must all validate.

## Rules and update modes

A rule has stable `id`, JSON-Pointer `target`, semantic `when`, optional machine `condition`, an `effect`, optional `guidance`, and `cadence` (`when-applicable` or `every-turn`). Supported effects are `set`, `increment`, `append`, and `remove`; increment effects may bound `minimum` and `maximum` deltas.

- `rules-required`: every change needs a matching `ruleId`; target, operation, increment bounds, and condition are enforced.
- `schema-only`: a `ruleId` is optional; operations and the final schema still apply.
- `disabled`: State is readable but story commits cannot change it.

`when` and `guidance` explain semantic judgment. Only `condition` is machine-evaluated. Missing applicable `every-turn` changes add a diagnostic without rejecting the commit.

## Commit shape

Use one effect per namespace:

```json
{
  "kind": "state.update",
  "namespace": "story",
  "expectedRevision": 4,
  "payload": {
    "changes": [
      {
        "op": "increment",
        "path": "/characters/李钰/好感度",
        "by": 2,
        "ruleId": "liyu-affection-normal-positive",
        "reason": "李钰主动分享了此前隐瞒的经历，信任有所增加"
      }
    ]
  }
}
```

`set` uses `value`; `increment` uses finite `by`; `append` uses `value`; `remove` has no value field. Every change needs `reason`. Root removal, missing targets where the operation requires an existing value, scripts, merge operations, duplicate paths, and ancestor/descendant path conflicts are invalid. Changes run in order but commit atomically only after all rules and the final schema pass.

## Condition language

World-book `stateCondition` and rule `condition` support only:

- `state(namespace, jsonPointer)` and `exists(namespace, jsonPointer)`;
- JSON scalar literals and parentheses;
- `!`, `&&`, `||`, `==`, `!=`, `>`, `>=`, `<`, and `<=`.

Do not use aliases, property access, arithmetic, arbitrary functions, or executable code. Missing paths, type mismatches, and malformed expressions evaluate inactive and produce diagnostics.

## Explicit configuration

`rp_state` is Agent-only and supports `create`, `update`, `reset`, and `delete` after an explicit user request. `create` requires `expectedRevision: 0`. `update` replaces the complete definition and conditionally replaces complete values. `reset` copies `initialValue` to `value`. `delete` removes the namespace. A successful configuration takes effect immediately and is owned by the model assistant message that invoked the tool. Editing only that reply's text preserves it; deleting or regenerating the reply retracts it and rebuilds the projection from the remaining bootstrap, configuration, and turn-commit entities before replay starts. Bootstrap initialization is not message-owned and is never retracted this way.

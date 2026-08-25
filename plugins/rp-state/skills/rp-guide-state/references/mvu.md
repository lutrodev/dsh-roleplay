# MVU compatibility reference

MVU is initialization material and a temporary template runtime, not a second State owner.

## Conversion

- Merge the role card, bound world books in binding order, and only the selected opening into the native `story` namespace.
- Split every `[value, description]` cell recursively: put `value` into plain JSON and move `description` to the corresponding schema node.
- Convert portable MVU `type` and `range` metadata to the restricted schema.
- Convert safely understood `check` or update clauses into native rules, machine `condition` where possible, semantic `when`, and `guidance`. Nested semantic lists are flattened with their headings preserved; safe declarative object types may extend the restricted Schema.
- Select `rules-required` only when every semantic rule targets an exact value and can be machine-enforced. Use `schema-only` if no semantic rules exist or a safely retained rule describes an object group. If an actual semantic rule remains ambiguous, retain the values, set the entire namespace to `disabled`, and preserve a setup diagnostic.
- Exclude MVU output formats, JSON Patch instructions, commands, triggers, and executable update scripts before semantic conversion. Ignored operation logic may produce an informational diagnostic but never changes the namespace update mode.
- Convert only safe declarative opening `_.set` calls into the initial value.
- Remove initialization blocks, update-rule blocks, and variable-output-format instructions from model-visible material.

## Temporary runtime

`getvar`, `getwi`, and the supported EJS subset remain compatibility-plugin behavior. If a template needs `[value, description]`, reconstruct a read-only temporary view from the current native value and schema descriptions. `stat_data` and `display_data` exist only as template-local aliases; never save them in a namespace, rule, Agent path, or commit effect.

Do not execute arbitrary EJS, update scripts, JSON Patch output, or unsupported functions. A failed semantic conversion must be visible through diagnostics and must never silently enable model writes; discarded MVU operation protocols do not count as semantic conversion failures.

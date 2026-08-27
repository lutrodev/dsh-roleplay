import Schema from '@deepseek-ai/schemastery'

export const name = 'rp-compact-access-mode'
export const inject = []
export const Config = Schema.object({})

/** Browser-only presentation plugin; the Host half owns no state or protocol. */
export function apply() {}

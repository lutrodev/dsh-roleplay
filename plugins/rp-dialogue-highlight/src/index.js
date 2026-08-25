import Schema from '@deepseek-ai/schemastery'

export const name = 'rp-dialogue-highlight'
export const inject = []
export const Config = Schema.object({})

/** Browser-only display plugin; the Host half owns no state or protocol. */
export function apply() {}

import Schema from '@deepseek-ai/schemastery'

export const name = 'rp-state-display'
export const inject = []
export const Config = Schema.object({})

/**
 * The Host half is intentionally empty. The browser contribution reads the
 * public conversation and projection contracts without adding RPC or storage.
 */
export function apply() {}

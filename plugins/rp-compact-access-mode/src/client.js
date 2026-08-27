import { ensureStyles } from './styles.js'

export const inject = []

export function apply(ctx) {
  ctx.effect(ensureStyles)
}

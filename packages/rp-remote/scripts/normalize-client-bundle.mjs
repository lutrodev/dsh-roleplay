#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const modulePath = fileURLToPath(import.meta.url)

export function normalizeTrailingWhitespace(source) {
  return source.replace(/[ \t]+$/gm, '')
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === modulePath) {
  const bundlePath = join(dirname(modulePath), '..', 'dist', 'client.js')
  const source = readFileSync(bundlePath, 'utf8')
  const normalized = normalizeTrailingWhitespace(source)
  if (normalized !== source) writeFileSync(bundlePath, normalized)
}

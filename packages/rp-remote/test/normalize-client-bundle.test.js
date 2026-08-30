import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeTrailingWhitespace } from '../scripts/normalize-client-bundle.mjs'

test('normalizes generated trailing spaces without changing line endings or indentation', () => {
  assert.equal(
    normalizeTrailingWhitespace('  keep indentation  \n\t\r\nplain\n'),
    '  keep indentation\n\r\nplain\n',
  )
})

import { defineConfig } from 'tsdown'
import { typertPlugin } from '@deepseek-ai/dsh-typert-generator/tsdown'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  entry: { index: resolve(packageRoot, 'lib/types/index.js') },
  platform: 'node',
  format: 'esm',
  outDir: resolve(packageRoot, 'lib'),
  clean: false,
  target: 'es2024',
  dts: false,
  deps: {
    neverBundle() { return true },
  },
  outputOptions: { entryFileNames: 'index.js' },
  plugins: [typertPlugin({ mode: 'package', faces: ['host'] })],
})

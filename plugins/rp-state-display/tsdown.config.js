import { defineConfig } from 'tsdown'

const moduleId = 'dsh-roleplay-rp-state-display'
const platformModules = [
  'react',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  '@deepseek-ai/dsh-client-ui-primitives',
]

export default defineConfig({
  entry: { client: 'src/client.js' },
  platform: 'browser',
  format: 'cjs',
  outDir: 'dist',
  clean: true,
  target: 'es2022',
  deps: {
    neverBundle(source) { return platformModules.includes(source) },
    alwaysBundle(source) { return !platformModules.includes(source) },
  },
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.MODE': '"production"', 'import.meta.env': '{"MODE":"production"}' },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(moduleId)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
})

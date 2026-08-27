import { defineConfig } from 'tsdown'

const moduleId = 'dsh-roleplay-rp-compact-access-mode'

export default defineConfig({
  entry: { client: 'src/client.js' },
  platform: 'browser',
  format: 'cjs',
  outDir: 'dist',
  clean: true,
  target: 'es2022',
  deps: {
    neverBundle() { return false },
    alwaysBundle() { return true },
  },
  define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.MODE': '"production"', 'import.meta.env': '{"MODE":"production"}' },
  outputOptions: {
    entryFileNames: 'client.js',
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(moduleId)}, factory: (require) => {`,
    footer: 'return module.exports; } });',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
  },
})

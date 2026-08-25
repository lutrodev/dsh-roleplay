import assert from 'node:assert/strict'
import { join } from 'node:path'
import test from 'node:test'

import {
  discoverWorkspacePackages,
  isSupportedNodeVersion,
  parseArguments,
  projectRoot,
  resolveDevelopmentPaths,
  shouldRestartForPath,
  withDefaultWebArguments,
} from './dev.mjs'

test('开发参数与 Web 参数分离', () => {
  assert.deepEqual(
    parseArguments(['--no-watch', '--skip-build', '--', '--port', '3090']),
    {
      build: false,
      dshArgs: ['--port', '3090'],
      dumpConfig: false,
      help: false,
      watch: false,
    },
  )
  assert.equal(parseArguments(['--dump-config']).dumpConfig, true)
})

test('Web 调试默认只监听本机，并允许覆盖端口和地址', () => {
  assert.deepEqual(withDefaultWebArguments([]), [
    '--port',
    '3080',
    '--host',
    '127.0.0.1',
    '--no-open',
  ])
  assert.deepEqual(
    withDefaultWebArguments(['--host=0.0.0.0', '--port', '3090']),
    ['--host=0.0.0.0', '--port', '3090', '--no-open'],
  )
})

test('Node.js 版本边界与 package.json 一致', () => {
  assert.equal(isSupportedNodeVersion('22.18.9'), false)
  assert.equal(isSupportedNodeVersion('22.19.0'), true)
  assert.equal(isSupportedNodeVersion('23.9.0'), false)
  assert.equal(isSupportedNodeVersion('24.0.0'), true)
})

test('默认开发产物写入 Git 忽略目录，并使用专用覆盖变量', () => {
  assert.deepEqual(resolveDevelopmentPaths({}), {
    dataDirectory: join(projectRoot, '.dsh-dev', 'data'),
    dshHome: join(projectRoot, '.dsh-dev', 'harness'),
  })
  assert.deepEqual(resolveDevelopmentPaths({
    DSH_ROLEPLAY_DEV_DATA_DIR: 'tmp/data',
    DSH_ROLEPLAY_DEV_HOME: 'tmp/harness',
  }), {
    dataDirectory: join(projectRoot, 'tmp', 'data'),
    dshHome: join(projectRoot, 'tmp', 'harness'),
  })
})

test('只监听会影响运行结果的源码与配置', () => {
  assert.equal(shouldRestartForPath('src/index.js'), true)
  assert.equal(shouldRestartForPath('cordis.patch.yml'), true)
  assert.equal(shouldRestartForPath('scripts/generate-styles.mjs'), true)
  assert.equal(shouldRestartForPath('src/client-styles.generated.js'), false)
  assert.equal(shouldRestartForPath('dist/client.js'), false)
  assert.equal(shouldRestartForPath('test/index.test.js'), false)
  assert.equal(shouldRestartForPath('README.md'), false)
})

test('发现整套插件和共享 UI package', () => {
  const packages = discoverWorkspacePackages()
  const names = packages.map(workspacePackage => workspacePackage.name)
  assert.equal(new Set(names).size, names.length)
  assert.equal(names.length, 19)
  assert.ok(names.includes('dsh-roleplay-rp-feature-manager'))
  assert.ok(names.includes('dsh-roleplay-rp-ui'))
})

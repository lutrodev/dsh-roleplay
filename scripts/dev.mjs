#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  symlinkSync,
  unlinkSync,
  watch,
} from 'node:fs'
import { basename, dirname, join, parse, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const managerManifestPath = join(projectRoot, 'plugins', 'rp-feature-manager', 'package.json')
const managerPatchPath = join(projectRoot, 'plugins', 'rp-feature-manager', 'cordis.patch.yml')
const managerManifest = readJson(managerManifestPath)
const requiredDshRequirement = managerManifest.dsh?.roleplay?.requiresDsh
const requiredDshVersion = typeof requiredDshRequirement === 'string' && /^\d+\.\d+\.\d+-[0-9A-Za-z.-]+$/.test(requiredDshRequirement)
  ? requiredDshRequirement
  : undefined
const defaultDevRoot = join(projectRoot, '.dsh-dev')
const defaultHost = '127.0.0.1'
const defaultPort = '3080'

export function parseArguments(args) {
  const options = {
    build: true,
    dshArgs: [],
    dumpConfig: false,
    help: false,
    watch: true,
  }
  for (const argument of args) {
    if (argument === '--') continue
    if (argument === '--help' || argument === '-h') {
      options.help = true
    } else if (argument === '--dump-config') {
      options.dumpConfig = true
    } else if (argument === '--no-watch') {
      options.watch = false
    } else if (argument === '--skip-build') {
      options.build = false
    } else {
      options.dshArgs.push(argument)
    }
  }
  return options
}

export function isSupportedNodeVersion(version) {
  const match = /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)/.exec(version)
  if (match?.groups === undefined) return false
  const major = Number(match.groups.major)
  const minor = Number(match.groups.minor)
  return major >= 24 || (major === 22 && minor >= 19)
}

export function shouldRestartForPath(path) {
  const normalized = String(path).replaceAll('\\', '/')
  const parts = normalized.split('/').filter(Boolean)
  if (parts.length === 0) return true
  if (parts.some(part => ['coverage', 'dist', 'node_modules', 'test'].includes(part))) return false
  if (normalized.endsWith('.generated.js')) return false
  if (parts.length === 1) {
    return parts[0] === 'package.json'
      || parts[0] === 'cordis.patch.yml'
      || /(?:^|\.)config\.[cm]?[jt]s$/.test(parts[0])
  }
  return ['presets', 'scripts', 'skills', 'src'].includes(parts[0])
}

export function discoverWorkspacePackages(root = projectRoot) {
  const packages = []
  for (const group of ['packages', 'plugins']) {
    const groupRoot = join(root, group)
    for (const entry of readdirSync(groupRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const directory = join(groupRoot, entry.name)
      const manifestPath = join(directory, 'package.json')
      if (!existsSync(manifestPath)) continue
      const manifest = readJson(manifestPath)
      if (typeof manifest.name !== 'string' || !manifest.name.startsWith('dsh-roleplay-')) {
        throw new Error(`${relative(root, manifestPath)}: package name 必须以 dsh-roleplay- 开头`)
      }
      packages.push({ directory, name: manifest.name })
    }
  }
  return packages.sort((left, right) => left.name.localeCompare(right.name))
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function assertSafeDirectory(path, label) {
  const absolutePath = resolve(path)
  if (absolutePath === parse(absolutePath).root) {
    throw new Error(`${label} 不能指向文件系统根目录`)
  }
}

export function resolveDevelopmentPaths(environment = process.env) {
  return {
    dataDirectory: resolve(
      projectRoot,
      environment.DSH_ROLEPLAY_DEV_DATA_DIR || join(defaultDevRoot, 'data'),
    ),
    dshHome: resolve(
      projectRoot,
      environment.DSH_ROLEPLAY_DEV_HOME || join(defaultDevRoot, 'harness'),
    ),
  }
}

function developmentEnvironment() {
  const { dataDirectory, dshHome } = resolveDevelopmentPaths()
  assertSafeDirectory(dshHome, 'DSH_HOME')
  assertSafeDirectory(dataDirectory, 'DSH_ROLEPLAY_DATA_DIR')
  mkdirSync(dshHome, { recursive: true })
  mkdirSync(dataDirectory, { recursive: true })
  return {
    dataDirectory,
    dshHome,
    env: {
      ...process.env,
      DSH_HOME: dshHome,
      DSH_ROLEPLAY_DATA_DIR: dataDirectory,
      DSH_TELEMETRY_MODE: process.env.DSH_TELEMETRY_MODE || 'DISABLED',
      DSH_TOOLS_MODE: process.env.DSH_TOOLS_MODE || 'native',
    },
  }
}

function resolveDshBin() {
  if (requiredDshVersion === undefined) {
    throw new Error(`${relative(projectRoot, managerManifestPath)}: requiresDsh 必须固定到明确的 DSH 预发布版本`)
  }
  const manifestPath = join(projectRoot, 'node_modules', '@deepseek-ai', 'dsh', 'package.json')
  if (!existsSync(manifestPath)) {
    throw new Error('未安装开发用 Harness CLI；请先运行 pnpm install --frozen-lockfile')
  }
  const manifest = readJson(manifestPath)
  if (manifest.version !== requiredDshVersion) {
    throw new Error(`Harness CLI 版本应为 ${requiredDshVersion}，当前为 ${String(manifest.version)}`)
  }
  const bin = typeof manifest.bin === 'string' ? manifest.bin : manifest.bin?.dsh
  if (typeof bin !== 'string' || bin.length === 0) {
    throw new Error(`${relative(projectRoot, manifestPath)}: 缺少 dsh 可执行入口`)
  }
  return resolve(dirname(manifestPath), bin)
}

function packageManagerCommand(args) {
  const npmExecPath = process.env.npm_execpath
  if (typeof npmExecPath === 'string' && basename(npmExecPath).toLowerCase().includes('pnpm')) {
    return { args: [npmExecPath, ...args], command: process.execPath, shell: false }
  }
  return { args, command: 'pnpm', shell: process.platform === 'win32' }
}

function runBuild() {
  process.stdout.write('\n[dsh-roleplay] 构建客户端资源…\n')
  const invocation = packageManagerCommand(['run', 'build'])
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: projectRoot,
    env: process.env,
    shell: invocation.shell,
    stdio: 'inherit',
  })
  if (result.error !== undefined) throw result.error
  return result.status === 0
}

function runDshSync(dshBin, args, env) {
  const result = spawnSync(process.execPath, [dshBin, ...args], {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
  })
  if (result.error !== undefined) throw result.error
  return result.status ?? 1
}

function initializeProfile(dshBin, env) {
  process.stdout.write('[dsh-roleplay] 准备隔离的 Web Profile…\n')
  const exitCode = runDshSync(dshBin, ['plugin', '--profile', 'web', 'root'], env)
  if (exitCode !== 0) throw new Error(`初始化 Web Profile 失败（退出码 ${exitCode}）`)
}

function ensurePackageLink(linkPath, targetPath) {
  mkdirSync(dirname(linkPath), { recursive: true })
  if (existsSync(linkPath) || isSymbolicLink(linkPath)) {
    const stats = lstatSync(linkPath)
    if (!stats.isSymbolicLink()) {
      throw new Error(`拒绝覆盖非链接路径：${linkPath}。请改用一个空的 DSH_HOME。`)
    }
    const currentTarget = resolve(dirname(linkPath), readlinkSync(linkPath))
    if (currentTarget === resolve(targetPath)) return
    unlinkSync(linkPath)
  }
  symlinkSync(resolve(targetPath), linkPath, process.platform === 'win32' ? 'junction' : 'dir')
}

function isSymbolicLink(path) {
  try {
    return lstatSync(path).isSymbolicLink()
  } catch (error) {
    if (error?.code === 'ENOENT') return false
    throw error
  }
}

function linkWorkspacePackages(profileDirectory, packages) {
  const nodeModules = join(profileDirectory, 'node_modules')
  mkdirSync(nodeModules, { recursive: true })
  for (const workspacePackage of packages) {
    const linkPath = join(nodeModules, ...workspacePackage.name.split('/'))
    ensurePackageLink(linkPath, workspacePackage.directory)
  }
  process.stdout.write(`[dsh-roleplay] 已链接 ${packages.length} 个 workspace package。\n`)
}

export function withDefaultWebArguments(args) {
  const result = [...args]
  if (!hasOption(result, '--host')) result.unshift('--host', defaultHost)
  if (!hasOption(result, '--port')) result.unshift('--port', defaultPort)
  if (!result.includes('--no-open')) result.push('--no-open')
  return result
}

function hasOption(args, name) {
  return args.some(argument => argument === name || argument.startsWith(`${name}=`))
}

function optionValue(args, name, fallback) {
  const equalsArgument = args.find(argument => argument.startsWith(`${name}=`))
  if (equalsArgument !== undefined) return equalsArgument.slice(name.length + 1)
  const index = args.lastIndexOf(name)
  return index >= 0 && index + 1 < args.length ? args[index + 1] : fallback
}

function sendSignal(child, signal) {
  if (child.exitCode !== null || child.signalCode !== null) return
  try {
    if (process.platform !== 'win32' && child.pid !== undefined) {
      process.kill(-child.pid, signal)
    } else {
      child.kill(signal)
    }
  } catch (error) {
    if (error?.code !== 'ESRCH') throw error
  }
}

function waitForExit(child, timeoutMs = 5_000) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise(resolvePromise => {
    let timer
    const done = () => {
      clearTimeout(timer)
      resolvePromise()
    }
    child.once('exit', done)
    timer = setTimeout(() => {
      sendSignal(child, 'SIGKILL')
    }, timeoutMs)
    sendSignal(child, 'SIGTERM')
  })
}

function createWorkspaceWatchers(packages, onChange) {
  return packages.map(workspacePackage => {
    const watcher = watch(workspacePackage.directory, { recursive: true }, (eventType, filename) => {
      if (filename !== null && !shouldRestartForPath(filename)) return
      const changedPath = filename === null
        ? relative(projectRoot, workspacePackage.directory)
        : relative(projectRoot, join(workspacePackage.directory, String(filename)))
      onChange(changedPath, eventType)
    })
    watcher.on('error', error => {
      process.stderr.write(`[dsh-roleplay] 文件监听失败：${error.message}\n`)
    })
    return watcher
  })
}

function printHelp() {
  process.stdout.write(`dsh-roleplay 本地开发\n\n`)
  process.stdout.write(`用法：pnpm dev [-- <选项>]\n\n`)
  process.stdout.write(`  --dump-config  解析完整配置后退出，不启动服务\n`)
  process.stdout.write(`  --no-watch     启动后不监听源码变化\n`)
  process.stdout.write(`  --skip-build   跳过首次客户端构建\n`)
  process.stdout.write(`  --help, -h     显示帮助\n\n`)
  process.stdout.write(`其余参数传给 dsh web，例如：pnpm dev -- --port 3090\n`)
}

async function run() {
  if (!isSupportedNodeVersion(process.versions.node)) {
    throw new Error(`需要 Node.js ^22.19.0 或 >=24.0.0，当前为 ${process.versions.node}`)
  }
  const options = parseArguments(process.argv.slice(2))
  if (options.help) {
    printHelp()
    return
  }
  if (options.dumpConfig && options.dshArgs.length > 0) {
    throw new Error('--dump-config 不能与 Web 服务参数同时使用')
  }

  const development = developmentEnvironment()
  const dshBin = resolveDshBin()
  const packages = discoverWorkspacePackages()
  if (options.build && !runBuild()) throw new Error('客户端构建失败')
  initializeProfile(dshBin, development.env)
  const profileDirectory = join(development.dshHome, 'profiles', 'web')
  linkWorkspacePackages(profileDirectory, packages)

  process.stdout.write(`[dsh-roleplay] Profile：${profileDirectory}\n`)
  process.stdout.write(`[dsh-roleplay] Roleplay 数据：${development.dataDirectory}\n`)

  if (options.dumpConfig) {
    const exitCode = runDshSync(
      dshBin,
      ['web', '--patch', managerPatchPath, '--dump-config'],
      development.env,
    )
    if (exitCode !== 0) throw new Error(`配置解析失败（退出码 ${exitCode}）`)
    return
  }

  const webArguments = withDefaultWebArguments(options.dshArgs)
  const host = optionValue(webArguments, '--host', defaultHost)
  const port = optionValue(webArguments, '--port', defaultPort)
  let activeHost
  let restarting = false
  let shuttingDown = false
  let rebuildRunning = false
  let rebuildQueued = false
  let debounceTimer
  let watchers = []

  const closeWatchers = () => {
    clearTimeout(debounceTimer)
    for (const watcher of watchers) watcher.close()
    watchers = []
  }

  const startHost = () => {
    process.stdout.write(`[dsh-roleplay] 调试地址：http://${host}:${port}\n`)
    const child = spawn(
      process.execPath,
      [dshBin, 'web', '--patch', managerPatchPath, ...webArguments],
      {
        cwd: projectRoot,
        detached: process.platform !== 'win32',
        env: development.env,
        stdio: 'inherit',
      },
    )
    activeHost = child
    child.once('exit', (code, signal) => {
      if (activeHost === child) activeHost = undefined
      if (restarting || shuttingDown) return
      closeWatchers()
      process.stderr.write(`[dsh-roleplay] Harness 已退出（${signal ?? `退出码 ${code ?? 1}`}）。\n`)
      process.exitCode = code ?? 1
    })
  }

  const stopHost = async () => {
    const child = activeHost
    if (child === undefined) return
    await waitForExit(child)
    if (activeHost === child) activeHost = undefined
  }

  const rebuildAndRestart = async () => {
    if (rebuildRunning || shuttingDown) {
      rebuildQueued = !shuttingDown
      return
    }
    rebuildRunning = true
    let buildSucceeded = false
    try {
      buildSucceeded = runBuild()
    } catch (error) {
      process.stderr.write(`[dsh-roleplay] 无法运行构建：${error instanceof Error ? error.message : String(error)}\n`)
    }
    if (buildSucceeded && !shuttingDown) {
      restarting = true
      await stopHost()
      if (!shuttingDown) startHost()
      restarting = false
    } else if (!buildSucceeded) {
      process.stderr.write('[dsh-roleplay] 构建失败；修复后保存文件会再次尝试，当前 Host 不重启。\n')
    }
    rebuildRunning = false
    if (rebuildQueued && !shuttingDown) {
      rebuildQueued = false
      await rebuildAndRestart()
    }
  }

  const scheduleRestart = changedPath => {
    process.stdout.write(`[dsh-roleplay] 检测到源码变化：${changedPath}\n`)
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      void rebuildAndRestart()
    }, 250)
  }

  const shutdown = signal => {
    if (shuttingDown) return
    shuttingDown = true
    closeWatchers()
    void stopHost().finally(() => {
      process.exit(signal === 'SIGINT' ? 130 : 143)
    })
  }
  process.once('SIGINT', () => shutdown('SIGINT'))
  process.once('SIGTERM', () => shutdown('SIGTERM'))

  startHost()
  if (options.watch) {
    watchers = createWorkspaceWatchers(packages, scheduleRestart)
    process.stdout.write('[dsh-roleplay] 正在监听插件源码；保存后会重新构建并重启隔离 Host。\n')
  }
}

const isMain = process.argv[1] !== undefined
  && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  run().catch(error => {
    process.stderr.write(`[dsh-roleplay] ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}

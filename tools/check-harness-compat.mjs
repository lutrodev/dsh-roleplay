#!/usr/bin/env node

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const packagesRoot = join(projectRoot, 'packages')
const pluginsRoot = join(projectRoot, 'plugins')
const rootManifest = readManifest(join(projectRoot, 'package.json'))
const managerManifestPath = join(pluginsRoot, 'rp-feature-manager', 'package.json')
const managerManifest = readManifest(managerManifestPath)
const suiteVersion = managerManifest.dsh?.roleplay?.suiteVersion
const requiredDshVersion = managerManifest.dsh?.roleplay?.requiresDsh
const requiredNode = rootManifest.engines?.node
const exactDshVersion = typeof requiredDshVersion === 'string' && /^\d+\.\d+\.\d+-[0-9A-Za-z.-]+$/.test(requiredDshVersion)
  ? requiredDshVersion
  : undefined
const compatibleDependencyRange = exactDshVersion === undefined ? undefined : `^${exactDshVersion}`

const problems = []
if (typeof suiteVersion !== 'string' || suiteVersion.length === 0) {
  problems.push(`${relative(projectRoot, managerManifestPath)}: 缺少 dsh.roleplay.suiteVersion`)
}
if (exactDshVersion === undefined) {
  problems.push(`${relative(projectRoot, managerManifestPath)}: dsh.roleplay.requiresDsh 必须固定到明确的 DSH 预发布版本`)
}
if (typeof requiredNode !== 'string' || requiredNode.length === 0) {
  problems.push('package.json: 缺少有效的 engines.node')
}
if (rootManifest.devDependencies?.['@deepseek-ai/dsh'] !== exactDshVersion) {
  problems.push(`package.json: devDependencies.@deepseek-ai/dsh 应固定为 ${String(exactDshVersion)}`)
}

let workspacePackageCount = 0
let dshDependencyCount = 0
for (const workspaceRoot of [packagesRoot, pluginsRoot]) {
  for (const entry of readdirSync(workspaceRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const manifestPath = join(workspaceRoot, entry.name, 'package.json')
    let manifest
    try {
      manifest = readManifest(manifestPath)
    } catch (error) {
      if (error?.code === 'ENOENT') continue
      throw error
    }
    workspacePackageCount += 1
    const label = relative(projectRoot, manifestPath)
    if (typeof manifest.name !== 'string' || !manifest.name.startsWith('dsh-roleplay-')) {
      problems.push(`${label}: package name 必须以 dsh-roleplay- 开头`)
    }
    if (manifest.version !== suiteVersion) {
      problems.push(`${label}: Roleplay package 版本应与组合版本 ${suiteVersion} 一致，当前为 ${String(manifest.version)}`)
    }
    if (manifest.engines?.node !== requiredNode) {
      problems.push(`${label}: engines.node 应为 ${JSON.stringify(requiredNode)}`)
    }

    for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies', 'devDependencies']) {
      for (const [name, specifier] of Object.entries(manifest[field] ?? {})) {
        if (typeof specifier === 'string' && /^(?:file|link):/.test(specifier)) {
          problems.push(`${label}: ${field}.${name} 不得引用仓库外本地路径`)
        }
        if (!name.startsWith('@deepseek-ai/dsh-')) continue
        dshDependencyCount += 1
        if (specifier !== compatibleDependencyRange && specifier !== exactDshVersion) {
          problems.push(`${label}: ${field}.${name} 应为 ${compatibleDependencyRange} 或 ${exactDshVersion}，当前为 ${String(specifier)}`)
        }
      }
    }
  }
}

if (problems.length > 0) {
  process.stderr.write(`Harness 兼容性检查失败：\n- ${problems.join('\n- ')}\n`)
  process.exitCode = 1
} else {
  process.stdout.write(`Harness 兼容性检查通过：Roleplay ${suiteVersion}，DSH ${exactDshVersion}，${workspacePackageCount} 个 workspace package，${dshDependencyCount} 项 DSH 依赖，Node ${requiredNode}。\n`)
}

function readManifest(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

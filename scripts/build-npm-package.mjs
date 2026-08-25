import { access, cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PUBLIC_PACKAGE = '@lutrodev/dsh-roleplay'
const INTERNAL_PREFIX = 'dsh-roleplay-rp-'
const scriptDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(scriptDir, '..')
const outputDir = join(projectRoot, '.npm-package')
const textExtensions = new Set(['.css', '.js', '.json', '.md', '.mjs', '.txt', '.yaml', '.yml'])

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function pathExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function discoverComponents() {
  const components = []
  for (const group of ['plugins', 'packages']) {
    const groupDir = join(projectRoot, group)
    for (const entry of await readdir(groupDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith('rp-')) continue
      const dir = join(groupDir, entry.name)
      const manifestPath = join(dir, 'package.json')
      if (!await pathExists(manifestPath)) continue
      const manifest = await readJson(manifestPath)
      if (typeof manifest.name !== 'string' || !manifest.name.startsWith(INTERNAL_PREFIX)) {
        throw new Error(`unexpected Roleplay package name in ${relative(projectRoot, manifestPath)}`)
      }
      components.push({ group, slug: entry.name, dir, manifest })
    }
  }
  components.sort((a, b) => a.manifest.name.localeCompare(b.manifest.name))
  return components
}

function packageMapping(components) {
  const mapping = new Map()
  for (const component of components) {
    const target = component.slug === 'rp-feature-manager'
      ? PUBLIC_PACKAGE
      : `${PUBLIC_PACKAGE}/${component.slug}`
    mapping.set(component.manifest.name, target)
  }
  return mapping
}

function replacePackageNames(value, mapping) {
  let result = value
  const entries = [...mapping.entries()].sort(([left], [right]) => right.length - left.length)
  for (const [source, target] of entries) result = result.split(source).join(target)
  return result
}

function transformBundlePatch(value, mapping) {
  const transformed = replacePackageNames(value, mapping)
  return transformed.replace(
    /^(\s*name:\s*)(@lutrodev\/dsh-roleplay(?:\/rp-[a-z0-9-]+)?)(\s*)$/gm,
    (_match, prefix, packageName, suffix) => `${prefix}${JSON.stringify(packageName)}${suffix}`,
  )
}

function transformJson(value, mapping) {
  if (typeof value === 'string') return replacePackageNames(value, mapping)
  if (Array.isArray(value)) return value.map(item => transformJson(item, mapping))
  if (value === null || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [
    replacePackageNames(key, mapping),
    transformJson(item, mapping),
  ]))
}

async function copyTransformed(source, target, mapping) {
  const info = await stat(source)
  if (info.isDirectory()) {
    await mkdir(target, { recursive: true })
    for (const entry of await readdir(source, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue
      await copyTransformed(join(source, entry.name), join(target, entry.name), mapping)
    }
    return
  }
  await mkdir(dirname(target), { recursive: true })
  if (textExtensions.has(extname(source))) {
    const content = await readFile(source, 'utf8')
    await writeFile(target, replacePackageNames(content, mapping))
  } else {
    await cp(source, target)
  }
}

async function copyOptionalTree(source, target, mapping) {
  if (await pathExists(source)) await copyTransformed(source, target, mapping)
}

function exportedPath(component, target) {
  if (typeof target !== 'string' || !target.startsWith('./')) {
    throw new Error(`${component.manifest.name} has an unsupported export target`)
  }
  return `./${component.group}/${component.slug}/${target.slice(2)}`
}

function buildExports(components) {
  const exports = {}
  for (const component of components) {
    const entries = Object.entries(component.manifest.exports ?? {})
    if (component.slug === 'rp-feature-manager') {
      for (const [key, target] of entries) {
        if (key === './package.json') continue
        exports[key] = exportedPath(component, target)
      }
      continue
    }
    for (const [key, target] of entries) {
      const publicKey = key === '.' ? `./${component.slug}` : `./${component.slug}/${key.slice(2)}`
      exports[publicKey] = exportedPath(component, target)
    }
    exports[`./${component.slug}/package.json`] = `./${component.group}/${component.slug}/package.json`
  }
  exports['./package.json'] = './package.json'
  return Object.fromEntries(Object.entries(exports).sort(([a], [b]) => a.localeCompare(b)))
}

function mergeDependencies(components, mapping) {
  const dependencies = new Map()
  const peerDependencies = new Map()
  const declaredPeers = new Set(components.flatMap(component => Object.keys(component.manifest.peerDependencies ?? {})))

  for (const component of components) {
    for (const field of ['dependencies', 'peerDependencies']) {
      for (const [name, range] of Object.entries(component.manifest[field] ?? {})) {
        if (mapping.has(name)) continue
        if (typeof range !== 'string' || range.startsWith('workspace:')) {
          throw new Error(`unsupported dependency ${name} in ${component.manifest.name}`)
        }
        const target = declaredPeers.has(name) ? peerDependencies : dependencies
        const previous = target.get(name)
        if (previous !== undefined && previous !== range) {
          throw new Error(`conflicting ranges for ${name}: ${previous} and ${range}`)
        }
        target.set(name, range)
      }
    }
  }

  const sort = map => Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b)))
  return { dependencies: sort(dependencies), peerDependencies: sort(peerDependencies) }
}

function publicNestedManifest(component, mapping) {
  return {
    name: `@lutrodev/dsh-roleplay-internal-${component.slug}`,
    version: component.manifest.version,
    private: true,
    type: 'module',
    exports: component.manifest.exports,
    ...(component.manifest.dsh === undefined ? {} : { dsh: transformJson(component.manifest.dsh, mapping) }),
    license: component.manifest.license ?? 'MIT',
    engines: component.manifest.engines,
  }
}

async function buildPackage() {
  if (dirname(outputDir) !== projectRoot || !outputDir.endsWith('/.npm-package')) {
    throw new Error(`refusing to replace unexpected output directory: ${outputDir}`)
  }

  const components = await discoverComponents()
  const mapping = packageMapping(components)
  const featureManager = components.find(component => component.slug === 'rp-feature-manager')
  if (featureManager === undefined) throw new Error('rp-feature-manager is missing')

  await rm(outputDir, { recursive: true, force: true })
  await mkdir(outputDir, { recursive: true })

  for (const component of components) {
    const target = join(outputDir, component.group, component.slug)
    await copyOptionalTree(join(component.dir, 'src'), join(target, 'src'), mapping)
    await copyOptionalTree(join(component.dir, 'skills'), join(target, 'skills'), mapping)
    await copyOptionalTree(join(component.dir, 'presets'), join(target, 'presets'), mapping)
    await copyOptionalTree(join(component.dir, 'README.md'), join(target, 'README.md'), mapping)
    if (component.manifest.dsh?.client !== undefined) {
      const client = join(component.dir, 'dist', 'client.js')
      if (!await pathExists(client)) throw new Error(`missing built client: ${relative(projectRoot, client)}`)
      await copyTransformed(client, join(target, 'dist', 'client.js'), mapping)
    }
    await writeFile(join(target, 'package.json'), `${JSON.stringify(publicNestedManifest(component, mapping), null, 2)}\n`)
  }

  const patchSource = join(featureManager.dir, featureManager.manifest.dsh.bundle.patch)
  await writeFile(
    join(outputDir, 'cordis.patch.yml'),
    transformBundlePatch(await readFile(patchSource, 'utf8'), mapping),
  )
  for (const file of ['README.md', 'LICENSE', 'CHANGELOG.md', 'SECURITY.md', 'THIRD_PARTY_NOTICES.md']) {
    await copyTransformed(join(projectRoot, file), join(outputDir, file), mapping)
  }
  await copyOptionalTree(join(projectRoot, 'docs'), join(outputDir, 'docs'), mapping)

  const { dependencies, peerDependencies } = mergeDependencies(components, mapping)
  const rootManifest = await readJson(join(projectRoot, 'package.json'))
  const manifest = {
    name: PUBLIC_PACKAGE,
    version: rootManifest.version,
    description: rootManifest.description,
    license: rootManifest.license,
    type: 'module',
    main: './plugins/rp-feature-manager/src/index.js',
    exports: buildExports(components),
    files: [
      'plugins/**',
      'packages/**',
      'docs/**',
      'cordis.patch.yml',
      'README.md',
      'LICENSE',
      'CHANGELOG.md',
      'SECURITY.md',
      'THIRD_PARTY_NOTICES.md',
    ],
    dsh: transformJson(featureManager.manifest.dsh, mapping),
    dependencies,
    peerDependencies,
    engines: rootManifest.engines,
    repository: rootManifest.repository,
    bugs: rootManifest.bugs,
    homepage: rootManifest.homepage,
    keywords: ['deepseek-harness', 'dsh', 'roleplay', 'character-card', 'lorebook'],
    publishConfig: { access: 'public' },
  }
  await writeFile(join(outputDir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)

  const oldNames = [...mapping.keys()]
  const publishedFiles = []
  async function audit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) await audit(path)
      else publishedFiles.push(path)
    }
  }
  await audit(outputDir)
  for (const path of publishedFiles) {
    if (!textExtensions.has(extname(path))) continue
    const content = await readFile(path, 'utf8')
    const leaked = oldNames.find(name => content.includes(name))
    if (leaked !== undefined) throw new Error(`${relative(outputDir, path)} still references ${leaked}`)
  }

  process.stdout.write(`${JSON.stringify({
    package: manifest.name,
    version: manifest.version,
    components: components.length,
    files: publishedFiles.length,
    output: relative(projectRoot, outputDir),
  }, null, 2)}\n`)
}

await buildPackage()

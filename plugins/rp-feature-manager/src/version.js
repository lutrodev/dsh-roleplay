/** Focused SemVer comparison for the suite's exact and caret compatibility contracts. */

export function parseVersion(value) {
  if (typeof value !== 'string') return undefined
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(value)
  if (match === null) return undefined
  return {
    major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]),
    prerelease: match[4] === undefined ? [] : match[4].split('.').map(identifier => /^\d+$/.test(identifier) ? Number(identifier) : identifier),
  }
}

export function compareVersions(left, right) {
  const a = typeof left === 'string' ? parseVersion(left) : left
  const b = typeof right === 'string' ? parseVersion(right) : right
  if (a === undefined || b === undefined) throw new TypeError('invalid semantic version')
  for (const key of ['major', 'minor', 'patch']) {
    if (a[key] !== b[key]) return a[key] < b[key] ? -1 : 1
  }
  if (a.prerelease.length === 0 || b.prerelease.length === 0) {
    return a.prerelease.length === b.prerelease.length ? 0 : a.prerelease.length === 0 ? 1 : -1
  }
  const length = Math.max(a.prerelease.length, b.prerelease.length)
  for (let index = 0; index < length; index += 1) {
    const x = a.prerelease[index]
    const y = b.prerelease[index]
    if (x === y) continue
    if (x === undefined) return -1
    if (y === undefined) return 1
    if (typeof x === 'number' && typeof y === 'string') return -1
    if (typeof x === 'string' && typeof y === 'number') return 1
    return x < y ? -1 : 1
  }
  return 0
}

export function satisfiesVersion(version, range) {
  const parsed = parseVersion(version)
  if (parsed === undefined || typeof range !== 'string') return false
  if (!range.startsWith('^')) {
    const exact = parseVersion(range)
    return exact !== undefined && compareVersions(parsed, exact) === 0
  }
  const minimum = parseVersion(range.slice(1))
  if (minimum === undefined || compareVersions(parsed, minimum) < 0) return false
  if (parsed.prerelease.length > 0) {
    const sameCore = parsed.major === minimum.major
      && parsed.minor === minimum.minor
      && parsed.patch === minimum.patch
    if (minimum.prerelease.length === 0 || !sameCore) return false
  }
  const maximum = minimum.major > 0
    ? { major: minimum.major + 1, minor: 0, patch: 0, prerelease: [] }
    : minimum.minor > 0
      ? { major: 0, minor: minimum.minor + 1, patch: 0, prerelease: [] }
      : { major: 0, minor: 0, patch: minimum.patch + 1, prerelease: [] }
  return compareVersions(parsed, maximum) < 0
}

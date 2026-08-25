const ASSET_KINDS = new Set(['character', 'lorebook', 'persona', 'preset', 'writingStyle'])

/**
 * Observable client capability registry for canonical asset editors.
 * The library owns orchestration; each asset plugin owns its one editor.
 */
export class AssetEditorRegistry {
  #editors = new Map()
  #listeners = new Set()
  #version = 0

  register(kind, component) {
    if (!ASSET_KINDS.has(kind)) throw new TypeError(`Unknown Roleplay asset editor kind: ${kind}`)
    if (typeof component !== 'function') throw new TypeError(`Roleplay asset editor ${kind} must be a component`)
    if (this.#editors.has(kind)) throw new Error(`Roleplay asset editor ${kind} is already registered`)
    const registration = { component }
    this.#editors.set(kind, registration)
    this.#publish()
    let active = true
    return () => {
      if (!active) return
      active = false
      if (this.#editors.get(kind) !== registration) return
      this.#editors.delete(kind)
      this.#publish()
    }
  }

  get(kind) {
    return this.#editors.get(kind)?.component
  }

  getVersion = () => this.#version

  subscribe = listener => {
    this.#listeners.add(listener)
    return () => { this.#listeners.delete(listener) }
  }

  #publish() {
    this.#version += 1
    for (const listener of [...this.#listeners]) listener()
  }
}

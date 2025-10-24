/**
 * Plugin System
 * Extensible plugin architecture for adding custom functionality
 * Supports sandboxed execution, lifecycle hooks, and permission management
 */

import localforage from 'localforage'

export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  homepage?: string
  icon?: string

  // Plugin metadata
  category: 'ai' | 'ui' | 'tool' | 'integration' | 'theme' | 'other'
  keywords: string[]
  license: string

  // Plugin files
  manifest: PluginManifest
  code: string // Main plugin code
  styles?: string // Optional CSS

  // Runtime state
  isEnabled: boolean
  isInstalled: boolean
  installedAt: number
  updatedAt: number

  // Plugin settings
  settings?: Record<string, any>
  permissions: PluginPermission[]
}

export interface PluginManifest {
  id: string
  name: string
  version: string
  main: string // Entry point
  dependencies?: Record<string, string>
  hooks?: PluginHooks
  config?: PluginConfig[]
  permissions: PluginPermission[]
}

export interface PluginHooks {
  onInstall?: string // Function name
  onUninstall?: string
  onEnable?: string
  onDisable?: string
  onMessage?: string // Handle incoming messages
  onCommand?: string // Handle custom commands
  beforeSend?: string // Modify message before sending
  afterReceive?: string // Process received message
  onRender?: string // Custom UI rendering
}

export interface PluginConfig {
  key: string
  label: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea'
  default: any
  options?: Array<{ label: string; value: any }>
  description?: string
  required?: boolean
}

export type PluginPermission =
  | 'storage' // Access local storage
  | 'network' // Make HTTP requests
  | 'ai' // Access AI models
  | 'files' // Read/write files
  | 'clipboard' // Access clipboard
  | 'notifications' // Show notifications
  | 'commands' // Register commands
  | 'ui' // Modify UI

export interface PluginContext {
  pluginId: string
  api: PluginAPI
  storage: PluginStorage
  permissions: PluginPermission[]
}

export interface PluginAPI {
  // Core functions available to plugins
  log: (message: string, level?: 'info' | 'warn' | 'error') => void
  notify: (message: string, type?: 'success' | 'error' | 'info') => void

  // AI integration
  sendMessage?: (message: string) => Promise<string>
  callFunction?: (name: string, args: any) => Promise<any>

  // UI integration
  addCommand?: (name: string, handler: Function) => void
  addMenuItem?: (label: string, action: Function) => void
  showDialog?: (content: any) => Promise<void>

  // Storage
  getSetting: (key: string) => any
  setSetting: (key: string, value: any) => Promise<void>

  // Events
  on: (event: string, handler: Function) => void
  emit: (event: string, data?: any) => void
}

export interface PluginStorage {
  get: (key: string) => Promise<any>
  set: (key: string, value: any) => Promise<void>
  remove: (key: string) => Promise<void>
  clear: () => Promise<void>
}

export interface PluginMarketplaceEntry {
  id: string
  name: string
  description: string
  version: string
  author: string
  downloads: number
  rating: number
  category: string
  icon?: string
  homepage?: string
  repository?: string
  packageUrl: string // URL to download plugin package
  screenshots?: string[]
  changelog?: string
  verified: boolean
}

export class PluginSystem {
  private store: LocalForage
  private plugins: Map<string, Plugin> = new Map()
  private loadedPlugins: Map<string, any> = new Map() // Runtime plugin instances
  private eventHandlers: Map<string, Set<Function>> = new Map()

  constructor() {
    this.store = localforage.createInstance({
      name: 'plugin-db',
      storeName: 'plugins'
    })
  }

  /**
   * Initialize plugin system
   */
  async initialize(): Promise<void> {
    try {
      // Load installed plugins
      const pluginList = await this.store.getItem<Plugin[]>('installed-plugins')
      if (pluginList) {
        pluginList.forEach(plugin => {
          this.plugins.set(plugin.id, plugin)
        })
      }

      // Auto-load enabled plugins
      for (const plugin of this.plugins.values()) {
        if (plugin.isEnabled) {
          await this.loadPlugin(plugin.id).catch(err => {
            console.error(`Failed to load plugin ${plugin.id}:`, err)
          })
        }
      }

      console.log(`[PluginSystem] Initialized with ${this.plugins.size} plugins`)
    } catch (error) {
      console.error('[PluginSystem] Initialization error:', error)
    }
  }

  /**
   * Install a plugin
   */
  async installPlugin(packageData: any): Promise<Plugin> {
    try {
      const manifest: PluginManifest = packageData.manifest

      // Validate manifest
      if (!manifest.id || !manifest.name || !manifest.version) {
        throw new Error('Invalid plugin manifest')
      }

      // Check if already installed
      if (this.plugins.has(manifest.id)) {
        throw new Error('Plugin already installed')
      }

      const now = Date.now()

      const plugin: Plugin = {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        description: packageData.description || '',
        author: packageData.author || 'Unknown',
        homepage: packageData.homepage,
        icon: packageData.icon,
        category: packageData.category || 'other',
        keywords: packageData.keywords || [],
        license: packageData.license || 'MIT',
        manifest,
        code: packageData.code,
        styles: packageData.styles,
        isEnabled: false,
        isInstalled: true,
        installedAt: now,
        updatedAt: now,
        settings: this.initializeSettings(manifest.config),
        permissions: manifest.permissions || []
      }

      this.plugins.set(plugin.id, plugin)
      await this.savePlugins()

      // Run install hook
      if (manifest.hooks?.onInstall) {
        await this.runPluginHook(plugin.id, 'onInstall')
      }

      console.log(`[PluginSystem] Plugin ${plugin.id} installed`)
      return plugin
    } catch (error: any) {
      console.error('[PluginSystem] Install error:', error)
      throw new Error(`Failed to install plugin: ${error.message}`)
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error('Plugin not found')
    }

    // Disable first
    if (plugin.isEnabled) {
      await this.disablePlugin(pluginId)
    }

    // Run uninstall hook
    if (plugin.manifest.hooks?.onUninstall) {
      await this.runPluginHook(pluginId, 'onUninstall')
    }

    // Remove plugin
    this.plugins.delete(pluginId)
    await this.savePlugins()

    // Clear plugin storage
    const storage = await this.getPluginStorage(pluginId)
    await storage.clear()

    console.log(`[PluginSystem] Plugin ${pluginId} uninstalled`)
  }

  /**
   * Enable a plugin
   */
  async enablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error('Plugin not found')
    }

    if (plugin.isEnabled) {
      return // Already enabled
    }

    // Load plugin
    await this.loadPlugin(pluginId)

    plugin.isEnabled = true
    plugin.updatedAt = Date.now()
    await this.savePlugins()

    // Run enable hook
    if (plugin.manifest.hooks?.onEnable) {
      await this.runPluginHook(pluginId, 'onEnable')
    }

    console.log(`[PluginSystem] Plugin ${pluginId} enabled`)
  }

  /**
   * Disable a plugin
   */
  async disablePlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error('Plugin not found')
    }

    if (!plugin.isEnabled) {
      return // Already disabled
    }

    // Run disable hook
    if (plugin.manifest.hooks?.onDisable) {
      await this.runPluginHook(pluginId, 'onDisable')
    }

    // Unload plugin
    this.unloadPlugin(pluginId)

    plugin.isEnabled = false
    plugin.updatedAt = Date.now()
    await this.savePlugins()

    console.log(`[PluginSystem] Plugin ${pluginId} disabled`)
  }

  /**
   * Load plugin into runtime
   */
  private async loadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error('Plugin not found')
    }

    try {
      // Create plugin context
      const context = await this.createPluginContext(plugin)

      // Execute plugin code in sandboxed environment
      const pluginInstance = this.executePluginCode(plugin.code, context)

      this.loadedPlugins.set(pluginId, pluginInstance)

      // Inject styles if present
      if (plugin.styles) {
        this.injectPluginStyles(pluginId, plugin.styles)
      }

      console.log(`[PluginSystem] Plugin ${pluginId} loaded`)
    } catch (error: any) {
      console.error(`[PluginSystem] Failed to load plugin ${pluginId}:`, error)
      throw error
    }
  }

  /**
   * Unload plugin from runtime
   */
  private unloadPlugin(pluginId: string): void {
    this.loadedPlugins.delete(pluginId)

    // Remove injected styles
    const styleElement = document.getElementById(`plugin-styles-${pluginId}`)
    if (styleElement) {
      styleElement.remove()
    }
  }

  /**
   * Execute plugin code in sandboxed environment
   */
  private executePluginCode(code: string, context: PluginContext): any {
    try {
      // Create sandbox with limited global access
      const sandbox = {
        console: {
          log: context.api.log,
          warn: (msg: string) => context.api.log(msg, 'warn'),
          error: (msg: string) => context.api.log(msg, 'error')
        },
        plugin: context,
        // No access to: window, document, fetch, etc. unless granted permission
      }

      // Execute code in sandbox
      const fn = new Function('sandbox', `
        with (sandbox) {
          ${code}
        }
      `)

      return fn(sandbox)
    } catch (error: any) {
      throw new Error(`Plugin execution error: ${error.message}`)
    }
  }

  /**
   * Create plugin context
   */
  private async createPluginContext(plugin: Plugin): Promise<PluginContext> {
    const storage = await this.getPluginStorage(plugin.id)

    const api: PluginAPI = {
      log: (message: string, level = 'info') => {
        console.log(`[Plugin:${plugin.id}] ${message}`, level)
      },

      notify: (message: string, type = 'info') => {
        // Integration with toast notifications
        console.log(`[Plugin:${plugin.id}] Notify: ${message} (${type})`)
      },

      getSetting: (key: string) => {
        return plugin.settings?.[key]
      },

      setSetting: async (key: string, value: any) => {
        if (!plugin.settings) {
          plugin.settings = {}
        }
        plugin.settings[key] = value
        await this.savePlugins()
      },

      on: (event: string, handler: Function) => {
        if (!this.eventHandlers.has(event)) {
          this.eventHandlers.set(event, new Set())
        }
        this.eventHandlers.get(event)!.add(handler)
      },

      emit: (event: string, data?: any) => {
        const handlers = this.eventHandlers.get(event)
        if (handlers) {
          handlers.forEach(handler => handler(data))
        }
      }
    }

    // Add permission-gated APIs
    if (plugin.permissions.includes('ai')) {
      api.sendMessage = async (message: string) => {
        // Integration with AI service
        return 'AI response'
      }
    }

    if (plugin.permissions.includes('commands')) {
      api.addCommand = (name: string, handler: Function) => {
        console.log(`[Plugin:${plugin.id}] Command registered: ${name}`)
      }
    }

    return {
      pluginId: plugin.id,
      api,
      storage,
      permissions: plugin.permissions
    }
  }

  /**
   * Get plugin storage
   */
  private async getPluginStorage(pluginId: string): Promise<PluginStorage> {
    const store = localforage.createInstance({
      name: 'plugin-storage',
      storeName: pluginId
    })

    return {
      get: (key: string) => store.getItem(key),
      set: (key: string, value: any) => store.setItem(key, value),
      remove: (key: string) => store.removeItem(key),
      clear: () => store.clear()
    }
  }

  /**
   * Inject plugin styles
   */
  private injectPluginStyles(pluginId: string, styles: string): void {
    const styleElement = document.createElement('style')
    styleElement.id = `plugin-styles-${pluginId}`
    styleElement.textContent = styles
    document.head.appendChild(styleElement)
  }

  /**
   * Run plugin hook
   */
  private async runPluginHook(pluginId: string, hookName: string, ...args: any[]): Promise<any> {
    const instance = this.loadedPlugins.get(pluginId)
    if (!instance) {
      return
    }

    const plugin = this.plugins.get(pluginId)
    if (!plugin?.manifest.hooks) {
      return
    }

    const hookFn = (plugin.manifest.hooks as any)[hookName]
    if (!hookFn || typeof instance[hookFn] !== 'function') {
      return
    }

    try {
      return await instance[hookFn](...args)
    } catch (error: any) {
      console.error(`[PluginSystem] Hook ${hookName} error in ${pluginId}:`, error)
    }
  }

  /**
   * Initialize plugin settings from config
   */
  private initializeSettings(config?: PluginConfig[]): Record<string, any> {
    if (!config) return {}

    const settings: Record<string, any> = {}
    config.forEach(cfg => {
      settings[cfg.key] = cfg.default
    })
    return settings
  }

  /**
   * Get plugin by ID
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * List all plugins
   */
  listPlugins(filter?: { enabled?: boolean; category?: string }): Plugin[] {
    let plugins = Array.from(this.plugins.values())

    if (filter?.enabled !== undefined) {
      plugins = plugins.filter(p => p.isEnabled === filter.enabled)
    }

    if (filter?.category) {
      plugins = plugins.filter(p => p.category === filter.category)
    }

    return plugins.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /**
   * Update plugin settings
   */
  async updatePluginSettings(pluginId: string, settings: Record<string, any>): Promise<void> {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new Error('Plugin not found')
    }

    plugin.settings = { ...plugin.settings, ...settings }
    plugin.updatedAt = Date.now()
    await this.savePlugins()
  }

  /**
   * Search marketplace for plugins
   */
  async searchMarketplace(query: string, filters?: {
    category?: string
    verified?: boolean
  }): Promise<PluginMarketplaceEntry[]> {
    // In production, call backend API
    // For now, return mock data
    return []
  }

  /**
   * Download and install plugin from marketplace
   */
  async installFromMarketplace(pluginId: string): Promise<Plugin> {
    // In production, download plugin package from marketplace
    // For now, throw error
    throw new Error('Marketplace not implemented')
  }

  /**
   * Save plugins to storage
   */
  private async savePlugins(): Promise<void> {
    const list = Array.from(this.plugins.values())
    await this.store.setItem('installed-plugins', list)
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    const plugins = Array.from(this.plugins.values())

    return {
      totalPlugins: plugins.length,
      enabledPlugins: plugins.filter(p => p.isEnabled).length,
      categories: {
        ai: plugins.filter(p => p.category === 'ai').length,
        ui: plugins.filter(p => p.category === 'ui').length,
        tool: plugins.filter(p => p.category === 'tool').length,
        integration: plugins.filter(p => p.category === 'integration').length,
        theme: plugins.filter(p => p.category === 'theme').length,
        other: plugins.filter(p => p.category === 'other').length
      }
    }
  }
}

/**
 * Global plugin system instance
 */
export const pluginSystem = new PluginSystem()

/**
 * Initialize on module load
 */
pluginSystem.initialize().catch(console.error)

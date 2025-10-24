/**
 * Frontend Plugin System for AI Chat Studio
 * Handles UI plugins, extensions, and integrations
 */

export enum PluginType {
  PROVIDER = 'provider',
  TOOL = 'tool',
  UI = 'ui',
  EXPORT = 'export',
  THEME = 'theme',
  INTEGRATION = 'integration',
}

export enum PluginStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  LOADING = 'loading',
}

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  pluginType: PluginType;
  dependencies: string[];
  configSchema: Record<string, any>;
  homepage?: string;
  repository?: string;
  license?: string;
  tags: string[];
}

export interface PluginConfig {
  [key: string]: any;
}

export interface Plugin {
  metadata: PluginMetadata;
  status: PluginStatus;
  config: PluginConfig;
  initialized: boolean;
}

/**
 * Base plugin interface
 * All plugins must implement this interface
 */
export interface IPlugin {
  readonly metadata: PluginMetadata;

  /**
   * Initialize plugin
   * Called when plugin is loaded
   */
  initialize(config: PluginConfig): Promise<boolean>;

  /**
   * Shutdown plugin
   * Called when plugin is unloaded
   */
  shutdown(): Promise<void>;

  /**
   * Validate plugin configuration
   */
  validateConfig(config: PluginConfig): boolean;
}

/**
 * UI Plugin Interface
 * For plugins that add UI components
 */
export interface IUIPlugin extends IPlugin {
  /**
   * Get React component to render
   */
  getComponent(): React.ComponentType<any>;

  /**
   * Get mount point for the component
   * Examples: 'sidebar', 'toolbar', 'chat-input', 'message-actions'
   */
  getMountPoint(): string;

  /**
   * Get component props
   */
  getProps?(): Record<string, any>;
}

/**
 * Theme Plugin Interface
 * For custom themes and styling
 */
export interface IThemePlugin extends IPlugin {
  /**
   * Get theme configuration
   */
  getTheme(): {
    colors: Record<string, string>;
    fonts?: Record<string, string>;
    spacing?: Record<string, string | number>;
    [key: string]: any;
  };

  /**
   * Apply theme
   */
  apply(): void;

  /**
   * Remove theme
   */
  remove(): void;
}

/**
 * Integration Plugin Interface
 * For third-party service integrations
 */
export interface IIntegrationPlugin extends IPlugin {
  /**
   * Connect to external service
   */
  connect(): Promise<boolean>;

  /**
   * Disconnect from external service
   */
  disconnect(): Promise<void>;

  /**
   * Check connection status
   */
  isConnected(): boolean;

  /**
   * Execute integration action
   */
  execute(action: string, params: any): Promise<any>;
}

/**
 * Plugin Manager
 * Central system for managing frontend plugins
 */
export class PluginManager {
  private plugins: Map<string, IPlugin> = new Map();
  private pluginConfigs: Map<string, PluginConfig> = new Map();
  private hooks: Map<string, Array<(...args: any[]) => any>> = new Map();
  private initialized: boolean = false;

  /**
   * Initialize plugin manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load plugin configurations from localStorage
    this.loadConfigurations();

    // Discover and load plugins
    await this.discoverPlugins();

    this.initialized = true;
    console.log('Plugin manager initialized');
  }

  /**
   * Load plugin configurations from storage
   */
  private loadConfigurations(): void {
    try {
      const configStr = localStorage.getItem('plugin_configs');
      if (configStr) {
        const configs = JSON.parse(configStr);
        Object.entries(configs).forEach(([id, config]) => {
          this.pluginConfigs.set(id, config as PluginConfig);
        });
        console.log(`Loaded configurations for ${this.pluginConfigs.size} plugins`);
      }
    } catch (error) {
      console.error('Failed to load plugin configurations:', error);
    }
  }

  /**
   * Save plugin configurations to storage
   */
  private saveConfigurations(): void {
    try {
      const configs: Record<string, PluginConfig> = {};
      this.pluginConfigs.forEach((config, id) => {
        configs[id] = config;
      });
      localStorage.setItem('plugin_configs', JSON.stringify(configs));
      console.log('Plugin configurations saved');
    } catch (error) {
      console.error('Failed to save plugin configurations:', error);
    }
  }

  /**
   * Discover plugins from registry
   */
  private async discoverPlugins(): Promise<string[]> {
    // In a real implementation, this would:
    // 1. Check a plugin registry/marketplace
    // 2. Load plugin manifests
    // 3. Dynamically import plugin modules

    // For now, return empty array
    // Plugins will be loaded manually via loadPlugin()
    return [];
  }

  /**
   * Load and initialize a plugin
   */
  async loadPlugin(plugin: IPlugin, config?: PluginConfig): Promise<boolean> {
    try {
      const pluginId = plugin.metadata.id;

      if (this.plugins.has(pluginId)) {
        console.warn(`Plugin ${pluginId} already loaded`);
        return true;
      }

      // Use provided config or stored config
      const pluginConfig = config || this.pluginConfigs.get(pluginId) || {};

      // Validate configuration
      if (!plugin.validateConfig(pluginConfig)) {
        console.error(`Invalid configuration for plugin: ${pluginId}`);
        return false;
      }

      // Initialize plugin
      const success = await plugin.initialize(pluginConfig);
      if (!success) {
        console.error(`Failed to initialize plugin: ${pluginId}`);
        return false;
      }

      // Store plugin
      this.plugins.set(pluginId, plugin);
      this.pluginConfigs.set(pluginId, pluginConfig);

      // Save configuration
      this.saveConfigurations();

      console.log(`Plugin loaded successfully: ${pluginId}`);
      this.triggerHook('plugin:loaded', pluginId);

      return true;
    } catch (error) {
      console.error(`Failed to load plugin:`, error);
      return false;
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<boolean> {
    try {
      const plugin = this.plugins.get(pluginId);
      if (!plugin) {
        console.warn(`Plugin not loaded: ${pluginId}`);
        return false;
      }

      // Shutdown plugin
      await plugin.shutdown();

      // Remove from loaded plugins
      this.plugins.delete(pluginId);

      console.log(`Plugin unloaded: ${pluginId}`);
      this.triggerHook('plugin:unloaded', pluginId);

      return true;
    } catch (error) {
      console.error(`Failed to unload plugin ${pluginId}:`, error);
      return false;
    }
  }

  /**
   * Reload a plugin (hot-swap)
   */
  async reloadPlugin(pluginId: string, newPlugin: IPlugin): Promise<boolean> {
    const config = this.pluginConfigs.get(pluginId);
    await this.unloadPlugin(pluginId);
    return await this.loadPlugin(newPlugin, config);
  }

  /**
   * Get loaded plugin by ID
   */
  getPlugin(pluginId: string): IPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Get all plugins of specific type
   */
  getPluginsByType(type: PluginType): IPlugin[] {
    return Array.from(this.plugins.values()).filter(
      (plugin) => plugin.metadata.pluginType === type
    );
  }

  /**
   * Get all UI plugins for specific mount point
   */
  getUIPluginsForMount(mountPoint: string): IUIPlugin[] {
    return this.getPluginsByType(PluginType.UI)
      .filter((plugin) => {
        const uiPlugin = plugin as IUIPlugin;
        return uiPlugin.getMountPoint() === mountPoint;
      })
      .map((plugin) => plugin as IUIPlugin);
  }

  /**
   * List all loaded plugins
   */
  listPlugins(): Plugin[] {
    return Array.from(this.plugins.entries()).map(([id, plugin]) => ({
      metadata: plugin.metadata,
      status: PluginStatus.ACTIVE,
      config: this.pluginConfigs.get(id) || {},
      initialized: true,
    }));
  }

  /**
   * Update plugin configuration
   */
  async updatePluginConfig(
    pluginId: string,
    config: PluginConfig
  ): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      console.error(`Plugin not found: ${pluginId}`);
      return false;
    }

    // Validate new configuration
    if (!plugin.validateConfig(config)) {
      console.error(`Invalid configuration for plugin: ${pluginId}`);
      return false;
    }

    // Update configuration
    this.pluginConfigs.set(pluginId, config);
    this.saveConfigurations();

    // Reload plugin with new config
    await this.unloadPlugin(pluginId);
    await this.loadPlugin(plugin, config);

    return true;
  }

  /**
   * Register event hook
   */
  registerHook(event: string, callback: (...args: any[]) => any): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event)!.push(callback);
    console.log(`Hook registered: ${event}`);
  }

  /**
   * Trigger event hooks
   */
  private triggerHook(event: string, ...args: any[]): void {
    const callbacks = this.hooks.get(event);
    if (!callbacks) {
      return;
    }

    callbacks.forEach((callback) => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Hook callback failed for ${event}:`, error);
      }
    });
  }

  /**
   * Shutdown plugin manager and all plugins
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down plugin manager...');

    for (const pluginId of Array.from(this.plugins.keys())) {
      await this.unloadPlugin(pluginId);
    }

    this.initialized = false;
    console.log('Plugin manager shutdown complete');
  }
}

// Global plugin manager instance
export const pluginManager = new PluginManager();

// Export hook for React integration
export function usePlugins(mountPoint?: string) {
  const [plugins, setPlugins] = React.useState<IUIPlugin[]>([]);

  React.useEffect(() => {
    if (mountPoint) {
      const uiPlugins = pluginManager.getUIPluginsForMount(mountPoint);
      setPlugins(uiPlugins);
    }

    // Re-render when plugins change
    const handlePluginChange = () => {
      if (mountPoint) {
        const uiPlugins = pluginManager.getUIPluginsForMount(mountPoint);
        setPlugins(uiPlugins);
      }
    };

    pluginManager.registerHook('plugin:loaded', handlePluginChange);
    pluginManager.registerHook('plugin:unloaded', handlePluginChange);
  }, [mountPoint]);

  return plugins;
}

// React component for rendering plugin mount points
export interface PluginMountProps {
  mountPoint: string;
  fallback?: React.ReactNode;
}

export function PluginMount({ mountPoint, fallback }: PluginMountProps) {
  const plugins = usePlugins(mountPoint);

  if (plugins.length === 0) {
    return fallback || null;
  }

  return (
    <>
      {plugins.map((plugin) => {
        const Component = plugin.getComponent();
        const props = plugin.getProps?.() || {};
        return (
          <Component
            key={plugin.metadata.id}
            {...props}
          />
        );
      })}
    </>
  );
}

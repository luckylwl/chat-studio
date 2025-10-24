# AI Chat Studio - Plugin System

## Overview

The AI Chat Studio plugin system provides a flexible, extensible architecture for adding custom functionality without modifying core code.

## Features

- **Dynamic Loading**: Load plugins at runtime without restarting
- **Hot-Swap Support**: Reload plugins without downtime
- **Type System**: Multiple plugin types (Provider, Tool, Middleware, Export, UI)
- **Dependency Management**: Automatic dependency resolution
- **Configuration Management**: JSON-based configuration with validation
- **Event Hooks**: Subscribe to plugin lifecycle events
- **API Integration**: RESTful API for plugin management

## Plugin Types

### 1. Provider Plugins
AI provider integrations (OpenAI, Anthropic, Cohere, etc.)

```python
from backend.plugins.base_plugin import ProviderPlugin

class MyProviderPlugin(ProviderPlugin):
    async def chat_completion(self, messages, model, **kwargs):
        # Implement chat completion
        pass
```

### 2. Tool Plugins
External tools and utilities (web search, calculator, etc.)

```python
from backend.plugins.base_plugin import ToolPlugin

class MyToolPlugin(ToolPlugin):
    async def execute(self, action, parameters):
        # Implement tool action
        pass
```

### 3. Middleware Plugins
Request/response processing

```python
from backend.plugins.base_plugin import MiddlewarePlugin

class MyMiddlewarePlugin(MiddlewarePlugin):
    async def before_request(self, request):
        # Process request
        return modified_request

    async def after_response(self, response):
        # Process response
        return modified_response
```

### 4. Export Plugins
Custom export formats

```python
from backend.plugins.base_plugin import ExportPlugin

class MyExportPlugin(ExportPlugin):
    async def export(self, data, output_path=None):
        # Export data to custom format
        return bytes_data
```

### 5. UI Plugins (Frontend)
React components and UI extensions

```typescript
import { IUIPlugin, PluginType } from '@/plugins/pluginSystem';

class MyUIPlugin implements IUIPlugin {
  getComponent() {
    return MyReactComponent;
  }

  getMountPoint() {
    return 'sidebar'; // or 'toolbar', 'chat-input', etc.
  }
}
```

## Creating a Plugin

### 1. Create Plugin Directory

```bash
backend/plugins/installed/my-plugin/
├── plugin.py          # Main plugin code
├── __init__.py        # Python package init
├── config.json        # Default configuration
└── README.md          # Plugin documentation
```

### 2. Implement Plugin Class

```python
"""
My Custom Plugin
"""

from backend.plugins.base_plugin import BasePlugin, PluginMetadata, PluginType

class MyPlugin(BasePlugin):
    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            id="my-plugin",
            name="My Custom Plugin",
            version="1.0.0",
            author="Your Name",
            description="Plugin description",
            plugin_type=PluginType.TOOL,
            dependencies=[],
            config_schema={
                "api_key": {
                    "type": "string",
                    "required": True,
                    "description": "API key"
                }
            },
            tags=["tool", "utility"]
        )

    async def initialize(self) -> bool:
        """Initialize plugin"""
        try:
            # Setup code here
            return True
        except Exception as e:
            print(f"Failed to initialize: {e}")
            return False

    async def shutdown(self):
        """Clean up resources"""
        pass
```

### 3. Add Configuration

Create `config.json` in your plugin directory:

```json
{
  "enabled": true,
  "api_key": "your-api-key-here",
  "custom_setting": "value"
}
```

## Using the Plugin System

### Python (Backend)

```python
from backend.plugins.plugin_manager import plugin_manager

# Initialize plugin manager
await plugin_manager.initialize()

# Load a plugin
await plugin_manager.load_plugin("my-plugin", config={
    "api_key": "secret-key"
})

# Get plugin
plugin = plugin_manager.get_plugin("my-plugin")

# Execute plugin method
result = await plugin_manager.execute_plugin(
    "my-plugin",
    "execute",
    action="search",
    parameters={"query": "AI"}
)

# Unload plugin
await plugin_manager.unload_plugin("my-plugin")

# Hot-reload plugin
await plugin_manager.reload_plugin("my-plugin")
```

### TypeScript (Frontend)

```typescript
import { pluginManager, IUIPlugin } from '@/plugins/pluginSystem';

// Initialize plugin manager
await pluginManager.initialize();

// Load a plugin
const myPlugin = new MyPlugin();
await pluginManager.loadPlugin(myPlugin, {
  apiKey: 'secret-key'
});

// Get plugins by type
const uiPlugins = pluginManager.getPluginsByType(PluginType.UI);

// Unload plugin
await pluginManager.unloadPlugin('my-plugin');
```

### React Integration

```tsx
import { PluginMount } from '@/plugins/pluginSystem';

function ChatInterface() {
  return (
    <div>
      {/* Render plugins at specific mount points */}
      <PluginMount mountPoint="toolbar" />

      <div className="chat-area">
        {/* Chat content */}
      </div>

      <PluginMount mountPoint="chat-input" />
    </div>
  );
}
```

## API Endpoints

### List All Plugins
```
GET /api/plugins
```

### List Available Plugins
```
GET /api/plugins/available
```

### Get Plugin Details
```
GET /api/plugins/{plugin_id}
```

### Load Plugin
```
POST /api/plugins/load
{
  "plugin_id": "my-plugin",
  "config": {
    "api_key": "secret"
  }
}
```

### Unload Plugin
```
POST /api/plugins/{plugin_id}/unload
```

### Reload Plugin
```
POST /api/plugins/{plugin_id}/reload
```

### Update Plugin Config
```
PUT /api/plugins/{plugin_id}/config
{
  "config": {
    "api_key": "new-secret"
  }
}
```

### Execute Plugin Method
```
POST /api/plugins/execute
{
  "plugin_id": "my-plugin",
  "method": "execute",
  "args": [],
  "kwargs": {"action": "search"}
}
```

### Check System Health
```
GET /api/plugins/health
```

## Event Hooks

Subscribe to plugin lifecycle events:

```python
# Python
def on_plugin_loaded(plugin_id: str):
    print(f"Plugin loaded: {plugin_id}")

plugin_manager.register_hook("plugin_loaded", on_plugin_loaded)
plugin_manager.register_hook("plugin_unloaded", on_plugin_unloaded)
```

```typescript
// TypeScript
pluginManager.registerHook('plugin:loaded', (pluginId) => {
  console.log(`Plugin loaded: ${pluginId}`);
});

pluginManager.registerHook('plugin:unloaded', (pluginId) => {
  console.log(`Plugin unloaded: ${pluginId}`);
});
```

## Configuration Schema

Plugins can define a JSON schema for their configuration:

```python
config_schema={
    "api_key": {
        "type": "string",
        "required": True,
        "description": "API key for authentication"
    },
    "timeout": {
        "type": "integer",
        "required": False,
        "default": 30,
        "description": "Request timeout in seconds",
        "min": 1,
        "max": 300
    },
    "features": {
        "type": "array",
        "items": {"type": "string"},
        "description": "List of enabled features"
    }
}
```

## Best Practices

1. **Versioning**: Use semantic versioning (MAJOR.MINOR.PATCH)
2. **Dependencies**: Declare all plugin dependencies
3. **Error Handling**: Always handle errors gracefully
4. **Resource Cleanup**: Implement proper shutdown logic
5. **Documentation**: Provide clear README for each plugin
6. **Testing**: Test plugin initialization and core functionality
7. **Security**: Validate all inputs and sanitize outputs
8. **Performance**: Avoid blocking operations in initialize()

## Example Plugins

See `backend/plugins/installed/example_provider/` for a complete example.

## Troubleshooting

### Plugin Not Loading

1. Check plugin file exists: `backend/plugins/installed/{plugin-id}/plugin.py`
2. Verify plugin class inherits from BasePlugin
3. Check configuration is valid
4. Review logs for initialization errors

### Plugin Fails to Initialize

1. Validate configuration matches schema
2. Check all dependencies are loaded
3. Verify API keys and credentials
4. Review plugin logs

### Hot-Reload Not Working

1. Ensure plugin is properly unloaded first
2. Check no active references to plugin
3. Verify new plugin code is valid

## Security Considerations

- **API Keys**: Store sensitive data securely (environment variables, vault)
- **Input Validation**: Always validate plugin inputs
- **Sandboxing**: Consider running plugins in isolated environments
- **Permissions**: Implement plugin permission system for sensitive operations
- **Code Review**: Review third-party plugins before loading

## Performance

- Plugin initialization is asynchronous to avoid blocking
- Connection pooling for external services recommended
- Cache expensive operations
- Use lazy loading when possible

## Future Enhancements

- [ ] Plugin marketplace integration
- [ ] Automatic plugin updates
- [ ] Plugin sandboxing/isolation
- [ ] Permission system
- [ ] Plugin analytics
- [ ] Version compatibility checking
- [ ] Plugin signing/verification

## Support

For plugin development help:
- Documentation: See main project README
- Examples: Check `backend/plugins/installed/example_provider/`
- Issues: Report at project GitHub repository

---

**Generated by AI Chat Studio Plugin System**
**Version**: 1.0.0

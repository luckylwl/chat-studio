"""
API routes for plugin management
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from backend.plugins.plugin_manager import plugin_manager
from backend.plugins.base_plugin import PluginType

router = APIRouter(prefix="/api/plugins", tags=["plugins"])


# Request/Response Models
class PluginConfigUpdate(BaseModel):
    config: Dict[str, Any]


class PluginLoadRequest(BaseModel):
    plugin_id: str
    config: Optional[Dict[str, Any]] = None


class PluginExecuteRequest(BaseModel):
    plugin_id: str
    method: str
    args: List[Any] = []
    kwargs: Dict[str, Any] = {}


# Routes
@router.get("/")
async def list_plugins():
    """List all loaded plugins"""
    try:
        plugins = plugin_manager.list_plugins()
        return {
            "success": True,
            "plugins": plugins,
            "count": len(plugins)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/available")
async def list_available_plugins():
    """List all available plugins (loaded and discovered)"""
    try:
        plugins = plugin_manager.list_available_plugins()
        return {
            "success": True,
            "plugins": plugins,
            "count": len(plugins)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{plugin_id}")
async def get_plugin(plugin_id: str):
    """Get specific plugin details"""
    try:
        plugin = plugin_manager.get_plugin(plugin_id)
        if not plugin:
            raise HTTPException(status_code=404, detail="Plugin not found")

        return {
            "success": True,
            "plugin": plugin.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/type/{plugin_type}")
async def get_plugins_by_type(plugin_type: str):
    """Get all plugins of specific type"""
    try:
        # Validate plugin type
        try:
            ptype = PluginType(plugin_type)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid plugin type")

        plugins = plugin_manager.get_plugins_by_type(ptype)
        return {
            "success": True,
            "plugins": [p.to_dict() for p in plugins],
            "count": len(plugins)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/load")
async def load_plugin(request: PluginLoadRequest):
    """Load a plugin"""
    try:
        success = await plugin_manager.load_plugin(
            request.plugin_id,
            request.config
        )

        if not success:
            raise HTTPException(
                status_code=400,
                detail="Failed to load plugin"
            )

        return {
            "success": True,
            "message": f"Plugin {request.plugin_id} loaded successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{plugin_id}/unload")
async def unload_plugin(plugin_id: str):
    """Unload a plugin"""
    try:
        success = await plugin_manager.unload_plugin(plugin_id)

        if not success:
            raise HTTPException(
                status_code=400,
                detail="Failed to unload plugin"
            )

        return {
            "success": True,
            "message": f"Plugin {plugin_id} unloaded successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{plugin_id}/reload")
async def reload_plugin(plugin_id: str):
    """Reload a plugin (hot-swap)"""
    try:
        success = await plugin_manager.reload_plugin(plugin_id)

        if not success:
            raise HTTPException(
                status_code=400,
                detail="Failed to reload plugin"
            )

        return {
            "success": True,
            "message": f"Plugin {plugin_id} reloaded successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{plugin_id}/config")
async def update_plugin_config(plugin_id: str, request: PluginConfigUpdate):
    """Update plugin configuration"""
    try:
        plugin = plugin_manager.get_plugin(plugin_id)
        if not plugin:
            raise HTTPException(status_code=404, detail="Plugin not found")

        # Update configuration
        for key, value in request.config.items():
            plugin.set_config(key, value)

        # Validate new configuration
        if not await plugin.validate_config():
            raise HTTPException(
                status_code=400,
                detail="Invalid configuration"
            )

        # Save configuration
        plugin_manager.plugin_configs[plugin_id] = plugin.config
        await plugin_manager._save_configurations()

        return {
            "success": True,
            "message": "Configuration updated successfully",
            "config": plugin.config
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/execute")
async def execute_plugin(request: PluginExecuteRequest):
    """Execute plugin method"""
    try:
        result = await plugin_manager.execute_plugin(
            request.plugin_id,
            request.method,
            *request.args,
            **request.kwargs
        )

        return {
            "success": True,
            "result": result
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except AttributeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/discover")
async def discover_plugins():
    """Discover new plugins in plugins directory"""
    try:
        discovered = await plugin_manager.discover_plugins()

        return {
            "success": True,
            "discovered": discovered,
            "count": len(discovered)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def plugin_system_health():
    """Check plugin system health"""
    try:
        return {
            "success": True,
            "initialized": plugin_manager._initialized,
            "loaded_plugins": len(plugin_manager.plugins),
            "available_plugins": len(plugin_manager.plugin_classes),
            "plugins_dir": str(plugin_manager.plugins_dir)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

"""
Plugin Manager for AI Chat Studio
Handles plugin lifecycle: loading, initialization, execution, and unloading
"""

import os
import sys
import importlib
import importlib.util
from typing import Dict, List, Optional, Type, Any
import logging
import json
from pathlib import Path
import asyncio

from .base_plugin import (
    BasePlugin,
    PluginType,
    PluginStatus,
    PluginMetadata,
    ProviderPlugin,
    ToolPlugin,
    MiddlewarePlugin,
    ExportPlugin
)

logger = logging.getLogger(__name__)


class PluginManager:
    """
    Central plugin management system

    Features:
    - Dynamic plugin loading from directory
    - Plugin lifecycle management
    - Plugin dependency resolution
    - Hot-swap support
    - Configuration management
    - Event hooks
    """

    def __init__(self, plugins_dir: str = "./backend/plugins/installed"):
        """
        Initialize plugin manager

        Args:
            plugins_dir: Directory containing plugin packages
        """
        self.plugins_dir = Path(plugins_dir)
        self.plugins: Dict[str, BasePlugin] = {}
        self.plugin_classes: Dict[str, Type[BasePlugin]] = {}
        self.plugin_configs: Dict[str, Dict[str, Any]] = {}
        self._hooks: Dict[str, List[callable]] = {}
        self._initialized = False

    async def initialize(self):
        """Initialize plugin manager"""
        if self._initialized:
            return

        # Create plugins directory if not exists
        self.plugins_dir.mkdir(parents=True, exist_ok=True)

        # Load plugin configurations
        await self._load_configurations()

        # Discover and load plugins
        await self.discover_plugins()

        self._initialized = True
        logger.info("Plugin manager initialized")

    async def _load_configurations(self):
        """Load plugin configurations from config file"""
        config_file = self.plugins_dir / "config.json"
        if config_file.exists():
            try:
                with open(config_file, 'r') as f:
                    self.plugin_configs = json.load(f)
                logger.info(f"Loaded configurations for {len(self.plugin_configs)} plugins")
            except Exception as e:
                logger.error(f"Failed to load plugin configurations: {e}")

    async def _save_configurations(self):
        """Save plugin configurations to config file"""
        config_file = self.plugins_dir / "config.json"
        try:
            with open(config_file, 'w') as f:
                json.dump(self.plugin_configs, f, indent=2)
            logger.info("Plugin configurations saved")
        except Exception as e:
            logger.error(f"Failed to save plugin configurations: {e}")

    async def discover_plugins(self) -> List[str]:
        """
        Discover all plugins in plugins directory

        Returns:
            List of discovered plugin IDs
        """
        discovered = []

        if not self.plugins_dir.exists():
            logger.warning(f"Plugins directory not found: {self.plugins_dir}")
            return discovered

        # Scan for plugin directories
        for item in self.plugins_dir.iterdir():
            if item.is_dir() and not item.name.startswith('_'):
                plugin_file = item / "plugin.py"
                if plugin_file.exists():
                    try:
                        plugin_id = await self._load_plugin_from_file(plugin_file)
                        if plugin_id:
                            discovered.append(plugin_id)
                            logger.info(f"Discovered plugin: {plugin_id}")
                    except Exception as e:
                        logger.error(f"Failed to load plugin from {plugin_file}: {e}")

        return discovered

    async def _load_plugin_from_file(self, plugin_file: Path) -> Optional[str]:
        """
        Load plugin from file

        Args:
            plugin_file: Path to plugin.py file

        Returns:
            Plugin ID if successful
        """
        try:
            # Create module spec
            spec = importlib.util.spec_from_file_location(
                f"plugin_{plugin_file.parent.name}",
                plugin_file
            )

            if not spec or not spec.loader:
                raise ImportError(f"Failed to create module spec for {plugin_file}")

            # Load module
            module = importlib.util.module_from_spec(spec)
            sys.modules[spec.name] = module
            spec.loader.exec_module(module)

            # Find plugin class (must inherit from BasePlugin)
            plugin_class = None
            for attr_name in dir(module):
                attr = getattr(module, attr_name)
                if (isinstance(attr, type) and
                    issubclass(attr, BasePlugin) and
                    attr is not BasePlugin):
                    plugin_class = attr
                    break

            if not plugin_class:
                raise ImportError(f"No plugin class found in {plugin_file}")

            # Get plugin metadata
            temp_instance = plugin_class()
            metadata = temp_instance.metadata

            # Store plugin class
            self.plugin_classes[metadata.id] = plugin_class

            # Load plugin if enabled
            config = self.plugin_configs.get(metadata.id, {})
            if config.get("enabled", True):
                await self.load_plugin(metadata.id, config)

            return metadata.id

        except Exception as e:
            logger.error(f"Failed to load plugin from {plugin_file}: {e}")
            return None

    async def load_plugin(
        self,
        plugin_id: str,
        config: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Load and initialize plugin

        Args:
            plugin_id: Plugin ID
            config: Plugin configuration

        Returns:
            bool: True if successful
        """
        try:
            if plugin_id in self.plugins:
                logger.warning(f"Plugin {plugin_id} already loaded")
                return True

            # Get plugin class
            plugin_class = self.plugin_classes.get(plugin_id)
            if not plugin_class:
                logger.error(f"Plugin class not found: {plugin_id}")
                return False

            # Create plugin instance
            plugin = plugin_class(config or {})
            plugin.set_status(PluginStatus.LOADING)

            # Validate configuration
            if not await plugin.validate_config():
                logger.error(f"Invalid configuration for plugin: {plugin_id}")
                plugin.set_status(PluginStatus.ERROR)
                return False

            # Check dependencies
            if not await self._check_dependencies(plugin):
                logger.error(f"Missing dependencies for plugin: {plugin_id}")
                plugin.set_status(PluginStatus.ERROR)
                return False

            # Initialize plugin
            if not await plugin.initialize():
                logger.error(f"Failed to initialize plugin: {plugin_id}")
                plugin.set_status(PluginStatus.ERROR)
                return False

            # Mark as active
            plugin.set_status(PluginStatus.ACTIVE)
            plugin._initialized = True

            # Store plugin
            self.plugins[plugin_id] = plugin

            # Save configuration
            self.plugin_configs[plugin_id] = plugin.config
            self.plugin_configs[plugin_id]["enabled"] = True
            await self._save_configurations()

            logger.info(f"Plugin loaded successfully: {plugin_id}")
            await self._trigger_hook("plugin_loaded", plugin_id)

            return True

        except Exception as e:
            logger.error(f"Failed to load plugin {plugin_id}: {e}")
            return False

    async def unload_plugin(self, plugin_id: str) -> bool:
        """
        Unload plugin

        Args:
            plugin_id: Plugin ID

        Returns:
            bool: True if successful
        """
        try:
            plugin = self.plugins.get(plugin_id)
            if not plugin:
                logger.warning(f"Plugin not loaded: {plugin_id}")
                return False

            # Shutdown plugin
            await plugin.shutdown()
            plugin.set_status(PluginStatus.INACTIVE)

            # Remove from loaded plugins
            del self.plugins[plugin_id]

            # Update configuration
            if plugin_id in self.plugin_configs:
                self.plugin_configs[plugin_id]["enabled"] = False
                await self._save_configurations()

            logger.info(f"Plugin unloaded: {plugin_id}")
            await self._trigger_hook("plugin_unloaded", plugin_id)

            return True

        except Exception as e:
            logger.error(f"Failed to unload plugin {plugin_id}: {e}")
            return False

    async def reload_plugin(self, plugin_id: str) -> bool:
        """
        Reload plugin (hot-swap)

        Args:
            plugin_id: Plugin ID

        Returns:
            bool: True if successful
        """
        config = None
        if plugin_id in self.plugins:
            config = self.plugins[plugin_id].config
            await self.unload_plugin(plugin_id)

        return await self.load_plugin(plugin_id, config)

    async def _check_dependencies(self, plugin: BasePlugin) -> bool:
        """
        Check if plugin dependencies are satisfied

        Args:
            plugin: Plugin instance

        Returns:
            bool: True if all dependencies satisfied
        """
        dependencies = plugin.metadata.dependencies
        for dep in dependencies:
            if dep not in self.plugins:
                logger.error(f"Missing dependency: {dep}")
                return False
        return True

    def get_plugin(self, plugin_id: str) -> Optional[BasePlugin]:
        """Get loaded plugin by ID"""
        return self.plugins.get(plugin_id)

    def get_plugins_by_type(self, plugin_type: PluginType) -> List[BasePlugin]:
        """Get all loaded plugins of specific type"""
        return [
            plugin for plugin in self.plugins.values()
            if plugin.metadata.plugin_type == plugin_type
        ]

    def list_plugins(self) -> List[Dict[str, Any]]:
        """List all loaded plugins"""
        return [plugin.to_dict() for plugin in self.plugins.values()]

    def list_available_plugins(self) -> List[Dict[str, Any]]:
        """List all available plugins (loaded and discovered)"""
        available = []
        for plugin_id, plugin_class in self.plugin_classes.items():
            temp_instance = plugin_class()
            metadata = temp_instance.metadata
            available.append({
                "id": plugin_id,
                "metadata": metadata.to_dict(),
                "loaded": plugin_id in self.plugins,
                "enabled": self.plugin_configs.get(plugin_id, {}).get("enabled", True)
            })
        return available

    async def execute_plugin(
        self,
        plugin_id: str,
        method: str,
        *args,
        **kwargs
    ) -> Any:
        """
        Execute plugin method

        Args:
            plugin_id: Plugin ID
            method: Method name
            *args: Method arguments
            **kwargs: Method keyword arguments

        Returns:
            Method result
        """
        plugin = self.get_plugin(plugin_id)
        if not plugin:
            raise ValueError(f"Plugin not found: {plugin_id}")

        if not hasattr(plugin, method):
            raise AttributeError(f"Plugin {plugin_id} has no method: {method}")

        method_func = getattr(plugin, method)
        if asyncio.iscoroutinefunction(method_func):
            return await method_func(*args, **kwargs)
        else:
            return method_func(*args, **kwargs)

    def register_hook(self, event: str, callback: callable):
        """
        Register event hook

        Args:
            event: Event name
            callback: Callback function
        """
        if event not in self._hooks:
            self._hooks[event] = []
        self._hooks[event].append(callback)
        logger.debug(f"Hook registered: {event}")

    async def _trigger_hook(self, event: str, *args, **kwargs):
        """
        Trigger event hooks

        Args:
            event: Event name
            *args: Event arguments
            **kwargs: Event keyword arguments
        """
        if event not in self._hooks:
            return

        for callback in self._hooks[event]:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(*args, **kwargs)
                else:
                    callback(*args, **kwargs)
            except Exception as e:
                logger.error(f"Hook callback failed for {event}: {e}")

    async def shutdown(self):
        """Shutdown plugin manager and all plugins"""
        logger.info("Shutting down plugin manager...")

        for plugin_id in list(self.plugins.keys()):
            await self.unload_plugin(plugin_id)

        self._initialized = False
        logger.info("Plugin manager shutdown complete")


# Global plugin manager instance
plugin_manager = PluginManager()

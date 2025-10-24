"""
Base Plugin Class for AI Chat Studio Plugin System
Provides abstract interface for all plugins
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import json


class PluginType(str, Enum):
    """Plugin types"""
    PROVIDER = "provider"  # AI provider plugins (OpenAI, Anthropic, etc.)
    TOOL = "tool"  # Tool plugins (web search, calculator, etc.)
    MIDDLEWARE = "middleware"  # Request/response middleware
    UI = "ui"  # UI component plugins
    EXPORT = "export"  # Export format plugins
    STORAGE = "storage"  # Storage backend plugins


class PluginStatus(str, Enum):
    """Plugin status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    LOADING = "loading"


@dataclass
class PluginMetadata:
    """Plugin metadata"""
    id: str
    name: str
    version: str
    author: str
    description: str
    plugin_type: PluginType
    dependencies: List[str]
    config_schema: Dict[str, Any]
    homepage: Optional[str] = None
    repository: Optional[str] = None
    license: Optional[str] = "MIT"
    tags: List[str] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []

    def to_dict(self) -> Dict[str, Any]:
        """Convert metadata to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "author": self.author,
            "description": self.description,
            "plugin_type": self.plugin_type.value,
            "dependencies": self.dependencies,
            "config_schema": self.config_schema,
            "homepage": self.homepage,
            "repository": self.repository,
            "license": self.license,
            "tags": self.tags
        }


class BasePlugin(ABC):
    """
    Abstract base class for all plugins

    All plugins must inherit from this class and implement required methods
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize plugin

        Args:
            config: Plugin configuration dictionary
        """
        self.config = config or {}
        self.status = PluginStatus.INACTIVE
        self._metadata: Optional[PluginMetadata] = None
        self._initialized = False

    @property
    @abstractmethod
    def metadata(self) -> PluginMetadata:
        """
        Plugin metadata

        Must be implemented by each plugin to provide:
        - Plugin ID (unique identifier)
        - Name
        - Version (semantic versioning)
        - Author
        - Description
        - Plugin type
        - Dependencies
        - Configuration schema
        """
        pass

    @abstractmethod
    async def initialize(self) -> bool:
        """
        Initialize plugin

        Called when plugin is loaded
        Perform setup tasks like:
        - Validate configuration
        - Initialize connections
        - Load resources
        - Register hooks

        Returns:
            bool: True if initialization successful
        """
        pass

    @abstractmethod
    async def shutdown(self):
        """
        Shutdown plugin gracefully

        Called when plugin is unloaded
        Perform cleanup tasks like:
        - Close connections
        - Save state
        - Release resources
        """
        pass

    async def validate_config(self) -> bool:
        """
        Validate plugin configuration against schema

        Returns:
            bool: True if configuration is valid
        """
        schema = self.metadata.config_schema
        if not schema:
            return True

        # Basic validation (can be extended with jsonschema)
        for key, field_schema in schema.items():
            required = field_schema.get("required", False)
            if required and key not in self.config:
                return False

        return True

    def get_config(self, key: str, default: Any = None) -> Any:
        """
        Get configuration value

        Args:
            key: Configuration key
            default: Default value if key not found

        Returns:
            Configuration value or default
        """
        return self.config.get(key, default)

    def set_config(self, key: str, value: Any):
        """
        Set configuration value

        Args:
            key: Configuration key
            value: Configuration value
        """
        self.config[key] = value

    def get_status(self) -> PluginStatus:
        """Get plugin status"""
        return self.status

    def set_status(self, status: PluginStatus):
        """Set plugin status"""
        self.status = status

    def is_initialized(self) -> bool:
        """Check if plugin is initialized"""
        return self._initialized

    def to_dict(self) -> Dict[str, Any]:
        """
        Convert plugin to dictionary representation

        Returns:
            Dictionary with plugin info
        """
        return {
            "metadata": self.metadata.to_dict(),
            "status": self.status.value,
            "config": self.config,
            "initialized": self._initialized
        }


class ProviderPlugin(BasePlugin):
    """Base class for AI provider plugins"""

    @abstractmethod
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Send chat completion request

        Args:
            messages: List of message dictionaries
            model: Model name
            **kwargs: Additional provider-specific parameters

        Returns:
            Response dictionary with completion
        """
        pass

    @abstractmethod
    async def stream_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        **kwargs
    ):
        """
        Stream chat completion

        Args:
            messages: List of message dictionaries
            model: Model name
            **kwargs: Additional provider-specific parameters

        Yields:
            Response chunks
        """
        pass

    @abstractmethod
    def get_available_models(self) -> List[Dict[str, Any]]:
        """
        Get list of available models

        Returns:
            List of model dictionaries with metadata
        """
        pass


class ToolPlugin(BasePlugin):
    """Base class for tool plugins"""

    @abstractmethod
    async def execute(
        self,
        action: str,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute tool action

        Args:
            action: Action to execute
            parameters: Action parameters

        Returns:
            Execution result
        """
        pass

    @abstractmethod
    def get_actions(self) -> List[Dict[str, Any]]:
        """
        Get available actions

        Returns:
            List of action definitions
        """
        pass


class MiddlewarePlugin(BasePlugin):
    """Base class for middleware plugins"""

    @abstractmethod
    async def before_request(
        self,
        request: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process request before sending to AI

        Args:
            request: Request dictionary

        Returns:
            Modified request
        """
        pass

    @abstractmethod
    async def after_response(
        self,
        response: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process response after receiving from AI

        Args:
            response: Response dictionary

        Returns:
            Modified response
        """
        pass


class ExportPlugin(BasePlugin):
    """Base class for export plugins"""

    @abstractmethod
    async def export(
        self,
        data: Dict[str, Any],
        output_path: Optional[str] = None
    ) -> bytes:
        """
        Export data to specific format

        Args:
            data: Data to export
            output_path: Optional output file path

        Returns:
            Exported data as bytes
        """
        pass

    @abstractmethod
    def get_file_extension(self) -> str:
        """
        Get file extension for this export format

        Returns:
            File extension (e.g., 'pdf', 'xlsx')
        """
        pass

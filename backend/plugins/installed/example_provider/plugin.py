"""
Example Provider Plugin
Demonstrates how to create a custom AI provider plugin
"""

from typing import Dict, Any, List
import asyncio
from backend.plugins.base_plugin import ProviderPlugin, PluginMetadata, PluginType


class ExampleProviderPlugin(ProviderPlugin):
    """
    Example AI provider plugin

    This demonstrates how to integrate a custom AI provider
    """

    @property
    def metadata(self) -> PluginMetadata:
        return PluginMetadata(
            id="example-provider",
            name="Example AI Provider",
            version="1.0.0",
            author="AI Chat Studio",
            description="Example plugin demonstrating custom AI provider integration",
            plugin_type=PluginType.PROVIDER,
            dependencies=[],
            config_schema={
                "api_key": {
                    "type": "string",
                    "required": True,
                    "description": "API key for the provider"
                },
                "api_base": {
                    "type": "string",
                    "required": False,
                    "default": "https://api.example.com/v1",
                    "description": "API base URL"
                },
                "timeout": {
                    "type": "integer",
                    "required": False,
                    "default": 30,
                    "description": "Request timeout in seconds"
                }
            },
            homepage="https://example.com",
            repository="https://github.com/example/plugin",
            tags=["ai", "provider", "example"]
        )

    async def initialize(self) -> bool:
        """Initialize the provider"""
        try:
            # Validate API key
            api_key = self.get_config("api_key")
            if not api_key:
                raise ValueError("API key is required")

            # Setup client
            self.api_base = self.get_config("api_base", "https://api.example.com/v1")
            self.timeout = self.get_config("timeout", 30)

            # Test connection (optional)
            # await self._test_connection()

            return True
        except Exception as e:
            print(f"Failed to initialize example provider: {e}")
            return False

    async def shutdown(self):
        """Shutdown the provider"""
        # Clean up resources
        pass

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
            **kwargs: Additional parameters

        Returns:
            Response dictionary
        """
        # Example implementation
        # In real plugin, this would call the actual API

        # Simulate API call
        await asyncio.sleep(0.1)

        return {
            "id": "example-123",
            "model": model,
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": "This is a response from the example provider plugin."
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": 10,
                "completion_tokens": 15,
                "total_tokens": 25
            }
        }

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
            **kwargs: Additional parameters

        Yields:
            Response chunks
        """
        # Example streaming implementation
        response_text = "This is a streaming response from the example provider."

        for word in response_text.split():
            await asyncio.sleep(0.05)
            yield {
                "id": "example-stream-123",
                "model": model,
                "choices": [{
                    "delta": {
                        "content": word + " "
                    },
                    "finish_reason": None
                }]
            }

        # Final chunk
        yield {
            "id": "example-stream-123",
            "model": model,
            "choices": [{
                "delta": {},
                "finish_reason": "stop"
            }]
        }

    def get_available_models(self) -> List[Dict[str, Any]]:
        """Get list of available models"""
        return [
            {
                "id": "example-model-1",
                "name": "Example Model 1",
                "description": "Fast and efficient model",
                "context_window": 4096,
                "max_tokens": 2048
            },
            {
                "id": "example-model-2",
                "name": "Example Model 2",
                "description": "Advanced reasoning model",
                "context_window": 8192,
                "max_tokens": 4096
            }
        ]

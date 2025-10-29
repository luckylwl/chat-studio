/**
 * Local Model Manager Component
 *
 * UI for managing local AI models:
 * - Browse available models
 * - Download/delete models
 * - Configure providers (Ollama, LM Studio, WebLLM)
 * - Test models
 */

import React, { useState, useEffect } from 'react';
import localModelService, {
  LocalModel,
  ModelProvider,
  ModelDownloadProgress,
} from '../services/localModelService';

// Icons (using simple Unicode for now)
const Icons = {
  Download: () => <span>⬇️</span>,
  Trash: () => <span>🗑️</span>,
  Play: () => <span>▶️</span>,
  Check: () => <span>✅</span>,
  Warning: () => <span>⚠️</span>,
  Settings: () => <span>⚙️</span>,
  Refresh: () => <span>🔄</span>,
};

interface ProviderStatus {
  ollama: boolean;
  webllm: boolean;
  lmstudio: boolean;
}

export const LocalModelManager: React.FC = () => {
  const [models, setModels] = useState<LocalModel[]>([]);
  const [providers, setProviders] = useState<ProviderStatus>({
    ollama: false,
    webllm: false,
    lmstudio: false,
  });
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider>('ollama');
  const [downloadProgress, setDownloadProgress] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Configuration state
  const [ollamaEndpoint, setOllamaEndpoint] = useState('http://localhost:11434');
  const [lmStudioEndpoint, setLMStudioEndpoint] = useState('http://localhost:1234');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadModels();
  }, [selectedProvider]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Detect available providers
      const availableProviders = await localModelService.detectAvailableProviders();
      setProviders(availableProviders);

      // Load configuration
      const ollamaConfig = localModelService.getOllamaConfig();
      const lmStudioConfig = localModelService.getLMStudioConfig();
      setOllamaEndpoint(ollamaConfig.endpoint);
      setLMStudioEndpoint(lmStudioConfig.endpoint);

      // Select first available provider
      if (availableProviders.ollama) {
        setSelectedProvider('ollama');
      } else if (availableProviders.lmstudio) {
        setSelectedProvider('lmstudio');
      } else if (availableProviders.webllm) {
        setSelectedProvider('webllm');
      }

      await loadModels();
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadModels = async () => {
    try {
      const allModels = await localModelService.listModels(selectedProvider);
      const installedModels = await localModelService.getInstalledModels(selectedProvider);
      const installedIds = new Set(installedModels.map(m => m.id));

      // Merge installed status
      const updatedModels = allModels.map(model => ({
        ...model,
        isDownloaded: installedIds.has(model.id),
      }));

      setModels(updatedModels);
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };

  const handleDownloadModel = async (modelId: string) => {
    try {
      await localModelService.downloadModel(modelId, (progress: ModelDownloadProgress) => {
        setDownloadProgress(prev => new Map(prev).set(modelId, progress.progress));
      });

      // Refresh model list
      await loadModels();
    } catch (error) {
      console.error('Failed to download model:', error);
      alert(`Failed to download model: ${error}`);
    } finally {
      setDownloadProgress(prev => {
        const newMap = new Map(prev);
        newMap.delete(modelId);
        return newMap;
      });
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to delete this model?')) {
      return;
    }

    try {
      await localModelService.deleteModel(modelId);
      await loadModels();
    } catch (error) {
      console.error('Failed to delete model:', error);
      alert(`Failed to delete model: ${error}`);
    }
  };

  const handleSaveSettings = () => {
    localModelService.setOllamaConfig({ endpoint: ollamaEndpoint });
    localModelService.setLMStudioConfig({ endpoint: lmStudioEndpoint });
    setShowSettings(false);
    loadData(); // Re-check providers
  };

  const getProviderBadge = (provider: ModelProvider) => {
    const colors = {
      ollama: 'bg-blue-100 text-blue-800',
      webllm: 'bg-green-100 text-green-800',
      lmstudio: 'bg-purple-100 text-purple-800',
      transformers: 'bg-orange-100 text-orange-800',
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[provider]}`}>
        {provider.toUpperCase()}
      </span>
    );
  };

  const getSizeBadge = (sizeInGB: number) => {
    const color = sizeInGB < 2 ? 'bg-green-100 text-green-800' :
                  sizeInGB < 5 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800';

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${color}`}>
        {sizeInGB.toFixed(1)} GB
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading models...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Local Models</h1>
          <p className="text-gray-600 mt-1">
            Run AI models locally for privacy and zero cost
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
          >
            <Icons.Refresh /> Refresh
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-2"
          >
            <Icons.Settings /> Settings
          </button>
        </div>
      </div>

      {/* Provider Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Provider Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">Ollama</div>
              <div className="text-sm text-gray-600">Desktop AI runtime</div>
            </div>
            {providers.ollama ? (
              <Icons.Check />
            ) : (
              <Icons.Warning />
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">WebLLM</div>
              <div className="text-sm text-gray-600">Browser AI (WebGPU)</div>
            </div>
            {providers.webllm ? (
              <Icons.Check />
            ) : (
              <Icons.Warning />
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium">LM Studio</div>
              <div className="text-sm text-gray-600">GUI model runner</div>
            </div>
            {providers.lmstudio ? (
              <Icons.Check />
            ) : (
              <Icons.Warning />
            )}
          </div>
        </div>

        {!providers.ollama && !providers.webllm && !providers.lmstudio && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 font-medium">No providers available</p>
            <p className="text-yellow-700 text-sm mt-1">
              Install Ollama or LM Studio to run local models, or use a WebGPU-compatible browser.
            </p>
            <div className="mt-2 flex gap-4">
              <a
                href="https://ollama.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Download Ollama →
              </a>
              <a
                href="https://lmstudio.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Download LM Studio →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ollama Endpoint
              </label>
              <input
                type="text"
                value={ollamaEndpoint}
                onChange={(e) => setOllamaEndpoint(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="http://localhost:11434"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LM Studio Endpoint
              </label>
              <input
                type="text"
                value={lmStudioEndpoint}
                onChange={(e) => setLMStudioEndpoint(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="http://localhost:1234"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Settings
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provider Tabs */}
      <div className="mb-6">
        <div className="flex gap-2 border-b">
          {(['ollama', 'webllm', 'lmstudio'] as ModelProvider[]).map(provider => (
            <button
              key={provider}
              onClick={() => setSelectedProvider(provider)}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                selectedProvider === provider
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              disabled={!providers[provider]}
            >
              {provider.charAt(0).toUpperCase() + provider.slice(1)}
              {!providers[provider] && ' (Unavailable)'}
            </button>
          ))}
        </div>
      </div>

      {/* Model List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Available Models</h2>

          {models.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No models available for this provider
            </div>
          ) : (
            <div className="space-y-4">
              {models.map(model => {
                const progress = downloadProgress.get(model.id);
                const isDownloading = progress !== undefined;

                return (
                  <div
                    key={model.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{model.displayName}</h3>
                          {getProviderBadge(model.provider)}
                          {getSizeBadge(model.sizeInGB)}
                          {model.isDownloaded && (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              Installed
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">{model.parameters}</span> parameters •{' '}
                          <span>{model.quantization}</span> quantization •{' '}
                          <span>{model.context_length.toLocaleString()} context</span>
                        </div>

                        <div className="text-sm text-gray-500">
                          {model.metadata.family} v{model.metadata.version} •{' '}
                          {model.metadata.license}
                        </div>

                        <div className="flex gap-2 mt-2">
                          {model.capabilities.chat && (
                            <span className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                              Chat
                            </span>
                          )}
                          {model.capabilities.completion && (
                            <span className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded">
                              Completion
                            </span>
                          )}
                          {model.capabilities.embedding && (
                            <span className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded">
                              Embedding
                            </span>
                          )}
                          {model.capabilities.vision && (
                            <span className="px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded">
                              Vision
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="ml-4 flex gap-2">
                        {model.isDownloaded ? (
                          <>
                            <button
                              onClick={() => handleDeleteModel(model.id)}
                              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg flex items-center gap-2"
                            >
                              <Icons.Trash /> Delete
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDownloadModel(model.id)}
                            disabled={isDownloading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Icons.Download /> {isDownloading ? 'Downloading...' : 'Download'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Download Progress */}
                    {isDownloading && progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Downloading...</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Getting Started</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Ollama</strong>: Best for desktop use, easy installation</li>
          <li>• <strong>WebLLM</strong>: Runs entirely in browser using WebGPU</li>
          <li>• <strong>LM Studio</strong>: GUI-based model manager with local server</li>
          <li>• Smaller models (1B-3B) are faster but less capable</li>
          <li>• 4-bit quantization reduces size with minimal quality loss</li>
        </ul>
      </div>
    </div>
  );
};

export default LocalModelManager;

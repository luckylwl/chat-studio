import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiDownload, FiPlay, FiPause, FiTrash2, FiRefreshCw, FiHardDrive, FiWifi, FiSettings, FiInfo, FiMonitor } from 'react-icons/fi'

interface OllamaModel {
  name: string
  size: string
  modified: string
  digest: string
  details?: {
    format: string
    family: string
    families?: string[]
    parameter_size: string
    quantization_level: string
  }
}

interface ModelInfo {
  name: string
  description: string
  size: string
  parameters: string
  tags: string[]
  capabilities: string[]
  requirements: {
    memory: string
    disk: string
    cpu: string
  }
}

const POPULAR_MODELS: ModelInfo[] = [
  {
    name: 'llama3.2:3b',
    description: 'Meta Llama 3.2 3B - Fast, efficient model for general tasks',
    size: '2.0 GB',
    parameters: '3B',
    tags: ['general', 'fast', 'efficient'],
    capabilities: ['Text Generation', 'Conversation', 'Q&A', 'Code Understanding'],
    requirements: { memory: '4 GB', disk: '2 GB', cpu: 'Any' }
  },
  {
    name: 'llama3.2:1b',
    description: 'Meta Llama 3.2 1B - Ultra-lightweight model',
    size: '1.3 GB',
    parameters: '1B',
    tags: ['lightweight', 'mobile', 'edge'],
    capabilities: ['Text Generation', 'Simple Q&A', 'Basic Tasks'],
    requirements: { memory: '2 GB', disk: '1.5 GB', cpu: 'Any' }
  },
  {
    name: 'llama3.1:8b',
    description: 'Meta Llama 3.1 8B - Balanced performance and capability',
    size: '4.7 GB',
    parameters: '8B',
    tags: ['balanced', 'versatile', 'recommended'],
    capabilities: ['Advanced Text Generation', 'Code Generation', 'Analysis', 'Reasoning'],
    requirements: { memory: '8 GB', disk: '5 GB', cpu: 'Modern CPU' }
  },
  {
    name: 'llama3.1:70b',
    description: 'Meta Llama 3.1 70B - Powerful model for complex tasks',
    size: '40 GB',
    parameters: '70B',
    tags: ['powerful', 'professional', 'advanced'],
    capabilities: ['Complex Reasoning', 'Advanced Code Generation', 'Research', 'Analysis'],
    requirements: { memory: '64 GB', disk: '45 GB', cpu: 'High-end CPU' }
  },
  {
    name: 'codellama:7b',
    description: 'Code Llama 7B - Specialized for code generation',
    size: '3.8 GB',
    parameters: '7B',
    tags: ['coding', 'development', 'programming'],
    capabilities: ['Code Generation', 'Code Completion', 'Bug Fixing', 'Code Explanation'],
    requirements: { memory: '8 GB', disk: '4 GB', cpu: 'Modern CPU' }
  },
  {
    name: 'mistral:7b',
    description: 'Mistral 7B - High-performance open model',
    size: '4.1 GB',
    parameters: '7B',
    tags: ['performance', 'multilingual', 'efficient'],
    capabilities: ['Multilingual Text', 'Reasoning', 'Code Understanding', 'Math'],
    requirements: { memory: '8 GB', disk: '5 GB', cpu: 'Modern CPU' }
  },
  {
    name: 'gemma2:9b',
    description: 'Google Gemma 2 9B - Advanced reasoning capabilities',
    size: '5.4 GB',
    parameters: '9B',
    tags: ['reasoning', 'google', 'advanced'],
    capabilities: ['Advanced Reasoning', 'Math', 'Science', 'Logical Thinking'],
    requirements: { memory: '12 GB', disk: '6 GB', cpu: 'Modern CPU' }
  },
  {
    name: 'qwen2.5:7b',
    description: 'Qwen 2.5 7B - Alibaba\'s multilingual model',
    size: '4.4 GB',
    parameters: '7B',
    tags: ['multilingual', 'chinese', 'alibaba'],
    capabilities: ['Chinese/English', 'Code Generation', 'Math', 'Reasoning'],
    requirements: { memory: '8 GB', disk: '5 GB', cpu: 'Modern CPU' }
  }
]

export default function LocalLLMSupport() {
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'running' | 'stopped' | 'not-installed'>('checking')
  const [installedModels, setInstalledModels] = useState<OllamaModel[]>([])
  const [downloadingModels, setDownloadingModels] = useState<Set<string>>(new Set())
  const [selectedTab, setSelectedTab] = useState<'models' | 'install' | 'settings'>('models')
  const [ollamaVersion, setOllamaVersion] = useState<string>('')
  const [systemInfo, setSystemInfo] = useState<{
    memory: string
    disk: string
    cpu: string
  }>({ memory: '', disk: '', cpu: '' })
  const [settings, setSettings] = useState({
    port: 11434,
    host: 'localhost',
    gpu: true,
    numCtx: 2048,
    temperature: 0.7,
    autoStart: true
  })

  useEffect(() => {
    checkOllamaStatus()
    getSystemInfo()
  }, [])

  const checkOllamaStatus = async () => {
    try {
      const response = await fetch(`http://${settings.host}:${settings.port}/api/version`)
      if (response.ok) {
        const data = await response.json()
        setOllamaVersion(data.version)
        setOllamaStatus('running')
        loadInstalledModels()
      } else {
        setOllamaStatus('stopped')
      }
    } catch (error) {
      setOllamaStatus('not-installed')
    }
  }

  const loadInstalledModels = async () => {
    try {
      const response = await fetch(`http://${settings.host}:${settings.port}/api/tags`)
      if (response.ok) {
        const data = await response.json()
        setInstalledModels(data.models || [])
      }
    } catch (error) {
      console.error('Failed to load models:', error)
    }
  }

  const downloadModel = async (modelName: string) => {
    setDownloadingModels(prev => new Set([...prev, modelName]))

    try {
      const response = await fetch(`http://${settings.host}:${settings.port}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      })

      if (response.ok) {
        const reader = response.body?.getReader()
        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const text = new TextDecoder().decode(value)
            console.log('Download progress:', text)
          }
        }

        await loadInstalledModels()
      }
    } catch (error) {
      console.error('Failed to download model:', error)
    } finally {
      setDownloadingModels(prev => {
        const next = new Set(prev)
        next.delete(modelName)
        return next
      })
    }
  }

  const deleteModel = async (modelName: string) => {
    try {
      const response = await fetch(`http://${settings.host}:${settings.port}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      })

      if (response.ok) {
        await loadInstalledModels()
      }
    } catch (error) {
      console.error('Failed to delete model:', error)
    }
  }

  const getSystemInfo = () => {
    if (navigator.deviceMemory) {
      setSystemInfo(prev => ({
        ...prev,
        memory: `${navigator.deviceMemory} GB`
      }))
    }

    if (navigator.hardwareConcurrency) {
      setSystemInfo(prev => ({
        ...prev,
        cpu: `${navigator.hardwareConcurrency} cores`
      }))
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400'
      case 'stopped': return 'text-yellow-400'
      case 'not-installed': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <FiPlay className="w-4 h-4" />
      case 'stopped': return <FiPause className="w-4 h-4" />
      case 'not-installed': return <FiDownload className="w-4 h-4" />
      default: return <FiRefreshCw className="w-4 h-4 animate-spin" />
    }
  }

  const isModelInstalled = (modelName: string) => {
    return installedModels.some(model => model.name === modelName)
  }

  return (
    <div className="h-full bg-gray-900 text-white overflow-hidden flex flex-col">
      <div className="flex-none p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Local LLM Support
          </h2>
          <div className={`flex items-center gap-2 ${getStatusColor(ollamaStatus)}`}>
            {getStatusIcon(ollamaStatus)}
            <span className="font-medium">
              {ollamaStatus === 'running' && `Ollama v${ollamaVersion}`}
              {ollamaStatus === 'stopped' && 'Ollama Stopped'}
              {ollamaStatus === 'not-installed' && 'Ollama Not Found'}
              {ollamaStatus === 'checking' && 'Checking Status...'}
            </span>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
          {[
            { id: 'models', label: 'Installed Models', icon: FiHardDrive },
            { id: 'install', label: 'Model Library', icon: FiDownload },
            { id: 'settings', label: 'Settings', icon: FiSettings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                selectedTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedTab === 'models' && (
            <motion.div
              key="models"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-6 overflow-y-auto"
            >
              {ollamaStatus !== 'running' ? (
                <div className="text-center py-12">
                  <FiWifi className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    Ollama Not Available
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {ollamaStatus === 'not-installed'
                      ? 'Ollama is not installed. Please install it to use local models.'
                      : 'Ollama is not running. Please start the Ollama service.'
                    }
                  </p>
                  <a
                    href="https://ollama.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <FiDownload className="w-4 h-4" />
                    Download Ollama
                  </a>
                </div>
              ) : installedModels.length === 0 ? (
                <div className="text-center py-12">
                  <FiHardDrive className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    No Models Installed
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Install models from the Model Library to get started.
                  </p>
                  <button
                    onClick={() => setSelectedTab('install')}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <FiDownload className="w-4 h-4" />
                    Browse Models
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {installedModels.map(model => (
                    <motion.div
                      key={model.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white">{model.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                            <span>Size: {model.size}</span>
                            <span>Modified: {new Date(model.modified).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white">
                            <FiInfo className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteModel(model.name)}
                            className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {model.details && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Format:</span>
                            <div className="text-white">{model.details.format}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Family:</span>
                            <div className="text-white">{model.details.family}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Parameters:</span>
                            <div className="text-white">{model.details.parameter_size}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Quantization:</span>
                            <div className="text-white">{model.details.quantization_level}</div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {selectedTab === 'install' && (
            <motion.div
              key="install"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-6 overflow-y-auto"
            >
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Popular Models</h3>
                <p className="text-gray-400 text-sm">
                  Choose from popular open-source models optimized for different use cases.
                </p>
              </div>

              <div className="grid gap-4">
                {POPULAR_MODELS.map(model => {
                  const isInstalled = isModelInstalled(model.name)
                  const isDownloading = downloadingModels.has(model.name)

                  return (
                    <motion.div
                      key={model.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">{model.name}</h3>
                            <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                              {model.parameters}
                            </span>
                            {isInstalled && (
                              <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">
                                Installed
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mb-3">{model.description}</p>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {model.tags.map(tag => (
                              <span
                                key={tag}
                                className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-gray-500">Size:</span>
                              <div className="text-white">{model.size}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Memory:</span>
                              <div className="text-white">{model.requirements.memory}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Disk:</span>
                              <div className="text-white">{model.requirements.disk}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">CPU:</span>
                              <div className="text-white">{model.requirements.cpu}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {!isInstalled && (
                            <button
                              onClick={() => downloadModel(model.name)}
                              disabled={isDownloading || ollamaStatus !== 'running'}
                              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              {isDownloading ? (
                                <FiRefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <FiDownload className="w-4 h-4" />
                              )}
                              {isDownloading ? 'Downloading...' : 'Install'}
                            </button>
                          )}

                          {isInstalled && (
                            <button
                              onClick={() => deleteModel(model.name)}
                              className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <details className="text-sm">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                          View Capabilities
                        </summary>
                        <div className="mt-2 pl-4 border-l-2 border-gray-700">
                          <div className="flex flex-wrap gap-2">
                            {model.capabilities.map(capability => (
                              <span
                                key={capability}
                                className="text-xs bg-blue-600/10 text-blue-400 px-2 py-1 rounded border border-blue-600/20"
                              >
                                {capability}
                              </span>
                            ))}
                          </div>
                        </div>
                      </details>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {selectedTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-6 overflow-y-auto"
            >
              <div className="max-w-2xl">
                <h3 className="text-lg font-semibold mb-4">Ollama Configuration</h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Host
                    </label>
                    <input
                      type="text"
                      value={settings.host}
                      onChange={e => setSettings(prev => ({ ...prev, host: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Port
                    </label>
                    <input
                      type="number"
                      value={settings.port}
                      onChange={e => setSettings(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Context Length
                    </label>
                    <input
                      type="number"
                      value={settings.numCtx}
                      onChange={e => setSettings(prev => ({ ...prev, numCtx: parseInt(e.target.value) }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum number of tokens to use for context
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Temperature
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={settings.temperature}
                      onChange={e => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Conservative (0)</span>
                      <span>Current: {settings.temperature}</span>
                      <span>Creative (2)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-300">
                        Enable GPU Acceleration
                      </label>
                      <p className="text-xs text-gray-500">
                        Use GPU for faster inference (requires CUDA/ROCm)
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, gpu: !prev.gpu }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.gpu ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                          settings.gpu ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-300">
                        Auto-start Ollama
                      </label>
                      <p className="text-xs text-gray-500">
                        Automatically start Ollama service when opening the app
                      </p>
                    </div>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, autoStart: !prev.autoStart }))}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.autoStart ? 'bg-blue-600' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                          settings.autoStart ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-700">
                  <h4 className="text-sm font-medium text-gray-300 mb-4">System Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Available Memory:</span>
                      <div className="text-white">{systemInfo.memory || 'Unknown'}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">CPU Cores:</span>
                      <div className="text-white">{systemInfo.cpu || 'Unknown'}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={checkOllamaStatus}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiRefreshCw className="w-4 h-4" />
                    Test Connection
                  </button>

                  <a
                    href="https://ollama.ai/download"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiDownload className="w-4 h-4" />
                    Download Ollama
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiDownload, FiPackage, FiSettings, FiPlay, FiPause, FiTrash2, FiRefreshCw, FiStar, FiExternalLink, FiShield, FiZap, FiGithub, FiSearch, FiFilter, FiTrendingUp, FiCheck, FiAlertCircle, FiGlobe } from 'react-icons/fi'

interface MCPServer {
  id: string
  name: string
  description: string
  version: string
  author: string
  category: 'productivity' | 'development' | 'data' | 'ai' | 'communication' | 'entertainment' | 'business' | 'utility'
  status: 'available' | 'installed' | 'running' | 'stopped' | 'error'
  rating: number
  downloads: number
  tags: string[]
  capabilities: string[]
  requirements: {
    node?: string
    python?: string
    api_keys?: string[]
    permissions?: string[]
  }
  repository?: string
  homepage?: string
  documentation?: string
  price: 'free' | 'paid' | 'freemium'
  lastUpdated: number
  verified: boolean
  config?: MCPServerConfig
}

interface MCPServerConfig {
  command: string
  args: string[]
  env: Record<string, string>
  cwd?: string
  port?: number
  autoStart: boolean
}

const POPULAR_MCP_SERVERS: MCPServer[] = [
  {
    id: 'filesystem',
    name: 'Filesystem MCP',
    description: 'Direct file system access for reading, writing, and managing files and directories',
    version: '1.2.0',
    author: 'Anthropic',
    category: 'utility',
    status: 'available',
    rating: 4.9,
    downloads: 125000,
    tags: ['filesystem', 'files', 'directories', 'io'],
    capabilities: ['file_read', 'file_write', 'directory_list', 'file_search'],
    requirements: {
      node: '>=16.0.0',
      permissions: ['file_system_access']
    },
    repository: 'https://github.com/anthropics/mcp-filesystem',
    homepage: 'https://modelcontextprotocol.io/servers/filesystem',
    documentation: 'https://docs.modelcontextprotocol.io/servers/filesystem',
    price: 'free',
    lastUpdated: Date.now() - 86400000,
    verified: true
  },
  {
    id: 'browser-automation',
    name: 'Browser Automation',
    description: 'Automate web browsers for testing, scraping, and interaction with web applications',
    version: '2.1.3',
    author: 'WebTech Labs',
    category: 'development',
    status: 'available',
    rating: 4.7,
    downloads: 89000,
    tags: ['browser', 'automation', 'selenium', 'testing'],
    capabilities: ['browser_control', 'web_scraping', 'form_filling', 'screenshot'],
    requirements: {
      node: '>=18.0.0',
      permissions: ['browser_automation', 'network_access']
    },
    repository: 'https://github.com/webtech/mcp-browser',
    price: 'freemium',
    lastUpdated: Date.now() - 172800000,
    verified: true
  },
  {
    id: 'database-connector',
    name: 'Database Connector',
    description: 'Connect to various databases (PostgreSQL, MySQL, MongoDB) for data operations',
    version: '1.8.5',
    author: 'DataFlow Inc',
    category: 'data',
    status: 'available',
    rating: 4.8,
    downloads: 156000,
    tags: ['database', 'sql', 'mongodb', 'postgresql', 'mysql'],
    capabilities: ['query_execution', 'schema_inspection', 'data_migration', 'backup'],
    requirements: {
      node: '>=16.0.0',
      api_keys: ['database_url'],
      permissions: ['database_access']
    },
    repository: 'https://github.com/dataflow/mcp-database',
    price: 'free',
    lastUpdated: Date.now() - 259200000,
    verified: true
  },
  {
    id: 'github-integration',
    name: 'GitHub Integration',
    description: 'Comprehensive GitHub integration for repository management, issues, and pull requests',
    version: '3.0.1',
    author: 'DevTools Co',
    category: 'development',
    status: 'installed',
    rating: 4.9,
    downloads: 203000,
    tags: ['github', 'git', 'repositories', 'issues', 'pr'],
    capabilities: ['repo_management', 'issue_tracking', 'pr_operations', 'code_review'],
    requirements: {
      api_keys: ['github_token'],
      permissions: ['github_access']
    },
    repository: 'https://github.com/devtools/mcp-github',
    price: 'free',
    lastUpdated: Date.now() - 345600000,
    verified: true,
    config: {
      command: 'npx',
      args: ['@devtools/mcp-github'],
      env: { GITHUB_TOKEN: '' },
      autoStart: true
    }
  },
  {
    id: 'slack-bot',
    name: 'Slack Bot Framework',
    description: 'Build and deploy Slack bots with rich interactive features and integrations',
    version: '2.5.0',
    author: 'ChatOps Solutions',
    category: 'communication',
    status: 'available',
    rating: 4.6,
    downloads: 67000,
    tags: ['slack', 'bot', 'chatops', 'integration'],
    capabilities: ['message_sending', 'bot_creation', 'slash_commands', 'workflow_automation'],
    requirements: {
      node: '>=18.0.0',
      api_keys: ['slack_token', 'slack_signing_secret'],
      permissions: ['slack_access']
    },
    price: 'freemium',
    lastUpdated: Date.now() - 432000000,
    verified: true
  },
  {
    id: 'weather-api',
    name: 'Weather Data API',
    description: 'Access comprehensive weather data, forecasts, and historical information',
    version: '1.4.2',
    author: 'WeatherFlow',
    category: 'data',
    status: 'available',
    rating: 4.5,
    downloads: 45000,
    tags: ['weather', 'forecast', 'climate', 'api'],
    capabilities: ['current_weather', 'forecasts', 'historical_data', 'alerts'],
    requirements: {
      api_keys: ['weather_api_key'],
      permissions: ['network_access']
    },
    price: 'freemium',
    lastUpdated: Date.now() - 518400000,
    verified: false
  },
  {
    id: 'ai-model-orchestrator',
    name: 'AI Model Orchestrator',
    description: 'Orchestrate multiple AI models and manage complex AI workflows and pipelines',
    version: '1.0.0',
    author: 'AI Systems Inc',
    category: 'ai',
    status: 'available',
    rating: 4.8,
    downloads: 78000,
    tags: ['ai', 'ml', 'orchestration', 'pipelines'],
    capabilities: ['model_management', 'pipeline_execution', 'result_aggregation', 'performance_monitoring'],
    requirements: {
      python: '>=3.8',
      api_keys: ['openai_key', 'anthropic_key'],
      permissions: ['ai_model_access']
    },
    price: 'paid',
    lastUpdated: Date.now() - 604800000,
    verified: true
  },
  {
    id: 'email-automation',
    name: 'Email Automation',
    description: 'Automate email operations including sending, filtering, and template management',
    version: '2.2.1',
    author: 'MailFlow',
    category: 'productivity',
    status: 'available',
    rating: 4.4,
    downloads: 32000,
    tags: ['email', 'automation', 'templates', 'smtp'],
    capabilities: ['email_sending', 'template_management', 'bulk_operations', 'analytics'],
    requirements: {
      node: '>=16.0.0',
      api_keys: ['smtp_credentials'],
      permissions: ['email_access']
    },
    price: 'freemium',
    lastUpdated: Date.now() - 691200000,
    verified: false
  }
]

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🚀', count: POPULAR_MCP_SERVERS.length },
  { id: 'productivity', name: 'Productivity', icon: '⚡', count: POPULAR_MCP_SERVERS.filter(s => s.category === 'productivity').length },
  { id: 'development', name: 'Development', icon: '💻', count: POPULAR_MCP_SERVERS.filter(s => s.category === 'development').length },
  { id: 'data', name: 'Data', icon: '📊', count: POPULAR_MCP_SERVERS.filter(s => s.category === 'data').length },
  { id: 'ai', name: 'AI & ML', icon: '🤖', count: POPULAR_MCP_SERVERS.filter(s => s.category === 'ai').length },
  { id: 'communication', name: 'Communication', icon: '💬', count: POPULAR_MCP_SERVERS.filter(s => s.category === 'communication').length },
  { id: 'utility', name: 'Utility', icon: '🔧', count: POPULAR_MCP_SERVERS.filter(s => s.category === 'utility').length }
]

export default function MCPMarketplace() {
  const [servers, setServers] = useState<MCPServer[]>(POPULAR_MCP_SERVERS)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'downloads' | 'updated'>('rating')
  const [filterBy, setFilterBy] = useState<'all' | 'free' | 'paid' | 'verified'>('all')
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null)
  const [activeTab, setActiveTab] = useState<'marketplace' | 'installed' | 'running'>('marketplace')
  const [installing, setInstalling] = useState<Set<string>>(new Set())
  const [showConfig, setShowConfig] = useState(false)

  const filteredServers = servers.filter(server => {
    const matchesCategory = selectedCategory === 'all' || server.category === selectedCategory
    const matchesSearch = searchTerm === '' ||
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterBy === 'all' ||
      (filterBy === 'free' && server.price === 'free') ||
      (filterBy === 'paid' && server.price === 'paid') ||
      (filterBy === 'verified' && server.verified)

    return matchesCategory && matchesSearch && matchesFilter
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'rating':
        return b.rating - a.rating
      case 'downloads':
        return b.downloads - a.downloads
      case 'updated':
        return b.lastUpdated - a.lastUpdated
      default:
        return 0
    }
  })

  const installedServers = servers.filter(s => s.status === 'installed' || s.status === 'running' || s.status === 'stopped')
  const runningServers = servers.filter(s => s.status === 'running')

  const installServer = async (serverId: string) => {
    setInstalling(prev => new Set([...prev, serverId]))

    // Simulate installation
    setTimeout(() => {
      setServers(prev => prev.map(server =>
        server.id === serverId
          ? { ...server, status: 'installed' as const }
          : server
      ))
      setInstalling(prev => {
        const next = new Set(prev)
        next.delete(serverId)
        return next
      })
    }, 2000)
  }

  const startServer = (serverId: string) => {
    setServers(prev => prev.map(server =>
      server.id === serverId
        ? { ...server, status: 'running' as const }
        : server
    ))
  }

  const stopServer = (serverId: string) => {
    setServers(prev => prev.map(server =>
      server.id === serverId
        ? { ...server, status: 'stopped' as const }
        : server
    ))
  }

  const uninstallServer = (serverId: string) => {
    setServers(prev => prev.map(server =>
      server.id === serverId
        ? { ...server, status: 'available' as const, config: undefined }
        : server
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400'
      case 'installed': return 'text-blue-400'
      case 'stopped': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <FiPlay className="w-4 h-4" />
      case 'installed': return <FiCheck className="w-4 h-4" />
      case 'stopped': return <FiPause className="w-4 h-4" />
      case 'error': return <FiAlertCircle className="w-4 h-4" />
      default: return <FiDownload className="w-4 h-4" />
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
              <FiPackage className="text-purple-400" />
              MCP Marketplace
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Discover and install Model Context Protocol servers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-colors">
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              <FiGithub className="w-4 h-4" />
              Submit Server
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
          {[
            { id: 'marketplace', label: 'Marketplace', count: servers.length },
            { id: 'installed', label: 'Installed', count: installedServers.length },
            { id: 'running', label: 'Running', count: runningServers.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.label}
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-gray-800 flex flex-col">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-800">
            <div className="relative mb-4">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search servers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-2 mb-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="rating">Sort by Rating</option>
                <option value="downloads">Sort by Downloads</option>
                <option value="name">Sort by Name</option>
                <option value="updated">Sort by Updated</option>
              </select>

              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Servers</option>
                <option value="free">Free Only</option>
                <option value="paid">Paid Only</option>
                <option value="verified">Verified Only</option>
              </select>
            </div>
          </div>

          {/* Categories */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Categories</h3>
              <div className="space-y-1">
                {CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-600/50'
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span>{category.icon}</span>
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'marketplace' && (
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-4">
                {filteredServers.map(server => (
                  <motion.div
                    key={server.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer"
                    onClick={() => setSelectedServer(server)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">{server.name}</h3>
                          {server.verified && (
                            <FiShield className="w-4 h-4 text-blue-400" title="Verified" />
                          )}
                          <span className={`text-xs px-2 py-1 rounded ${
                            server.price === 'free' ? 'bg-green-600/20 text-green-400' :
                            server.price === 'paid' ? 'bg-red-600/20 text-red-400' :
                            'bg-yellow-600/20 text-yellow-400'
                          }`}>
                            {server.price}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(server.status)}`}>
                            {server.status}
                          </span>
                        </div>

                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {server.description}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <FiStar className="w-3 h-3 text-yellow-400" />
                            <span>{server.rating}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiDownload className="w-3 h-3" />
                            <span>{formatNumber(server.downloads)}</span>
                          </div>
                          <span>v{server.version}</span>
                          <span>by {server.author}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-3">
                          {server.tags.slice(0, 4).map(tag => (
                            <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                          {server.tags.length > 4 && (
                            <span className="text-xs text-gray-500">+{server.tags.length - 4} more</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {server.status === 'available' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              installServer(server.id)
                            }}
                            disabled={installing.has(server.id)}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            {installing.has(server.id) ? (
                              <FiRefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <FiDownload className="w-4 h-4" />
                            )}
                            {installing.has(server.id) ? 'Installing...' : 'Install'}
                          </button>
                        )}

                        {server.status === 'installed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              startServer(server.id)
                            }}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <FiPlay className="w-4 h-4" />
                            Start
                          </button>
                        )}

                        {server.status === 'running' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              stopServer(server.id)
                            }}
                            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <FiPause className="w-4 h-4" />
                            Stop
                          </button>
                        )}

                        {(server.status === 'installed' || server.status === 'stopped') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              uninstallServer(server.id)
                            }}
                            className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'installed' && (
            <div className="flex-1 overflow-y-auto p-6">
              {installedServers.length === 0 ? (
                <div className="text-center py-12">
                  <FiPackage className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No Servers Installed</h3>
                  <p className="text-gray-500 mb-4">Browse the marketplace to install MCP servers</p>
                  <button
                    onClick={() => setActiveTab('marketplace')}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Browse Marketplace
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {installedServers.map(server => (
                    <div key={server.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            {server.name}
                            <span className={`text-sm ${getStatusColor(server.status)}`}>
                              {getStatusIcon(server.status)}
                            </span>
                          </h3>
                          <p className="text-gray-400 text-sm">{server.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {server.status === 'stopped' && (
                            <button
                              onClick={() => startServer(server.id)}
                              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              <FiPlay className="w-4 h-4" />
                              Start
                            </button>
                          )}

                          {server.status === 'running' && (
                            <button
                              onClick={() => stopServer(server.id)}
                              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              <FiPause className="w-4 h-4" />
                              Stop
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedServer(server)
                              setShowConfig(true)
                            }}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <FiSettings className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => uninstallServer(server.id)}
                            className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>v{server.version}</span>
                        <span>Last updated: {new Date(server.lastUpdated).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'running' && (
            <div className="flex-1 overflow-y-auto p-6">
              {runningServers.length === 0 ? (
                <div className="text-center py-12">
                  <FiZap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No Servers Running</h3>
                  <p className="text-gray-500 mb-4">Start some installed servers to see them here</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {runningServers.map(server => (
                    <div key={server.id} className="bg-gray-800/50 rounded-lg p-4 border border-green-600/30">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            {server.name}
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          </h3>
                          <p className="text-gray-400 text-sm">{server.description}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => stopServer(server.id)}
                            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <FiPause className="w-4 h-4" />
                            Stop
                          </button>

                          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                            <FiSettings className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <div className="text-green-400 font-medium">Running</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Port:</span>
                          <div className="text-white">{server.config?.port || 'Auto'}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Uptime:</span>
                          <div className="text-white">2h 15m</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Memory:</span>
                          <div className="text-white">24.5 MB</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Server Details Modal */}
      <AnimatePresence>
        {selectedServer && !showConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelectedServer(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedServer.name}
                    {selectedServer.verified && (
                      <FiShield className="w-5 h-5 text-blue-400" />
                    )}
                  </h3>
                  <p className="text-gray-400">{selectedServer.description}</p>
                </div>
                <button
                  onClick={() => setSelectedServer(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <span className="text-gray-500 text-sm">Version:</span>
                  <div className="text-white font-medium">{selectedServer.version}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Rating:</span>
                  <div className="text-yellow-400 font-medium flex items-center gap-1">
                    <FiStar className="w-4 h-4" />
                    {selectedServer.rating}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Downloads:</span>
                  <div className="text-white font-medium">{formatNumber(selectedServer.downloads)}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Price:</span>
                  <div className={`font-medium ${
                    selectedServer.price === 'free' ? 'text-green-400' :
                    selectedServer.price === 'paid' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {selectedServer.price}
                  </div>
                </div>
              </div>

              {selectedServer.capabilities.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-2">Capabilities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedServer.capabilities.map(capability => (
                      <span key={capability} className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm">
                        {capability.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {Object.keys(selectedServer.requirements).length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-2">Requirements</h4>
                  <div className="space-y-2">
                    {selectedServer.requirements.node && (
                      <div className="text-sm">
                        <span className="text-gray-500">Node.js:</span>
                        <span className="text-white ml-2">{selectedServer.requirements.node}</span>
                      </div>
                    )}
                    {selectedServer.requirements.python && (
                      <div className="text-sm">
                        <span className="text-gray-500">Python:</span>
                        <span className="text-white ml-2">{selectedServer.requirements.python}</span>
                      </div>
                    )}
                    {selectedServer.requirements.api_keys && (
                      <div className="text-sm">
                        <span className="text-gray-500">API Keys:</span>
                        <span className="text-white ml-2">{selectedServer.requirements.api_keys.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedServer.repository && (
                    <a
                      href={selectedServer.repository}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <FiGithub className="w-4 h-4" />
                      Repository
                    </a>
                  )}
                  {selectedServer.documentation && (
                    <a
                      href={selectedServer.documentation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <FiExternalLink className="w-4 h-4" />
                      Documentation
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedServer.status === 'available' && (
                    <button
                      onClick={() => installServer(selectedServer.id)}
                      disabled={installing.has(selectedServer.id)}
                      className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {installing.has(selectedServer.id) ? (
                        <FiRefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FiDownload className="w-4 h-4" />
                      )}
                      {installing.has(selectedServer.id) ? 'Installing...' : 'Install'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
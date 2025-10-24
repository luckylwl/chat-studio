import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PuzzlePieceIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  CogIcon,
  StarIcon,
  ShieldCheckIcon,
  BugAntIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  category: 'ai-tools' | 'ui-enhancement' | 'productivity' | 'integration' | 'utility' | 'entertainment'
  tags: string[]
  isInstalled: boolean
  isActive: boolean
  isFavorite: boolean
  rating: number
  downloads: number
  size: string
  lastUpdated: string
  permissions: string[]
  screenshots: string[]
  icon: string
  homepage?: string
  repository?: string
  license: string
  compatibility: string[]
  dependencies: string[]
  manifest: PluginManifest
}

interface PluginManifest {
  name: string
  version: string
  description: string
  main: string
  permissions: string[]
  api_version: string
  min_app_version: string
  hooks: {
    [key: string]: string
  }
  settings?: {
    [key: string]: {
      type: 'string' | 'number' | 'boolean' | 'select'
      default: any
      options?: any[]
      label: string
      description?: string
    }
  }
}

interface PluginStore {
  featured: Plugin[]
  popular: Plugin[]
  new: Plugin[]
  categories: {
    [key: string]: Plugin[]
  }
}

const PluginSystem: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'installed' | 'store' | 'develop'>('installed')
  const [installedPlugins, setInstalledPlugins] = useState<Plugin[]>([])
  const [storePlugins, setStorePlugins] = useState<PluginStore>({ featured: [], popular: [], new: [], categories: {} })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const categories = [
    { id: 'all', name: '全部', icon: PuzzlePieceIcon },
    { id: 'ai-tools', name: 'AI工具', icon: CodeBracketIcon },
    { id: 'ui-enhancement', name: 'UI增强', icon: StarIcon },
    { id: 'productivity', name: '生产力', icon: CogIcon },
    { id: 'integration', name: '集成工具', icon: GlobeAltIcon },
    { id: 'utility', name: '实用工具', icon: DocumentTextIcon },
    { id: 'entertainment', name: '娱乐', icon: StarIcon }
  ]

  const mockPlugins: Plugin[] = [
    {
      id: 'ai-image-generator',
      name: 'AI图像生成器',
      version: '1.2.0',
      description: '使用DALL-E和Midjourney API生成高质量图像，支持多种艺术风格和自定义参数',
      author: 'AI Studio Team',
      category: 'ai-tools',
      tags: ['图像生成', 'DALL-E', 'Midjourney', '艺术'],
      isInstalled: true,
      isActive: true,
      isFavorite: true,
      rating: 4.8,
      downloads: 15420,
      size: '2.1 MB',
      lastUpdated: '2024-01-15',
      permissions: ['网络访问', 'AI API调用', '文件写入'],
      screenshots: ['/plugin-screenshots/ai-image-1.jpg', '/plugin-screenshots/ai-image-2.jpg'],
      icon: '🎨',
      homepage: 'https://example.com/ai-image-plugin',
      repository: 'https://github.com/example/ai-image-plugin',
      license: 'MIT',
      compatibility: ['v1.0.0+'],
      dependencies: ['axios', 'canvas'],
      manifest: {
        name: 'AI图像生成器',
        version: '1.2.0',
        description: 'AI图像生成插件',
        main: 'index.js',
        permissions: ['network', 'ai-api', 'filesystem'],
        api_version: '1.0',
        min_app_version: '1.0.0',
        hooks: {
          'message.send': 'handleMessageSend',
          'ui.toolbar': 'addToolbarButton'
        },
        settings: {
          apiKey: {
            type: 'string',
            default: '',
            label: 'API密钥',
            description: '输入你的AI服务API密钥'
          },
          quality: {
            type: 'select',
            default: 'standard',
            options: ['draft', 'standard', 'hd'],
            label: '图像质量'
          }
        }
      }
    },
    {
      id: 'custom-themes',
      name: '自定义主题包',
      version: '2.0.1',
      description: '包含50+精美主题，支持自定义颜色、字体和动画效果',
      author: 'Theme Master',
      category: 'ui-enhancement',
      tags: ['主题', '自定义', 'UI', '美化'],
      isInstalled: false,
      isActive: false,
      isFavorite: false,
      rating: 4.6,
      downloads: 8932,
      size: '5.4 MB',
      lastUpdated: '2024-01-10',
      permissions: ['样式修改', '本地存储'],
      screenshots: ['/plugin-screenshots/themes-1.jpg'],
      icon: '🎭',
      license: 'Apache-2.0',
      compatibility: ['v1.0.0+'],
      dependencies: ['styled-components'],
      manifest: {
        name: '自定义主题包',
        version: '2.0.1',
        description: '主题自定义插件',
        main: 'themes.js',
        permissions: ['ui-modify', 'storage'],
        api_version: '1.0',
        min_app_version: '1.0.0',
        hooks: {
          'app.init': 'loadThemes',
          'ui.settings': 'addThemeSettings'
        }
      }
    },
    {
      id: 'markdown-enhanced',
      name: 'Markdown增强编辑器',
      version: '1.5.3',
      description: '支持LaTeX数学公式、流程图、思维导图等高级Markdown功能',
      author: 'Markdown Pro',
      category: 'productivity',
      tags: ['Markdown', 'LaTeX', '流程图', '编辑器'],
      isInstalled: true,
      isActive: false,
      isFavorite: false,
      rating: 4.9,
      downloads: 12567,
      size: '3.8 MB',
      lastUpdated: '2024-01-08',
      permissions: ['编辑器访问', '渲染引擎'],
      screenshots: ['/plugin-screenshots/markdown-1.jpg'],
      icon: '📝',
      license: 'MIT',
      compatibility: ['v1.0.0+'],
      dependencies: ['katex', 'mermaid'],
      manifest: {
        name: 'Markdown增强编辑器',
        version: '1.5.3',
        description: 'Markdown编辑增强插件',
        main: 'markdown.js',
        permissions: ['editor', 'renderer'],
        api_version: '1.0',
        min_app_version: '1.0.0',
        hooks: {
          'editor.render': 'enhanceMarkdown',
          'toolbar.actions': 'addMarkdownTools'
        }
      }
    },
    {
      id: 'api-integrations',
      name: 'API集成中心',
      version: '1.0.8',
      description: '集成常用API服务：天气、新闻、股票、翻译等，一键调用',
      author: 'Integration Hub',
      category: 'integration',
      tags: ['API', '集成', '天气', '新闻', '股票'],
      isInstalled: false,
      isActive: false,
      isFavorite: true,
      rating: 4.7,
      downloads: 6789,
      size: '1.9 MB',
      lastUpdated: '2024-01-12',
      permissions: ['网络访问', 'API调用'],
      screenshots: ['/plugin-screenshots/api-1.jpg'],
      icon: '🔌',
      license: 'GPL-3.0',
      compatibility: ['v1.0.0+'],
      dependencies: ['axios'],
      manifest: {
        name: 'API集成中心',
        version: '1.0.8',
        description: 'API集成插件',
        main: 'integrations.js',
        permissions: ['network', 'api-calls'],
        api_version: '1.0',
        min_app_version: '1.0.0',
        hooks: {
          'command.execute': 'handleApiCommands',
          'ui.sidebar': 'addApiPanel'
        }
      }
    }
  ]

  useEffect(() => {
    setInstalledPlugins(mockPlugins.filter(p => p.isInstalled))
    setStorePlugins({
      featured: mockPlugins.slice(0, 2),
      popular: mockPlugins.sort((a, b) => b.downloads - a.downloads).slice(0, 3),
      new: mockPlugins.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()).slice(0, 3),
      categories: {
        'ai-tools': mockPlugins.filter(p => p.category === 'ai-tools'),
        'ui-enhancement': mockPlugins.filter(p => p.category === 'ui-enhancement'),
        'productivity': mockPlugins.filter(p => p.category === 'productivity'),
        'integration': mockPlugins.filter(p => p.category === 'integration'),
        'utility': mockPlugins.filter(p => p.category === 'utility'),
        'entertainment': mockPlugins.filter(p => p.category === 'entertainment')
      }
    })
  }, [])

  const handleInstallPlugin = async (plugin: Plugin) => {
    setIsLoading(true)
    // 模拟安装过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    const updatedPlugin = { ...plugin, isInstalled: true }
    setInstalledPlugins(prev => [...prev, updatedPlugin])
    setIsLoading(false)
  }

  const handleUninstallPlugin = async (pluginId: string) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))

    setInstalledPlugins(prev => prev.filter(p => p.id !== pluginId))
    setIsLoading(false)
  }

  const handleTogglePlugin = (pluginId: string) => {
    setInstalledPlugins(prev =>
      prev.map(p => p.id === pluginId ? { ...p, isActive: !p.isActive } : p)
    )
  }

  const handleToggleFavorite = (pluginId: string) => {
    setInstalledPlugins(prev =>
      prev.map(p => p.id === pluginId ? { ...p, isFavorite: !p.isFavorite } : p)
    )
  }

  const getFilteredPlugins = () => {
    let plugins = selectedTab === 'installed' ? installedPlugins : mockPlugins

    if (selectedCategory !== 'all') {
      plugins = plugins.filter(p => p.category === selectedCategory)
    }

    if (searchQuery) {
      plugins = plugins.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    return plugins
  }

  const PluginCard: React.FC<{ plugin: Plugin, showActions?: boolean }> = ({
    plugin,
    showActions = true
  }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl">
            {plugin.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {plugin.name}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>v{plugin.version}</span>
              <span>•</span>
              <span>{plugin.author}</span>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleToggleFavorite(plugin.id)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {plugin.isFavorite ? (
                <StarSolidIcon className="w-5 h-5 text-yellow-400" />
              ) : (
                <StarIcon className="w-5 h-5 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => {
                setSelectedPlugin(plugin)
                setShowDetails(true)
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <EyeIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        )}
      </div>

      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
        {plugin.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {plugin.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            <span>{plugin.rating}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>{plugin.downloads.toLocaleString()}</span>
          </div>
          <span>{plugin.size}</span>
        </div>
      </div>

      {showActions && (
        <div className="flex items-center space-x-2">
          {plugin.isInstalled ? (
            <>
              <button
                onClick={() => handleTogglePlugin(plugin.id)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  plugin.isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {plugin.isActive ? '已启用' : '已停用'}
              </button>
              <button
                onClick={() => handleUninstallPlugin(plugin.id)}
                className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                disabled={isLoading}
              >
                卸载
              </button>
            </>
          ) : (
            <button
              onClick={() => handleInstallPlugin(plugin)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '安装中...' : '安装'}
            </button>
          )}
        </div>
      )}
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            插件系统
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            扩展应用功能，安装和管理自定义插件
          </p>
        </div>

        {/* 标签页导航 */}
        <div className="flex space-x-1 mb-6 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
          {[
            { id: 'installed', name: '已安装', icon: ShieldCheckIcon },
            { id: 'store', name: '插件商店', icon: GlobeAltIcon },
            { id: 'develop', name: '开发工具', icon: CodeBracketIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
                selectedTab === tab.id
                  ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索插件..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          {selectedTab === 'installed' && (
            <motion.div
              key="installed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {installedPlugins.length === 0 ? (
                <div className="text-center py-12">
                  <PuzzlePieceIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    暂无已安装插件
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    前往插件商店发现和安装新插件
                  </p>
                  <button
                    onClick={() => setSelectedTab('store')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    浏览插件商店
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredPlugins().map((plugin) => (
                    <PluginCard key={plugin.id} plugin={plugin} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {selectedTab === 'store' && (
            <motion.div
              key="store"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* 精选插件 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  精选插件
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {storePlugins.featured.map((plugin) => (
                    <PluginCard key={plugin.id} plugin={plugin} />
                  ))}
                </div>
              </section>

              {/* 热门插件 */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  热门插件
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredPlugins().map((plugin) => (
                    <PluginCard key={plugin.id} plugin={plugin} />
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {selectedTab === 'develop' && (
            <motion.div
              key="develop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  插件开发工具
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      快速开始
                    </h3>
                    <div className="space-y-2">
                      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        创建新插件
                      </button>
                      <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        导入插件包
                      </button>
                      <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        插件调试器
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      开发资源
                    </h3>
                    <div className="space-y-2 text-sm">
                      <a href="#" className="block text-blue-600 hover:text-blue-700">
                        📚 插件开发文档
                      </a>
                      <a href="#" className="block text-blue-600 hover:text-blue-700">
                        🛠️ API参考手册
                      </a>
                      <a href="#" className="block text-blue-600 hover:text-blue-700">
                        💡 示例插件
                      </a>
                      <a href="#" className="block text-blue-600 hover:text-blue-700">
                        🤝 开发者社区
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* 开发中的插件 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  开发中的插件
                </h3>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <CodeBracketIcon className="w-12 h-12 mx-auto mb-2" />
                  <p>暂无开发中的插件</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 插件详情模态框 */}
        <AnimatePresence>
          {showDetails && selectedPlugin && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowDetails(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl">
                        {selectedPlugin.icon}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedPlugin.name}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          v{selectedPlugin.version} by {selectedPlugin.author}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          描述
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedPlugin.description}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          权限
                        </h3>
                        <div className="space-y-1">
                          {selectedPlugin.permissions.map((permission) => (
                            <div key={permission} className="flex items-center space-x-2">
                              <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {permission}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                          插件信息
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">评分:</span>
                            <span className="font-medium">{selectedPlugin.rating}/5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">下载量:</span>
                            <span className="font-medium">{selectedPlugin.downloads.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">大小:</span>
                            <span className="font-medium">{selectedPlugin.size}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">更新:</span>
                            <span className="font-medium">{selectedPlugin.lastUpdated}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">许可证:</span>
                            <span className="font-medium">{selectedPlugin.license}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {selectedPlugin.isInstalled ? (
                          <>
                            <button
                              onClick={() => handleTogglePlugin(selectedPlugin.id)}
                              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                                selectedPlugin.isActive
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {selectedPlugin.isActive ? '停用插件' : '启用插件'}
                            </button>
                            <button
                              onClick={() => handleUninstallPlugin(selectedPlugin.id)}
                              className="w-full px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                            >
                              卸载插件
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleInstallPlugin(selectedPlugin)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            disabled={isLoading}
                          >
                            {isLoading ? '安装中...' : '安装插件'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default PluginSystem
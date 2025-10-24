/**
 * Plugin Manager Component
 * UI for installing, managing, and configuring plugins
 */

import React, { useState, useEffect } from 'react'
import {
  PuzzlePieceIcon,
  PlusIcon,
  TrashIcon,
  Cog6ToothIcon,
  PowerIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { Button, Card } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import {
  pluginSystem,
  type Plugin,
  type PluginConfig,
  type PluginMarketplaceEntry
} from '@/services/pluginSystem'

interface PluginManagerProps {
  className?: string
}

const PluginManager: React.FC<PluginManagerProps> = ({ className }) => {
  const [view, setView] = useState<'installed' | 'marketplace'>('installed')
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [marketplacePlugins, setMarketplacePlugins] = useState<PluginMarketplaceEntry[]>([])
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    try {
      await pluginSystem.initialize()
      const installed = pluginSystem.listPlugins()
      setPlugins(installed)
    } catch (error: any) {
      toast.error(`加载失败: ${error.message}`)
    }
  }

  const loadMarketplace = async () => {
    try {
      const results = await pluginSystem.searchMarketplace(searchQuery, {
        category: categoryFilter !== 'all' ? categoryFilter : undefined
      })
      setMarketplacePlugins(results)
    } catch (error: any) {
      toast.error(`加载失败: ${error.message}`)
    }
  }

  const handleEnablePlugin = async (pluginId: string) => {
    try {
      await pluginSystem.enablePlugin(pluginId)
      await loadPlugins()
      toast.success('插件已启用')
    } catch (error: any) {
      toast.error(`启用失败: ${error.message}`)
    }
  }

  const handleDisablePlugin = async (pluginId: string) => {
    try {
      await pluginSystem.disablePlugin(pluginId)
      await loadPlugins()
      toast.success('插件已禁用')
    } catch (error: any) {
      toast.error(`禁用失败: ${error.message}`)
    }
  }

  const handleUninstallPlugin = async (pluginId: string) => {
    const plugin = plugins.find(p => p.id === pluginId)
    if (!plugin) return

    if (!confirm(`确定要卸载插件"${plugin.name}"吗？此操作不可恢复。`)) {
      return
    }

    try {
      await pluginSystem.uninstallPlugin(pluginId)
      await loadPlugins()
      toast.success('插件已卸载')
    } catch (error: any) {
      toast.error(`卸载失败: ${error.message}`)
    }
  }

  const handleInstallFromMarketplace = async (pluginId: string) => {
    try {
      toast.loading('正在安装...', { id: 'install' })
      await pluginSystem.installFromMarketplace(pluginId)
      await loadPlugins()
      toast.success('插件已安装', { id: 'install' })
    } catch (error: any) {
      toast.error(`安装失败: ${error.message}`, { id: 'install' })
    }
  }

  const handleOpenSettings = (plugin: Plugin) => {
    setSelectedPlugin(plugin)
    setShowSettingsModal(true)
  }

  const handleSaveSettings = async (settings: Record<string, any>) => {
    if (!selectedPlugin) return

    try {
      await pluginSystem.updatePluginSettings(selectedPlugin.id, settings)
      await loadPlugins()
      setShowSettingsModal(false)
      toast.success('设置已保存')
    } catch (error: any) {
      toast.error(`保存失败: ${error.message}`)
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      ai: 'AI 增强',
      ui: 'UI 扩展',
      tool: '工具',
      integration: '集成',
      theme: '主题',
      other: '其他'
    }
    return labels[category] || category
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      ai: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      ui: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      tool: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      integration: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      theme: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
    return colors[category] || colors.other
  }

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = !searchQuery ||
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || plugin.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const stats = pluginSystem.getStats()

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PuzzlePieceIcon className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            插件管理
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.zip,.json'
              input.onchange = async (e: any) => {
                const file = e.target.files[0]
                if (file) {
                  toast.info('本地安装功能开发中')
                }
              }
              input.click()
            }}
            size="sm"
            variant="outline"
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
            本地安装
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Card className="p-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {stats.totalPlugins}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">总计</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.enabledPlugins}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">已启用</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.categories.ai}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">AI</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.categories.ui}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">UI</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.categories.tool}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">工具</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.categories.integration}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">集成</div>
          </div>
        </div>
      </Card>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setView('installed')}
          className={cn(
            'px-4 py-2 font-medium transition-colors border-b-2',
            view === 'installed'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          )}
        >
          已安装 ({plugins.length})
        </button>
        <button
          onClick={() => {
            setView('marketplace')
            loadMarketplace()
          }}
          className={cn(
            'px-4 py-2 font-medium transition-colors border-b-2',
            view === 'marketplace'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          )}
        >
          插件市场
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索插件..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="all">所有分类</option>
          <option value="ai">AI 增强</option>
          <option value="ui">UI 扩展</option>
          <option value="tool">工具</option>
          <option value="integration">集成</option>
          <option value="theme">主题</option>
          <option value="other">其他</option>
        </select>
      </div>

      {/* Installed Plugins */}
      {view === 'installed' && (
        <div className="space-y-2">
          {filteredPlugins.length === 0 ? (
            <Card className="p-8 text-center">
              <PuzzlePieceIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery || categoryFilter !== 'all'
                  ? '没有找到匹配的插件'
                  : '还没有安装插件，去插件市场看看吧'}
              </p>
            </Card>
          ) : (
            filteredPlugins.map((plugin) => (
              <Card key={plugin.id} className="p-4">
                <div className="flex items-start gap-3">
                  {plugin.icon ? (
                    <img
                      src={plugin.icon}
                      alt={plugin.name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                      {plugin.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {plugin.name}
                      </h3>
                      <span className="text-xs text-gray-500">v{plugin.version}</span>
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        getCategoryColor(plugin.category)
                      )}>
                        {getCategoryLabel(plugin.category)}
                      </span>
                      {plugin.isEnabled ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          已启用
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                          <XCircleIcon className="w-3 h-3 mr-1" />
                          已禁用
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {plugin.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>作者: {plugin.author}</span>
                      <span>•</span>
                      <span>
                        {plugin.permissions.length > 0 && (
                          <>
                            <ShieldCheckIcon className="w-3 h-3 inline mr-1" />
                            {plugin.permissions.length} 项权限
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {plugin.manifest.config && plugin.manifest.config.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenSettings(plugin)}
                        className="h-8 w-8 p-0"
                        title="设置"
                      >
                        <Cog6ToothIcon className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => plugin.isEnabled
                        ? handleDisablePlugin(plugin.id)
                        : handleEnablePlugin(plugin.id)
                      }
                      className="h-8 w-8 p-0"
                      title={plugin.isEnabled ? '禁用' : '启用'}
                    >
                      <PowerIcon className={cn(
                        'w-4 h-4',
                        plugin.isEnabled && 'text-green-600'
                      )} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUninstallPlugin(plugin.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      title="卸载"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Marketplace */}
      {view === 'marketplace' && (
        <Card className="p-8 text-center">
          <PuzzlePieceIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            插件市场即将推出
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            您可以通过"本地安装"功能安装自定义插件
          </p>
        </Card>
      )}

      {/* Settings Modal */}
      {showSettingsModal && selectedPlugin && (
        <PluginSettingsModal
          plugin={selectedPlugin}
          onClose={() => {
            setShowSettingsModal(false)
            setSelectedPlugin(null)
          }}
          onSave={handleSaveSettings}
        />
      )}
    </div>
  )
}

// Plugin Settings Modal Component
interface PluginSettingsModalProps {
  plugin: Plugin
  onClose: () => void
  onSave: (settings: Record<string, any>) => void
}

const PluginSettingsModal: React.FC<PluginSettingsModalProps> = ({
  plugin,
  onClose,
  onSave
}) => {
  const [settings, setSettings] = useState<Record<string, any>>(plugin.settings || {})

  const handleSave = () => {
    onSave(settings)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {plugin.name} - 设置
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XCircleIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {plugin.manifest.config?.map((config) => (
            <div key={config.key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {config.label}
                {config.required && <span className="text-red-600 ml-1">*</span>}
              </label>
              {config.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {config.description}
                </p>
              )}
              {config.type === 'string' && (
                <input
                  type="text"
                  value={settings[config.key] || ''}
                  onChange={(e) => setSettings({ ...settings, [config.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              )}
              {config.type === 'number' && (
                <input
                  type="number"
                  value={settings[config.key] || 0}
                  onChange={(e) => setSettings({ ...settings, [config.key]: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              )}
              {config.type === 'boolean' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[config.key] || false}
                    onChange={(e) => setSettings({ ...settings, [config.key]: e.target.checked })}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">启用</span>
                </label>
              )}
              {config.type === 'select' && (
                <select
                  value={settings[config.key] || ''}
                  onChange={(e) => setSettings({ ...settings, [config.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {config.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
              {config.type === 'textarea' && (
                <textarea
                  value={settings[config.key] || ''}
                  onChange={(e) => setSettings({ ...settings, [config.key]: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>
            保存设置
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default PluginManager

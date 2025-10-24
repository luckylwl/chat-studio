import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  Switch,
  Textarea,
  Badge,
  Modal
} from '@/components/ui'
import { useAppStore } from '@/store'
import { toast } from 'react-hot-toast'
import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
  CpuChipIcon,
  KeyIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  BellIcon,
  GlobeAltIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  ShareIcon,
  CogIcon,
  BookOpenIcon,
  BuildingOfficeIcon,
  ShieldExclamationIcon,
  ServerIcon
} from '@heroicons/react/24/outline'
import type { APIProvider, AIModel } from '@/types'
import { generateId } from '@/utils'
import AdvancedSearch from '@/components/AdvancedSearch'
import PerformanceAnalytics from '@/components/PerformanceAnalytics'
import SecurityDashboard from '@/components/SecurityDashboard'
import ModelTrainingDashboard from '@/components/ModelTrainingDashboard'
import ExportIntegrationDashboard from '@/components/ExportIntegrationDashboard'
import WorkflowDashboard from '@/components/WorkflowDashboard'
import ConversationIntelligenceDashboard from '@/components/ConversationIntelligenceDashboard'
import PromptTemplateDashboard from '@/components/PromptTemplateDashboard'
import OrganizationDashboard from '@/components/OrganizationDashboard'
import ContentModerationDashboard from '@/components/ContentModerationDashboard'
import ConversationRoutingDashboard from '@/components/ConversationRoutingDashboard'

const SettingsPage: React.FC = () => {
  const { user, setUser, apiProviders, updateAPIProvider, addAPIProvider, deleteAPIProvider, theme, setTheme } = useAppStore()
  const [activeTab, setActiveTab] = useState('general')
  const [showCustomModelModal, setShowCustomModelModal] = useState(false)
  const [showCustomProviderModal, setShowCustomProviderModal] = useState(false)
  const [editingProvider, setEditingProvider] = useState<APIProvider | null>(null)
  const [customModel, setCustomModel] = useState<Partial<AIModel & { baseURL?: string, apiKey?: string }>>({
    id: '',
    name: '',
    provider: '',
    maxTokens: 4096,
    description: '',
    baseURL: '',
    apiKey: ''
  })
  const [customProvider, setCustomProvider] = useState<Partial<APIProvider>>({
    id: '',
    name: '',
    baseURL: '',
    apiKey: '',
    models: [],
    isEnabled: false
  })

  const handleUpdatePreferences = (updates: any) => {
    if (user) {
      setUser({
        ...user,
        preferences: {
          ...user.preferences,
          ...updates
        }
      })
      toast.success('设置已保存')
    }
  }

  const handleUpdateAPIProvider = (providerId: string, updates: any) => {
    updateAPIProvider(providerId, updates)
    toast.success('API配置已更新')
  }

  const handleAddCustomProvider = () => {
    if (!customProvider.id || !customProvider.name || !customProvider.baseURL) {
      toast.error('请填写完整的提供商信息')
      return
    }

    const newProvider: APIProvider = {
      id: customProvider.id,
      name: customProvider.name!,
      baseURL: customProvider.baseURL!,
      apiKey: customProvider.apiKey || '',
      models: customProvider.models || [],
      isEnabled: customProvider.isEnabled || false
    }

    addAPIProvider(newProvider)
    toast.success('自定义API提供商已添加')
    setShowCustomProviderModal(false)
    setCustomProvider({
      id: '',
      name: '',
      baseURL: '',
      apiKey: '',
      models: [],
      isEnabled: false
    })
  }

  const handleAddCustomModel = () => {
    if (!customModel.id || !customModel.name) {
      toast.error('请填写模型ID和名称')
      return
    }

    // 如果用户填写了baseURL，说明要创建新的提供商
    if (customModel.baseURL) {
      if (!customModel.apiKey) {
        toast.error('配置新提供商时需要提供API Key')
        return
      }

      const providerId = generateId()
      const providerName = `${customModel.name} Provider`

      // 创建新的API提供商
      const newProvider: APIProvider = {
        id: providerId,
        name: providerName,
        baseURL: customModel.baseURL,
        apiKey: customModel.apiKey,
        models: [{
          id: customModel.id!,
          name: customModel.name!,
          provider: providerId,
          maxTokens: customModel.maxTokens || 4096,
          description: customModel.description || ''
        }],
        isEnabled: true
      }

      addAPIProvider(newProvider)
      toast.success('自定义模型和提供商已添加')
    } else {
      // 添加到现有提供商
      if (!customModel.provider) {
        toast.error('请选择提供商或填写Base URL创建新提供商')
        return
      }

      const provider = apiProviders.find(p => p.id === customModel.provider)
      if (!provider) {
        toast.error('找不到对应的API提供商')
        return
      }

      const newModel: AIModel = {
        id: customModel.id!,
        name: customModel.name!,
        provider: customModel.provider!,
        maxTokens: customModel.maxTokens || 4096,
        description: customModel.description || ''
      }

      const updatedModels = [...provider.models, newModel]
      updateAPIProvider(provider.id, { models: updatedModels })
      toast.success('自定义模型已添加')
    }

    setShowCustomModelModal(false)
    setCustomModel({
      id: '',
      name: '',
      provider: '',
      maxTokens: 4096,
      description: '',
      baseURL: '',
      apiKey: ''
    })
  }

  const handleDeleteModel = (providerId: string, modelId: string) => {
    const provider = apiProviders.find(p => p.id === providerId)
    if (!provider) return

    const updatedModels = provider.models.filter(m => m.id !== modelId)
    updateAPIProvider(providerId, { models: updatedModels })
    toast.success('模型已删除')
  }

  const tabs = [
    {
      id: 'general',
      name: '通用设置',
      icon: <ComputerDesktopIcon className="h-5 w-5" />
    },
    {
      id: 'models',
      name: '模型配置',
      icon: <CpuChipIcon className="h-5 w-5" />
    },
    {
      id: 'api',
      name: 'API设置',
      icon: <KeyIcon className="h-5 w-5" />
    },
    {
      id: 'search',
      name: '搜索功能',
      icon: <MagnifyingGlassIcon className="h-5 w-5" />
    },
    {
      id: 'network',
      name: '网络功能',
      icon: <GlobeAltIcon className="h-5 w-5" />
    },
    {
      id: 'prompt',
      name: '提示词',
      icon: <DocumentTextIcon className="h-5 w-5" />
    },
    {
      id: 'appearance',
      name: '外观',
      icon: <PaintBrushIcon className="h-5 w-5" />
    },
    {
      id: 'analytics',
      name: '分析与性能',
      icon: <ChartBarIcon className="h-5 w-5" />
    },
    {
      id: 'security',
      name: '安全与加密',
      icon: <ShieldCheckIcon className="h-5 w-5" />
    },
    {
      id: 'training',
      name: '模型训练',
      icon: <RocketLaunchIcon className="h-5 w-5" />
    },
    {
      id: 'export',
      name: '导出与集成',
      icon: <ShareIcon className="h-5 w-5" />
    },
    {
      id: 'workflow',
      name: '工作流自动化',
      icon: <CogIcon className="h-5 w-5" />
    },
    {
      id: 'intelligence',
      name: 'AI对话智能',
      icon: <CpuChipIcon className="h-5 w-5" />
    },
    {
      id: 'templates',
      name: '提示词模板',
      icon: <BookOpenIcon className="h-5 w-5" />
    },
    {
      id: 'organization',
      name: '组织管理',
      icon: <BuildingOfficeIcon className="h-5 w-5" />
    },
    {
      id: 'moderation',
      name: '内容审核',
      icon: <ShieldExclamationIcon className="h-5 w-5" />
    },
    {
      id: 'routing',
      name: '对话路由',
      icon: <ServerIcon className="h-5 w-5" />
    }
  ]

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">加载设置中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto py-8 px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">设置</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            自定义您的 AI Chat Studio 体验
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-950 dark:text-primary-300 dark:border-primary-800'
                      : 'hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>基本信息</CardTitle>
                    <CardDescription>管理您的个人信息和偏好设置</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        用户名
                      </label>
                      <Input
                        value={user.name}
                        onChange={(e) => setUser({ ...user, name: e.target.value })}
                        placeholder="请输入用户名"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        邮箱
                      </label>
                      <Input
                        type="email"
                        value={user.email}
                        onChange={(e) => setUser({ ...user, email: e.target.value })}
                        placeholder="请输入邮箱地址"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>语言设置</CardTitle>
                    <CardDescription>选择界面语言</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      options={[
                        { value: 'zh-CN', label: '简体中文' },
                        { value: 'en', label: 'English' },
                        { value: 'ja', label: '日本語' }
                      ]}
                      value={user.preferences.language}
                      onChange={(value) => handleUpdatePreferences({ language: value })}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'models' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>自定义模型管理</CardTitle>
                        <CardDescription>配置和管理您的AI模型</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowCustomProviderModal(true)}
                          size="sm"
                          variant="outline"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          添加提供商
                        </Button>
                        <Button
                          onClick={() => {
                            setCustomModel({
                              id: '',
                              name: '',
                              provider: '',
                              maxTokens: 4096,
                              description: ''
                            })
                            setShowCustomModelModal(true)
                          }}
                          size="sm"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          快速添加模型
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {apiProviders.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500 dark:text-gray-400">
                            暂无配置的API提供商，请先添加提供商
                          </p>
                        </div>
                      ) : (
                        <Select
                          options={apiProviders.flatMap(provider =>
                            provider.models.map(model => ({
                              value: model.id,
                              label: `${model.name} (${provider.name})`,
                              description: model.description || `来自 ${provider.name}`
                            }))
                          )}
                          value={user.preferences.defaultModel}
                          onChange={(value) => handleUpdatePreferences({ defaultModel: value })}
                          placeholder="选择默认模型"
                        />
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        选择新对话时使用的默认AI模型
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>模型参数</CardTitle>
                    <CardDescription>调整AI模型的行为参数</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        温度 (Temperature): {user.preferences.temperature}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={user.preferences.temperature}
                        onChange={(e) => handleUpdatePreferences({ temperature: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        控制回答的创造性，值越高越有创意
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        最大令牌数
                      </label>
                      <Input
                        type="number"
                        value={user.preferences.maxTokens}
                        onChange={(e) => handleUpdatePreferences({ maxTokens: parseInt(e.target.value) })}
                        min="1"
                        max="8192"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="space-y-6">
                {apiProviders.map((provider) => (
                  <Card key={provider.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {provider.name}
                            <Badge variant={provider.isEnabled ? 'success' : 'secondary'}>
                              {provider.isEnabled ? '已启用' : '未启用'}
                            </Badge>
                          </CardTitle>
                          <CardDescription>配置 {provider.name} API</CardDescription>
                        </div>
                        <Switch
                          checked={provider.isEnabled}
                          onChange={(e) => handleUpdateAPIProvider(provider.id, { isEnabled: e.target.checked })}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          API Key
                        </label>
                        <Input
                          type="password"
                          value={provider.apiKey}
                          onChange={(e) => handleUpdateAPIProvider(provider.id, { apiKey: e.target.value })}
                          placeholder="请输入API Key"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Base URL
                        </label>
                        <Input
                          value={provider.baseURL}
                          onChange={(e) => handleUpdateAPIProvider(provider.id, { baseURL: e.target.value })}
                          placeholder="API基础URL"
                        />
                      </div>

                      {/* 模型管理 */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            模型列表
                          </label>
                          <Button
                            size="sm"
                            onClick={() => {
                              setCustomModel({ ...customModel, provider: provider.id })
                              setShowCustomModelModal(true)
                            }}
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            添加模型
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {provider.models.map((model) => (
                            <div
                              key={model.id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                  {model.name}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  ID: {model.id} • Max Tokens: {model.maxTokens}
                                </p>
                                {model.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                    {model.description}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteModel(provider.id, model.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          {provider.models.length === 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                              暂无模型，请点击"添加模型"来添加
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* 添加自定义提供商 */}
                <Card>
                  <CardHeader>
                    <CardTitle>自定义API提供商</CardTitle>
                    <CardDescription>添加自定义的API服务提供商</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setShowCustomProviderModal(true)}
                      className="w-full"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      添加自定义提供商
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'search' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>高级搜索</CardTitle>
                    <CardDescription>强大的搜索和过滤功能，快速找到历史对话和消息</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MagnifyingGlassIcon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        体验高级搜索功能
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        支持全文搜索、智能筛选、关键词标签等高级功能
                      </p>
                      <AdvancedSearch />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">🔍 搜索功能</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                          <li>• 全文搜索所有对话内容</li>
                          <li>• 按时间范围筛选结果</li>
                          <li>• 按AI模型分类搜索</li>
                          <li>• 按消息角色和长度过滤</li>
                        </ul>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">⚡ 高级功能</h4>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                          <li>• 智能相关度排序</li>
                          <li>• 关键词标签管理</li>
                          <li>• 内容高亮显示</li>
                          <li>• 快速跳转到原位置</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'network' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>网络搜索</CardTitle>
                    <CardDescription>配置网络搜索功能，让AI能够访问最新信息</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Switch
                      label="启用网络搜索"
                      description="允许AI通过搜索引擎获取最新信息"
                      checked={user.preferences.enableWebSearch || false}
                      onChange={(e) => handleUpdatePreferences({ enableWebSearch: e.target.checked })}
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        搜索引擎
                      </label>
                      <Select
                        options={[
                          { value: 'google', label: 'Google', description: '使用Google搜索' },
                          { value: 'bing', label: 'Bing', description: '使用Bing搜索' },
                          { value: 'duckduckgo', label: 'DuckDuckGo', description: '注重隐私的搜索引擎' }
                        ]}
                        value={user.preferences.searchEngine || 'google'}
                        onChange={(value) => handleUpdatePreferences({ searchEngine: value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        搜索API Key (可选)
                      </label>
                      <Input
                        type="password"
                        placeholder="如使用付费搜索API请输入密钥"
                        value={user.preferences.searchApiKey || ''}
                        onChange={(e) => handleUpdatePreferences({ searchApiKey: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>实时数据</CardTitle>
                    <CardDescription>配置实时数据获取功能</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Switch
                      label="启用天气信息"
                      description="允许AI获取天气预报信息"
                      checked={user.preferences.enableWeather || false}
                      onChange={(e) => handleUpdatePreferences({ enableWeather: e.target.checked })}
                    />

                    <Switch
                      label="启用股票信息"
                      description="允许AI获取股票市场信息"
                      checked={user.preferences.enableStock || false}
                      onChange={(e) => handleUpdatePreferences({ enableStock: e.target.checked })}
                    />

                    <Switch
                      label="启用新闻资讯"
                      description="允许AI获取最新新闻资讯"
                      checked={user.preferences.enableNews || false}
                      onChange={(e) => handleUpdatePreferences({ enableNews: e.target.checked })}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>网络请求设置</CardTitle>
                    <CardDescription>配置网络请求的相关参数</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        请求超时时间 (秒): {user.preferences.networkTimeout || 30}
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="120"
                        step="5"
                        value={user.preferences.networkTimeout || 30}
                        onChange={(e) => handleUpdatePreferences({ networkTimeout: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        代理服务器 (可选)
                      </label>
                      <Input
                        placeholder="http://proxy-server:port"
                        value={user.preferences.proxyServer || ''}
                        onChange={(e) => handleUpdatePreferences({ proxyServer: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'prompt' && (
              <Card>
                <CardHeader>
                  <CardTitle>系统提示词</CardTitle>
                  <CardDescription>设置AI助手的默认行为和性格</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={user.preferences.systemPrompt}
                    onChange={(e) => handleUpdatePreferences({ systemPrompt: e.target.value })}
                    placeholder="请输入系统提示词..."
                    rows={6}
                    autoResize
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    系统提示词将影响AI的回答风格和行为方式
                  </p>
                </CardContent>
              </Card>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>主题设置</CardTitle>
                    <CardDescription>选择您偏好的界面主题</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: '浅色', icon: <SunIcon className="h-5 w-5" /> },
                        { value: 'dark', label: '深色', icon: <MoonIcon className="h-5 w-5" /> },
                        { value: 'system', label: '跟随系统', icon: <ComputerDesktopIcon className="h-5 w-5" /> }
                      ].map((themeOption) => (
                        <button
                          key={themeOption.value}
                          onClick={() => setTheme(themeOption.value as any)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                            theme === themeOption.value
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {themeOption.icon}
                          <span className="font-medium">{themeOption.label}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>界面设置</CardTitle>
                    <CardDescription>自定义界面显示选项</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        字体大小: {user.preferences.fontSize}px
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="18"
                        step="1"
                        value={user.preferences.fontSize}
                        onChange={(e) => handleUpdatePreferences({ fontSize: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>

                    <Switch
                      label="启用动画效果"
                      description="界面动画和过渡效果"
                      checked={user.preferences.enableAnimations}
                      onChange={(e) => handleUpdatePreferences({ enableAnimations: e.target.checked })}
                    />

                    <Switch
                      label="启用声音提示"
                      description="消息发送和接收时的音效"
                      checked={user.preferences.enableSound}
                      onChange={(e) => handleUpdatePreferences({ enableSound: e.target.checked })}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>分析与洞察</CardTitle>
                    <CardDescription>监控应用使用情况和性能指标</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PerformanceAnalytics />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>安全与加密</CardTitle>
                    <CardDescription>管理安全策略和数据加密设置</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SecurityDashboard />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'training' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI模型训练</CardTitle>
                    <CardDescription>管理训练数据集、微调模型和评估性能</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ModelTrainingDashboard />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'export' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>导出与集成</CardTitle>
                    <CardDescription>数据导出和外部系统集成管理</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ExportIntegrationDashboard />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'workflow' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>工作流自动化</CardTitle>
                    <CardDescription>企业级工作流引擎，智能化业务流程自动化</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WorkflowDashboard />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'intelligence' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI对话智能分析</CardTitle>
                    <CardDescription>深度分析对话内容，提供情感、意图、质量等多维度洞察</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ConversationIntelligenceDashboard />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'templates' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>提示词模板管理</CardTitle>
                    <CardDescription>创建、管理和优化AI提示词模板，提升对话质量</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PromptTemplateDashboard />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'organization' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>组织管理</CardTitle>
                    <CardDescription>管理多租户组织架构、用户权限和资源配置</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OrganizationDashboard />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'moderation' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>智能内容审核</CardTitle>
                    <CardDescription>AI驱动的内容审核系统，自动检测和处理不当内容</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ContentModerationDashboard />
                  </CardContent>
                </Card>
              </div>
            )}
            {activeTab === 'routing' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI对话路由与负载均衡</CardTitle>
                    <CardDescription>智能路由系统，优化AI模型调用和负载分配</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ConversationRoutingDashboard />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 自定义模型弹窗 */}
      <Modal
        open={showCustomModelModal}
        onClose={() => setShowCustomModelModal(false)}
        title="添加自定义模型"
        description="配置自定义AI模型和API提供商"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                模型ID *
              </label>
              <Input
                value={customModel.id || ''}
                onChange={(e) => setCustomModel({ ...customModel, id: e.target.value })}
                placeholder="例如: gpt-4-custom"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                模型名称 *
              </label>
              <Input
                value={customModel.name || ''}
                onChange={(e) => setCustomModel({ ...customModel, name: e.target.value })}
                placeholder="例如: GPT-4 Custom"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              选择配置方式
            </h4>

            <div className="space-y-4">
              {/* 方式1: 添加到现有提供商 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  选择现有提供商
                </label>
                <Select
                  options={apiProviders.map(p => ({
                    value: p.id,
                    label: p.name,
                    description: p.baseURL
                  }))}
                  value={customModel.provider || ''}
                  onChange={(value) => setCustomModel({ ...customModel, provider: value, baseURL: '', apiKey: '' })}
                  placeholder="选择现有的API提供商"
                />
              </div>

              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                或者
              </div>

              {/* 方式2: 创建新提供商 */}
              <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  创建新的API提供商
                </h5>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Base URL
                  </label>
                  <Input
                    value={customModel.baseURL || ''}
                    onChange={(e) => setCustomModel({ ...customModel, baseURL: e.target.value, provider: '' })}
                    placeholder="例如: https://api.openai.com/v1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    API Key
                  </label>
                  <Input
                    type="password"
                    value={customModel.apiKey || ''}
                    onChange={(e) => setCustomModel({ ...customModel, apiKey: e.target.value })}
                    placeholder="例如: sk-..."
                  />
                </div>

                <p className="text-xs text-blue-600 dark:text-blue-400">
                  填写Base URL将自动创建新的API提供商
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                最大Token数
              </label>
              <Input
                type="number"
                value={customModel.maxTokens || 4096}
                onChange={(e) => setCustomModel({ ...customModel, maxTokens: parseInt(e.target.value) })}
                min="1"
                max="128000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                模型描述
              </label>
              <Input
                value={customModel.description || ''}
                onChange={(e) => setCustomModel({ ...customModel, description: e.target.value })}
                placeholder="模型特点和用途"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCustomModelModal(false)}
            >
              取消
            </Button>
            <Button onClick={handleAddCustomModel}>
              {customModel.baseURL ? '创建提供商和模型' : '添加到现有提供商'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 自定义提供商弹窗 */}
      <Modal
        open={showCustomProviderModal}
        onClose={() => setShowCustomProviderModal(false)}
        title="添加自定义API提供商"
        description="配置自定义API服务提供商"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              提供商ID *
            </label>
            <Input
              value={customProvider.id || ''}
              onChange={(e) => setCustomProvider({ ...customProvider, id: e.target.value })}
              placeholder="例如: my-custom-api"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              提供商名称 *
            </label>
            <Input
              value={customProvider.name || ''}
              onChange={(e) => setCustomProvider({ ...customProvider, name: e.target.value })}
              placeholder="例如: My Custom API"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Base URL *
            </label>
            <Input
              value={customProvider.baseURL || ''}
              onChange={(e) => setCustomProvider({ ...customProvider, baseURL: e.target.value })}
              placeholder="例如: https://api.example.com/v1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <Input
              type="password"
              value={customProvider.apiKey || ''}
              onChange={(e) => setCustomProvider({ ...customProvider, apiKey: e.target.value })}
              placeholder="请输入API密钥（可稍后配置）"
            />
          </div>

          <Switch
            label="启用此提供商"
            description="是否立即启用这个API提供商"
            checked={customProvider.isEnabled || false}
            onChange={(e) => setCustomProvider({ ...customProvider, isEnabled: e.target.checked })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCustomProviderModal(false)}
            >
              取消
            </Button>
            <Button onClick={handleAddCustomProvider}>
              添加提供商
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default SettingsPage
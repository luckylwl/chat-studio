import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { Button, Input } from './ui'
import { cn } from '@/utils'
import {
  CpuChipIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BoltIcon,
  ChartBarIcon,
  CogIcon,
  LinkIcon,
  KeyIcon,
  ServerIcon,
  CloudIcon,
  FireIcon,
  StarIcon,
  ArrowPathIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'

interface ModelPerformance {
  responseTime: number
  tokensPerSecond: number
  errorRate: number
  uptime: number
  lastChecked: number
}

interface ModelUsageStats {
  totalRequests: number
  totalTokens: number
  avgResponseTime: number
  successRate: number
  costEstimate: number
  lastUsed: number
}

interface ExtendedAIModel {
  id: string
  name: string
  provider: string
  description: string
  maxTokens: number
  contextWindow: number
  pricing: {
    input: number  // per 1K tokens
    output: number // per 1K tokens
  }
  capabilities: string[]
  tags: string[]
  isActive: boolean
  isFavorite: boolean
  performance: ModelPerformance
  usage: ModelUsageStats
  customConfig?: {
    temperature?: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
    systemPrompt?: string
  }
  apiEndpoint?: string
  version: string
  releaseDate: string
  category: 'text' | 'code' | 'multimodal' | 'specialized'
}

interface AIModelManagerProps {
  className?: string
}

const AIModelManager: React.FC<AIModelManagerProps> = ({ className }) => {
  const { apiProviders, updateAPIProvider } = useAppStore()
  const [models, setModels] = useState<ExtendedAIModel[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<'all' | 'text' | 'code' | 'multimodal' | 'specialized'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'performance' | 'usage' | 'cost'>('name')
  const [selectedModel, setSelectedModel] = useState<ExtendedAIModel | null>(null)
  const [isAddModelOpen, setIsAddModelOpen] = useState(false)
  const [isTestingModels, setIsTestingModels] = useState(false)
  const [showApiKeys, setShowApiKeys] = useState(false)

  // Initialize with mock data
  useEffect(() => {
    const mockModels: ExtendedAIModel[] = [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'OpenAI',
        description: '最新的GPT-4模型，支持128K上下文，性能更强，成本更低',
        maxTokens: 4096,
        contextWindow: 128000,
        pricing: { input: 0.01, output: 0.03 },
        capabilities: ['文本生成', '代码编写', '数据分析', '创意写作', '问题解答'],
        tags: ['推荐', '最新', '高性能'],
        isActive: true,
        isFavorite: true,
        performance: {
          responseTime: 850,
          tokensPerSecond: 45,
          errorRate: 0.02,
          uptime: 99.8,
          lastChecked: Date.now() - 300000
        },
        usage: {
          totalRequests: 1250,
          totalTokens: 125000,
          avgResponseTime: 920,
          successRate: 98.2,
          costEstimate: 24.50,
          lastUsed: Date.now() - 60000
        },
        customConfig: {
          temperature: 0.7,
          topP: 0.9,
          systemPrompt: '你是一个专业、有用的AI助手。'
        },
        version: '1.0',
        releaseDate: '2024-01-15',
        category: 'text'
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        description: 'Anthropic最强大的模型，擅长复杂推理和创意任务',
        maxTokens: 4096,
        contextWindow: 200000,
        pricing: { input: 0.015, output: 0.075 },
        capabilities: ['复杂推理', '创意写作', '代码分析', '数学解题', '文档理解'],
        tags: ['高质量', '推理能力', '创意'],
        isActive: true,
        isFavorite: false,
        performance: {
          responseTime: 1200,
          tokensPerSecond: 35,
          errorRate: 0.01,
          uptime: 99.9,
          lastChecked: Date.now() - 180000
        },
        usage: {
          totalRequests: 650,
          totalTokens: 85000,
          avgResponseTime: 1350,
          successRate: 99.1,
          costEstimate: 32.75,
          lastUsed: Date.now() - 3600000
        },
        version: '3.0',
        releaseDate: '2024-02-01',
        category: 'text'
      },
      {
        id: 'codellama-34b',
        name: 'Code Llama 34B',
        provider: 'Meta',
        description: '专业的代码生成模型，支持多种编程语言',
        maxTokens: 2048,
        contextWindow: 16000,
        pricing: { input: 0.0008, output: 0.0016 },
        capabilities: ['代码生成', '代码补全', '代码解释', 'Bug修复', '重构建议'],
        tags: ['代码专用', '开源', '经济'],
        isActive: true,
        isFavorite: false,
        performance: {
          responseTime: 650,
          tokensPerSecond: 60,
          errorRate: 0.05,
          uptime: 98.5,
          lastChecked: Date.now() - 600000
        },
        usage: {
          totalRequests: 890,
          totalTokens: 45000,
          avgResponseTime: 700,
          successRate: 96.8,
          costEstimate: 3.20,
          lastUsed: Date.now() - 1800000
        },
        version: '1.0',
        releaseDate: '2023-08-25',
        category: 'code'
      },
      {
        id: 'gpt-4-vision',
        name: 'GPT-4 Vision',
        provider: 'OpenAI',
        description: '支持图像理解的多模态模型，可以分析图片内容',
        maxTokens: 4096,
        contextWindow: 128000,
        pricing: { input: 0.01, output: 0.03 },
        capabilities: ['图像理解', '图表分析', '文本识别', '视觉问答', '内容描述'],
        tags: ['多模态', '图像', '实验性'],
        isActive: false,
        isFavorite: true,
        performance: {
          responseTime: 1500,
          tokensPerSecond: 25,
          errorRate: 0.08,
          uptime: 97.2,
          lastChecked: Date.now() - 900000
        },
        usage: {
          totalRequests: 120,
          totalTokens: 15000,
          avgResponseTime: 1650,
          successRate: 94.5,
          costEstimate: 8.75,
          lastUsed: Date.now() - 86400000
        },
        version: '1.0',
        releaseDate: '2023-11-15',
        category: 'multimodal'
      }
    ]
    setModels(mockModels)
  }, [])

  // Filter and sort models
  const filteredModels = models
    .filter(model => {
      const matchesSearch = searchTerm === '' ||
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.capabilities.some(cap => cap.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCategory = filterCategory === 'all' || model.category === filterCategory

      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'performance':
          return a.performance.responseTime - b.performance.responseTime
        case 'usage':
          return b.usage.totalRequests - a.usage.totalRequests
        case 'cost':
          return a.pricing.input - b.pricing.input
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const testModelPerformance = async (modelId: string) => {
    setIsTestingModels(true)

    // Simulate testing
    setTimeout(() => {
      setModels(prev => prev.map(model =>
        model.id === modelId
          ? {
              ...model,
              performance: {
                ...model.performance,
                responseTime: Math.random() * 1000 + 500,
                tokensPerSecond: Math.random() * 40 + 20,
                errorRate: Math.random() * 0.1,
                uptime: Math.random() * 2 + 98,
                lastChecked: Date.now()
              }
            }
          : model
      ))
      setIsTestingModels(false)
    }, 2000)
  }

  const toggleModelActive = (modelId: string) => {
    setModels(prev => prev.map(model =>
      model.id === modelId ? { ...model, isActive: !model.isActive } : model
    ))
  }

  const toggleModelFavorite = (modelId: string) => {
    setModels(prev => prev.map(model =>
      model.id === modelId ? { ...model, isFavorite: !model.isFavorite } : model
    ))
  }

  const getPerformanceColor = (value: number, type: 'responseTime' | 'errorRate' | 'uptime') => {
    switch (type) {
      case 'responseTime':
        if (value < 800) return 'text-green-600 dark:text-green-400'
        if (value < 1500) return 'text-yellow-600 dark:text-yellow-400'
        return 'text-red-600 dark:text-red-400'
      case 'errorRate':
        if (value < 0.05) return 'text-green-600 dark:text-green-400'
        if (value < 0.1) return 'text-yellow-600 dark:text-yellow-400'
        return 'text-red-600 dark:text-red-400'
      case 'uptime':
        if (value > 99) return 'text-green-600 dark:text-green-400'
        if (value > 95) return 'text-yellow-600 dark:text-yellow-400'
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const ModelCard: React.FC<{ model: ExtendedAIModel }> = ({ model }) => (
    <div
      className={cn(
        'border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer',
        model.isActive ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900 opacity-75',
        selectedModel?.id === model.id && 'ring-2 ring-blue-500'
      )}
      onClick={() => setSelectedModel(selectedModel?.id === model.id ? null : model)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            model.category === 'text' && 'bg-blue-100 dark:bg-blue-900/50',
            model.category === 'code' && 'bg-green-100 dark:bg-green-900/50',
            model.category === 'multimodal' && 'bg-purple-100 dark:bg-purple-900/50',
            model.category === 'specialized' && 'bg-orange-100 dark:bg-orange-900/50'
          )}>
            {model.category === 'text' && <CpuChipIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            {model.category === 'code' && <BoltIcon className="h-5 w-5 text-green-600 dark:text-green-400" />}
            {model.category === 'multimodal' && <EyeIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            {model.category === 'specialized' && <FireIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{model.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{model.provider} • v{model.version}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleModelFavorite(model.id)
            }}
            className={cn(
              'p-1 rounded-full transition-colors',
              model.isFavorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            <StarIcon className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleModelActive(model.id)
            }}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              model.isActive
                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
            )}
          >
            {model.isActive ? '已启用' : '已禁用'}
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
        {model.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {model.tags.map(tag => (
          <span
            key={tag}
            className={cn(
              'px-2 py-1 text-xs rounded-full',
              tag === '推荐' && 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
              tag === '最新' && 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
              tag === '高性能' && 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
              !['推荐', '最新', '高性能'].includes(tag) && 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            )}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className={cn('text-lg font-semibold', getPerformanceColor(model.performance.responseTime, 'responseTime'))}>
            {model.performance.responseTime.toFixed(0)}ms
          </div>
          <div className="text-xs text-gray-500">响应时间</div>
        </div>
        <div className="text-center">
          <div className={cn('text-lg font-semibold', getPerformanceColor(model.performance.uptime, 'uptime'))}>
            {model.performance.uptime.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500">可用性</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formatCurrency(model.usage.costEstimate)}
          </div>
          <div className="text-xs text-gray-500">本月费用</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              testModelPerformance(model.id)
            }}
            disabled={isTestingModels}
          >
            {isTestingModels ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <ChartBarIcon className="h-4 w-4" />
            )}
            测试
          </Button>
          <Button variant="outline" size="sm">
            <CogIcon className="h-4 w-4" />
            配置
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          上次使用: {Math.floor((Date.now() - model.usage.lastUsed) / 60000)}分钟前
        </div>
      </div>

      {/* Expanded Details */}
      {selectedModel?.id === model.id && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Capabilities */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">核心能力</h4>
              <div className="space-y-2">
                {model.capabilities.map(capability => (
                  <div key={capability} className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{capability}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Specs */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">技术规格</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">最大输出:</span>
                  <span className="text-gray-900 dark:text-gray-100">{model.maxTokens.toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">上下文窗口:</span>
                  <span className="text-gray-900 dark:text-gray-100">{model.contextWindow.toLocaleString()} tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">输入价格:</span>
                  <span className="text-gray-900 dark:text-gray-100">${model.pricing.input}/1K tokens</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">输出价格:</span>
                  <span className="text-gray-900 dark:text-gray-100">${model.pricing.output}/1K tokens</span>
                </div>
              </div>
            </div>

            {/* Usage Statistics */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">使用统计</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">总请求数:</span>
                  <span className="text-gray-900 dark:text-gray-100">{model.usage.totalRequests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">总Token数:</span>
                  <span className="text-gray-900 dark:text-gray-100">{model.usage.totalTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">成功率:</span>
                  <span className="text-gray-900 dark:text-gray-100">{model.usage.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">平均响应:</span>
                  <span className="text-gray-900 dark:text-gray-100">{model.usage.avgResponseTime}ms</span>
                </div>
              </div>
            </div>

            {/* Custom Configuration */}
            {model.customConfig && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">自定义配置</h4>
                <div className="space-y-2 text-sm">
                  {model.customConfig.temperature && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Temperature:</span>
                      <span className="text-gray-900 dark:text-gray-100">{model.customConfig.temperature}</span>
                    </div>
                  )}
                  {model.customConfig.topP && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Top P:</span>
                      <span className="text-gray-900 dark:text-gray-100">{model.customConfig.topP}</span>
                    </div>
                  )}
                  {model.customConfig.systemPrompt && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">系统提示词:</span>
                      <p className="text-gray-900 dark:text-gray-100 mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                        {model.customConfig.systemPrompt}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
              <ServerIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">AI模型管理中心</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">统一管理和监控所有AI模型的性能与使用情况</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowApiKeys(!showApiKeys)}
              className="flex items-center gap-2"
            >
              {showApiKeys ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              {showApiKeys ? '隐藏' : '显示'} API密钥
            </Button>
            <Button onClick={() => setIsAddModelOpen(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              添加模型
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{models.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">总模型数</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {models.filter(m => m.isActive).length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">已启用</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {Math.round(models.reduce((avg, m) => avg + m.performance.uptime, 0) / models.length)}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">平均可用性</div>
          </div>
          <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100 text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(models.reduce((sum, m) => sum + m.usage.costEstimate, 0))}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">本月总费用</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder="搜索模型名称、提供商或功能..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">全部类别</option>
            <option value="text">文本模型</option>
            <option value="code">代码模型</option>
            <option value="multimodal">多模态</option>
            <option value="specialized">专用模型</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="name">按名称排序</option>
            <option value="performance">按性能排序</option>
            <option value="usage">按使用量排序</option>
            <option value="cost">按成本排序</option>
          </select>
        </div>
      </div>

      {/* Models Grid */}
      <div className="p-6">
        {filteredModels.length === 0 ? (
          <div className="text-center py-12">
            <ServerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              未找到匹配的模型
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              尝试调整搜索条件或添加新的AI模型
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredModels.map(model => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">系统性能概览</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">所有启用模型的综合性能指标</p>
          </div>

          <div className="flex items-center gap-6 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {Math.round(models.filter(m => m.isActive).reduce((avg, m) => avg + m.performance.responseTime, 0) / models.filter(m => m.isActive).length || 0)}ms
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">平均响应时间</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {(models.filter(m => m.isActive).reduce((avg, m) => avg + m.performance.uptime, 0) / models.filter(m => m.isActive).length || 0).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">系统可用性</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {models.filter(m => m.isActive).reduce((sum, m) => sum + m.usage.totalRequests, 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">总请求数</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIModelManager
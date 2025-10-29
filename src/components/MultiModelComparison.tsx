import React, { useState } from 'react'
import {
  SparklesIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { Button, Badge, Card } from './ui'
import { cn } from '@/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useAppStore } from '@/store'
import { AIApiService } from '@/services/aiApi'
import type { APIProvider, Message } from '@/types'

interface MultiModelComparisonProps {
  isOpen: boolean
  onClose: () => void
}

interface ModelResponse {
  provider: APIProvider
  response: string
  loading: boolean
  error: string | null
  startTime: number | null
  endTime: number | null
  tokens?: number
}

const AVAILABLE_MODELS = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai', color: 'green' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', color: 'blue' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'anthropic', color: 'purple' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic', color: 'indigo' },
  { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google', color: 'orange' }
]

const MultiModelComparison: React.FC<MultiModelComparisonProps> = ({
  isOpen,
  onClose
}) => {
  const { apiProviders, chatConfig } = useAppStore()
  const [prompt, setPrompt] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4', 'claude-3-opus'])
  const [responses, setResponses] = useState<Record<string, ModelResponse>>({})
  const [isComparing, setIsComparing] = useState(false)

  // 切换模型选择
  const toggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      setSelectedModels(selectedModels.filter(id => id !== modelId))
    } else {
      if (selectedModels.length >= 4) {
        toast.error('最多同时对比 4 个模型')
        return
      }
      setSelectedModels([...selectedModels, modelId])
    }
  }

  // 获取提供商配置
  const getProviderConfig = (providerId: string): APIProvider | undefined => {
    return apiProviders.find(p => p.id === providerId)
  }

  // 向单个模型发送请求
  const sendToModel = async (modelId: string): Promise<void> => {
    const modelInfo = AVAILABLE_MODELS.find(m => m.id === modelId)
    if (!modelInfo) return

    const providerConfig = getProviderConfig(modelInfo.provider)
    if (!providerConfig) {
      setResponses(prev => ({
        ...prev,
        [modelId]: {
          ...prev[modelId],
          loading: false,
          error: `未配置 ${modelInfo.provider} API`,
          endTime: Date.now()
        }
      }))
      return
    }

    try {
      const aiService = new AIApiService(providerConfig)
      const messages: Message[] = [
        {
          id: `msg_${Date.now()}`,
          role: 'user',
          content: prompt,
          timestamp: Date.now()
        }
      ]

      const config = {
        ...chatConfig,
        model: modelId,
        stream: false
      }

      const result = await aiService.sendMessage(messages, config)

      setResponses(prev => ({
        ...prev,
        [modelId]: {
          ...prev[modelId],
          loading: false,
          response: result.content,
          tokens: result.tokens,
          endTime: Date.now()
        }
      }))
    } catch (error) {
      setResponses(prev => ({
        ...prev,
        [modelId]: {
          ...prev[modelId],
          loading: false,
          error: error instanceof Error ? error.message : '请求失败',
          endTime: Date.now()
        }
      }))
    }
  }

  // 开始对比
  const startComparison = async () => {
    if (!prompt.trim()) {
      toast.error('请输入提示词')
      return
    }

    if (selectedModels.length < 2) {
      toast.error('请至少选择 2 个模型进行对比')
      return
    }

    setIsComparing(true)

    // 初始化响应状态
    const initialResponses: Record<string, ModelResponse> = {}
    selectedModels.forEach(modelId => {
      const modelInfo = AVAILABLE_MODELS.find(m => m.id === modelId)!
      const providerConfig = getProviderConfig(modelInfo.provider)!

      initialResponses[modelId] = {
        provider: providerConfig,
        response: '',
        loading: true,
        error: null,
        startTime: Date.now(),
        endTime: null
      }
    })
    setResponses(initialResponses)

    // 并行发送请求
    await Promise.all(selectedModels.map(modelId => sendToModel(modelId)))

    setIsComparing(false)
    toast.success('对比完成')
  }

  // 格式化响应时间
  const formatResponseTime = (response: ModelResponse): string => {
    if (!response.startTime || !response.endTime) return '-'
    const time = (response.endTime - response.startTime) / 1000
    return `${time.toFixed(2)}s`
  }

  // 计算平均响应时间
  const getAverageResponseTime = (): string => {
    const completedResponses = Object.values(responses).filter(
      r => r.startTime && r.endTime && !r.error
    )
    if (completedResponses.length === 0) return '-'

    const avgTime = completedResponses.reduce((sum, r) => {
      return sum + (r.endTime! - r.startTime!) / 1000
    }, 0) / completedResponses.length

    return `${avgTime.toFixed(2)}s`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-6xl max-h-[90vh] rounded-xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-6 h-6 text-purple-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                多模型并行对比
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                同时向多个 AI 模型发送相同问题，对比回答质量
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Input Area */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              输入提示词
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请输入你想问的问题..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder-gray-400 dark:placeholder-gray-500 resize-none"
              rows={4}
              disabled={isComparing}
            />
          </div>

          {/* Model Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              选择模型 ({selectedModels.length}/4)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {AVAILABLE_MODELS.map(model => {
                const isSelected = selectedModels.includes(model.id)
                const providerConfig = getProviderConfig(model.provider)
                const isConfigured = !!providerConfig?.apiKey

                return (
                  <button
                    key={model.id}
                    onClick={() => toggleModel(model.id)}
                    disabled={!isConfigured || isComparing}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-left',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                      !isConfigured && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {model.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {model.provider}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>
                    {!isConfigured && (
                      <p className="text-xs text-red-500 mt-2">未配置 API</p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Comparison Results */}
          {Object.keys(responses).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  对比结果
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  平均响应时间: {getAverageResponseTime()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedModels.map(modelId => {
                  const modelInfo = AVAILABLE_MODELS.find(m => m.id === modelId)!
                  const response = responses[modelId]
                  if (!response) return null

                  return (
                    <Card key={modelId} className="p-4 space-y-3">
                      {/* Model Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {modelInfo.name}
                          </h4>
                          {response.loading && (
                            <Badge variant="info">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              加载中...
                            </Badge>
                          )}
                          {response.error && (
                            <Badge variant="error">
                              <ExclamationCircleIcon className="w-3 h-3 mr-1" />
                              错误
                            </Badge>
                          )}
                          {!response.loading && !response.error && (
                            <Badge variant="success">
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              完成
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatResponseTime(response)}
                        </span>
                      </div>

                      {/* Response Content */}
                      <div className="min-h-[200px] max-h-[400px] overflow-y-auto">
                        {response.loading && (
                          <div className="flex items-center justify-center h-48">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                          </div>
                        )}
                        {response.error && (
                          <div className="text-red-500 text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded">
                            {response.error}
                          </div>
                        )}
                        {!response.loading && !response.error && response.response && (
                          <div className="prose dark:prose-invert max-w-none text-sm">
                            {response.response}
                          </div>
                        )}
                      </div>

                      {/* Metadata */}
                      {response.tokens && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                          Tokens: {response.tokens.toLocaleString()}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 p-6">
          <Button variant="secondary" onClick={onClose}>
            关闭
          </Button>
          <Button
            onClick={startComparison}
            disabled={isComparing || selectedModels.length < 2 || !prompt.trim()}
          >
            <PaperAirplaneIcon className="w-5 h-5 mr-2" />
            {isComparing ? '对比中...' : '开始对比'}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default MultiModelComparison

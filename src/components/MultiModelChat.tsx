import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  StarIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  AdjustmentsHorizontalIcon,
  BoltIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

interface ModelResponse {
  id: string
  modelId: string
  content: string
  status: 'thinking' | 'streaming' | 'completed' | 'error'
  startTime: number
  endTime?: number
  tokenCount?: number
  cost?: number
  error?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  modelResponses?: ModelResponse[]
}

interface ModelConfig {
  id: string
  name: string
  provider: string
  icon: string
  color: string
  maxTokens: number
  costPer1k: number
  description: string
  isEnabled: boolean
  parameters: {
    temperature: number
    topP: number
    maxTokens: number
    presencePenalty: number
    frequencyPenalty: number
  }
}

interface ComparisonMetrics {
  responseTime: number
  tokenCount: number
  cost: number
  quality: number
  creativity: number
  accuracy: number
}

const MultiModelChat: React.FC = () => {
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'tabbed' | 'overlay'>('side-by-side')
  const [showMetrics, setShowMetrics] = useState(true)
  const [autoRun, setAutoRun] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const availableModels: ModelConfig[] = [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI',
      icon: '🔥',
      color: 'blue',
      maxTokens: 128000,
      costPer1k: 0.03,
      description: '最新的GPT-4优化模型，平衡性能和成本',
      isEnabled: true,
      parameters: {
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 4000,
        presencePenalty: 0,
        frequencyPenalty: 0
      }
    },
    {
      id: 'claude-3-5-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      icon: '🎭',
      color: 'purple',
      maxTokens: 200000,
      costPer1k: 0.015,
      description: '平衡推理能力和速度的Claude模型',
      isEnabled: true,
      parameters: {
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 4000,
        presencePenalty: 0,
        frequencyPenalty: 0
      }
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'Google',
      icon: '💎',
      color: 'green',
      maxTokens: 2000000,
      costPer1k: 0.0025,
      description: 'Google的多模态大语言模型',
      isEnabled: true,
      parameters: {
        temperature: 0.7,
        topP: 0.8,
        maxTokens: 4000,
        presencePenalty: 0,
        frequencyPenalty: 0
      }
    },
    {
      id: 'llama-3-70b',
      name: 'Llama 3 70B',
      provider: 'Meta',
      icon: '🦙',
      color: 'orange',
      maxTokens: 8192,
      costPer1k: 0.0008,
      description: 'Meta的开源大语言模型',
      isEnabled: false,
      parameters: {
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 4000,
        presencePenalty: 0,
        frequencyPenalty: 0
      }
    },
    {
      id: 'qwen-turbo',
      name: 'Qwen Turbo',
      provider: 'Alibaba',
      icon: '🚀',
      color: 'red',
      maxTokens: 8000,
      costPer1k: 0.002,
      description: '阿里巴巴的千问大模型',
      isEnabled: false,
      parameters: {
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 4000,
        presencePenalty: 0,
        frequencyPenalty: 0
      }
    },
    {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat',
      provider: 'DeepSeek',
      icon: '🤿',
      color: 'indigo',
      maxTokens: 32000,
      costPer1k: 0.001,
      description: 'DeepSeek的对话模型',
      isEnabled: false,
      parameters: {
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 4000,
        presencePenalty: 0,
        frequencyPenalty: 0
      }
    }
  ]

  const enabledModels = availableModels.filter(model => selectedModels.includes(model.id))

  useEffect(() => {
    // 默认选择前3个模型
    setSelectedModels(['gpt-4o', 'claude-3-5-sonnet', 'gemini-pro'])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || selectedModels.length === 0) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsGenerating(true)

    // 创建助手消息框架
    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelResponses: selectedModels.map(modelId => ({
        id: `resp-${modelId}-${Date.now()}`,
        modelId,
        content: '',
        status: 'thinking' as const,
        startTime: Date.now()
      }))
    }

    setMessages(prev => [...prev, assistantMessage])

    // 模拟并发调用多个模型
    const promises = selectedModels.map(async (modelId, index) => {
      const model = availableModels.find(m => m.id === modelId)!
      const delay = Math.random() * 2000 + 1000 // 1-3秒延迟

      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, delay))

      // 更新状态为流式输出
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessage.id ? {
          ...msg,
          modelResponses: msg.modelResponses?.map(resp =>
            resp.modelId === modelId ? { ...resp, status: 'streaming' as const } : resp
          )
        } : msg
      ))

      // 模拟流式响应
      const responses = [
        `这是${model.name}的回答。${userMessage.content}是一个很好的问题。`,
        `根据我的理解，${userMessage.content}可以从以下几个角度来分析：`,
        `首先，我们需要考虑这个问题的背景和context...`,
        `总的来说，这是一个复杂且有趣的话题，值得深入探讨。`
      ]

      const fullResponse = responses[index % responses.length] + `

这个回答来自${model.name}（${model.provider}），展示了该模型的独特特性和处理方式。
模型参数：Temperature ${model.parameters.temperature}，Top-P ${model.parameters.topP}。

让我详细分析一下这个问题的各个方面...`

      // 模拟字符逐个输出
      for (let i = 0; i <= fullResponse.length; i += Math.floor(Math.random() * 5) + 1) {
        const partialContent = fullResponse.slice(0, i)

        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessage.id ? {
            ...msg,
            modelResponses: msg.modelResponses?.map(resp =>
              resp.modelId === modelId ? {
                ...resp,
                content: partialContent,
                status: i >= fullResponse.length ? 'completed' as const : 'streaming' as const,
                endTime: i >= fullResponse.length ? Date.now() : undefined,
                tokenCount: i >= fullResponse.length ? Math.floor(fullResponse.length / 4) : undefined,
                cost: i >= fullResponse.length ? Math.floor(fullResponse.length / 4) * model.costPer1k / 1000 : undefined
              } : resp
            )
          } : msg
        ))

        if (i < fullResponse.length) {
          await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30))
        }
      }
    })

    await Promise.all(promises)
    setIsGenerating(false)
  }

  const handleToggleModel = (modelId: string) => {
    setSelectedModels(prev =>
      prev.includes(modelId)
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    )
  }

  const calculateMetrics = (response: ModelResponse): ComparisonMetrics => {
    const responseTime = response.endTime ? response.endTime - response.startTime : 0
    return {
      responseTime,
      tokenCount: response.tokenCount || 0,
      cost: response.cost || 0,
      quality: Math.random() * 2 + 8, // 8-10
      creativity: Math.random() * 2 + 7, // 7-9
      accuracy: Math.random() * 2 + 8 // 8-10
    }
  }

  const ModelResponseCard: React.FC<{
    response: ModelResponse
    model: ModelConfig
    isLast?: boolean
  }> = ({ response, model, isLast }) => {
    const metrics = response.status === 'completed' ? calculateMetrics(response) : null

    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border-2 transition-all duration-200 ${
        response.status === 'streaming' ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'
      }`}>
        {/* 模型头部 */}
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xl">{model.icon}</span>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{model.name}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{model.provider}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {response.status === 'thinking' && (
                <div className="flex items-center space-x-1 text-gray-500">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                  <span className="text-xs">思考中...</span>
                </div>
              )}
              {response.status === 'streaming' && (
                <div className="flex items-center space-x-1 text-blue-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  <span className="text-xs">生成中...</span>
                </div>
              )}
              {response.status === 'completed' && (
                <div className="flex items-center space-x-1 text-green-500">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span className="text-xs">完成</span>
                </div>
              )}
              {response.status === 'error' && (
                <div className="flex items-center space-x-1 text-red-500">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  <span className="text-xs">错误</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 响应内容 */}
        <div className="p-4">
          {response.content ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                {response.content}
                {response.status === 'streaming' && (
                  <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse" />
                )}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-20 text-gray-400">
              <div className="text-center">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto mb-2" />
                <span className="text-xs">等待响应...</span>
              </div>
            </div>
          )}
        </div>

        {/* 指标显示 */}
        {showMetrics && metrics && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-b-lg border-t border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {(metrics.responseTime / 1000).toFixed(1)}s
                </div>
                <div className="text-gray-500 dark:text-gray-400">响应时间</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {metrics.tokenCount}
                </div>
                <div className="text-gray-500 dark:text-gray-400">Token数</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900 dark:text-white">
                  ${metrics.cost.toFixed(4)}
                </div>
                <div className="text-gray-500 dark:text-gray-400">成本</div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* 头部工具栏 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <BeakerIcon className="w-6 h-6" />
              <span>多模型对话比较</span>
            </h1>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">已选择:</span>
              <div className="flex space-x-1">
                {enabledModels.map(model => (
                  <span
                    key={model.id}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full flex items-center space-x-1"
                  >
                    <span>{model.icon}</span>
                    <span>{model.name}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMetrics(!showMetrics)}
              className={`p-2 rounded-lg transition-colors ${
                showMetrics
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <ChartBarIcon className="w-5 h-5" />
            </button>

            <select
              value={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="side-by-side">并排显示</option>
              <option value="tabbed">标签切换</option>
              <option value="overlay">叠加显示</option>
            </select>

            <button
              onClick={() => setShowModelSelector(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>选择模型</span>
            </button>
          </div>
        </div>
      </div>

      {/* 对话区域 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4 space-y-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {message.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-md">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comparisonMode === 'side-by-side' && (
                      <div className={`grid gap-4 ${
                        selectedModels.length === 1 ? 'grid-cols-1' :
                        selectedModels.length === 2 ? 'grid-cols-2' :
                        selectedModels.length === 3 ? 'grid-cols-3' :
                        'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                      }`}>
                        {message.modelResponses?.map((response, index) => {
                          const model = availableModels.find(m => m.id === response.modelId)!
                          return (
                            <ModelResponseCard
                              key={response.id}
                              response={response}
                              model={model}
                              isLast={index === message.modelResponses!.length - 1}
                            />
                          )
                        })}
                      </div>
                    )}

                    {comparisonMode === 'tabbed' && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex border-b border-gray-200 dark:border-gray-700">
                          {message.modelResponses?.map((response, index) => {
                            const model = availableModels.find(m => m.id === response.modelId)!
                            return (
                              <button
                                key={response.id}
                                className={`px-4 py-2 text-sm font-medium ${
                                  index === 0
                                    ? `text-${model.color}-600 bg-${model.color}-50 dark:bg-${model.color}-900/20`
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                              >
                                {model.icon} {model.name}
                              </button>
                            )
                          })}
                        </div>
                        <div className="p-4">
                          {message.modelResponses?.[0] && (
                            <ModelResponseCard
                              response={message.modelResponses[0]}
                              model={availableModels.find(m => m.id === message.modelResponses![0].modelId)!}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }}
              placeholder="输入消息同时发送给多个模型进行比较..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isGenerating}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || selectedModels.length === 0 || isGenerating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  <span>生成中</span>
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4" />
                  <span>发送到所有模型</span>
                </>
              )}
            </button>
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {selectedModels.length} 个模型
            </div>
          </div>
        </div>
      </div>

      {/* 模型选择器 */}
      <AnimatePresence>
        {showModelSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowModelSelector(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    选择对比模型
                  </h2>
                  <button
                    onClick={() => setShowModelSelector(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableModels.map(model => (
                    <div
                      key={model.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedModels.includes(model.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                      onClick={() => handleToggleModel(model.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{model.icon}</span>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {model.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {model.provider}
                            </p>
                          </div>
                        </div>
                        {selectedModels.includes(model.id) && (
                          <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {model.description}
                      </p>

                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Max: {model.maxTokens.toLocaleString()}</span>
                        <span>${model.costPer1k}/1K tokens</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    已选择 {selectedModels.length} 个模型进行对比
                  </div>
                  <button
                    onClick={() => setShowModelSelector(false)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    确认选择
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MultiModelChat
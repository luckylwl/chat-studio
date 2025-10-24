import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDownIcon,
  SparklesIcon,
  BoltIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  StarIcon,
  ChartBarIcon,
  SwitchHorizontalIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { Button } from './ui'
import { cn } from '@/utils'
import { modelManagementService, type AIModel, type ModelRecommendation } from '@/services/modelManagementService'
import { useUserInteractionTracking } from '@/hooks/useErrorReporting'

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
  conversationContext?: {
    messageCount: number
    averageMessageLength: number
    taskType?: string
    languages?: string[]
  }
  className?: string
  showRecommendations?: boolean
  showPerformanceMetrics?: boolean
  allowCustomModels?: boolean
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  conversationContext,
  className,
  showRecommendations = true,
  showPerformanceMetrics = true,
  allowCustomModels = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterProvider, setFilterProvider] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'quality' | 'speed' | 'cost' | 'popularity'>('quality')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [recommendations, setRecommendations] = useState<ModelRecommendation[]>([])
  const [models, setModels] = useState<AIModel[]>([])

  const { trackClick, trackFeatureUsage } = useUserInteractionTracking()

  useEffect(() => {
    const allModels = modelManagementService.getAllModels()
    setModels(allModels)

    if (showRecommendations && conversationContext) {
      const recs = modelManagementService.getModelRecommendations({
        taskType: conversationContext.taskType,
        conversationHistory: [], // Would pass actual history
        prioritizeQuality: sortBy === 'quality',
        prioritizeSpeed: sortBy === 'speed',
        prioritizeCost: sortBy === 'cost'
      })
      setRecommendations(recs)
    }
  }, [showRecommendations, conversationContext, sortBy])

  const filteredAndSortedModels = useMemo(() => {
    let filtered = models.filter(model => {
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           model.provider.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesProvider = filterProvider === 'all' || model.provider === filterProvider
      return matchesSearch && matchesProvider
    })

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'quality':
          return b.qualityScore - a.qualityScore
        case 'speed':
          return a.latencyMs - b.latencyMs
        case 'cost':
          const aCost = (a.costPer1KTokens.input + a.costPer1KTokens.output) / 2
          const bCost = (b.costPer1KTokens.input + b.costPer1KTokens.output) / 2
          return aCost - bCost
        case 'popularity':
          const aMetrics = modelManagementService.getModelPerformance(a.id)
          const bMetrics = modelManagementService.getModelPerformance(b.id)
          return (bMetrics?.popularityScore || 0) - (aMetrics?.popularityScore || 0)
        default:
          return 0
      }
    })
  }, [models, searchTerm, filterProvider, sortBy])

  const selectedModelData = models.find(m => m.id === selectedModel)
  const providers = useMemo(() => {
    return Array.from(new Set(models.map(m => m.provider)))
  }, [models])

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId)
    setIsOpen(false)
    trackClick('model-select', 'dropdown', { modelId })
    trackFeatureUsage('model-switching', {
      from: selectedModel,
      to: modelId,
      context: conversationContext
    })
  }

  const getProviderIcon = (provider: string) => {
    const icons: { [key: string]: string } = {
      openai: '🤖',
      anthropic: '🧠',
      google: '🔍',
      cohere: '📊',
      huggingface: '🤗',
      local: '💻'
    }
    return icons[provider] || '⚡'
  }

  const getCapabilityIcon = (type: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      text: <SparklesIcon className="w-4 h-4" />,
      code: <BoltIcon className="w-4 h-4" />,
      reasoning: <ChartBarIcon className="w-4 h-4" />,
      creative: <StarIcon className="w-4 h-4" />,
      analysis: <InformationCircleIcon className="w-4 h-4" />
    }
    return icons[type] || <SparklesIcon className="w-4 h-4" />
  }

  const formatCost = (cost: number) => {
    if (cost < 0.001) return '<$0.001'
    return `$${cost.toFixed(3)}`
  }

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 80) return 'text-blue-600 dark:text-blue-400'
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const renderModelCard = (model: AIModel, isRecommended = false) => {
    const performance = modelManagementService.getModelPerformance(model.id)
    const recommendation = recommendations.find(r => r.modelId === model.id)

    return (
      <motion.div
        key={model.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md',
          selectedModel === model.id
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
          isRecommended && 'ring-2 ring-green-400/50'
        )}
        onClick={() => handleModelSelect(model.id)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getProviderIcon(model.provider)}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {model.name}
                </h3>
                {isRecommended && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                    Recommended
                  </span>
                )}
                {model.isDeprecated && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                    Deprecated
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {model.provider} • {model.category}
              </p>
            </div>
          </div>

          {selectedModel === model.id && (
            <CheckCircleIcon className="w-5 h-5 text-blue-500" />
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          <div className="text-center">
            <div className={cn('text-lg font-bold', getQualityColor(model.qualityScore))}>
              {model.qualityScore}
            </div>
            <div className="text-xs text-gray-500">Quality</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatLatency(model.latencyMs)}
            </div>
            <div className="text-xs text-gray-500">Speed</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {formatCost(model.costPer1KTokens.input)}
            </div>
            <div className="text-xs text-gray-500">Cost/1K</div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {(model.contextWindow / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-gray-500">Context</div>
          </div>
        </div>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-2 mb-3">
          {model.capabilities.slice(0, 4).map((cap, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs"
            >
              {getCapabilityIcon(cap.type)}
              <span className="capitalize">{cap.type}</span>
              <span className={cn('font-medium', getQualityColor(cap.score))}>
                {cap.score}
              </span>
            </div>
          ))}
        </div>

        {/* Performance & Recommendations */}
        {showPerformanceMetrics && performance && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Success: {(performance.successRate * 100).toFixed(1)}%</span>
              <span>Used: {performance.totalRequests} times</span>
              {performance.userRating > 0 && (
                <div className="flex items-center gap-1">
                  <StarIconSolid className="w-3 h-3 text-yellow-500" />
                  <span>{performance.userRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {recommendation && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <div className="font-medium text-green-600 dark:text-green-400 mb-1">
                Match Score: {recommendation.score.toFixed(0)}%
              </div>
              <div className="space-y-1">
                {recommendation.reasons.slice(0, 2).map((reason, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between">
                <span>Est. Cost: {formatCost(recommendation.estimatedCost)}</span>
                <span>Est. Time: {formatLatency(recommendation.estimatedLatency)}</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      {/* Main Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full justify-between',
          isOpen && 'ring-2 ring-blue-500/20'
        )}
      >
        <div className="flex items-center gap-3">
          {selectedModelData && (
            <>
              <span className="text-lg">{getProviderIcon(selectedModelData.provider)}</span>
              <div className="text-left">
                <div className="font-medium">{selectedModelData.name}</div>
                <div className="text-xs text-gray-500 capitalize">
                  {selectedModelData.provider}
                </div>
              </div>
            </>
          )}
          {!selectedModelData && (
            <span className="text-gray-500">Select a model...</span>
          )}
        </div>
        <ChevronDownIcon className={cn(
          'w-4 h-4 transition-transform',
          isOpen && 'transform rotate-180'
        )} />
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-hidden"
          >
            {/* Header with Search and Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="space-y-3">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-2">
                  <select
                    value={filterProvider}
                    onChange={(e) => setFilterProvider(e.target.value)}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700"
                  >
                    <option value="all">All Providers</option>
                    {providers.map(provider => (
                      <option key={provider} value={provider} className="capitalize">
                        {provider}
                      </option>
                    ))}
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700"
                  >
                    <option value="quality">Sort by Quality</option>
                    <option value="speed">Sort by Speed</option>
                    <option value="cost">Sort by Cost</option>
                    <option value="popularity">Sort by Popularity</option>
                  </select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs"
                  >
                    <AdjustmentsHorizontalIcon className="w-4 h-4" />
                    Advanced
                  </Button>
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span>Multimodal</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span>Function Calling</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" />
                        <span>Large Context</span>
                      </label>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Recommendations Section */}
            {showRecommendations && recommendations.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  Recommended for You
                </h4>
                <div className="grid gap-3">
                  {recommendations.slice(0, 2).map(rec => {
                    const model = models.find(m => m.id === rec.modelId)
                    return model ? renderModelCard(model, true) : null
                  })}
                </div>
              </div>
            )}

            {/* Models List */}
            <div className="max-h-96 overflow-y-auto p-4">
              <div className="space-y-3">
                {filteredAndSortedModels.map(model => renderModelCard(model))}
              </div>

              {filteredAndSortedModels.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <ExclamationTriangleIcon className="w-8 h-8 mx-auto mb-2" />
                  <p>No models found matching your criteria</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                <span>{filteredAndSortedModels.length} models available</span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  {allowCustomModels && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      Add Custom Model
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ModelSelector
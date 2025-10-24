import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChartBarIcon,
  BoltIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  ArrowsRightLeftIcon,
  StarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { Button } from './ui'
import { cn } from '@/utils'
import { modelManagementService, type AIModel, type ModelPerformanceMetrics } from '@/services/modelManagementService'

interface ModelComparisonProps {
  isOpen: boolean
  onClose: () => void
  initialModels?: string[]
  onModelSelect?: (modelId: string) => void
  className?: string
}

interface ComparisonModel {
  model: AIModel
  metrics: ModelPerformanceMetrics | null
  selected: boolean
}

const ModelComparison: React.FC<ModelComparisonProps> = ({
  isOpen,
  onClose,
  initialModels = [],
  onModelSelect,
  className
}) => {
  const [comparisonModels, setComparisonModels] = useState<ComparisonModel[]>([])
  const [availableModels, setAvailableModels] = useState<AIModel[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModel, setShowAddModel] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<'quality' | 'speed' | 'cost' | 'reliability'>('quality')

  useEffect(() => {
    const models = modelManagementService.getAllModels()
    setAvailableModels(models)

    // Initialize with provided models
    if (initialModels.length > 0) {
      const initialComparison = initialModels.map(modelId => {
        const model = models.find(m => m.id === modelId)
        if (model) {
          return {
            model,
            metrics: modelManagementService.getModelPerformance(modelId),
            selected: false
          }
        }
        return null
      }).filter(Boolean) as ComparisonModel[]

      setComparisonModels(initialComparison)
    }
  }, [initialModels])

  const addModelToComparison = (modelId: string) => {
    const model = availableModels.find(m => m.id === modelId)
    if (model && !comparisonModels.find(cm => cm.model.id === modelId)) {
      const newComparison = {
        model,
        metrics: modelManagementService.getModelPerformance(modelId),
        selected: false
      }
      setComparisonModels([...comparisonModels, newComparison])
      setShowAddModel(false)
      setSearchTerm('')
    }
  }

  const removeModelFromComparison = (modelId: string) => {
    setComparisonModels(comparisonModels.filter(cm => cm.model.id !== modelId))
  }

  const toggleModelSelection = (modelId: string) => {
    setComparisonModels(comparisonModels.map(cm =>
      cm.model.id === modelId ? { ...cm, selected: !cm.selected } : cm
    ))
  }

  const handleModelSelect = () => {
    const selectedModel = comparisonModels.find(cm => cm.selected)
    if (selectedModel && onModelSelect) {
      onModelSelect(selectedModel.model.id)
      onClose()
    }
  }

  const filteredAvailableModels = availableModels.filter(model =>
    !comparisonModels.find(cm => cm.model.id === model.id) &&
    (model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     model.provider.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getMetricValue = (model: ComparisonModel, metric: string): number => {
    switch (metric) {
      case 'quality':
        return model.model.qualityScore
      case 'speed':
        return 2000 - model.model.latencyMs // Invert for better visualization
      case 'cost':
        const avgCost = (model.model.costPer1KTokens.input + model.model.costPer1KTokens.output) / 2
        return 0.02 - avgCost // Invert for better visualization
      case 'reliability':
        return (model.metrics?.successRate || 0.9) * 100
      default:
        return 0
    }
  }

  const getMetricDisplay = (model: ComparisonModel, metric: string): string => {
    switch (metric) {
      case 'quality':
        return model.model.qualityScore.toString()
      case 'speed':
        return `${model.model.latencyMs}ms`
      case 'cost':
        const avgCost = (model.model.costPer1KTokens.input + model.model.costPer1KTokens.output) / 2
        return `$${avgCost.toFixed(4)}`
      case 'reliability':
        return `${((model.metrics?.successRate || 0.9) * 100).toFixed(1)}%`
      default:
        return '-'
    }
  }

  const getBestModelForMetric = (metric: string): string => {
    if (comparisonModels.length === 0) return ''

    const best = comparisonModels.reduce((best, current) => {
      return getMetricValue(current, metric) > getMetricValue(best, metric) ? current : best
    })

    return best.model.id
  }

  const getWorstModelForMetric = (metric: string): string => {
    if (comparisonModels.length === 0) return ''

    const worst = comparisonModels.reduce((worst, current) => {
      return getMetricValue(current, metric) < getMetricValue(worst, metric) ? current : worst
    })

    return worst.model.id
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

  const getMetricIcon = (metric: string) => {
    const icons = {
      quality: SparklesIcon,
      speed: BoltIcon,
      cost: CurrencyDollarIcon,
      reliability: CheckCircleIcon
    }
    return icons[metric] || ChartBarIcon
  }

  const getCapabilityColor = (score: number) => {
    if (score >= 90) return 'bg-green-500'
    if (score >= 80) return 'bg-blue-500'
    if (score >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={cn(
            "bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <ArrowsRightLeftIcon className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Model Comparison
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Compare AI models side by side to find the best fit
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowAddModel(!showAddModel)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add Model
              </Button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Add Model Panel */}
          {showAddModel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search models to add..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {filteredAvailableModels.map(model => (
                  <button
                    key={model.id}
                    onClick={() => addModelToComparison(model.id)}
                    className="flex items-center gap-3 p-3 text-left rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <span className="text-lg">{getProviderIcon(model.provider)}</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {model.name}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {model.provider}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Comparison Content */}
          <div className="flex-1 overflow-hidden">
            {comparisonModels.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No Models to Compare
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Add some models to start comparing their capabilities and performance.
                  </p>
                  <Button
                    onClick={() => setShowAddModel(true)}
                    className="flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Your First Model
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-6 overflow-auto">
                {/* Metric Selector */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {(['quality', 'speed', 'cost', 'reliability'] as const).map(metric => {
                      const IconComponent = getMetricIcon(metric)
                      return (
                        <button
                          key={metric}
                          onClick={() => setSelectedMetric(metric)}
                          className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors capitalize',
                            selectedMetric === metric
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          )}
                        >
                          <IconComponent className="w-4 h-4" />
                          {metric}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Comparison Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Model
                          </th>
                          {comparisonModels.map(cm => (
                            <th key={cm.model.id} className="px-6 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => toggleModelSelection(cm.model.id)}
                                  className={cn(
                                    'flex items-center gap-3 p-2 rounded-lg transition-colors',
                                    cm.selected
                                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                      : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                                  )}
                                >
                                  <span className="text-lg">{getProviderIcon(cm.model.provider)}</span>
                                  <div className="text-left">
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                      {cm.model.name}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">
                                      {cm.model.provider}
                                    </div>
                                  </div>
                                  {cm.selected && (
                                    <CheckCircleIcon className="w-5 h-5 text-blue-500" />
                                  )}
                                </button>
                                <button
                                  onClick={() => removeModelFromComparison(cm.model.id)}
                                  className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <XMarkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {/* Quality Score Row */}
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            Quality Score
                          </td>
                          {comparisonModels.map(cm => {
                            const isBest = getBestModelForMetric('quality') === cm.model.id
                            const isWorst = getWorstModelForMetric('quality') === cm.model.id
                            return (
                              <td key={cm.model.id} className="px-6 py-4 whitespace-nowrap text-center">
                                <div className={cn(
                                  'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                                  isBest ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                  isWorst ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                )}>
                                  {cm.model.qualityScore}
                                  {isBest && <StarIconSolid className="w-4 h-4 ml-1" />}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {comparisonModels.length} models compared • {comparisonModels.filter(cm => cm.selected).length} selected
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {comparisonModels.some(cm => cm.selected) && onModelSelect && (
                <Button onClick={handleModelSelect} className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4" />
                  Use Selected Model
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ModelComparison

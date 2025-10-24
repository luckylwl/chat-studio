import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CpuChipIcon,
  BoltIcon,
  CurrencyDollarIcon,
  SignalIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { modelManagementService, type AIModel, type ModelPerformanceMetrics } from '@/services/modelManagementService'
import { cn } from '@/utils'

interface ModelStatusIndicatorProps {
  currentModel: string
  onModelSelect?: () => void
  onModelComparison?: () => void
  showDetails?: boolean
  className?: string
}

interface ModelStatus {
  model: AIModel | null
  metrics: ModelPerformanceMetrics | null
  health: 'excellent' | 'good' | 'warning' | 'critical'
  issues: string[]
}

const ModelStatusIndicator: React.FC<ModelStatusIndicatorProps> = ({
  currentModel,
  onModelSelect,
  onModelComparison,
  showDetails = true,
  className
}) => {
  const [modelStatus, setModelStatus] = useState<ModelStatus>({
    model: null,
    metrics: null,
    health: 'good',
    issues: []
  })
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    updateModelStatus()
    const interval = setInterval(updateModelStatus, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [currentModel])

  const updateModelStatus = () => {
    const model = modelManagementService.getModel(currentModel)
    const metrics = modelManagementService.getModelPerformance(currentModel)

    if (!model) {
      setModelStatus({
        model: null,
        metrics: null,
        health: 'critical',
        issues: ['Model not found']
      })
      return
    }

    // Determine health status based on metrics
    const issues: string[] = []
    let health: ModelStatus['health'] = 'excellent'

    if (metrics) {
      // Check success rate
      if (metrics.successRate < 0.95) {
        health = 'warning'
        issues.push(`Low success rate: ${(metrics.successRate * 100).toFixed(1)}%`)
      }

      if (metrics.successRate < 0.9) {
        health = 'critical'
      }

      // Check average latency
      if (metrics.averageLatency > model.latencyMs * 2) {
        health = health === 'excellent' ? 'warning' : 'critical'
        issues.push(`High latency: ${Math.round(metrics.averageLatency)}ms`)
      }

      // Check error rate
      if (metrics.errorRate > 0.05) {
        health = 'warning'
        issues.push(`Error rate: ${(metrics.errorRate * 100).toFixed(1)}%`)
      }

      if (metrics.errorRate > 0.1) {
        health = 'critical'
      }

      // Check cost efficiency
      if (metrics.averageCost > model.costPer1KTokens.output * 1.5) {
        health = health === 'excellent' ? 'good' : health
        issues.push('Higher than expected costs')
      }
    }

    setModelStatus({
      model,
      metrics,
      health,
      issues
    })
  }

  const getHealthColor = (health: ModelStatus['health']) => {
    switch (health) {
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getHealthIcon = (health: ModelStatus['health']) => {
    switch (health) {
      case 'excellent':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'good':
        return <SignalIcon className="w-4 h-4" />
      case 'warning':
      case 'critical':
        return <ExclamationTriangleIcon className="w-4 h-4" />
      default:
        return <CpuChipIcon className="w-4 h-4" />
    }
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

  const formatLatency = (latency: number) => {
    return latency < 1000 ? `${Math.round(latency)}ms` : `${(latency / 1000).toFixed(1)}s`
  }

  const formatCost = (cost: number) => {
    return cost < 0.001 ? `$${(cost * 1000000).toFixed(0)}µ` : `$${cost.toFixed(4)}`
  }

  if (!modelStatus.model) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg',
        className
      )}>
        <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
        <span className="text-sm font-medium text-red-700">
          Model Error
        </span>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-colors hover:shadow-sm',
          getHealthColor(modelStatus.health)
        )}
      >
        {/* Model Icon */}
        <span className="text-base">
          {getProviderIcon(modelStatus.model.provider)}
        </span>

        {/* Model Name and Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {modelStatus.model.name}
          </span>
          {getHealthIcon(modelStatus.health)}
        </div>

        {/* Performance Indicators */}
        {showDetails && modelStatus.metrics && (
          <div className="flex items-center gap-3 text-xs">
            {/* Latency */}
            <div className="flex items-center gap-1">
              <BoltIcon className="w-3 h-3" />
              {formatLatency(modelStatus.metrics.averageLatency)}
            </div>

            {/* Success Rate */}
            <div className="flex items-center gap-1">
              <SignalIcon className="w-3 h-3" />
              {(modelStatus.metrics.successRate * 100).toFixed(0)}%
            </div>

            {/* Cost */}
            <div className="flex items-center gap-1">
              <CurrencyDollarIcon className="w-3 h-3" />
              {formatCost(modelStatus.metrics.averageCost)}
            </div>
          </div>
        )}

        {/* Dropdown Arrow */}
        <ChevronDownIcon
          className={cn(
            'w-4 h-4 transition-transform',
            showDropdown && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 p-4"
          >
            {/* Model Info Header */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
              <span className="text-2xl">
                {getProviderIcon(modelStatus.model.provider)}
              </span>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {modelStatus.model.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {modelStatus.model.provider} • {modelStatus.model.category}
                </p>
              </div>
              <div className={cn(
                'ml-auto px-2 py-1 rounded text-xs font-medium',
                getHealthColor(modelStatus.health)
              )}>
                {modelStatus.health}
              </div>
            </div>

            {/* Performance Metrics */}
            {modelStatus.metrics && (
              <div className="space-y-3 mb-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  Performance Metrics
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  {/* Success Rate */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Success Rate
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {(modelStatus.metrics.successRate * 100).toFixed(1)}%
                    </div>
                  </div>

                  {/* Average Latency */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <BoltIcon className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Avg Latency
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatLatency(modelStatus.metrics.averageLatency)}
                    </div>
                  </div>

                  {/* Total Requests */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <SignalIcon className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Requests
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {modelStatus.metrics.totalRequests.toLocaleString()}
                    </div>
                  </div>

                  {/* Average Cost */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CurrencyDollarIcon className="w-4 h-4 text-green-500" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        Avg Cost
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatCost(modelStatus.metrics.averageCost)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Issues */}
            {modelStatus.issues.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2">
                  Issues
                </h4>
                <div className="space-y-1">
                  {modelStatus.issues.map((issue, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400"
                    >
                      <ExclamationTriangleIcon className="w-3 h-3" />
                      {issue}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  onModelSelect?.()
                  setShowDropdown(false)
                }}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                Switch Model
              </button>
              <button
                onClick={() => {
                  onModelComparison?.()
                  setShowDropdown(false)
                }}
                className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
              >
                Compare Models
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}

export default ModelStatusIndicator
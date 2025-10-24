import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CpuChipIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  LightBulbIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import { modelManagementService, type ModelRecommendation } from '@/services/modelManagementService'
import { useUserInteractionTracking } from '@/hooks/useErrorReporting'

interface SmartModelSwitcherProps {
  currentModel: string
  onModelChange: (modelId: string) => void
  conversationContext?: {
    errorCount: number
    averageLatency: number
    taskType?: string
    messageCount: number
    userFeedback?: 'positive' | 'negative'
    recentErrors?: string[]
  }
  className?: string
  autoSuggest?: boolean
  showReasons?: boolean
}

interface SwitchSuggestion {
  recommendation: ModelRecommendation
  trigger: string
  urgency: 'low' | 'medium' | 'high'
  reason: string
}

const SmartModelSwitcher: React.FC<SmartModelSwitcherProps> = ({
  currentModel,
  onModelChange,
  conversationContext,
  className,
  autoSuggest = true,
  showReasons = true
}) => {
  const [suggestion, setSuggestion] = useState<SwitchSuggestion | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [switchCount, setSwitchCount] = useState(0)
  const [lastSwitchTime, setLastSwitchTime] = useState(0)

  const { trackFeatureUsage, trackUserAction } = useUserInteractionTracking()

  useEffect(() => {
    if (!autoSuggest || isDismissed || !conversationContext) return

    // Avoid frequent suggestions (minimum 2 minutes between suggestions)
    const now = Date.now()
    if (now - lastSwitchTime < 120000) return

    const shouldSwitch = modelManagementService.shouldSwitchModel(currentModel, conversationContext)

    if (shouldSwitch) {
      const trigger = determineTrigger(conversationContext)
      const urgency = determineUrgency(conversationContext)
      const reason = generateSuggestionReason(conversationContext, shouldSwitch)

      setSuggestion({
        recommendation: shouldSwitch,
        trigger,
        urgency,
        reason
      })
      setIsVisible(true)

      trackFeatureUsage('smart_model_suggestion', {
        trigger,
        urgency,
        currentModel,
        suggestedModel: shouldSwitch.modelId
      })
    }
  }, [conversationContext, currentModel, autoSuggest, isDismissed, lastSwitchTime])

  const determineTrigger = (context: any): string => {
    if (context.errorCount > 3) return 'high_error_rate'
    if (context.averageLatency > 3000) return 'slow_response'
    if (context.userFeedback === 'negative') return 'poor_user_feedback'
    if (context.taskType) return 'task_optimization'
    return 'general_optimization'
  }

  const determineUrgency = (context: any): 'low' | 'medium' | 'high' => {
    if (context.errorCount > 5 || context.averageLatency > 5000) return 'high'
    if (context.errorCount > 2 || context.averageLatency > 2000 || context.userFeedback === 'negative') return 'medium'
    return 'low'
  }

  const generateSuggestionReason = (context: any, recommendation: ModelRecommendation): string => {
    const reasons = []

    if (context.errorCount > 3) {
      reasons.push(`Experiencing ${context.errorCount} errors`)
    }
    if (context.averageLatency > 2000) {
      reasons.push(`Slow response times (${context.averageLatency}ms avg)`)
    }
    if (context.userFeedback === 'negative') {
      reasons.push('Based on your recent feedback')
    }
    if (context.taskType) {
      reasons.push(`Optimized for ${context.taskType} tasks`)
    }

    return reasons.join(', ') || 'Better performance available'
  }

  const handleAcceptSuggestion = () => {
    if (suggestion) {
      onModelChange(suggestion.recommendation.modelId)
      setSwitchCount(prev => prev + 1)
      setLastSwitchTime(Date.now())
      setIsVisible(false)
      setSuggestion(null)

      trackUserAction('model_switch_accepted', {
        from: currentModel,
        to: suggestion.recommendation.modelId,
        trigger: suggestion.trigger,
        urgency: suggestion.urgency
      })
    }
  }

  const handleDismissSuggestion = (permanent = false) => {
    setIsVisible(false)
    if (permanent) {
      setIsDismissed(true)
    }

    trackUserAction('model_switch_dismissed', {
      suggestion: suggestion?.recommendation.modelId,
      permanent,
      trigger: suggestion?.trigger
    })
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-red-500 bg-red-50 dark:bg-red-900/20'
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
      case 'low': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high': return ExclamationTriangleIcon
      case 'medium': return ClockIcon
      case 'low': return LightBulbIcon
      default: return InformationCircleIcon
    }
  }

  const getTriggerIcon = (trigger: string) => {
    switch (trigger) {
      case 'high_error_rate': return ExclamationTriangleIcon
      case 'slow_response': return ClockIcon
      case 'poor_user_feedback': return ChartBarIcon
      case 'task_optimization': return CpuChipIcon
      default: return BoltIcon
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

  const currentModelData = modelManagementService.getModel(currentModel)

  if (!isVisible || !suggestion) return null

  const suggestedModelData = modelManagementService.getModel(suggestion.recommendation.modelId)
  const UrgencyIcon = getUrgencyIcon(suggestion.urgency)
  const TriggerIcon = getTriggerIcon(suggestion.trigger)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className={cn(
          'fixed bottom-20 right-4 z-40 max-w-sm',
          className
        )}
      >
        <div className={cn(
          'rounded-lg border-2 shadow-xl backdrop-blur-sm p-4',
          getUrgencyColor(suggestion.urgency)
        )}>
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <UrgencyIcon className="w-5 h-5 text-current" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Model Switch Suggested
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                  {suggestion.urgency} priority
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDismissSuggestion()}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Reason */}
          {showReasons && (
            <div className="mb-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded border">
              <div className="flex items-center gap-2 mb-1">
                <TriggerIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Why switch?
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {suggestion.reason}
              </p>
            </div>
          )}

          {/* Model Comparison */}
          <div className="space-y-3 mb-4">
            {/* Current Model */}
            <div className="flex items-center justify-between p-2 bg-white/30 dark:bg-gray-800/30 rounded">
              <div className="flex items-center gap-2">
                <span className="text-sm opacity-75">Current:</span>
                {currentModelData && (
                  <>
                    <span className="text-lg">{getProviderIcon(currentModelData.provider)}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {currentModelData.name}
                    </span>
                  </>
                )}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {currentModelData?.qualityScore}/100
              </div>
            </div>

            {/* Suggested Model */}
            <div className="flex items-center justify-between p-2 bg-green-100/50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Suggested:</span>
                {suggestedModelData && (
                  <>
                    <span className="text-lg">{getProviderIcon(suggestedModelData.provider)}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {suggestedModelData.name}
                    </span>
                  </>
                )}
              </div>
              <div className="text-xs text-green-700 dark:text-green-400">
                {suggestedModelData?.qualityScore}/100
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Expected improvements:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <BoltIcon className="w-3 h-3 text-blue-500" />
                <span>~{suggestion.recommendation.estimatedLatency}ms</span>
              </div>
              <div className="flex items-center gap-1">
                <CurrencyDollarIcon className="w-3 h-3 text-green-500" />
                <span>${suggestion.recommendation.estimatedCost.toFixed(4)}</span>
              </div>
              <div className="flex items-center gap-1">
                <ChartBarIcon className="w-3 h-3 text-purple-500" />
                <span>{suggestion.recommendation.score.toFixed(0)}% match</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3 text-green-500" />
                <span>{(suggestion.recommendation.confidenceLevel * 100).toFixed(0)}% confidence</span>
              </div>
            </div>
          </div>

          {/* Top Reasons */}
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Key benefits:
            </div>
            <ul className="space-y-1">
              {suggestion.recommendation.reasons.slice(0, 2).map((reason, index) => (
                <li key={index} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleAcceptSuggestion}
              size="sm"
              className="flex-1 text-xs"
            >
              Switch Now
            </Button>
            <Button
              onClick={() => handleDismissSuggestion()}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Maybe Later
            </Button>
            <Button
              onClick={() => handleDismissSuggestion(true)}
              variant="ghost"
              size="sm"
              className="text-xs px-2"
              title="Don't suggest again"
            >
              ✕
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-3 pt-2 border-t border-current/20">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Switches: {switchCount}</span>
              <span>Confidence: {(suggestion.recommendation.confidenceLevel * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Companion component for manual model switching with smart suggestions
export const EnhancedModelSelector: React.FC<{
  currentModel: string
  onModelChange: (modelId: string) => void
  conversationContext?: any
  className?: string
}> = ({ currentModel, onModelChange, conversationContext, className }) => {
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [recommendations, setRecommendations] = useState<ModelRecommendation[]>([])

  useEffect(() => {
    if (conversationContext) {
      const recs = modelManagementService.getModelRecommendations(conversationContext)
      setRecommendations(recs.slice(0, 3)) // Top 3 recommendations
    }
  }, [conversationContext])

  const currentModelData = modelManagementService.getModel(currentModel)

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        {/* Current Model Display */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          {currentModelData && (
            <>
              <span className="text-lg">{currentModelData.provider === 'openai' ? '🤖' :
                                         currentModelData.provider === 'anthropic' ? '🧠' : '⚡'}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {currentModelData.name}
              </span>
            </>
          )}
        </div>

        {/* Smart Suggestions Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRecommendations(!showRecommendations)}
          className="flex items-center gap-2"
        >
          <LightBulbIcon className="w-4 h-4" />
          Smart Suggestions
        </Button>
      </div>

      {/* Recommendations Dropdown */}
      {showRecommendations && recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50"
        >
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              Recommended for your current task
            </h4>
          </div>
          <div className="p-2">
            {recommendations.map((rec, index) => {
              const model = modelManagementService.getModel(rec.modelId)
              if (!model) return null

              return (
                <button
                  key={rec.modelId}
                  onClick={() => {
                    onModelChange(rec.modelId)
                    setShowRecommendations(false)
                  }}
                  className="w-full p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{model.provider === 'openai' ? '🤖' :
                                                 model.provider === 'anthropic' ? '🧠' : '⚡'}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {model.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {rec.score.toFixed(0)}% match
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {rec.reasons.slice(0, 2).join(' • ')}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>~{rec.estimatedLatency}ms</span>
                    <span>${rec.estimatedCost.toFixed(4)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default SmartModelSwitcher
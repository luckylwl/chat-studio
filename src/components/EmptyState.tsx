import React from 'react'
import { Button } from './ui'
import {
  PlusIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface EmptyStateProps {
  type: 'no-conversations' | 'no-models' | 'configuration-needed' | 'welcome'
  title: string
  description: string
  actionText?: string
  onAction?: () => void
  illustration?: React.ReactNode
  secondaryAction?: {
    text: string
    onClick: () => void
  }
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  actionText,
  onAction,
  illustration,
  secondaryAction
}) => {
  const getIllustration = () => {
    if (illustration) return illustration

    switch (type) {
      case 'no-models':
        return (
          <div className="mx-auto h-24 w-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center mb-6">
            <CpuChipIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
        )
      case 'configuration-needed':
        return (
          <div className="mx-auto h-24 w-24 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-full flex items-center justify-center mb-6">
            <ExclamationTriangleIcon className="h-12 w-12 text-amber-600 dark:text-amber-400" />
          </div>
        )
      case 'welcome':
        return (
          <div className="mx-auto h-24 w-24 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-full flex items-center justify-center mb-6">
            <LightBulbIcon className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          </div>
        )
      default:
        return (
          <div className="mx-auto h-24 w-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-6">
            <PlusIcon className="h-12 w-12 text-gray-600 dark:text-gray-400" />
          </div>
        )
    }
  }

  const getColorClasses = () => {
    switch (type) {
      case 'no-models':
        return 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
      case 'configuration-needed':
        return 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
      case 'welcome':
        return 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
      default:
        return 'border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50'
    }
  }

  return (
    <div className={`
      max-w-md mx-auto text-center py-12 px-6 rounded-2xl border-2 border-dashed
      transition-all duration-300 hover:shadow-lg
      ${getColorClasses()}
    `}>
      {getIllustration()}

      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
        {title}
      </h3>

      <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
        {description}
      </p>

      {actionText && onAction && (
        <div className="space-y-3">
          <Button
            onClick={onAction}
            className="w-full group"
            size="lg"
          >
            {actionText}
            <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>

          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              className="w-full"
            >
              {secondaryAction.text}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export default EmptyState
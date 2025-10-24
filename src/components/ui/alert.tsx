import React from 'react'
import { cn } from '@/utils'
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  children: React.ReactNode
  onClose?: () => void
  className?: string
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className
}) => {
  const variantStyles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
  }

  const icons = {
    info: InformationCircleIcon,
    success: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    error: ExclamationTriangleIcon
  }

  const Icon = icons[variant]

  return (
    <div className={cn(
      'rounded-lg border p-4',
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          {title && (
            <h5 className="font-semibold mb-1">{title}</h5>
          )}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}

export default Alert
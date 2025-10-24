import React from 'react'
import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number // 0-100
  max?: number
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  label?: string
  animated?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

const variantClasses = {
  default: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  animated = true,
  className = '',
}) => {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label || 'Progress'}
          </span>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {Math.round(percentage)}%
          </span>
        </div>
      )}

      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          className={`h-full ${variantClasses[variant]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={animated ? { duration: 0.5, ease: 'easeOut' } : { duration: 0 }}
        />
      </div>
    </div>
  )
}

// Circular progress
export const CircularProgress: React.FC<{
  value: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
  variant?: 'default' | 'success' | 'warning' | 'error'
}> = ({
  value,
  size = 100,
  strokeWidth = 8,
  showLabel = true,
  variant = 'default',
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min(value, 100)
  const offset = circumference - (percentage / 100) * circumference

  const colors = {
    default: '#3b82f6',
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors[variant]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xl font-semibold text-gray-700 dark:text-gray-300">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  )
}

// Indeterminate progress (loading)
export const IndeterminateProgress: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
}> = ({ size = 'md', variant = 'default' }) => {
  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
      <motion.div
        className={`h-full ${variantClasses[variant]} rounded-full w-1/3`}
        animate={{
          x: ['-100%', '400%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}

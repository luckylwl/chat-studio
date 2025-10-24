import React from 'react'
import { cn } from '@/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  indicatorClassName?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error'
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className,
  indicatorClassName,
  size = 'md',
  variant = 'default'
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const variantClasses = {
    default: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  }

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
        sizeClasses[size],
        className
      )}
    >
      <div
        className={cn(
          'h-full transition-all duration-300 ease-in-out',
          variantClasses[variant],
          indicatorClassName
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export default Progress
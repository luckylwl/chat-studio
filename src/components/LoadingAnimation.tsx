import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils'

interface LoadingAnimationProps {
  variant?: 'dots' | 'pulse' | 'wave' | 'spinner' | 'bounce' | 'typing'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  variant = 'dots',
  size = 'md',
  className,
  text
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  }

  const containerSizeClasses = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2'
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center', containerSizeClasses[size], className)}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn(
              'bg-primary-500 rounded-full',
              sizeClasses[size]
            )}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.2
            }}
          />
        ))}
        {text && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {text}
          </span>
        )}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex items-center', className)}>
        <motion.div
          className={cn(
            'bg-primary-500 rounded-full',
            sizeClasses[size]
          )}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {text && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {text}
          </span>
        )}
      </div>
    )
  }

  if (variant === 'wave') {
    return (
      <div className={cn('flex items-end', containerSizeClasses[size], className)}>
        {[0, 1, 2, 3, 4].map((index) => (
          <motion.div
            key={index}
            className={cn(
              'bg-primary-500 rounded-sm',
              size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : 'w-2'
            )}
            animate={{
              height: [
                size === 'sm' ? 8 : size === 'md' ? 12 : 16,
                size === 'sm' ? 16 : size === 'md' ? 24 : 32,
                size === 'sm' ? 8 : size === 'md' ? 12 : 16
              ]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.1
            }}
          />
        ))}
        {text && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {text}
          </span>
        )}
      </div>
    )
  }

  if (variant === 'spinner') {
    return (
      <div className={cn('flex items-center', className)}>
        <motion.div
          className={cn(
            'border-2 border-primary-200 border-t-primary-500 rounded-full',
            sizeClasses[size]
          )}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        {text && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {text}
          </span>
        )}
      </div>
    )
  }

  if (variant === 'bounce') {
    return (
      <div className={cn('flex items-center', containerSizeClasses[size], className)}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={cn(
              'bg-primary-500 rounded-full',
              sizeClasses[size]
            )}
            animate={{
              y: [0, -10, 0]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: index * 0.2,
              ease: "easeInOut"
            }}
          />
        ))}
        {text && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {text}
          </span>
        )}
      </div>
    )
  }

  if (variant === 'typing') {
    return (
      <div className={cn('flex items-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg', className)}>
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.3
            }}
          />
        ))}
        {text && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {text}
          </span>
        )}
      </div>
    )
  }

  return null
}

export default LoadingAnimation

// 页面级加载组件
export const PageLoader: React.FC<{ text?: string }> = ({ text = "加载中..." }) => (
  <div className="flex flex-col items-center justify-center h-64">
    <LoadingAnimation variant="spinner" size="lg" />
    <p className="mt-4 text-gray-600 dark:text-gray-400">{text}</p>
  </div>
)

// 按钮加载状态组件
export const ButtonLoader: React.FC = () => (
  <LoadingAnimation variant="spinner" size="sm" className="mr-2" />
)

// 消息加载状态组件
export const MessageLoader: React.FC = () => (
  <div className="flex items-center space-x-2 p-4">
    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
      <LoadingAnimation variant="dots" size="sm" />
    </div>
    <LoadingAnimation variant="typing" text="AI正在思考..." />
  </div>
)
import React from 'react'
import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'primary' | 'secondary' | 'white'
  label?: string
  className?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
}

const colorClasses = {
  primary: 'border-blue-500',
  secondary: 'border-gray-500',
  white: 'border-white',
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  label,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <motion.div
        className={`${sizeClasses[size]} border-4 ${colorClasses[color]} border-t-transparent rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      {label && (
        <motion.p
          className="text-sm text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {label}
        </motion.p>
      )}
    </div>
  )
}

// Pulse animation for skeleton screens
export const PulseLoader: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <motion.div
      className={`bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// Dots loader for inline loading states
export const DotsLoader: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  }

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${dotSize[size]} bg-current rounded-full`}
          animate={{
            y: ['0%', '-50%', '0%'],
            opacity: [0.7, 1, 0.7],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: index * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Skeleton loading component for complex layouts
export const Skeleton: React.FC<{
  variant?: 'text' | 'rect' | 'circle'
  width?: string
  height?: string
  className?: string
}> = ({ variant = 'text', width, height, className = '' }) => {
  const variantClasses = {
    text: 'rounded h-4',
    rect: 'rounded-lg',
    circle: 'rounded-full',
  }

  const style: React.CSSProperties = {}
  if (width) style.width = width
  if (height) style.height = height

  return (
    <PulseLoader
      className={`${variantClasses[variant]} ${className}`}
      style={style}
    />
  )
}

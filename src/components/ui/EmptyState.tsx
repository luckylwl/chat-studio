import React from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare,
  Search,
  FileText,
  AlertCircle,
  Inbox,
  Sparkles,
  type LucideIcon
} from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  variant?: 'default' | 'search' | 'error'
  className?: string
}

const variantConfig = {
  default: {
    iconColor: 'text-gray-400',
    titleColor: 'text-gray-700 dark:text-gray-300',
    descColor: 'text-gray-500 dark:text-gray-400',
  },
  search: {
    iconColor: 'text-blue-400',
    titleColor: 'text-gray-700 dark:text-gray-300',
    descColor: 'text-gray-500 dark:text-gray-400',
  },
  error: {
    iconColor: 'text-red-400',
    titleColor: 'text-gray-700 dark:text-gray-300',
    descColor: 'text-gray-500 dark:text-gray-400',
  },
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  action,
  variant = 'default',
  className = '',
}) => {
  const config = variantConfig[variant]
  const ActionIcon = action?.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          delay: 0.2,
          type: 'spring',
          stiffness: 200
        }}
        className="mb-6"
      >
        <div className={`p-4 rounded-full bg-gray-100 dark:bg-gray-800 ${config.iconColor}`}>
          <Icon size={48} strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`text-xl font-semibold mb-2 ${config.titleColor}`}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className={`text-sm max-w-md mb-6 ${config.descColor}`}
        >
          {description}
        </motion.p>
      )}

      {/* Action Button */}
      {action && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={action.onClick}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform"
        >
          {ActionIcon && <ActionIcon size={18} />}
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}

// Preset empty states
export const NoConversationsEmpty: React.FC<{ onCreate: () => void }> = ({ onCreate }) => (
  <EmptyState
    icon={MessageSquare}
    title="No conversations yet"
    description="Start a new conversation to begin chatting with AI"
    action={{
      label: 'New Conversation',
      onClick: onCreate,
      icon: Sparkles,
    }}
  />
)

export const NoSearchResultsEmpty: React.FC<{ query: string }> = ({ query }) => (
  <EmptyState
    icon={Search}
    variant="search"
    title="No results found"
    description={`No conversations or messages match "${query}". Try different keywords.`}
  />
)

export const NoMessagesEmpty: React.FC = () => (
  <EmptyState
    icon={MessageSquare}
    title="No messages yet"
    description="Send a message to start the conversation"
  />
)

export const ErrorEmpty: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry
}) => (
  <EmptyState
    icon={AlertCircle}
    variant="error"
    title="Something went wrong"
    description={message}
    action={onRetry ? {
      label: 'Try Again',
      onClick: onRetry,
    } : undefined}
  />
)

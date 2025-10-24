import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-500',
    iconColor: 'text-green-500',
    textColor: 'text-green-900 dark:text-green-100',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-500',
    iconColor: 'text-red-500',
    textColor: 'text-red-900 dark:text-red-100',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-500',
    iconColor: 'text-yellow-500',
    textColor: 'text-yellow-900 dark:text-yellow-100',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-500',
    iconColor: 'text-blue-500',
    textColor: 'text-blue-900 dark:text-blue-100',
  },
}

const ToastItem: React.FC<ToastProps> = ({ toast, onClose }) => {
  const config = toastConfig[toast.type]
  const Icon = config.icon

  React.useEffect(() => {
    if (toast.duration) {
      const timer = setTimeout(() => {
        onClose(toast.id)
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onClose])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`flex items-start gap-3 p-4 rounded-lg border-l-4 ${config.bgColor} ${config.borderColor} shadow-lg max-w-md w-full backdrop-blur-sm`}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${config.iconColor}`}>
        <Icon size={24} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${config.textColor}`}>
          {toast.message}
        </p>
        {toast.description && (
          <p className={`text-xs mt-1 ${config.textColor} opacity-80`}>
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className={`text-xs font-medium mt-2 ${config.iconColor} hover:underline`}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => onClose(toast.id)}
        className={`flex-shrink-0 ${config.iconColor} hover:opacity-70 transition-opacity`}
        aria-label="Close"
      >
        <X size={18} />
      </button>
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
  position = 'top-right',
}) => {
  return (
    <div className={`fixed ${positionClasses[position]} z-[9999] pointer-events-none`}>
      <div className="flex flex-col gap-2 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={onClose} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Toast Manager Hook
export const useToast = () => {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const showToast = React.useCallback((
    type: ToastType,
    message: string,
    options?: {
      description?: string
      duration?: number
      action?: { label: string; onClick: () => void }
    }
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toast: Toast = {
      id,
      type,
      message,
      description: options?.description,
      duration: options?.duration ?? 5000,
      action: options?.action,
    }

    setToasts((prev) => [...prev, toast])
    return id
  }, [])

  const closeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = React.useCallback(
    (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) =>
      showToast('success', message, options),
    [showToast]
  )

  const error = React.useCallback(
    (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) =>
      showToast('error', message, options),
    [showToast]
  )

  const warning = React.useCallback(
    (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) =>
      showToast('warning', message, options),
    [showToast]
  )

  const info = React.useCallback(
    (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) =>
      showToast('info', message, options),
    [showToast]
  )

  return {
    toasts,
    showToast,
    closeToast,
    success,
    error,
    warning,
    info,
  }
}

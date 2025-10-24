import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useKeyboardNavigation'

interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]',
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
}) => {
  const modalRef = useFocusTrap(isOpen)
  const titleId = React.useId()
  const descriptionId = React.useId()

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`
    } else {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnOverlayClick ? onClose : undefined}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              ref={modalRef as React.RefObject<HTMLDivElement>}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} ${className}`}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={description ? descriptionId : undefined}
            >
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex-1">
                  <h2
                    id={titleId}
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                  >
                    {title}
                  </h2>
                  {description && (
                    <p
                      id={descriptionId}
                      className="mt-2 text-sm text-gray-500 dark:text-gray-400"
                    >
                      {description}
                    </p>
                  )}
                </div>

                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Close modal"
                  >
                    <X size={24} className="text-gray-500 dark:text-gray-400" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// Confirmation dialog variant
export const ConfirmDialog: React.FC<{
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
}) => {
  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600',
    info: 'bg-blue-500 hover:bg-blue-600',
  }

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={false}
    >
      <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm()
            onClose()
          }}
          className={`px-4 py-2 rounded-lg text-white transition-colors ${variantStyles[variant]}`}
          autoFocus
        >
          {confirmText}
        </button>
      </div>
    </AccessibleModal>
  )
}

import React, { useState } from 'react'
import {
  LoadingSpinner,
  Skeleton,
  ProgressBar,
  CircularProgress,
  useToast,
  ToastContainer,
  EmptyState,
  NoConversationsEmpty,
  FormField,
  Input,
  useFormValidation,
  AccessibleModal,
  ConfirmDialog,
  Tooltip,
  SimpleTooltip,
  RippleButton,
  ErrorBoundary,
} from '@/components/ui'
import { MessageSquare, Trash2, Save } from 'lucide-react'

/**
 * UI 组件演示页面
 * 展示所有新增 UI 组件的使用方法
 */
export const UIComponentsDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const { toasts, success, error, warning, info, closeToast } = useToast()

  const { values, errors, handleChange, handleBlur } = useFormValidation({
    email: '',
    password: '',
  })

  const validationRules = {
    email: {
      required: { value: true, message: 'Email is required' },
      pattern: {
        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Invalid email format',
      },
    },
    password: {
      required: { value: true, message: 'Password is required' },
      minLength: {
        value: 8,
        message: 'Password must be at least 8 characters',
      },
    },
  }

  // 模拟文件上传
  const simulateUpload = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          success('Upload completed!', {
            description: 'Your file has been uploaded successfully',
          })
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  // 模拟 API 调用
  const simulateAPICall = async () => {
    setIsLoading(true)
    info('Processing...', { duration: 2000 })

    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
    success('Success!', {
      description: 'Operation completed successfully',
      action: {
        label: 'Undo',
        onClick: () => console.log('Undo clicked'),
      },
    })
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              UI Components Demo
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive showcase of all UI enhancements
            </p>
          </div>

          {/* Section 1: Loading States */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              1. Loading States
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* LoadingSpinner */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300">
                  Loading Spinner
                </h3>
                <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-700 rounded">
                  <LoadingSpinner size="lg" label="Loading..." />
                </div>
              </div>

              {/* Skeleton */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300">
                  Skeleton Screen
                </h3>
                <div className="space-y-2 p-4 bg-gray-100 dark:bg-gray-700 rounded">
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="rect" width="100%" height="60px" />
                </div>
              </div>

              {/* CircularProgress */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300">
                  Circular Progress
                </h3>
                <div className="flex items-center justify-center h-32 bg-gray-100 dark:bg-gray-700 rounded">
                  <CircularProgress value={progress} variant="success" />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Progress Indicators */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              2. Progress Indicators
            </h2>

            <div className="space-y-6">
              <ProgressBar
                value={progress}
                variant={progress === 100 ? 'success' : 'default'}
                showLabel
                label="File Upload"
              />

              <button
                onClick={simulateUpload}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Simulate Upload
              </button>
            </div>
          </section>

          {/* Section 3: Toast Notifications */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              3. Toast Notifications
            </h2>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => success('Success!', { description: 'Operation completed' })}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Show Success
              </button>

              <button
                onClick={() => error('Error!', { description: 'Something went wrong' })}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Show Error
              </button>

              <button
                onClick={() => warning('Warning!', { description: 'Please be careful' })}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Show Warning
              </button>

              <button
                onClick={() => info('Info', { description: 'Here is some information' })}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Show Info
              </button>
            </div>
          </section>

          {/* Section 4: Empty States */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              4. Empty States
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 dark:border-gray-700 rounded">
                <NoConversationsEmpty onCreate={() => console.log('Create clicked')} />
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded">
                <EmptyState
                  icon={MessageSquare}
                  title="No messages"
                  description="Start a conversation to see messages"
                  variant="default"
                />
              </div>
            </div>
          </section>

          {/* Section 5: Form Validation */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              5. Form Validation
            </h2>

            <form className="max-w-md space-y-4">
              <FormField
                label="Email"
                error={errors.email}
                required
                helperText="We'll never share your email"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={values.email}
                  onChange={(e) =>
                    handleChange('email', e.target.value, validationRules.email)
                  }
                  onBlur={() => handleBlur('email', validationRules.email)}
                  error={!!errors.email}
                />
              </FormField>

              <FormField label="Password" error={errors.password} required>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChange={(e) =>
                    handleChange('password', e.target.value, validationRules.password)
                  }
                  onBlur={() => handleBlur('password', validationRules.password)}
                  error={!!errors.password}
                />
              </FormField>

              <button
                type="button"
                onClick={simulateAPICall}
                disabled={isLoading || !!errors.email || !!errors.password}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <LoadingSpinner size="sm" color="white" /> : <Save size={18} />}
                {isLoading ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          </section>

          {/* Section 6: Modals */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              6. Modals & Dialogs
            </h2>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Open Modal
              </button>

              <button
                onClick={() => setIsConfirmOpen(true)}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-2"
              >
                <Trash2 size={18} />
                Delete Item
              </button>
            </div>

            <AccessibleModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Example Modal"
              description="This is an accessible modal with focus trap"
              size="md"
            >
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This modal demonstrates keyboard navigation and accessibility features.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsModalOpen(false)
                    success('Action completed!')
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Confirm
                </button>
              </div>
            </AccessibleModal>

            <ConfirmDialog
              isOpen={isConfirmOpen}
              onClose={() => setIsConfirmOpen(false)}
              onConfirm={() => {
                success('Item deleted!')
              }}
              title="Delete item?"
              message="This action cannot be undone. Are you sure you want to delete this item?"
              variant="danger"
              confirmText="Delete"
              cancelText="Cancel"
            />
          </section>

          {/* Section 7: Tooltips & Micro-interactions */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
              7. Tooltips & Micro-interactions
            </h2>

            <div className="flex flex-wrap gap-6">
              <SimpleTooltip content="This is a tooltip" position="top">
                <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                  Hover for Tooltip
                </button>
              </SimpleTooltip>

              <RippleButton
                onClick={() => info('Ripple effect!')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Click for Ripple
              </RippleButton>
            </div>
          </section>
        </div>

        {/* Toast Container */}
        <ToastContainer toasts={toasts} onClose={closeToast} position="top-right" />
      </div>
    </ErrorBoundary>
  )
}

export default UIComponentsDemo

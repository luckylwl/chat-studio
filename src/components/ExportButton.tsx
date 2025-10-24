import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  DocumentIcon,
  PrinterIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Menu } from '@headlessui/react'
import { Button } from './ui'
import { cn } from '@/utils'
import { exportService, type ExportFormat } from '@/services/exportService'
import type { Conversation } from '@/types'
import LoadingAnimation from './LoadingAnimation'
import toast from 'react-hot-toast'

interface ExportButtonProps {
  conversation?: Conversation
  conversations?: Conversation[]
  variant?: 'icon' | 'button' | 'menu'
  className?: string
  disabled?: boolean
}

const ExportButton: React.FC<ExportButtonProps> = ({
  conversation,
  conversations,
  variant = 'icon',
  className,
  disabled = false
}) => {
  const [isExporting, setIsExporting] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('markdown')
  const [exportOptions, setExportOptions] = useState({
    includeMetadata: true,
    includeTimestamps: true,
    includeSystemMessages: false
  })

  const exportFormats = [
    {
      format: 'markdown' as ExportFormat,
      name: 'Markdown',
      description: 'Easy to read and edit',
      icon: DocumentTextIcon,
      color: 'text-blue-600'
    },
    {
      format: 'json' as ExportFormat,
      name: 'JSON',
      description: 'Structured data format',
      icon: CodeBracketIcon,
      color: 'text-green-600'
    },
    {
      format: 'html' as ExportFormat,
      name: 'HTML',
      description: 'Web page format',
      icon: GlobeAltIcon,
      color: 'text-orange-600'
    },
    {
      format: 'txt' as ExportFormat,
      name: 'Plain Text',
      description: 'Simple text format',
      icon: DocumentIcon,
      color: 'text-gray-600'
    },
    {
      format: 'pdf' as ExportFormat,
      name: 'PDF',
      description: 'Print-ready document',
      icon: PrinterIcon,
      color: 'text-red-600'
    }
  ]

  const handleExport = async (format: ExportFormat) => {
    if (!conversation && !conversations) return

    setIsExporting(true)
    try {
      if (conversation) {
        await exportService.exportConversation(conversation, {
          format,
          ...exportOptions
        })
      } else if (conversations && conversations.length > 0) {
        await exportService.exportMultipleConversations(
          conversations,
          format,
          exportOptions
        )
      }
    } catch (error) {
      console.error('Export failed:', error)

      // Show error toast with details
      const errorMessage = error instanceof Error ? error.message : '导出失败，请重试'

      toast.error(
        (t) => (
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">导出失败</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ),
        {
          duration: 5000,
          position: 'top-right',
          style: {
            maxWidth: '400px'
          }
        }
      )
    } finally {
      setIsExporting(false)
      setShowOptions(false)
    }
  }

  const handleQuickExport = () => {
    handleExport(exportFormat)
  }

  if (variant === 'menu') {
    return (
      <Menu as="div" className="relative">
        <Menu.Button
          as={Button}
          variant="ghost"
          size="sm"
          disabled={disabled || isExporting}
          className={cn("flex items-center gap-2", className)}
        >
          {isExporting ? (
            <LoadingAnimation variant="spinner" size="sm" />
          ) : (
            <ArrowDownTrayIcon className="w-4 h-4" />
          )}
          Export
        </Menu.Button>

        <Menu.Items className="absolute right-0 z-10 w-64 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
          {exportFormats.map((format) => (
            <Menu.Item key={format.format}>
              {({ active }) => (
                <button
                  onClick={() => handleExport(format.format)}
                  className={cn(
                    'w-full text-left px-4 py-3 flex items-center gap-3 transition-colors',
                    active && 'bg-gray-50 dark:bg-gray-700'
                  )}
                >
                  <format.icon className={cn('w-5 h-5', format.color)} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {format.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {format.description}
                    </div>
                  </div>
                </button>
              )}
            </Menu.Item>
          ))}

          <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
            <Menu.Item>
              <button
                onClick={() => setShowOptions(true)}
                className="w-full text-left px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Export Options...
              </button>
            </Menu.Item>
          </div>
        </Menu.Items>
      </Menu>
    )
  }

  if (variant === 'icon') {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleQuickExport}
          disabled={disabled || isExporting}
          className={className}
          title={`Export as ${exportFormat.toUpperCase()}`}
        >
          {isExporting ? (
            <LoadingAnimation variant="spinner" size="sm" />
          ) : (
            <ArrowDownTrayIcon className="w-4 h-4" />
          )}
        </Button>

        {/* Export Options Modal */}
        <ExportOptionsModal
          isOpen={showOptions}
          onClose={() => setShowOptions(false)}
          formats={exportFormats}
          selectedFormat={exportFormat}
          onFormatChange={setExportFormat}
          options={exportOptions}
          onOptionsChange={setExportOptions}
          onExport={handleExport}
          isExporting={isExporting}
        />
      </>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleQuickExport}
        disabled={disabled || isExporting}
        className={cn("flex items-center gap-2", className)}
      >
        {isExporting ? (
          <LoadingAnimation variant="spinner" size="sm" />
        ) : (
          <ArrowDownTrayIcon className="w-4 h-4" />
        )}
        Export
      </Button>

      <ExportOptionsModal
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        formats={exportFormats}
        selectedFormat={exportFormat}
        onFormatChange={setExportFormat}
        options={exportOptions}
        onOptionsChange={setExportOptions}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </>
  )
}

interface ExportOptionsModalProps {
  isOpen: boolean
  onClose: () => void
  formats: any[]
  selectedFormat: ExportFormat
  onFormatChange: (format: ExportFormat) => void
  options: any
  onOptionsChange: (options: any) => void
  onExport: (format: ExportFormat) => void
  isExporting: boolean
}

const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  isOpen,
  onClose,
  formats,
  selectedFormat,
  onFormatChange,
  options,
  onOptionsChange,
  onExport,
  isExporting
}) => {
  const handleExport = () => {
    onExport(selectedFormat)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Export Options
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Export Format
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {formats.map((format) => (
                    <button
                      key={format.format}
                      onClick={() => onFormatChange(format.format)}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border transition-colors text-left',
                        selectedFormat === format.format
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <format.icon className={cn('w-5 h-5', format.color)} />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {format.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Include Options
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeMetadata}
                      onChange={(e) =>
                        onOptionsChange({ ...options, includeMetadata: e.target.checked })
                      }
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Include metadata (model, dates, etc.)
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeTimestamps}
                      onChange={(e) =>
                        onOptionsChange({ ...options, includeTimestamps: e.target.checked })
                      }
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Include timestamps
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.includeSystemMessages}
                      onChange={(e) =>
                        onOptionsChange({ ...options, includeSystemMessages: e.target.checked })
                      }
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Include system messages
                    </span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isExporting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <LoadingAnimation variant="spinner" size="sm" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Export
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ExportButton
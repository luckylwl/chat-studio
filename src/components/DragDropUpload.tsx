import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useDragAndDrop } from '@/hooks/useDragAndDrop'
import { cn } from '@/utils'
import LoadingAnimation from './LoadingAnimation'

interface DragDropUploadProps {
  onFilesDrop: (files: File[]) => void
  accept?: string[]
  maxFiles?: number
  maxSize?: number
  className?: string
  children?: React.ReactNode
  overlay?: boolean
}

const DragDropUpload: React.FC<DragDropUploadProps> = ({
  onFilesDrop,
  accept,
  maxFiles,
  maxSize,
  className,
  children,
  overlay = false
}) => {
  const {
    dragProps,
    isDragOver,
    isUploading,
    error,
    clearError,
    handleFiles
  } = useDragAndDrop({
    onFilesDrop,
    accept,
    maxFiles,
    maxSize
  })

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
      return <PhotoIcon className="w-8 h-8 text-blue-500" />
    }
    return <DocumentIcon className="w-8 h-8 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (overlay) {
    return (
      <>
        <div {...dragProps} className={cn('relative', className)}>
          {children}
        </div>

        <AnimatePresence>
          {isDragOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-primary-500/20 backdrop-blur-sm flex items-center justify-center"
              {...dragProps}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-2 border-dashed border-primary-500 max-w-md mx-4"
              >
                <div className="text-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="mx-auto w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mb-4"
                  >
                    <CloudArrowUpIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Drop files here
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Release to upload your files
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-sm"
            >
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Upload Error</p>
                  <p className="text-xs mt-1 opacity-90">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-white/80 hover:text-white"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Toast */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-4 left-4 z-50 bg-blue-500 text-white p-4 rounded-lg shadow-lg"
            >
              <div className="flex items-center gap-3">
                <LoadingAnimation variant="spinner" size="sm" />
                <span className="text-sm font-medium">Uploading files...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  }

  return (
    <div
      {...dragProps}
      className={cn(
        'relative border-2 border-dashed rounded-xl transition-all duration-200',
        isDragOver
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
        className
      )}
    >
      {children || (
        <div className="p-8 text-center">
          <motion.div
            animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
            className="mx-auto w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4"
          >
            <CloudArrowUpIcon className="w-6 h-6 text-gray-500" />
          </motion.div>

          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {isDragOver ? 'Drop files here' : 'Drag & drop files here'}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            or click to browse files
          </p>

          <input
            type="file"
            multiple
            accept={accept?.join(',')}
            onChange={handleFileInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Max {maxFiles} files</span>
            <span>•</span>
            <span>Up to {formatFileSize(maxSize || 10 * 1024 * 1024)}</span>
          </div>
        </div>
      )}

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3"
          >
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-line">
                  {error}
                </p>
              </div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {isUploading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl flex items-center justify-center"
          >
            <div className="text-center">
              <LoadingAnimation variant="spinner" size="lg" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Processing files...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DragDropUpload
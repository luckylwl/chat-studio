import React, { useState, useCallback } from 'react'
import {
  PhotoIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useDropzone } from 'react-dropzone'

interface ImageUploadProps {
  onImageSelect: (images: ImageFile[]) => void
  maxImages?: number
  maxSize?: number // MB
  className?: string
}

export interface ImageFile {
  id: string
  file: File
  preview: string
  base64?: string
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  maxImages = 4,
  maxSize = 10, // 10MB
  className
}) => {
  const [images, setImages] = useState<ImageFile[]>([])
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null)

  // 转换图片为 base64
  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // 处理文件上传
  const handleFiles = async (files: File[]) => {
    if (images.length >= maxImages) {
      toast.error(`最多只能上传 ${maxImages} 张图片`)
      return
    }

    const validFiles = files.filter(file => {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} 不是图片文件`)
        return false
      }

      // 检查文件大小
      const sizeMB = file.size / 1024 / 1024
      if (sizeMB > maxSize) {
        toast.error(`${file.name} 超过 ${maxSize}MB 大小限制`)
        return false
      }

      return true
    })

    if (validFiles.length === 0) return

    // 限制数量
    const remainingSlots = maxImages - images.length
    const filesToAdd = validFiles.slice(0, remainingSlots)

    if (filesToAdd.length < validFiles.length) {
      toast.warning(`只能添加 ${filesToAdd.length} 张图片（已达上限）`)
    }

    // 创建图片对象
    const newImages: ImageFile[] = await Promise.all(
      filesToAdd.map(async file => {
        const preview = URL.createObjectURL(file)
        const base64 = await convertToBase64(file)

        return {
          id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          preview,
          base64
        }
      })
    )

    const updatedImages = [...images, ...newImages]
    setImages(updatedImages)
    onImageSelect(updatedImages)

    toast.success(`成功添加 ${newImages.length} 张图片`)
  }

  // 删除图片
  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => {
      if (img.id === id) {
        URL.revokeObjectURL(img.preview)
        return false
      }
      return true
    })
    setImages(updatedImages)
    onImageSelect(updatedImages)
    toast.success('图片已删除')
  }

  // 清空所有图片
  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview))
    setImages([])
    onImageSelect([])
    toast.success('已清空所有图片')
  }

  // Dropzone 配置
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    },
    multiple: true
  })

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          )}
        >
          <input {...getInputProps()} />
          <PhotoIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {isDragActive ? '释放以上传' : '拖拽图片到这里，或点击选择'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            支持 JPG, PNG, GIF, WebP (最大 {maxSize}MB, 最多 {maxImages} 张)
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            {images.length}/{maxImages} 张图片
          </p>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              已上传图片 ({images.length})
            </h4>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              清空全部
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <AnimatePresence>
              {images.map(image => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPreviewImage(image)}
                      className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="预览"
                    >
                      <EyeIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <button
                      onClick={() => removeImage(image.id)}
                      className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="删除"
                    >
                      <XMarkIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </button>
                  </div>

                  {/* File info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                    <p className="text-xs truncate">{image.file.name}</p>
                    <p className="text-xs text-gray-300">
                      {(image.file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute -top-12 right-0 p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              <img
                src={previewImage.preview}
                alt={previewImage.file.name}
                className="max-w-full max-h-[80vh] rounded-lg"
              />
              <div className="mt-4 text-center text-white">
                <p className="font-medium">{previewImage.file.name}</p>
                <p className="text-sm text-gray-300">
                  {(previewImage.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ImageUpload

import React, { useState, useRef } from 'react'
import { PhotoIcon, XMarkIcon, EyeIcon } from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'

export interface UploadedImage {
  id: string
  file: File
  preview: string
  base64: string
  status: 'uploading' | 'completed' | 'error'
  error?: string
}

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void
  maxImages?: number
  maxSizeInMB?: number
  acceptedFormats?: string[]
  className?: string
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesChange,
  maxImages = 5,
  maxSizeInMB = 10,
  acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'],
  className
}) => {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = async (file: File): Promise<UploadedImage> => {
    return new Promise((resolve, reject) => {
      // Validate file type
      if (!acceptedFormats.includes(file.type)) {
        reject(new Error(`不支持的文件格式: ${file.type}`))
        return
      }

      // Validate file size
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024
      if (file.size > maxSizeInBytes) {
        reject(new Error(`文件大小超过限制 (${maxSizeInMB}MB)`))
        return
      }

      const reader = new FileReader()
      const id = `img-${Date.now()}-${Math.random().toString(36).substring(7)}`

      reader.onload = () => {
        const base64 = reader.result as string
        const preview = base64

        resolve({
          id,
          file,
          preview,
          base64,
          status: 'completed'
        })
      }

      reader.onerror = () => {
        reject(new Error('读取文件失败'))
      }

      reader.readAsDataURL(file)
    })
  }

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)

    // Check max images limit
    if (images.length + fileArray.length > maxImages) {
      toast.error(`最多只能上传 ${maxImages} 张图片`)
      return
    }

    const newImages: UploadedImage[] = []

    for (const file of fileArray) {
      try {
        const uploadedImage = await processFile(file)
        newImages.push(uploadedImage)
      } catch (error: any) {
        toast.error(error.message)
        newImages.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          file,
          preview: '',
          base64: '',
          status: 'error',
          error: error.message
        })
      }
    }

    const updatedImages = [...images, ...newImages]
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id)
    setImages(updatedImages)
    onImagesChange(updatedImages)
  }

  const clearAll = () => {
    setImages([])
    onImagesChange([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 transition-all cursor-pointer',
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-gray-50 dark:hover:bg-gray-800'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          multiple
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <PhotoIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              点击或拖拽上传图片
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              支持 PNG, JPG, GIF, WebP，最大 {maxSizeInMB}MB
            </p>
          </div>
          <div className="text-xs text-gray-400">
            {images.length}/{maxImages} 张图片
          </div>
        </div>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              已上传图片 ({images.length})
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-7 text-xs"
            >
              清空全部
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              >
                {image.status === 'completed' ? (
                  <>
                    <img
                      src={image.preview}
                      alt={image.file.name}
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewImage(image.preview)
                        }}
                        className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white"
                        title="预览"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImage(image.id)
                        }}
                        className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white"
                        title="删除"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-xs text-white truncate">
                        {image.file.name}
                      </p>
                    </div>
                  </>
                ) : image.status === 'error' ? (
                  <div className="w-full h-24 flex items-center justify-center bg-red-50 dark:bg-red-900/20">
                    <div className="text-center px-2">
                      <XMarkIcon className="w-6 h-6 text-red-500 mx-auto mb-1" />
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {image.error || '上传失败'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-24 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 h-10 w-10 p-0 text-white hover:bg-white/20"
            >
              <XMarkIcon className="w-6 h-6" />
            </Button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUploader

import React, { useState, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  PhotoIcon,
  DocumentIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { fileService, type UploadedFile } from '@/services/fileService'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'

interface FileUploadProps {
  onFilesAnalyzed: (files: UploadedFile[]) => void
  className?: string
  maxFiles?: number
  accept?: {
    'image/*'?: string[]
    'application/*'?: string[]
    'text/*'?: string[]
  }
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesAnalyzed,
  className,
  maxFiles = 10,
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    'application/*': ['.pdf', '.doc', '.docx'],
    'text/*': ['.txt', '.md', '.json', '.js', '.ts', '.html', '.css']
  }
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback(async (files: File[]) => {
    if (uploadedFiles.length + files.length > maxFiles) {
      toast.error(`最多只能上传 ${maxFiles} 个文件`)
      return
    }

    try {
      const newUploadedFiles: UploadedFile[] = []

      for (const file of files) {
        const uploadedFile = await fileService.uploadAndAnalyze(file)
        newUploadedFiles.push(uploadedFile)
      }

      const updatedFiles = [...uploadedFiles, ...newUploadedFiles]
      setUploadedFiles(updatedFiles)
      onFilesAnalyzed(updatedFiles)
    } catch (error) {
      console.error('File processing error:', error)
    }
  }, [uploadedFiles, maxFiles, onFilesAnalyzed])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxFiles: maxFiles - uploadedFiles.length,
    onDrop: processFiles,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false)
  })

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      processFiles(files)
    }
  }

  const removeFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId)
    setUploadedFiles(updatedFiles)
    onFilesAnalyzed(updatedFiles)
  }

  const previewFile = (file: UploadedFile) => {
    const { analysisResult } = file
    if (!analysisResult) return

    if (analysisResult.thumbnail) {
      // 显示图片预览
      const img = new Image()
      img.src = analysisResult.thumbnail
      const win = window.open('', '_blank')
      win?.document.write(`<img src="${analysisResult.thumbnail}" style="max-width:100%;height:auto;" />`)
    } else if (analysisResult.content) {
      // 显示文本内容
      const win = window.open('', '_blank')
      win?.document.write(`<pre>${analysisResult.content}</pre>`)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <PhotoIcon className="h-5 w-5 text-blue-500" />
    }
    return <DocumentIcon className="h-5 w-5 text-gray-500" />
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer",
          isDragActive || isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/10"
            : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800"
        )}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />

        {isDragActive ? (
          <div>
            <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
              释放文件到这里
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              支持图片、文档和代码文件
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              拖拽文件到这里，或点击选择文件
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              支持: 图片 (JPG, PNG, GIF), 文档 (PDF, DOC, TXT), 代码文件
            </p>
            <p className="text-xs text-gray-400">
              最大文件大小: 50MB，最多 {maxFiles} 个文件
            </p>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={(e) => {
            e.stopPropagation()
            fileInputRef.current?.click()
          }}
        >
          选择文件
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={Object.keys(accept).join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            已上传文件 ({uploadedFiles.length}/{maxFiles})
          </h4>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {uploadedFiles.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                {/* File Icon */}
                <div className="flex-shrink-0">
                  {uploadedFile.analysisResult?.thumbnail ? (
                    <img
                      src={uploadedFile.analysisResult.thumbnail}
                      alt={uploadedFile.file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    getFileIcon(uploadedFile.file.type)
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {uploadedFile.file.name}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={cn(
                        "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                        {
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300': uploadedFile.status === 'uploading',
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300': uploadedFile.status === 'analyzing',
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300': uploadedFile.status === 'completed',
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300': uploadedFile.status === 'error'
                        }
                      )}
                    >
                      {uploadedFile.status === 'uploading' && '上传中'}
                      {uploadedFile.status === 'analyzing' && '分析中'}
                      {uploadedFile.status === 'completed' && '完成'}
                      {uploadedFile.status === 'error' && '错误'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>{formatFileSize(uploadedFile.file.size)}</span>
                    {uploadedFile.analysisResult?.summary && (
                      <span className="truncate">{uploadedFile.analysisResult.summary}</span>
                    )}
                  </div>

                  {uploadedFile.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {uploadedFile.error}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {uploadedFile.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => previewFile(uploadedFile)}
                      className="h-8 w-8 p-0"
                      title="预览"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    title="删除"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Analysis Summary */}
      {uploadedFiles.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡 提示: 这些文件内容将会被包含在对话中，AI可以分析和讨论这些文件。
          </p>
        </div>
      )}
    </div>
  )
}

export default FileUpload
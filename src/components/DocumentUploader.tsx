import React, { useState, useRef } from 'react'
import { DocumentTextIcon, XMarkIcon, EyeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import { parseDocument, formatDocumentForAI, type ParsedDocument } from '@/services/documentParser'

export interface UploadedDocument {
  id: string
  file: File
  parsed: ParsedDocument
  formatted: string
  status: 'parsing' | 'completed' | 'error'
  error?: string
}

interface DocumentUploaderProps {
  onDocumentsChange: (documents: UploadedDocument[]) => void
  maxDocuments?: number
  maxSizeInMB?: number
  className?: string
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onDocumentsChange,
  maxDocuments = 5,
  maxSizeInMB = 20,
  className
}) => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const acceptedFormats = [
    '.pdf',
    '.docx',
    '.doc',
    '.xlsx',
    '.xls',
    '.csv',
    '.txt',
    '.md'
  ]

  const processFile = async (file: File): Promise<UploadedDocument> => {
    const id = `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`

    // Validate file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024
    if (file.size > maxSizeInBytes) {
      throw new Error(`文件大小超过限制 (${maxSizeInMB}MB)`)
    }

    try {
      const parsed = await parseDocument(file)
      const formatted = formatDocumentForAI(parsed, file.name)

      return {
        id,
        file,
        parsed,
        formatted,
        status: 'completed'
      }
    } catch (error: any) {
      throw error
    }
  }

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)

    // Check max documents limit
    if (documents.length + fileArray.length > maxDocuments) {
      toast.error(`最多只能上传 ${maxDocuments} 个文档`)
      return
    }

    for (const file of fileArray) {
      const id = `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`

      // Add to state with parsing status
      const tempDoc: UploadedDocument = {
        id,
        file,
        parsed: { text: '', metadata: {}, type: 'pdf' },
        formatted: '',
        status: 'parsing'
      }

      setDocuments(prev => {
        const updated = [...prev, tempDoc]
        onDocumentsChange(updated)
        return updated
      })

      try {
        const uploadedDoc = await processFile(file)
        setDocuments(prev => {
          const updated = prev.map(doc =>
            doc.id === id ? uploadedDoc : doc
          )
          onDocumentsChange(updated)
          return updated
        })
        toast.success(`${file.name} 解析成功`)
      } catch (error: any) {
        toast.error(error.message)
        setDocuments(prev => {
          const updated = prev.map(doc =>
            doc.id === id
              ? { ...doc, status: 'error' as const, error: error.message }
              : doc
          )
          onDocumentsChange(updated)
          return updated
        })
      }
    }
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

  const removeDocument = (id: string) => {
    const updatedDocs = documents.filter(doc => doc.id !== id)
    setDocuments(updatedDocs)
    onDocumentsChange(updatedDocs)
  }

  const clearAll = () => {
    setDocuments([])
    onDocumentsChange([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📕'
      case 'docx':
        return '📘'
      case 'xlsx':
        return '📗'
      case 'txt':
        return '📄'
      default:
        return '📄'
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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
          <DocumentTextIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              点击或拖拽上传文档
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              支持 PDF, Word, Excel, TXT，最大 {maxSizeInMB}MB
            </p>
          </div>
          <div className="text-xs text-gray-400">
            {documents.length}/{maxDocuments} 个文档
          </div>
        </div>
      </div>

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              已上传文档 ({documents.length})
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

          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="relative group rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">
                    {doc.status === 'completed' ? getFileIcon(doc.parsed.type) : '⏳'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {doc.file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatFileSize(doc.file.size)}
                          {doc.status === 'completed' && doc.parsed.metadata.pageCount && (
                            <> · {doc.parsed.metadata.pageCount} 页</>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {doc.status === 'completed' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewDoc(doc)}
                              className="h-7 w-7 p-0"
                              title="预览"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                            <CheckCircleIcon className="w-5 h-5 text-green-500" />
                          </>
                        )}
                        {doc.status === 'parsing' && (
                          <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        )}
                        {doc.status === 'error' && (
                          <XMarkIcon className="w-5 h-5 text-red-500" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(doc.id)}
                          className="h-7 w-7 p-0"
                          title="删除"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {doc.status === 'error' && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {doc.error}
                      </p>
                    )}

                    {doc.status === 'completed' && doc.parsed.metadata.title && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        📌 {doc.parsed.metadata.title}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {previewDoc.file.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {previewDoc.parsed.type.toUpperCase()}
                  {previewDoc.parsed.metadata.pageCount && ` · ${previewDoc.parsed.metadata.pageCount} 页`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewDoc(null)}
                className="h-8 w-8 p-0 flex-shrink-0 ml-2"
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                {previewDoc.parsed.text}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DocumentUploader

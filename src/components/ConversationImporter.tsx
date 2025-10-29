import React, { useState, useCallback } from 'react'
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Button, Badge } from './ui'
import { cn } from '@/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useAppStore } from '@/store'
import type { Conversation } from '@/types'
import { useDropzone } from 'react-dropzone'

interface ConversationImporterProps {
  isOpen: boolean
  onClose: () => void
}

type ImportFormat = 'json' | 'markdown'

interface ImportResult {
  success: number
  failed: number
  duplicates: number
  imported: Conversation[]
  errors: string[]
}

const ConversationImporter: React.FC<ConversationImporterProps> = ({
  isOpen,
  onClose
}) => {
  const { conversations, addConversation } = useAppStore()
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat>('json')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [previewData, setPreviewData] = useState<Conversation[] | null>(null)

  // 验证对话数据格式
  const validateConversation = (conv: any): conv is Conversation => {
    return (
      typeof conv === 'object' &&
      conv !== null &&
      typeof conv.id === 'string' &&
      typeof conv.title === 'string' &&
      Array.isArray(conv.messages) &&
      typeof conv.createdAt === 'number' &&
      typeof conv.updatedAt === 'number'
    )
  }

  // 检查是否重复
  const isDuplicate = (conv: Conversation): boolean => {
    return conversations.some(existing => existing.id === conv.id)
  }

  // 解析 JSON 格式
  const parseJSON = (content: string): Conversation[] => {
    try {
      const data = JSON.parse(content)

      // 处理单个对话
      if (validateConversation(data)) {
        return [data]
      }

      // 处理对话数组
      if (Array.isArray(data)) {
        return data.filter(validateConversation)
      }

      // 处理包含对话数组的对象
      if (data.conversations && Array.isArray(data.conversations)) {
        return data.conversations.filter(validateConversation)
      }

      throw new Error('无效的 JSON 格式')
    } catch (error) {
      throw new Error(`JSON 解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 解析 Markdown 格式 (基础实现)
  const parseMarkdown = (content: string): Conversation[] => {
    // 这是一个简单的 Markdown 解析实现
    // 实际应用中可以根据导出的 Markdown 格式进行定制
    try {
      const conversations: Conversation[] = []
      const lines = content.split('\n')
      let currentConv: Partial<Conversation> | null = null
      let currentMessages: any[] = []

      for (const line of lines) {
        if (line.startsWith('# ')) {
          // 保存上一个对话
          if (currentConv && currentMessages.length > 0) {
            conversations.push({
              ...currentConv,
              messages: currentMessages
            } as Conversation)
          }

          // 开始新对话
          currentConv = {
            id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: line.substring(2).trim(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            model: 'gpt-3.5-turbo'
          }
          currentMessages = []
        } else if (line.startsWith('## User:') && currentConv) {
          currentMessages.push({
            id: `msg_${Date.now()}_${currentMessages.length}`,
            role: 'user',
            content: line.substring(8).trim(),
            timestamp: Date.now()
          })
        } else if (line.startsWith('## Assistant:') && currentConv) {
          currentMessages.push({
            id: `msg_${Date.now()}_${currentMessages.length}`,
            role: 'assistant',
            content: line.substring(13).trim(),
            timestamp: Date.now()
          })
        }
      }

      // 保存最后一个对话
      if (currentConv && currentMessages.length > 0) {
        conversations.push({
          ...currentConv,
          messages: currentMessages
        } as Conversation)
      }

      if (conversations.length === 0) {
        throw new Error('未找到有效的对话数据')
      }

      return conversations
    } catch (error) {
      throw new Error(`Markdown 解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 处理文件上传
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return

    setIsImporting(true)
    const file = files[0]

    try {
      const content = await file.text()
      let parsedConversations: Conversation[]

      // 根据文件类型解析
      if (file.name.endsWith('.json')) {
        parsedConversations = parseJSON(content)
      } else if (file.name.endsWith('.md') || file.name.endsWith('.markdown')) {
        parsedConversations = parseMarkdown(content)
      } else {
        // 尝试自动检测格式
        try {
          parsedConversations = parseJSON(content)
        } catch {
          parsedConversations = parseMarkdown(content)
        }
      }

      setPreviewData(parsedConversations)
      toast.success(`成功解析 ${parsedConversations.length} 个对话，请预览确认`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '文件解析失败')
      console.error('Import error:', error)
    } finally {
      setIsImporting(false)
    }
  }

  // 确认导入
  const confirmImport = () => {
    if (!previewData) return

    const result: ImportResult = {
      success: 0,
      failed: 0,
      duplicates: 0,
      imported: [],
      errors: []
    }

    previewData.forEach(conv => {
      try {
        if (isDuplicate(conv)) {
          result.duplicates++
          result.errors.push(`对话 "${conv.title}" 已存在 (ID: ${conv.id})`)
        } else {
          addConversation(conv)
          result.success++
          result.imported.push(conv)
        }
      } catch (error) {
        result.failed++
        result.errors.push(`导入 "${conv.title}" 失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    })

    setImportResult(result)
    setPreviewData(null)

    if (result.success > 0) {
      toast.success(`成功导入 ${result.success} 个对话`)
    }
    if (result.duplicates > 0) {
      toast.warning(`跳过 ${result.duplicates} 个重复对话`)
    }
    if (result.failed > 0) {
      toast.error(`导入失败 ${result.failed} 个对话`)
    }
  }

  // Dropzone 配置
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    accept: {
      'application/json': ['.json'],
      'text/markdown': ['.md', '.markdown'],
      'text/plain': ['.txt']
    },
    multiple: false,
    disabled: isImporting
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-xl bg-white dark:bg-gray-800 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <ArrowUpTrayIcon className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              导入对话
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择格式
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFormat('json')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors',
                  selectedFormat === 'json'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <CodeBracketIcon className="w-5 h-5" />
                JSON
              </button>
              <button
                onClick={() => setSelectedFormat('markdown')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors',
                  selectedFormat === 'markdown'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <DocumentTextIcon className="w-5 h-5" />
                Markdown
              </button>
            </div>
          </div>

          {/* Upload Area */}
          {!previewData && !importResult && (
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              )}
            >
              <input {...getInputProps()} />
              <ArrowUpTrayIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                {isDragActive ? '释放文件以上传' : '拖拽文件到这里，或点击选择文件'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                支持 .json, .md, .markdown 格式
              </p>
            </div>
          )}

          {/* Preview */}
          <AnimatePresence>
            {previewData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 max-h-96 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    预览 ({previewData.length} 个对话)
                  </h3>
                  <Badge variant="info">{previewData.length}</Badge>
                </div>
                {previewData.map((conv, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {conv.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {conv.messages.length} 条消息
                        </p>
                      </div>
                      {isDuplicate(conv) && (
                        <Badge variant="warning">重复</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Import Result */}
          <AnimatePresence>
            {importResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
              >
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                  导入结果
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {importResult.success}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">成功</p>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {importResult.duplicates}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">重复</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {importResult.failed}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">失败</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      错误详情:
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResult.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-600 dark:text-red-400">
                          • {error}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 p-6">
          {previewData ? (
            <>
              <Button
                variant="secondary"
                onClick={() => setPreviewData(null)}
              >
                取消
              </Button>
              <Button
                onClick={confirmImport}
                disabled={isImporting}
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                确认导入
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={onClose}>
              关闭
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ConversationImporter

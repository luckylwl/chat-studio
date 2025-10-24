import React, { useState } from 'react'
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  TableCellsIcon,
  DocumentIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Button, Badge } from './ui'
import { cn } from '@/utils'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useAppStore } from '@/store'
import type { Conversation } from '@/types'

interface ConversationExporterProps {
  isOpen: boolean
  onClose: () => void
  conversationIds?: string[]
}

type ExportFormat = 'markdown' | 'json' | 'txt' | 'csv' | 'html' | 'pdf'

interface ExportOptions {
  format: ExportFormat
  includeMetadata: boolean
  includeTimestamps: boolean
  includeModel: boolean
  includeTokens: boolean
  prettyPrint: boolean
}

const ConversationExporter: React.FC<ConversationExporterProps> = ({
  isOpen,
  onClose,
  conversationIds
}) => {
  const { conversations } = useAppStore()
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown')
  const [options, setOptions] = useState<ExportOptions>({
    format: 'markdown',
    includeMetadata: true,
    includeTimestamps: true,
    includeModel: true,
    includeTokens: false,
    prettyPrint: true
  })
  const [isExporting, setIsExporting] = useState(false)

  const formats = [
    {
      id: 'markdown' as ExportFormat,
      name: 'Markdown',
      icon: DocumentTextIcon,
      description: '适合文档和笔记',
      extension: '.md'
    },
    {
      id: 'json' as ExportFormat,
      name: 'JSON',
      icon: CodeBracketIcon,
      description: '结构化数据格式',
      extension: '.json'
    },
    {
      id: 'txt' as ExportFormat,
      name: '纯文本',
      icon: DocumentIcon,
      description: '简单文本格式',
      extension: '.txt'
    },
    {
      id: 'csv' as ExportFormat,
      name: 'CSV',
      icon: TableCellsIcon,
      description: '表格数据格式',
      extension: '.csv'
    },
    {
      id: 'html' as ExportFormat,
      name: 'HTML',
      icon: CodeBracketIcon,
      description: '网页格式',
      extension: '.html'
    }
  ]

  const exportToMarkdown = (convs: Conversation[]): string => {
    let markdown = '# AI Chat Studio 对话导出\n\n'

    convs.forEach(conv => {
      markdown += `## ${conv.title}\n\n`

      if (options.includeMetadata) {
        markdown += `**创建时间**: ${new Date(conv.createdAt).toLocaleString()}\n`
        markdown += `**更新时间**: ${new Date(conv.updatedAt).toLocaleString()}\n`
        if (options.includeModel) {
          markdown += `**模型**: ${conv.model}\n`
        }
        markdown += `**消息数**: ${conv.messages.length}\n\n`
      }

      markdown += '---\n\n'

      conv.messages.forEach((msg, idx) => {
        const role = msg.role === 'user' ? '👤 用户' : '🤖 AI助手'
        markdown += `### ${role}\n\n`

        if (options.includeTimestamps) {
          markdown += `*${new Date(msg.timestamp).toLocaleString()}*\n\n`
        }

        markdown += `${msg.content}\n\n`

        if (options.includeModel && msg.model) {
          markdown += `> 模型: ${msg.model}\n`
        }
        if (options.includeTokens && msg.tokens) {
          markdown += `> Tokens: ${msg.tokens}\n`
        }

        if (idx < conv.messages.length - 1) {
          markdown += '\n---\n\n'
        }
      })

      markdown += '\n\n'
    })

    return markdown
  }

  const exportToJSON = (convs: Conversation[]): string => {
    const data = convs.map(conv => ({
      id: conv.id,
      title: conv.title,
      model: options.includeModel ? conv.model : undefined,
      createdAt: options.includeTimestamps ? conv.createdAt : undefined,
      updatedAt: options.includeTimestamps ? conv.updatedAt : undefined,
      messages: conv.messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: options.includeTimestamps ? msg.timestamp : undefined,
        model: options.includeModel ? msg.model : undefined,
        tokens: options.includeTokens ? msg.tokens : undefined
      }))
    }))

    return JSON.stringify(data, null, options.prettyPrint ? 2 : 0)
  }

  const exportToTXT = (convs: Conversation[]): string => {
    let text = 'AI CHAT STUDIO 对话导出\n'
    text += '='.repeat(50) + '\n\n'

    convs.forEach(conv => {
      text += `对话: ${conv.title}\n`
      text += '-'.repeat(50) + '\n'

      if (options.includeMetadata) {
        text += `创建时间: ${new Date(conv.createdAt).toLocaleString()}\n`
        text += `更新时间: ${new Date(conv.updatedAt).toLocaleString()}\n`
        if (options.includeModel) {
          text += `模型: ${conv.model}\n`
        }
        text += `消息数: ${conv.messages.length}\n`
      }

      text += '\n'

      conv.messages.forEach((msg, idx) => {
        const role = msg.role === 'user' ? '用户' : 'AI助手'
        text += `[${role}]`

        if (options.includeTimestamps) {
          text += ` (${new Date(msg.timestamp).toLocaleString()})`
        }

        text += '\n'
        text += msg.content + '\n'

        if (options.includeModel && msg.model) {
          text += `  模型: ${msg.model}\n`
        }
        if (options.includeTokens && msg.tokens) {
          text += `  Tokens: ${msg.tokens}\n`
        }

        if (idx < conv.messages.length - 1) {
          text += '\n'
        }
      })

      text += '\n' + '='.repeat(50) + '\n\n'
    })

    return text
  }

  const exportToCSV = (convs: Conversation[]): string => {
    const headers = [
      '对话ID',
      '对话标题',
      '消息ID',
      '角色',
      '内容',
      ...(options.includeTimestamps ? ['时间戳'] : []),
      ...(options.includeModel ? ['模型'] : []),
      ...(options.includeTokens ? ['Tokens'] : [])
    ]

    let csv = headers.join(',') + '\n'

    convs.forEach(conv => {
      conv.messages.forEach(msg => {
        const row = [
          conv.id,
          `"${conv.title.replace(/"/g, '""')}"`,
          msg.id,
          msg.role,
          `"${msg.content.replace(/"/g, '""')}"`,
          ...(options.includeTimestamps ? [new Date(msg.timestamp).toISOString()] : []),
          ...(options.includeModel ? [msg.model || ''] : []),
          ...(options.includeTokens ? [msg.tokens || ''] : [])
        ]
        csv += row.join(',') + '\n'
      })
    })

    return csv
  }

  const exportToHTML = (convs: Conversation[]): string => {
    let html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Chat Studio 对话导出</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #f9fafb;
      color: #1f2937;
    }
    .conversation {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .conversation-header {
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .conversation-title {
      font-size: 24px;
      font-weight: 700;
      margin: 0 0 8px 0;
    }
    .conversation-meta {
      font-size: 14px;
      color: #6b7280;
    }
    .message {
      margin-bottom: 24px;
      padding: 16px;
      border-radius: 8px;
    }
    .message-user {
      background: #3b82f6;
      color: white;
      margin-left: 20%;
    }
    .message-assistant {
      background: #f3f4f6;
      color: #1f2937;
      margin-right: 20%;
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 600;
    }
    .message-content {
      white-space: pre-wrap;
      line-height: 1.6;
    }
    .message-meta {
      margin-top: 8px;
      font-size: 12px;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <h1>AI Chat Studio 对话导出</h1>
`

    convs.forEach(conv => {
      html += `
  <div class="conversation">
    <div class="conversation-header">
      <h2 class="conversation-title">${conv.title}</h2>
      <div class="conversation-meta">
        ${options.includeMetadata ? `
        创建: ${new Date(conv.createdAt).toLocaleString()} |
        更新: ${new Date(conv.updatedAt).toLocaleString()} |
        消息数: ${conv.messages.length}
        ${options.includeModel ? ` | 模型: ${conv.model}` : ''}
        ` : ''}
      </div>
    </div>
`

      conv.messages.forEach(msg => {
        const roleClass = msg.role === 'user' ? 'message-user' : 'message-assistant'
        const roleName = msg.role === 'user' ? '👤 用户' : '🤖 AI助手'

        html += `
    <div class="message ${roleClass}">
      <div class="message-header">
        <span>${roleName}</span>
        ${options.includeTimestamps ? `<span>${new Date(msg.timestamp).toLocaleString()}</span>` : ''}
      </div>
      <div class="message-content">${msg.content}</div>
      ${(options.includeModel && msg.model) || (options.includeTokens && msg.tokens) ? `
      <div class="message-meta">
        ${options.includeModel && msg.model ? `模型: ${msg.model}` : ''}
        ${options.includeTokens && msg.tokens ? ` | Tokens: ${msg.tokens}` : ''}
      </div>
      ` : ''}
    </div>
`
      })

      html += `
  </div>
`
    })

    html += `
</body>
</html>
`

    return html
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // 获取要导出的对话
      const convsToExport = conversationIds
        ? conversations.filter(c => conversationIds.includes(c.id))
        : conversations

      if (convsToExport.length === 0) {
        toast.error('没有可导出的对话')
        return
      }

      let content: string
      let mimeType: string
      let extension: string

      switch (selectedFormat) {
        case 'markdown':
          content = exportToMarkdown(convsToExport)
          mimeType = 'text/markdown'
          extension = '.md'
          break
        case 'json':
          content = exportToJSON(convsToExport)
          mimeType = 'application/json'
          extension = '.json'
          break
        case 'txt':
          content = exportToTXT(convsToExport)
          mimeType = 'text/plain'
          extension = '.txt'
          break
        case 'csv':
          content = exportToCSV(convsToExport)
          mimeType = 'text/csv'
          extension = '.csv'
          break
        case 'html':
          content = exportToHTML(convsToExport)
          mimeType = 'text/html'
          extension = '.html'
          break
        default:
          throw new Error('不支持的导出格式')
      }

      // 创建下载
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `conversations_${Date.now()}${extension}`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('导出成功!')
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('导出失败，请重试')
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <ArrowDownTrayIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                导出对话
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                选择导出格式和选项
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Format Selection */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              选择导出格式
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {formats.map((format) => {
                const Icon = format.icon
                return (
                  <button
                    key={format.id}
                    onClick={() => {
                      setSelectedFormat(format.id)
                      setOptions(prev => ({ ...prev, format: format.id }))
                    }}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-left',
                      selectedFormat === format.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center',
                        selectedFormat === format.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          {format.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {format.description}
                        </p>
                      </div>
                      {selectedFormat === format.id && (
                        <CheckCircleIcon className="w-5 h-5 text-primary-500" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              导出选项
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeMetadata}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                  className="w-4 h-4 text-primary-500 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    包含元数据
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    创建时间、更新时间、消息数等信息
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeTimestamps}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeTimestamps: e.target.checked }))}
                  className="w-4 h-4 text-primary-500 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    包含时间戳
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    每条消息的发送时间
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeModel}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeModel: e.target.checked }))}
                  className="w-4 h-4 text-primary-500 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    包含模型信息
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    使用的AI模型名称
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.includeTokens}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeTokens: e.target.checked }))}
                  className="w-4 h-4 text-primary-500 rounded"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    包含Token统计
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    每条消息的Token使用量
                  </div>
                </div>
              </label>

              {selectedFormat === 'json' && (
                <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.prettyPrint}
                    onChange={(e) => setOptions(prev => ({ ...prev, prettyPrint: e.target.checked }))}
                    className="w-4 h-4 text-primary-500 rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      格式化输出
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      使用缩进和换行，更易读
                    </div>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 dark:text-blue-400">
                ℹ️
              </div>
              <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">导出摘要</p>
                <p>
                  将导出 <strong>{conversationIds?.length || conversations.length}</strong> 个对话，
                  格式为 <strong>{formats.find(f => f.id === selectedFormat)?.name}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                导出中...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                开始导出
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default ConversationExporter
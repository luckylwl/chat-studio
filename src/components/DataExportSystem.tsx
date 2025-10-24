import React, { useState } from 'react'
import { useAppStore } from '@/store'
import { Button, Input } from './ui'
import { cn } from '@/utils'
import {
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  FolderArrowDownIcon,
  CpuChipIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  LockClosedIcon,
  KeyIcon
} from '@heroicons/react/24/outline'

interface ExportOptions {
  format: 'json' | 'csv' | 'markdown' | 'html' | 'txt'
  includeMetadata: boolean
  dateRange: 'all' | 'last7days' | 'last30days' | 'last90days' | 'custom'
  startDate?: string
  endDate?: string
  selectedConversations: string[]
  includeSystemMessages: boolean
  compressOutput: boolean
  encryptOutput: boolean
  password?: string
}

interface BackupOptions {
  includeSettings: boolean
  includeApiKeys: boolean
  includeConversations: boolean
  compressionLevel: 'none' | 'low' | 'medium' | 'high'
  encryptBackup: boolean
  backupPassword?: string
  autoBackup: boolean
  backupFrequency: 'daily' | 'weekly' | 'monthly'
}

interface DataExportSystemProps {
  className?: string
}

const DataExportSystem: React.FC<DataExportSystemProps> = ({ className }) => {
  const { conversations, user, apiProviders } = useAppStore()
  const [activeTab, setActiveTab] = useState<'export' | 'backup' | 'import'>('export')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    dateRange: 'all',
    selectedConversations: [],
    includeSystemMessages: true,
    compressOutput: false,
    encryptOutput: false
  })

  const [backupOptions, setBackupOptions] = useState<BackupOptions>({
    includeSettings: true,
    includeApiKeys: false,
    includeConversations: true,
    compressionLevel: 'medium',
    encryptBackup: false,
    autoBackup: false,
    backupFrequency: 'weekly'
  })

  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [lastExportSize, setLastExportSize] = useState<string>('')

  // Filter conversations based on date range and selection
  const getFilteredConversations = () => {
    let filtered = conversations

    // Apply date filter
    if (exportOptions.dateRange !== 'all') {
      const now = Date.now()
      const msPerDay = 24 * 60 * 60 * 1000

      const ranges = {
        'last7days': 7 * msPerDay,
        'last30days': 30 * msPerDay,
        'last90days': 90 * msPerDay,
        'custom': 0 // Handle custom range separately
      }

      if (exportOptions.dateRange === 'custom') {
        if (exportOptions.startDate && exportOptions.endDate) {
          const start = new Date(exportOptions.startDate).getTime()
          const end = new Date(exportOptions.endDate).getTime()
          filtered = filtered.filter(conv =>
            conv.updatedAt >= start && conv.updatedAt <= end
          )
        }
      } else {
        const cutoff = now - ranges[exportOptions.dateRange]
        filtered = filtered.filter(conv => conv.updatedAt >= cutoff)
      }
    }

    // Apply conversation selection filter
    if (exportOptions.selectedConversations.length > 0) {
      filtered = filtered.filter(conv =>
        exportOptions.selectedConversations.includes(conv.id)
      )
    }

    return filtered
  }

  // Generate export data based on format
  const generateExportData = (format: string, data: any) => {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2)

      case 'csv':
        const messages = data.conversations.flatMap((conv: any) =>
          conv.messages.map((msg: any) => ({
            conversation_id: conv.id,
            conversation_title: conv.title,
            model: conv.model,
            timestamp: new Date(msg.timestamp).toISOString(),
            role: msg.role,
            content: msg.content.replace(/\n/g, ' ').replace(/"/g, '""')
          }))
        )

        const headers = 'conversation_id,conversation_title,model,timestamp,role,content\n'
        const rows = messages.map((msg: any) =>
          `"${msg.conversation_id}","${msg.conversation_title}","${msg.model}","${msg.timestamp}","${msg.role}","${msg.content}"`
        ).join('\n')

        return headers + rows

      case 'markdown':
        return data.conversations.map((conv: any) => {
          const header = `# ${conv.title}\n\n**Model**: ${conv.model}  \n**Created**: ${new Date(conv.createdAt).toLocaleString()}  \n**Updated**: ${new Date(conv.updatedAt).toLocaleString()}\n\n---\n\n`
          const messages = conv.messages.map((msg: any) =>
            `**${msg.role === 'user' ? 'User' : 'Assistant'}** (${new Date(msg.timestamp).toLocaleString()})\n\n${msg.content}\n\n---\n\n`
          ).join('')
          return header + messages
        }).join('\n\n')

      case 'html':
        const htmlContent = data.conversations.map((conv: any) => {
          const messagesHtml = conv.messages.map((msg: any) => `
            <div class="message ${msg.role}">
              <div class="message-header">
                <strong>${msg.role === 'user' ? 'User' : 'Assistant'}</strong>
                <span class="timestamp">${new Date(msg.timestamp).toLocaleString()}</span>
              </div>
              <div class="message-content">${msg.content.replace(/\n/g, '<br>')}</div>
            </div>
          `).join('')

          return `
            <div class="conversation">
              <h2>${conv.title}</h2>
              <div class="conversation-meta">
                <p><strong>Model:</strong> ${conv.model}</p>
                <p><strong>Created:</strong> ${new Date(conv.createdAt).toLocaleString()}</p>
                <p><strong>Updated:</strong> ${new Date(conv.updatedAt).toLocaleString()}</p>
              </div>
              <div class="messages">
                ${messagesHtml}
              </div>
            </div>
          `
        }).join('')

        return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Chat Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .conversation { margin-bottom: 40px; border: 1px solid #ddd; padding: 20px; }
            .message { margin-bottom: 20px; padding: 15px; border-radius: 8px; }
            .message.user { background: #e3f2fd; }
            .message.assistant { background: #f3e5f5; }
            .message-header { font-weight: bold; margin-bottom: 10px; display: flex; justify-content: space-between; }
            .timestamp { font-size: 0.9em; color: #666; }
            .conversation-meta { color: #666; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>AI Chat Export</h1>
          ${htmlContent}
        </body>
        </html>
        `

      case 'txt':
        return data.conversations.map((conv: any) => {
          const header = `=== ${conv.title} ===\nModel: ${conv.model}\nCreated: ${new Date(conv.createdAt).toLocaleString()}\nUpdated: ${new Date(conv.updatedAt).toLocaleString()}\n\n`
          const messages = conv.messages.map((msg: any) =>
            `[${msg.role.toUpperCase()}] ${new Date(msg.timestamp).toLocaleString()}\n${msg.content}\n\n`
          ).join('')
          return header + messages + '\n' + '='.repeat(50) + '\n\n'
        }).join('')

      default:
        return JSON.stringify(data, null, 2)
    }
  }

  // Handle export
  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const filtered = getFilteredConversations()

      const exportData = {
        exportInfo: {
          exportDate: new Date().toISOString(),
          format: exportOptions.format,
          totalConversations: filtered.length,
          totalMessages: filtered.reduce((sum, conv) => sum + conv.messages.length, 0),
          dateRange: exportOptions.dateRange,
          includeMetadata: exportOptions.includeMetadata
        },
        conversations: exportOptions.includeMetadata ?
          filtered.map(conv => ({
            ...conv,
            messages: exportOptions.includeSystemMessages
              ? conv.messages
              : conv.messages.filter(msg => msg.role !== 'system')
          })) :
          filtered.map(conv => ({
            id: conv.id,
            title: conv.title,
            model: conv.model,
            messages: conv.messages.map(msg => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp
            }))
          }))
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
      clearInterval(progressInterval)

      const content = generateExportData(exportOptions.format, exportData)
      const blob = new Blob([content], {
        type: exportOptions.format === 'json' ? 'application/json' : 'text/plain'
      })

      // Calculate file size
      const sizeKB = (blob.size / 1024).toFixed(2)
      setLastExportSize(`${sizeKB} KB`)

      // Download file
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-export-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setExportProgress(100)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setTimeout(() => {
        setIsExporting(false)
        setExportProgress(0)
      }, 1000)
    }
  }

  // Handle backup
  const handleBackup = async () => {
    const backupData = {
      backupInfo: {
        date: new Date().toISOString(),
        version: '1.0.0',
        options: backupOptions
      },
      ...(backupOptions.includeConversations && { conversations }),
      ...(backupOptions.includeSettings && { user }),
      ...(backupOptions.includeApiKeys && {
        apiProviders: apiProviders.map(provider => ({
          ...provider,
          apiKey: provider.apiKey ? '***ENCRYPTED***' : ''
        }))
      })
    }

    const content = JSON.stringify(backupData, null, 2)
    const blob = new Blob([content], { type: 'application/json' })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-studio-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handle import
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        console.log('Imported data:', data)
        // Here you would merge the imported data with existing state
      } catch (error) {
        console.error('Import failed:', error)
      }
    }
    reader.readAsText(file)
  }

  const formatOptions = [
    { value: 'json', label: 'JSON', description: '结构化数据，便于程序处理' },
    { value: 'csv', label: 'CSV', description: '表格格式，可用Excel打开' },
    { value: 'markdown', label: 'Markdown', description: '文档格式，可读性强' },
    { value: 'html', label: 'HTML', description: '网页格式，带样式渲染' },
    { value: 'txt', label: '纯文本', description: '纯文本格式，通用性好' }
  ]

  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700', className)}>
      {/* Header Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          {[
            { id: 'export', name: '数据导出', icon: DocumentArrowDownIcon },
            { id: 'backup', name: '备份恢复', icon: CloudArrowUpIcon },
            { id: 'import', name: '数据导入', icon: FolderArrowDownIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">数据导出</h3>
            <p className="text-gray-600 dark:text-gray-400">将对话数据导出为多种格式，便于备份或迁移</p>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">导出格式</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {formatOptions.map((format) => (
                <button
                  key={format.value}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as any }))}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all',
                    exportOptions.format === format.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">{format.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{format.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">时间范围</label>
            <select
              value={exportOptions.dateRange}
              onChange={(e) => setExportOptions(prev => ({ ...prev, dateRange: e.target.value as any }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">全部时间</option>
              <option value="last7days">最近7天</option>
              <option value="last30days">最近30天</option>
              <option value="last90days">最近90天</option>
              <option value="custom">自定义范围</option>
            </select>

            {exportOptions.dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">开始日期</label>
                  <Input
                    type="date"
                    value={exportOptions.startDate || ''}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">结束日期</label>
                  <Input
                    type="date"
                    value={exportOptions.endDate || ''}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">导出选项</label>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportOptions.includeMetadata}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">包含元数据</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">导出创建时间、更新时间等详细信息</div>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportOptions.includeSystemMessages}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, includeSystemMessages: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">包含系统消息</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">导出系统提示词和状态消息</div>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={exportOptions.compressOutput}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, compressOutput: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">压缩输出</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">减小文件大小，适合大量数据</div>
                </div>
              </label>
            </div>
          </div>

          {/* Export Statistics */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {getFilteredConversations().length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">对话数量</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {getFilteredConversations().reduce((sum, conv) => sum + conv.messages.length, 0)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">消息数量</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {Math.round(getFilteredConversations().reduce((sum, conv) =>
                    sum + conv.messages.reduce((msgSum, msg) => msgSum + msg.content.length, 0), 0
                  ) / 1024)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">KB 文本</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {lastExportSize || '-'}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">上次导出</div>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex gap-4">
            <Button
              onClick={handleExport}
              disabled={isExporting || getFilteredConversations().length === 0}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              {isExporting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  导出中... {exportProgress}%
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  开始导出
                </div>
              )}
            </Button>
          </div>

          {/* Progress Bar */}
          {isExporting && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Backup Tab */}
      {activeTab === 'backup' && (
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">备份恢复</h3>
            <p className="text-gray-600 dark:text-gray-400">创建完整备份或从备份文件恢复数据</p>
          </div>

          {/* Backup Options */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">备份内容</label>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={backupOptions.includeConversations}
                  onChange={(e) => setBackupOptions(prev => ({ ...prev, includeConversations: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">对话记录</span>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={backupOptions.includeSettings}
                  onChange={(e) => setBackupOptions(prev => ({ ...prev, includeSettings: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <CpuChipIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">应用设置</span>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={backupOptions.includeApiKeys}
                  onChange={(e) => setBackupOptions(prev => ({ ...prev, includeApiKeys: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center gap-2">
                  <KeyIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-900 dark:text-gray-100">API密钥配置</span>
                  <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" title="安全敏感信息" />
                </div>
              </label>
            </div>
          </div>

          {/* Backup Actions */}
          <div className="flex gap-4">
            <Button
              onClick={handleBackup}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <div className="flex items-center gap-2">
                <CloudArrowUpIcon className="h-4 w-4" />
                创建备份
              </div>
            </Button>

            <Button variant="outline" className="flex-1">
              <div className="flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4" />
                定时备份
              </div>
            </Button>
          </div>
        </div>
      )}

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">数据导入</h3>
            <p className="text-gray-600 dark:text-gray-400">从备份文件或其他格式导入数据</p>
          </div>

          {/* Import Area */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <FolderArrowDownIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">选择导入文件</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">支持 JSON、CSV、Markdown 等格式</p>

            <label className="inline-block">
              <input
                type="file"
                accept=".json,.csv,.md,.txt"
                onChange={handleImport}
                className="hidden"
              />
              <Button variant="outline" className="cursor-pointer">
                <DocumentDuplicateIcon className="h-4 w-4 mr-2" />
                选择文件
              </Button>
            </label>
          </div>

          {/* Import Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">导入注意事项</h4>
                <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1">
                  <li>• 导入将与现有数据合并，不会覆盖</li>
                  <li>• 重复的对话将被跳过</li>
                  <li>• 建议先备份当前数据</li>
                  <li>• 大文件导入可能需要较长时间</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataExportSystem
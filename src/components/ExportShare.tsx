import React, { useState } from 'react'
import {
  ShareIcon,
  DocumentArrowDownIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  PhotoIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { useAppStore } from '@/store'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import type { Conversation } from '@/types'

interface ExportShareProps {
  conversation: Conversation
  onClose: () => void
  className?: string
}

const ExportShare: React.FC<ExportShareProps> = ({
  conversation,
  onClose,
  className
}) => {
  const [copied, setCopied] = useState(false)
  const [exportFormat, setExportFormat] = useState<'markdown' | 'json' | 'txt' | 'html'>('markdown')
  const [shareOption, setShareOption] = useState<'link' | 'image' | 'text'>('link')

  const { user } = useAppStore()

  const exportFormats = [
    { value: 'markdown', label: 'Markdown', icon: <DocumentTextIcon className="h-4 w-4" />, ext: '.md' },
    { value: 'json', label: 'JSON', icon: <CodeBracketIcon className="h-4 w-4" />, ext: '.json' },
    { value: 'txt', label: '纯文本', icon: <DocumentTextIcon className="h-4 w-4" />, ext: '.txt' },
    { value: 'html', label: 'HTML', icon: <DocumentTextIcon className="h-4 w-4" />, ext: '.html' }
  ]

  const shareOptions = [
    { value: 'link', label: '分享链接', icon: <LinkIcon className="h-4 w-4" /> },
    { value: 'image', label: '生成图片', icon: <PhotoIcon className="h-4 w-4" /> },
    { value: 'text', label: '复制文本', icon: <ClipboardDocumentIcon className="h-4 w-4" /> }
  ]

  const formatConversation = (format: string): string => {
    const timestamp = new Date().toLocaleString('zh-CN')
    const title = conversation.title
    const model = conversation.model

    switch (format) {
      case 'markdown':
        let markdown = `# ${title}\n\n`
        markdown += `**导出时间**: ${timestamp}\n`
        markdown += `**使用模型**: ${model}\n`
        markdown += `**消息数量**: ${conversation.messages.length}\n\n---\n\n`

        conversation.messages.forEach((message, index) => {
          const role = message.role === 'user' ? '👤 用户' : '🤖 助手'
          markdown += `## ${role}\n\n`
          markdown += `${message.content}\n\n`
          if (index < conversation.messages.length - 1) {
            markdown += '---\n\n'
          }
        })

        markdown += `\n---\n\n*由 AI Chat Studio 导出*`
        return markdown

      case 'json':
        return JSON.stringify({
          title: conversation.title,
          model: conversation.model,
          exportTime: timestamp,
          messages: conversation.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp).toISOString()
          }))
        }, null, 2)

      case 'txt':
        let text = `${title}\n`
        text += `导出时间: ${timestamp}\n`
        text += `使用模型: ${model}\n`
        text += `消息数量: ${conversation.messages.length}\n`
        text += '='.repeat(50) + '\n\n'

        conversation.messages.forEach((message, index) => {
          const role = message.role === 'user' ? '用户' : '助手'
          text += `[${role}]:\n${message.content}\n\n`
        })

        text += '由 AI Chat Studio 导出'
        return text

      case 'html':
        let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background: #f9fafb;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .title {
            color: #1f2937;
            margin: 0 0 10px 0;
            font-size: 2em;
        }
        .meta {
            color: #6b7280;
            font-size: 0.9em;
        }
        .message {
            margin: 25px 0;
            padding: 20px;
            border-radius: 8px;
        }
        .user {
            background: #dbeafe;
            border-left: 4px solid #3b82f6;
        }
        .assistant {
            background: #f3f4f6;
            border-left: 4px solid #6b7280;
        }
        .role {
            font-weight: bold;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .content {
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 0.8em;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${title}</h1>
            <div class="meta">
                <div>导出时间: ${timestamp}</div>
                <div>使用模型: ${model}</div>
                <div>消息数量: ${conversation.messages.length}</div>
            </div>
        </div>

        <div class="messages">`

        conversation.messages.forEach((message) => {
          const roleClass = message.role === 'user' ? 'user' : 'assistant'
          const roleText = message.role === 'user' ? '👤 用户' : '🤖 助手'
          html += `
            <div class="message ${roleClass}">
                <div class="role">${roleText}</div>
                <div class="content">${message.content.replace(/\n/g, '<br>')}</div>
            </div>`
        })

        html += `
        </div>

        <div class="footer">
            由 AI Chat Studio 导出
        </div>
    </div>
</body>
</html>`
        return html

      default:
        return ''
    }
  }

  const handleExport = () => {
    try {
      const content = formatConversation(exportFormat)
      const format = exportFormats.find(f => f.value === exportFormat)!

      const blob = new Blob([content], {
        type: exportFormat === 'html' ? 'text/html' : 'text/plain'
      })

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${conversation.title.replace(/[^\w\s-]/g, '').trim()}${format.ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('导出成功')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('导出失败')
    }
  }

  const handleShare = async () => {
    try {
      switch (shareOption) {
        case 'link':
          // 生成分享链接 (模拟)
          const shareUrl = `${window.location.origin}/share/${conversation.id}`
          await navigator.clipboard.writeText(shareUrl)
          setCopied(true)
          toast.success('分享链接已复制到剪贴板')
          setTimeout(() => setCopied(false), 2000)
          break

        case 'image':
          // 生成图片分享 (模拟)
          toast.info('图片生成功能开发中...')
          break

        case 'text':
          const textContent = formatConversation('txt')
          await navigator.clipboard.writeText(textContent)
          setCopied(true)
          toast.success('对话内容已复制到剪贴板')
          setTimeout(() => setCopied(false), 2000)
          break
      }
    } catch (error) {
      console.error('Share error:', error)
      toast.error('分享失败')
    }
  }

  const getStats = () => {
    const wordCount = conversation.messages.reduce((sum, msg) => sum + msg.content.length, 0)
    const userMessages = conversation.messages.filter(msg => msg.role === 'user').length
    const assistantMessages = conversation.messages.filter(msg => msg.role === 'assistant').length

    return { wordCount, userMessages, assistantMessages }
  }

  const stats = getStats()

  return (
    <div className={cn("space-y-6", className)}>
      {/* 对话统计 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">对话统计</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {conversation.messages.length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">总消息</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.userMessages}
            </div>
            <div className="text-gray-600 dark:text-gray-400">用户消息</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.assistantMessages}
            </div>
            <div className="text-gray-600 dark:text-gray-400">AI回复</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.wordCount}
            </div>
            <div className="text-gray-600 dark:text-gray-400">总字符</div>
          </div>
        </div>
      </div>

      {/* 导出功能 */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <DocumentArrowDownIcon className="h-5 w-5" />
          导出对话
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {exportFormats.map(format => (
            <button
              key={format.value}
              onClick={() => setExportFormat(format.value as any)}
              className={cn(
                "p-3 rounded-lg border text-sm font-medium transition-colors",
                exportFormat === format.value
                  ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                {format.icon}
                {format.label}
              </div>
              <div className="text-xs opacity-60">{format.ext}</div>
            </button>
          ))}
        </div>

        <Button
          onClick={handleExport}
          className="w-full gap-2"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          导出为 {exportFormats.find(f => f.value === exportFormat)?.label}
        </Button>
      </div>

      {/* 分享功能 */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ShareIcon className="h-5 w-5" />
          分享对话
        </h3>

        <div className="grid grid-cols-3 gap-2">
          {shareOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setShareOption(option.value as any)}
              className={cn(
                "p-3 rounded-lg border text-sm font-medium transition-colors",
                shareOption === option.value
                  ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-600 text-green-700 dark:text-green-300"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              )}
            >
              <div className="flex items-center gap-2">
                {option.icon}
                {option.label}
              </div>
            </button>
          ))}
        </div>

        <Button
          onClick={handleShare}
          variant="outline"
          className="w-full gap-2"
        >
          {copied ? (
            <>
              <CheckIcon className="h-4 w-4" />
              已复制
            </>
          ) : (
            <>
              <ShareIcon className="h-4 w-4" />
              {shareOptions.find(s => s.value === shareOption)?.label}
            </>
          )}
        </Button>
      </div>

      {/* 提示信息 */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
        <div className="flex items-start gap-2">
          <ShareIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">导出和分享说明:</p>
            <ul className="text-xs space-y-1 opacity-90">
              <li>• 支持多种格式导出，保留完整对话内容</li>
              <li>• 分享链接可供他人查看对话（需要实现后端支持）</li>
              <li>• 所有导出文件包含时间戳和模型信息</li>
              <li>• 敏感信息请谨慎分享</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportShare
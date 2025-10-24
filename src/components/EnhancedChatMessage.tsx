import React, { useState } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import {
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
  UserIcon,
  CpuChipIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline'
import { Button, Badge } from './ui'
import { formatTime, copyToClipboard, cn } from '@/utils'
import type { Message } from '@/types'
import BookmarkButton from './BookmarkButton'
import { useAppStore } from '@/store'
import { VoiceService } from '@/services/voiceService'
import LoadingAnimation from './LoadingAnimation'
import LiveComments from './LiveComments'
import MessageContextMenu from './MessageContextMenu'
import MessageReactions from './MessageReactions'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import 'highlight.js/styles/github-dark.css'

interface EnhancedChatMessageProps {
  message: Message
  isLast?: boolean
  collaborationEnabled?: boolean
  onEdit?: (messageId: string, newContent: string) => void
  onDelete?: (messageId: string) => void
  onRegenerate?: (messageId: string) => void
}

const EnhancedChatMessage: React.FC<EnhancedChatMessageProps> = ({
  message,
  isLast,
  collaborationEnabled = false,
  onEdit,
  onDelete,
  onRegenerate
}) => {
  const [copied, setCopied] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const { currentConversationId } = useAppStore()
  const voiceService = VoiceService.getInstance()

  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  // Configure marked
  marked.setOptions({
    highlight: function(code, language) {
      const validLanguage = hljs.getLanguage(language) ? language : 'plaintext'
      return hljs.highlight(code, { language: validLanguage }).value
    },
    breaks: true,
    gfm: true
  })

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows={5}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => {
                onEdit?.(message.id, editContent)
                setIsEditing(false)
                toast.success('消息已更新')
              }}
            >
              保存
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditContent(message.content)
                setIsEditing(false)
              }}
            >
              取消
            </Button>
          </div>
        </div>
      )
    }

    if (isUser) {
      return (
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
      )
    }

    if (message.isStreaming && !message.content) {
      return (
        <div className="flex items-center space-x-2">
          <LoadingAnimation variant="typing" text="AI正在思考..." />
        </div>
      )
    }

    try {
      const html = marked(message.content)
      const sanitizedHtml = DOMPurify.sanitize(html)
      return (
        <div className="relative">
          <div
            className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
          {message.isStreaming && message.content && (
            <motion.div
              className="inline-block w-0.5 h-4 bg-primary-500 ml-1"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </div>
      )
    } catch (error) {
      return (
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
      )
    }
  }

  const handleCopy = async () => {
    try {
      await copyToClipboard(message.content)
      setCopied(true)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('复制失败')
    }
  }

  const handleCopyAsCode = async () => {
    try {
      await copyToClipboard(`\`\`\`\n${message.content}\n\`\`\``)
      toast.success('已复制为代码块')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const handleSpeak = async () => {
    const capabilities = voiceService.getCapabilities()
    if (!capabilities.speechSynthesis) return

    if (speaking) {
      voiceService.stopSpeaking()
      setSpeaking(false)
    } else {
      try {
        setSpeaking(true)
        await voiceService.speak(message.content)
        setSpeaking(false)
      } catch (error) {
        console.error('Speech error:', error)
        setSpeaking(false)
      }
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const handleQuote = () => {
    // 实现引用功能
    const quotedText = message.content.split('\n').map(line => `> ${line}`).join('\n')
    navigator.clipboard.writeText(quotedText)
    toast.success('已复制引用格式')
  }

  const handleTranslate = () => {
    // 触发翻译功能
    toast.info('翻译功能开发中...')
  }

  const handleShare = () => {
    // 分享功能
    if (navigator.share) {
      navigator.share({
        title: 'AI Chat Studio 对话',
        text: message.content
      })
    } else {
      handleCopy()
    }
  }

  // Auto-speak for AI messages when enabled
  React.useEffect(() => {
    const settings = voiceService.getSettings()
    if (settings.autoSpeak && !isUser && !isSystem && isLast && message.content && !message.isStreaming) {
      const timer = setTimeout(async () => {
        try {
          await voiceService.speak(message.content)
        } catch (error) {
          console.error('Auto-speak error:', error)
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [message.content, message.isStreaming, isLast, isUser, isSystem, voiceService])

  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <Badge variant="secondary" className="text-xs">
          {message.content}
        </Badge>
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          'group flex gap-4 transition-all duration-300 relative',
          isUser ? 'flex-row-reverse' : 'flex-row',
          'hover:bg-gray-50/50 dark:hover:bg-gray-800/30 rounded-2xl p-4 -m-4'
        )}
        onContextMenu={handleContextMenu}
      >
        {/* Avatar */}
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
              : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
          )}
        >
          {isUser ? (
            <UserIcon className="h-5 w-5" />
          ) : (
            <CpuChipIcon className="h-5 w-5" />
          )}
        </div>

        {/* Content */}
        <div className={cn('flex-1 min-w-0', isUser ? 'text-right' : 'text-left')}>
          {/* Header */}
          <div
            className={cn(
              'flex items-center gap-2 mb-2',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {isUser ? '你' : 'AI助手'}
            </span>
            {message.model && !isUser && (
              <Badge variant="outline" className="text-xs">
                {message.model}
              </Badge>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(message.timestamp)}
            </span>
          </div>

          {/* Message content */}
          <div
            className={cn(
              'relative p-4 rounded-2xl shadow-sm border',
              isUser
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200 dark:border-blue-700'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700'
            )}
          >
            {message.isStreaming && (
              <div className="absolute top-2 right-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">生成中...</span>
                </div>
              </div>
            )}

            <div className={cn('text-sm leading-relaxed', isUser && 'text-white')}>
              {renderContent()}
            </div>

            {message.tokens && !isUser && (
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                Token使用量: {message.tokens}
              </div>
            )}

            {collaborationEnabled && (
              <LiveComments
                messageId={message.id}
                enabled={collaborationEnabled}
                className="absolute inset-0"
              />
            )}
          </div>

          {/* Reactions */}
          {!isEditing && !message.isStreaming && (
            <div className="mt-2">
              <MessageReactions
                messageId={message.id}
                onReact={(emoji) => console.log('Reacted with:', emoji)}
              />
            </div>
          )}

          {/* Actions */}
          <div
            className={cn(
              'flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
              isUser ? 'justify-end' : 'justify-start'
            )}
          >
            {currentConversationId && (
              <BookmarkButton
                conversationId={currentConversationId}
                messageId={message.id}
                title={`${isUser ? '用户' : 'AI'}: ${message.content.slice(0, 50)}...`}
                content={message.content}
                size="sm"
                className="h-8 w-8"
              />
            )}

            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 px-3 text-xs">
              {copied ? (
                <>
                  <ClipboardDocumentCheckIcon className="h-3 w-3 mr-1" />
                  已复制
                </>
              ) : (
                <>
                  <ClipboardIcon className="h-3 w-3 mr-1" />
                  复制
                </>
              )}
            </Button>

            {!isUser && voiceService.getCapabilities().speechSynthesis && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSpeak}
                className="h-8 px-3 text-xs"
              >
                {speaking ? (
                  <>
                    <SpeakerXMarkIcon className="h-3 w-3 mr-1" />
                    停止
                  </>
                ) : (
                  <>
                    <SpeakerWaveIcon className="h-3 w-3 mr-1" />
                    朗读
                  </>
                )}
              </Button>
            )}

            {isUser && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 px-3 text-xs"
              >
                编辑
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <MessageContextMenu
          message={message}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onCopy={handleCopy}
          onEdit={isUser ? () => setIsEditing(true) : undefined}
          onDelete={onDelete ? () => onDelete(message.id) : undefined}
          onRegenerate={!isUser && onRegenerate ? () => onRegenerate(message.id) : undefined}
          onBookmark={() => toast.success('已添加书签')}
          onShare={handleShare}
          onSpeak={!isUser ? handleSpeak : undefined}
          onCopyAsCode={handleCopyAsCode}
          onTranslate={handleTranslate}
          onQuote={handleQuote}
        />
      )}
    </>
  )
}

export default EnhancedChatMessage
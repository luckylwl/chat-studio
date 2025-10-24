/**
 * ChatMessage 组件
 *
 * 功能说明:
 * 聊天消息展示组件，用于渲染用户和 AI 的对话消息
 *
 * 核心特性:
 * 1. Markdown 渲染 - 支持完整的 Markdown 语法（标题、列表、代码块、链接等）
 * 2. 代码高亮 - 使用 highlight.js 对代码块进行语法高亮
 * 3. XSS 防护 - 使用 DOMPurify 清理 HTML，防止 XSS 攻击
 * 4. 流式显示 - 支持 AI 回复的流式渲染，带打字光标动画
 * 5. 语音朗读 - 支持文本转语音（TTS），可自动朗读 AI 回复
 * 6. 复制功能 - 一键复制消息内容到剪贴板
 * 7. 书签功能 - 支持将重要消息添加到书签
 * 8. 协作功能 - 支持实时协作时的消息评论
 * 9. Token 统计 - 显示 AI 回复的 token 使用量
 * 10. 响应式设计 - 自适应移动端和桌面端
 *
 * 跨平台兼容性:
 * - iOS/Android: 使用原生 TTS 引擎
 * - Web: 使用 Web Speech API
 * - 所有平台: 统一的 UI 和交互体验
 *
 * @component
 */

import React, { useState } from 'react'
import { marked } from 'marked'        // Markdown 解析器
import DOMPurify from 'dompurify'      // HTML 清理库，防止 XSS
import hljs from 'highlight.js'        // 代码语法高亮
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
import { motion } from 'framer-motion'
import 'highlight.js/styles/github-dark.css'

/**
 * 消息组件属性
 */
interface ChatMessageProps {
  /** 消息对象 */
  message: Message
  /** 是否是最后一条消息（用于自动朗读） */
  isLast?: boolean
  /** 是否启用协作功能（实时评论） */
  collaborationEnabled?: boolean
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLast, collaborationEnabled = false }) => {
  // ============================================
  // 状态管理
  // ============================================

  /** 是否已复制到剪贴板 */
  const [copied, setCopied] = useState(false)

  /** 是否正在语音朗读 */
  const [speaking, setSpeaking] = useState(false)

  /** 当前对话 ID */
  const { currentConversationId } = useAppStore()

  /** 语音服务单例 */
  const voiceService = VoiceService.getInstance()

  // ============================================
  // 消息类型判断
  // ============================================

  /** 是否是用户消息 */
  const isUser = message.role === 'user'

  /** 是否是系统消息 */
  const isSystem = message.role === 'system'

  // ============================================
  // Markdown 配置
  // 配置 marked 库以支持代码高亮和 GitHub 风格 Markdown
  // ============================================
  marked.setOptions({
    /**
     * 代码高亮函数
     * @param code - 代码内容
     * @param language - 编程语言
     * @returns 高亮后的 HTML
     */
    highlight: function(code, language) {
      // 验证语言是否被 highlight.js 支持
      const validLanguage = hljs.getLanguage(language) ? language : 'plaintext'
      return hljs.highlight(code, { language: validLanguage }).value
    },
    breaks: true,  // 支持 GFM 换行（单个换行符转为 <br>）
    gfm: true      // 启用 GitHub Flavored Markdown
  })

  // ============================================
  // 核心功能: 消息内容渲染
  // ============================================

  /**
   * 渲染消息内容
   *
   * 处理逻辑:
   * 1. 用户消息 - 纯文本显示（保留换行和空格）
   * 2. AI 消息（空内容）- 显示加载动画
   * 3. AI 消息（有内容）- Markdown 渲染 + XSS 清理
   * 4. 流式消息 - 添加打字光标动画
   * 5. 错误回退 - 解析失败时显示纯文本
   *
   * @returns 渲染的 React 节点
   */
  const renderContent = () => {
    // 用户消息：纯文本显示
    if (isUser) {
      return (
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
      )
    }

    // AI 消息（流式加载中，无内容）：显示"AI正在思考"动画
    if (message.isStreaming && !message.content) {
      return (
        <div className="flex items-center space-x-2">
          <LoadingAnimation variant="typing" text="AI正在思考..." />
        </div>
      )
    }

    // AI 消息：Markdown 渲染
    try {
      // 步骤 1: 将 Markdown 转换为 HTML
      const html = marked(message.content)

      // 步骤 2: 使用 DOMPurify 清理 HTML，防止 XSS 攻击
      // 移除潜在的恶意脚本和不安全的标签
      const sanitizedHtml = DOMPurify.sanitize(html)

      return (
        <div className="relative">
          {/* Markdown 内容渲染 */}
          <div
            className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700"
            dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
          />
          {/* 流式消息的打字光标动画 */}
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
      // 错误回退：Markdown 解析失败时显示纯文本
      return (
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>
      )
    }
  }

  // ============================================
  // 事件处理函数
  // ============================================

  /**
   * 复制消息内容到剪贴板
   *
   * 跨平台兼容性:
   * - iOS/Android: 使用 React Native Clipboard API
   * - Web: 使用 navigator.clipboard API
   *
   * 用户反馈:
   * - 复制成功后显示"已复制"，2秒后恢复
   */
  const handleCopy = async () => {
    try {
      await copyToClipboard(message.content)
      setCopied(true)
      // 2秒后恢复按钮状态
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  /**
   * 语音朗读/停止朗读
   *
   * 功能说明:
   * - 使用文本转语音（TTS）朗读消息内容
   * - 支持暂停/继续朗读
   *
   * 跨平台兼容性:
   * - iOS: 使用原生 AVSpeechSynthesizer
   * - Android: 使用原生 TextToSpeech
   * - Web: 使用 Web Speech API (SpeechSynthesis)
   *
   * 特性:
   * - 自动检测设备 TTS 能力
   * - 支持多语言（根据内容自动检测）
   * - 可配置语速、音调、音量
   */
  const handleSpeak = async () => {
    // 检查设备是否支持语音合成
    const capabilities = voiceService.getCapabilities()
    if (!capabilities.speechSynthesis) return

    if (speaking) {
      // 停止朗读
      voiceService.stopSpeaking()
      setSpeaking(false)
    } else {
      // 开始朗读
      try {
        setSpeaking(true)
        await voiceService.speak(message.content)
        setSpeaking(false)  // 朗读完成后重置状态
      } catch (error) {
        console.error('Speech error:', error)
        setSpeaking(false)  // 错误时也要重置状态
      }
    }
  }

  // ============================================
  // 副作用: 自动朗读 AI 回复
  // ============================================

  /**
   * 自动朗读最后一条 AI 消息
   *
   * 触发条件:
   * 1. 用户启用了自动朗读功能
   * 2. 是 AI 消息（非用户、非系统消息）
   * 3. 是最后一条消息
   * 4. 有内容且不是流式加载中
   *
   * 延迟 500ms 以确保消息完全渲染后再朗读
   */
  React.useEffect(() => {
    const settings = voiceService.getSettings()

    // 检查是否满足自动朗读条件
    if (settings.autoSpeak && !isUser && !isSystem && isLast && message.content && !message.isStreaming) {
      // 延迟朗读，确保消息已完全渲染
      const timer = setTimeout(async () => {
        try {
          await voiceService.speak(message.content)
        } catch (error) {
          console.error('Auto-speak error:', error)
        }
      }, 500)

      // 清理函数：组件卸载时取消定时器
      return () => clearTimeout(timer)
    }
  }, [message.content, message.isStreaming, isLast, isUser, isSystem, voiceService])

  // ============================================
  // 系统消息渲染
  // 系统消息显示为居中的小徽章
  // ============================================
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <Badge variant="secondary" className="text-xs">
          {message.content}
        </Badge>
      </div>
    )
  }

  // ============================================
  // 组件渲染: 主消息卡片
  // ============================================

  return (
    <div className={cn(
      'group flex gap-4 transition-all duration-300',
      // 用户消息靠右，AI 消息靠左
      isUser ? 'flex-row-reverse' : 'flex-row',
      // 悬停效果（仅桌面端）
      'hover:bg-gray-50/50 dark:hover:bg-gray-800/30 rounded-2xl p-4 -m-4'
    )}>
      {/* ============================================
          头像
          用户: 蓝色渐变 + 用户图标
          AI: 紫色渐变 + 芯片图标
          ============================================ */}
      {/* Avatar */}
      <div className={cn(
        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
        isUser
          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
          : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
      )}>
        {isUser ? (
          <UserIcon className="h-5 w-5" />
        ) : (
          <CpuChipIcon className="h-5 w-5" />
        )}
      </div>

      {/* Content */}
      <div className={cn(
        'flex-1 min-w-0',
        isUser ? 'text-right' : 'text-left'
      )}>
        {/* Header */}
        <div className={cn(
          'flex items-center gap-2 mb-2',
          isUser ? 'justify-end' : 'justify-start'
        )}>
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
        <div className={cn(
          'relative p-4 rounded-2xl shadow-sm border',
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-200 dark:border-blue-700'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700'
        )}>
          {message.isStreaming && (
            <div className="absolute top-2 right-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500 dark:text-gray-400">生成中...</span>
              </div>
            </div>
          )}

          <div className={cn(
            'text-sm leading-relaxed',
            isUser && 'text-white'
          )}>
            {renderContent()}
          </div>

          {/* Token info */}
          {message.tokens && !isUser && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              Token使用量: {message.tokens}
            </div>
          )}

          {/* Live Comments Integration */}
          {collaborationEnabled && (
            <LiveComments
              messageId={message.id}
              enabled={collaborationEnabled}
              className="absolute inset-0"
            />
          )}
        </div>

        {/* Actions */}
        <div className={cn(
          'flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          isUser ? 'justify-end' : 'justify-start'
        )}>
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

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 px-3 text-xs"
          >
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
        </div>
      </div>
    </div>
  )
}

export default ChatMessage
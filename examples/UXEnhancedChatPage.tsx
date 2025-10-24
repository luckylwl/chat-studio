/**
 * UX 增强聊天页面示例
 * 展示如何集成所有新增的 UX 功能
 */

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

// 可访问性组件
import { announceToScreenReader } from '@/components/ScreenReaderAnnouncer'
import AccessibilitySettings from '@/components/AccessibilitySettings'

// 移动端组件
import MobileGestureHandler from '@/components/MobileGestureHandler'
import MobileActionSheet, { ActionSheetSection } from '@/components/MobileActionSheet'
import PullToRefresh from '@/components/PullToRefresh'

// 智能化组件
import AISmartSuggestions from '@/components/AISmartSuggestions'
import SmartCommandRecommender from '@/components/SmartCommandRecommender'

// 协作组件
import RealtimeCollaboration from '@/components/RealtimeCollaboration'

// 性能组件
import ProgressiveLoader from '@/components/ProgressiveLoader'

// 服务
import userBehaviorLearning from '@/services/userBehaviorLearning'
import offlineManager from '@/services/offlineManager'

// 类型定义
interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
}

/**
 * UX 增强的聊天页面组件
 */
const UXEnhancedChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()

  // 状态管理
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showA11ySettings, setShowA11ySettings] = useState(false)
  const [showActionSheet, setShowActionSheet] = useState(false)
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)

  // 当前用户信息 (用于协作)
  const currentUser = {
    id: 'user-123',
    name: '张三',
    avatar: '/avatars/user-123.jpg',
    color: '#3b82f6',
    status: 'active' as const,
  }

  // 命令定义 (用于智能推荐)
  const commands = [
    {
      id: 'code',
      name: '/code',
      description: '生成代码',
      icon: '💻',
      category: '开发',
      keywords: ['code', 'generate', 'program'],
    },
    {
      id: 'translate',
      name: '/translate',
      description: '翻译文本',
      icon: '🌐',
      category: '工具',
      keywords: ['translate', 'language'],
    },
    {
      id: 'explain',
      name: '/explain',
      description: '解释概念',
      icon: '📖',
      category: '学习',
      keywords: ['explain', 'teach', 'learn'],
    },
    {
      id: 'summarize',
      name: '/summarize',
      description: '总结内容',
      icon: '📝',
      category: '工具',
      keywords: ['summarize', 'summary', 'brief'],
    },
  ]

  // 加载对话数据
  useEffect(() => {
    loadConversation()
  }, [conversationId])

  const loadConversation = async () => {
    if (!conversationId) return

    setIsLoading(true)
    try {
      // 尝试从离线存储加载
      let conv = await offlineManager.getConversation(conversationId)

      // 如果离线没有,从 API 加载
      if (!conv && navigator.onLine) {
        const response = await fetch(`/api/conversations/${conversationId}`)
        conv = await response.json()

        // 保存到离线存储
        await offlineManager.saveConversation({
          ...conv,
          syncStatus: 'synced',
        })
      }

      setConversation(conv || null)

      // 记录用户行为
      userBehaviorLearning.recordAction('conversation_opened', {
        conversationId,
        messageCount: conv?.messages.length || 0,
      })
    } catch (error) {
      console.error('Failed to load conversation:', error)
      announceToScreenReader('加载对话失败', 'assertive')
    } finally {
      setIsLoading(false)
    }
  }

  // 刷新对话
  const handleRefresh = async () => {
    announceToScreenReader('刷新中...', 'polite')
    await loadConversation()
    announceToScreenReader('刷新完成', 'polite')
  }

  // 发送消息
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !conversationId) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now(),
    }

    // 乐观更新
    setConversation((prev) => ({
      ...prev!,
      messages: [...(prev?.messages || []), newMessage],
    }))

    setInput('')

    // 记录用户行为
    userBehaviorLearning.recordAction('message_sent', {
      conversationId,
      length: message.length,
      hasCommand: message.startsWith('/'),
    })

    try {
      if (navigator.onLine) {
        // 在线发送
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            content: message,
          }),
        })

        const aiMessage = await response.json()

        setConversation((prev) => ({
          ...prev!,
          messages: [...prev!.messages, aiMessage],
        }))

        announceToScreenReader('收到回复', 'polite')
      } else {
        // 离线,加入队列
        await offlineManager.addPendingAction('send_message', {
          conversationId,
          message,
        })

        announceToScreenReader('消息已加入离线队列', 'polite')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      announceToScreenReader('发送失败', 'assertive')
    }
  }

  // 消息操作菜单
  const getMessageActionSections = (messageId: string): ActionSheetSection[] => {
    const message = conversation?.messages.find((m) => m.id === messageId)

    return [
      {
        id: 'actions',
        title: '操作',
        items: [
          {
            id: 'copy',
            label: '复制',
            onClick: () => {
              navigator.clipboard.writeText(message?.content || '')
              announceToScreenReader('已复制', 'polite')
            },
          },
          {
            id: 'edit',
            label: '编辑',
            onClick: () => {
              setInput(message?.content || '')
              setShowActionSheet(false)
            },
            disabled: message?.role !== 'user',
          },
          {
            id: 'regenerate',
            label: '重新生成',
            onClick: () => {
              // 重新生成 AI 回复
              setShowActionSheet(false)
            },
            disabled: message?.role !== 'assistant',
          },
        ],
      },
      {
        id: 'danger',
        items: [
          {
            id: 'delete',
            label: '删除',
            onClick: () => {
              setConversation((prev) => ({
                ...prev!,
                messages: prev!.messages.filter((m) => m.id !== messageId),
              }))
              setShowActionSheet(false)
              announceToScreenReader('已删除', 'polite')
            },
            variant: 'destructive',
          },
        ],
      },
    ]
  }

  // 渲染消息列表
  const renderMessage = (message: Message, index: number) => (
    <div
      key={message.id}
      id={`message-${message.id}`}
      className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
    >
      <div
        className={`inline-block max-w-[80%] p-4 rounded-lg ${
          message.role === 'user'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}
      >
        {message.content}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen">
      {/* 实时协作指示器 */}
      <RealtimeCollaboration
        conversationId={conversationId || ''}
        currentUser={currentUser}
        websocketUrl={`wss://api.example.com/collab/${conversationId}`}
        enabled={!!conversationId}
      />

      {/* 头部 */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          aria-label="返回"
        >
          ← 返回
        </button>

        <h1 className="text-xl font-bold">
          {conversation?.title || '对话'}
        </h1>

        <button
          onClick={() => setShowA11ySettings(true)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          aria-label="无障碍设置"
        >
          ⚙️
        </button>
      </header>

      {/* 消息列表 */}
      <main
        id="chat-messages"
        className="flex-1 overflow-hidden"
      >
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="p-4">
            {isLoading ? (
              <div className="text-center py-8">加载中...</div>
            ) : conversation?.messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                开始对话吧!
              </div>
            ) : (
              <MobileGestureHandler
                callbacks={{
                  onLongPress: (x, y) => {
                    // 长按消息显示菜单
                    const element = document.elementFromPoint(x, y)
                    const messageElement = element?.closest('[id^="message-"]')
                    if (messageElement) {
                      const messageId = messageElement.id.replace('message-', '')
                      setSelectedMessageId(messageId)
                      setShowActionSheet(true)
                    }
                  },
                }}
              >
                {conversation?.messages.map(renderMessage)}
              </MobileGestureHandler>
            )}
          </div>
        </PullToRefresh>
      </main>

      {/* 输入区域 */}
      <footer className="border-t border-gray-200 dark:border-gray-700 p-4">
        {/* AI 智能建议 */}
        {input && (
          <div className="mb-2">
            <AISmartSuggestions
              context={{
                currentInput: input,
                conversationHistory: conversation?.messages.map((m) => ({
                  role: m.role,
                  content: m.content,
                })) || [],
                recentTopics: ['React', 'TypeScript', 'UX'],
              }}
              onSuggestionSelect={(suggestion) => {
                setInput(suggestion.text)
                userBehaviorLearning.recordAction('suggestion_accepted', {
                  type: suggestion.type,
                })
              }}
              maxSuggestions={3}
              learningEnabled={true}
            />
          </div>
        )}

        {/* 命令推荐 */}
        {input.startsWith('/') && (
          <div className="mb-2">
            <SmartCommandRecommender
              commands={commands}
              onCommandSelect={(command) => {
                setInput(command.name + ' ')
                userBehaviorLearning.recordAction('command_executed', {
                  command: command.name,
                })
              }}
              currentContext={input}
              maxRecommendations={5}
              learningEnabled={true}
            />
          </div>
        )}

        {/* 输入框 */}
        <div className="flex gap-2">
          <textarea
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage(input)
              }
            }}
            placeholder="输入消息... (Shift+Enter 换行)"
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={2}
            aria-label="消息输入框"
          />

          <button
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="发送消息"
          >
            发送
          </button>
        </div>
      </footer>

      {/* 无障碍设置面板 */}
      <AccessibilitySettings
        isOpen={showA11ySettings}
        onClose={() => setShowA11ySettings(false)}
        onConfigChange={(config) => {
          console.log('Accessibility config updated:', config)
        }}
      />

      {/* 移动端操作菜单 */}
      {selectedMessageId && (
        <MobileActionSheet
          isOpen={showActionSheet}
          onClose={() => {
            setShowActionSheet(false)
            setSelectedMessageId(null)
          }}
          sections={getMessageActionSections(selectedMessageId)}
          title="消息操作"
        />
      )}
    </div>
  )
}

export default UXEnhancedChatPage

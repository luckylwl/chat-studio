import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SparklesIcon, ArrowUpIcon, CpuChipIcon, ArrowsRightLeftIcon, UsersIcon } from '@heroicons/react/24/outline'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui'
import ChatMessage from '@/components/ChatMessage'
import ChatInput from '@/components/ChatInput'
import EmptyState from '@/components/EmptyState'
import OnboardingFlow from '@/components/OnboardingFlow'
import AIAssistantSystem from '@/components/AIAssistantSystem'
import SmartSuggestionPanel from '@/components/SmartSuggestionPanel'
import VoiceControl from '@/components/VoiceControl'
import ConversationTemplates from '@/components/ConversationTemplates'
import DragDropUpload from '@/components/DragDropUpload'
import ModelSelector from '@/components/ModelSelector'
import ModelComparison from '@/components/ModelComparison'
import SmartModelSwitcher from '@/components/SmartModelSwitcher'
import CollaborationPanel from '@/components/CollaborationPanel'
import LiveCursors from '@/components/LiveCursors'
import LiveComments from '@/components/LiveComments'
import TypingIndicators from '@/components/TypingIndicators'
import RealTimeAnalyticsMonitor from '@/components/RealTimeAnalyticsMonitor'
import { SmartSuggestion } from '@/services/smartSuggestionService'
import { ConversationTemplate } from '@/services/templateService'
import { modelManagementService } from '@/services/modelManagementService'
import { useErrorReporting } from '@/hooks/useErrorReporting'
import { cn } from '@/utils'

const ChatPage: React.FC = () => {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showSuggestionPanel, setShowSuggestionPanel] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showModelComparison, setShowModelComparison] = useState(false)
  const [showCollaboration, setShowCollaboration] = useState(false)
  const [currentModel, setCurrentModel] = useState('gpt-4o')
  const [modelSwitchContext, setModelSwitchContext] = useState<any>({})
  const [collaborationEnabled, setCollaborationEnabled] = useState(false)
  const [analyticsMonitorVisible, setAnalyticsMonitorVisible] = useState(true)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const { trackUserAction } = useErrorReporting()

  const {
    conversations,
    currentConversationId,
    setCurrentConversation,
    createConversation,
    apiProviders,
    user,
    addMessage
  } = useAppStore()

  // 检查是否需要显示引导流程
  const hasConfiguredModels = apiProviders.some(provider =>
    provider.isEnabled && provider.apiKey && provider.models.length > 0
  )

  const isFirstTimeUser = !hasConfiguredModels && conversations.length === 0

  const currentConversation = conversations.find(c => c.id === currentConversationId)

  useEffect(() => {
    // 首次使用检查
    if (isFirstTimeUser) {
      setShowOnboarding(true)
      return
    }

    if (conversationId) {
      const conversation = conversations.find(c => c.id === conversationId)
      if (conversation) {
        setCurrentConversation(conversationId)
      } else {
        navigate('/chat')
      }
    } else if (conversations.length === 0 && hasConfiguredModels) {
      const id = createConversation('新建对话')
      navigate(`/chat/${id}`)
    } else if (!currentConversationId && conversations.length > 0) {
      setCurrentConversation(conversations[0].id)
      navigate(`/chat/${conversations[0].id}`)
    }
  }, [conversationId, conversations, currentConversationId, setCurrentConversation, createConversation, navigate, isFirstTimeUser, hasConfiguredModels])

  // 检查用户是否需要配置模型
  useEffect(() => {
    if (!hasConfiguredModels && !isFirstTimeUser) {
      // 用户有对话历史但没有配置模型，可能是配置丢失
      console.log('User needs to reconfigure models')
    }
  }, [hasConfiguredModels, isFirstTimeUser])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages])

  // 监听滚动事件，显示/隐藏回到顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
        // 当滚动超过一屏高度时显示回到顶部按钮
        setShowScrollToTop(scrollTop > clientHeight)
      }
    }

    const container = chatContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [currentConversation])

  const scrollToTop = () => {
    chatContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + S: 打开智能建议面板
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault()
        setShowSuggestionPanel(true)
      }
      // Ctrl/Cmd + Shift + T: 打开模板面板
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault()
        setShowTemplates(true)
      }
      // Ctrl/Cmd + Shift + M: 打开模型选择器
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'M') {
        event.preventDefault()
        setShowModelSelector(true)
      }
      // Ctrl/Cmd + Shift + C: 打开模型比较
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault()
        setShowModelComparison(true)
      }
      // Ctrl/Cmd + Shift + L: 打开协作面板
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'L') {
        event.preventDefault()
        setShowCollaboration(true)
      }
      // Ctrl/Cmd + Shift + R: 切换实时分析监控
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault()
        setAnalyticsMonitorVisible(!analyticsMonitorVisible)
      }
      // Escape: 关闭弹窗
      if (event.key === 'Escape') {
        if (showSuggestionPanel) setShowSuggestionPanel(false)
        else if (showTemplates) setShowTemplates(false)
        else if (showModelSelector) setShowModelSelector(false)
        else if (showModelComparison) setShowModelComparison(false)
        else if (showCollaboration) setShowCollaboration(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showSuggestionPanel, showTemplates, showModelSelector, showModelComparison, showCollaboration, analyticsMonitorVisible])

  // 初始化模型管理服务和性能跟踪
  useEffect(() => {
    // 初始化模型管理服务
    modelManagementService

    // 获取推荐的默认模型
    const recommendations = modelManagementService.getModelRecommendations({
      taskType: 'general',
      prioritizeQuality: true
    })

    if (recommendations.length > 0) {
      setCurrentModel(recommendations[0].modelId)
    }

    // 跟踪页面加载
    trackUserAction('chat_page_loaded', {
      conversationId: currentConversationId,
      hasConversations: conversations.length > 0
    })
  }, [])

  // 更新模型切换上下文
  useEffect(() => {
    if (currentConversation) {
      const context = {
        messageCount: currentConversation.messages.length,
        lastMessageTime: currentConversation.messages[currentConversation.messages.length - 1]?.timestamp,
        conversationType: currentConversation.messages.some(m => m.content.includes('代码') || m.content.includes('code')) ? 'coding' : 'general'
      }
      setModelSwitchContext(context)
    }
  }, [currentConversation])

  // 处理智能建议选择
  const handleSuggestionSelect = (suggestion: SmartSuggestion) => {
    if (currentConversationId) {
      addMessage(currentConversationId, {
        role: 'user',
        content: suggestion.content
      })
    }
  }

  // 处理模板选择
  const handleTemplateSelect = (template: ConversationTemplate) => {
    // 创建新对话或使用当前对话
    let conversationId = currentConversationId

    if (!conversationId || (currentConversation?.messages.length ?? 0) > 0) {
      conversationId = createConversation(template.name)
      setCurrentConversation(conversationId)
      navigate(`/chat/${conversationId}`)
    }

    // 如果有系统提示词，先添加系统消息
    if (template.systemPrompt) {
      addMessage(conversationId, {
        role: 'system',
        content: template.systemPrompt
      })
    }

    // 添加模板提示词作为用户消息
    if (template.prompt) {
      addMessage(conversationId, {
        role: 'user',
        content: template.prompt
      })
    }
  }

  // 处理模型选择
  const handleModelSelect = (modelId: string) => {
    setCurrentModel(modelId)

    // 记录性能数据
    modelManagementService.recordModelUsage(modelId, {
      responseTime: 0, // 初始值，实际响应时会更新
      tokenCount: 0,
      cost: 0,
      success: true
    })

    trackUserAction('model_switched', {
      from: currentModel,
      to: modelId,
      conversationId: currentConversationId,
      manual: true
    })

    setShowModelSelector(false)
  }

  // 处理自动模型切换
  const handleAutoModelSwitch = (modelId: string) => {
    setCurrentModel(modelId)

    trackUserAction('model_auto_switched', {
      from: currentModel,
      to: modelId,
      conversationId: currentConversationId,
      context: modelSwitchContext
    })
  }

  // 显示引导流程
  if (showOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setShowOnboarding(false)
          // 创建首个对话
          const id = createConversation('新建对话')
          navigate(`/chat/${id}`)
        }}
      />
    )
  }

  // 没有配置模型的状态
  if (!hasConfiguredModels) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <EmptyState
          type="configuration-needed"
          title="需要配置AI模型"
          description="您还没有配置任何AI模型。请先添加API提供商和模型配置，然后就可以开始对话了。"
          actionText="前往设置配置"
          onAction={() => navigate('/settings?tab=models')}
          secondaryAction={{
            text: '引导设置',
            onClick: () => setShowOnboarding(true)
          }}
        />
      </div>
    )
  }

  // 加载状态
  if (!currentConversation && conversations.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">准备对话环境...</p>
        </div>
      </div>
    )
  }

  // 没有当前对话但有配置
  if (!currentConversation && hasConfiguredModels) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <EmptyState
          type="no-conversations"
          title="开始新的对话"
          description="您还没有任何对话记录。点击下方按钮创建您的第一个对话，开始与AI助手交流吧！"
          actionText="创建新对话"
          onAction={() => {
            const id = createConversation('新建对话')
            navigate(`/chat/${id}`)
          }}
        />
      </div>
    )
  }

  const isEmpty = currentConversation?.messages.length === 0

  // 处理文件拖放
  const handleFilesDrop = (files: File[]) => {
    console.log('Files dropped:', files)
    // 这里可以集成文件处理逻辑
  }

  return (
    <DragDropUpload
      onFilesDrop={handleFilesDrop}
      overlay
      className="h-full"
    >
      <div className="h-full flex flex-col">
      {/* Messages area */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto relative">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="max-w-2xl text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                开始新的对话
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed">
                欢迎来到 AI Chat Studio！在下方输入您的问题，我将竭诚为您提供帮助。
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto">
                {[
                  {
                    icon: '💡',
                    title: '获取创意灵感',
                    description: '生成创新想法和解决方案'
                  },
                  {
                    icon: '📝',
                    title: '文本编写',
                    description: '帮助撰写各类文档和内容'
                  },
                  {
                    icon: '🔍',
                    title: '问题解答',
                    description: '解答疑问并提供详细说明'
                  },
                  {
                    icon: '💻',
                    title: '代码协助',
                    description: '编程指导和代码优化'
                  }
                ].map((item, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* 模板快捷按钮 */}
              <div className="mt-8">
                <Button
                  onClick={() => setShowTemplates(true)}
                  variant="outline"
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-blue-600 text-white border-0 hover:from-purple-600 hover:to-blue-700"
                >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  浏览对话模板
                </Button>
              </div>

              {/* AI Assistant System */}
              <div className="mt-12 max-w-4xl mx-auto">
                <AIAssistantSystem />
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto py-6 px-4">
            <div className="space-y-6">
              {currentConversation?.messages.map((message, index) => (
                <div
                  key={message.id}
                  className="animate-in slide-in-from-bottom-4 fade-in duration-500"
                  style={{ animationDelay: `${Math.min(index * 100, 500)}ms` }}
                >
                  <ChatMessage
                    message={message}
                    isLast={index === (currentConversation?.messages.length ?? 0) - 1}
                    collaborationEnabled={collaborationEnabled}
                  />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto p-4">
          <ChatInput />
        </div>
      </div>

      {/* 优化后的浮动按钮组 - 避免与输入框重叠 */}
      {currentConversation && !isEmpty && (
        <div className="fixed bottom-28 right-4 z-30 flex flex-col-reverse gap-2 sm:gap-3">
          {/* 智能建议浮动按钮 */}
          <button
            onClick={() => setShowSuggestionPanel(true)}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center group"
            title="智能建议 (Ctrl+Shift+S)"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <span className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              智能建议
            </span>
          </button>

          {/* 模型选择器浮动按钮 */}
          <button
            onClick={() => setShowModelSelector(true)}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center group"
            title="AI模型选择器 (Ctrl+Shift+M)"
          >
            <CpuChipIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              模型选择
            </span>
          </button>

          {/* 模型比较浮动按钮 */}
          <button
            onClick={() => setShowModelComparison(true)}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center group"
            title="模型对比分析 (Ctrl+Shift+C)"
          >
            <ArrowsRightLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              模型对比
            </span>
          </button>

          {/* 协作浮动按钮 */}
          <button
            onClick={() => setShowCollaboration(true)}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center group"
            title="实时协作 (Ctrl+Shift+L)"
          >
            <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              实时协作
            </span>
          </button>

          {/* 模板浮动按钮 */}
          <button
            onClick={() => setShowTemplates(true)}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center group"
            title="对话模板 (Ctrl+Shift+T)"
          >
            <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              对话模板
            </span>
          </button>

          {/* 回到顶部按钮 */}
          {showScrollToTop && (
            <button
              onClick={scrollToTop}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center group"
              title="回到顶部"
            >
              <ArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                回到顶部
              </span>
            </button>
          )}
        </div>
      )}

      {/* 语音控制 - 移到输入框内 */}
      <div className="fixed bottom-4 left-4 z-30">
        <VoiceControl
          onTranscript={(text) => {
            if (currentConversationId) {
              addMessage(currentConversationId, {
                role: 'user',
                content: text
              })
            }
          }}
          onVoiceCommand={(command) => {
            // Handle global voice commands
            if (command === '新建对话') {
              const id = createConversation('新建对话')
              navigate(`/chat/${id}`)
            } else if (command === '打开设置') {
              navigate('/settings')
            } else if (command === '搜索对话') {
              // Could open search functionality
            }
          }}
        />
      </div>

      {/* 智能建议面板 */}
      <SmartSuggestionPanel
        isOpen={showSuggestionPanel}
        onClose={() => setShowSuggestionPanel(false)}
        onSuggestionSelect={handleSuggestionSelect}
      />

      {/* 对话模板面板 */}
      <ConversationTemplates
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onTemplateSelect={handleTemplateSelect}
      />

      {/* AI 模型选择器 */}
      <ModelSelector
        isOpen={showModelSelector}
        onClose={() => setShowModelSelector(false)}
        selectedModel={currentModel}
        onModelChange={handleModelSelect}
        conversationContext={{
          messageCount: currentConversation?.messages.length || 0,
          taskType: modelSwitchContext.conversationType || 'general',
          priority: 'quality'
        }}
        showRecommendations={true}
      />

      {/* 模型对比工具 */}
      <ModelComparison
        isOpen={showModelComparison}
        onClose={() => setShowModelComparison(false)}
        initialModels={[currentModel]}
        onModelSelect={handleModelSelect}
      />

      {/* 智能模型切换器 */}
      <SmartModelSwitcher
        currentModel={currentModel}
        onModelChange={handleAutoModelSwitch}
        conversationContext={{
          messageCount: currentConversation?.messages.length || 0,
          averageLatency: 1200, // 这里可以从实际数据获取
          errorCount: 0, // 从错误跟踪获取
          taskType: modelSwitchContext.conversationType || 'general',
          userFeedback: undefined // 可以添加用户反馈机制
        }}
        autoSuggest={true}
        position="bottom-right"
      />

      {/* 协作面板 */}
      <CollaborationPanel
        isOpen={showCollaboration}
        onClose={() => setShowCollaboration(false)}
        conversationId={currentConversationId || ''}
      />

      {/* 实时协作功能 */}
      {collaborationEnabled && (
        <>
          {/* 实时光标 */}
          <LiveCursors enabled={collaborationEnabled} />

          {/* 输入指示器 */}
          <div className="fixed bottom-20 left-4 z-30">
            <TypingIndicators enabled={collaborationEnabled} />
          </div>
        </>
      )}

      {/* 实时分析监控 */}
      <RealTimeAnalyticsMonitor
        isVisible={analyticsMonitorVisible}
        position="bottom-right"
        onToggleVisibility={() => setAnalyticsMonitorVisible(!analyticsMonitorVisible)}
        compact={false}
      />

      </div>
    </DragDropUpload>
  )
}

export default ChatPage
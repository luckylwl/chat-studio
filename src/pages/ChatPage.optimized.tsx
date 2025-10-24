import React, { useEffect, useRef, useState, useMemo, useCallback, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { SparklesIcon, ArrowUpIcon, CpuChipIcon, ArrowsRightLeftIcon, UsersIcon } from '@heroicons/react/24/outline'
import { useAppStore } from '@/store'
import { Button } from '@/components/ui'
import ChatMessage from '@/components/ChatMessage'
import ChatInput from '@/components/ChatInput'
import EmptyState from '@/components/EmptyState'
import OnboardingFlow from '@/components/OnboardingFlow'
import DragDropUpload from '@/components/DragDropUpload'
import { modelManagementService } from '@/services/modelManagementService'
import { useErrorReporting } from '@/hooks/useErrorReporting'

// 懒加载非关键组件
const AIAssistantSystem = lazy(() => import('@/components/AIAssistantSystem'))
const SmartSuggestionPanel = lazy(() => import('@/components/SmartSuggestionPanel'))
const VoiceControl = lazy(() => import('@/components/VoiceControl'))
const ConversationTemplates = lazy(() => import('@/components/ConversationTemplates'))
const ModelSelector = lazy(() => import('@/components/ModelSelector'))
const ModelComparison = lazy(() => import('@/components/ModelComparison'))
const SmartModelSwitcher = lazy(() => import('@/components/SmartModelSwitcher'))
const CollaborationPanel = lazy(() => import('@/components/CollaborationPanel'))
const LiveCursors = lazy(() => import('@/components/LiveCursors'))
const TypingIndicators = lazy(() => import('@/components/TypingIndicators'))
const RealTimeAnalyticsMonitor = lazy(() => import('@/components/RealTimeAnalyticsMonitor'))

// 加载组件
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
)

const ChatPage: React.FC = () => {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // UI 状态
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

  const { trackUserAction } = useErrorReporting()

  // Store 选择器优化 - 使用 shallow 比较
  const {
    conversations,
    currentConversationId,
    setCurrentConversation,
    createConversation,
    apiProviders,
    addMessage
  } = useAppStore()

  // 使用 useMemo 缓存计算
  const hasConfiguredModels = useMemo(() =>
    apiProviders.some(provider =>
      provider.isEnabled && provider.apiKey && provider.models.length > 0
    ),
    [apiProviders]
  )

  const isFirstTimeUser = useMemo(() =>
    !hasConfiguredModels && conversations.length === 0,
    [hasConfiguredModels, conversations.length]
  )

  const currentConversation = useMemo(() =>
    conversations.find(c => c.id === currentConversationId),
    [conversations, currentConversationId]
  )

  const isEmpty = useMemo(() =>
    currentConversation?.messages.length === 0,
    [currentConversation?.messages.length]
  )

  // 使用 useCallback 缓存事件处理函数
  const scrollToTop = useCallback(() => {
    chatContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }, [])

  const handleFilesDrop = useCallback((files: File[]) => {
    console.log('Files dropped:', files)
  }, [])

  const handleSuggestionSelect = useCallback((suggestion: any) => {
    if (currentConversationId) {
      addMessage(currentConversationId, {
        role: 'user',
        content: suggestion.content
      })
    }
  }, [currentConversationId, addMessage])

  const handleTemplateSelect = useCallback((template: any) => {
    let conversationId = currentConversationId

    if (!conversationId || (currentConversation?.messages.length ?? 0) > 0) {
      conversationId = createConversation(template.name)
      setCurrentConversation(conversationId)
      navigate(`/chat/${conversationId}`)
    }

    if (template.systemPrompt) {
      addMessage(conversationId, {
        role: 'system',
        content: template.systemPrompt
      })
    }

    if (template.prompt) {
      addMessage(conversationId, {
        role: 'user',
        content: template.prompt
      })
    }
  }, [currentConversationId, currentConversation?.messages.length, createConversation, setCurrentConversation, navigate, addMessage])

  const handleModelSelect = useCallback((modelId: string) => {
    setCurrentModel(modelId)

    modelManagementService.recordModelUsage(modelId, {
      responseTime: 0,
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
  }, [currentModel, currentConversationId, trackUserAction])

  const handleAutoModelSwitch = useCallback((modelId: string) => {
    setCurrentModel(modelId)
    trackUserAction('model_auto_switched', {
      from: currentModel,
      to: modelId,
      conversationId: currentConversationId,
      context: modelSwitchContext
    })
  }, [currentModel, currentConversationId, modelSwitchContext, trackUserAction])

  // 首次使用检查
  useEffect(() => {
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

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentConversation?.messages])

  // 滚动事件监听
  useEffect(() => {
    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, clientHeight } = chatContainerRef.current
        setShowScrollToTop(scrollTop > clientHeight)
      }
    }

    const container = chatContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // 键盘快捷键 - 使用 useCallback 优化
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModKey = event.ctrlKey || event.metaKey
      const isShift = event.shiftKey

      if (!isModKey || !isShift) return

      const keyActions: Record<string, () => void> = {
        'S': () => setShowSuggestionPanel(true),
        'T': () => setShowTemplates(true),
        'M': () => setShowModelSelector(true),
        'C': () => setShowModelComparison(true),
        'L': () => setShowCollaboration(true),
        'R': () => setAnalyticsMonitorVisible(v => !v)
      }

      const action = keyActions[event.key]
      if (action) {
        event.preventDefault()
        action()
      }

      if (event.key === 'Escape') {
        setShowSuggestionPanel(false)
        setShowTemplates(false)
        setShowModelSelector(false)
        setShowModelComparison(false)
        setShowCollaboration(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 初始化
  useEffect(() => {
    const recommendations = modelManagementService.getModelRecommendations({
      taskType: 'general',
      prioritizeQuality: true
    })

    if (recommendations.length > 0) {
      setCurrentModel(recommendations[0].modelId)
    }

    trackUserAction('chat_page_loaded', {
      conversationId: currentConversationId,
      hasConversations: conversations.length > 0
    })
  }, [])

  // 显示引导流程
  if (showOnboarding) {
    return (
      <OnboardingFlow
        onComplete={() => {
          setShowOnboarding(false)
          const id = createConversation('新建对话')
          navigate(`/chat/${id}`)
        }}
      />
    )
  }

  // 没有配置模型
  if (!hasConfiguredModels) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <EmptyState
          type="configuration-needed"
          title="需要配置AI模型"
          description="您还没有配置任何AI模型。请先添加API提供商和模型配置,然后就可以开始对话了。"
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

  // 没有当前对话
  if (!currentConversation && hasConfiguredModels) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <EmptyState
          type="no-conversations"
          title="开始新的对话"
          description="您还没有任何对话记录。点击下方按钮创建您的第一个对话,开始与AI助手交流吧!"
          actionText="创建新对话"
          onAction={() => {
            const id = createConversation('新建对话')
            navigate(`/chat/${id}`)
          }}
        />
      </div>
    )
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
            <Suspense fallback={<LoadingFallback />}>
              <EmptyStateContent onOpenTemplates={() => setShowTemplates(true)} />
            </Suspense>
          ) : (
            <div className="max-w-4xl mx-auto py-6 px-4">
              <div className="space-y-6">
                {currentConversation?.messages.map((message, index) => (
                  <MemoizedChatMessage
                    key={message.id}
                    message={message}
                    isLast={index === (currentConversation?.messages.length ?? 0) - 1}
                    collaborationEnabled={collaborationEnabled}
                    index={index}
                  />
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

        {/* Floating buttons */}
        {currentConversation && !isEmpty && (
          <FloatingButtons
            onOpenSuggestions={() => setShowSuggestionPanel(true)}
            onOpenModelSelector={() => setShowModelSelector(true)}
            onOpenModelComparison={() => setShowModelComparison(true)}
            onOpenCollaboration={() => setShowCollaboration(true)}
            onOpenTemplates={() => setShowTemplates(true)}
            onScrollToTop={scrollToTop}
            showScrollToTop={showScrollToTop}
          />
        )}

        {/* Voice Control */}
        <Suspense fallback={null}>
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
                if (command === '新建对话') {
                  const id = createConversation('新建对话')
                  navigate(`/chat/${id}`)
                } else if (command === '打开设置') {
                  navigate('/settings')
                }
              }}
            />
          </div>
        </Suspense>

        {/* Lazy loaded panels */}
        <Suspense fallback={null}>
          {showSuggestionPanel && (
            <SmartSuggestionPanel
              isOpen={showSuggestionPanel}
              onClose={() => setShowSuggestionPanel(false)}
              onSuggestionSelect={handleSuggestionSelect}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          {showTemplates && (
            <ConversationTemplates
              isOpen={showTemplates}
              onClose={() => setShowTemplates(false)}
              onTemplateSelect={handleTemplateSelect}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          {showModelSelector && (
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
          )}
        </Suspense>

        <Suspense fallback={null}>
          {showModelComparison && (
            <ModelComparison
              isOpen={showModelComparison}
              onClose={() => setShowModelComparison(false)}
              initialModels={[currentModel]}
              onModelSelect={handleModelSelect}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          <SmartModelSwitcher
            currentModel={currentModel}
            onModelChange={handleAutoModelSwitch}
            conversationContext={{
              messageCount: currentConversation?.messages.length || 0,
              averageLatency: 1200,
              errorCount: 0,
              taskType: modelSwitchContext.conversationType || 'general',
              userFeedback: undefined
            }}
            autoSuggest={true}
            position="bottom-right"
          />
        </Suspense>

        <Suspense fallback={null}>
          {showCollaboration && (
            <CollaborationPanel
              isOpen={showCollaboration}
              onClose={() => setShowCollaboration(false)}
              conversationId={currentConversationId || ''}
            />
          )}
        </Suspense>

        <Suspense fallback={null}>
          {collaborationEnabled && (
            <>
              <LiveCursors enabled={collaborationEnabled} />
              <div className="fixed bottom-20 left-4 z-30">
                <TypingIndicators enabled={collaborationEnabled} />
              </div>
            </>
          )}
        </Suspense>

        <Suspense fallback={null}>
          <RealTimeAnalyticsMonitor
            isVisible={analyticsMonitorVisible}
            position="bottom-right"
            onToggleVisibility={() => setAnalyticsMonitorVisible(!analyticsMonitorVisible)}
            compact={false}
          />
        </Suspense>
      </div>
    </DragDropUpload>
  )
}

// Memoized components
const MemoizedChatMessage = React.memo(({ message, isLast, collaborationEnabled, index }: any) => (
  <div
    className="animate-in slide-in-from-bottom-4 fade-in duration-500"
    style={{ animationDelay: `${Math.min(index * 100, 500)}ms` }}
  >
    <ChatMessage
      message={message}
      isLast={isLast}
      collaborationEnabled={collaborationEnabled}
    />
  </div>
), (prev, next) => (
  prev.message.id === next.message.id &&
  prev.isLast === next.isLast &&
  prev.collaborationEnabled === next.collaborationEnabled
))

const EmptyStateContent = React.memo(({ onOpenTemplates }: { onOpenTemplates: () => void }) => (
  <div className="h-full flex items-center justify-center p-8">
    <div className="max-w-2xl text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">开始新的对话</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed">
        欢迎来到 AI Chat Studio!在下方输入您的问题,我将竭诚为您提供帮助。
      </p>
      <div className="mt-8">
        <Button onClick={onOpenTemplates} variant="outline" size="lg" className="bg-gradient-to-r from-purple-500 to-blue-600 text-white border-0">
          <SparklesIcon className="w-5 h-5 mr-2" />
          浏览对话模板
        </Button>
      </div>
      <Suspense fallback={<LoadingFallback />}>
        <div className="mt-12 max-w-4xl mx-auto">
          <AIAssistantSystem />
        </div>
      </Suspense>
    </div>
  </div>
))

const FloatingButtons = React.memo(({
  onOpenSuggestions,
  onOpenModelSelector,
  onOpenModelComparison,
  onOpenCollaboration,
  onOpenTemplates,
  onScrollToTop,
  showScrollToTop
}: any) => (
  <div className="fixed bottom-28 right-4 z-30 flex flex-col-reverse gap-2 sm:gap-3">
    <FloatingButton
      onClick={onOpenSuggestions}
      className="from-blue-500 to-blue-600"
      title="智能建议 (Ctrl+Shift+S)"
      icon={
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      }
    />
    <FloatingButton
      onClick={onOpenModelSelector}
      className="from-green-500 to-green-600"
      title="AI模型选择器 (Ctrl+Shift+M)"
      icon={<CpuChipIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
    />
    <FloatingButton
      onClick={onOpenModelComparison}
      className="from-orange-500 to-orange-600"
      title="模型对比分析 (Ctrl+Shift+C)"
      icon={<ArrowsRightLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
    />
    <FloatingButton
      onClick={onOpenCollaboration}
      className="from-pink-500 to-pink-600"
      title="实时协作 (Ctrl+Shift+L)"
      icon={<UsersIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
    />
    <FloatingButton
      onClick={onOpenTemplates}
      className="from-purple-500 to-purple-600"
      title="对话模板 (Ctrl+Shift+T)"
      icon={<SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
    />
    {showScrollToTop && (
      <FloatingButton
        onClick={onScrollToTop}
        className="from-gray-500 to-gray-600"
        title="回到顶部"
        icon={<ArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
      />
    )}
  </div>
))

const FloatingButton = React.memo(({ onClick, className, title, icon }: any) => (
  <button
    onClick={onClick}
    className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${className} text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center group`}
    title={title}
  >
    {icon}
    <span className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      {title.split(' ')[0]}
    </span>
  </button>
))

export default ChatPage

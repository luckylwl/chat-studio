import React from 'react'
import { useResponsive } from '../hooks/useResponsive'
import { MobileLayout } from './MobileLayout'
import { useConversationStore } from '../store/conversationStore'

/**
 * 响应式应用包装组件
 *
 * 功能:
 * - 自动检测设备类型
 * - 移动端使用 MobileLayout
 * - 桌面端使用原有布局
 * - 平滑切换布局
 *
 * @example
 * ```tsx
 * function App() {
 *   return <ResponsiveApp />
 * }
 * ```
 */
export const ResponsiveApp: React.FC = () => {
  const { isMobile } = useResponsive()

  const {
    conversations,
    currentConversation,
    messages,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage
  } = useConversationStore()

  // 移动端布局
  if (isMobile) {
    return (
      <MobileLayout
        conversations={conversations}
        currentConversation={currentConversation}
        messages={messages}
        onSendMessage={sendMessage}
        onCreateConversation={createConversation}
        onSelectConversation={selectConversation}
        onDeleteConversation={deleteConversation}
      />
    )
  }

  // 桌面端布局 - 导入现有的桌面布局组件
  // 假设原有的桌面布局在 App.tsx 中
  return <DesktopLayout />
}

/**
 * 桌面端布局组件
 * 这是原有的桌面布局
 */
const DesktopLayout: React.FC = () => {
  const {
    conversations,
    currentConversation,
    messages,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage
  } = useConversationStore()

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)
  const [input, setInput] = React.useState('')

  const handleSend = () => {
    if (!input.trim()) return
    sendMessage(input)
    setInput('')
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 左侧边栏 */}
      <aside
        className={`
          bg-white border-r border-gray-200 transition-all duration-300
          ${isSidebarCollapsed ? 'w-16' : 'w-80'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* 侧边栏头部 */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            {!isSidebarCollapsed && (
              <h2 className="text-lg font-bold text-gray-900">对话列表</h2>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={isSidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
            >
              {isSidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          {!isSidebarCollapsed && (
            <>
              {/* 新建对话按钮 */}
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={createConversation}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  + 新建对话
                </button>
              </div>

              {/* 对话列表 */}
              <div className="flex-1 overflow-y-auto">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`
                      px-4 py-3 cursor-pointer border-l-4 transition-colors
                      ${
                        conv.id === currentConversation?.id
                          ? 'bg-blue-50 border-blue-500'
                          : 'border-transparent hover:bg-gray-50'
                      }
                    `}
                    onClick={() => selectConversation(conv.id)}
                  >
                    <h3 className="font-medium text-gray-900 truncate">
                      {conv.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {conv.messages?.length || 0} 条消息
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* 主内容区域 */}
      <main className="flex-1 flex flex-col">
        {/* 顶部导航栏 */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">
            {currentConversation?.title || 'AI Chat Studio'}
          </h1>
        </header>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!currentConversation ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">欢迎使用 AI Chat Studio</p>
                <p className="text-sm">选择或创建一个对话开始聊天</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p>开始新的对话</p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message.id || index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`
                      max-w-[70%] px-4 py-3 rounded-lg
                      ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-white border border-gray-200'
                      }
                    `}
                  >
                    <div className="whitespace-pre-wrap break-words">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部输入栏 */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              disabled={!currentConversation}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !currentConversation}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              发送
            </button>
          </div>
        </footer>
      </main>
    </div>
  )
}

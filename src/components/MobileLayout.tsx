import React, { useState } from 'react'
import { Menu, X, Send, Plus, Search, Settings, MoreVertical } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileLayoutProps {
  conversations: any[]
  currentConversation: any
  messages: any[]
  onSendMessage: (content: string) => void
  onCreateConversation: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
}

/**
 * 移动端布局组件
 *
 * 特性:
 * - 响应式设计 (适配 320px - 768px)
 * - 滑动抽屉菜单
 * - 底部输入栏
 * - 手势支持
 * - 移动端优化的 UI
 */
export const MobileLayout: React.FC<MobileLayoutProps> = ({
  conversations,
  currentConversation,
  messages,
  onSendMessage,
  onCreateConversation,
  onSelectConversation,
  onDeleteConversation
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [input, setInput] = useState('')
  const [showConversationMenu, setShowConversationMenu] = useState<string | null>(null)

  // 发送消息
  const handleSend = () => {
    if (!input.trim()) return

    onSendMessage(input)
    setInput('')
  }

  // 打开侧边栏
  const openSidebar = () => {
    setIsSidebarOpen(true)
  }

  // 关闭侧边栏
  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  // 选择对话
  const handleSelectConversation = (id: string) => {
    onSelectConversation(id)
    closeSidebar()
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <button
          onClick={openSidebar}
          className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="打开菜单"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>

        <div className="flex-1 text-center">
          <h1 className="text-base font-semibold text-gray-900 truncate">
            {currentConversation?.title || 'AI Chat Studio'}
          </h1>
          {currentConversation && (
            <p className="text-xs text-gray-500">
              {currentConversation.messages?.length || 0} 条消息
            </p>
          )}
        </div>

        <button
          onClick={() => {/* 打开设置 */}}
          className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="设置"
        >
          <Settings className="w-6 h-6 text-gray-700" />
        </button>
      </header>

      {/* 侧边栏抽屉 */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* 遮罩层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={closeSidebar}
            />

            {/* 侧边栏 */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col"
            >
              {/* 侧边栏头部 */}
              <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">对话列表</h2>
                <button
                  onClick={closeSidebar}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="关闭菜单"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>

              {/* 新建对话按钮 */}
              <div className="px-4 py-3 border-b border-gray-200">
                <button
                  onClick={() => {
                    onCreateConversation()
                    closeSidebar()
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                  新建对话
                </button>
              </div>

              {/* 对话列表 */}
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>还没有对话</p>
                    <p className="text-sm mt-2">点击上方按钮创建新对话</p>
                  </div>
                ) : (
                  <div className="py-2">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`
                          relative px-4 py-3 cursor-pointer transition-colors
                          ${
                            conv.id === currentConversation?.id
                              ? 'bg-blue-50 border-l-4 border-blue-500'
                              : 'hover:bg-gray-50 border-l-4 border-transparent'
                          }
                        `}
                        onClick={() => handleSelectConversation(conv.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {conv.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {conv.messages?.length || 0} 条消息
                            </p>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowConversationMenu(
                                showConversationMenu === conv.id ? null : conv.id
                              )
                            }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>

                        {/* 对话菜单 */}
                        {showConversationMenu === conv.id && (
                          <div className="absolute right-4 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteConversation(conv.id)
                                setShowConversationMenu(null)
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              删除对话
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 侧边栏底部 */}
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500 text-center">
                  AI Chat Studio v2.0
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 消息列表 */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {!currentConversation ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg mb-2">欢迎使用 AI Chat Studio</p>
              <p className="text-sm">点击左上角菜单创建对话</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>开始新的对话</p>
              <p className="text-sm mt-2">在下方输入框输入消息</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((message, index) => (
              <div
                key={message.id || index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`
                    max-w-[85%] px-4 py-3 rounded-2xl shadow-sm
                    ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                    }
                  `}
                >
                  <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.content}
                  </div>
                  {message.timestamp && (
                    <div
                      className={`text-xs mt-2 ${
                        message.role === 'user'
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 底部输入栏 */}
      <footer className="bg-white border-t border-gray-200 px-4 py-3 sticky bottom-0 safe-bottom">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="输入消息..."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[44px] max-h-32"
            rows={1}
            disabled={!currentConversation}
            style={{
              fieldSizing: 'content'
            }}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || !currentConversation}
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
            aria-label="发送消息"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* 安全区域占位 (iOS) */}
        <div className="h-safe-bottom" />
      </footer>
    </div>
  )
}

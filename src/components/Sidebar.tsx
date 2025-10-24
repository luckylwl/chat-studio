/**
 * Sidebar 组件
 *
 * 功能说明:
 * 左侧边栏组件，显示对话列表和导航
 *
 * 核心特性:
 * 1. 对话列表 - 显示所有对话记录，按更新时间排序
 * 2. 新建对话 - 快速创建新的对话会话
 * 3. 搜索对话 - 在对话标题和消息内容中搜索
 * 4. 重命名对话 - 双击或点击菜单重命名对话
 * 5. 删除对话 - 删除不需要的对话（最少保留1个）
 * 6. 高级功能入口 - 跳转到高级功能页面（Pro功能）
 * 7. 设置入口 - 跳转到设置页面
 * 8. 当前对话高亮 - 视觉区分当前激活的对话
 * 9. 响应式设计 - 移动端可收起，桌面端始终显示
 * 10. 快捷键支持 - Enter 保存，Escape 取消编辑
 *
 * 交互细节:
 * - 悬停显示操作菜单
 * - 内联编辑对话标题
 * - 平滑的动画过渡
 * - 搜索高亮
 *
 * 响应式断点:
 * - 移动端(< 640px): 抽屉式侧边栏，覆盖在内容上方
 * - 桌面端(≥ 640px): 固定侧边栏，与内容并排
 *
 * @component
 */

import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  PlusIcon,
  ChatBubbleLeftRightIcon,
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon,
  RocketLaunchIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { Menu } from '@headlessui/react'        // 无头 UI 菜单组件
import { useAppStore } from '@/store'
import { Button, Input, Badge } from './ui'
import { formatTime, truncateText, cn } from '@/utils'

const Sidebar: React.FC = () => {
  // ============================================
  // 路由和导航
  // ============================================

  /** React Router 导航函数 */
  const navigate = useNavigate()

  /** 当前路由位置 */
  const location = useLocation()

  // ============================================
  // 本地状态管理
  // ============================================

  /** 搜索关键词 */
  const [searchQuery, setSearchQuery] = useState('')

  /** 正在编辑的对话 ID */
  const [editingId, setEditingId] = useState<string | null>(null)

  /** 编辑中的对话标题 */
  const [editingTitle, setEditingTitle] = useState('')

  // ============================================
  // 全局状态（来自 Zustand Store）
  // ============================================

  const {
    /** 所有对话列表 */
    conversations,
    /** 当前对话 ID */
    currentConversationId,
    /** 创建新对话 */
    createConversation,
    /** 删除对话 */
    deleteConversation,
    /** 更新对话 */
    updateConversation,
    /** 设置当前对话 */
    setCurrentConversation
  } = useAppStore()

  // ============================================
  // 派生状态: 过滤后的对话列表
  // ============================================

  /**
   * 根据搜索关键词过滤对话
   *
   * 搜索范围:
   * 1. 对话标题
   * 2. 对话中所有消息的内容
   *
   * 匹配规则:
   * - 不区分大小写
   * - 部分匹配（包含即可）
   */
  const filteredConversations = conversations.filter(conversation =>
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.messages.some(message =>
      message.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  // ============================================
  // 事件处理函数
  // ============================================

  /**
   * 创建新对话
   *
   * 流程:
   * 1. 调用 store 创建新对话，获取新对话 ID
   * 2. 导航到新对话页面
   * 3. 自动设置为当前对话
   */
  const handleCreateConversation = () => {
    const id = createConversation()
    navigate(`/chat/${id}`)
  }

  /**
   * 选择对话
   *
   * @param id - 对话 ID
   *
   * 流程:
   * 1. 设置为当前对话
   * 2. 导航到对话页面
   */
  const handleSelectConversation = (id: string) => {
    setCurrentConversation(id)
    navigate(`/chat/${id}`)
  }

  /**
   * 删除对话
   *
   * @param id - 要删除的对话 ID
   * @param e - 鼠标事件
   *
   * 流程:
   * 1. 阻止事件冒泡（避免触发选择对话）
   * 2. 检查是否至少保留1个对话
   * 3. 删除对话
   * 4. 如果删除的是当前对话，自动切换到其他对话
   *
   * 保护措施:
   * - 最后一个对话不能删除
   * - 删除当前对话后自动切换
   */
  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    // 阻止事件冒泡，避免触发对话选择
    e.stopPropagation()

    // 至少保留一个对话
    if (conversations.length > 1) {
      deleteConversation(id)

      // 如果删除的是当前对话，需要切换到其他对话
      if (currentConversationId === id) {
        const remainingConversations = conversations.filter(c => c.id !== id)
        if (remainingConversations.length > 0) {
          // 切换到第一个剩余对话
          const nextConversation = remainingConversations[0]
          setCurrentConversation(nextConversation.id)
          navigate(`/chat/${nextConversation.id}`)
        } else {
          // 所有对话都被删除（理论上不会发生）
          navigate('/chat')
        }
      }
    }
  }

  /**
   * 开始编辑对话标题
   *
   * @param conversation - 要编辑的对话对象
   * @param e - 鼠标事件
   *
   * 流程:
   * 1. 阻止事件冒泡
   * 2. 设置编辑状态
   * 3. 输入框自动聚焦
   */
  const handleEditTitle = (conversation: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(conversation.id)
    setEditingTitle(conversation.title)
  }

  /**
   * 保存对话标题
   *
   * 流程:
   * 1. 验证标题非空
   * 2. 更新对话标题
   * 3. 清除编辑状态
   *
   * 触发时机:
   * - Enter 键
   * - 失焦（blur）
   */
  const handleSaveTitle = () => {
    if (editingId && editingTitle.trim()) {
      updateConversation(editingId, { title: editingTitle.trim() })
    }
    // 清除编辑状态
    setEditingId(null)
    setEditingTitle('')
  }

  /**
   * 键盘事件处理
   *
   * 快捷键:
   * - Enter: 保存标题
   * - Escape: 取消编辑
   *
   * @param e - 键盘事件
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      // 取消编辑，恢复原标题
      setEditingId(null)
      setEditingTitle('')
    }
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200/50 dark:border-gray-800/50">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">AI Chat Studio</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">智能对话工作室</p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleCreateConversation}
          className="w-full justify-start gap-1.5 sm:gap-2 mb-2 sm:mb-3 text-sm h-8 sm:h-9"
          size="sm"
        >
          <PlusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          新建对话
        </Button>

        {/* Navigation Buttons */}
        <div className="space-y-1">
          <button
            onClick={() => navigate('/advanced')}
            className={cn(
              'w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200',
              location.pathname === '/advanced'
                ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <div className={cn(
              'p-1 sm:p-1.5 rounded-md flex-shrink-0',
              location.pathname === '/advanced'
                ? 'bg-white/20'
                : 'bg-purple-100 dark:bg-purple-900/50'
            )}>
              <RocketLaunchIcon className={cn(
                'h-3.5 w-3.5 sm:h-4 sm:w-4',
                location.pathname === '/advanced'
                  ? 'text-white'
                  : 'text-purple-600 dark:text-purple-400'
              )} />
            </div>
            <span className="truncate">高级功能</span>
            <div className={cn(
              'ml-auto px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0',
              location.pathname === '/advanced'
                ? 'bg-white/20 text-white'
                : 'bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 text-purple-700 dark:text-purple-300'
            )}>
              Pro
            </div>
          </button>

          <button
            onClick={() => navigate('/settings')}
            className={cn(
              'w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200',
              location.pathname === '/settings'
                ? 'bg-primary-50 border border-primary-200 dark:bg-primary-950/50 dark:border-primary-800 text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}
          >
            <div className={cn(
              'p-1 sm:p-1.5 rounded-md flex-shrink-0',
              location.pathname === '/settings'
                ? 'bg-primary-100 dark:bg-primary-900/50'
                : 'bg-gray-100 dark:bg-gray-800'
            )}>
              <Cog6ToothIcon className={cn(
                'h-3.5 w-3.5 sm:h-4 sm:w-4',
                location.pathname === '/settings'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500'
              )} />
            </div>
            <span className="truncate">设置</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 sm:px-4 py-2 sm:py-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
          <Input
            placeholder="搜索对话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 sm:pl-10 h-8 sm:h-9 text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-3 sm:pb-4 space-y-1.5 sm:space-y-2">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              {searchQuery ? '没有找到匹配的对话' : '还没有对话记录'}
            </p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleSelectConversation(conversation.id)}
              className={cn(
                'group relative p-2.5 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                conversation.id === currentConversationId && 'bg-primary-50 border border-primary-200 dark:bg-primary-950/50 dark:border-primary-800'
              )}
            >
              <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                <div className="flex-1 min-w-0">
                  {editingId === conversation.id ? (
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={handleSaveTitle}
                      onKeyDown={handleKeyDown}
                      className="h-7 sm:h-8 text-xs sm:text-sm font-medium"
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                      {truncateText(conversation.title, 25)}
                    </h3>
                  )}

                  <div className="flex items-center gap-1.5 sm:gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {conversation.model?.replace(/^gpt-/, 'GPT-') || 'AI'}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                      {formatTime(conversation.updatedAt)}
                    </span>
                  </div>

                  {conversation.messages.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {truncateText(conversation.messages[conversation.messages.length - 1]?.content || '', 40)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Menu as="div" className="relative">
                    <Menu.Button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <EllipsisVerticalIcon className="h-4 w-4 text-gray-500" />
                    </Menu.Button>

                    <Menu.Items className="absolute right-0 z-10 w-36 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={(e) => handleEditTitle(conversation, e)}
                            className={cn(
                              'w-full text-left px-3 py-2 text-sm flex items-center gap-2',
                              active && 'bg-gray-50 dark:bg-gray-700'
                            )}
                          >
                            <PencilIcon className="h-4 w-4" />
                            重命名
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={(e) => handleDeleteConversation(conversation.id, e)}
                            className={cn(
                              'w-full text-left px-3 py-2 text-sm flex items-center gap-2 text-red-600 dark:text-red-400',
                              active && 'bg-gray-50 dark:bg-gray-700'
                            )}
                            disabled={conversations.length === 1}
                          >
                            <TrashIcon className="h-4 w-4" />
                            删除
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Menu>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {conversation.messages.length} 条消息
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Sidebar
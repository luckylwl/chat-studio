import React, { useMemo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import { Menu } from '@headlessui/react'
import {
  TrashIcon,
  PencilIcon,
  EllipsisVerticalIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'
import { Badge, Input } from './ui'
import { formatTime, truncateText, cn } from '@/utils'
import type { Conversation } from '@/types'

interface VirtualizedConversationListProps {
  conversations: Conversation[]
  currentConversationId?: string
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string, e: React.MouseEvent) => void
  onEditTitle: (conversation: Conversation, e: React.MouseEvent) => void
  editingId: string | null
  editingTitle: string
  setEditingTitle: (title: string) => void
  onSaveTitle: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  height: number
}

interface ConversationItemProps {
  index: number
  style: React.CSSProperties
  data: {
    conversations: Conversation[]
    currentConversationId?: string
    onSelectConversation: (id: string) => void
    onDeleteConversation: (id: string, e: React.MouseEvent) => void
    onEditTitle: (conversation: Conversation, e: React.MouseEvent) => void
    editingId: string | null
    editingTitle: string
    setEditingTitle: (title: string) => void
    onSaveTitle: () => void
    onKeyDown: (e: React.KeyboardEvent) => void
  }
}

const ConversationItem: React.FC<ConversationItemProps> = ({ index, style, data }) => {
  const {
    conversations,
    currentConversationId,
    onSelectConversation,
    onDeleteConversation,
    onEditTitle,
    editingId,
    editingTitle,
    setEditingTitle,
    onSaveTitle,
    onKeyDown
  } = data

  const conversation = conversations[index]

  if (!conversation) return null

  return (
    <div style={style} className="px-3 sm:px-4">
      <div
        onClick={() => onSelectConversation(conversation.id)}
        className={cn(
          'group relative p-2.5 sm:p-3 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 mb-1.5 sm:mb-2',
          conversation.id === currentConversationId && 'bg-primary-50 border border-primary-200 dark:bg-primary-950/50 dark:border-primary-800'
        )}
      >
        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
          <div className="flex-1 min-w-0">
            {editingId === conversation.id ? (
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={onSaveTitle}
                onKeyDown={onKeyDown}
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
                      onClick={(e) => onEditTitle(conversation, e)}
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
                      onClick={(e) => onDeleteConversation(conversation.id, e)}
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
    </div>
  )
}

const VirtualizedConversationList: React.FC<VirtualizedConversationListProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onEditTitle,
  editingId,
  editingTitle,
  setEditingTitle,
  onSaveTitle,
  onKeyDown,
  height
}) => {
  // 每个对话项的固定高度（像素）
  const ITEM_HEIGHT = 120

  const itemData = useMemo(() => ({
    conversations,
    currentConversationId,
    onSelectConversation,
    onDeleteConversation,
    onEditTitle,
    editingId,
    editingTitle,
    setEditingTitle,
    onSaveTitle,
    onKeyDown
  }), [
    conversations,
    currentConversationId,
    onSelectConversation,
    onDeleteConversation,
    onEditTitle,
    editingId,
    editingTitle,
    setEditingTitle,
    onSaveTitle,
    onKeyDown
  ])

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">还没有对话记录</p>
      </div>
    )
  }

  return (
    <List
      height={height}
      itemCount={conversations.length}
      itemSize={ITEM_HEIGHT}
      itemData={itemData}
      className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
    >
      {ConversationItem}
    </List>
  )
}

export default VirtualizedConversationList
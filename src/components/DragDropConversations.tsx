import React, { useState, useRef } from 'react'
import {
  ChatBubbleLeftRightIcon,
  FolderIcon,
  FolderOpenIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  StarIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { cn } from '@/utils'
import { motion, Reorder, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'
import { toast } from 'react-hot-toast'
import { Button, Badge } from './ui'

interface Folder {
  id: string
  name: string
  icon: string
  color: string
  conversationIds: string[]
  collapsed: boolean
}

interface ConversationItem {
  id: string
  title: string
  lastMessage: string
  timestamp: number
  isPinned: boolean
  isArchived: boolean
  unreadCount: number
  folderId?: string
}

interface DragDropConversationsProps {
  onSelectConversation: (id: string) => void
  currentConversationId: string | null
}

const DragDropConversations: React.FC<DragDropConversationsProps> = ({
  onSelectConversation,
  currentConversationId
}) => {
  const { conversations } = useAppStore()
  const [folders, setFolders] = useState<Folder[]>([
    {
      id: 'work',
      name: '工作',
      icon: '💼',
      color: 'blue',
      conversationIds: [],
      collapsed: false
    },
    {
      id: 'personal',
      name: '个人',
      icon: '🏠',
      color: 'green',
      conversationIds: [],
      collapsed: false
    },
    {
      id: 'projects',
      name: '项目',
      icon: '🚀',
      color: 'purple',
      conversationIds: [],
      collapsed: false
    }
  ])
  const [items, setItems] = useState<ConversationItem[]>([])
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    itemId: string
  } | null>(null)
  const [editingFolder, setEditingFolder] = useState<string | null>(null)
  const [newFolderName, setNewFolderName] = useState('')

  // 初始化对话列表
  React.useEffect(() => {
    const conversationItems: ConversationItem[] = conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      lastMessage: conv.messages[conv.messages.length - 1]?.content || '',
      timestamp: conv.updatedAt,
      isPinned: false,
      isArchived: false,
      unreadCount: 0,
      folderId: undefined
    }))
    setItems(conversationItems)
  }, [conversations])

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId)
  }

  const handleDragEnd = () => {
    setDraggedItem(null)
  }

  const handleDropToFolder = (folderId: string, itemId: string) => {
    setFolders(prev =>
      prev.map(folder =>
        folder.id === folderId
          ? {
              ...folder,
              conversationIds: [...folder.conversationIds, itemId]
            }
          : {
              ...folder,
              conversationIds: folder.conversationIds.filter(id => id !== itemId)
            }
      )
    )
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, folderId } : item
      )
    )
    toast.success('已移动到文件夹')
  }

  const handleRemoveFromFolder = (itemId: string) => {
    setFolders(prev =>
      prev.map(folder => ({
        ...folder,
        conversationIds: folder.conversationIds.filter(id => id !== itemId)
      }))
    )
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, folderId: undefined } : item
      )
    )
  }

  const togglePin = (itemId: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, isPinned: !item.isPinned } : item
      )
    )
  }

  const toggleArchive = (itemId: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, isArchived: !item.isArchived } : item
      )
    )
    toast.success('已归档')
  }

  const toggleFolderCollapse = (folderId: string) => {
    setFolders(prev =>
      prev.map(folder =>
        folder.id === folderId
          ? { ...folder, collapsed: !folder.collapsed }
          : folder
      )
    )
  }

  const addFolder = () => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}`,
      name: '新文件夹',
      icon: '📁',
      color: 'gray',
      conversationIds: [],
      collapsed: false
    }
    setFolders(prev => [...prev, newFolder])
    setEditingFolder(newFolder.id)
  }

  const renameFolder = (folderId: string, newName: string) => {
    setFolders(prev =>
      prev.map(folder =>
        folder.id === folderId ? { ...folder, name: newName } : folder
      )
    )
    setEditingFolder(null)
  }

  const deleteFolder = (folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    if (folder && folder.conversationIds.length > 0) {
      // 将对话移出文件夹
      setItems(prev =>
        prev.map(item =>
          folder.conversationIds.includes(item.id)
            ? { ...item, folderId: undefined }
            : item
        )
      )
    }
    setFolders(prev => prev.filter(f => f.id !== folderId))
    toast.success('文件夹已删除')
  }

  const handleContextMenu = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, itemId })
  }

  const pinnedItems = items.filter(item => item.isPinned && !item.isArchived)
  const unpinnedItems = items.filter(item => !item.isPinned && !item.isArchived && !item.folderId)
  const archivedItems = items.filter(item => item.isArchived)

  const ConversationCard = ({ item }: { item: ConversationItem }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      onDragStart={() => handleDragStart(item.id)}
      onDragEnd={handleDragEnd}
      onClick={() => onSelectConversation(item.id)}
      onContextMenu={(e) => handleContextMenu(e, item.id)}
      className={cn(
        'group relative p-3 rounded-lg border cursor-pointer transition-all duration-200',
        currentConversationId === item.id
          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800 shadow-sm'
          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
        draggedItem === item.id && 'opacity-50'
      )}
    >
      {/* Pin indicator */}
      {item.isPinned && (
        <div className="absolute top-2 right-2">
          <StarSolidIcon className="w-3 h-3 text-yellow-500" />
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
            {item.title}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-0.5">
            {item.lastMessage || '暂无消息'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {new Date(item.timestamp).toLocaleDateString()}
            </span>
            {item.unreadCount > 0 && (
              <Badge variant="default" className="text-xs px-1.5 py-0">
                {item.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Drag indicator */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
        <div className="flex flex-col gap-0.5">
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
          <div className="w-1 h-1 bg-gray-400 rounded-full" />
        </div>
      </div>
    </motion.div>
  )

  const FolderCard = ({ folder }: { folder: Folder }) => {
    const folderConversations = items.filter(item => item.folderId === folder.id)
    const [isDragOver, setIsDragOver] = useState(false)

    return (
      <div className="mb-4">
        <div
          className={cn(
            'flex items-center justify-between p-2 rounded-lg mb-2 transition-colors cursor-pointer',
            isDragOver && 'bg-primary-50 dark:bg-primary-900/20 border border-primary-300 dark:border-primary-700'
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            if (draggedItem) {
              handleDropToFolder(folder.id, draggedItem)
            }
          }}
          onClick={() => toggleFolderCollapse(folder.id)}
        >
          <div className="flex items-center gap-2">
            {folder.collapsed ? (
              <FolderIcon className="w-4 h-4 text-gray-500" />
            ) : (
              <FolderOpenIcon className="w-4 h-4 text-gray-500" />
            )}
            {editingFolder === folder.id ? (
              <input
                type="text"
                defaultValue={folder.name}
                autoFocus
                onBlur={(e) => renameFolder(folder.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    renameFolder(folder.id, e.currentTarget.value)
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-1 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded"
              />
            ) : (
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {folder.icon} {folder.name}
              </span>
            )}
            <Badge variant="secondary" className="text-xs">
              {folderConversations.length}
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setEditingFolder(folder.id)
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <PencilIcon className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteFolder(folder.id)
              }}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
            >
              <TrashIcon className="w-3 h-3" />
            </button>
          </div>
        </div>

        {!folder.collapsed && (
          <div className="space-y-2 pl-4">
            <AnimatePresence>
              {folderConversations.map(item => (
                <ConversationCard key={item.id} item={item} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">对话</h2>
          <Button
            size="sm"
            onClick={addFolder}
            className="h-8 w-8 p-0"
            title="新建文件夹"
          >
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Pinned */}
        {pinnedItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-2">
              <StarSolidIcon className="w-4 h-4 text-yellow-500" />
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                已置顶
              </h3>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {pinnedItems.map(item => (
                  <ConversationCard key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Folders */}
        {folders.map(folder => (
          <FolderCard key={folder.id} folder={folder} />
        ))}

        {/* Unpinned */}
        {unpinnedItems.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-2 px-2">
              所有对话
            </h3>
            <div className="space-y-2">
              <AnimatePresence>
                {unpinnedItems.map(item => (
                  <ConversationCard key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Archived */}
        {archivedItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 px-2">
              <ArchiveBoxIcon className="w-4 h-4 text-gray-500" />
              <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                已归档
              </h3>
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {archivedItems.map(item => (
                  <ConversationCard key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y
            }}
          >
            <button
              onClick={() => {
                togglePin(contextMenu.itemId)
                setContextMenu(null)
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <StarIcon className="w-4 h-4" />
              置顶
            </button>
            <button
              onClick={() => {
                toggleArchive(contextMenu.itemId)
                setContextMenu(null)
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              <ArchiveBoxIcon className="w-4 h-4" />
              归档
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            {items.find(i => i.id === contextMenu.itemId)?.folderId && (
              <button
                onClick={() => {
                  handleRemoveFromFolder(contextMenu.itemId)
                  setContextMenu(null)
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <FolderOpenIcon className="w-4 h-4" />
                移出文件夹
              </button>
            )}
            <button
              onClick={() => {
                // Delete conversation
                setContextMenu(null)
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600"
            >
              <TrashIcon className="w-4 h-4" />
              删除
            </button>
          </motion.div>
        </>
      )}
    </div>
  )
}

export default DragDropConversations
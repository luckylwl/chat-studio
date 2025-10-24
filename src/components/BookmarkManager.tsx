import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookmarkIcon,
  BookmarkSlashIcon,
  HeartIcon,
  TagIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ShareIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { useAppStore } from '@/store'
import {
  BookmarkService,
  Bookmark,
  BookmarkCollection,
  BookmarkFilter
} from '@/services/bookmarkService'

interface BookmarkManagerProps {
  isOpen: boolean
  onClose: () => void
  onNavigateToBookmark: (conversationId: string, messageId?: string) => void
}

const BookmarkManager: React.FC<BookmarkManagerProps> = ({
  isOpen,
  onClose,
  onNavigateToBookmark
}) => {
  const { conversations } = useAppStore()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [collections, setCollections] = useState<BookmarkCollection[]>([])
  const [filteredBookmarks, setFilteredBookmarks] = useState<Bookmark[]>([])
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [activeView, setActiveView] = useState<'grid' | 'list'>('list')
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)
  const [showCreateCollection, setShowCreateCollection] = useState(false)

  // 过滤器状态
  const [filters, setFilters] = useState<BookmarkFilter>({
    type: 'all',
    favorites: undefined,
    tags: [],
    collections: []
  })

  const bookmarkService = BookmarkService.getInstance()

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  useEffect(() => {
    applyFilters()
  }, [bookmarks, searchQuery, filters])

  const loadData = () => {
    const allBookmarks = bookmarkService.getAllBookmarks()
    const allCollections = bookmarkService.getAllCollections()
    setBookmarks(allBookmarks)
    setCollections(allCollections)
  }

  const applyFilters = () => {
    let filtered = searchQuery
      ? bookmarkService.searchBookmarks(searchQuery)
      : bookmarkService.getFilteredBookmarks(filters)

    setFilteredBookmarks(filtered)
  }

  const handleToggleBookmark = async (bookmark: Bookmark) => {
    const success = await bookmarkService.toggleFavorite(bookmark.id)
    if (success) {
      loadData()
    }
  }

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (confirm('确定要删除这个书签吗？')) {
      const success = await bookmarkService.removeBookmark(bookmarkId)
      if (success) {
        loadData()
        setSelectedBookmarks(prev => {
          const next = new Set(prev)
          next.delete(bookmarkId)
          return next
        })
      }
    }
  }

  const handleBatchDelete = async () => {
    if (selectedBookmarks.size === 0) return

    if (confirm(`确定要删除选中的 ${selectedBookmarks.size} 个书签吗？`)) {
      for (const bookmarkId of selectedBookmarks) {
        await bookmarkService.removeBookmark(bookmarkId)
      }
      loadData()
      setSelectedBookmarks(new Set())
    }
  }

  const handleEditBookmark = async (bookmark: Bookmark, updates: Partial<Bookmark>) => {
    const success = await bookmarkService.updateBookmark(bookmark.id, updates)
    if (success) {
      loadData()
      setEditingBookmark(null)
    }
  }

  const handleNavigateToBookmark = (bookmark: Bookmark) => {
    onNavigateToBookmark(bookmark.conversationId, bookmark.messageId)
    onClose()
  }

  const handleSelectBookmark = (bookmarkId: string) => {
    setSelectedBookmarks(prev => {
      const next = new Set(prev)
      if (next.has(bookmarkId)) {
        next.delete(bookmarkId)
      } else {
        next.add(bookmarkId)
      }
      return next
    })
  }

  const getConversationTitle = (conversationId: string): string => {
    const conversation = conversations.find(c => c.id === conversationId)
    return conversation?.title || '未知对话'
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderBookmarkItem = (bookmark: Bookmark) => (
    <motion.div
      key={bookmark.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer ${
        selectedBookmarks.has(bookmark.id) ? 'ring-2 ring-blue-500 border-blue-500' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex-1 min-w-0"
          onClick={() => handleNavigateToBookmark(bookmark)}
        >
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={selectedBookmarks.has(bookmark.id)}
              onChange={(e) => {
                e.stopPropagation()
                handleSelectBookmark(bookmark.id)
              }}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div className={`w-3 h-3 rounded-full ${bookmark.color || 'bg-blue-500'}`} />
            <span className={`px-2 py-1 text-xs rounded-full ${
              bookmark.type === 'conversation'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            }`}>
              {bookmark.type === 'conversation' ? '对话' : '消息'}
            </span>
            {bookmark.isFavorite && (
              <HeartSolidIcon className="w-4 h-4 text-red-500" />
            )}
          </div>

          <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate">
            {bookmark.title}
          </h3>

          {bookmark.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {bookmark.description}
            </p>
          )}

          {bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {bookmark.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{getConversationTitle(bookmark.conversationId)}</span>
            <span>{formatDate(bookmark.createdAt)}</span>
          </div>

          {bookmark.note && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm text-yellow-800 dark:text-yellow-200">
              💭 {bookmark.note}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleToggleBookmark(bookmark)
            }}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title={bookmark.isFavorite ? '取消收藏' : '加入收藏'}
          >
            {bookmark.isFavorite ? (
              <HeartSolidIcon className="w-4 h-4" />
            ) : (
              <HeartIcon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditingBookmark(bookmark)
            }}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            title="编辑"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteBookmark(bookmark.id)
            }}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="删除"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )

  const renderFilters = () => (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-b border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  类型
                </label>
                <select
                  value={filters.type || 'all'}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">全部</option>
                  <option value="conversation">对话</option>
                  <option value="message">消息</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  收藏状态
                </label>
                <select
                  value={filters.favorites === undefined ? 'all' : filters.favorites ? 'favorites' : 'normal'}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    favorites: e.target.value === 'all' ? undefined : e.target.value === 'favorites'
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">全部</option>
                  <option value="favorites">收藏</option>
                  <option value="normal">普通</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  集合
                </label>
                <select
                  multiple
                  value={filters.collections || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value)
                    setFilters(prev => ({ ...prev, collections: selected }))
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                >
                  {collections.map(collection => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({
                    type: 'all',
                    favorites: undefined,
                    tags: [],
                    collections: []
                  })}
                  className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  清除过滤器
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <BookmarkIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  书签管理器
                </h2>
                <span className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                  {filteredBookmarks.length} 个书签
                </span>
              </div>

              <div className="flex items-center gap-2">
                {selectedBookmarks.size > 0 && (
                  <button
                    onClick={handleBatchDelete}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    删除选中 ({selectedBookmarks.size})
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg transition-colors ${
                    showFilters
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FunnelIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索书签标题、描述、标签..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {renderFilters()}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredBookmarks.length > 0 ? (
                <div className="space-y-4">
                  {filteredBookmarks.map(renderBookmarkItem)}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookmarkSlashIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchQuery || Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : true))
                      ? '没有找到匹配的书签'
                      : '还没有任何书签'
                    }
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery || Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : true))
                      ? '尝试调整搜索条件或清除过滤器'
                      : '开始收藏重要的对话和消息吧'
                    }
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Edit Bookmark Modal */}
          {editingBookmark && (
            <BookmarkEditModal
              bookmark={editingBookmark}
              onSave={(updates) => handleEditBookmark(editingBookmark, updates)}
              onClose={() => setEditingBookmark(null)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// 编辑书签模态框
interface BookmarkEditModalProps {
  bookmark: Bookmark
  onSave: (updates: Partial<Bookmark>) => void
  onClose: () => void
}

const BookmarkEditModal: React.FC<BookmarkEditModalProps> = ({
  bookmark,
  onSave,
  onClose
}) => {
  const [title, setTitle] = useState(bookmark.title)
  const [description, setDescription] = useState(bookmark.description || '')
  const [tags, setTags] = useState(bookmark.tags.join(', '))
  const [note, setNote] = useState(bookmark.note || '')
  const [isFavorite, setIsFavorite] = useState(bookmark.isFavorite)

  const handleSave = () => {
    onSave({
      title,
      description: description || undefined,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      note: note || undefined,
      isFavorite
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          编辑书签
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              标签 (用逗号分隔)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="重要, 代码, 教程"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              备注
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="favorite"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
            />
            <label htmlFor="favorite" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              加入收藏
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default BookmarkManager
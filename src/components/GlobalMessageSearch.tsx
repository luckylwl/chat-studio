import React, { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { useMessageSearch, SearchOptions } from '@/hooks/useMessageSearch'
import { useAppStore } from '@/store'
import { Button, Input, Modal } from '@/components/ui'
import { MessageHighlight } from './MessageHighlight'
import { cn } from '@/utils'

interface GlobalMessageSearchProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * 全局消息搜索组件
 * 功能:
 * - 跨对话搜索
 * - 实时搜索结果
 * - 搜索选项配置
 * - 结果导航
 * - 关键词高亮
 */
export const GlobalMessageSearch: React.FC<GlobalMessageSearchProps> = ({
  isOpen,
  onClose
}) => {
  const conversations = useAppStore(state => state.conversations)
  const setCurrentConversation = useAppStore(state => state.setCurrentConversation)

  const {
    searchQuery,
    setSearchQuery,
    searchOptions,
    setSearchOptions,
    searchResults,
    currentResult,
    currentResultIndex,
    totalResults,
    nextResult,
    previousResult,
    goToResult,
    clearSearch
  } = useMessageSearch(conversations)

  const [showOptions, setShowOptions] = useState(false)
  const [inputValue, setInputValue] = useState('')

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue)
    }, 300)

    return () => clearTimeout(timer)
  }, [inputValue, setSearchQuery])

  // 键盘快捷键
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          previousResult()
        } else {
          nextResult()
        }
      } else if (e.key === 'Escape') {
        onClose()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, nextResult, previousResult, onClose])

  const handleResultClick = (index: number) => {
    const result = goToResult(index)
    if (result) {
      // 切换到对应的对话
      setCurrentConversation(result.conversation.id)
      // 滚动到对应的消息 (这需要在ChatPage中实现)
      // 可以通过 URL 参数或全局事件实现
    }
  }

  const handleClear = () => {
    setInputValue('')
    clearSearch()
  }

  const toggleOption = (option: keyof SearchOptions) => {
    setSearchOptions({
      ...searchOptions,
      [option]: !searchOptions[option]
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="全局消息搜索"
      size="lg"
    >
      <div className="flex flex-col h-[600px]">
        {/* 搜索输入栏 */}
        <div className="flex-shrink-0 space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="搜索所有消息..."
                className="pl-10 pr-10"
                autoFocus
              />
              {inputValue && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOptions(!showOptions)}
              className={cn(
                'px-3',
                showOptions && 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
              )}
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5" />
            </Button>
          </div>

          {/* 搜索选项 */}
          {showOptions && (
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchOptions.caseSensitive}
                  onChange={() => toggleOption('caseSensitive')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">区分大小写</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchOptions.wholeWord}
                  onChange={() => toggleOption('wholeWord')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">全词匹配</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchOptions.useRegex}
                  onChange={() => toggleOption('useRegex')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">正则表达式</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchOptions.searchInCode}
                  onChange={() => toggleOption('searchInCode')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">搜索代码块</span>
              </label>
            </div>
          )}

          {/* 结果计数和导航 */}
          {searchQuery && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {totalResults > 0 ? (
                  <>
                    找到 <span className="font-semibold text-blue-600 dark:text-blue-400">{totalResults}</span> 条结果
                    {totalResults > 0 && (
                      <span className="ml-2">
                        (第 {currentResultIndex + 1} 条)
                      </span>
                    )}
                  </>
                ) : (
                  '未找到匹配结果'
                )}
              </span>

              {totalResults > 0 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={previousResult}
                    title="上一个 (Shift+Enter)"
                  >
                    <ChevronUpIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextResult}
                    title="下一个 (Enter)"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 搜索结果列表 */}
        <div className="flex-1 overflow-y-auto mt-4">
          {!searchQuery ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <MagnifyingGlassIcon className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">开始搜索</p>
              <p className="text-sm">在上方输入关键词以搜索所有对话</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <MagnifyingGlassIcon className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">未找到结果</p>
              <p className="text-sm">尝试使用不同的关键词</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((result, index) => (
                <button
                  key={`${result.conversation.id}-${result.messageIndex}`}
                  onClick={() => handleResultClick(index)}
                  className={cn(
                    'w-full text-left p-4 rounded-lg border transition-all duration-200',
                    index === currentResultIndex
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-sm'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  {/* 对话标题 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {result.conversation.title}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                      {result.matchCount} 处匹配
                    </span>
                  </div>

                  {/* 消息角色 */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        result.message.role === 'user'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      )}
                    >
                      {result.message.role === 'user' ? '用户' : 'AI助手'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(result.message.timestamp).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* 消息内容预览 (带高亮) */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                    <MessageHighlight
                      text={result.message.content}
                      searchQuery={searchQuery}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default GlobalMessageSearch

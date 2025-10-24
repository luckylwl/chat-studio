import React, { useState, useEffect } from 'react'
import { XMarkIcon, CommandLineIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { Button, Badge } from './ui'
import { cn } from '@/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Shortcut {
  key: string
  description: string
  category: string
  action?: () => void
}

interface KeyboardShortcutsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const shortcuts: Shortcut[] = [
    // 全局快捷键
    { key: 'Ctrl+K', description: '打开命令面板', category: '全局' },
    { key: 'Ctrl+/', description: '显示快捷键帮助', category: '全局' },
    { key: 'Ctrl+N', description: '新建对话', category: '全局' },
    { key: 'Ctrl+S', description: '保存对话', category: '全局' },
    { key: 'Ctrl+F', description: '搜索对话', category: '全局' },
    { key: 'Ctrl+,', description: '打开设置', category: '全局' },
    { key: 'Escape', description: '关闭弹窗/取消操作', category: '全局' },

    // 消息输入
    { key: 'Enter', description: '发送消息', category: '消息输入' },
    { key: 'Shift+Enter', description: '换行', category: '消息输入' },
    { key: 'Ctrl+Enter', description: '强制发送消息', category: '消息输入' },
    { key: 'Tab', description: '接受自动补全建议', category: '消息输入' },
    { key: '/', description: '触发斜杠命令', category: '消息输入' },
    { key: 'Ctrl+U', description: '上传文件', category: '消息输入' },
    { key: 'Ctrl+V', description: '粘贴剪贴板内容', category: '消息输入' },

    // 消息操作
    { key: 'Ctrl+C', description: '复制消息内容', category: '消息操作' },
    { key: 'Ctrl+D', description: '删除消息', category: '消息操作' },
    { key: 'Ctrl+E', description: '编辑消息', category: '消息操作' },
    { key: 'Ctrl+R', description: '重新生成回复', category: '消息操作' },
    { key: 'Ctrl+B', description: '添加书签', category: '消息操作' },

    // 导航
    { key: 'Ctrl+1-9', description: '切换到第N个对话', category: '导航' },
    { key: 'Ctrl+Tab', description: '下一个对话', category: '导航' },
    { key: 'Ctrl+Shift+Tab', description: '上一个对话', category: '导航' },
    { key: 'Ctrl+[', description: '收起侧边栏', category: '导航' },
    { key: 'Ctrl+]', description: '展开侧边栏', category: '导航' },
    { key: 'Home', description: '滚动到顶部', category: '导航' },
    { key: 'End', description: '滚动到底部', category: '导航' },

    // 高级功能
    { key: 'Ctrl+Shift+S', description: '打开智能建议面板', category: '高级功能' },
    { key: 'Ctrl+Shift+T', description: '打开对话模板', category: '高级功能' },
    { key: 'Ctrl+Shift+M', description: '打开模型选择器', category: '高级功能' },
    { key: 'Ctrl+Shift+C', description: '打开模型对比', category: '高级功能' },
    { key: 'Ctrl+Shift+L', description: '打开协作面板', category: '高级功能' },
    { key: 'Ctrl+Shift+R', description: '切换实时分析监控', category: '高级功能' },
    { key: 'Ctrl+Shift+A', description: '打开高级搜索', category: '高级功能' },

    // 视图
    { key: 'Ctrl+0', description: '重置缩放', category: '视图' },
    { key: 'Ctrl++', description: '放大', category: '视图' },
    { key: 'Ctrl+-', description: '缩小', category: '视图' },
    { key: 'Ctrl+Shift+D', description: '切换深色模式', category: '视图' },
    { key: 'F11', description: '全屏模式', category: '视图' }
  ]

  const categories = ['all', ...Array.from(new Set(shortcuts.map(s => s.category)))]

  const filteredShortcuts = shortcuts.filter(shortcut => {
    const matchesSearch = search === '' ||
      shortcut.key.toLowerCase().includes(search.toLowerCase()) ||
      shortcut.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || shortcut.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)

  // 全局快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+/ 或 ? 显示快捷键帮助
      if (((e.ctrlKey || e.metaKey) && e.key === '/') || e.key === '?') {
        e.preventDefault()
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <CommandLineIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  键盘快捷键
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  快速掌握所有快捷操作
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 p-0"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索快捷键..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    selectedCategory === category
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {category === 'all' ? '全部' : category}
                </button>
              ))}
            </div>
          </div>

          {/* Shortcuts List */}
          <div className="flex-1 overflow-y-auto p-6">
            {Object.keys(groupedShortcuts).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                      {category}
                      <Badge variant="secondary" className="text-xs">
                        {shortcuts.length}
                      </Badge>
                    </h3>
                    <div className="space-y-2">
                      {shortcuts.map((shortcut, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {shortcut.description}
                          </span>
                          <kbd className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm font-mono text-gray-900 dark:text-gray-100 shadow-sm">
                            {shortcut.key}
                          </kbd>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  未找到匹配的快捷键
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              💡 提示: 按 <kbd className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs font-mono">Ctrl+/</kbd> 或 <kbd className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs font-mono">?</kbd> 随时打开此面板
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default KeyboardShortcutsPanel
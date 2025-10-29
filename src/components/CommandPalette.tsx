import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  MagnifyingGlassIcon,
  CommandLineIcon,
  PlusIcon,
  FolderIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  MoonIcon,
  SunIcon,
  CalculatorIcon,
  SparklesIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onExecuteCommand: (command: Command) => void
}

export interface Command {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  shortcut?: string
  category: CommandCategory
  action: () => void
}

type CommandCategory = 'navigation' | 'creation' | 'editing' | 'settings' | 'tools' | 'view'

const CATEGORY_NAMES: Record<CommandCategory, string> = {
  navigation: '导航',
  creation: '创建',
  editing: '编辑',
  settings: '设置',
  tools: '工具',
  view: '视图'
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onExecuteCommand
}) => {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  // 默认命令列表
  const defaultCommands: Command[] = useMemo(() => [
    {
      id: 'new-conversation',
      name: '新建对话',
      description: '开始一个新的对话',
      icon: PlusIcon,
      shortcut: 'Ctrl+N',
      category: 'creation',
      action: () => console.log('New conversation')
    },
    {
      id: 'open-settings',
      name: '打开设置',
      description: '配置应用程序设置',
      icon: Cog6ToothIcon,
      shortcut: 'Ctrl+,',
      category: 'settings',
      action: () => console.log('Open settings')
    },
    {
      id: 'toggle-theme',
      name: '切换主题',
      description: '在深色和浅色主题之间切换',
      icon: MoonIcon,
      shortcut: 'Ctrl+Shift+T',
      category: 'view',
      action: () => console.log('Toggle theme')
    },
    {
      id: 'export-conversation',
      name: '导出对话',
      description: '导出当前对话为文件',
      icon: ArrowDownTrayIcon,
      shortcut: 'Ctrl+E',
      category: 'tools',
      action: () => console.log('Export conversation')
    },
    {
      id: 'import-conversation',
      name: '导入对话',
      description: '从文件导入对话',
      icon: DocumentTextIcon,
      shortcut: 'Ctrl+I',
      category: 'tools',
      action: () => console.log('Import conversation')
    },
    {
      id: 'delete-conversation',
      name: '删除对话',
      description: '删除当前对话',
      icon: TrashIcon,
      shortcut: 'Ctrl+D',
      category: 'editing',
      action: () => console.log('Delete conversation')
    },
    {
      id: 'token-counter',
      name: 'Token 计数器',
      description: '查看 Token 使用和成本',
      icon: CalculatorIcon,
      shortcut: 'Ctrl+Shift+C',
      category: 'tools',
      action: () => console.log('Token counter')
    },
    {
      id: 'model-comparison',
      name: '多模型对比',
      description: '同时对比多个 AI 模型',
      icon: SparklesIcon,
      shortcut: 'Ctrl+Shift+M',
      category: 'tools',
      action: () => console.log('Model comparison')
    },
    {
      id: 'template-manager',
      name: '模板管理器',
      description: '管理对话模板',
      icon: BookmarkIcon,
      shortcut: 'Ctrl+Shift+P',
      category: 'tools',
      action: () => console.log('Template manager')
    },
    {
      id: 'browse-folders',
      name: '浏览文件夹',
      description: '查看所有对话文件夹',
      icon: FolderIcon,
      shortcut: 'Ctrl+Shift+F',
      category: 'navigation',
      action: () => console.log('Browse folders')
    }
  ], [])

  // 过滤命令
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return defaultCommands

    const lowerQuery = query.toLowerCase()
    return defaultCommands.filter(cmd =>
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.description.toLowerCase().includes(lowerQuery) ||
      cmd.shortcut?.toLowerCase().includes(lowerQuery)
    )
  }, [query, defaultCommands])

  // 按分类分组
  const groupedCommands = useMemo(() => {
    const groups: Record<CommandCategory, Command[]> = {
      navigation: [],
      creation: [],
      editing: [],
      settings: [],
      tools: [],
      view: []
    }

    filteredCommands.forEach(cmd => {
      groups[cmd.category].push(cmd)
    })

    return Object.entries(groups).filter(([_, commands]) => commands.length > 0)
  }, [filteredCommands])

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        )
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex])
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex, onClose])

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  // 执行命令
  const executeCommand = (command: Command) => {
    onExecuteCommand(command)
    command.action()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-2xl rounded-xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入命令或搜索..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 text-lg"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-12">
              <CommandLineIcon className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">未找到匹配的命令</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedCommands.map(([category, commands]) => (
                <div key={category}>
                  <div className="px-3 py-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {CATEGORY_NAMES[category as CommandCategory]}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {commands.map((command, idx) => {
                      const globalIndex = filteredCommands.indexOf(command)
                      const Icon = command.icon
                      const isSelected = globalIndex === selectedIndex

                      return (
                        <button
                          key={command.id}
                          onClick={() => executeCommand(command)}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-900/30'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          )}
                        >
                          <Icon className={cn(
                            'w-5 h-5 flex-shrink-0',
                            isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'font-medium',
                              isSelected
                                ? 'text-blue-900 dark:text-blue-100'
                                : 'text-gray-900 dark:text-white'
                            )}>
                              {command.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {command.description}
                            </p>
                          </div>
                          {command.shortcut && (
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded">
                              {command.shortcut}
                            </kbd>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded">↓</kbd>
              <span>导航</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded">Enter</kbd>
              <span>执行</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded">ESC</kbd>
              <span>关闭</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            {filteredCommands.length} 个命令
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default CommandPalette

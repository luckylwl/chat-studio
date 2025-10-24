import React, { useState, useRef, useEffect } from 'react'
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  CodeBracketIcon,
  LinkIcon,
  PhotoIcon,
  TableCellsIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  Bars3BottomLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import { toast } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface MarkdownEditorProps {
  initialValue?: string
  onChange?: (value: string) => void
  onSave?: (value: string) => void
  height?: string
  showToolbar?: boolean
  showPreview?: boolean
  autoSave?: boolean
  autoSaveInterval?: number
  placeholder?: string
  className?: string
}

interface HistoryEntry {
  content: string
  timestamp: number
  cursorPosition: number
}

interface TableSize {
  rows: number
  cols: number
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  initialValue = '',
  onChange,
  onSave,
  height = '500px',
  showToolbar = true,
  showPreview: initialShowPreview = true,
  autoSave = false,
  autoSaveInterval = 5000,
  placeholder = '开始编写 Markdown...',
  className
}) => {
  const [content, setContent] = useState(initialValue)
  const [showPreview, setShowPreview] = useState(initialShowPreview)
  const [splitView, setSplitView] = useState(true)
  const [history, setHistory] = useState<HistoryEntry[]>([{ content: initialValue, timestamp: Date.now(), cursorPosition: 0 }])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [showTableModal, setShowTableModal] = useState(false)
  const [tableSize, setTableSize] = useState<TableSize>({ rows: 3, cols: 3 })
  const [isDirty, setIsDirty] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Configure marked options
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
    })
  }, [])

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isDirty) return

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave()
      setIsDirty(false)
    }, autoSaveInterval)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [content, autoSave, autoSaveInterval, isDirty])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setIsDirty(true)
    onChange?.(newContent)

    // Add to history (debounced)
    const cursorPosition = textareaRef.current?.selectionStart || 0

    if (historyIndex < history.length - 1) {
      // Remove future history when new changes are made after undo
      setHistory(history.slice(0, historyIndex + 1))
    }

    // Only add to history if content changed significantly
    const lastEntry = history[history.length - 1]
    if (Math.abs(newContent.length - lastEntry.content.length) > 5 || Date.now() - lastEntry.timestamp > 2000) {
      const newHistory = [...history.slice(-50), { content: newContent, timestamp: Date.now(), cursorPosition }]
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    }
  }

  const handleSave = () => {
    onSave?.(content)
    toast.success('已保存')
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setContent(history[newIndex].content)

      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = history[newIndex].cursorPosition
          textareaRef.current.selectionEnd = history[newIndex].cursorPosition
        }
      }, 0)
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setContent(history[newIndex].content)

      // Restore cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = history[newIndex].cursorPosition
          textareaRef.current.selectionEnd = history[newIndex].cursorPosition
        }
      }, 0)
    }
  }

  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const textToInsert = selectedText || placeholder

    const newContent =
      content.substring(0, start) +
      before +
      textToInsert +
      after +
      content.substring(end)

    handleContentChange(newContent)

    // Set cursor position
    setTimeout(() => {
      const newPosition = start + before.length + textToInsert.length
      textarea.focus()
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  const insertLine = (text: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const lineStart = content.lastIndexOf('\n', start - 1) + 1

    const newContent =
      content.substring(0, lineStart) +
      text +
      content.substring(lineStart)

    handleContentChange(newContent)

    setTimeout(() => {
      const newPosition = lineStart + text.length
      textarea.focus()
      textarea.setSelectionRange(newPosition, newPosition)
    }, 0)
  }

  const handleBold = () => insertText('**', '**', '粗体文字')
  const handleItalic = () => insertText('*', '*', '斜体文字')
  const handleCode = () => insertText('`', '`', '代码')
  const handleCodeBlock = () => insertText('```\n', '\n```', '代码块')
  const handleLink = () => insertText('[', '](https://example.com)', '链接文字')
  const handleImage = () => insertText('![', '](https://example.com/image.jpg)', '图片描述')
  const handleHeading = (level: number) => insertLine('#'.repeat(level) + ' 标题\n')
  const handleList = () => insertLine('- 列表项\n')
  const handleNumberedList = () => insertLine('1. 列表项\n')
  const handleQuote = () => insertLine('> 引用\n')
  const handleHorizontalRule = () => insertLine('\n---\n\n')

  const handleTable = () => {
    setShowTableModal(true)
  }

  const insertTable = () => {
    const { rows, cols } = tableSize

    // Create header
    const header = '| ' + Array(cols).fill('列').map((_, i) => `${_}${i + 1}`).join(' | ') + ' |\n'
    const separator = '| ' + Array(cols).fill('---').join(' | ') + ' |\n'

    // Create rows
    const bodyRows = Array(rows - 1).fill(0).map(() =>
      '| ' + Array(cols).fill('内容').join(' | ') + ' |\n'
    ).join('')

    const table = '\n' + header + separator + bodyRows + '\n'

    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const newContent = content.substring(0, start) + table + content.substring(start)

    handleContentChange(newContent)
    setShowTableModal(false)

    setTimeout(() => {
      textarea.focus()
    }, 0)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    toast.success('已复制到剪贴板')
  }

  const handleExport = () => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `markdown-${Date.now()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('已导出为 Markdown 文件')
  }

  const renderPreview = () => {
    try {
      const html = marked.parse(content) as string
      const sanitized = DOMPurify.sanitize(html)
      return sanitized
    } catch (error) {
      console.error('Markdown parse error:', error)
      return '<p class="text-red-500">Markdown 解析错误</p>'
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!textareaRef.current || document.activeElement !== textareaRef.current) return

      // Ctrl/Cmd + B: Bold
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        handleBold()
      }
      // Ctrl/Cmd + I: Italic
      else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault()
        handleItalic()
      }
      // Ctrl/Cmd + K: Link
      else if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        handleLink()
      }
      // Ctrl/Cmd + S: Save
      else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
      // Ctrl/Cmd + Z: Undo
      else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
      // Ctrl/Cmd + Shift + Z: Redo
      else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        handleRedo()
      }
      // Ctrl/Cmd + P: Toggle preview
      else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        setShowPreview(!showPreview)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [content, showPreview, historyIndex])

  return (
    <div className={cn('flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden', className)}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-wrap">
          {/* History */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="撤销 (Ctrl+Z)"
            >
              <ArrowUturnLeftIcon className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="重做 (Ctrl+Shift+Z)"
            >
              <ArrowUturnRightIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Formatting */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
            <Button variant="ghost" size="sm" onClick={handleBold} title="粗体 (Ctrl+B)">
              <BoldIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleItalic} title="斜体 (Ctrl+I)">
              <ItalicIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCode} title="行内代码">
              <CodeBracketIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Headings */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
            {[1, 2, 3].map(level => (
              <Button
                key={level}
                variant="ghost"
                size="sm"
                onClick={() => handleHeading(level)}
                title={`标题 ${level}`}
                className="text-xs font-bold"
              >
                H{level}
              </Button>
            ))}
          </div>

          {/* Lists & Quotes */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
            <Button variant="ghost" size="sm" onClick={handleList} title="无序列表">
              <ListBulletIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNumberedList} title="有序列表">
              <Bars3BottomLeftIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleQuote} title="引用">
              <ChevronDoubleRightIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* Insert */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
            <Button variant="ghost" size="sm" onClick={handleLink} title="链接 (Ctrl+K)">
              <LinkIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleImage} title="图片">
              <PhotoIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleTable} title="表格">
              <TableCellsIcon className="w-4 h-4" />
            </Button>
          </div>

          {/* View */}
          <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSplitView(!splitView)}
              title="切换分栏/单栏"
            >
              {splitView ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto">
            <Button variant="ghost" size="sm" onClick={handleCopy} title="复制">
              <DocumentDuplicateIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport} title="导出">
              <ArrowDownTrayIcon className="w-4 h-4" />
            </Button>
            {onSave && (
              <Button size="sm" onClick={handleSave} title="保存 (Ctrl+S)">
                保存
              </Button>
            )}
          </div>

          {/* Status */}
          {autoSave && isDirty && (
            <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              未保存
            </div>
          )}
        </div>
      )}

      {/* Editor and Preview */}
      <div className="flex flex-1 overflow-hidden" style={{ height }}>
        {/* Editor */}
        <div className={cn(
          'flex flex-col',
          splitView && showPreview ? 'w-1/2 border-r border-gray-200 dark:border-gray-700' : 'w-full'
        )}>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 p-4 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:outline-none"
            spellCheck={false}
          />

          {/* Stats */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span>{content.length} 字符</span>
              <span>{content.split(/\s+/).filter(w => w.length > 0).length} 词</span>
              <span>{content.split('\n').length} 行</span>
            </div>
            <div>
              Markdown
            </div>
          </div>
        </div>

        {/* Preview */}
        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={cn(
                'overflow-y-auto bg-white dark:bg-gray-800',
                splitView ? 'w-1/2' : 'hidden'
              )}
            >
              <div className="p-6">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderPreview() }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table Modal */}
      <AnimatePresence>
        {showTableModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowTableModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 z-50 w-96"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                插入表格
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    行数: {tableSize.rows}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={tableSize.rows}
                    onChange={(e) => setTableSize(prev => ({ ...prev, rows: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    列数: {tableSize.cols}
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={tableSize.cols}
                    onChange={(e) => setTableSize(prev => ({ ...prev, cols: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <Button onClick={insertTable} className="flex-1">
                  插入
                </Button>
                <Button variant="outline" onClick={() => setShowTableModal(false)} className="flex-1">
                  取消
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MarkdownEditor
import React, { useState, useEffect } from 'react'
import {
  ClipboardIcon,
  TrashIcon,
  PencilIcon,
  ArrowUturnLeftIcon,
  BookmarkIcon,
  ShareIcon,
  SpeakerWaveIcon,
  CodeBracketIcon,
  LanguageIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/utils'
import { Message } from '@/types'

interface ContextMenuProps {
  message: Message
  x: number
  y: number
  onClose: () => void
  onCopy: () => void
  onEdit?: () => void
  onDelete?: () => void
  onRegenerate?: () => void
  onBookmark?: () => void
  onShare?: () => void
  onSpeak?: () => void
  onCopyAsCode?: () => void
  onTranslate?: () => void
  onQuote?: () => void
}

interface MenuItem {
  icon: React.ElementType
  label: string
  action: () => void
  shortcut?: string
  variant?: 'default' | 'danger'
  divider?: boolean
}

const MessageContextMenu: React.FC<ContextMenuProps> = ({
  message,
  x,
  y,
  onClose,
  onCopy,
  onEdit,
  onDelete,
  onRegenerate,
  onBookmark,
  onShare,
  onSpeak,
  onCopyAsCode,
  onTranslate,
  onQuote
}) => {
  const [position, setPosition] = useState({ x, y })
  const isUser = message.role === 'user'

  useEffect(() => {
    // 确保菜单不会超出视口
    const menu = document.getElementById('context-menu')
    if (menu) {
      const rect = menu.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = x
      let adjustedY = y

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10
      }

      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10
      }

      setPosition({ x: adjustedX, y: adjustedY })
    }

    // 点击外部关闭菜单
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('#context-menu')) {
        onClose()
      }
    }

    // ESC键关闭
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [x, y, onClose])

  const menuItems: MenuItem[] = [
    {
      icon: ClipboardIcon,
      label: '复制',
      action: () => {
        onCopy()
        onClose()
      },
      shortcut: 'Ctrl+C'
    },
    ...(onCopyAsCode ? [{
      icon: CodeBracketIcon,
      label: '复制为代码',
      action: () => {
        onCopyAsCode()
        onClose()
      }
    }] : []),
    ...(onQuote ? [{
      icon: DocumentDuplicateIcon,
      label: '引用',
      action: () => {
        onQuote()
        onClose()
      }
    }] : []),
    {
      icon: BookmarkIcon,
      label: '添加书签',
      action: () => {
        onBookmark?.()
        onClose()
      },
      divider: true
    },
    ...(onSpeak ? [{
      icon: SpeakerWaveIcon,
      label: '朗读',
      action: () => {
        onSpeak()
        onClose()
      }
    }] : []),
    ...(onTranslate ? [{
      icon: LanguageIcon,
      label: '翻译',
      action: () => {
        onTranslate()
        onClose()
      }
    }] : []),
    ...(onShare ? [{
      icon: ShareIcon,
      label: '分享',
      action: () => {
        onShare()
        onClose()
      },
      divider: true
    }] : []),
    ...(isUser && onEdit ? [{
      icon: PencilIcon,
      label: '编辑',
      action: () => {
        onEdit()
        onClose()
      }
    }] : []),
    ...(!isUser && onRegenerate ? [{
      icon: ArrowUturnLeftIcon,
      label: '重新生成',
      action: () => {
        onRegenerate()
        onClose()
      }
    }] : []),
    ...(onDelete ? [{
      icon: TrashIcon,
      label: '删除',
      action: () => {
        onDelete()
        onClose()
      },
      variant: 'danger' as const
    }] : [])
  ]

  return (
    <>
      {/* 背景遮罩 */}
      <div className="fixed inset-0 z-40" />

      {/* 上下文菜单 */}
      <div
        id="context-menu"
        className="fixed z-50 min-w-[200px] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 animate-in fade-in zoom-in-95 duration-100"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
      >
        {menuItems.map((item, index) => (
          <React.Fragment key={index}>
            <button
              onClick={item.action}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                'hover:bg-gray-50 dark:hover:bg-gray-700',
                item.variant === 'danger'
                  ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-gray-700 dark:text-gray-300'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.shortcut && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {item.shortcut}
                </span>
              )}
            </button>
            {item.divider && (
              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  )
}

export default MessageContextMenu
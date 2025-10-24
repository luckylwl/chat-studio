import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'

export interface ActionSheetItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'default' | 'destructive' | 'primary'
  disabled?: boolean
}

export interface ActionSheetSection {
  id: string
  title?: string
  items: ActionSheetItem[]
}

interface MobileActionSheetProps {
  isOpen: boolean
  onClose: () => void
  sections: ActionSheetSection[]
  title?: string
  showCancel?: boolean
  cancelText?: string
}

/**
 * 移动端底部操作面板
 * iOS/Android 风格的底部弹出菜单
 */
const MobileActionSheet: React.FC<MobileActionSheetProps> = ({
  isOpen,
  onClose,
  sections,
  title,
  showCancel = true,
  cancelText = '取消',
}) => {
  const [dragY, setDragY] = useState(0)

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // 处理拖动
  const handleDragEnd = (event: any, info: PanInfo) => {
    // 向下拖动超过100px则关闭
    if (info.offset.y > 100) {
      onClose()
    }
    setDragY(0)
  }

  const handleItemClick = (item: ActionSheetItem) => {
    if (!item.disabled) {
      item.onClick()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            style={{ touchAction: 'none' }}
          />

          {/* 操作面板 */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden pb-safe"
            style={{
              touchAction: 'none',
            }}
          >
            {/* 拖动指示器 */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* 标题 */}
            {title && (
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h3>
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    aria-label="关闭"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* 内容区域 */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {sections.map((section, sectionIndex) => (
                <div key={section.id}>
                  {/* 分组标题 */}
                  {section.title && (
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {section.title}
                    </div>
                  )}

                  {/* 操作项 */}
                  <div
                    className={
                      sectionIndex < sections.length - 1
                        ? 'border-b border-gray-200 dark:border-gray-700'
                        : ''
                    }
                  >
                    {section.items.map((item) => {
                      const Icon = item.icon

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item)}
                          disabled={item.disabled}
                          className={`w-full px-4 py-4 flex items-center gap-3 transition-colors active:bg-gray-100 dark:active:bg-gray-700 ${
                            item.disabled
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer'
                          } ${
                            item.variant === 'destructive'
                              ? 'text-red-600 dark:text-red-400'
                              : item.variant === 'primary'
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {Icon && (
                            <Icon className="w-6 h-6 flex-shrink-0" />
                          )}
                          <span className="text-base font-medium flex-1 text-left">
                            {item.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 取消按钮 */}
            {showCancel && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="w-full py-3 text-base font-semibold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-xl active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
                >
                  {cancelText}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default MobileActionSheet
export type { ActionSheetItem, ActionSheetSection }

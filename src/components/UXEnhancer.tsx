import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useAnimation } from './AnimationProvider'
import { useMobile } from './MobileOptimizations'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'

interface UXEnhancerProps {
  children: React.ReactNode
  className?: string
}

export const UXEnhancer: React.FC<UXEnhancerProps> = ({ children, className }) => {
  const { isMobile } = useMobile()
  const { fadeIn, slideIn, bounce } = useAnimation()
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isVisible && containerRef.current) {
      slideIn(containerRef.current, 'up', 400)
    }
  }, [isVisible, slideIn])

  return (
    <div
      ref={containerRef}
      className={cn(
        "transition-all duration-300 ease-out",
        isVisible ? "opacity-100" : "opacity-0",
        className
      )}
    >
      {children}
    </div>
  )
}

interface SmartTooltipProps {
  content: string
  children: React.ReactElement
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export const SmartTooltip: React.FC<SmartTooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 500
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [actualPosition, setActualPosition] = useState(position)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement>(null)

  const showTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      // Smart positioning logic
      if (triggerRef.current && tooltipRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect()
        const tooltipRect = tooltipRef.current.getBoundingClientRect()
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight
        }

        let newPosition = position

        // Check if tooltip would go outside viewport
        if (position === 'top' && triggerRect.top - tooltipRect.height < 0) {
          newPosition = 'bottom'
        } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height > viewport.height) {
          newPosition = 'top'
        } else if (position === 'left' && triggerRect.left - tooltipRect.width < 0) {
          newPosition = 'right'
        } else if (position === 'right' && triggerRect.right + tooltipRect.width > viewport.width) {
          newPosition = 'left'
        }

        setActualPosition(newPosition)
      }

      setIsVisible(true)
    }, delay)
  }, [position, delay])

  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }, [])

  const positionClasses = {
    top: '-top-2 left-1/2 -translate-x-1/2 -translate-y-full',
    bottom: '-bottom-2 left-1/2 -translate-x-1/2 translate-y-full',
    left: '-left-2 top-1/2 -translate-y-1/2 -translate-x-full',
    right: '-right-2 top-1/2 -translate-y-1/2 translate-x-full'
  }

  const arrowClasses = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-l-transparent border-r-gray-900'
  }

  return (
    <div className="relative inline-block">
      {React.cloneElement(children, {
        ref: triggerRef,
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip
      })}

      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            "absolute z-50 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded shadow-lg pointer-events-none",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            positionClasses[actualPosition]
          )}
        >
          {content}
          <div
            className={cn(
              "absolute w-0 h-0 border-4",
              arrowClasses[actualPosition]
            )}
          />
        </div>
      )}
    </div>
  )
}

interface ContextMenuProps {
  items: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    disabled?: boolean
    danger?: boolean
  }>
  children: React.ReactElement
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items, children }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()

    const x = e.clientX
    const y = e.clientY

    setPosition({ x, y })
    setIsVisible(true)
  }, [])

  const closeMenu = useCallback(() => {
    setIsVisible(false)
  }, [])

  useEffect(() => {
    if (isVisible) {
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
          closeMenu()
        }
      }

      document.addEventListener('click', handleClickOutside)
      document.addEventListener('contextmenu', handleClickOutside)

      return () => {
        document.removeEventListener('click', handleClickOutside)
        document.removeEventListener('contextmenu', handleClickOutside)
      }
    }
  }, [isVisible, closeMenu])

  return (
    <>
      {React.cloneElement(children, {
        onContextMenu: handleContextMenu
      })}

      {isVisible && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeMenu} />
          <div
            ref={menuRef}
            className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 animate-in fade-in-0 zoom-in-95 duration-200"
            style={{
              left: position.x,
              top: position.y
            }}
          >
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!item.disabled) {
                    item.onClick()
                    closeMenu()
                  }
                }}
                disabled={item.disabled}
                className={cn(
                  "flex items-center gap-3 w-full px-4 py-2 text-sm text-left transition-colors",
                  item.disabled
                    ? "text-gray-400 cursor-not-allowed"
                    : item.danger
                    ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
}

interface FloatingActionButtonProps {
  icon: React.ReactNode
  onClick: () => void
  tooltip?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  className?: string
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onClick,
  tooltip,
  position = 'bottom-right',
  className
}) => {
  const { bounce } = useAnimation()
  const buttonRef = useRef<HTMLButtonElement>(null)

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  }

  const handleClick = () => {
    if (buttonRef.current) {
      bounce(buttonRef.current, 1.2)
    }
    onClick()
  }

  const button = (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={cn(
        "fixed z-40 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group",
        positionClasses[position],
        className
      )}
    >
      <span className="transform group-hover:scale-110 transition-transform duration-200">
        {icon}
      </span>
    </button>
  )

  if (tooltip) {
    return <SmartTooltip content={tooltip}>{button}</SmartTooltip>
  }

  return button
}

interface DragDropZoneProps {
  onDrop: (files: FileList) => void
  accept?: string[]
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export const DragDropZone: React.FC<DragDropZoneProps> = ({
  onDrop,
  accept = [],
  children,
  className,
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragDepth, setDragDepth] = useState(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (disabled) return

    setDragDepth(prev => prev + 1)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (disabled) return

    setDragDepth(prev => {
      const newDepth = prev - 1
      if (newDepth === 0) {
        setIsDragOver(false)
      }
      return newDepth
    })
  }, [disabled])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (disabled) return

    e.dataTransfer.dropEffect = 'copy'
  }, [disabled])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (disabled) return

    setIsDragOver(false)
    setDragDepth(0)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      // Filter files by accepted types if specified
      if (accept.length > 0) {
        const validFiles = Array.from(files).filter(file => {
          return accept.some(acceptType => {
            if (acceptType.startsWith('.')) {
              return file.name.toLowerCase().endsWith(acceptType.toLowerCase())
            } else if (acceptType.includes('/')) {
              return file.type.match(acceptType.replace('*', '.*'))
            }
            return false
          })
        })

        if (validFiles.length !== files.length) {
          toast.error(`只支持以下格式: ${accept.join(', ')}`)
        }

        if (validFiles.length > 0) {
          const fileList = validFiles.reduce((list, file, index) => {
            list[index] = file
            return list
          }, {} as any) as FileList
          Object.defineProperty(fileList, 'length', { value: validFiles.length })
          onDrop(fileList)
        }
      } else {
        onDrop(files)
      }
    }
  }, [disabled, accept, onDrop])

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "relative transition-all duration-200",
        isDragOver && !disabled && "ring-2 ring-blue-500 ring-opacity-50 bg-blue-50 dark:bg-blue-900/20",
        className
      )}
    >
      {children}

      {isDragOver && !disabled && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10">
          <div className="text-blue-600 dark:text-blue-400 font-medium">
            松开以上传文件
          </div>
        </div>
      )}
    </div>
  )
}

export default {
  UXEnhancer,
  SmartTooltip,
  ContextMenu,
  FloatingActionButton,
  DragDropZone
}
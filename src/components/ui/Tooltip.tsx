import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePopper } from 'react-popper'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  placement?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
  disabled?: boolean
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 300,
  className = '',
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement,
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 8],
        },
      },
    ],
  })

  const showTooltip = () => {
    if (disabled) return
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  return (
    <>
      {React.cloneElement(children, {
        ref: setReferenceElement,
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
        onFocus: showTooltip,
        onBlur: hideTooltip,
      })}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`z-[9999] px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg pointer-events-none ${className}`}
            role="tooltip"
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Simple tooltip without dependencies
export const SimpleTooltip: React.FC<{
  content: string
  children: React.ReactElement
  position?: 'top' | 'bottom' | 'left' | 'right'
}> = ({ content, children, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div className="relative inline-block">
      {React.cloneElement(children, {
        onMouseEnter: () => setIsVisible(true),
        onMouseLeave: () => setIsVisible(false),
        onFocus: () => setIsVisible(true),
        onBlur: () => setIsVisible(false),
      })}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`absolute ${positionClasses[position]} px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap pointer-events-none z-50`}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

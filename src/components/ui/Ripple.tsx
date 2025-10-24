import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface RippleType {
  x: number
  y: number
  id: number
}

export const useRipple = () => {
  const [ripples, setRipples] = useState<RippleType[]>([])

  const addRipple = (event: React.MouseEvent<HTMLElement>) => {
    const rippleContainer = event.currentTarget.getBoundingClientRect()
    const size = Math.max(rippleContainer.width, rippleContainer.height)
    const x = event.clientX - rippleContainer.left - size / 2
    const y = event.clientY - rippleContainer.top - size / 2

    const newRipple: RippleType = {
      x,
      y,
      id: Date.now(),
    }

    setRipples((prev) => [...prev, newRipple])

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id))
    }, 600)
  }

  const RippleContainer: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
      <span className={`absolute inset-0 overflow-hidden rounded-inherit pointer-events-none ${className}`}>
        <AnimatePresence>
          {ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              className="absolute bg-white/30 rounded-full"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: '100%',
                height: '100%',
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>
      </span>
    )
  }

  return { addRipple, RippleContainer }
}

// Ripple Button Component
export const RippleButton: React.FC<{
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}> = ({ children, onClick, className = '', disabled = false, type = 'button' }) => {
  const { addRipple, RippleContainer } = useRipple()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      addRipple(e)
      onClick?.(e)
    }
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`relative overflow-hidden ${className}`}
    >
      <RippleContainer />
      {children}
    </button>
  )
}

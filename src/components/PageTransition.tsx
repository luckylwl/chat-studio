import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

const pageVariants = {
  initial: {
    opacity: 0,
    x: -20,
    scale: 0.95
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    x: 20,
    scale: 0.95
  }
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children, className }) => {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Slide transition for modals/panels
interface SlideTransitionProps {
  children: React.ReactNode
  isOpen: boolean
  direction?: 'left' | 'right' | 'up' | 'down'
  className?: string
}

export const SlideTransition: React.FC<SlideTransitionProps> = ({
  children,
  isOpen,
  direction = 'right',
  className
}) => {
  const slideVariants = {
    initial: {
      x: direction === 'left' ? '-100%' : direction === 'right' ? '100%' : 0,
      y: direction === 'up' ? '-100%' : direction === 'down' ? '100%' : 0,
      opacity: 0
    },
    animate: {
      x: 0,
      y: 0,
      opacity: 1
    },
    exit: {
      x: direction === 'left' ? '-100%' : direction === 'right' ? '100%' : 0,
      y: direction === 'up' ? '-100%' : direction === 'down' ? '100%' : 0,
      opacity: 0
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={slideVariants}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Scale/Fade transition for cards and items
interface ScaleTransitionProps {
  children: React.ReactNode
  isVisible: boolean
  delay?: number
  className?: string
}

export const ScaleTransition: React.FC<ScaleTransitionProps> = ({
  children,
  isVisible,
  delay = 0,
  className
}) => {
  const scaleVariants = {
    hidden: {
      scale: 0.8,
      opacity: 0,
      y: 20
    },
    visible: {
      scale: 1,
      opacity: 1,
      y: 0
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={scaleVariants}
          transition={{
            duration: 0.4,
            delay,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Stagger children animation for lists
interface StaggerContainerProps {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className,
  staggerDelay = 0.1
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay
      }
    }
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: React.ReactNode
  className?: string
}

export const StaggerItem: React.FC<StaggerItemProps> = ({ children, className }) => {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  )
}

// Floating animation for action buttons
interface FloatingProps {
  children: React.ReactNode
  className?: string
  delay?: number
}

export const FloatingAnimation: React.FC<FloatingProps> = ({
  children,
  className,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        initial: { delay, duration: 0.3 },
        hover: { duration: 0.2 },
        tap: { duration: 0.1 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default PageTransition
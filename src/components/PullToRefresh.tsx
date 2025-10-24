import React, { useState, useRef, ReactNode } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

interface PullToRefreshProps {
  children: ReactNode
  onRefresh: () => Promise<void>
  threshold?: number // 触发刷新的拖动距离阈值
  maxPull?: number // 最大拖动距离
  disabled?: boolean
  refreshingText?: string
  pullText?: string
  releaseText?: string
}

/**
 * 下拉刷新组件
 * 移动端常见的下拉刷新交互
 */
const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  maxPull = 120,
  disabled = false,
  refreshingText = '刷新中...',
  pullText = '下拉刷新',
  releaseText = '释放刷新',
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)

  // 图标旋转角度
  const rotate = useTransform(y, [0, maxPull], [0, 360])

  // 是否到达释放阈值
  const canRelease = y.get() >= threshold

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return

    const container = containerRef.current
    if (!container) return

    // 只有在容器滚动到顶部时才允许下拉刷新
    if (container.scrollTop === 0) {
      setIsPulling(true)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return

    const container = containerRef.current
    if (!container || container.scrollTop > 0) {
      setIsPulling(false)
      y.set(0)
      return
    }

    const touch = e.touches[0]
    const startY = e.currentTarget.getBoundingClientRect().top

    // 计算拖动距离,应用阻尼效果
    const pullDistance = Math.max(0, touch.clientY - startY)
    const dampedDistance = Math.min(
      pullDistance * 0.5, // 阻尼系数
      maxPull
    )

    y.set(dampedDistance)

    // 阻止默认滚动行为
    if (pullDistance > 10) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling || disabled || isRefreshing) return

    setIsPulling(false)

    // 检查是否达到刷新阈值
    if (y.get() >= threshold) {
      setIsRefreshing(true)

      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
        y.set(0)
      }
    } else {
      // 未达到阈值,回弹
      y.set(0)
    }
  }

  // 计算显示文本
  const getStatusText = () => {
    if (isRefreshing) return refreshingText
    if (canRelease) return releaseText
    return pullText
  }

  // 计算透明度
  const opacity = useTransform(y, [0, threshold], [0, 1])

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 刷新指示器 */}
      <motion.div
        style={{
          height: y,
          opacity,
        }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden"
      >
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <motion.div style={{ rotate }}>
            <ArrowPathIcon
              className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </motion.div>
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
      </motion.div>

      {/* 内容 */}
      <motion.div
        style={{
          y: isRefreshing ? threshold : y,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export default PullToRefresh

import React, { useEffect, useRef, useState } from 'react'

interface Announcement {
  id: string
  message: string
  priority: 'polite' | 'assertive'
  timestamp: number
}

interface ScreenReaderAnnouncerProps {
  enabled?: boolean
}

/**
 * 屏幕阅读器公告组件
 * 用于向屏幕阅读器用户宣读重要信息
 */
const ScreenReaderAnnouncer: React.FC<ScreenReaderAnnouncerProps> = ({
  enabled = true,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const politeRef = useRef<HTMLDivElement>(null)
  const assertiveRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return

    // 创建全局公告函数
    const announce = (
      message: string,
      priority: 'polite' | 'assertive' = 'polite'
    ) => {
      const id = `announcement-${Date.now()}-${Math.random()}`
      const announcement: Announcement = {
        id,
        message,
        priority,
        timestamp: Date.now(),
      }

      setAnnouncements((prev) => [...prev, announcement])

      // 5秒后清除公告
      setTimeout(() => {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id))
      }, 5000)
    }

    // 将函数挂载到全局
    ;(window as any).announceToScreenReader = announce

    return () => {
      delete (window as any).announceToScreenReader
    }
  }, [enabled])

  if (!enabled) return null

  const politeAnnouncements = announcements.filter((a) => a.priority === 'polite')
  const assertiveAnnouncements = announcements.filter(
    (a) => a.priority === 'assertive'
  )

  return (
    <>
      {/* Polite 公告区域 - 不会打断当前朗读 */}
      <div
        ref={politeRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeAnnouncements.map((announcement) => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>

      {/* Assertive 公告区域 - 会立即打断当前朗读 */}
      <div
        ref={assertiveRef}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveAnnouncements.map((announcement) => (
          <div key={announcement.id}>{announcement.message}</div>
        ))}
      </div>
    </>
  )
}

/**
 * 向屏幕阅读器宣读消息的工具函数
 */
export const announceToScreenReader = (
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) => {
  if (typeof window !== 'undefined' && (window as any).announceToScreenReader) {
    ;(window as any).announceToScreenReader(message, priority)
  }
}

export default ScreenReaderAnnouncer

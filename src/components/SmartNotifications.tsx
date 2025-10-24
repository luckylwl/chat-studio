import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import {
  BellIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/utils'

interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info' | 'chat'
  title: string
  message: string
  timestamp: number
  read: boolean
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  avatar?: string
  sound?: boolean
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAll: () => void
  unreadCount: number
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission)

      if (Notification.permission === 'default') {
        Notification.requestPermission().then(setPermission)
      }
    }
  }, [])

  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/notification.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {
        // Fallback: use system beep
        const context = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = context.createOscillator()
        const gainNode = context.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(context.destination)

        oscillator.frequency.value = 800
        gainNode.gain.value = 0.1

        oscillator.start()
        oscillator.stop(context.currentTime + 0.2)
      })
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }
  }, [])

  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...notificationData,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      read: false
    }

    setNotifications(prev => [notification, ...prev])

    // Play sound if enabled
    if (notificationData.sound !== false) {
      playNotificationSound()
    }

    // Show browser notification
    if (permission === 'granted' && document.hidden) {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: notification.id,
        requireInteraction: notification.persistent
      })
    }

    // Show toast for immediate feedback
    const toastOptions = {
      duration: notification.persistent ? Infinity : 4000,
      position: 'top-right' as const
    }

    switch (notification.type) {
      case 'success':
        toast.success(`${notification.title}: ${notification.message}`, toastOptions)
        break
      case 'error':
        toast.error(`${notification.title}: ${notification.message}`, toastOptions)
        break
      case 'warning':
        toast(`⚠️ ${notification.title}: ${notification.message}`, toastOptions)
        break
      case 'info':
        toast(`ℹ️ ${notification.title}: ${notification.message}`, toastOptions)
        break
      case 'chat':
        toast(`💬 ${notification.title}: ${notification.message}`, toastOptions)
        break
    }

    // Auto-remove non-persistent notifications after 30 seconds
    if (!notification.persistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
      }, 30000)
    }
  }, [permission, playNotificationSound])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    )
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    unreadCount
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const { notifications, markAsRead, markAllAsRead, removeNotification, clearAll } = useNotifications()

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
      case 'chat':
        return <div className="h-5 w-5 text-purple-500">💬</div>
      default:
        return <BellIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const formatTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return `${Math.floor(diff / 86400000)}天前`
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-4 top-16 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            通知中心
          </h3>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  全部已读
                </button>
                <button
                  onClick={clearAll}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                >
                  清空
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <BellIcon className="h-12 w-12 mb-4" />
              <p>暂无通知</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors",
                    !notification.read && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {notification.avatar ? (
                        <img
                          src={notification.avatar}
                          alt=""
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        getIcon(notification.type)
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className={cn(
                          "text-sm font-medium truncate",
                          notification.read ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-gray-100"
                        )}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1 ml-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(notification.timestamp)}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeNotification(notification.id)
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <p className={cn(
                        "text-sm mt-1",
                        notification.read ? "text-gray-500 dark:text-gray-400" : "text-gray-700 dark:text-gray-300"
                      )}>
                        {notification.message}
                      </p>

                      {notification.action && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            notification.action!.onClick()
                            removeNotification(notification.id)
                          }}
                          className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          {notification.action.label}
                        </button>
                      )}

                      {!notification.read && (
                        <div className="absolute right-2 top-2 w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

interface NotificationBellProps {
  className?: string
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const { unreadCount } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors",
          className
        )}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

export default {
  NotificationProvider,
  NotificationCenter,
  NotificationBell,
  useNotifications
}
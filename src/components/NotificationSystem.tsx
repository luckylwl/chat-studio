import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { Button } from './ui'
import { cn } from '@/utils'
import {
  BellIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  ClockIcon,
  UserIcon,
  CogIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

export interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info' | 'ai' | 'system'
  title: string
  message: string
  timestamp: number
  read: boolean
  persistent?: boolean
  action?: {
    label: string
    onClick: () => void
  }
  category: 'chat' | 'system' | 'ai' | 'model' | 'update' | 'security'
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

interface NotificationSystemProps {
  className?: string
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ className }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'high-priority'>('all')
  const { conversations, currentConversationId, apiProviders } = useAppStore()

  // Mock intelligent notifications based on app state
  useEffect(() => {
    const generateIntelligentNotifications = () => {
      const newNotifications: Notification[] = []

      // AI Model Performance Notification
      const hasEnabledProviders = apiProviders.some(p => p.isEnabled && p.apiKey)
      if (!hasEnabledProviders) {
        newNotifications.push({
          id: `model-config-${Date.now()}`,
          type: 'warning',
          title: '模型配置建议',
          message: '建议配置多个AI模型提供商以获得更好的对话体验和备用选项。',
          timestamp: Date.now(),
          read: false,
          category: 'model',
          priority: 'medium',
          action: {
            label: '立即配置',
            onClick: () => {
              // Navigate to settings
              console.log('Navigate to model settings')
            }
          }
        })
      }

      // Conversation Analytics
      if (conversations.length > 5) {
        const recentConversations = conversations.slice(0, 7)
        const avgMessagesPerConv = recentConversations.reduce((acc, conv) => acc + conv.messages.length, 0) / recentConversations.length

        if (avgMessagesPerConv > 10) {
          newNotifications.push({
            id: `analytics-${Date.now()}`,
            type: 'info',
            title: '对话深度分析',
            message: `您的最近对话平均包含${Math.round(avgMessagesPerConv)}条消息，表明您正在进行深入的AI交互。`,
            timestamp: Date.now() - 300000, // 5 minutes ago
            read: false,
            category: 'chat',
            priority: 'low'
          })
        }
      }

      // AI Suggestions
      const currentConv = conversations.find(c => c.id === currentConversationId)
      if (currentConv && currentConv.messages.length > 20) {
        newNotifications.push({
          id: `ai-suggestion-${Date.now()}`,
          type: 'ai',
          title: '智能对话建议',
          message: '检测到长对话会话，建议使用对话总结功能或开始新对话以维持最佳性能。',
          timestamp: Date.now() - 600000, // 10 minutes ago
          read: false,
          category: 'ai',
          priority: 'medium',
          action: {
            label: '查看建议',
            onClick: () => {
              console.log('Show AI suggestions')
            }
          }
        })
      }

      // System Updates
      newNotifications.push({
        id: `update-${Date.now()}`,
        type: 'success',
        title: '功能更新',
        message: '新增高级功能中心，包含AI工作流引擎、智能代码生成器等强大工具。',
        timestamp: Date.now() - 1800000, // 30 minutes ago
        read: false,
        category: 'update',
        priority: 'high',
        action: {
          label: '探索功能',
          onClick: () => {
            console.log('Navigate to advanced features')
          }
        }
      })

      // Security Reminder
      if (apiProviders.some(p => p.apiKey && p.apiKey.length > 0)) {
        newNotifications.push({
          id: `security-${Date.now()}`,
          type: 'info',
          title: '安全提醒',
          message: '定期检查和更新您的API密钥以确保账户安全。建议启用自动锁定功能。',
          timestamp: Date.now() - 3600000, // 1 hour ago
          read: Math.random() > 0.5,
          category: 'security',
          priority: 'medium'
        })
      }

      return newNotifications
    }

    const intelligentNotifications = generateIntelligentNotifications()
    setNotifications(prev => {
      const existingIds = prev.map(n => n.id)
      const newOnes = intelligentNotifications.filter(n => !existingIds.includes(n.id))
      return [...prev, ...newOnes].slice(0, 50) // Keep only latest 50
    })
  }, [conversations, apiProviders, currentConversationId])

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read
    if (filter === 'high-priority') return ['high', 'urgent'].includes(notification.priority)
    return true
  }).sort((a, b) => b.timestamp - a.timestamp)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return CheckCircleIcon
      case 'warning': return ExclamationTriangleIcon
      case 'error': return ExclamationCircleIcon
      case 'info': return InformationCircleIcon
      case 'ai': return SparklesIcon
      case 'system': return CogIcon
      default: return InformationCircleIcon
    }
  }

  const getNotificationColors = (type: Notification['type'], priority: Notification['priority']) => {
    const baseColors = {
      success: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      warning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      error: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      info: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      ai: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
      system: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
    }

    let colors = baseColors[type]
    if (priority === 'urgent') {
      colors += ' ring-2 ring-red-400 dark:ring-red-600'
    } else if (priority === 'high') {
      colors += ' ring-1 ring-orange-300 dark:ring-orange-700'
    }

    return colors
  }

  const getCategoryIcon = (category: Notification['category']) => {
    switch (category) {
      case 'chat': return ChatBubbleLeftRightIcon
      case 'ai': return SparklesIcon
      case 'model': return CogIcon
      case 'security': return ExclamationTriangleIcon
      default: return InformationCircleIcon
    }
  }

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return `${Math.floor(diff / 86400000)}天前`
  }

  return (
    <div className={cn('relative', className)}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BellIcon className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">通知中心</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-full">
                    {unreadCount} 条未读
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {[
                { key: 'all', label: '全部' },
                { key: 'unread', label: '未读' },
                { key: 'high-priority', label: '重要' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                    filter === key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          {unreadCount > 0 && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                className="w-full"
              >
                全部标记为已读
              </Button>
            </div>
          )}

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <BellIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{filter === 'unread' ? '没有未读通知' : filter === 'high-priority' ? '没有重要通知' : '暂无通知'}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type)
                  const CategoryIcon = getCategoryIcon(notification.category)

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors',
                        !notification.read && 'bg-blue-50/50 dark:bg-blue-900/20'
                      )}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'p-2 rounded-lg flex-shrink-0',
                          getNotificationColors(notification.type, notification.priority)
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={cn(
                              'font-medium truncate',
                              !notification.read
                                ? 'text-gray-900 dark:text-gray-100'
                                : 'text-gray-700 dark:text-gray-300'
                            )}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            )}
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <CategoryIcon className="h-3 w-3" />
                              <span>{formatRelativeTime(notification.timestamp)}</span>
                              {notification.priority === 'high' && (
                                <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded text-xs font-medium">
                                  重要
                                </span>
                              )}
                              {notification.priority === 'urgent' && (
                                <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded text-xs font-medium">
                                  紧急
                                </span>
                              )}
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                dismissNotification(notification.id)
                              }}
                              className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <XMarkIcon className="h-4 w-4 text-gray-400" />
                            </button>
                          </div>

                          {notification.action && (
                            <div className="mt-3">
                              <Button
                                onClick={notification.action.onClick}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                {notification.action.label}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationSystem
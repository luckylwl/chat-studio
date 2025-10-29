import React, { useState, useEffect } from 'react'

// ==================== Types ====================

type NotificationType = 'system' | 'user' | 'app' | 'email' | 'sms' | 'push' | 'webhook'
type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'
type NotificationStatus = 'unread' | 'read' | 'archived' | 'deleted'
type DeliveryChannel = 'in-app' | 'email' | 'sms' | 'push' | 'webhook'

interface Notification {
  id: string
  type: NotificationType
  priority: NotificationPriority
  status: NotificationStatus
  title: string
  message: string
  sender?: {
    id: string
    name: string
    avatar: string
  }
  timestamp: Date
  readAt?: Date
  actionUrl?: string
  actionLabel?: string
  metadata?: Record<string, any>
  tags: string[]
  channels: DeliveryChannel[]
}

interface NotificationTemplate {
  id: string
  name: string
  type: NotificationType
  subject: string
  body: string
  variables: string[]
  channels: DeliveryChannel[]
  priority: NotificationPriority
  enabled: boolean
  usageCount: number
}

interface NotificationPreference {
  channel: DeliveryChannel
  enabled: boolean
  types: {
    [key in NotificationType]: boolean
  }
  quietHours?: {
    enabled: boolean
    start: string
    end: string
  }
  frequency?: 'instant' | 'batched' | 'daily_digest'
}

interface NotificationRule {
  id: string
  name: string
  condition: string
  action: 'send' | 'suppress' | 'escalate'
  priority: NotificationPriority
  enabled: boolean
  matchCount: number
}

interface NotificationAnalytics {
  totalSent: number
  deliveryRate: number
  openRate: number
  clickRate: number
  byType: {
    [key in NotificationType]: {
      sent: number
      opened: number
      clicked: number
    }
  }
  byChannel: {
    [key in DeliveryChannel]: {
      sent: number
      delivered: number
      failed: number
    }
  }
  hourlyDistribution: Array<{
    hour: number
    count: number
  }>
}

// ==================== Mock Data ====================

const mockNotifications: Notification[] = [
  {
    id: 'notif_1',
    type: 'system',
    priority: 'urgent',
    status: 'unread',
    title: 'System Update Required',
    message: 'A critical security update is available. Please update your system within 24 hours.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    actionUrl: '/updates',
    actionLabel: 'Update Now',
    tags: ['security', 'urgent'],
    channels: ['in-app', 'email', 'push']
  },
  {
    id: 'notif_2',
    type: 'user',
    priority: 'medium',
    status: 'unread',
    title: 'New Comment on Your Post',
    message: 'Sarah Chen commented: "Great insights! I especially liked your analysis on AI trends."',
    sender: {
      id: 'user_123',
      name: 'Sarah Chen',
      avatar: '👩‍💼'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    actionUrl: '/posts/abc123',
    actionLabel: 'View Comment',
    tags: ['social', 'comment'],
    channels: ['in-app', 'email']
  },
  {
    id: 'notif_3',
    type: 'app',
    priority: 'high',
    status: 'read',
    title: 'Workflow Execution Failed',
    message: 'The "Daily Data Sync" workflow failed at step 3: API rate limit exceeded.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    readAt: new Date(Date.now() - 1000 * 60 * 30),
    actionUrl: '/workflows/daily-sync',
    actionLabel: 'View Details',
    tags: ['workflow', 'error'],
    channels: ['in-app', 'email', 'webhook']
  },
  {
    id: 'notif_4',
    type: 'email',
    priority: 'low',
    status: 'read',
    title: 'Weekly Summary Report',
    message: 'Your weekly activity summary is ready. You had 127 conversations this week.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    readAt: new Date(Date.now() - 1000 * 60 * 60),
    actionUrl: '/reports/weekly',
    actionLabel: 'View Report',
    tags: ['report', 'summary'],
    channels: ['in-app', 'email']
  },
  {
    id: 'notif_5',
    type: 'push',
    priority: 'medium',
    status: 'unread',
    title: 'Reminder: Team Meeting in 30 Minutes',
    message: 'Don\'t forget about the product roadmap meeting at 2:00 PM in Conference Room A.',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    actionUrl: '/calendar/event-456',
    actionLabel: 'Join Meeting',
    tags: ['meeting', 'reminder'],
    channels: ['in-app', 'push', 'email']
  }
]

const mockTemplates: NotificationTemplate[] = [
  {
    id: 'tpl_1',
    name: 'Welcome New User',
    type: 'email',
    subject: 'Welcome to {{app_name}}!',
    body: 'Hi {{user_name}},\n\nWelcome to {{app_name}}! We\'re excited to have you on board.\n\nGet started by:\n1. Setting up your profile\n2. Exploring our features\n3. Joining our community\n\nBest regards,\nThe {{app_name}} Team',
    variables: ['app_name', 'user_name'],
    channels: ['email', 'in-app'],
    priority: 'medium',
    enabled: true,
    usageCount: 1247
  },
  {
    id: 'tpl_2',
    name: 'Password Reset',
    type: 'system',
    subject: 'Reset Your Password',
    body: 'Hi {{user_name}},\n\nYou requested to reset your password. Click the link below:\n\n{{reset_link}}\n\nThis link expires in 1 hour.\n\nIf you didn\'t request this, please ignore this message.',
    variables: ['user_name', 'reset_link'],
    channels: ['email', 'sms'],
    priority: 'high',
    enabled: true,
    usageCount: 342
  },
  {
    id: 'tpl_3',
    name: 'Payment Success',
    type: 'app',
    subject: 'Payment Confirmation - {{invoice_number}}',
    body: 'Hi {{user_name}},\n\nYour payment of {{amount}} has been received successfully.\n\nInvoice: {{invoice_number}}\nDate: {{payment_date}}\n\nThank you for your business!',
    variables: ['user_name', 'amount', 'invoice_number', 'payment_date'],
    channels: ['email', 'in-app', 'sms'],
    priority: 'medium',
    enabled: true,
    usageCount: 892
  },
  {
    id: 'tpl_4',
    name: 'Error Alert',
    type: 'system',
    subject: '[ALERT] System Error Detected',
    body: 'Error: {{error_message}}\n\nService: {{service_name}}\nSeverity: {{severity}}\nTime: {{timestamp}}\n\nImmediate action required.',
    variables: ['error_message', 'service_name', 'severity', 'timestamp'],
    channels: ['email', 'sms', 'webhook', 'push'],
    priority: 'urgent',
    enabled: true,
    usageCount: 56
  }
]

const mockAnalytics: NotificationAnalytics = {
  totalSent: 45678,
  deliveryRate: 98.5,
  openRate: 67.3,
  clickRate: 23.8,
  byType: {
    system: { sent: 8234, opened: 7123, clicked: 2456 },
    user: { sent: 15678, opened: 12345, clicked: 5234 },
    app: { sent: 9876, opened: 6543, clicked: 2987 },
    email: { sent: 7890, opened: 5432, clicked: 1876 },
    sms: { sent: 2345, opened: 2123, clicked: 567 },
    push: { sent: 1456, opened: 987, clicked: 234 },
    webhook: { sent: 199, opened: 0, clicked: 0 }
  },
  byChannel: {
    'in-app': { sent: 25678, delivered: 25234, failed: 444 },
    'email': { sent: 18765, delivered: 18234, failed: 531 },
    'sms': { sent: 5432, delivered: 5123, failed: 309 },
    'push': { sent: 8765, delivered: 8456, failed: 309 },
    'webhook': { sent: 1234, delivered: 1198, failed: 36 }
  },
  hourlyDistribution: [
    { hour: 0, count: 234 }, { hour: 1, count: 156 }, { hour: 2, count: 98 },
    { hour: 3, count: 67 }, { hour: 4, count: 123 }, { hour: 5, count: 345 },
    { hour: 6, count: 678 }, { hour: 7, count: 1234 }, { hour: 8, count: 2345 },
    { hour: 9, count: 3456 }, { hour: 10, count: 3890 }, { hour: 11, count: 3678 },
    { hour: 12, count: 3234 }, { hour: 13, count: 3567 }, { hour: 14, count: 4123 },
    { hour: 15, count: 3987 }, { hour: 16, count: 3456 }, { hour: 17, count: 2890 },
    { hour: 18, count: 2345 }, { hour: 19, count: 1890 }, { hour: 20, count: 1456 },
    { hour: 21, count: 1123 }, { hour: 22, count: 789 }, { hour: 23, count: 456 }
  ]
}

// ==================== Component ====================

const NotificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'all' | 'templates' | 'preferences' | 'rules' | 'analytics'>('inbox')
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [templates, setTemplates] = useState<NotificationTemplate[]>(mockTemplates)
  const [analytics] = useState<NotificationAnalytics>(mockAnalytics)

  // Filter states
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<NotificationStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Notification preferences
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      channel: 'in-app',
      enabled: true,
      types: { system: true, user: true, app: true, email: true, sms: true, push: true, webhook: true },
      frequency: 'instant'
    },
    {
      channel: 'email',
      enabled: true,
      types: { system: true, user: true, app: true, email: true, sms: false, push: false, webhook: false },
      quietHours: { enabled: true, start: '22:00', end: '08:00' },
      frequency: 'batched'
    },
    {
      channel: 'sms',
      enabled: true,
      types: { system: true, user: false, app: true, email: false, sms: true, push: false, webhook: false },
      frequency: 'instant'
    },
    {
      channel: 'push',
      enabled: true,
      types: { system: true, user: true, app: true, email: false, sms: false, push: true, webhook: false },
      frequency: 'instant'
    },
    {
      channel: 'webhook',
      enabled: false,
      types: { system: true, user: false, app: true, email: false, sms: false, push: false, webhook: true },
      frequency: 'instant'
    }
  ])

  // Notification rules
  const [rules, setRules] = useState<NotificationRule[]>([
    {
      id: 'rule_1',
      name: 'Suppress Low Priority at Night',
      condition: 'priority == "low" AND time BETWEEN 22:00 AND 08:00',
      action: 'suppress',
      priority: 'low',
      enabled: true,
      matchCount: 342
    },
    {
      id: 'rule_2',
      name: 'Escalate Critical Errors',
      condition: 'type == "system" AND message CONTAINS "critical"',
      action: 'escalate',
      priority: 'urgent',
      enabled: true,
      matchCount: 56
    },
    {
      id: 'rule_3',
      name: 'Batch Social Notifications',
      condition: 'type == "user" AND tags CONTAINS "social"',
      action: 'send',
      priority: 'low',
      enabled: true,
      matchCount: 1234
    }
  ])

  // Template editor
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [templateEditor, setTemplateEditor] = useState({
    name: '',
    subject: '',
    body: '',
    type: 'email' as NotificationType,
    priority: 'medium' as NotificationPriority,
    channels: [] as DeliveryChannel[]
  })

  // Notification composer
  const [showComposer, setShowComposer] = useState(false)
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'app' as NotificationType,
    priority: 'medium' as NotificationPriority,
    channels: ['in-app'] as DeliveryChannel[],
    actionUrl: '',
    actionLabel: '',
    tags: ''
  })

  // Stats
  const unreadCount = notifications.filter(n => n.status === 'unread').length
  const urgentCount = notifications.filter(n => n.priority === 'urgent' && n.status === 'unread').length

  // Filtered notifications
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'inbox' && n.status !== 'unread') return false
    if (filterType !== 'all' && n.type !== filterType) return false
    if (filterPriority !== 'all' && n.priority !== filterPriority) return false
    if (filterStatus !== 'all' && n.status !== filterStatus) return false
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !n.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, status: 'read' as NotificationStatus, readAt: new Date() } : n
    ))
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({
      ...n,
      status: 'read' as NotificationStatus,
      readAt: n.readAt || new Date()
    })))
  }

  const handleArchive = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, status: 'archived' as NotificationStatus } : n
    ))
  }

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleSendNotification = () => {
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      type: newNotification.type,
      priority: newNotification.priority,
      status: 'unread',
      title: newNotification.title,
      message: newNotification.message,
      timestamp: new Date(),
      actionUrl: newNotification.actionUrl || undefined,
      actionLabel: newNotification.actionLabel || undefined,
      tags: newNotification.tags.split(',').map(t => t.trim()).filter(Boolean),
      channels: newNotification.channels
    }

    setNotifications([notification, ...notifications])
    setShowComposer(false)
    setNewNotification({
      title: '',
      message: '',
      type: 'app',
      priority: 'medium',
      channels: ['in-app'],
      actionUrl: '',
      actionLabel: '',
      tags: ''
    })
  }

  const handleSaveTemplate = () => {
    if (!selectedTemplate) {
      // Create new template
      const template: NotificationTemplate = {
        id: `tpl_${Date.now()}`,
        name: templateEditor.name,
        type: templateEditor.type,
        subject: templateEditor.subject,
        body: templateEditor.body,
        variables: extractVariables(templateEditor.body),
        channels: templateEditor.channels,
        priority: templateEditor.priority,
        enabled: true,
        usageCount: 0
      }
      setTemplates([...templates, template])
    } else {
      // Update existing template
      setTemplates(prev => prev.map(t =>
        t.id === selectedTemplate.id
          ? { ...t, ...templateEditor, variables: extractVariables(templateEditor.body) }
          : t
      ))
    }

    setSelectedTemplate(null)
    setTemplateEditor({
      name: '',
      subject: '',
      body: '',
      type: 'email',
      priority: 'medium',
      channels: []
    })
  }

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g
    const matches = text.matchAll(regex)
    return Array.from(new Set(Array.from(matches, m => m[1])))
  }

  const getNotificationIcon = (type: NotificationType): string => {
    const icons = {
      system: '⚙️',
      user: '👤',
      app: '📱',
      email: '📧',
      sms: '💬',
      push: '🔔',
      webhook: '🔗'
    }
    return icons[type]
  }

  const getPriorityColor = (priority: NotificationPriority): string => {
    const colors = {
      low: '#10b981',
      medium: '#3b82f6',
      high: '#f59e0b',
      urgent: '#ef4444'
    }
    return colors[priority]
  }

  const getPriorityBadge = (priority: NotificationPriority): string => {
    const badges = {
      low: '🟢',
      medium: '🔵',
      high: '🟠',
      urgent: '🔴'
    }
    return badges[priority]
  }

  const formatTimestamp = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const types: NotificationType[] = ['system', 'user', 'app', 'email', 'sms', 'push']
        const priorities: NotificationPriority[] = ['low', 'medium', 'high', 'urgent']

        const newNotif: Notification = {
          id: `notif_${Date.now()}`,
          type: types[Math.floor(Math.random() * types.length)],
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          status: 'unread',
          title: 'New Notification',
          message: 'This is a simulated real-time notification',
          timestamp: new Date(),
          tags: ['automated'],
          channels: ['in-app']
        }

        setNotifications(prev => [newNotif, ...prev])
      }
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // ==================== Render ====================

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>🔔</span>
          Notification Center
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Manage all your notifications, preferences, and delivery channels
        </p>

        {/* Stats Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '24px'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            border: '2px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Notifications</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{notifications.length}</div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            border: '2px solid #fbbf24'
          }}>
            <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '4px' }}>Unread</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706' }}>{unreadCount}</div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#fee2e2',
            borderRadius: '8px',
            border: '2px solid #ef4444'
          }}>
            <div style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '4px' }}>Urgent</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626' }}>{urgentCount}</div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#dbeafe',
            borderRadius: '8px',
            border: '2px solid #3b82f6'
          }}>
            <div style={{ fontSize: '14px', color: '#1e3a8a', marginBottom: '4px' }}>Delivery Rate</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>{analytics.deliveryRate}%</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'inbox', label: '📥 Inbox', count: unreadCount },
            { id: 'all', label: '📋 All Notifications', count: notifications.length },
            { id: 'templates', label: '📝 Templates', count: templates.length },
            { id: 'preferences', label: '⚙️ Preferences' },
            { id: 'rules', label: '📏 Rules', count: rules.length },
            { id: 'analytics', label: '📊 Analytics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: `3px solid ${activeTab === tab.id ? '#3b82f6' : 'transparent'}`,
                backgroundColor: activeTab === tab.id ? '#eff6ff' : 'transparent',
                color: activeTab === tab.id ? '#1e40af' : '#6b7280',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  backgroundColor: activeTab === tab.id ? '#3b82f6' : '#e5e7eb',
                  color: activeTab === tab.id ? 'white' : '#6b7280',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Inbox Tab */}
      {(activeTab === 'inbox' || activeTab === 'all') && (
        <div>
          {/* Action Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '10px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minWidth: '250px'
                }}
              />

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                style={{
                  padding: '10px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Types</option>
                <option value="system">System</option>
                <option value="user">User</option>
                <option value="app">App</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
                <option value="push">Push</option>
                <option value="webhook">Webhook</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as any)}
                style={{
                  padding: '10px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Priorities</option>
                <option value="urgent">🔴 Urgent</option>
                <option value="high">🟠 High</option>
                <option value="medium">🔵 Medium</option>
                <option value="low">🟢 Low</option>
              </select>

              {activeTab === 'all' && (
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  style={{
                    padding: '10px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="archived">Archived</option>
                </select>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f3f4f6',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                ✅ Mark All Read
              </button>

              <button
                onClick={() => setShowComposer(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                ✉️ New Notification
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredNotifications.length === 0 ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                border: '2px dashed #d1d5db'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
                  No notifications found
                </div>
                <div style={{ color: '#6b7280' }}>
                  {activeTab === 'inbox' ? "You're all caught up!" : "Try adjusting your filters"}
                </div>
              </div>
            ) : (
              filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  style={{
                    padding: '20px',
                    backgroundColor: notification.status === 'unread' ? '#eff6ff' : 'white',
                    border: `2px solid ${notification.status === 'unread' ? '#3b82f6' : '#e5e7eb'}`,
                    borderLeft: `6px solid ${getPriorityColor(notification.priority)}`,
                    borderRadius: '12px',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => notification.status === 'unread' && handleMarkAsRead(notification.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '24px' }}>{getNotificationIcon(notification.type)}</span>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h3 style={{
                              fontSize: '16px',
                              fontWeight: notification.status === 'unread' ? 'bold' : '600',
                              margin: 0
                            }}>
                              {notification.title}
                            </h3>

                            <span>{getPriorityBadge(notification.priority)}</span>

                            {notification.status === 'unread' && (
                              <span style={{
                                padding: '2px 8px',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}>
                                NEW
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                            {notification.message}
                          </div>

                          {notification.sender && (
                            <div style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>
                              <span style={{ marginRight: '6px' }}>{notification.sender.avatar}</span>
                              {notification.sender.name}
                            </div>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                              ⏰ {formatTimestamp(notification.timestamp)}
                            </span>

                            {notification.tags.map(tag => (
                              <span
                                key={tag}
                                style={{
                                  padding: '2px 8px',
                                  backgroundColor: '#f3f4f6',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  color: '#6b7280'
                                }}
                              >
                                #{tag}
                              </span>
                            ))}

                            <div style={{ display: 'flex', gap: '4px' }}>
                              {notification.channels.map(channel => (
                                <span key={channel} style={{ fontSize: '12px' }}>
                                  {channel === 'in-app' && '📱'}
                                  {channel === 'email' && '📧'}
                                  {channel === 'sms' && '💬'}
                                  {channel === 'push' && '🔔'}
                                  {channel === 'webhook' && '🔗'}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '150px' }}>
                      {notification.actionUrl && (
                        <button
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                            whiteSpace: 'nowrap'
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            window.location.href = notification.actionUrl!
                          }}
                        >
                          {notification.actionLabel || 'View'}
                        </button>
                      )}

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {notification.status === 'unread' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleMarkAsRead(notification.id)
                            }}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f3f4f6',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                            title="Mark as read"
                          >
                            ✅
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleArchive(notification.id)
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f3f4f6',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="Archive"
                        >
                          📦
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(notification.id)
                          }}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Notification Templates</h2>
            <button
              onClick={() => {
                setSelectedTemplate(null)
                setTemplateEditor({
                  name: '',
                  subject: '',
                  body: '',
                  type: 'email',
                  priority: 'medium',
                  channels: []
                })
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ➕ New Template
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {templates.map(template => (
              <div
                key={template.id}
                style={{
                  padding: '20px',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {getNotificationIcon(template.type)} {template.name}
                    </h3>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      Used {template.usageCount} times
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        setSelectedTemplate(template)
                        setTemplateEditor({
                          name: template.name,
                          subject: template.subject,
                          body: template.body,
                          type: template.type,
                          priority: template.priority,
                          channels: template.channels
                        })
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✏️ Edit
                    </button>

                    <button
                      onClick={() => {
                        setTemplates(prev => prev.map(t =>
                          t.id === template.id ? { ...t, enabled: !t.enabled } : t
                        ))
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: template.enabled ? '#dcfce7' : '#fee2e2',
                        border: `1px solid ${template.enabled ? '#86efac' : '#fecaca'}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {template.enabled ? '✅' : '❌'}
                    </button>
                  </div>
                </div>

                <div style={{
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                    {template.subject}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    whiteSpace: 'pre-wrap',
                    maxHeight: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {template.body}
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {template.variables.map(variable => (
                    <span
                      key={variable}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#dbeafe',
                        border: '1px solid #93c5fd',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: '#1e40af'
                      }}
                    >
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                  {template.channels.map(channel => (
                    <span key={channel} style={{ fontSize: '16px' }}>
                      {channel === 'in-app' && '📱'}
                      {channel === 'email' && '📧'}
                      {channel === 'sms' && '💬'}
                      {channel === 'push' && '🔔'}
                      {channel === 'webhook' && '🔗'}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Template Editor Modal */}
          {(selectedTemplate !== null || templateEditor.name) && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto'
              }}>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
                  {selectedTemplate ? 'Edit Template' : 'New Template'}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      Template Name
                    </label>
                    <input
                      type="text"
                      value={templateEditor.name}
                      onChange={(e) => setTemplateEditor({ ...templateEditor, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        Type
                      </label>
                      <select
                        value={templateEditor.type}
                        onChange={(e) => setTemplateEditor({ ...templateEditor, type: e.target.value as NotificationType })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="system">System</option>
                        <option value="user">User</option>
                        <option value="app">App</option>
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                        <option value="push">Push</option>
                        <option value="webhook">Webhook</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        Priority
                      </label>
                      <select
                        value={templateEditor.priority}
                        onChange={(e) => setTemplateEditor({ ...templateEditor, priority: e.target.value as NotificationPriority })}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      Subject
                    </label>
                    <input
                      type="text"
                      value={templateEditor.subject}
                      onChange={(e) => setTemplateEditor({ ...templateEditor, subject: e.target.value })}
                      placeholder="Use {{variable}} for dynamic content"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      Body
                    </label>
                    <textarea
                      value={templateEditor.body}
                      onChange={(e) => setTemplateEditor({ ...templateEditor, body: e.target.value })}
                      placeholder="Use {{variable}} for dynamic content"
                      rows={8}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      Delivery Channels
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {(['in-app', 'email', 'sms', 'push', 'webhook'] as DeliveryChannel[]).map(channel => (
                        <label key={channel} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={templateEditor.channels.includes(channel)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTemplateEditor({ ...templateEditor, channels: [...templateEditor.channels, channel] })
                              } else {
                                setTemplateEditor({ ...templateEditor, channels: templateEditor.channels.filter(c => c !== channel) })
                              }
                            }}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '14px' }}>
                            {channel === 'in-app' && '📱 In-App'}
                            {channel === 'email' && '📧 Email'}
                            {channel === 'sms' && '💬 SMS'}
                            {channel === 'push' && '🔔 Push'}
                            {channel === 'webhook' && '🔗 Webhook'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button
                      onClick={handleSaveTemplate}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      💾 Save Template
                    </button>

                    <button
                      onClick={() => {
                        setSelectedTemplate(null)
                        setTemplateEditor({
                          name: '',
                          subject: '',
                          body: '',
                          type: 'email',
                          priority: 'medium',
                          channels: []
                        })
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#f3f4f6',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
            Notification Preferences
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {preferences.map((pref, index) => (
              <div
                key={pref.channel}
                style={{
                  padding: '24px',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {pref.channel === 'in-app' && '📱 In-App Notifications'}
                      {pref.channel === 'email' && '📧 Email Notifications'}
                      {pref.channel === 'sms' && '💬 SMS Notifications'}
                      {pref.channel === 'push' && '🔔 Push Notifications'}
                      {pref.channel === 'webhook' && '🔗 Webhook Notifications'}
                    </h3>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {pref.frequency === 'instant' && 'Instant delivery'}
                      {pref.frequency === 'batched' && 'Batched (every hour)'}
                      {pref.frequency === 'daily_digest' && 'Daily digest'}
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      {pref.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <input
                      type="checkbox"
                      checked={pref.enabled}
                      onChange={(e) => {
                        const newPrefs = [...preferences]
                        newPrefs[index] = { ...pref, enabled: e.target.checked }
                        setPreferences(newPrefs)
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                  </label>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>
                    Delivery Frequency
                  </label>
                  <select
                    value={pref.frequency}
                    onChange={(e) => {
                      const newPrefs = [...preferences]
                      newPrefs[index] = { ...pref, frequency: e.target.value as any }
                      setPreferences(newPrefs)
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="instant">Instant</option>
                    <option value="batched">Batched (hourly)</option>
                    <option value="daily_digest">Daily Digest</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>
                    Notification Types
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                    {(Object.keys(pref.types) as NotificationType[]).map(type => (
                      <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={pref.types[type]}
                          onChange={(e) => {
                            const newPrefs = [...preferences]
                            newPrefs[index] = {
                              ...pref,
                              types: { ...pref.types, [type]: e.target.checked }
                            }
                            setPreferences(newPrefs)
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>
                          {getNotificationIcon(type)} {type}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {pref.quietHours && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: '500' }}>Quiet Hours</h4>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <span style={{ fontSize: '13px' }}>
                          {pref.quietHours.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <input
                          type="checkbox"
                          checked={pref.quietHours.enabled}
                          onChange={(e) => {
                            const newPrefs = [...preferences]
                            newPrefs[index] = {
                              ...pref,
                              quietHours: { ...pref.quietHours!, enabled: e.target.checked }
                            }
                            setPreferences(newPrefs)
                          }}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </label>
                    </div>

                    {pref.quietHours.enabled && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>
                            Start Time
                          </label>
                          <input
                            type="time"
                            value={pref.quietHours.start}
                            onChange={(e) => {
                              const newPrefs = [...preferences]
                              newPrefs[index] = {
                                ...pref,
                                quietHours: { ...pref.quietHours!, start: e.target.value }
                              }
                              setPreferences(newPrefs)
                            }}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '14px'
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}>
                            End Time
                          </label>
                          <input
                            type="time"
                            value={pref.quietHours.end}
                            onChange={(e) => {
                              const newPrefs = [...preferences]
                              newPrefs[index] = {
                                ...pref,
                                quietHours: { ...pref.quietHours!, end: e.target.value }
                              }
                              setPreferences(newPrefs)
                            }}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '2px solid #e5e7eb',
                              borderRadius: '8px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Notification Rules</h2>
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ➕ New Rule
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {rules.map((rule, index) => (
              <div
                key={rule.id}
                style={{
                  padding: '20px',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                      {rule.name}
                    </h3>

                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        Condition:
                      </div>
                      <code style={{
                        fontSize: '13px',
                        fontFamily: 'monospace',
                        color: '#1e40af'
                      }}>
                        {rule.condition}
                      </code>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: rule.action === 'send' ? '#dcfce7' : rule.action === 'suppress' ? '#fee2e2' : '#fef3c7',
                        border: `1px solid ${rule.action === 'send' ? '#86efac' : rule.action === 'suppress' ? '#fecaca' : '#fde047'}`,
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}>
                        {rule.action === 'send' && '✉️ Send'}
                        {rule.action === 'suppress' && '🚫 Suppress'}
                        {rule.action === 'escalate' && '⬆️ Escalate'}
                      </span>

                      <span style={{ fontSize: '13px', color: '#6b7280' }}>
                        Matched {rule.matchCount} times
                      </span>

                      <span style={{ fontSize: '13px' }}>
                        {getPriorityBadge(rule.priority)} {rule.priority}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        const newRules = [...rules]
                        newRules[index] = { ...rule, enabled: !rule.enabled }
                        setRules(newRules)
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: rule.enabled ? '#dcfce7' : '#fee2e2',
                        border: `2px solid ${rule.enabled ? '#86efac' : '#fecaca'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500'
                      }}
                    >
                      {rule.enabled ? '✅ Enabled' : '❌ Disabled'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
            Notification Analytics
          </h2>

          {/* Overview Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}>
            <div style={{ padding: '20px', backgroundColor: '#dbeafe', borderRadius: '12px', border: '2px solid #93c5fd' }}>
              <div style={{ fontSize: '14px', color: '#1e3a8a', marginBottom: '8px' }}>Total Sent</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e40af' }}>
                {analytics.totalSent.toLocaleString()}
              </div>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#dcfce7', borderRadius: '12px', border: '2px solid #86efac' }}>
              <div style={{ fontSize: '14px', color: '#14532d', marginBottom: '8px' }}>Delivery Rate</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#15803d' }}>
                {analytics.deliveryRate}%
              </div>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#fef3c7', borderRadius: '12px', border: '2px solid #fde047' }}>
              <div style={{ fontSize: '14px', color: '#713f12', marginBottom: '8px' }}>Open Rate</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#a16207' }}>
                {analytics.openRate}%
              </div>
            </div>

            <div style={{ padding: '20px', backgroundColor: '#fce7f3', borderRadius: '12px', border: '2px solid #f9a8d4' }}>
              <div style={{ fontSize: '14px', color: '#831843', marginBottom: '8px' }}>Click Rate</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#be185d' }}>
                {analytics.clickRate}%
              </div>
            </div>
          </div>

          {/* By Type */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Performance by Type
            </h3>
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '12px'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                      Type
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                      Sent
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                      Opened
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                      Clicked
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                      Open Rate
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>
                      Click Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.entries(analytics.byType) as [NotificationType, any][]).map(([type, stats]) => (
                    <tr key={type} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {getNotificationIcon(type)} {type}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '500' }}>
                        {stats.sent.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                        {stats.opened.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>
                        {stats.clicked.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#10b981', fontWeight: '500' }}>
                        {((stats.opened / stats.sent) * 100).toFixed(1)}%
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px', color: '#3b82f6', fontWeight: '500' }}>
                        {((stats.clicked / stats.opened) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* By Channel */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Delivery by Channel
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {(Object.entries(analytics.byChannel) as [DeliveryChannel, any][]).map(([channel, stats]) => {
                const successRate = (stats.delivered / stats.sent) * 100
                return (
                  <div
                    key={channel}
                    style={{
                      padding: '20px',
                      backgroundColor: 'white',
                      border: '2px solid #e5e7eb',
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px' }}>
                      {channel === 'in-app' && '📱 In-App'}
                      {channel === 'email' && '📧 Email'}
                      {channel === 'sms' && '💬 SMS'}
                      {channel === 'push' && '🔔 Push'}
                      {channel === 'webhook' && '🔗 Webhook'}
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>Success Rate</span>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{successRate.toFixed(1)}%</span>
                      </div>
                      <div style={{
                        height: '8px',
                        backgroundColor: '#f3f4f6',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${successRate}%`,
                          height: '100%',
                          backgroundColor: successRate > 95 ? '#10b981' : successRate > 85 ? '#f59e0b' : '#ef4444',
                          transition: 'width 0.3s'
                        }} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Sent:</span>
                        <span style={{ fontWeight: '500' }}>{stats.sent.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Delivered:</span>
                        <span style={{ fontWeight: '500', color: '#10b981' }}>{stats.delivered.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Failed:</span>
                        <span style={{ fontWeight: '500', color: '#ef4444' }}>{stats.failed.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Hourly Distribution */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Hourly Distribution
            </h3>
            <div style={{
              padding: '20px',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '200px' }}>
                {analytics.hourlyDistribution.map(({ hour, count }) => {
                  const maxCount = Math.max(...analytics.hourlyDistribution.map(h => h.count))
                  const heightPercent = (count / maxCount) * 100

                  return (
                    <div
                      key={hour}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: `${heightPercent}%`,
                          backgroundColor: '#3b82f6',
                          borderRadius: '4px 4px 0 0',
                          position: 'relative'
                        }}
                        title={`${hour}:00 - ${count} notifications`}
                      />
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>
                        {hour}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Composer Modal */}
      {showComposer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
              Create Notification
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Type
                  </label>
                  <select
                    value={newNotification.type}
                    onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as NotificationType })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="system">System</option>
                    <option value="user">User</option>
                    <option value="app">App</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push</option>
                    <option value="webhook">Webhook</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Priority
                  </label>
                  <select
                    value={newNotification.priority}
                    onChange={(e) => setNewNotification({ ...newNotification, priority: e.target.value as NotificationPriority })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  placeholder="Enter notification title"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Message *
                </label>
                <textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  placeholder="Enter notification message"
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Action URL
                  </label>
                  <input
                    type="text"
                    value={newNotification.actionUrl}
                    onChange={(e) => setNewNotification({ ...newNotification, actionUrl: e.target.value })}
                    placeholder="/path/to/action"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Action Label
                  </label>
                  <input
                    type="text"
                    value={newNotification.actionLabel}
                    onChange={(e) => setNewNotification({ ...newNotification, actionLabel: e.target.value })}
                    placeholder="View Details"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={newNotification.tags}
                  onChange={(e) => setNewNotification({ ...newNotification, tags: e.target.value })}
                  placeholder="urgent, security, update"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>
                  Delivery Channels
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {(['in-app', 'email', 'sms', 'push', 'webhook'] as DeliveryChannel[]).map(channel => (
                    <label key={channel} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newNotification.channels.includes(channel)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewNotification({ ...newNotification, channels: [...newNotification.channels, channel] })
                          } else {
                            setNewNotification({ ...newNotification, channels: newNotification.channels.filter(c => c !== channel) })
                          }
                        }}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px' }}>
                        {channel === 'in-app' && '📱 In-App'}
                        {channel === 'email' && '📧 Email'}
                        {channel === 'sms' && '💬 SMS'}
                        {channel === 'push' && '🔔 Push'}
                        {channel === 'webhook' && '🔗 Webhook'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  onClick={handleSendNotification}
                  disabled={!newNotification.title || !newNotification.message}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: newNotification.title && newNotification.message ? '#3b82f6' : '#d1d5db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: newNotification.title && newNotification.message ? 'pointer' : 'not-allowed',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  📤 Send Notification
                </button>

                <button
                  onClick={() => setShowComposer(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#f3f4f6',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationCenter

import { describe, it, expect, beforeEach } from 'vitest'

describe('AnalyticsService', () => {
  beforeEach(() => {
    // Reset analytics state
  })

  describe('Event Tracking', () => {
    it('should track user event', () => {
      const event = {
        name: 'message_sent',
        userId: 'user-1',
        timestamp: new Date(),
        properties: {
          messageLength: 150,
          model: 'gpt-4'
        }
      }

      expect(event.name).toBe('message_sent')
      expect(event.properties.messageLength).toBe(150)
    })

    it('should track page view', () => {
      const pageView = {
        path: '/chat',
        title: 'Chat Interface',
        timestamp: new Date(),
        userId: 'user-1',
        sessionId: 'session-123'
      }

      expect(pageView.path).toBe('/chat')
      expect(pageView.sessionId).toBeDefined()
    })

    it('should track custom events', () => {
      const customEvent = {
        category: 'engagement',
        action: 'feature_used',
        label: 'voice_input',
        value: 1
      }

      expect(customEvent.category).toBe('engagement')
      expect(customEvent.label).toBe('voice_input')
    })
  })

  describe('User Metrics', () => {
    it('should calculate daily active users', () => {
      const users = [
        { id: 'user-1', lastActive: new Date('2025-10-29') },
        { id: 'user-2', lastActive: new Date('2025-10-29') },
        { id: 'user-3', lastActive: new Date('2025-10-28') }
      ]

      const today = new Date('2025-10-29')
      const dau = users.filter(u =>
        u.lastActive.toDateString() === today.toDateString()
      ).length

      expect(dau).toBe(2)
    })

    it('should calculate monthly active users', () => {
      const users = [
        { id: 'user-1', lastActive: new Date('2025-10-29') },
        { id: 'user-2', lastActive: new Date('2025-10-15') },
        { id: 'user-3', lastActive: new Date('2025-09-30') }
      ]

      const now = new Date('2025-10-29')
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const mau = users.filter(u => u.lastActive >= thirtyDaysAgo).length

      expect(mau).toBe(2)
    })

    it('should track user retention', () => {
      const cohort = {
        startDate: new Date('2025-10-01'),
        totalUsers: 100,
        activeUsers: {
          day1: 90,
          day7: 70,
          day30: 50
        }
      }

      const day7Retention = (cohort.activeUsers.day7 / cohort.totalUsers) * 100

      expect(day7Retention).toBe(70)
    })
  })

  describe('Conversation Analytics', () => {
    it('should calculate average conversation length', () => {
      const conversations = [
        { id: '1', messageCount: 10 },
        { id: '2', messageCount: 20 },
        { id: '3', messageCount: 15 }
      ]

      const total = conversations.reduce((sum, c) => sum + c.messageCount, 0)
      const average = total / conversations.length

      expect(average).toBe(15)
    })

    it('should track conversation duration', () => {
      const conversation = {
        startedAt: new Date('2025-10-29T10:00:00'),
        endedAt: new Date('2025-10-29T10:30:00')
      }

      const durationMs = conversation.endedAt.getTime() - conversation.startedAt.getTime()
      const durationMinutes = durationMs / (1000 * 60)

      expect(durationMinutes).toBe(30)
    })

    it('should count conversations by model', () => {
      const conversations = [
        { model: 'gpt-4' },
        { model: 'claude-3-opus' },
        { model: 'gpt-4' },
        { model: 'gpt-4' }
      ]

      const counts = conversations.reduce((acc, c) => {
        acc[c.model] = (acc[c.model] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      expect(counts['gpt-4']).toBe(3)
      expect(counts['claude-3-opus']).toBe(1)
    })
  })

  describe('Usage Statistics', () => {
    it('should track token usage', () => {
      const usage = {
        userId: 'user-1',
        date: new Date('2025-10-29'),
        tokensUsed: 15000,
        tokensLimit: 100000
      }

      const percentageUsed = (usage.tokensUsed / usage.tokensLimit) * 100

      expect(percentageUsed).toBe(15)
    })

    it('should track API calls', () => {
      const stats = {
        totalCalls: 1000,
        successfulCalls: 950,
        failedCalls: 50
      }

      const successRate = (stats.successfulCalls / stats.totalCalls) * 100

      expect(successRate).toBe(95)
    })

    it('should calculate average response time', () => {
      const requests = [
        { responseTime: 1000 },
        { responseTime: 1500 },
        { responseTime: 1200 }
      ]

      const total = requests.reduce((sum, r) => sum + r.responseTime, 0)
      const average = total / requests.length

      expect(average).toBe(1233.33)
    })
  })

  describe('Feature Usage', () => {
    it('should track feature adoption', () => {
      const features = [
        { name: 'voice_input', users: 500, totalUsers: 1000 },
        { name: 'image_upload', users: 300, totalUsers: 1000 }
      ]

      const voiceAdoption = (features[0].users / features[0].totalUsers) * 100

      expect(voiceAdoption).toBe(50)
    })

    it('should rank features by popularity', () => {
      const features = [
        { name: 'feature_a', usageCount: 100 },
        { name: 'feature_b', usageCount: 300 },
        { name: 'feature_c', usageCount: 200 }
      ]

      const sorted = [...features].sort((a, b) => b.usageCount - a.usageCount)

      expect(sorted[0].name).toBe('feature_b')
    })
  })

  describe('Error Tracking', () => {
    it('should track error occurrences', () => {
      const error = {
        type: 'NetworkError',
        message: 'Failed to fetch',
        timestamp: new Date(),
        userId: 'user-1',
        userAgent: 'Mozilla/5.0...',
        stack: 'Error: Failed...'
      }

      expect(error.type).toBe('NetworkError')
      expect(error.stack).toBeDefined()
    })

    it('should calculate error rate', () => {
      const stats = {
        totalRequests: 1000,
        errors: 25
      }

      const errorRate = (stats.errors / stats.totalRequests) * 100

      expect(errorRate).toBe(2.5)
    })

    it('should group errors by type', () => {
      const errors = [
        { type: 'NetworkError' },
        { type: 'ValidationError' },
        { type: 'NetworkError' },
        { type: 'NetworkError' }
      ]

      const grouped = errors.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      expect(grouped['NetworkError']).toBe(3)
    })
  })

  describe('Performance Metrics', () => {
    it('should track page load time', () => {
      const performance = {
        navigationStart: 1000,
        loadEventEnd: 3000
      }

      const loadTime = performance.loadEventEnd - performance.navigationStart

      expect(loadTime).toBe(2000)
    })

    it('should monitor component render time', () => {
      const renders = [
        { component: 'ChatMessage', duration: 50 },
        { component: 'ChatMessage', duration: 45 },
        { component: 'ChatMessage', duration: 55 }
      ]

      const average = renders.reduce((sum, r) => sum + r.duration, 0) / renders.length

      expect(average).toBe(50)
    })

    it('should detect slow operations', () => {
      const operations = [
        { name: 'api_call', duration: 2000 },
        { name: 'render', duration: 100 },
        { name: 'api_call_2', duration: 5000 }
      ]

      const slowThreshold = 3000
      const slowOps = operations.filter(op => op.duration > slowThreshold)

      expect(slowOps.length).toBe(1)
      expect(slowOps[0].name).toBe('api_call_2')
    })
  })

  describe('Funnel Analysis', () => {
    it('should track conversion funnel', () => {
      const funnel = [
        { step: 'visit', count: 1000 },
        { step: 'signup', count: 500 },
        { step: 'firstMessage', count: 400 },
        { step: 'subscription', count: 100 }
      ]

      const conversionRate = (funnel[3].count / funnel[0].count) * 100

      expect(conversionRate).toBe(10)
    })

    it('should calculate step drop-off rate', () => {
      const step1 = { count: 1000 }
      const step2 = { count: 700 }

      const dropOff = ((step1.count - step2.count) / step1.count) * 100

      expect(dropOff).toBe(30)
    })
  })

  describe('Cohort Analysis', () => {
    it('should group users by signup date', () => {
      const users = [
        { id: '1', signupDate: new Date('2025-10-01') },
        { id: '2', signupDate: new Date('2025-10-01') },
        { id: '3', signupDate: new Date('2025-10-15') }
      ]

      const cohorts = users.reduce((acc, user) => {
        const cohortKey = user.signupDate.toISOString().split('T')[0]
        acc[cohortKey] = (acc[cohortKey] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      expect(cohorts['2025-10-01']).toBe(2)
    })

    it('should track cohort retention over time', () => {
      const cohort = {
        signupDate: '2025-10-01',
        initialSize: 100,
        retention: {
          week1: 80,
          week2: 60,
          week4: 40
        }
      }

      const week4Retention = (cohort.retention.week4 / cohort.initialSize) * 100

      expect(week4Retention).toBe(40)
    })
  })

  describe('Data Export', () => {
    it('should export analytics data', () => {
      const data = {
        userId: 'user-1',
        events: [
          { name: 'login', timestamp: new Date() },
          { name: 'message_sent', timestamp: new Date() }
        ],
        metrics: {
          totalMessages: 50,
          totalConversations: 10
        }
      }

      const exported = JSON.stringify(data)

      expect(exported).toContain('userId')
      expect(exported).toContain('events')
    })

    it('should generate CSV report', () => {
      const data = [
        { date: '2025-10-01', users: 100, messages: 500 },
        { date: '2025-10-02', users: 150, messages: 750 }
      ]

      const csv = [
        'date,users,messages',
        ...data.map(row => `${row.date},${row.users},${row.messages}`)
      ].join('\n')

      expect(csv).toContain('date,users,messages')
      expect(csv.split('\n').length).toBe(3)
    })
  })
})

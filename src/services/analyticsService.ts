export interface ConversationMetrics {
  totalConversations: number
  totalMessages: number
  totalTokens: number
  averageMessagesPerConversation: number
  averageTokensPerMessage: number
  conversationDuration: number // in minutes
  responseTime: number // average in seconds
  userSatisfaction?: number // 1-5 scale
}

export interface ModelUsageStats {
  modelId: string
  modelName: string
  usageCount: number
  totalTokens: number
  averageResponseTime: number
  successRate: number
  errorCount: number
  lastUsed: number
}

export interface TimeSeriesData {
  timestamp: number
  conversations: number
  messages: number
  tokens: number
  errors: number
}

export interface TopicAnalysis {
  topic: string
  frequency: number
  keywords: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  averageLength: number
}

export interface UserBehaviorPattern {
  peakHours: number[]
  preferredModels: string[]
  averageSessionLength: number
  conversationTypes: Record<string, number>
  messageFrequency: 'low' | 'medium' | 'high'
}

export interface AnalyticsReport {
  period: {
    start: number
    end: number
    type: 'day' | 'week' | 'month' | 'year' | 'custom'
  }
  overview: ConversationMetrics
  modelStats: ModelUsageStats[]
  timeSeries: TimeSeriesData[]
  topicAnalysis: TopicAnalysis[]
  userBehavior: UserBehaviorPattern
  insights: string[]
  recommendations: string[]
}

export interface AnalyticsSettings {
  enableTracking: boolean
  trackDetailedMetrics: boolean
  retentionDays: number
  anonymizeData: boolean
  includeContent: boolean
  exportFormat: 'json' | 'csv' | 'pdf'
}

class AnalyticsService {
  private static instance: AnalyticsService
  private settings: AnalyticsSettings
  private events: any[] = []
  private sessionStartTime: number = Date.now()
  private listeners: Map<string, Function[]> = new Map()

  private constructor() {
    this.settings = this.getDefaultSettings()
    this.loadSettings()
    this.initializeTracking()
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService()
    }
    return AnalyticsService.instance
  }

  private getDefaultSettings(): AnalyticsSettings {
    return {
      enableTracking: true,
      trackDetailedMetrics: false,
      retentionDays: 90,
      anonymizeData: true,
      includeContent: false,
      exportFormat: 'json'
    }
  }

  private initializeTracking(): void {
    if (!this.settings.enableTracking) return

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('session_pause', { timestamp: Date.now() })
      } else {
        this.trackEvent('session_resume', { timestamp: Date.now() })
      }
    })

    // Track before page unload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('session_end', {
        duration: Date.now() - this.sessionStartTime,
        timestamp: Date.now()
      })
      this.saveEvents()
    })

    // Periodic save
    setInterval(() => {
      this.saveEvents()
    }, 30000) // Save every 30 seconds
  }

  // Event tracking methods
  public trackConversationCreated(conversationId: string, title: string, model?: string): void {
    if (!this.settings.enableTracking) return

    this.trackEvent('conversation_created', {
      conversationId: this.anonymizeId(conversationId),
      title: this.settings.includeContent ? title : 'conversation',
      model,
      timestamp: Date.now()
    })
  }

  public trackMessageSent(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    contentLength: number,
    model?: string
  ): void {
    if (!this.settings.enableTracking) return

    this.trackEvent('message_sent', {
      conversationId: this.anonymizeId(conversationId),
      role,
      contentLength,
      model,
      timestamp: Date.now()
    })
  }

  public trackTokenUsage(
    conversationId: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
    totalTokens: number
  ): void {
    if (!this.settings.enableTracking) return

    this.trackEvent('token_usage', {
      conversationId: this.anonymizeId(conversationId),
      model,
      promptTokens,
      completionTokens,
      totalTokens,
      timestamp: Date.now()
    })
  }

  public trackResponseTime(
    conversationId: string,
    model: string,
    responseTime: number,
    success: boolean,
    error?: string
  ): void {
    if (!this.settings.enableTracking) return

    this.trackEvent('response_time', {
      conversationId: this.anonymizeId(conversationId),
      model,
      responseTime,
      success,
      error: error ? 'error_occurred' : undefined,
      timestamp: Date.now()
    })
  }

  public trackFeatureUsage(feature: string, action: string, metadata?: any): void {
    if (!this.settings.enableTracking) return

    this.trackEvent('feature_usage', {
      feature,
      action,
      metadata: this.settings.trackDetailedMetrics ? metadata : undefined,
      timestamp: Date.now()
    })
  }

  public trackUserSatisfaction(conversationId: string, rating: number, feedback?: string): void {
    if (!this.settings.enableTracking) return

    this.trackEvent('user_satisfaction', {
      conversationId: this.anonymizeId(conversationId),
      rating,
      feedback: this.settings.includeContent && feedback ? feedback : undefined,
      timestamp: Date.now()
    })
  }

  public trackError(error: string, context: string, stack?: string): void {
    if (!this.settings.enableTracking) return

    this.trackEvent('error', {
      error: this.settings.includeContent ? error : 'error_occurred',
      context,
      stack: this.settings.trackDetailedMetrics && stack ? stack : undefined,
      timestamp: Date.now()
    })
  }

  // Analytics generation methods
  public async generateReport(
    startDate: Date,
    endDate: Date,
    type: 'day' | 'week' | 'month' | 'year' | 'custom' = 'week'
  ): Promise<AnalyticsReport> {
    const events = this.getEventsInRange(startDate.getTime(), endDate.getTime())

    const overview = this.calculateOverviewMetrics(events)
    const modelStats = this.calculateModelStats(events)
    const timeSeries = this.generateTimeSeries(events, startDate, endDate, type)
    const topicAnalysis = this.analyzeTopics(events)
    const userBehavior = this.analyzeUserBehavior(events)
    const insights = this.generateInsights(overview, modelStats, userBehavior)
    const recommendations = this.generateRecommendations(overview, modelStats, userBehavior)

    return {
      period: {
        start: startDate.getTime(),
        end: endDate.getTime(),
        type
      },
      overview,
      modelStats,
      timeSeries,
      topicAnalysis,
      userBehavior,
      insights,
      recommendations
    }
  }

  private calculateOverviewMetrics(events: any[]): ConversationMetrics {
    const conversationEvents = events.filter(e => e.type === 'conversation_created')
    const messageEvents = events.filter(e => e.type === 'message_sent')
    const tokenEvents = events.filter(e => e.type === 'token_usage')
    const responseEvents = events.filter(e => e.type === 'response_time')
    const satisfactionEvents = events.filter(e => e.type === 'user_satisfaction')

    const totalConversations = conversationEvents.length
    const totalMessages = messageEvents.length
    const totalTokens = tokenEvents.reduce((sum, event) => sum + (event.data.totalTokens || 0), 0)

    const averageMessagesPerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0
    const averageTokensPerMessage = totalMessages > 0 ? totalTokens / totalMessages : 0

    // Calculate conversation duration (simplified)
    const conversationDuration = totalConversations > 0 ?
      (events[events.length - 1]?.timestamp - events[0]?.timestamp) / (1000 * 60 * totalConversations) : 0

    const responseTime = responseEvents.length > 0 ?
      responseEvents.reduce((sum, event) => sum + event.data.responseTime, 0) / responseEvents.length : 0

    const userSatisfaction = satisfactionEvents.length > 0 ?
      satisfactionEvents.reduce((sum, event) => sum + event.data.rating, 0) / satisfactionEvents.length : undefined

    return {
      totalConversations,
      totalMessages,
      totalTokens,
      averageMessagesPerConversation,
      averageTokensPerMessage,
      conversationDuration,
      responseTime,
      userSatisfaction
    }
  }

  private calculateModelStats(events: any[]): ModelUsageStats[] {
    const modelEvents = events.filter(e => e.data.model)
    const modelMap = new Map<string, any>()

    modelEvents.forEach(event => {
      const model = event.data.model
      if (!modelMap.has(model)) {
        modelMap.set(model, {
          modelId: model,
          modelName: model,
          usageCount: 0,
          totalTokens: 0,
          totalResponseTime: 0,
          responseCount: 0,
          successCount: 0,
          errorCount: 0,
          lastUsed: 0
        })
      }

      const stats = modelMap.get(model)

      if (event.type === 'message_sent') {
        stats.usageCount++
      }

      if (event.type === 'token_usage') {
        stats.totalTokens += event.data.totalTokens || 0
      }

      if (event.type === 'response_time') {
        stats.totalResponseTime += event.data.responseTime
        stats.responseCount++
        if (event.data.success) {
          stats.successCount++
        } else {
          stats.errorCount++
        }
      }

      stats.lastUsed = Math.max(stats.lastUsed, event.timestamp)
    })

    return Array.from(modelMap.values()).map(stats => ({
      ...stats,
      averageResponseTime: stats.responseCount > 0 ? stats.totalResponseTime / stats.responseCount : 0,
      successRate: stats.responseCount > 0 ? stats.successCount / stats.responseCount : 0
    }))
  }

  private generateTimeSeries(
    events: any[],
    startDate: Date,
    endDate: Date,
    type: 'day' | 'week' | 'month' | 'year' | 'custom'
  ): TimeSeriesData[] {
    const intervals = this.getTimeIntervals(startDate, endDate, type)

    return intervals.map(interval => {
      const intervalEvents = events.filter(e =>
        e.timestamp >= interval.start && e.timestamp < interval.end
      )

      return {
        timestamp: interval.start,
        conversations: intervalEvents.filter(e => e.type === 'conversation_created').length,
        messages: intervalEvents.filter(e => e.type === 'message_sent').length,
        tokens: intervalEvents
          .filter(e => e.type === 'token_usage')
          .reduce((sum, e) => sum + (e.data.totalTokens || 0), 0),
        errors: intervalEvents.filter(e => e.type === 'error').length
      }
    })
  }

  private analyzeTopics(events: any[]): TopicAnalysis[] {
    // Simplified topic analysis based on conversation creation
    const conversationEvents = events.filter(e => e.type === 'conversation_created')
    const topics = new Map<string, any>()

    conversationEvents.forEach(event => {
      const title = event.data.title
      if (title && this.settings.includeContent) {
        // Simple keyword extraction
        const keywords = this.extractKeywords(title)
        keywords.forEach(keyword => {
          if (!topics.has(keyword)) {
            topics.set(keyword, {
              topic: keyword,
              frequency: 0,
              keywords: [keyword],
              sentiment: 'neutral',
              averageLength: 0,
              totalLength: 0
            })
          }
          const topic = topics.get(keyword)
          topic.frequency++
          topic.totalLength += title.length
          topic.averageLength = topic.totalLength / topic.frequency
        })
      }
    })

    return Array.from(topics.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
  }

  private analyzeUserBehavior(events: any[]): UserBehaviorPattern {
    const messageEvents = events.filter(e => e.type === 'message_sent')
    const conversationEvents = events.filter(e => e.type === 'conversation_created')

    // Peak hours analysis
    const hourCounts = new Array(24).fill(0)
    messageEvents.forEach(event => {
      const hour = new Date(event.timestamp).getHours()
      hourCounts[hour]++
    })
    const maxCount = Math.max(...hourCounts)
    const peakHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count > maxCount * 0.7)
      .map(({ hour }) => hour)

    // Preferred models
    const modelCounts = new Map<string, number>()
    messageEvents.forEach(event => {
      if (event.data.model) {
        modelCounts.set(event.data.model, (modelCounts.get(event.data.model) || 0) + 1)
      }
    })
    const preferredModels = Array.from(modelCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([model]) => model)

    // Session length (simplified)
    const averageSessionLength = events.length > 0 ?
      (events[events.length - 1]?.timestamp - events[0]?.timestamp) / (1000 * 60) : 0

    // Conversation types (placeholder)
    const conversationTypes = {
      'general': conversationEvents.length * 0.4,
      'technical': conversationEvents.length * 0.3,
      'creative': conversationEvents.length * 0.2,
      'research': conversationEvents.length * 0.1
    }

    // Message frequency
    const totalDays = Math.max(1, (Date.now() - (events[0]?.timestamp || Date.now())) / (1000 * 60 * 60 * 24))
    const messagesPerDay = messageEvents.length / totalDays
    const messageFrequency = messagesPerDay > 20 ? 'high' : messagesPerDay > 5 ? 'medium' : 'low'

    return {
      peakHours,
      preferredModels,
      averageSessionLength,
      conversationTypes,
      messageFrequency
    }
  }

  private generateInsights(
    overview: ConversationMetrics,
    modelStats: ModelUsageStats[],
    userBehavior: UserBehaviorPattern
  ): string[] {
    const insights: string[] = []

    if (overview.averageMessagesPerConversation > 15) {
      insights.push('您的对话倾向于深入探讨，平均每个对话包含较多轮次的交流')
    }

    if (overview.userSatisfaction && overview.userSatisfaction > 4) {
      insights.push('用户满意度很高，说明AI助手表现优秀')
    }

    if (userBehavior.messageFrequency === 'high') {
      insights.push('您是AI助手的重度用户，活跃度很高')
    }

    const topModel = modelStats.sort((a, b) => b.usageCount - a.usageCount)[0]
    if (topModel) {
      insights.push(`${topModel.modelName} 是您最常使用的模型`)
    }

    if (userBehavior.peakHours.length <= 3) {
      insights.push(`您通常在 ${userBehavior.peakHours.join(', ')} 点使用AI助手`)
    }

    return insights
  }

  private generateRecommendations(
    overview: ConversationMetrics,
    modelStats: ModelUsageStats[],
    userBehavior: UserBehaviorPattern
  ): string[] {
    const recommendations: string[] = []

    if (overview.averageTokensPerMessage < 50) {
      recommendations.push('尝试提供更详细的上下文，可以获得更好的回答质量')
    }

    const slowModels = modelStats.filter(m => m.averageResponseTime > 5000)
    if (slowModels.length > 0) {
      recommendations.push('考虑尝试响应速度更快的模型以提升体验')
    }

    if (userBehavior.messageFrequency === 'low') {
      recommendations.push('定期使用AI助手可以帮助您更好地熟悉其能力')
    }

    if (overview.totalTokens > 50000) {
      recommendations.push('您的Token使用量较高，可以考虑优化提示词以提高效率')
    }

    return recommendations
  }

  // Utility methods
  private trackEvent(type: string, data: any): void {
    if (!this.settings.enableTracking) return

    this.events.push({
      type,
      data,
      timestamp: Date.now(),
      id: this.generateEventId()
    })

    // Limit memory usage
    if (this.events.length > 10000) {
      this.events = this.events.slice(-5000)
    }

    this.emit('event_tracked', { type, data })
  }

  private getEventsInRange(start: number, end: number): any[] {
    return this.events.filter(event =>
      event.timestamp >= start && event.timestamp <= end
    )
  }

  private getTimeIntervals(
    startDate: Date,
    endDate: Date,
    type: 'day' | 'week' | 'month' | 'year' | 'custom'
  ): Array<{ start: number; end: number }> {
    const intervals: Array<{ start: number; end: number }> = []
    const current = new Date(startDate)

    while (current < endDate) {
      const start = current.getTime()

      switch (type) {
        case 'day':
          current.setDate(current.getDate() + 1)
          break
        case 'week':
          current.setDate(current.getDate() + 7)
          break
        case 'month':
          current.setMonth(current.getMonth() + 1)
          break
        case 'year':
          current.setFullYear(current.getFullYear() + 1)
          break
        default:
          current.setHours(current.getHours() + 1)
      }

      intervals.push({
        start,
        end: Math.min(current.getTime(), endDate.getTime())
      })
    }

    return intervals
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction
    return text
      .toLowerCase()
      .split(/[\s\-_]+/)
      .filter(word => word.length > 2)
      .slice(0, 5)
  }

  private anonymizeId(id: string): string {
    if (!this.settings.anonymizeData) return id

    // Simple hash-based anonymization
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `anon_${Math.abs(hash).toString(36)}`
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Settings management
  public getSettings(): AnalyticsSettings {
    return { ...this.settings }
  }

  public updateSettings(updates: Partial<AnalyticsSettings>): void {
    this.settings = { ...this.settings, ...updates }
    this.saveSettings()
    this.emit('settings_updated', this.settings)
  }

  // Data export
  public async exportData(format: 'json' | 'csv' | 'pdf' = 'json'): Promise<string> {
    const report = await this.generateReport(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      new Date(),
      'day'
    )

    switch (format) {
      case 'csv':
        return this.exportToCSV(report)
      case 'pdf':
        return this.exportToPDF(report)
      default:
        return JSON.stringify(report, null, 2)
    }
  }

  private exportToCSV(report: AnalyticsReport): string {
    const lines: string[] = []

    // Overview
    lines.push('Metric,Value')
    lines.push(`Total Conversations,${report.overview.totalConversations}`)
    lines.push(`Total Messages,${report.overview.totalMessages}`)
    lines.push(`Total Tokens,${report.overview.totalTokens}`)
    lines.push('')

    // Time series
    lines.push('Date,Conversations,Messages,Tokens,Errors')
    report.timeSeries.forEach(data => {
      const date = new Date(data.timestamp).toISOString().split('T')[0]
      lines.push(`${date},${data.conversations},${data.messages},${data.tokens},${data.errors}`)
    })

    return lines.join('\n')
  }

  private exportToPDF(report: AnalyticsReport): string {
    // Simplified PDF export (would need a proper PDF library in real implementation)
    return `Analytics Report - ${new Date(report.period.start).toLocaleDateString()} to ${new Date(report.period.end).toLocaleDateString()}\n\n${JSON.stringify(report, null, 2)}`
  }

  // Event system
  public addEventListener(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(listener)
  }

  public removeEventListener(event: string, listener: Function): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(data))
    }
  }

  // Storage
  private saveEvents(): void {
    if (!this.settings.enableTracking) return

    try {
      const eventsToSave = this.events.slice(-1000) // Keep last 1000 events
      localStorage.setItem('analytics-events', JSON.stringify(eventsToSave))
    } catch (error) {
      console.error('Failed to save analytics events:', error)
    }
  }

  private loadEvents(): void {
    try {
      const stored = localStorage.getItem('analytics-events')
      if (stored) {
        this.events = JSON.parse(stored)
        // Clean old events based on retention policy
        const cutoff = Date.now() - (this.settings.retentionDays * 24 * 60 * 60 * 1000)
        this.events = this.events.filter(event => event.timestamp > cutoff)
      }
    } catch (error) {
      console.error('Failed to load analytics events:', error)
      this.events = []
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('analytics-settings', JSON.stringify(this.settings))
    } catch (error) {
      console.error('Failed to save analytics settings:', error)
    }
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem('analytics-settings')
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('Failed to load analytics settings:', error)
    }
  }

  // Cleanup
  public clearData(): void {
    this.events = []
    localStorage.removeItem('analytics-events')
    this.emit('data_cleared')
  }

  public async getDashboardData(): Promise<{
    todayStats: ConversationMetrics
    weeklyTrend: TimeSeriesData[]
    topModels: ModelUsageStats[]
    recentInsights: string[]
  }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const weeklyReport = await this.generateReport(weekAgo, tomorrow, 'day')
    const todayEvents = this.getEventsInRange(today.getTime(), tomorrow.getTime())
    const todayStats = this.calculateOverviewMetrics(todayEvents)

    return {
      todayStats,
      weeklyTrend: weeklyReport.timeSeries,
      topModels: weeklyReport.modelStats.slice(0, 5),
      recentInsights: weeklyReport.insights
    }
  }
}

export { AnalyticsService }
export default AnalyticsService.getInstance()
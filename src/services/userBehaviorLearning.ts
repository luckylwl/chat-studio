/**
 * 用户行为学习服务
 * 记录和分析用户使用习惯,提供个性化体验
 */

export interface UserAction {
  type: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface UsagePattern {
  mostActiveHours: number[] // 最活跃的小时
  preferredFeatures: string[] // 偏好功能
  averageSessionDuration: number // 平均会话时长(分钟)
  totalSessions: number // 总会话数
  commandUsageFrequency: Record<string, number> // 命令使用频率
  topicPreferences: Record<string, number> // 话题偏好
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  fontSize: 'small' | 'medium' | 'large'
  compactMode: boolean
  autoSave: boolean
  notifications: boolean
}

class UserBehaviorLearningService {
  private readonly STORAGE_KEY = 'user-behavior-data'
  private readonly ACTIONS_KEY = 'user-actions'
  private readonly PREFERENCES_KEY = 'user-preferences'
  private readonly MAX_ACTIONS = 1000 // 最多保存的动作数量

  /**
   * 记录用户动作
   */
  recordAction(type: string, metadata?: Record<string, any>): void {
    const action: UserAction = {
      type,
      timestamp: Date.now(),
      metadata,
    }

    const actions = this.getActions()
    actions.push(action)

    // 限制数组大小
    if (actions.length > this.MAX_ACTIONS) {
      actions.shift()
    }

    this.saveActions(actions)
  }

  /**
   * 获取所有动作记录
   */
  private getActions(): UserAction[] {
    try {
      const data = localStorage.getItem(this.ACTIONS_KEY)
      return data ? JSON.parse(data) : []
    } catch (e) {
      console.error('Failed to load user actions:', e)
      return []
    }
  }

  /**
   * 保存动作记录
   */
  private saveActions(actions: UserAction[]): void {
    try {
      localStorage.setItem(this.ACTIONS_KEY, JSON.stringify(actions))
    } catch (e) {
      console.error('Failed to save user actions:', e)
    }
  }

  /**
   * 分析使用模式
   */
  analyzeUsagePattern(): UsagePattern {
    const actions = this.getActions()

    if (actions.length === 0) {
      return {
        mostActiveHours: [],
        preferredFeatures: [],
        averageSessionDuration: 0,
        totalSessions: 0,
        commandUsageFrequency: {},
        topicPreferences: {},
      }
    }

    return {
      mostActiveHours: this.analyzeMostActiveHours(actions),
      preferredFeatures: this.analyzePreferredFeatures(actions),
      averageSessionDuration: this.calculateAverageSessionDuration(actions),
      totalSessions: this.countSessions(actions),
      commandUsageFrequency: this.analyzeCommandUsage(actions),
      topicPreferences: this.analyzeTopicPreferences(actions),
    }
  }

  /**
   * 分析最活跃的时间段
   */
  private analyzeMostActiveHours(actions: UserAction[]): number[] {
    const hourCounts: Record<number, number> = {}

    actions.forEach((action) => {
      const hour = new Date(action.timestamp).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    // 找出活跃度最高的3个小时
    return Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour))
  }

  /**
   * 分析偏好功能
   */
  private analyzePreferredFeatures(actions: UserAction[]): string[] {
    const featureCounts: Record<string, number> = {}

    actions.forEach((action) => {
      const feature = action.metadata?.feature
      if (feature) {
        featureCounts[feature] = (featureCounts[feature] || 0) + 1
      }
    })

    // 返回使用次数前5的功能
    return Object.entries(featureCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([feature]) => feature)
  }

  /**
   * 计算平均会话时长
   */
  private calculateAverageSessionDuration(actions: UserAction[]): number {
    if (actions.length < 2) return 0

    const sessions = this.extractSessions(actions)
    const totalDuration = sessions.reduce(
      (sum, session) => sum + session.duration,
      0
    )

    return totalDuration / sessions.length / (1000 * 60) // 转换为分钟
  }

  /**
   * 统计会话数量
   */
  private countSessions(actions: UserAction[]): number {
    return this.extractSessions(actions).length
  }

  /**
   * 提取会话信息
   */
  private extractSessions(
    actions: UserAction[]
  ): Array<{ start: number; end: number; duration: number }> {
    const SESSION_GAP = 30 * 60 * 1000 // 30分钟无活动视为新会话
    const sessions: Array<{ start: number; end: number; duration: number }> = []

    let currentSession: { start: number; end: number } | null = null

    actions.forEach((action) => {
      if (!currentSession) {
        currentSession = { start: action.timestamp, end: action.timestamp }
      } else {
        const gap = action.timestamp - currentSession.end

        if (gap > SESSION_GAP) {
          // 会话结束,开始新会话
          sessions.push({
            ...currentSession,
            duration: currentSession.end - currentSession.start,
          })
          currentSession = { start: action.timestamp, end: action.timestamp }
        } else {
          // 继续当前会话
          currentSession.end = action.timestamp
        }
      }
    })

    // 添加最后一个会话
    if (currentSession) {
      sessions.push({
        ...currentSession,
        duration: currentSession.end - currentSession.start,
      })
    }

    return sessions
  }

  /**
   * 分析命令使用频率
   */
  private analyzeCommandUsage(actions: UserAction[]): Record<string, number> {
    const commandCounts: Record<string, number> = {}

    actions
      .filter((action) => action.type === 'command_executed')
      .forEach((action) => {
        const command = action.metadata?.command
        if (command) {
          commandCounts[command] = (commandCounts[command] || 0) + 1
        }
      })

    return commandCounts
  }

  /**
   * 分析话题偏好
   */
  private analyzeTopicPreferences(actions: UserAction[]): Record<string, number> {
    const topicCounts: Record<string, number> = {}

    actions
      .filter((action) => action.type === 'message_sent')
      .forEach((action) => {
        const topic = action.metadata?.topic
        if (topic) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1
        }
      })

    return topicCounts
  }

  /**
   * 获取用户偏好设置
   */
  getPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(this.PREFERENCES_KEY)
      return data
        ? JSON.parse(data)
        : {
            theme: 'auto',
            language: 'zh-CN',
            fontSize: 'medium',
            compactMode: false,
            autoSave: true,
            notifications: true,
          }
    } catch (e) {
      console.error('Failed to load user preferences:', e)
      return {
        theme: 'auto',
        language: 'zh-CN',
        fontSize: 'medium',
        compactMode: false,
        autoSave: true,
        notifications: true,
      }
    }
  }

  /**
   * 保存用户偏好设置
   */
  savePreferences(preferences: Partial<UserPreferences>): void {
    try {
      const current = this.getPreferences()
      const updated = { ...current, ...preferences }
      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to save user preferences:', e)
    }
  }

  /**
   * 获取个性化推荐
   */
  getPersonalizedRecommendations(): {
    suggestedFeatures: string[]
    suggestedCommands: string[]
    optimalUsageTime: string
  } {
    const pattern = this.analyzeUsagePattern()

    // 建议功能(基于偏好的相关功能)
    const suggestedFeatures = this.getSuggestedFeatures(pattern.preferredFeatures)

    // 建议命令(高频命令的相关命令)
    const suggestedCommands = this.getSuggestedCommands(
      pattern.commandUsageFrequency
    )

    // 最佳使用时间
    const optimalUsageTime = this.getOptimalUsageTime(pattern.mostActiveHours)

    return {
      suggestedFeatures,
      suggestedCommands,
      optimalUsageTime,
    }
  }

  /**
   * 建议相关功能
   */
  private getSuggestedFeatures(preferredFeatures: string[]): string[] {
    const featureMap: Record<string, string[]> = {
      export: ['share', 'download', 'print'],
      search: ['filter', 'sort', 'bookmark'],
      edit: ['format', 'preview', 'version-control'],
      voice: ['transcribe', 'tts', 'voice-commands'],
    }

    const suggestions = new Set<string>()

    preferredFeatures.forEach((feature) => {
      const related = featureMap[feature] || []
      related.forEach((f) => suggestions.add(f))
    })

    return Array.from(suggestions).slice(0, 5)
  }

  /**
   * 建议相关命令
   */
  private getSuggestedCommands(
    commandFrequency: Record<string, number>
  ): string[] {
    const commandMap: Record<string, string[]> = {
      '/code': ['/debug', '/explain', '/optimize'],
      '/translate': ['/summarize', '/explain'],
      '/search': ['/find', '/filter'],
    }

    const suggestions = new Set<string>()

    Object.keys(commandFrequency)
      .slice(0, 3)
      .forEach((command) => {
        const related = commandMap[command] || []
        related.forEach((c) => suggestions.add(c))
      })

    return Array.from(suggestions).slice(0, 5)
  }

  /**
   * 获取最佳使用时间建议
   */
  private getOptimalUsageTime(mostActiveHours: number[]): string {
    if (mostActiveHours.length === 0) {
      return '全天'
    }

    const hour = mostActiveHours[0]

    if (hour >= 6 && hour < 12) return '上午'
    if (hour >= 12 && hour < 18) return '下午'
    if (hour >= 18 && hour < 22) return '傍晚'
    return '深夜'
  }

  /**
   * 清除所有数据
   */
  clearAllData(): void {
    localStorage.removeItem(this.ACTIONS_KEY)
    localStorage.removeItem(this.PREFERENCES_KEY)
  }

  /**
   * 导出数据(用于备份或分析)
   */
  exportData(): {
    actions: UserAction[]
    pattern: UsagePattern
    preferences: UserPreferences
  } {
    return {
      actions: this.getActions(),
      pattern: this.analyzeUsagePattern(),
      preferences: this.getPreferences(),
    }
  }

  /**
   * 获取使用统计摘要
   */
  getUsageSummary(): {
    totalActions: number
    totalSessions: number
    averageSessionDuration: number
    mostUsedCommand: string | null
    mostActiveTime: string
  } {
    const actions = this.getActions()
    const pattern = this.analyzeUsagePattern()

    const mostUsedCommand =
      Object.entries(pattern.commandUsageFrequency)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || null

    return {
      totalActions: actions.length,
      totalSessions: pattern.totalSessions,
      averageSessionDuration: pattern.averageSessionDuration,
      mostUsedCommand,
      mostActiveTime: this.getOptimalUsageTime(pattern.mostActiveHours),
    }
  }
}

// 单例导出
const userBehaviorLearning = new UserBehaviorLearningService()
export default userBehaviorLearning

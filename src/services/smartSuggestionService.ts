export interface SmartSuggestion {
  id: string
  type: 'question' | 'action' | 'context' | 'improvement' | 'follow-up'
  title: string
  description: string
  content: string
  icon: string
  confidence: number
  usageCount: number
  createdAt: number
  metadata?: {
    priority: 'low' | 'medium' | 'high'
    tags: string[]
    category: string
  }
}

export interface QuickAction {
  id: string
  name: string
  description: string
  icon: string
  category: string
  hotkey?: string
  action: () => Promise<any>
  usageCount: number
  enabled: boolean
}

export interface SuggestionContext {
  currentMessage?: string
  conversationHistory: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: number
  }>
  currentModel: string
  userPreferences: any
  conversationLength: number
  lastActivityTime: number
}

export interface SuggestionPreferences {
  enableSmartSuggestions: boolean
  enableQuickActions: boolean
  maxSuggestions: number
  suggestionRefreshInterval: number
  showTimeBasedSuggestions: boolean
  showContextualSuggestions: boolean
  showFollowUpSuggestions: boolean
  showModelSuggestions: boolean
  enableLearning: boolean
}

export class SmartSuggestionService {
  private static instance: SmartSuggestionService
  private suggestions: SmartSuggestion[] = []
  private quickActions: QuickAction[] = []
  private preferences: SuggestionPreferences
  private suggestionHistory: string[] = []
  private learningData: { [key: string]: any } = {}

  private constructor() {
    this.preferences = this.getDefaultPreferences()
    this.loadData()
    this.initializeQuickActions()
  }

  public static getInstance(): SmartSuggestionService {
    if (!SmartSuggestionService.instance) {
      SmartSuggestionService.instance = new SmartSuggestionService()
    }
    return SmartSuggestionService.instance
  }

  private getDefaultPreferences(): SuggestionPreferences {
    return {
      enableSmartSuggestions: true,
      enableQuickActions: true,
      maxSuggestions: 5,
      suggestionRefreshInterval: 30000,
      showTimeBasedSuggestions: true,
      showContextualSuggestions: true,
      showFollowUpSuggestions: true,
      showModelSuggestions: true,
      enableLearning: true
    }
  }

  private initializeQuickActions() {
    this.quickActions = [
      {
        id: 'clear-conversation',
        name: '清空对话',
        description: '清空当前对话的所有消息',
        icon: '🗑️',
        category: 'conversation',
        hotkey: 'Ctrl+K',
        action: async () => this.clearCurrentConversation(),
        usageCount: 0,
        enabled: true
      },
      {
        id: 'export-conversation',
        name: '导出对话',
        description: '将当前对话导出为文本文件',
        icon: '💾',
        category: 'file',
        hotkey: 'Ctrl+E',
        action: async () => this.exportConversation(),
        usageCount: 0,
        enabled: true
      },
      {
        id: 'summarize-conversation',
        name: '总结对话',
        description: '生成当前对话的摘要',
        icon: '📋',
        category: 'ai',
        action: async () => this.summarizeConversation(),
        usageCount: 0,
        enabled: true
      },
      {
        id: 'translate-last-message',
        name: '翻译上一条消息',
        description: '将上一条消息翻译为其他语言',
        icon: '🌐',
        category: 'ai',
        action: async () => this.translateLastMessage(),
        usageCount: 0,
        enabled: true
      },
      {
        id: 'change-model',
        name: '切换模型',
        description: '快速切换到不同的AI模型',
        icon: '🔄',
        category: 'settings',
        hotkey: 'Ctrl+M',
        action: async () => this.showModelSelector(),
        usageCount: 0,
        enabled: true
      },
      {
        id: 'copy-last-response',
        name: '复制最后回复',
        description: '复制AI的最后一条回复到剪贴板',
        icon: '📋',
        category: 'utility',
        hotkey: 'Ctrl+C',
        action: async () => this.copyLastResponse(),
        usageCount: 0,
        enabled: true
      }
    ]
  }

  public async initialize(): Promise<void> {
    this.loadData()
    if (this.preferences.enableLearning) {
      this.startLearning()
    }
  }

  public async generateSuggestions(context: SuggestionContext): Promise<SmartSuggestion[]> {
    if (!this.preferences.enableSmartSuggestions) {
      return []
    }

    const suggestions: SmartSuggestion[] = []

    // 基于上下文的建议
    if (this.preferences.showContextualSuggestions) {
      suggestions.push(...this.generateContextualSuggestions(context))
    }

    // 后续问题建议
    if (this.preferences.showFollowUpSuggestions) {
      suggestions.push(...this.generateFollowUpSuggestions(context))
    }

    // 时间相关建议
    if (this.preferences.showTimeBasedSuggestions) {
      suggestions.push(...this.generateTimeBasedSuggestions(context))
    }

    // 模型相关建议
    if (this.preferences.showModelSuggestions) {
      suggestions.push(...this.generateModelSuggestions(context))
    }

    // 改进建议
    suggestions.push(...this.generateImprovementSuggestions(context))

    // 根据置信度排序并限制数量
    const sortedSuggestions = suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.preferences.maxSuggestions)

    this.suggestions = sortedSuggestions
    return sortedSuggestions
  }

  private generateContextualSuggestions(context: SuggestionContext): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []
    const lastMessage = context.conversationHistory[context.conversationHistory.length - 1]

    if (!lastMessage) return suggestions

    // 基于最后一条消息的内容生成建议
    const content = lastMessage.content.toLowerCase()

    if (content.includes('代码') || content.includes('编程') || content.includes('code')) {
      suggestions.push({
        id: `context-code-${Date.now()}`,
        type: 'context',
        title: '代码优化建议',
        description: '获取代码优化和改进建议',
        content: '请帮我优化这段代码的性能和可读性',
        icon: '💻',
        confidence: 0.8,
        usageCount: 0,
        createdAt: Date.now(),
        metadata: {
          priority: 'high',
          tags: ['代码', '优化'],
          category: '编程'
        }
      })
    }

    if (content.includes('错误') || content.includes('bug') || content.includes('问题')) {
      suggestions.push({
        id: `context-debug-${Date.now()}`,
        type: 'context',
        title: '调试帮助',
        description: '获取调试和问题解决建议',
        content: '请帮我分析这个问题的可能原因和解决方案',
        icon: '🐛',
        confidence: 0.9,
        usageCount: 0,
        createdAt: Date.now(),
        metadata: {
          priority: 'high',
          tags: ['调试', '错误'],
          category: '技术支持'
        }
      })
    }

    if (content.includes('学习') || content.includes('教程') || content.includes('怎么')) {
      suggestions.push({
        id: `context-learn-${Date.now()}`,
        type: 'context',
        title: '学习资源',
        description: '获取相关学习资源和教程推荐',
        content: '请推荐一些相关的学习资源和最佳实践',
        icon: '📚',
        confidence: 0.7,
        usageCount: 0,
        createdAt: Date.now(),
        metadata: {
          priority: 'medium',
          tags: ['学习', '教程'],
          category: '教育'
        }
      })
    }

    return suggestions
  }

  private generateFollowUpSuggestions(context: SuggestionContext): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []

    if (context.conversationHistory.length > 0) {
      suggestions.push({
        id: `followup-detail-${Date.now()}`,
        type: 'follow-up',
        title: '获取更多细节',
        description: '深入了解刚才讨论的主题',
        content: '能否详细解释一下刚才提到的内容？',
        icon: '🔍',
        confidence: 0.6,
        usageCount: 0,
        createdAt: Date.now(),
        metadata: {
          priority: 'medium',
          tags: ['详细', '深入'],
          category: '对话'
        }
      })

      suggestions.push({
        id: `followup-example-${Date.now()}`,
        type: 'follow-up',
        title: '实际示例',
        description: '请求具体的示例说明',
        content: '能给个具体的例子来说明吗？',
        icon: '💡',
        confidence: 0.7,
        usageCount: 0,
        createdAt: Date.now(),
        metadata: {
          priority: 'medium',
          tags: ['示例', '说明'],
          category: '对话'
        }
      })
    }

    return suggestions
  }

  private generateTimeBasedSuggestions(context: SuggestionContext): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []
    const now = new Date()
    const hour = now.getHours()

    if (hour < 12) {
      suggestions.push({
        id: `time-morning-${Date.now()}`,
        type: 'context',
        title: '晨间计划',
        description: '制定今日工作计划',
        content: '帮我制定一个高效的今日工作计划',
        icon: '🌅',
        confidence: 0.5,
        usageCount: 0,
        createdAt: Date.now(),
        metadata: {
          priority: 'low',
          tags: ['计划', '早晨'],
          category: '生产力'
        }
      })
    } else if (hour >= 18) {
      suggestions.push({
        id: `time-evening-${Date.now()}`,
        type: 'context',
        title: '每日总结',
        description: '总结今天的工作和学习',
        content: '帮我总结一下今天的工作和收获',
        icon: '🌆',
        confidence: 0.5,
        usageCount: 0,
        createdAt: Date.now(),
        metadata: {
          priority: 'low',
          tags: ['总结', '晚上'],
          category: '反思'
        }
      })
    }

    return suggestions
  }

  private generateModelSuggestions(context: SuggestionContext): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []

    // 根据对话内容推荐更适合的模型
    const conversationText = context.conversationHistory
      .map(msg => msg.content)
      .join(' ')
      .toLowerCase()

    if (conversationText.includes('创意') || conversationText.includes('写作') || conversationText.includes('故事')) {
      suggestions.push({
        id: `model-creative-${Date.now()}`,
        type: 'action',
        title: '切换创意模型',
        description: '使用更适合创意写作的模型',
        content: '建议切换到更适合创意任务的模型',
        icon: '🎨',
        confidence: 0.6,
        usageCount: 0,
        createdAt: Date.now(),
        metadata: {
          priority: 'medium',
          tags: ['模型', '创意'],
          category: '优化'
        }
      })
    }

    return suggestions
  }

  private generateImprovementSuggestions(context: SuggestionContext): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []

    if (context.conversationLength > 10) {
      suggestions.push({
        id: `improve-summarize-${Date.now()}`,
        type: 'improvement',
        title: '对话总结',
        description: '对话较长，建议生成总结',
        content: '这个对话已经比较长了，要不要我帮你总结一下重点内容？',
        icon: '📝',
        confidence: 0.8,
        usageCount: 0,
        createdAt: Date.now(),
        metadata: {
          priority: 'high',
          tags: ['总结', '长对话'],
          category: '优化'
        }
      })
    }

    return suggestions
  }

  public async useSuggestion(suggestionId: string): Promise<void> {
    const suggestion = this.suggestions.find(s => s.id === suggestionId)
    if (suggestion) {
      suggestion.usageCount++
      this.suggestionHistory.push(suggestionId)

      if (this.preferences.enableLearning) {
        await this.recordUsage(suggestion)
      }
    }
  }

  public async executeQuickAction(actionId: string): Promise<boolean> {
    const action = this.quickActions.find(a => a.id === actionId)
    if (!action || !action.enabled) {
      return false
    }

    try {
      await action.action()
      action.usageCount++
      return true
    } catch (error) {
      console.error('Execute quick action error:', error)
      return false
    }
  }

  public getQuickActions(): QuickAction[] {
    return this.quickActions.filter(action => action.enabled)
  }

  public getPreferences(): SuggestionPreferences {
    return { ...this.preferences }
  }

  public async updatePreferences(newPreferences: Partial<SuggestionPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...newPreferences }
    this.saveData()
  }

  private async recordUsage(suggestion: SmartSuggestion): Promise<void> {
    // 记录使用数据用于学习
    if (!this.learningData[suggestion.type]) {
      this.learningData[suggestion.type] = []
    }

    this.learningData[suggestion.type].push({
      suggestionId: suggestion.id,
      timestamp: Date.now(),
      confidence: suggestion.confidence,
      tags: suggestion.metadata?.tags || []
    })
  }

  private startLearning(): void {
    // 启动学习机制，定期分析用户行为
    setInterval(() => {
      this.analyzeLearningData()
    }, 5 * 60 * 1000) // 每5分钟分析一次
  }

  private analyzeLearningData(): void {
    // 分析学习数据，优化建议算法
    // 这里可以实现机器学习算法来改进建议质量
  }

  private loadData(): void {
    try {
      const stored = localStorage.getItem('smart-suggestion-data')
      if (stored) {
        const data = JSON.parse(stored)
        this.preferences = { ...this.preferences, ...data.preferences }
        this.learningData = data.learningData || {}
        this.suggestionHistory = data.suggestionHistory || []

        // 恢复快捷操作的使用计数
        if (data.quickActions) {
          this.quickActions.forEach(action => {
            const stored = data.quickActions.find((a: any) => a.id === action.id)
            if (stored) {
              action.usageCount = stored.usageCount
              action.enabled = stored.enabled
            }
          })
        }
      }
    } catch (error) {
      console.error('Load suggestion data error:', error)
    }
  }

  private saveData(): void {
    try {
      const data = {
        preferences: this.preferences,
        learningData: this.learningData,
        suggestionHistory: this.suggestionHistory,
        quickActions: this.quickActions.map(action => ({
          id: action.id,
          usageCount: action.usageCount,
          enabled: action.enabled
        }))
      }
      localStorage.setItem('smart-suggestion-data', JSON.stringify(data))
    } catch (error) {
      console.error('Save suggestion data error:', error)
    }
  }

  // 快捷操作实现
  private async clearCurrentConversation(): Promise<void> {
    // 这里需要与应用的状态管理集成
    console.log('Clear conversation action')
  }

  private async exportConversation(): Promise<void> {
    console.log('Export conversation action')
  }

  private async summarizeConversation(): Promise<void> {
    console.log('Summarize conversation action')
  }

  private async translateLastMessage(): Promise<void> {
    console.log('Translate last message action')
  }

  private async showModelSelector(): Promise<void> {
    console.log('Show model selector action')
  }

  private async copyLastResponse(): Promise<void> {
    console.log('Copy last response action')
  }
}
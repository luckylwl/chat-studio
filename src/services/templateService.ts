export interface ConversationTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  prompt: string
  systemPrompt?: string
  model?: string
  temperature?: number
  maxTokens?: number
  tags: string[]
  isBuiltIn: boolean
  isPublic: boolean
  createdAt: number
  updatedAt: number
  usage: number
  rating: number
  author?: string
}

export interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  templates: ConversationTemplate[]
}

export interface TemplateSettings {
  enableQuickAccess: boolean
  showInSidebar: boolean
  autoApplyModel: boolean
  favoriteTemplates: string[]
  recentTemplates: string[]
  customCategories: TemplateCategory[]
}

class TemplateService {
  private static instance: TemplateService
  private templates: ConversationTemplate[] = []
  private categories: TemplateCategory[] = []
  private settings: TemplateSettings
  private listeners: Map<string, Function[]> = new Map()

  private constructor() {
    this.settings = this.getDefaultSettings()
    this.initializeBuiltInTemplates()
    this.loadFromStorage()
  }

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService()
    }
    return TemplateService.instance
  }

  private getDefaultSettings(): TemplateSettings {
    return {
      enableQuickAccess: true,
      showInSidebar: true,
      autoApplyModel: true,
      favoriteTemplates: [],
      recentTemplates: [],
      customCategories: []
    }
  }

  private initializeBuiltInTemplates(): void {
    const builtInTemplates: ConversationTemplate[] = [
      {
        id: 'creative-writing',
        name: '创意写作助手',
        description: '帮助进行小说、剧本、诗歌等创意写作',
        category: 'writing',
        icon: '✍️',
        prompt: '请帮我进行创意写作。我想写作',
        systemPrompt: '你是一位专业的创意写作导师，具有丰富的文学创作经验。请帮助用户进行各种形式的创意写作，包括小说、剧本、诗歌、散文等。提供具体的建议、技巧和灵感。',
        model: 'gpt-4',
        temperature: 0.8,
        maxTokens: 2048,
        tags: ['写作', '创意', '文学'],
        isBuiltIn: true,
        isPublic: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usage: 0,
        rating: 4.8
      },
      {
        id: 'code-assistant',
        name: '编程助手',
        description: '协助编程、代码审查、调试和优化',
        category: 'programming',
        icon: '💻',
        prompt: '我需要编程帮助，我的问题是：',
        systemPrompt: '你是一位资深的软件开发工程师，精通多种编程语言和框架。请帮助用户解决编程问题，提供清晰的代码示例、最佳实践建议，并解释技术概念。',
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 3000,
        tags: ['编程', '代码', '开发'],
        isBuiltIn: true,
        isPublic: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usage: 0,
        rating: 4.9
      },
      {
        id: 'business-analyst',
        name: '商业分析师',
        description: '商业策略分析、市场研究、决策支持',
        category: 'business',
        icon: '📊',
        prompt: '我需要商业分析建议，具体情况是：',
        systemPrompt: '你是一位经验丰富的商业分析师和管理顾问。请帮助用户分析商业问题，提供数据驱动的洞察、战略建议和可行的解决方案。',
        model: 'gpt-4',
        temperature: 0.4,
        maxTokens: 2500,
        tags: ['商业', '分析', '策略'],
        isBuiltIn: true,
        isPublic: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usage: 0,
        rating: 4.7
      },
      {
        id: 'language-tutor',
        name: '语言学习导师',
        description: '外语学习、语法纠错、口语练习',
        category: 'education',
        icon: '🌍',
        prompt: '我想学习语言，我的需求是：',
        systemPrompt: '你是一位专业的语言教育专家，精通多种语言教学法。请帮助用户学习外语，提供语法解释、词汇扩展、文化背景知识和练习建议。',
        model: 'gpt-4',
        temperature: 0.6,
        maxTokens: 2000,
        tags: ['教育', '语言', '学习'],
        isBuiltIn: true,
        isPublic: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usage: 0,
        rating: 4.6
      },
      {
        id: 'health-advisor',
        name: '健康顾问',
        description: '健康建议、营养指导、运动计划',
        category: 'health',
        icon: '🏥',
        prompt: '我有健康相关的问题：',
        systemPrompt: '你是一位专业的健康顾问，具有医学和营养学背景。请提供基于科学的健康建议，包括营养、运动、生活方式等方面。注意：这些建议仅供参考，不能替代专业医疗诊断。',
        model: 'gpt-4',
        temperature: 0.2,
        maxTokens: 2000,
        tags: ['健康', '营养', '运动'],
        isBuiltIn: true,
        isPublic: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usage: 0,
        rating: 4.5
      },
      {
        id: 'research-assistant',
        name: '研究助手',
        description: '学术研究、文献综述、数据分析',
        category: 'research',
        icon: '🔬',
        prompt: '我需要研究帮助，我的研究主题是：',
        systemPrompt: '你是一位专业的研究助手，具有广泛的学术知识和研究方法论经验。请帮助用户进行文献研究、数据分析、论文写作和学术讨论。',
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 3000,
        tags: ['研究', '学术', '分析'],
        isBuiltIn: true,
        isPublic: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usage: 0,
        rating: 4.8
      },
      {
        id: 'creative-brainstorm',
        name: '创意头脑风暴',
        description: '创意生成、问题解决、思维拓展',
        category: 'creative',
        icon: '💡',
        prompt: '我需要创意灵感，我的挑战是：',
        systemPrompt: '你是一位创新思维专家，擅长引导创意思考和头脑风暴。请帮助用户突破思维局限，产生新颖的想法和解决方案。',
        model: 'gpt-4',
        temperature: 0.9,
        maxTokens: 2000,
        tags: ['创意', '灵感', '思维'],
        isBuiltIn: true,
        isPublic: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usage: 0,
        rating: 4.7
      },
      {
        id: 'travel-planner',
        name: '旅行规划师',
        description: '旅行计划、景点推荐、行程安排',
        category: 'lifestyle',
        icon: '✈️',
        prompt: '我想规划一次旅行，我的计划是：',
        systemPrompt: '你是一位专业的旅行规划师，对全球各地的旅游资源了如指掌。请帮助用户制定详细的旅行计划，包括景点推荐、行程安排、预算规划等。',
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 2500,
        tags: ['旅行', '规划', '生活'],
        isBuiltIn: true,
        isPublic: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        usage: 0,
        rating: 4.6
      }
    ]

    this.templates = builtInTemplates

    // 初始化分类
    this.categories = [
      {
        id: 'writing',
        name: '写作创作',
        description: '文学创作、内容写作相关模板',
        icon: '✍️',
        color: '#3B82F6',
        templates: []
      },
      {
        id: 'programming',
        name: '编程开发',
        description: '软件开发、编程相关模板',
        icon: '💻',
        color: '#10B981',
        templates: []
      },
      {
        id: 'business',
        name: '商业分析',
        description: '商业策略、市场分析相关模板',
        icon: '📊',
        color: '#F59E0B',
        templates: []
      },
      {
        id: 'education',
        name: '教育学习',
        description: '学习指导、知识传授相关模板',
        icon: '🎓',
        color: '#8B5CF6',
        templates: []
      },
      {
        id: 'health',
        name: '健康生活',
        description: '健康建议、生活指导相关模板',
        icon: '🏥',
        color: '#EF4444',
        templates: []
      },
      {
        id: 'research',
        name: '学术研究',
        description: '学术研究、数据分析相关模板',
        icon: '🔬',
        color: '#06B6D4',
        templates: []
      },
      {
        id: 'creative',
        name: '创意思维',
        description: '创意启发、思维拓展相关模板',
        icon: '💡',
        color: '#F97316',
        templates: []
      },
      {
        id: 'lifestyle',
        name: '生活方式',
        description: '生活规划、日常助手相关模板',
        icon: '🌟',
        color: '#84CC16',
        templates: []
      }
    ]

    this.organizeTemplatesByCategory()
  }

  private organizeTemplatesByCategory(): void {
    // 清空现有分类中的模板
    this.categories.forEach(category => {
      category.templates = []
    })

    // 将模板分配到相应分类
    this.templates.forEach(template => {
      const category = this.categories.find(cat => cat.id === template.category)
      if (category) {
        category.templates.push(template)
      }
    })
  }

  // 获取所有模板
  public getAllTemplates(): ConversationTemplate[] {
    return [...this.templates]
  }

  // 根据分类获取模板
  public getTemplatesByCategory(categoryId: string): ConversationTemplate[] {
    return this.templates.filter(template => template.category === categoryId)
  }

  // 获取所有分类
  public getCategories(): TemplateCategory[] {
    return [...this.categories]
  }

  // 获取热门模板
  public getPopularTemplates(limit: number = 6): ConversationTemplate[] {
    return this.templates
      .sort((a, b) => b.usage - a.usage)
      .slice(0, limit)
  }

  // 获取最近使用的模板
  public getRecentTemplates(limit: number = 5): ConversationTemplate[] {
    const recentIds = this.settings.recentTemplates
    return recentIds
      .map(id => this.templates.find(t => t.id === id))
      .filter(Boolean)
      .slice(0, limit) as ConversationTemplate[]
  }

  // 获取收藏的模板
  public getFavoriteTemplates(): ConversationTemplate[] {
    const favoriteIds = this.settings.favoriteTemplates
    return favoriteIds
      .map(id => this.templates.find(t => t.id === id))
      .filter(Boolean) as ConversationTemplate[]
  }

  // 搜索模板
  public searchTemplates(query: string): ConversationTemplate[] {
    const searchTerm = query.toLowerCase()
    return this.templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  }

  // 根据ID获取模板
  public getTemplateById(id: string): ConversationTemplate | undefined {
    return this.templates.find(template => template.id === id)
  }

  // 创建自定义模板
  public createTemplate(template: Omit<ConversationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usage' | 'rating' | 'isBuiltIn'>): string {
    const newTemplate: ConversationTemplate = {
      ...template,
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usage: 0,
      rating: 0,
      isBuiltIn: false
    }

    this.templates.push(newTemplate)
    this.organizeTemplatesByCategory()
    this.saveToStorage()
    this.emit('template_created', newTemplate)

    return newTemplate.id
  }

  // 更新模板
  public updateTemplate(id: string, updates: Partial<ConversationTemplate>): boolean {
    const templateIndex = this.templates.findIndex(t => t.id === id)
    if (templateIndex === -1) return false

    const template = this.templates[templateIndex]
    if (template.isBuiltIn && !['usage', 'rating'].some(key => key in updates)) {
      throw new Error('Cannot modify built-in templates')
    }

    this.templates[templateIndex] = {
      ...template,
      ...updates,
      updatedAt: Date.now()
    }

    this.organizeTemplatesByCategory()
    this.saveToStorage()
    this.emit('template_updated', this.templates[templateIndex])

    return true
  }

  // 删除模板
  public deleteTemplate(id: string): boolean {
    const templateIndex = this.templates.findIndex(t => t.id === id)
    if (templateIndex === -1) return false

    const template = this.templates[templateIndex]
    if (template.isBuiltIn) {
      throw new Error('Cannot delete built-in templates')
    }

    this.templates.splice(templateIndex, 1)
    this.organizeTemplatesByCategory()
    this.saveToStorage()
    this.emit('template_deleted', template)

    return true
  }

  // 使用模板
  public useTemplate(id: string): ConversationTemplate | undefined {
    const template = this.getTemplateById(id)
    if (!template) return undefined

    // 增加使用计数
    this.updateTemplate(id, { usage: template.usage + 1 })

    // 添加到最近使用
    this.addToRecentTemplates(id)

    return template
  }

  // 添加到收藏
  public toggleFavorite(id: string): boolean {
    const favorites = this.settings.favoriteTemplates
    const index = favorites.indexOf(id)

    if (index === -1) {
      favorites.push(id)
    } else {
      favorites.splice(index, 1)
    }

    this.saveSettings()
    this.emit('favorites_updated', favorites)

    return index === -1
  }

  // 检查是否收藏
  public isFavorite(id: string): boolean {
    return this.settings.favoriteTemplates.includes(id)
  }

  // 添加到最近使用
  private addToRecentTemplates(id: string): void {
    const recent = this.settings.recentTemplates
    const index = recent.indexOf(id)

    if (index !== -1) {
      recent.splice(index, 1)
    }

    recent.unshift(id)

    // 限制最近使用数量
    if (recent.length > 20) {
      recent.splice(20)
    }

    this.saveSettings()
  }

  // 获取设置
  public getSettings(): TemplateSettings {
    return { ...this.settings }
  }

  // 更新设置
  public updateSettings(updates: Partial<TemplateSettings>): void {
    this.settings = { ...this.settings, ...updates }
    this.saveSettings()
    this.emit('settings_updated', this.settings)
  }

  // 导入模板
  public importTemplates(templates: ConversationTemplate[]): { success: number; failed: number } {
    let success = 0
    let failed = 0

    templates.forEach(template => {
      try {
        const existingTemplate = this.getTemplateById(template.id)
        if (existingTemplate && existingTemplate.isBuiltIn) {
          failed++
          return
        }

        if (existingTemplate) {
          this.updateTemplate(template.id, template)
        } else {
          this.templates.push({
            ...template,
            createdAt: template.createdAt || Date.now(),
            updatedAt: Date.now()
          })
        }
        success++
      } catch (error) {
        failed++
      }
    })

    this.organizeTemplatesByCategory()
    this.saveToStorage()
    this.emit('templates_imported', { success, failed })

    return { success, failed }
  }

  // 导出模板
  public exportTemplates(includeBuiltIn: boolean = false): ConversationTemplate[] {
    return this.templates.filter(template =>
      includeBuiltIn || !template.isBuiltIn
    )
  }

  // 事件系统
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

  // 工具方法
  private generateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private saveToStorage(): void {
    try {
      const customTemplates = this.templates.filter(t => !t.isBuiltIn)
      localStorage.setItem('conversation-templates', JSON.stringify(customTemplates))
    } catch (error) {
      console.error('Failed to save templates:', error)
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('conversation-templates')
      if (stored) {
        const customTemplates = JSON.parse(stored) as ConversationTemplate[]
        this.templates.push(...customTemplates)
        this.organizeTemplatesByCategory()
      }

      const storedSettings = localStorage.getItem('template-settings')
      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) }
      }
    } catch (error) {
      console.error('Failed to load templates from storage:', error)
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('template-settings', JSON.stringify(this.settings))
    } catch (error) {
      console.error('Failed to save template settings:', error)
    }
  }
}

export { TemplateService }
export default TemplateService.getInstance()
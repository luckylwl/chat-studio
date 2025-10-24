import { EventEmitter } from '@/utils/EventEmitter'

// Types for prompt template management
export interface PromptTemplate {
  id: string
  name: string
  description: string
  content: string
  category: string
  tags: string[]
  variables: TemplateVariable[]
  version: string
  author: string
  isPublic: boolean
  isEditable: boolean
  createdAt: number
  updatedAt: number
  usageCount: number
  rating: number
  ratingCount: number
  language: string
  modelCompatibility: string[]
  examples: TemplateExample[]
  metadata: TemplateMetadata
}

export interface TemplateVariable {
  name: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiline' | 'date' | 'url' | 'email'
  description: string
  required: boolean
  defaultValue?: any
  options?: string[] // For select type
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    min?: number
    max?: number
  }
}

export interface TemplateExample {
  id: string
  title: string
  description: string
  variables: { [key: string]: any }
  expectedOutput?: string
  modelUsed?: string
  rating?: number
}

export interface TemplateMetadata {
  complexity: 'simple' | 'medium' | 'complex'
  useCase: string[]
  industry: string[]
  estimatedTokens: number
  performance: {
    successRate: number
    avgResponseTime: number
    avgQualityScore: number
  }
  optimizationSuggestions: string[]
}

export interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  parentId?: string
  templateCount: number
}

export interface TemplateCollection {
  id: string
  name: string
  description: string
  templateIds: string[]
  author: string
  isPublic: boolean
  tags: string[]
  createdAt: number
  updatedAt: number
}

export interface TemplateVersion {
  id: string
  templateId: string
  version: string
  content: string
  changes: string
  author: string
  createdAt: number
  isActive: boolean
}

export interface TemplateAnalytics {
  totalTemplates: number
  totalUsage: number
  popularCategories: Array<{ category: string; count: number }>
  topRatedTemplates: Array<{ templateId: string; rating: number }>
  recentlyCreated: PromptTemplate[]
  trendingTemplates: PromptTemplate[]
  userStats: {
    created: number
    used: number
    rated: number
  }
}

export interface TemplateOptimization {
  id: string
  templateId: string
  originalContent: string
  optimizedContent: string
  improvements: Array<{
    type: 'clarity' | 'specificity' | 'structure' | 'variables' | 'examples'
    description: string
    impact: 'low' | 'medium' | 'high'
  }>
  metrics: {
    readabilityScore: number
    complexityScore: number
    tokenReduction: number
    estimatedPerformanceImprovement: number
  }
  status: 'pending' | 'applied' | 'rejected'
  createdAt: number
}

// Predefined categories
const DEFAULT_CATEGORIES: TemplateCategory[] = [
  {
    id: 'creative-writing',
    name: '创意写作',
    description: '用于创意写作的提示词模板',
    icon: '✍️',
    color: 'purple',
    templateCount: 0
  },
  {
    id: 'business',
    name: '商业应用',
    description: '商业场景相关的提示词',
    icon: '💼',
    color: 'blue',
    templateCount: 0
  },
  {
    id: 'technical',
    name: '技术开发',
    description: '编程和技术相关的提示词',
    icon: '💻',
    color: 'green',
    templateCount: 0
  },
  {
    id: 'education',
    name: '教育培训',
    description: '教学和学习相关的提示词',
    icon: '📚',
    color: 'orange',
    templateCount: 0
  },
  {
    id: 'analysis',
    name: '分析总结',
    description: '数据分析和内容总结的提示词',
    icon: '📊',
    color: 'red',
    templateCount: 0
  },
  {
    id: 'translation',
    name: '翻译对话',
    description: '翻译和语言处理的提示词',
    icon: '🌍',
    color: 'teal',
    templateCount: 0
  }
]

// Built-in templates
const BUILTIN_TEMPLATES: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating' | 'ratingCount'>[] = [
  {
    name: '代码审查助手',
    description: '帮助审查代码质量和提出改进建议',
    content: '请仔细审查以下{{language}}代码，重点关注以下方面：\n\n1. 代码质量和可读性\n2. 性能优化机会\n3. 潜在的安全问题\n4. 最佳实践遵循情况\n\n代码：\n```{{language}}\n{{code}}\n```\n\n请提供详细的审查报告，包括具体的改进建议和修改示例。',
    category: 'technical',
    tags: ['代码审查', '编程', '质量控制'],
    variables: [
      {
        name: 'language',
        type: 'select',
        description: '编程语言',
        required: true,
        options: ['JavaScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'TypeScript']
      },
      {
        name: 'code',
        type: 'multiline',
        description: '要审查的代码',
        required: true,
        validation: { minLength: 10 }
      }
    ],
    version: '1.0.0',
    author: 'System',
    isPublic: true,
    isEditable: true,
    language: 'zh-CN',
    modelCompatibility: ['gpt-4', 'gpt-3.5-turbo', 'claude-3'],
    examples: [
      {
        id: 'example1',
        title: 'JavaScript函数审查',
        description: '审查一个简单的JavaScript函数',
        variables: {
          language: 'JavaScript',
          code: 'function calculateTotal(items) {\n  let total = 0;\n  for (let i = 0; i < items.length; i++) {\n    total += items[i].price;\n  }\n  return total;\n}'
        }
      }
    ],
    metadata: {
      complexity: 'medium',
      useCase: ['代码审查', '质量保证', '技术面试'],
      industry: ['软件开发', 'IT'],
      estimatedTokens: 350,
      performance: {
        successRate: 0.92,
        avgResponseTime: 1500,
        avgQualityScore: 0.88
      },
      optimizationSuggestions: []
    }
  },
  {
    name: '商业报告分析',
    description: '分析商业报告并提取关键洞察',
    content: '请分析以下{{report_type}}报告，并提供以下分析：\n\n1. **关键发现总结**：列出3-5个最重要的发现\n2. **趋势分析**：识别重要趋势和模式\n3. **风险评估**：指出潜在的风险和挑战\n4. **机会识别**：发现潜在的商业机会\n5. **行动建议**：提供可执行的建议\n\n报告内容：\n{{report_content}}\n\n请确保分析客观、数据驱动，并提供具体的支持证据。',
    category: 'business',
    tags: ['商业分析', '报告', '策略'],
    variables: [
      {
        name: 'report_type',
        type: 'select',
        description: '报告类型',
        required: true,
        options: ['财务报告', '市场分析', '竞争分析', '用户研究', '绩效报告', '行业报告']
      },
      {
        name: 'report_content',
        type: 'multiline',
        description: '报告内容',
        required: true,
        validation: { minLength: 100 }
      }
    ],
    version: '1.0.0',
    author: 'System',
    isPublic: true,
    isEditable: true,
    language: 'zh-CN',
    modelCompatibility: ['gpt-4', 'claude-3'],
    examples: [
      {
        id: 'example1',
        title: '季度财务报告分析',
        description: '分析公司季度财务表现',
        variables: {
          report_type: '财务报告',
          report_content: '第三季度营收增长15%，达到5000万美元...'
        }
      }
    ],
    metadata: {
      complexity: 'complex',
      useCase: ['商业分析', '决策支持', '报告撰写'],
      industry: ['金融', '咨询', '企业管理'],
      estimatedTokens: 450,
      performance: {
        successRate: 0.89,
        avgResponseTime: 2000,
        avgQualityScore: 0.91
      },
      optimizationSuggestions: []
    }
  },
  {
    name: '创意文案生成',
    description: '为产品或服务生成创意文案',
    content: '为{{product_name}}创作有吸引力的{{copy_type}}，目标受众是{{target_audience}}。\n\n产品/服务信息：\n- 名称：{{product_name}}\n- 类型：{{product_type}}\n- 主要特点：{{key_features}}\n- 独特卖点：{{unique_selling_point}}\n- 品牌调性：{{brand_tone}}\n\n要求：\n1. 语言要生动有趣，符合目标受众的喜好\n2. 突出产品的核心价值和优势\n3. 包含明确的行动号召\n4. 字数控制在{{word_limit}}字以内\n5. 风格要与品牌调性一致\n\n请提供3个不同风格的文案选项。',
    category: 'creative-writing',
    tags: ['文案', '营销', '创意'],
    variables: [
      {
        name: 'product_name',
        type: 'text',
        description: '产品或服务名称',
        required: true
      },
      {
        name: 'copy_type',
        type: 'select',
        description: '文案类型',
        required: true,
        options: ['广告文案', '产品描述', '社交媒体文案', '邮件营销', '网站标语', '宣传册文案']
      },
      {
        name: 'target_audience',
        type: 'text',
        description: '目标受众',
        required: true
      },
      {
        name: 'product_type',
        type: 'text',
        description: '产品类型',
        required: true
      },
      {
        name: 'key_features',
        type: 'multiline',
        description: '主要特点',
        required: true
      },
      {
        name: 'unique_selling_point',
        type: 'text',
        description: '独特卖点',
        required: true
      },
      {
        name: 'brand_tone',
        type: 'select',
        description: '品牌调性',
        required: true,
        options: ['专业严肃', '友好亲切', '年轻活力', '高端奢华', '创新前卫', '温馨家庭']
      },
      {
        name: 'word_limit',
        type: 'number',
        description: '字数限制',
        required: false,
        defaultValue: 200,
        validation: { min: 50, max: 1000 }
      }
    ],
    version: '1.0.0',
    author: 'System',
    isPublic: true,
    isEditable: true,
    language: 'zh-CN',
    modelCompatibility: ['gpt-4', 'gpt-3.5-turbo', 'claude-3'],
    examples: [
      {
        id: 'example1',
        title: '智能手表文案',
        description: '为智能手表产品创作营销文案',
        variables: {
          product_name: 'SmartWatch Pro',
          copy_type: '广告文案',
          target_audience: '25-40岁健身爱好者',
          product_type: '智能手表',
          key_features: '心率监测、GPS定位、50米防水、7天续航',
          unique_selling_point: 'AI健康顾问功能',
          brand_tone: '年轻活力',
          word_limit: 150
        }
      }
    ],
    metadata: {
      complexity: 'medium',
      useCase: ['营销推广', '文案创作', '品牌建设'],
      industry: ['广告', '电商', '品牌营销'],
      estimatedTokens: 400,
      performance: {
        successRate: 0.94,
        avgResponseTime: 1800,
        avgQualityScore: 0.87
      },
      optimizationSuggestions: []
    }
  }
]

class PromptTemplateService extends EventEmitter {
  private templates: Map<string, PromptTemplate> = new Map()
  private categories: Map<string, TemplateCategory> = new Map()
  private collections: Map<string, TemplateCollection> = new Map()
  private versions: Map<string, TemplateVersion[]> = new Map()
  private optimizations: Map<string, TemplateOptimization> = new Map()
  private analytics: TemplateAnalytics

  constructor() {
    super()

    this.analytics = {
      totalTemplates: 0,
      totalUsage: 0,
      popularCategories: [],
      topRatedTemplates: [],
      recentlyCreated: [],
      trendingTemplates: [],
      userStats: {
        created: 0,
        used: 0,
        rated: 0
      }
    }

    this.initializeDefaultCategories()
    this.loadTemplates()
    this.loadCollections()
    this.loadVersions()
    this.createBuiltinTemplates()
    this.updateAnalytics()
  }

  // Template CRUD operations
  async createTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating' | 'ratingCount'>): Promise<PromptTemplate> {
    const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()

    const newTemplate: PromptTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
      rating: 0,
      ratingCount: 0
    }

    this.templates.set(id, newTemplate)
    await this.saveTemplates()
    await this.updateCategoryCount(template.category, 1)
    await this.updateAnalytics()

    this.emit('templateCreated', newTemplate)
    return newTemplate
  }

  async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate | null> {
    const template = this.templates.get(id)
    if (!template) return null

    // Create version if content changed
    if (updates.content && updates.content !== template.content) {
      await this.createVersion(id, template.content, updates.content, 'Content update')
    }

    const updatedTemplate: PromptTemplate = {
      ...template,
      ...updates,
      updatedAt: Date.now()
    }

    this.templates.set(id, updatedTemplate)
    await this.saveTemplates()
    await this.updateAnalytics()

    this.emit('templateUpdated', updatedTemplate)
    return updatedTemplate
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const template = this.templates.get(id)
    if (!template) return false

    this.templates.delete(id)

    // Remove from collections
    this.collections.forEach(collection => {
      const index = collection.templateIds.indexOf(id)
      if (index > -1) {
        collection.templateIds.splice(index, 1)
      }
    })

    // Delete versions
    this.versions.delete(id)

    await this.saveTemplates()
    await this.saveCollections()
    await this.updateCategoryCount(template.category, -1)
    await this.updateAnalytics()

    this.emit('templateDeleted', id)
    return true
  }

  async getTemplate(id: string): Promise<PromptTemplate | null> {
    return this.templates.get(id) || null
  }

  async getTemplates(filters: {
    category?: string
    tags?: string[]
    author?: string
    isPublic?: boolean
    search?: string
    sortBy?: 'name' | 'rating' | 'usage' | 'created' | 'updated'
    sortOrder?: 'asc' | 'desc'
    limit?: number
    offset?: number
  } = {}): Promise<{ templates: PromptTemplate[]; total: number }> {
    let templates = Array.from(this.templates.values())

    // Apply filters
    if (filters.category) {
      templates = templates.filter(t => t.category === filters.category)
    }

    if (filters.tags && filters.tags.length > 0) {
      templates = templates.filter(t =>
        filters.tags!.some(tag => t.tags.includes(tag))
      )
    }

    if (filters.author) {
      templates = templates.filter(t => t.author === filters.author)
    }

    if (filters.isPublic !== undefined) {
      templates = templates.filter(t => t.isPublic === filters.isPublic)
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(searchLower) ||
        t.description.toLowerCase().includes(searchLower) ||
        t.content.toLowerCase().includes(searchLower) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Sort templates
    const sortBy = filters.sortBy || 'updated'
    const sortOrder = filters.sortOrder || 'desc'

    templates.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'rating':
          comparison = a.rating - b.rating
          break
        case 'usage':
          comparison = a.usageCount - b.usageCount
          break
        case 'created':
          comparison = a.createdAt - b.createdAt
          break
        case 'updated':
          comparison = a.updatedAt - b.updatedAt
          break
        default:
          comparison = a.updatedAt - b.updatedAt
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

    const total = templates.length
    const offset = filters.offset || 0
    const limit = filters.limit || total

    templates = templates.slice(offset, offset + limit)

    return { templates, total }
  }

  // Template usage and rating
  async useTemplate(id: string): Promise<PromptTemplate | null> {
    const template = this.templates.get(id)
    if (!template) return null

    template.usageCount++
    template.updatedAt = Date.now()

    this.templates.set(id, template)
    await this.saveTemplates()
    await this.updateAnalytics()

    this.emit('templateUsed', template)
    return template
  }

  async rateTemplate(id: string, rating: number): Promise<PromptTemplate | null> {
    const template = this.templates.get(id)
    if (!template || rating < 1 || rating > 5) return null

    const totalRating = template.rating * template.ratingCount + rating
    template.ratingCount++
    template.rating = totalRating / template.ratingCount

    this.templates.set(id, template)
    await this.saveTemplates()
    await this.updateAnalytics()

    this.emit('templateRated', template)
    return template
  }

  // Template rendering with variables
  async renderTemplate(id: string, variables: { [key: string]: any }): Promise<{ content: string; errors: string[] }> {
    const template = this.templates.get(id)
    if (!template) {
      return { content: '', errors: ['Template not found'] }
    }

    const errors: string[] = []
    let content = template.content

    // Validate required variables
    template.variables.forEach(variable => {
      if (variable.required && (variables[variable.name] === undefined || variables[variable.name] === '')) {
        errors.push(`Required variable '${variable.name}' is missing`)
      }
    })

    // Validate variable values
    template.variables.forEach(variable => {
      const value = variables[variable.name]
      if (value !== undefined && value !== '') {
        const validationError = this.validateVariable(variable, value)
        if (validationError) {
          errors.push(validationError)
        }
      }
    })

    if (errors.length > 0) {
      return { content: '', errors }
    }

    // Replace variables in content
    template.variables.forEach(variable => {
      const value = variables[variable.name] !== undefined ?
        variables[variable.name] :
        variable.defaultValue || ''

      const regex = new RegExp(`{{${variable.name}}}`, 'g')
      content = content.replace(regex, String(value))
    })

    // Record usage
    await this.useTemplate(id)

    return { content, errors: [] }
  }

  // Version management
  private async createVersion(templateId: string, oldContent: string, newContent: string, changes: string): Promise<TemplateVersion> {
    const template = this.templates.get(templateId)
    if (!template) throw new Error('Template not found')

    const versions = this.versions.get(templateId) || []

    // Deactivate current active version
    versions.forEach(v => v.isActive = false)

    const newVersion: TemplateVersion = {
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId,
      version: this.generateVersionNumber(versions.length),
      content: newContent,
      changes,
      author: template.author,
      createdAt: Date.now(),
      isActive: true
    }

    versions.push(newVersion)
    this.versions.set(templateId, versions)
    await this.saveVersions()

    return newVersion
  }

  async getTemplateVersions(templateId: string): Promise<TemplateVersion[]> {
    return this.versions.get(templateId) || []
  }

  async revertToVersion(templateId: string, versionId: string): Promise<PromptTemplate | null> {
    const versions = this.versions.get(templateId) || []
    const version = versions.find(v => v.id === versionId)

    if (!version) return null

    const template = this.templates.get(templateId)
    if (!template) return null

    // Create new version for current state
    await this.createVersion(templateId, template.content, version.content, `Reverted to version ${version.version}`)

    // Update template content
    return await this.updateTemplate(templateId, { content: version.content })
  }

  // Collections management
  async createCollection(collection: Omit<TemplateCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<TemplateCollection> {
    const id = `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()

    const newCollection: TemplateCollection = {
      ...collection,
      id,
      createdAt: now,
      updatedAt: now
    }

    this.collections.set(id, newCollection)
    await this.saveCollections()

    this.emit('collectionCreated', newCollection)
    return newCollection
  }

  async addTemplateToCollection(collectionId: string, templateId: string): Promise<boolean> {
    const collection = this.collections.get(collectionId)
    const template = this.templates.get(templateId)

    if (!collection || !template) return false

    if (!collection.templateIds.includes(templateId)) {
      collection.templateIds.push(templateId)
      collection.updatedAt = Date.now()
      await this.saveCollections()
      this.emit('templateAddedToCollection', { collectionId, templateId })
    }

    return true
  }

  async removeTemplateFromCollection(collectionId: string, templateId: string): Promise<boolean> {
    const collection = this.collections.get(collectionId)
    if (!collection) return false

    const index = collection.templateIds.indexOf(templateId)
    if (index > -1) {
      collection.templateIds.splice(index, 1)
      collection.updatedAt = Date.now()
      await this.saveCollections()
      this.emit('templateRemovedFromCollection', { collectionId, templateId })
    }

    return true
  }

  async getCollections(): Promise<TemplateCollection[]> {
    return Array.from(this.collections.values())
  }

  // Categories management
  async getCategories(): Promise<TemplateCategory[]> {
    return Array.from(this.categories.values())
  }

  async createCategory(category: Omit<TemplateCategory, 'id' | 'templateCount'>): Promise<TemplateCategory> {
    const id = `category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const newCategory: TemplateCategory = {
      ...category,
      id,
      templateCount: 0
    }

    this.categories.set(id, newCategory)
    await this.saveCategories()

    this.emit('categoryCreated', newCategory)
    return newCategory
  }

  // Template optimization
  async optimizeTemplate(id: string): Promise<TemplateOptimization> {
    const template = this.templates.get(id)
    if (!template) throw new Error('Template not found')

    const optimization = await this.analyzeAndOptimizeTemplate(template)
    this.optimizations.set(optimization.id, optimization)

    this.emit('templateOptimized', optimization)
    return optimization
  }

  async getOptimizations(templateId?: string): Promise<TemplateOptimization[]> {
    const optimizations = Array.from(this.optimizations.values())
    return templateId ?
      optimizations.filter(opt => opt.templateId === templateId) :
      optimizations
  }

  async applyOptimization(optimizationId: string): Promise<PromptTemplate | null> {
    const optimization = this.optimizations.get(optimizationId)
    if (!optimization) return null

    const template = await this.updateTemplate(optimization.templateId, {
      content: optimization.optimizedContent
    })

    optimization.status = 'applied'
    return template
  }

  // Analytics
  async getAnalytics(): Promise<TemplateAnalytics> {
    await this.updateAnalytics()
    return { ...this.analytics }
  }

  // Helper methods
  private validateVariable(variable: TemplateVariable, value: any): string | null {
    if (!variable.validation) return null

    const validation = variable.validation

    if (variable.type === 'text' || variable.type === 'multiline') {
      const stringValue = String(value)
      if (validation.minLength && stringValue.length < validation.minLength) {
        return `Variable '${variable.name}' must be at least ${validation.minLength} characters`
      }
      if (validation.maxLength && stringValue.length > validation.maxLength) {
        return `Variable '${variable.name}' must be at most ${validation.maxLength} characters`
      }
      if (validation.pattern && !new RegExp(validation.pattern).test(stringValue)) {
        return `Variable '${variable.name}' does not match the required pattern`
      }
    }

    if (variable.type === 'number') {
      const numValue = Number(value)
      if (validation.min && numValue < validation.min) {
        return `Variable '${variable.name}' must be at least ${validation.min}`
      }
      if (validation.max && numValue > validation.max) {
        return `Variable '${variable.name}' must be at most ${validation.max}`
      }
    }

    return null
  }

  private generateVersionNumber(existingVersions: number): string {
    const major = Math.floor(existingVersions / 100) + 1
    const minor = Math.floor((existingVersions % 100) / 10)
    const patch = existingVersions % 10
    return `${major}.${minor}.${patch}`
  }

  private async analyzeAndOptimizeTemplate(template: PromptTemplate): Promise<TemplateOptimization> {
    const improvements = []

    // Analyze clarity
    const clarityScore = this.analyzeClarityScore(template.content)
    if (clarityScore < 0.7) {
      improvements.push({
        type: 'clarity' as const,
        description: '提示词可能存在歧义，建议使用更清晰的表达',
        impact: 'medium' as const
      })
    }

    // Analyze specificity
    const specificityScore = this.analyzeSpecificityScore(template.content)
    if (specificityScore < 0.6) {
      improvements.push({
        type: 'specificity' as const,
        description: '提示词不够具体，建议添加更多细节和要求',
        impact: 'high' as const
      })
    }

    // Analyze structure
    const structureScore = this.analyzeStructureScore(template.content)
    if (structureScore < 0.8) {
      improvements.push({
        type: 'structure' as const,
        description: '提示词结构可以优化，建议使用编号列表或分段',
        impact: 'medium' as const
      })
    }

    // Generate optimized content
    const optimizedContent = this.generateOptimizedContent(template.content, improvements)

    const optimization: TemplateOptimization = {
      id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateId: template.id,
      originalContent: template.content,
      optimizedContent,
      improvements,
      metrics: {
        readabilityScore: clarityScore,
        complexityScore: this.calculateComplexityScore(template.content),
        tokenReduction: Math.max(0, template.content.length - optimizedContent.length),
        estimatedPerformanceImprovement: improvements.length * 0.1
      },
      status: 'pending',
      createdAt: Date.now()
    }

    return optimization
  }

  private analyzeClarityScore(content: string): number {
    // Simple heuristic for clarity analysis
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength = sentences.reduce((acc, s) => acc + s.split(' ').length, 0) / sentences.length
    const complexWords = content.split(' ').filter(word => word.length > 10).length

    let score = 1.0
    if (avgSentenceLength > 20) score -= 0.2
    if (complexWords > 5) score -= 0.1

    return Math.max(0, score)
  }

  private analyzeSpecificityScore(content: string): number {
    const specificityKeywords = ['具体', '详细', '准确', '明确', '例如', '比如', '包括', '要求', '必须', '应该']
    const words = content.split(/\s+/)
    const specificWords = words.filter(word =>
      specificityKeywords.some(kw => word.includes(kw))
    ).length

    return Math.min(1, specificWords / 10)
  }

  private analyzeStructureScore(content: string): number {
    let score = 0.5

    // Check for numbered lists
    if (/\d+\.\s/.test(content)) score += 0.2

    // Check for bullet points
    if (/[-*•]\s/.test(content)) score += 0.1

    // Check for sections
    if (/\n\n/.test(content)) score += 0.1

    // Check for headers
    if (/\*\*.*\*\*/.test(content)) score += 0.1

    return Math.min(1, score)
  }

  private calculateComplexityScore(content: string): number {
    const words = content.split(/\s+/)
    const avgWordLength = words.reduce((acc, word) => acc + word.length, 0) / words.length
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength = words.length / sentences.length

    return Math.min(1, (avgWordLength * avgSentenceLength) / 100)
  }

  private generateOptimizedContent(content: string, improvements: any[]): string {
    let optimized = content

    improvements.forEach(improvement => {
      switch (improvement.type) {
        case 'structure':
          // Add basic structure if missing
          if (!optimized.includes('1.') && !optimized.includes('-')) {
            const sentences = optimized.split(/[.!?]+/).filter(s => s.trim().length > 0)
            if (sentences.length > 1) {
              optimized = sentences.map((sentence, index) =>
                `${index + 1}. ${sentence.trim()}`
              ).join('\n\n')
            }
          }
          break
        case 'clarity':
          // Add clarifying phrases
          if (!optimized.includes('请') && !optimized.includes('确保')) {
            optimized = `请${optimized}`
          }
          break
      }
    })

    return optimized
  }

  private async updateAnalytics(): Promise<void> {
    const templates = Array.from(this.templates.values())

    this.analytics.totalTemplates = templates.length
    this.analytics.totalUsage = templates.reduce((acc, t) => acc + t.usageCount, 0)

    // Popular categories
    const categoryUsage: { [key: string]: number } = {}
    templates.forEach(template => {
      categoryUsage[template.category] = (categoryUsage[template.category] || 0) + template.usageCount
    })

    this.analytics.popularCategories = Object.entries(categoryUsage)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Top rated templates
    this.analytics.topRatedTemplates = templates
      .filter(t => t.ratingCount > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10)
      .map(t => ({ templateId: t.id, rating: t.rating }))

    // Recently created
    this.analytics.recentlyCreated = templates
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5)

    // Trending templates (most used in last 7 days)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    this.analytics.trendingTemplates = templates
      .filter(t => t.updatedAt > weekAgo)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
  }

  private async updateCategoryCount(categoryId: string, delta: number): Promise<void> {
    const category = this.categories.get(categoryId)
    if (category) {
      category.templateCount = Math.max(0, category.templateCount + delta)
      this.categories.set(categoryId, category)
      await this.saveCategories()
    }
  }

  private initializeDefaultCategories(): void {
    DEFAULT_CATEGORIES.forEach(category => {
      this.categories.set(category.id, { ...category })
    })
  }

  private createBuiltinTemplates(): void {
    BUILTIN_TEMPLATES.forEach(templateData => {
      const id = `builtin_${templateData.name.replace(/\s+/g, '_').toLowerCase()}`
      const now = Date.now()

      if (!this.templates.has(id)) {
        const template: PromptTemplate = {
          ...templateData,
          id,
          createdAt: now,
          updatedAt: now,
          usageCount: 0,
          rating: 4.5,
          ratingCount: 10
        }

        this.templates.set(id, template)
        this.updateCategoryCount(template.category, 1)
      }
    })
  }

  // Storage methods
  private async loadTemplates(): Promise<void> {
    try {
      const data = localStorage.getItem('prompt_templates')
      if (data) {
        const parsed = JSON.parse(data)
        parsed.forEach((template: PromptTemplate) => {
          this.templates.set(template.id, template)
        })
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  private async saveTemplates(): Promise<void> {
    try {
      const data = Array.from(this.templates.values())
      localStorage.setItem('prompt_templates', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save templates:', error)
    }
  }

  private async loadCollections(): Promise<void> {
    try {
      const data = localStorage.getItem('template_collections')
      if (data) {
        const parsed = JSON.parse(data)
        parsed.forEach((collection: TemplateCollection) => {
          this.collections.set(collection.id, collection)
        })
      }
    } catch (error) {
      console.error('Failed to load collections:', error)
    }
  }

  private async saveCollections(): Promise<void> {
    try {
      const data = Array.from(this.collections.values())
      localStorage.setItem('template_collections', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save collections:', error)
    }
  }

  private async loadVersions(): Promise<void> {
    try {
      const data = localStorage.getItem('template_versions')
      if (data) {
        const parsed = JSON.parse(data)
        Object.entries(parsed).forEach(([templateId, versions]) => {
          this.versions.set(templateId, versions as TemplateVersion[])
        })
      }
    } catch (error) {
      console.error('Failed to load versions:', error)
    }
  }

  private async saveVersions(): Promise<void> {
    try {
      const data = Object.fromEntries(this.versions.entries())
      localStorage.setItem('template_versions', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save versions:', error)
    }
  }

  private async saveCategories(): Promise<void> {
    try {
      const data = Array.from(this.categories.values())
      localStorage.setItem('template_categories', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save categories:', error)
    }
  }
}

// Create singleton instance
const promptTemplateService = new PromptTemplateService()
export default promptTemplateService
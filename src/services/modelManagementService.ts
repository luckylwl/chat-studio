import type { Conversation, Message } from '@/types'

export interface AIModel {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'cohere' | 'huggingface' | 'local'
  category: 'chat' | 'completion' | 'code' | 'image' | 'audio' | 'embedding'
  capabilities: ModelCapability[]
  maxTokens: number
  contextWindow: number
  costPer1KTokens: {
    input: number
    output: number
  }
  latencyMs: number
  qualityScore: number
  isAvailable: boolean
  isDeprecated: boolean
  releaseDate: string
  description: string
  strengths: string[]
  limitations: string[]
  useCases: string[]
  supportedLanguages: string[]
  parameters?: {
    temperature?: { min: number; max: number; default: number }
    topP?: { min: number; max: number; default: number }
    frequencyPenalty?: { min: number; max: number; default: number }
    presencePenalty?: { min: number; max: number; default: number }
  }
}

export interface ModelCapability {
  type: 'text' | 'code' | 'math' | 'reasoning' | 'creative' | 'analysis' | 'multimodal' | 'function_calling' | 'web_browsing'
  level: 'basic' | 'intermediate' | 'advanced' | 'expert'
  score: number // 0-100
}

export interface ModelPerformanceMetrics {
  modelId: string
  totalRequests: number
  successRate: number
  averageLatency: number
  averageTokensPerRequest: number
  totalCost: number
  lastUsed: number
  popularityScore: number
  userRating: number
  errorTypes: { [error: string]: number }
}

export interface ModelRecommendation {
  modelId: string
  score: number
  reasons: string[]
  estimatedCost: number
  estimatedLatency: number
  confidenceLevel: number
}

class ModelManagementService {
  private static instance: ModelManagementService
  private models: Map<string, AIModel> = new Map()
  private performanceMetrics: Map<string, ModelPerformanceMetrics> = new Map()
  private modelPreferences: Map<string, number> = new Map()
  private modelAliases: Map<string, string> = new Map()

  constructor() {
    this.initializeModels()
    this.loadPerformanceMetrics()
    this.setupModelAliases()
  }

  static getInstance(): ModelManagementService {
    if (!ModelManagementService.instance) {
      ModelManagementService.instance = new ModelManagementService()
    }
    return ModelManagementService.instance
  }

  private initializeModels() {
    const models: AIModel[] = [
      // OpenAI Models
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        category: 'chat',
        capabilities: [
          { type: 'text', level: 'expert', score: 95 },
          { type: 'reasoning', level: 'expert', score: 92 },
          { type: 'code', level: 'expert', score: 90 },
          { type: 'math', level: 'expert', score: 88 },
          { type: 'creative', level: 'expert', score: 85 },
          { type: 'multimodal', level: 'advanced', score: 82 }
        ],
        maxTokens: 4096,
        contextWindow: 128000,
        costPer1KTokens: { input: 0.005, output: 0.015 },
        latencyMs: 1200,
        qualityScore: 92,
        isAvailable: true,
        isDeprecated: false,
        releaseDate: '2024-05-13',
        description: 'Most advanced GPT-4 model with multimodal capabilities',
        strengths: ['Reasoning', 'Code generation', 'Multimodal understanding', 'Complex tasks'],
        limitations: ['High cost', 'Slower response time'],
        useCases: ['Complex analysis', 'Code development', 'Research assistance', 'Creative writing'],
        supportedLanguages: ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko', 'ru', 'pt', 'it'],
        parameters: {
          temperature: { min: 0, max: 2, default: 0.7 },
          topP: { min: 0, max: 1, default: 1 },
          frequencyPenalty: { min: -2, max: 2, default: 0 },
          presencePenalty: { min: -2, max: 2, default: 0 }
        }
      },
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'openai',
        category: 'chat',
        capabilities: [
          { type: 'text', level: 'expert', score: 90 },
          { type: 'reasoning', level: 'expert', score: 88 },
          { type: 'code', level: 'expert', score: 85 },
          { type: 'math', level: 'advanced', score: 82 }
        ],
        maxTokens: 4096,
        contextWindow: 128000,
        costPer1KTokens: { input: 0.01, output: 0.03 },
        latencyMs: 800,
        qualityScore: 88,
        isAvailable: true,
        isDeprecated: false,
        releaseDate: '2024-04-09',
        description: 'Faster and more cost-effective GPT-4 variant',
        strengths: ['Fast response', 'Good reasoning', 'Cost-effective'],
        limitations: ['Slightly lower quality than GPT-4o'],
        useCases: ['General chat', 'Code assistance', 'Content creation'],
        supportedLanguages: ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko'],
        parameters: {
          temperature: { min: 0, max: 2, default: 0.7 },
          topP: { min: 0, max: 1, default: 1 }
        }
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        category: 'chat',
        capabilities: [
          { type: 'text', level: 'advanced', score: 80 },
          { type: 'code', level: 'advanced', score: 75 },
          { type: 'creative', level: 'advanced', score: 78 }
        ],
        maxTokens: 4096,
        contextWindow: 16385,
        costPer1KTokens: { input: 0.0005, output: 0.0015 },
        latencyMs: 500,
        qualityScore: 75,
        isAvailable: true,
        isDeprecated: false,
        releaseDate: '2023-03-01',
        description: 'Fast and cost-effective model for most tasks',
        strengths: ['Very fast', 'Low cost', 'Good general performance'],
        limitations: ['Lower quality than GPT-4', 'Smaller context window'],
        useCases: ['Quick responses', 'Simple tasks', 'High-volume usage'],
        supportedLanguages: ['en', 'zh', 'es', 'fr', 'de'],
        parameters: {
          temperature: { min: 0, max: 2, default: 0.7 },
          topP: { min: 0, max: 1, default: 1 }
        }
      },
      // Anthropic Models
      {
        id: 'claude-3-5-sonnet',
        name: 'Claude 3.5 Sonnet',
        provider: 'anthropic',
        category: 'chat',
        capabilities: [
          { type: 'text', level: 'expert', score: 93 },
          { type: 'reasoning', level: 'expert', score: 95 },
          { type: 'code', level: 'expert', score: 92 },
          { type: 'analysis', level: 'expert', score: 90 },
          { type: 'creative', level: 'expert', score: 88 }
        ],
        maxTokens: 4096,
        contextWindow: 200000,
        costPer1KTokens: { input: 0.003, output: 0.015 },
        latencyMs: 1000,
        qualityScore: 93,
        isAvailable: true,
        isDeprecated: false,
        releaseDate: '2024-06-20',
        description: 'Anthropic\'s most capable model with exceptional reasoning',
        strengths: ['Excellent reasoning', 'Large context', 'High quality responses', 'Safety-focused'],
        limitations: ['Higher cost', 'Slower than some alternatives'],
        useCases: ['Complex analysis', 'Research', 'Technical writing', 'Safety-critical applications'],
        supportedLanguages: ['en', 'zh', 'es', 'fr', 'de', 'ja'],
        parameters: {
          temperature: { min: 0, max: 1, default: 0.7 }
        }
      },
      {
        id: 'claude-3-haiku',
        name: 'Claude 3 Haiku',
        provider: 'anthropic',
        category: 'chat',
        capabilities: [
          { type: 'text', level: 'advanced', score: 82 },
          { type: 'reasoning', level: 'advanced', score: 80 },
          { type: 'code', level: 'intermediate', score: 70 }
        ],
        maxTokens: 4096,
        contextWindow: 200000,
        costPer1KTokens: { input: 0.00025, output: 0.00125 },
        latencyMs: 300,
        qualityScore: 78,
        isAvailable: true,
        isDeprecated: false,
        releaseDate: '2024-03-07',
        description: 'Fast and cost-effective Claude model',
        strengths: ['Very fast', 'Low cost', 'Large context window'],
        limitations: ['Lower quality than Sonnet', 'Less capable reasoning'],
        useCases: ['Quick responses', 'Simple tasks', 'High-volume processing'],
        supportedLanguages: ['en', 'zh', 'es', 'fr'],
        parameters: {
          temperature: { min: 0, max: 1, default: 0.7 }
        }
      },
      // Google Models
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'google',
        category: 'chat',
        capabilities: [
          { type: 'text', level: 'expert', score: 89 },
          { type: 'multimodal', level: 'expert', score: 94 },
          { type: 'code', level: 'advanced', score: 85 },
          { type: 'reasoning', level: 'advanced', score: 87 }
        ],
        maxTokens: 8192,
        contextWindow: 1000000,
        costPer1KTokens: { input: 0.00125, output: 0.005 },
        latencyMs: 900,
        qualityScore: 87,
        isAvailable: true,
        isDeprecated: false,
        releaseDate: '2024-02-15',
        description: 'Google\'s multimodal model with massive context window',
        strengths: ['Huge context window', 'Excellent multimodal', 'Good performance'],
        limitations: ['Limited availability', 'Newer model'],
        useCases: ['Long document analysis', 'Multimodal tasks', 'Large context processing'],
        supportedLanguages: ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de'],
        parameters: {
          temperature: { min: 0, max: 2, default: 0.9 },
          topP: { min: 0, max: 1, default: 1 }
        }
      }
    ]

    models.forEach(model => {
      this.models.set(model.id, model)
      // Initialize performance metrics
      this.performanceMetrics.set(model.id, {
        modelId: model.id,
        totalRequests: 0,
        successRate: 1.0,
        averageLatency: model.latencyMs,
        averageTokensPerRequest: 100,
        totalCost: 0,
        lastUsed: 0,
        popularityScore: 0,
        userRating: 0,
        errorTypes: {}
      })
    })
  }

  private loadPerformanceMetrics() {
    try {
      const stored = localStorage.getItem('model-performance-metrics')
      if (stored) {
        const metrics = JSON.parse(stored)
        Object.entries(metrics).forEach(([modelId, data]: [string, any]) => {
          this.performanceMetrics.set(modelId, data)
        })
      }
    } catch (error) {
      console.error('Failed to load performance metrics:', error)
    }
  }

  private savePerformanceMetrics() {
    try {
      const metrics = Object.fromEntries(this.performanceMetrics)
      localStorage.setItem('model-performance-metrics', JSON.stringify(metrics))
    } catch (error) {
      console.error('Failed to save performance metrics:', error)
    }
  }

  private setupModelAliases() {
    // Setup common aliases for easier model selection
    this.modelAliases.set('gpt4', 'gpt-4o')
    this.modelAliases.set('gpt-4', 'gpt-4o')
    this.modelAliases.set('gpt3.5', 'gpt-3.5-turbo')
    this.modelAliases.set('claude', 'claude-3-5-sonnet')
    this.modelAliases.set('claude-3', 'claude-3-5-sonnet')
    this.modelAliases.set('gemini', 'gemini-1.5-pro')
    this.modelAliases.set('fastest', 'gpt-3.5-turbo')
    this.modelAliases.set('cheapest', 'claude-3-haiku')
    this.modelAliases.set('best', 'claude-3-5-sonnet')
    this.modelAliases.set('smartest', 'gpt-4o')
  }

  // Public API Methods
  getAllModels(): AIModel[] {
    return Array.from(this.models.values())
      .filter(model => model.isAvailable && !model.isDeprecated)
      .sort((a, b) => b.qualityScore - a.qualityScore)
  }

  getModelsByProvider(provider: string): AIModel[] {
    return this.getAllModels().filter(model => model.provider === provider)
  }

  getModelsByCategory(category: string): AIModel[] {
    return this.getAllModels().filter(model => model.category === category)
  }

  getModel(modelId: string): AIModel | null {
    // Check for alias first
    const actualId = this.modelAliases.get(modelId) || modelId
    return this.models.get(actualId) || null
  }

  getModelRecommendations(
    context: {
      messageContent?: string
      conversationHistory?: Message[]
      taskType?: string
      prioritizeSpeed?: boolean
      prioritizeCost?: boolean
      prioritizeQuality?: boolean
      maxBudget?: number
    }
  ): ModelRecommendation[] {
    const availableModels = this.getAllModels()
    const recommendations: ModelRecommendation[] = []

    for (const model of availableModels) {
      const score = this.calculateModelScore(model, context)
      const estimatedTokens = this.estimateTokenCount(context.messageContent || '', context.conversationHistory)
      const estimatedCost = this.calculateCost(model, estimatedTokens)
      const estimatedLatency = this.getEstimatedLatency(model)

      if (context.maxBudget && estimatedCost > context.maxBudget) {
        continue // Skip models that exceed budget
      }

      recommendations.push({
        modelId: model.id,
        score,
        reasons: this.generateRecommendationReasons(model, context, score),
        estimatedCost,
        estimatedLatency,
        confidenceLevel: Math.min(score / 100, 0.95)
      })
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // Return top 5 recommendations
  }

  private calculateModelScore(model: AIModel, context: any): number {
    let score = model.qualityScore

    // Adjust based on task type
    if (context.taskType) {
      const relevantCapability = model.capabilities.find(cap =>
        cap.type === context.taskType ||
        this.getTaskTypeMapping(context.taskType).includes(cap.type)
      )
      if (relevantCapability) {
        score += relevantCapability.score * 0.3
      }
    }

    // Performance metrics adjustment
    const metrics = this.performanceMetrics.get(model.id)
    if (metrics) {
      score += (metrics.successRate - 0.8) * 50 // Bonus for high success rate
      score += Math.max(0, (2000 - metrics.averageLatency) / 2000) * 10 // Bonus for low latency
      score += metrics.popularityScore * 0.1 // Small bonus for popularity
      score += metrics.userRating * 0.05 // Small bonus for user rating
    }

    // Priority adjustments
    if (context.prioritizeSpeed) {
      score += Math.max(0, (2000 - model.latencyMs) / 2000) * 20
    }
    if (context.prioritizeCost) {
      const avgCost = (model.costPer1KTokens.input + model.costPer1KTokens.output) / 2
      score += Math.max(0, (0.01 - avgCost) / 0.01) * 20
    }
    if (context.prioritizeQuality) {
      score += model.qualityScore * 0.2
    }

    return Math.min(100, Math.max(0, score))
  }

  private getTaskTypeMapping(taskType: string): string[] {
    const mappings: { [key: string]: string[] } = {
      'coding': ['code', 'reasoning'],
      'writing': ['creative', 'text'],
      'analysis': ['reasoning', 'analysis', 'text'],
      'math': ['math', 'reasoning'],
      'translation': ['text'],
      'summary': ['text', 'analysis']
    }
    return mappings[taskType] || ['text']
  }

  private generateRecommendationReasons(model: AIModel, context: any, score: number): string[] {
    const reasons: string[] = []

    if (score >= 90) reasons.push('Excellent match for your requirements')
    if (model.qualityScore >= 90) reasons.push('High quality responses')
    if (model.latencyMs < 600) reasons.push('Fast response time')
    if (model.costPer1KTokens.input < 0.002) reasons.push('Cost-effective')
    if (model.contextWindow > 50000) reasons.push('Large context window')

    const metrics = this.performanceMetrics.get(model.id)
    if (metrics?.successRate > 0.95) reasons.push('High reliability')
    if (metrics?.userRating > 4.0) reasons.push('Highly rated by users')

    if (context.prioritizeSpeed && model.latencyMs < 500) {
      reasons.push('Optimized for speed')
    }
    if (context.prioritizeCost && model.costPer1KTokens.input < 0.001) {
      reasons.push('Budget-friendly option')
    }

    return reasons.slice(0, 3) // Limit to top 3 reasons
  }

  private estimateTokenCount(content: string, history?: Message[]): number {
    // Simple token estimation (roughly 4 characters per token)
    let totalTokens = Math.ceil(content.length / 4)

    if (history) {
      totalTokens += history.reduce((acc, msg) => acc + Math.ceil(msg.content.length / 4), 0)
    }

    return totalTokens
  }

  private calculateCost(model: AIModel, tokenCount: number): number {
    const inputTokens = Math.ceil(tokenCount * 0.7) // Estimate 70% input
    const outputTokens = Math.ceil(tokenCount * 0.3) // Estimate 30% output

    return (
      (inputTokens / 1000) * model.costPer1KTokens.input +
      (outputTokens / 1000) * model.costPer1KTokens.output
    )
  }

  private getEstimatedLatency(model: AIModel): number {
    const metrics = this.performanceMetrics.get(model.id)
    if (metrics && metrics.totalRequests > 10) {
      return metrics.averageLatency
    }
    return model.latencyMs
  }

  // Performance tracking methods
  recordModelUsage(
    modelId: string,
    latency: number,
    tokenCount: number,
    success: boolean,
    cost: number,
    error?: string
  ) {
    const metrics = this.performanceMetrics.get(modelId)
    if (!metrics) return

    metrics.totalRequests++
    metrics.lastUsed = Date.now()
    metrics.totalCost += cost

    // Update averages
    metrics.averageLatency = (metrics.averageLatency * (metrics.totalRequests - 1) + latency) / metrics.totalRequests
    metrics.averageTokensPerRequest = (metrics.averageTokensPerRequest * (metrics.totalRequests - 1) + tokenCount) / metrics.totalRequests

    // Update success rate
    const successCount = Math.round(metrics.successRate * (metrics.totalRequests - 1)) + (success ? 1 : 0)
    metrics.successRate = successCount / metrics.totalRequests

    // Track errors
    if (!success && error) {
      metrics.errorTypes[error] = (metrics.errorTypes[error] || 0) + 1
    }

    // Update popularity score (recent usage weighted more heavily)
    const recentWeight = Math.min(1, metrics.totalRequests / 100)
    metrics.popularityScore = metrics.popularityScore * 0.9 + recentWeight

    this.savePerformanceMetrics()
  }

  setUserRating(modelId: string, rating: number) {
    const metrics = this.performanceMetrics.get(modelId)
    if (metrics) {
      metrics.userRating = rating
      this.savePerformanceMetrics()
    }
  }

  getModelPerformance(modelId: string): ModelPerformanceMetrics | null {
    return this.performanceMetrics.get(modelId) || null
  }

  // Model comparison
  compareModels(modelIds: string[]): any {
    const models = modelIds.map(id => this.getModel(id)).filter(Boolean) as AIModel[]
    const metrics = modelIds.map(id => this.getModelPerformance(id)).filter(Boolean) as ModelPerformanceMetrics[]

    return {
      models,
      comparison: {
        quality: models.map(m => ({ id: m.id, score: m.qualityScore })),
        speed: models.map(m => ({ id: m.id, latency: m.latencyMs })),
        cost: models.map(m => ({
          id: m.id,
          costPer1K: (m.costPer1KTokens.input + m.costPer1KTokens.output) / 2
        })),
        reliability: metrics.map(m => ({ id: m.modelId, successRate: m.successRate }))
      }
    }
  }

  // Smart model switching
  shouldSwitchModel(
    currentModelId: string,
    context: {
      errorCount?: number
      averageLatency?: number
      taskType?: string
      userFeedback?: 'positive' | 'negative'
    }
  ): ModelRecommendation | null {
    const currentModel = this.getModel(currentModelId)
    if (!currentModel) return null

    const currentMetrics = this.getModelPerformance(currentModelId)

    // Conditions for switching
    const shouldSwitch = (
      (context.errorCount && context.errorCount > 3) ||
      (context.averageLatency && context.averageLatency > currentModel.latencyMs * 2) ||
      (context.userFeedback === 'negative') ||
      (currentMetrics && currentMetrics.successRate < 0.8)
    )

    if (!shouldSwitch) return null

    // Get recommendations excluding current model
    const recommendations = this.getModelRecommendations({
      taskType: context.taskType,
      prioritizeSpeed: context.averageLatency ? true : false
    }).filter(rec => rec.modelId !== currentModelId)

    return recommendations[0] || null
  }

  // Utility methods
  getProviders(): string[] {
    return Array.from(new Set(this.getAllModels().map(m => m.provider)))
  }

  getCategories(): string[] {
    return Array.from(new Set(this.getAllModels().map(m => m.category)))
  }

  getModelsByCapability(capability: string, minLevel: string = 'intermediate'): AIModel[] {
    const levelOrder = ['basic', 'intermediate', 'advanced', 'expert']
    const minLevelIndex = levelOrder.indexOf(minLevel)

    return this.getAllModels().filter(model =>
      model.capabilities.some(cap =>
        cap.type === capability && levelOrder.indexOf(cap.level) >= minLevelIndex
      )
    )
  }

  // Export/Import model preferences
  exportModelPreferences(): any {
    return {
      preferences: Object.fromEntries(this.modelPreferences),
      performanceMetrics: Object.fromEntries(this.performanceMetrics),
      timestamp: Date.now()
    }
  }

  importModelPreferences(data: any) {
    try {
      if (data.preferences) {
        this.modelPreferences = new Map(Object.entries(data.preferences))
      }
      if (data.performanceMetrics) {
        Object.entries(data.performanceMetrics).forEach(([id, metrics]: [string, any]) => {
          this.performanceMetrics.set(id, metrics)
        })
        this.savePerformanceMetrics()
      }
    } catch (error) {
      console.error('Failed to import model preferences:', error)
    }
  }
}

export const modelManagementService = ModelManagementService.getInstance()
export default modelManagementService
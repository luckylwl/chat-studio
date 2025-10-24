import { EventEmitter } from '@/utils/EventEmitter'

// Types for intelligent content moderation
export interface ModerationRule {
  id: string
  name: string
  description: string
  category: 'safety' | 'policy' | 'quality' | 'privacy' | 'spam' | 'custom'
  type: 'keyword' | 'pattern' | 'ai_classifier' | 'sentiment' | 'toxicity' | 'pii'
  isActive: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  config: RuleConfig
  actions: ModerationAction[]
  whitelist: string[]
  blacklist: string[]
  organizationId?: string
  createdAt: number
  updatedAt: number
  createdBy: string
}

export interface RuleConfig {
  keywords?: string[]
  patterns?: string[]
  threshold?: number
  languages?: string[]
  contextWindow?: number
  exclusions?: string[]
  customFields?: { [key: string]: any }
}

export interface ModerationAction {
  type: 'block' | 'flag' | 'warn' | 'review' | 'replace' | 'escalate' | 'log' | 'notify'
  config: ActionConfig
  conditions?: ActionCondition[]
}

export interface ActionConfig {
  replacement?: string
  reviewQueue?: string
  escalateTo?: string[]
  notifyUsers?: string[]
  blockDuration?: number
  warningMessage?: string
}

export interface ActionCondition {
  field: string
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains'
  value: any
}

export interface ModerationResult {
  id: string
  contentId: string
  content: string
  contentType: 'message' | 'file' | 'image' | 'document'
  userId: string
  organizationId: string
  timestamp: number
  results: {
    toxicity: ToxicityResult
    safety: SafetyResult
    privacy: PrivacyResult
    quality: QualityResult
    custom: CustomResult[]
  }
  triggeredRules: TriggeredRule[]
  appliedActions: AppliedAction[]
  status: 'approved' | 'flagged' | 'blocked' | 'under_review' | 'escalated'
  reviewStatus?: ReviewStatus
  confidence: number
  language: string
  metadata: { [key: string]: any }
}

export interface ToxicityResult {
  score: number
  categories: {
    harassment: number
    hateSpeech: number
    sexually_explicit: number
    dangerous: number
    profanity: number
  }
  details: string[]
}

export interface SafetyResult {
  score: number
  categories: {
    violence: number
    selfHarm: number
    illegal: number
    adult: number
  }
  details: string[]
}

export interface PrivacyResult {
  score: number
  detectedPII: PIIDetection[]
  sensitiveDataTypes: string[]
}

export interface PIIDetection {
  type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'ip_address' | 'address' | 'name'
  value: string
  position: { start: number; end: number }
  confidence: number
  suggested_replacement?: string
}

export interface QualityResult {
  score: number
  metrics: {
    coherence: number
    relevance: number
    clarity: number
    completeness: number
  }
  issues: string[]
}

export interface CustomResult {
  ruleId: string
  ruleName: string
  score: number
  matched: boolean
  details: any
}

export interface TriggeredRule {
  ruleId: string
  ruleName: string
  severity: string
  confidence: number
  matchedContent: string[]
  position: { start: number; end: number }[]
}

export interface AppliedAction {
  actionType: string
  actionConfig: any
  timestamp: number
  success: boolean
  details: string
}

export interface ReviewStatus {
  reviewerId?: string
  reviewerName?: string
  reviewedAt?: number
  decision: 'approve' | 'reject' | 'escalate'
  comments?: string
  tags?: string[]
}

export interface ModerationPolicy {
  id: string
  name: string
  description: string
  organizationId: string
  isActive: boolean
  rules: string[] // Rule IDs
  priority: number
  applicableContent: string[]
  enforcement: {
    autoBlock: boolean
    requireReview: boolean
    notifyModerators: boolean
    logAll: boolean
  }
  escalation: {
    enabled: boolean
    threshold: number
    escalateTo: string[]
    timeWindow: number
  }
  reporting: {
    enabled: boolean
    frequency: 'realtime' | 'daily' | 'weekly'
    recipients: string[]
  }
  createdAt: number
  updatedAt: number
}

export interface ModerationQueue {
  id: string
  name: string
  description: string
  organizationId: string
  assignedModerators: string[]
  autoAssignment: boolean
  priority: 'low' | 'medium' | 'high' | 'urgent'
  slaHours: number
  filters: QueueFilter[]
  capacity: number
  currentLoad: number
}

export interface QueueFilter {
  field: string
  operator: string
  value: any
}

export interface ModerationAnalytics {
  totalContent: number
  flaggedContent: number
  blockedContent: number
  approvedContent: number
  averageResponseTime: number
  topViolations: Array<{ rule: string; count: number }>
  trendsOverTime: Array<{
    date: string
    flagged: number
    blocked: number
    approved: number
  }>
  moderatorPerformance: Array<{
    moderatorId: string
    reviewed: number
    accuracy: number
    avgTime: number
  }>
  contentByCategory: { [category: string]: number }
  geographicDistribution: { [region: string]: number }
}

export interface AutoModerationConfig {
  enabled: boolean
  aggressiveness: 'conservative' | 'balanced' | 'aggressive'
  aiModels: {
    toxicity: string
    safety: string
    privacy: string
    quality: string
  }
  thresholds: {
    autoApprove: number
    autoBlock: number
    requireReview: number
  }
  fallbackBehavior: 'approve' | 'block' | 'review'
  realTimeProcessing: boolean
  batchProcessing: {
    enabled: boolean
    batchSize: number
    interval: number
  }
}

// Predefined moderation rules
const PREDEFINED_RULES: Omit<ModerationRule, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    name: '毒性内容检测',
    description: '检测有害、攻击性或不当内容',
    category: 'safety',
    type: 'ai_classifier',
    isActive: true,
    severity: 'high',
    config: {
      threshold: 0.7,
      languages: ['zh', 'en']
    },
    actions: [
      {
        type: 'flag',
        config: { reviewQueue: 'safety_review' }
      },
      {
        type: 'warn',
        config: { warningMessage: '检测到可能的不当内容，请注意言辞' }
      }
    ],
    whitelist: [],
    blacklist: []
  },
  {
    name: '隐私信息保护',
    description: '检测和保护个人身份信息(PII)',
    category: 'privacy',
    type: 'pii',
    isActive: true,
    severity: 'critical',
    config: {
      threshold: 0.8
    },
    actions: [
      {
        type: 'replace',
        config: { replacement: '[已隐藏个人信息]' }
      },
      {
        type: 'log',
        config: {}
      }
    ],
    whitelist: [],
    blacklist: []
  },
  {
    name: '垃圾信息过滤',
    description: '检测垃圾信息和重复内容',
    category: 'spam',
    type: 'pattern',
    isActive: true,
    severity: 'medium',
    config: {
      patterns: [
        '.*免费.*立即.*',
        '.*点击.*链接.*',
        '.*快速.*赚钱.*',
        '.*限时.*优惠.*'
      ],
      threshold: 0.6
    },
    actions: [
      {
        type: 'block',
        config: { blockDuration: 300 }
      }
    ],
    whitelist: [],
    blacklist: []
  },
  {
    name: '敏感词过滤',
    description: '基于关键词的内容过滤',
    category: 'policy',
    type: 'keyword',
    isActive: true,
    severity: 'medium',
    config: {
      keywords: ['敏感词1', '敏感词2', '不当用词'],
      threshold: 1.0
    },
    actions: [
      {
        type: 'replace',
        config: { replacement: '***' }
      },
      {
        type: 'flag',
        config: { reviewQueue: 'policy_review' }
      }
    ],
    whitelist: ['正当使用场景'],
    blacklist: []
  },
  {
    name: '内容质量检查',
    description: '评估内容的质量和相关性',
    category: 'quality',
    type: 'ai_classifier',
    isActive: false,
    severity: 'low',
    config: {
      threshold: 0.3
    },
    actions: [
      {
        type: 'warn',
        config: { warningMessage: '建议提高内容质量' }
      }
    ],
    whitelist: [],
    blacklist: []
  }
]

class ContentModerationService extends EventEmitter {
  private rules: Map<string, ModerationRule> = new Map()
  private policies: Map<string, ModerationPolicy> = new Map()
  private queues: Map<string, ModerationQueue> = new Map()
  private results: Map<string, ModerationResult> = new Map()
  private config: AutoModerationConfig
  private analytics: ModerationAnalytics

  constructor() {
    super()

    this.config = {
      enabled: true,
      aggressiveness: 'balanced',
      aiModels: {
        toxicity: 'toxicity-classifier-v2',
        safety: 'safety-detector-v3',
        privacy: 'pii-detector-v1',
        quality: 'quality-assessor-v1'
      },
      thresholds: {
        autoApprove: 0.2,
        autoBlock: 0.8,
        requireReview: 0.5
      },
      fallbackBehavior: 'review',
      realTimeProcessing: true,
      batchProcessing: {
        enabled: true,
        batchSize: 100,
        interval: 60000
      }
    }

    this.analytics = {
      totalContent: 0,
      flaggedContent: 0,
      blockedContent: 0,
      approvedContent: 0,
      averageResponseTime: 0,
      topViolations: [],
      trendsOverTime: [],
      moderatorPerformance: [],
      contentByCategory: {},
      geographicDistribution: {}
    }

    this.loadRules()
    this.loadPolicies()
    this.loadQueues()
    this.loadResults()
    this.createPredefinedRules()
    this.createDefaultQueues()
  }

  // Content moderation main function
  async moderateContent(
    content: string,
    contentType: 'message' | 'file' | 'image' | 'document',
    userId: string,
    organizationId: string,
    metadata: { [key: string]: any } = {}
  ): Promise<ModerationResult> {
    const contentId = `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()

    // Initialize moderation result
    const result: ModerationResult = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contentId,
      content,
      contentType,
      userId,
      organizationId,
      timestamp,
      results: {
        toxicity: await this.analyzeToxicity(content),
        safety: await this.analyzeSafety(content),
        privacy: await this.analyzePrivacy(content),
        quality: await this.analyzeQuality(content),
        custom: []
      },
      triggeredRules: [],
      appliedActions: [],
      status: 'approved',
      confidence: 0,
      language: this.detectLanguage(content),
      metadata
    }

    // Get applicable rules for organization
    const applicableRules = this.getApplicableRules(organizationId, contentType)

    // Run rules against content
    for (const rule of applicableRules) {
      const ruleResult = await this.evaluateRule(rule, content, result)
      if (ruleResult.matched) {
        result.triggeredRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          confidence: ruleResult.confidence,
          matchedContent: ruleResult.matches,
          position: ruleResult.positions
        })

        // Add custom result
        result.results.custom.push({
          ruleId: rule.id,
          ruleName: rule.name,
          score: ruleResult.confidence,
          matched: true,
          details: ruleResult.details
        })
      }
    }

    // Calculate overall confidence and status
    result.confidence = this.calculateOverallConfidence(result)
    result.status = this.determineStatus(result)

    // Apply actions based on triggered rules
    await this.applyModerationActions(result)

    // Store result
    this.results.set(result.id, result)
    await this.saveResults()

    // Update analytics
    await this.updateAnalytics(result)

    this.emit('contentModerated', result)
    return result
  }

  // Rule evaluation methods
  private async evaluateRule(
    rule: ModerationRule,
    content: string,
    context: ModerationResult
  ): Promise<{
    matched: boolean
    confidence: number
    matches: string[]
    positions: { start: number; end: number }[]
    details: any
  }> {
    if (!rule.isActive) {
      return { matched: false, confidence: 0, matches: [], positions: [], details: {} }
    }

    switch (rule.type) {
      case 'keyword':
        return this.evaluateKeywordRule(rule, content)
      case 'pattern':
        return this.evaluatePatternRule(rule, content)
      case 'ai_classifier':
        return this.evaluateAIClassifierRule(rule, content, context)
      case 'sentiment':
        return this.evaluateSentimentRule(rule, content)
      case 'toxicity':
        return this.evaluateToxicityRule(rule, content, context.results.toxicity)
      case 'pii':
        return this.evaluatePIIRule(rule, content, context.results.privacy)
      default:
        return { matched: false, confidence: 0, matches: [], positions: [], details: {} }
    }
  }

  private evaluateKeywordRule(rule: ModerationRule, content: string) {
    const keywords = rule.config.keywords || []
    const lowerContent = content.toLowerCase()
    const matches: string[] = []
    const positions: { start: number; end: number }[] = []

    for (const keyword of keywords) {
      const lowerKeyword = keyword.toLowerCase()
      let index = lowerContent.indexOf(lowerKeyword)
      while (index !== -1) {
        // Check if it's not in whitelist
        const isWhitelisted = rule.whitelist.some(white =>
          content.toLowerCase().includes(white.toLowerCase())
        )

        if (!isWhitelisted) {
          matches.push(keyword)
          positions.push({ start: index, end: index + keyword.length })
        }

        index = lowerContent.indexOf(lowerKeyword, index + 1)
      }
    }

    const confidence = matches.length > 0 ? Math.min(1.0, matches.length * 0.3) : 0
    const matched = confidence >= (rule.config.threshold || 0.5)

    return {
      matched,
      confidence,
      matches,
      positions,
      details: { matchedKeywords: matches }
    }
  }

  private evaluatePatternRule(rule: ModerationRule, content: string) {
    const patterns = rule.config.patterns || []
    const matches: string[] = []
    const positions: { start: number; end: number }[] = []

    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern, 'gi')
        let match
        while ((match = regex.exec(content)) !== null) {
          matches.push(match[0])
          positions.push({ start: match.index, end: match.index + match[0].length })
        }
      } catch (error) {
        console.error(`Invalid regex pattern: ${pattern}`)
      }
    }

    const confidence = matches.length > 0 ? Math.min(1.0, matches.length * 0.4) : 0
    const matched = confidence >= (rule.config.threshold || 0.5)

    return {
      matched,
      confidence,
      matches,
      positions,
      details: { matchedPatterns: matches }
    }
  }

  private async evaluateAIClassifierRule(
    rule: ModerationRule,
    content: string,
    context: ModerationResult
  ) {
    // Simulate AI classifier evaluation
    let score = 0
    const details: any = {}

    switch (rule.category) {
      case 'safety':
        score = context.results.safety.score
        details.categories = context.results.safety.categories
        break
      case 'quality':
        score = context.results.quality.score
        details.metrics = context.results.quality.metrics
        break
      default:
        score = Math.random() * 0.8 // Simulate classification score
    }

    const threshold = rule.config.threshold || 0.5
    const matched = score >= threshold

    return {
      matched,
      confidence: score,
      matches: matched ? [content.substring(0, 50) + '...'] : [],
      positions: matched ? [{ start: 0, end: content.length }] : [],
      details
    }
  }

  private evaluateSentimentRule(rule: ModerationRule, content: string) {
    // Simple sentiment analysis simulation
    const negativeWords = ['hate', 'angry', 'terrible', 'awful', 'disgusting', '讨厌', '愤怒', '糟糕']
    const positiveWords = ['love', 'great', 'excellent', 'wonderful', '喜欢', '很好', '优秀']

    const words = content.toLowerCase().split(/\s+/)
    let sentimentScore = 0.5 // Neutral baseline

    words.forEach(word => {
      if (negativeWords.some(neg => word.includes(neg))) {
        sentimentScore -= 0.1
      } else if (positiveWords.some(pos => word.includes(pos))) {
        sentimentScore += 0.1
      }
    })

    sentimentScore = Math.max(0, Math.min(1, sentimentScore))

    const threshold = rule.config.threshold || 0.3
    const matched = sentimentScore <= threshold // Low sentiment triggers rule

    return {
      matched,
      confidence: matched ? 1 - sentimentScore : sentimentScore,
      matches: matched ? ['negative sentiment detected'] : [],
      positions: [],
      details: { sentimentScore, analysis: 'sentiment_analysis' }
    }
  }

  private evaluateToxicityRule(rule: ModerationRule, content: string, toxicityResult: ToxicityResult) {
    const threshold = rule.config.threshold || 0.5
    const matched = toxicityResult.score >= threshold

    return {
      matched,
      confidence: toxicityResult.score,
      matches: matched ? toxicityResult.details : [],
      positions: [],
      details: { categories: toxicityResult.categories }
    }
  }

  private evaluatePIIRule(rule: ModerationRule, content: string, privacyResult: PrivacyResult) {
    const threshold = rule.config.threshold || 0.7
    const matched = privacyResult.detectedPII.length > 0 && privacyResult.score >= threshold

    return {
      matched,
      confidence: privacyResult.score,
      matches: matched ? privacyResult.detectedPII.map(pii => pii.value) : [],
      positions: privacyResult.detectedPII.map(pii => pii.position),
      details: { detectedPII: privacyResult.detectedPII }
    }
  }

  // Analysis methods
  private async analyzeToxicity(content: string): Promise<ToxicityResult> {
    // Simulate toxicity analysis
    const toxicKeywords = ['hate', 'kill', 'die', 'stupid', 'idiot', '仇恨', '杀死', '愚蠢', '白痴']
    const words = content.toLowerCase().split(/\s+/)

    let toxicityScore = 0
    const details: string[] = []

    words.forEach(word => {
      if (toxicKeywords.some(toxic => word.includes(toxic))) {
        toxicityScore += 0.3
        details.push(word)
      }
    })

    toxicityScore = Math.min(1, toxicityScore)

    return {
      score: toxicityScore,
      categories: {
        harassment: toxicityScore * 0.8,
        hateSpeech: toxicityScore * 0.6,
        sexually_explicit: Math.random() * 0.2,
        dangerous: toxicityScore * 0.7,
        profanity: toxicityScore * 0.9
      },
      details
    }
  }

  private async analyzeSafety(content: string): Promise<SafetyResult> {
    // Simulate safety analysis
    const violenceKeywords = ['violence', 'fight', 'attack', 'weapon', '暴力', '打架', '攻击', '武器']
    const selfHarmKeywords = ['suicide', 'self-harm', 'hurt myself', '自杀', '自残', '伤害自己']

    let safetyScore = 0
    const details: string[] = []
    const lowerContent = content.toLowerCase()

    if (violenceKeywords.some(kw => lowerContent.includes(kw))) {
      safetyScore += 0.4
      details.push('violence indicators')
    }
    if (selfHarmKeywords.some(kw => lowerContent.includes(kw))) {
      safetyScore += 0.6
      details.push('self-harm indicators')
    }

    return {
      score: Math.min(1, safetyScore),
      categories: {
        violence: safetyScore * 0.8,
        selfHarm: safetyScore * 0.6,
        illegal: Math.random() * 0.3,
        adult: Math.random() * 0.2
      },
      details
    }
  }

  private async analyzePrivacy(content: string): Promise<PrivacyResult> {
    const detectedPII: PIIDetection[] = []

    // Email detection
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g
    let match
    while ((match = emailRegex.exec(content)) !== null) {
      detectedPII.push({
        type: 'email',
        value: match[0],
        position: { start: match.index, end: match.index + match[0].length },
        confidence: 0.95,
        suggested_replacement: '[邮箱地址]'
      })
    }

    // Phone detection (simple pattern)
    const phoneRegex = /\b\d{3}-?\d{3}-?\d{4}\b/g
    while ((match = phoneRegex.exec(content)) !== null) {
      detectedPII.push({
        type: 'phone',
        value: match[0],
        position: { start: match.index, end: match.index + match[0].length },
        confidence: 0.85,
        suggested_replacement: '[电话号码]'
      })
    }

    // Credit card detection (simple pattern)
    const ccRegex = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g
    while ((match = ccRegex.exec(content)) !== null) {
      detectedPII.push({
        type: 'credit_card',
        value: match[0],
        position: { start: match.index, end: match.index + match[0].length },
        confidence: 0.9,
        suggested_replacement: '[信用卡号]'
      })
    }

    const privacyScore = detectedPII.length > 0 ? Math.min(1, detectedPII.length * 0.4) : 0
    const sensitiveDataTypes = [...new Set(detectedPII.map(pii => pii.type))]

    return {
      score: privacyScore,
      detectedPII,
      sensitiveDataTypes
    }
  }

  private async analyzeQuality(content: string): Promise<QualityResult> {
    const words = content.split(/\s+/)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)

    // Calculate quality metrics
    const coherence = Math.min(1, words.length / 20) // Longer content tends to be more coherent
    const relevance = 0.7 + Math.random() * 0.3 // Simulate relevance
    const clarity = sentences.length > 0 ? Math.min(1, words.length / sentences.length / 15) : 0.5
    const completeness = content.length > 50 ? 0.8 + Math.random() * 0.2 : 0.4

    const overallScore = (coherence + relevance + clarity + completeness) / 4
    const issues: string[] = []

    if (coherence < 0.5) issues.push('内容可能缺乏连贯性')
    if (clarity < 0.4) issues.push('表达可能不够清晰')
    if (completeness < 0.5) issues.push('内容可能不够完整')

    return {
      score: overallScore,
      metrics: {
        coherence,
        relevance,
        clarity,
        completeness
      },
      issues
    }
  }

  // Action application
  private async applyModerationActions(result: ModerationResult): Promise<void> {
    for (const triggeredRule of result.triggeredRules) {
      const rule = this.rules.get(triggeredRule.ruleId)
      if (!rule) continue

      for (const action of rule.actions) {
        try {
          const applied = await this.executeAction(action, result, rule)
          result.appliedActions.push(applied)
        } catch (error) {
          console.error('Failed to apply moderation action:', error)
          result.appliedActions.push({
            actionType: action.type,
            actionConfig: action.config,
            timestamp: Date.now(),
            success: false,
            details: `Error: ${error.message}`
          })
        }
      }
    }
  }

  private async executeAction(
    action: ModerationAction,
    result: ModerationResult,
    rule: ModerationRule
  ): Promise<AppliedAction> {
    const applied: AppliedAction = {
      actionType: action.type,
      actionConfig: action.config,
      timestamp: Date.now(),
      success: false,
      details: ''
    }

    switch (action.type) {
      case 'block':
        result.status = 'blocked'
        applied.success = true
        applied.details = `Content blocked due to rule: ${rule.name}`
        break

      case 'flag':
        if (result.status === 'approved') {
          result.status = 'flagged'
        }
        applied.success = true
        applied.details = `Content flagged for review: ${action.config.reviewQueue || 'default'}`
        break

      case 'warn':
        applied.success = true
        applied.details = `Warning issued: ${action.config.warningMessage || 'Content may violate policies'}`
        break

      case 'review':
        result.status = 'under_review'
        applied.success = true
        applied.details = `Content sent for manual review`
        break

      case 'replace':
        if (action.config.replacement) {
          // In a real implementation, this would modify the content
          applied.success = true
          applied.details = `Content replacement suggested: ${action.config.replacement}`
        }
        break

      case 'escalate':
        result.status = 'escalated'
        applied.success = true
        applied.details = `Content escalated to: ${action.config.escalateTo?.join(', ') || 'administrators'}`
        break

      case 'log':
        applied.success = true
        applied.details = `Moderation event logged`
        break

      case 'notify':
        applied.success = true
        applied.details = `Notifications sent to: ${action.config.notifyUsers?.join(', ') || 'moderators'}`
        break

      default:
        applied.details = `Unknown action type: ${action.type}`
    }

    return applied
  }

  // Helper methods
  private getApplicableRules(organizationId: string, contentType: string): ModerationRule[] {
    return Array.from(this.rules.values()).filter(rule =>
      rule.isActive &&
      (!rule.organizationId || rule.organizationId === organizationId)
    )
  }

  private calculateOverallConfidence(result: ModerationResult): number {
    if (result.triggeredRules.length === 0) return 0

    const avgConfidence = result.triggeredRules.reduce((acc, rule) => acc + rule.confidence, 0) / result.triggeredRules.length
    const severityWeight = result.triggeredRules.reduce((acc, rule) => {
      const weight = rule.severity === 'critical' ? 1.0 : rule.severity === 'high' ? 0.8 : rule.severity === 'medium' ? 0.6 : 0.4
      return acc + weight
    }, 0) / result.triggeredRules.length

    return Math.min(1, avgConfidence * severityWeight)
  }

  private determineStatus(result: ModerationResult): 'approved' | 'flagged' | 'blocked' | 'under_review' | 'escalated' {
    if (result.triggeredRules.length === 0) return 'approved'

    const maxSeverity = result.triggeredRules.reduce((max, rule) => {
      const severityScore = rule.severity === 'critical' ? 4 : rule.severity === 'high' ? 3 : rule.severity === 'medium' ? 2 : 1
      return Math.max(max, severityScore)
    }, 0)

    const highConfidenceViolations = result.triggeredRules.filter(rule => rule.confidence >= 0.8)

    if (maxSeverity >= 4 || (highConfidenceViolations.length > 0 && result.confidence >= this.config.thresholds.autoBlock)) {
      return 'blocked'
    } else if (result.confidence >= this.config.thresholds.requireReview) {
      return 'under_review'
    } else {
      return 'flagged'
    }
  }

  private detectLanguage(content: string): string {
    // Simple language detection based on character patterns
    const hasChineseChars = /[\u4e00-\u9fa5]/.test(content)
    const hasJapaneseChars = /[\u3040-\u309f\u30a0-\u30ff]/.test(content)
    const hasKoreanChars = /[\uac00-\ud7af]/.test(content)

    if (hasChineseChars) return 'zh'
    if (hasJapaneseChars) return 'ja'
    if (hasKoreanChars) return 'ko'
    return 'en'
  }

  // CRUD operations for rules
  async createRule(ruleData: Omit<ModerationRule, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<ModerationRule> {
    const rule: ModerationRule = {
      ...ruleData,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'current_user'
    }

    this.rules.set(rule.id, rule)
    await this.saveRules()

    this.emit('ruleCreated', rule)
    return rule
  }

  async updateRule(ruleId: string, updates: Partial<ModerationRule>): Promise<ModerationRule | null> {
    const rule = this.rules.get(ruleId)
    if (!rule) return null

    const updatedRule: ModerationRule = {
      ...rule,
      ...updates,
      updatedAt: Date.now()
    }

    this.rules.set(ruleId, updatedRule)
    await this.saveRules()

    this.emit('ruleUpdated', updatedRule)
    return updatedRule
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    const deleted = this.rules.delete(ruleId)
    if (deleted) {
      await this.saveRules()
      this.emit('ruleDeleted', ruleId)
    }
    return deleted
  }

  async getRules(organizationId?: string): Promise<ModerationRule[]> {
    const rules = Array.from(this.rules.values())
    return organizationId
      ? rules.filter(rule => !rule.organizationId || rule.organizationId === organizationId)
      : rules
  }

  // Analytics and reporting
  async getAnalytics(organizationId?: string): Promise<ModerationAnalytics> {
    await this.updateAnalytics()
    return { ...this.analytics }
  }

  async getModerationResults(filters: {
    organizationId?: string
    status?: string
    dateFrom?: number
    dateTo?: number
    limit?: number
  } = {}): Promise<ModerationResult[]> {
    let results = Array.from(this.results.values())

    if (filters.organizationId) {
      results = results.filter(r => r.organizationId === filters.organizationId)
    }
    if (filters.status) {
      results = results.filter(r => r.status === filters.status)
    }
    if (filters.dateFrom) {
      results = results.filter(r => r.timestamp >= filters.dateFrom!)
    }
    if (filters.dateTo) {
      results = results.filter(r => r.timestamp <= filters.dateTo!)
    }

    results.sort((a, b) => b.timestamp - a.timestamp)

    if (filters.limit) {
      results = results.slice(0, filters.limit)
    }

    return results
  }

  // Configuration
  async updateConfig(newConfig: Partial<AutoModerationConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig }
    this.emit('configUpdated', this.config)
  }

  async getConfig(): Promise<AutoModerationConfig> {
    return { ...this.config }
  }

  // Helper methods for analytics
  private async updateAnalytics(result?: ModerationResult): Promise<void> {
    if (result) {
      this.analytics.totalContent++

      switch (result.status) {
        case 'flagged':
          this.analytics.flaggedContent++
          break
        case 'blocked':
          this.analytics.blockedContent++
          break
        case 'approved':
          this.analytics.approvedContent++
          break
      }

      // Update top violations
      result.triggeredRules.forEach(rule => {
        const existing = this.analytics.topViolations.find(v => v.rule === rule.ruleName)
        if (existing) {
          existing.count++
        } else {
          this.analytics.topViolations.push({ rule: rule.ruleName, count: 1 })
        }
      })

      this.analytics.topViolations.sort((a, b) => b.count - a.count).slice(0, 10)
    }
  }

  private createPredefinedRules(): void {
    PREDEFINED_RULES.forEach((ruleData, index) => {
      const rule: ModerationRule = {
        id: `predefined_${index}`,
        ...ruleData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: 'system'
      }
      this.rules.set(rule.id, rule)
    })
  }

  private createDefaultQueues(): void {
    const defaultQueues = [
      {
        id: 'safety_review',
        name: '安全审查队列',
        description: '需要安全审查的内容',
        organizationId: 'default',
        assignedModerators: [],
        autoAssignment: true,
        priority: 'high' as const,
        slaHours: 2,
        filters: [{ field: 'category', operator: 'equals', value: 'safety' }],
        capacity: 100,
        currentLoad: 0
      },
      {
        id: 'policy_review',
        name: '政策审查队列',
        description: '需要政策审查的内容',
        organizationId: 'default',
        assignedModerators: [],
        autoAssignment: true,
        priority: 'medium' as const,
        slaHours: 24,
        filters: [{ field: 'category', operator: 'equals', value: 'policy' }],
        capacity: 200,
        currentLoad: 0
      }
    ]

    defaultQueues.forEach(queue => {
      this.queues.set(queue.id, queue)
    })
  }

  // Storage methods
  private async loadRules(): Promise<void> {
    try {
      const data = localStorage.getItem('moderation_rules')
      if (data) {
        const parsed = JSON.parse(data)
        parsed.forEach((rule: ModerationRule) => {
          this.rules.set(rule.id, rule)
        })
      }
    } catch (error) {
      console.error('Failed to load moderation rules:', error)
    }
  }

  private async saveRules(): Promise<void> {
    try {
      const data = Array.from(this.rules.values())
      localStorage.setItem('moderation_rules', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save moderation rules:', error)
    }
  }

  private async loadPolicies(): Promise<void> {
    try {
      const data = localStorage.getItem('moderation_policies')
      if (data) {
        const parsed = JSON.parse(data)
        parsed.forEach((policy: ModerationPolicy) => {
          this.policies.set(policy.id, policy)
        })
      }
    } catch (error) {
      console.error('Failed to load moderation policies:', error)
    }
  }

  private async loadQueues(): Promise<void> {
    try {
      const data = localStorage.getItem('moderation_queues')
      if (data) {
        const parsed = JSON.parse(data)
        parsed.forEach((queue: ModerationQueue) => {
          this.queues.set(queue.id, queue)
        })
      }
    } catch (error) {
      console.error('Failed to load moderation queues:', error)
    }
  }

  private async loadResults(): Promise<void> {
    try {
      const data = localStorage.getItem('moderation_results')
      if (data) {
        const parsed = JSON.parse(data)
        parsed.forEach((result: ModerationResult) => {
          this.results.set(result.id, result)
        })
      }
    } catch (error) {
      console.error('Failed to load moderation results:', error)
    }
  }

  private async saveResults(): Promise<void> {
    try {
      const data = Array.from(this.results.values())
      // Keep only last 1000 results to prevent storage bloat
      const recent = data.sort((a, b) => b.timestamp - a.timestamp).slice(0, 1000)
      localStorage.setItem('moderation_results', JSON.stringify(recent))
    } catch (error) {
      console.error('Failed to save moderation results:', error)
    }
  }
}

// Create singleton instance
const contentModerationService = new ContentModerationService()
export default contentModerationService
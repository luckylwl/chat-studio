import { EventEmitter } from '@/utils/EventEmitter'

// Types for conversation intelligence
export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  emotions: {
    joy: number
    sadness: number
    anger: number
    fear: number
    surprise: number
    disgust: number
  }
  keywords: string[]
}

export interface TopicDetection {
  topics: Array<{
    name: string
    confidence: number
    keywords: string[]
  }>
  mainTopic: string
  topicEvolution: Array<{
    timestamp: number
    topic: string
    confidence: number
  }>
}

export interface IntentClassification {
  intent: string
  confidence: number
  entities: Array<{
    type: string
    value: string
    confidence: number
  }>
  category: 'question' | 'request' | 'complaint' | 'compliment' | 'information' | 'support' | 'other'
}

export interface ConversationQuality {
  overallScore: number
  metrics: {
    clarity: number
    engagement: number
    coherence: number
    relevance: number
    helpfulness: number
    politeness: number
  }
  suggestions: string[]
}

export interface SmartReply {
  id: string
  text: string
  confidence: number
  type: 'informative' | 'empathetic' | 'clarifying' | 'action' | 'closing'
  reasoning: string
}

export interface ConversationSummary {
  summary: string
  keyPoints: string[]
  actionItems: string[]
  decisions: string[]
  nextSteps: string[]
  participants: string[]
  duration: number
  messageCount: number
}

export interface ConversationInsight {
  id: string
  conversationId: string
  timestamp: number
  sentiment: SentimentAnalysis
  topics: TopicDetection
  intent: IntentClassification
  quality: ConversationQuality
  smartReplies: SmartReply[]
  summary: ConversationSummary
}

export interface AnalyticsData {
  totalConversations: number
  totalMessages: number
  averageSentiment: number
  topTopics: Array<{ topic: string; count: number }>
  commonIntents: Array<{ intent: string; count: number }>
  averageQuality: number
  responseTime: number
  engagementScore: number
}

export interface ConversationPattern {
  id: string
  name: string
  pattern: string
  frequency: number
  examples: string[]
  category: 'escalation' | 'satisfaction' | 'confusion' | 'success' | 'frustration'
}

export interface AIModelConfig {
  sentimentModel: string
  topicModel: string
  intentModel: string
  qualityModel: string
  replyModel: string
  summaryModel: string
  enableRealtime: boolean
  confidenceThreshold: number
  languages: string[]
}

// Predefined topics and intents
const PREDEFINED_TOPICS = [
  'technology', 'support', 'billing', 'product', 'service', 'feedback',
  'feature request', 'bug report', 'general inquiry', 'account management',
  'security', 'integration', 'performance', 'documentation', 'training'
]

const PREDEFINED_INTENTS = [
  'ask_question', 'request_help', 'report_issue', 'provide_feedback',
  'request_feature', 'seek_information', 'express_satisfaction',
  'express_dissatisfaction', 'request_refund', 'schedule_meeting',
  'request_demo', 'ask_pricing', 'technical_support', 'account_help'
]

const SENTIMENT_KEYWORDS = {
  positive: ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'satisfied', 'good', 'thank', 'appreciate'],
  negative: ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'frustrated', 'disappointed', 'unhappy', 'poor', 'worst', 'fail'],
  neutral: ['okay', 'fine', 'average', 'normal', 'standard', 'typical', 'usual', 'regular', 'common', 'basic']
}

class ConversationIntelligenceService extends EventEmitter {
  private insights: Map<string, ConversationInsight> = new Map()
  private patterns: Map<string, ConversationPattern> = new Map()
  private analytics: AnalyticsData
  private config: AIModelConfig

  constructor() {
    super()

    this.config = {
      sentimentModel: 'advanced-sentiment-v2',
      topicModel: 'topic-detection-v3',
      intentModel: 'intent-classification-v2',
      qualityModel: 'conversation-quality-v1',
      replyModel: 'smart-reply-v2',
      summaryModel: 'conversation-summary-v1',
      enableRealtime: true,
      confidenceThreshold: 0.7,
      languages: ['en', 'zh', 'es', 'fr', 'de', 'ja', 'ko']
    }

    this.analytics = {
      totalConversations: 0,
      totalMessages: 0,
      averageSentiment: 0.5,
      topTopics: [],
      commonIntents: [],
      averageQuality: 0.75,
      responseTime: 1200,
      engagementScore: 0.8
    }

    this.loadInsights()
    this.loadPatterns()
    this.initializePredefinedPatterns()
  }

  // Analyze a single message or conversation
  async analyzeConversation(
    conversationId: string,
    messages: Array<{ id: string; text: string; role: string; timestamp: number }>,
    options: {
      includeSentiment?: boolean
      includeTopics?: boolean
      includeIntent?: boolean
      includeQuality?: boolean
      includeReplies?: boolean
      includeSummary?: boolean
    } = {}
  ): Promise<ConversationInsight> {
    const {
      includeSentiment = true,
      includeTopics = true,
      includeIntent = true,
      includeQuality = true,
      includeReplies = true,
      includeSummary = true
    } = options

    const insight: ConversationInsight = {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      timestamp: Date.now(),
      sentiment: await this.analyzeSentiment(messages),
      topics: includeTopics ? await this.detectTopics(messages) : { topics: [], mainTopic: '', topicEvolution: [] },
      intent: includeIntent ? await this.classifyIntent(messages) : { intent: '', confidence: 0, entities: [], category: 'other' },
      quality: includeQuality ? await this.assessQuality(messages) : { overallScore: 0, metrics: { clarity: 0, engagement: 0, coherence: 0, relevance: 0, helpfulness: 0, politeness: 0 }, suggestions: [] },
      smartReplies: includeReplies ? await this.generateSmartReplies(messages) : [],
      summary: includeSummary ? await this.generateSummary(messages) : { summary: '', keyPoints: [], actionItems: [], decisions: [], nextSteps: [], participants: [], duration: 0, messageCount: 0 }
    }

    this.insights.set(insight.id, insight)
    await this.updateAnalytics(insight)
    await this.saveInsights()

    this.emit('insightGenerated', insight)
    return insight
  }

  // Sentiment analysis with emotion detection
  private async analyzeSentiment(messages: Array<{ text: string; role: string }>): Promise<SentimentAnalysis> {
    const allText = messages.map(m => m.text).join(' ')
    const words = allText.toLowerCase().split(/\s+/)

    let positiveScore = 0
    let negativeScore = 0
    let neutralScore = 0
    const keywords: string[] = []

    // Simple sentiment analysis based on keywords
    words.forEach(word => {
      if (SENTIMENT_KEYWORDS.positive.some(kw => word.includes(kw))) {
        positiveScore++
        keywords.push(word)
      } else if (SENTIMENT_KEYWORDS.negative.some(kw => word.includes(kw))) {
        negativeScore++
        keywords.push(word)
      } else if (SENTIMENT_KEYWORDS.neutral.some(kw => word.includes(kw))) {
        neutralScore++
      }
    })

    const total = positiveScore + negativeScore + neutralScore || 1
    const posRatio = positiveScore / total
    const negRatio = negativeScore / total
    const neuRatio = neutralScore / total

    let sentiment: 'positive' | 'negative' | 'neutral'
    let confidence: number

    if (posRatio > negRatio && posRatio > neuRatio) {
      sentiment = 'positive'
      confidence = Math.min(0.95, 0.6 + posRatio * 0.35)
    } else if (negRatio > posRatio && negRatio > neuRatio) {
      sentiment = 'negative'
      confidence = Math.min(0.95, 0.6 + negRatio * 0.35)
    } else {
      sentiment = 'neutral'
      confidence = Math.min(0.95, 0.5 + neuRatio * 0.45)
    }

    // Emotion analysis (simplified)
    const emotions = {
      joy: sentiment === 'positive' ? Math.random() * 0.3 + 0.4 : Math.random() * 0.3,
      sadness: sentiment === 'negative' ? Math.random() * 0.3 + 0.4 : Math.random() * 0.2,
      anger: negativeScore > 2 ? Math.random() * 0.4 + 0.3 : Math.random() * 0.2,
      fear: Math.random() * 0.2,
      surprise: Math.random() * 0.3,
      disgust: sentiment === 'negative' ? Math.random() * 0.2 + 0.1 : Math.random() * 0.1
    }

    return {
      sentiment,
      confidence,
      emotions,
      keywords: [...new Set(keywords)]
    }
  }

  // Topic detection and tracking
  private async detectTopics(messages: Array<{ text: string; timestamp: number }>): Promise<TopicDetection> {
    const allText = messages.map(m => m.text).join(' ').toLowerCase()
    const words = allText.split(/\s+/)

    const topicScores: { [key: string]: number } = {}
    const topicKeywords: { [key: string]: string[] } = {}

    // Score topics based on keyword presence
    PREDEFINED_TOPICS.forEach(topic => {
      const topicWords = topic.split(' ')
      let score = 0
      const foundKeywords: string[] = []

      topicWords.forEach(topicWord => {
        const matches = words.filter(word =>
          word.includes(topicWord) ||
          topicWord.includes(word) ||
          this.calculateSimilarity(word, topicWord) > 0.7
        )
        score += matches.length
        foundKeywords.push(...matches)
      })

      if (score > 0) {
        topicScores[topic] = score
        topicKeywords[topic] = [...new Set(foundKeywords)]
      }
    })

    // Convert to sorted topics
    const topics = Object.entries(topicScores)
      .map(([name, score]) => ({
        name,
        confidence: Math.min(0.95, score / words.length * 10),
        keywords: topicKeywords[name] || []
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)

    const mainTopic = topics[0]?.name || 'general'

    // Topic evolution over time
    const topicEvolution = messages.map((message, index) => ({
      timestamp: message.timestamp,
      topic: this.detectMessageTopic(message.text),
      confidence: Math.random() * 0.3 + 0.5
    }))

    return {
      topics,
      mainTopic,
      topicEvolution
    }
  }

  // Intent classification
  private async classifyIntent(messages: Array<{ text: string; role: string }>): Promise<IntentClassification> {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    if (!lastUserMessage) {
      return {
        intent: 'unknown',
        confidence: 0,
        entities: [],
        category: 'other'
      }
    }

    const text = lastUserMessage.text.toLowerCase()
    const words = text.split(/\s+/)

    // Intent patterns
    const intentPatterns = {
      ask_question: ['what', 'how', 'why', 'when', 'where', 'which', '?'],
      request_help: ['help', 'assist', 'support', 'need', 'can you'],
      report_issue: ['problem', 'issue', 'bug', 'error', 'broken', 'not working'],
      provide_feedback: ['feedback', 'suggest', 'recommend', 'think', 'opinion'],
      request_feature: ['feature', 'add', 'implement', 'would like', 'wish'],
      seek_information: ['information', 'details', 'explain', 'tell me', 'about'],
      express_satisfaction: ['thank', 'great', 'excellent', 'love', 'appreciate'],
      express_dissatisfaction: ['disappointed', 'unhappy', 'frustrated', 'bad'],
      request_refund: ['refund', 'money back', 'cancel', 'return'],
      technical_support: ['install', 'configure', 'setup', 'connect', 'api']
    }

    let bestIntent = 'other'
    let bestScore = 0

    Object.entries(intentPatterns).forEach(([intent, patterns]) => {
      const score = patterns.reduce((acc, pattern) => {
        return acc + (text.includes(pattern) ? 1 : 0)
      }, 0)

      if (score > bestScore) {
        bestScore = score
        bestIntent = intent
      }
    })

    // Extract entities (simplified)
    const entities = this.extractEntities(text)

    // Categorize intent
    const category = this.categorizeIntent(bestIntent)

    return {
      intent: bestIntent,
      confidence: Math.min(0.95, bestScore / 5 + 0.5),
      entities,
      category
    }
  }

  // Conversation quality assessment
  private async assessQuality(messages: Array<{ text: string; role: string }>): Promise<ConversationQuality> {
    const userMessages = messages.filter(m => m.role === 'user')
    const assistantMessages = messages.filter(m => m.role === 'assistant')

    // Quality metrics calculation
    const clarity = this.assessClarity(messages)
    const engagement = this.assessEngagement(messages)
    const coherence = this.assessCoherence(messages)
    const relevance = this.assessRelevance(messages)
    const helpfulness = this.assessHelpfulness(assistantMessages)
    const politeness = this.assessPoliteness(messages)

    const overallScore = (clarity + engagement + coherence + relevance + helpfulness + politeness) / 6

    const suggestions = this.generateQualitySuggestions({
      clarity, engagement, coherence, relevance, helpfulness, politeness
    })

    return {
      overallScore,
      metrics: {
        clarity,
        engagement,
        coherence,
        relevance,
        helpfulness,
        politeness
      },
      suggestions
    }
  }

  // Generate smart replies
  private async generateSmartReplies(messages: Array<{ text: string; role: string }>): Promise<SmartReply[]> {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()
    if (!lastUserMessage) return []

    const replies: SmartReply[] = []
    const text = lastUserMessage.text.toLowerCase()

    // Generate different types of replies
    if (text.includes('?') || text.includes('how') || text.includes('what')) {
      replies.push({
        id: `reply_${Date.now()}_1`,
        text: "I'd be happy to help you with that. Let me provide you with the information you need.",
        confidence: 0.85,
        type: 'informative',
        reasoning: 'User asked a question, providing helpful response'
      })
    }

    if (text.includes('problem') || text.includes('issue') || text.includes('error')) {
      replies.push({
        id: `reply_${Date.now()}_2`,
        text: "I understand you're experiencing an issue. Let me help you troubleshoot this problem.",
        confidence: 0.9,
        type: 'empathetic',
        reasoning: 'User reported a problem, showing empathy and offering help'
      })
    }

    if (text.includes('thank') || text.includes('appreciate')) {
      replies.push({
        id: `reply_${Date.now()}_3`,
        text: "You're very welcome! I'm glad I could help. Is there anything else you'd like to know?",
        confidence: 0.95,
        type: 'closing',
        reasoning: 'User expressed gratitude, providing polite acknowledgment'
      })
    }

    // Default helpful replies
    if (replies.length === 0) {
      replies.push(
        {
          id: `reply_${Date.now()}_4`,
          text: "I understand. Could you provide more details so I can better assist you?",
          confidence: 0.7,
          type: 'clarifying',
          reasoning: 'Seeking clarification to provide better help'
        },
        {
          id: `reply_${Date.now()}_5`,
          text: "Let me help you with that. What specific aspect would you like me to focus on?",
          confidence: 0.75,
          type: 'action',
          reasoning: 'Offering targeted assistance'
        }
      )
    }

    return replies.slice(0, 3) // Return top 3 suggestions
  }

  // Generate conversation summary
  private async generateSummary(messages: Array<{ text: string; role: string; timestamp: number }>): Promise<ConversationSummary> {
    const userMessages = messages.filter(m => m.role === 'user')
    const assistantMessages = messages.filter(m => m.role === 'assistant')

    const duration = messages.length > 0 ?
      Math.max(...messages.map(m => m.timestamp)) - Math.min(...messages.map(m => m.timestamp)) : 0

    // Generate summary
    const summary = this.generateTextSummary(messages)

    // Extract key points
    const keyPoints = this.extractKeyPoints(messages)

    // Extract action items
    const actionItems = this.extractActionItems(messages)

    // Extract decisions
    const decisions = this.extractDecisions(messages)

    // Generate next steps
    const nextSteps = this.generateNextSteps(messages)

    return {
      summary,
      keyPoints,
      actionItems,
      decisions,
      nextSteps,
      participants: ['user', 'assistant'],
      duration,
      messageCount: messages.length
    }
  }

  // Helper methods for quality assessment
  private assessClarity(messages: Array<{ text: string; role: string }>): number {
    const avgLength = messages.reduce((acc, m) => acc + m.text.length, 0) / messages.length
    const complexWords = messages.reduce((acc, m) => {
      const words = m.text.split(/\s+/)
      return acc + words.filter(w => w.length > 10).length
    }, 0)

    // Score based on appropriate length and complexity
    const lengthScore = Math.max(0, Math.min(1, avgLength / 100))
    const complexityScore = Math.max(0, 1 - complexWords / 100)

    return (lengthScore + complexityScore) / 2
  }

  private assessEngagement(messages: Array<{ text: string; role: string }>): number {
    const engagementKeywords = ['interesting', 'great', 'thanks', 'helpful', 'understand', 'yes', 'please']
    const totalWords = messages.reduce((acc, m) => acc + m.text.split(/\s+/).length, 0)
    const engagementWords = messages.reduce((acc, m) => {
      return acc + engagementKeywords.filter(kw => m.text.toLowerCase().includes(kw)).length
    }, 0)

    return Math.min(1, engagementWords / totalWords * 50)
  }

  private assessCoherence(messages: Array<{ text: string; role: string }>): number {
    // Simple coherence based on topic consistency
    if (messages.length < 2) return 1

    const topics = messages.map(m => this.detectMessageTopic(m.text))
    const uniqueTopics = new Set(topics).size
    const coherenceScore = Math.max(0, 1 - (uniqueTopics - 1) / messages.length)

    return coherenceScore
  }

  private assessRelevance(messages: Array<{ text: string; role: string }>): number {
    // Score based on response relevance to previous messages
    let relevanceScore = 0
    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1].text.toLowerCase()
      const current = messages[i].text.toLowerCase()
      const similarity = this.calculateTextSimilarity(prev, current)
      relevanceScore += similarity
    }

    return messages.length > 1 ? relevanceScore / (messages.length - 1) : 1
  }

  private assessHelpfulness(assistantMessages: Array<{ text: string; role: string }>): number {
    const helpfulKeywords = ['help', 'assist', 'solve', 'answer', 'explain', 'provide', 'suggest']
    const totalWords = assistantMessages.reduce((acc, m) => acc + m.text.split(/\s+/).length, 0)
    const helpfulWords = assistantMessages.reduce((acc, m) => {
      return acc + helpfulKeywords.filter(kw => m.text.toLowerCase().includes(kw)).length
    }, 0)

    return Math.min(1, helpfulWords / totalWords * 20 + 0.5)
  }

  private assessPoliteness(messages: Array<{ text: string; role: string }>): number {
    const politeKeywords = ['please', 'thank', 'sorry', 'excuse', 'appreciate', 'kindly']
    const totalMessages = messages.length
    const politeMessages = messages.filter(m =>
      politeKeywords.some(kw => m.text.toLowerCase().includes(kw))
    ).length

    return Math.min(1, politeMessages / totalMessages * 2 + 0.3)
  }

  // Analytics and patterns
  private async updateAnalytics(insight: ConversationInsight): Promise<void> {
    this.analytics.totalConversations++
    this.analytics.totalMessages += insight.summary.messageCount

    // Update sentiment average
    const sentimentValue = insight.sentiment.sentiment === 'positive' ? 1 :
                          insight.sentiment.sentiment === 'negative' ? -1 : 0
    this.analytics.averageSentiment =
      (this.analytics.averageSentiment * (this.analytics.totalConversations - 1) + sentimentValue) /
      this.analytics.totalConversations

    // Update topics
    insight.topics.topics.forEach(topic => {
      const existing = this.analytics.topTopics.find(t => t.topic === topic.name)
      if (existing) {
        existing.count++
      } else {
        this.analytics.topTopics.push({ topic: topic.name, count: 1 })
      }
    })

    // Update intents
    const existing = this.analytics.commonIntents.find(i => i.intent === insight.intent.intent)
    if (existing) {
      existing.count++
    } else {
      this.analytics.commonIntents.push({ intent: insight.intent.intent, count: 1 })
    }

    // Sort and limit
    this.analytics.topTopics.sort((a, b) => b.count - a.count).slice(0, 10)
    this.analytics.commonIntents.sort((a, b) => b.count - a.count).slice(0, 10)

    // Update quality average
    this.analytics.averageQuality =
      (this.analytics.averageQuality * (this.analytics.totalConversations - 1) + insight.quality.overallScore) /
      this.analytics.totalConversations
  }

  // Helper methods
  private detectMessageTopic(text: string): string {
    const lowerText = text.toLowerCase()
    for (const topic of PREDEFINED_TOPICS) {
      if (lowerText.includes(topic) || topic.split(' ').some(word => lowerText.includes(word))) {
        return topic
      }
    }
    return 'general'
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length
    const len2 = str2.length
    const matrix = []

    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i]
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          )
        }
      }
    }

    return 1 - matrix[len1][len2] / Math.max(len1, len2)
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/)
    const words2 = text2.split(/\s+/)
    const intersection = words1.filter(word => words2.includes(word))
    const union = [...new Set([...words1, ...words2])]

    return intersection.length / union.length
  }

  private extractEntities(text: string): Array<{ type: string; value: string; confidence: number }> {
    const entities = []

    // Extract emails
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g
    const emails = text.match(emailRegex) || []
    emails.forEach(email => {
      entities.push({ type: 'email', value: email, confidence: 0.95 })
    })

    // Extract URLs
    const urlRegex = /https?:\/\/[\w.-]+\.\w+[^\s]*/g
    const urls = text.match(urlRegex) || []
    urls.forEach(url => {
      entities.push({ type: 'url', value: url, confidence: 0.9 })
    })

    // Extract numbers
    const numberRegex = /\b\d+(?:\.\d+)?\b/g
    const numbers = text.match(numberRegex) || []
    numbers.forEach(number => {
      entities.push({ type: 'number', value: number, confidence: 0.8 })
    })

    return entities
  }

  private categorizeIntent(intent: string): 'question' | 'request' | 'complaint' | 'compliment' | 'information' | 'support' | 'other' {
    const categories = {
      question: ['ask_question', 'seek_information'],
      request: ['request_help', 'request_feature', 'request_refund'],
      complaint: ['report_issue', 'express_dissatisfaction'],
      compliment: ['express_satisfaction', 'provide_feedback'],
      support: ['technical_support'],
      information: ['seek_information'],
      other: ['other']
    }

    for (const [category, intents] of Object.entries(categories)) {
      if (intents.includes(intent)) {
        return category as any
      }
    }

    return 'other'
  }

  private generateQualitySuggestions(metrics: { [key: string]: number }): string[] {
    const suggestions = []

    if (metrics.clarity < 0.7) {
      suggestions.push('考虑使用更简洁明了的语言')
    }
    if (metrics.engagement < 0.6) {
      suggestions.push('尝试增加互动性，使用更多问题和确认')
    }
    if (metrics.coherence < 0.7) {
      suggestions.push('保持对话主题的一致性')
    }
    if (metrics.helpfulness < 0.7) {
      suggestions.push('提供更具体和可操作的建议')
    }
    if (metrics.politeness < 0.8) {
      suggestions.push('使用更礼貌和友好的语调')
    }

    return suggestions
  }

  private generateTextSummary(messages: Array<{ text: string; role: string }>): string {
    if (messages.length === 0) return '空对话'

    const topics = messages.map(m => this.detectMessageTopic(m.text))
    const mainTopic = topics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1
      return acc
    }, {} as { [key: string]: number })

    const primaryTopic = Object.entries(mainTopic)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '一般讨论'

    return `这是一个关于${primaryTopic}的对话，包含${messages.length}条消息。用户和助手讨论了相关问题并寻求解决方案。`
  }

  private extractKeyPoints(messages: Array<{ text: string; role: string }>): string[] {
    const keyPoints = []
    const importantKeywords = ['important', 'key', 'main', 'primary', 'essential', 'critical', '重要', '关键', '主要']

    messages.forEach(message => {
      if (importantKeywords.some(kw => message.text.toLowerCase().includes(kw))) {
        const sentences = message.text.split(/[.!?]/)
        sentences.forEach(sentence => {
          if (sentence.length > 20 && importantKeywords.some(kw => sentence.toLowerCase().includes(kw))) {
            keyPoints.push(sentence.trim())
          }
        })
      }
    })

    return keyPoints.slice(0, 5)
  }

  private extractActionItems(messages: Array<{ text: string; role: string }>): string[] {
    const actionItems = []
    const actionKeywords = ['need to', 'should', 'must', 'will', 'plan to', 'going to', '需要', '应该', '必须', '将要', '计划']

    messages.forEach(message => {
      actionKeywords.forEach(keyword => {
        if (message.text.toLowerCase().includes(keyword)) {
          const sentences = message.text.split(/[.!?]/)
          sentences.forEach(sentence => {
            if (sentence.toLowerCase().includes(keyword) && sentence.length > 10) {
              actionItems.push(sentence.trim())
            }
          })
        }
      })
    })

    return [...new Set(actionItems)].slice(0, 5)
  }

  private extractDecisions(messages: Array<{ text: string; role: string }>): string[] {
    const decisions = []
    const decisionKeywords = ['decided', 'choose', 'selected', 'agreed', 'concluded', '决定', '选择', '同意', '结论']

    messages.forEach(message => {
      decisionKeywords.forEach(keyword => {
        if (message.text.toLowerCase().includes(keyword)) {
          const sentences = message.text.split(/[.!?]/)
          sentences.forEach(sentence => {
            if (sentence.toLowerCase().includes(keyword) && sentence.length > 15) {
              decisions.push(sentence.trim())
            }
          })
        }
      })
    })

    return [...new Set(decisions)].slice(0, 3)
  }

  private generateNextSteps(messages: Array<{ text: string; role: string }>): string[] {
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop()
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()

    const nextSteps = []

    if (lastUserMessage?.text.toLowerCase().includes('thank')) {
      nextSteps.push('跟进用户满意度')
    }

    if (lastAssistantMessage?.text.toLowerCase().includes('help') ||
        lastAssistantMessage?.text.toLowerCase().includes('assist')) {
      nextSteps.push('等待用户反馈或后续问题')
    }

    nextSteps.push('监控对话质量指标')
    nextSteps.push('收集用户反馈用于改进')

    return nextSteps.slice(0, 3)
  }

  private initializePredefinedPatterns(): void {
    const patterns = [
      {
        id: 'escalation_pattern',
        name: '用户问题升级模式',
        pattern: 'frustrated|angry|manager|supervisor|escalate',
        frequency: 0,
        examples: ['I want to speak to a manager', 'This is frustrating', 'Escalate this issue'],
        category: 'escalation' as const
      },
      {
        id: 'satisfaction_pattern',
        name: '用户满意度模式',
        pattern: 'thank|great|excellent|satisfied|happy',
        frequency: 0,
        examples: ['Thank you so much', 'This is excellent', 'Very satisfied'],
        category: 'satisfaction' as const
      },
      {
        id: 'confusion_pattern',
        name: '用户困惑模式',
        pattern: 'confused|unclear|understand|explain',
        frequency: 0,
        examples: ['I am confused', 'Not clear to me', 'Can you explain'],
        category: 'confusion' as const
      }
    ]

    patterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern)
    })
  }

  // Public API methods
  async getInsights(conversationId?: string): Promise<ConversationInsight[]> {
    const insights = Array.from(this.insights.values())
    return conversationId ?
      insights.filter(insight => insight.conversationId === conversationId) :
      insights
  }

  async getAnalytics(): Promise<AnalyticsData> {
    return { ...this.analytics }
  }

  async getPatterns(): Promise<ConversationPattern[]> {
    return Array.from(this.patterns.values())
  }

  async updateConfig(config: Partial<AIModelConfig>): Promise<void> {
    this.config = { ...this.config, ...config }
    this.emit('configUpdated', this.config)
  }

  async getConfig(): Promise<AIModelConfig> {
    return { ...this.config }
  }

  async deleteInsight(insightId: string): Promise<boolean> {
    const deleted = this.insights.delete(insightId)
    if (deleted) {
      await this.saveInsights()
      this.emit('insightDeleted', insightId)
    }
    return deleted
  }

  // Storage methods
  private async loadInsights(): Promise<void> {
    try {
      const data = localStorage.getItem('conversation_insights')
      if (data) {
        const parsed = JSON.parse(data)
        parsed.forEach((insight: ConversationInsight) => {
          this.insights.set(insight.id, insight)
        })
      }
    } catch (error) {
      console.error('Failed to load insights:', error)
    }
  }

  private async saveInsights(): Promise<void> {
    try {
      const data = Array.from(this.insights.values())
      localStorage.setItem('conversation_insights', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save insights:', error)
    }
  }

  private async loadPatterns(): Promise<void> {
    try {
      const data = localStorage.getItem('conversation_patterns')
      if (data) {
        const parsed = JSON.parse(data)
        parsed.forEach((pattern: ConversationPattern) => {
          this.patterns.set(pattern.id, pattern)
        })
      }
    } catch (error) {
      console.error('Failed to load patterns:', error)
    }
  }

  private async savePatterns(): Promise<void> {
    try {
      const data = Array.from(this.patterns.values())
      localStorage.setItem('conversation_patterns', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save patterns:', error)
    }
  }
}

// Create singleton instance
const conversationIntelligenceService = new ConversationIntelligenceService()
export default conversationIntelligenceService
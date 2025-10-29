/**
 * AI Chat Studio v4.0 - Core Services Collection
 *
 * This file contains multiple core services for v4.0 features:
 * - AI Personalization Service
 * - Dialogue Context Service
 * - Prompt Optimizer Service
 * - Analytics Service v2
 * - Content Creation Service
 */

import localforage from 'localforage'
import type {
  AIPersonalization,
  DialogueContext,
  PromptOptimization,
  ConversationAnalytics,
  SmartDocument,
  WritingAssistant
} from '../types/v4-types'

// ===================================
// AI PERSONALIZATION SERVICE
// ===================================

class AIPersonalizationService {
  private readonly PERSONALIZATION_KEY = 'ai_personalizations'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'personalization'
  })

  async getUserPersonalization(userId: string): Promise<AIPersonalization> {
    const personalizations = await this.store.getItem<Record<string, AIPersonalization>>(
      this.PERSONALIZATION_KEY
    ) || {}

    if (!personalizations[userId]) {
      personalizations[userId] = this.createDefaultPersonalization(userId)
      await this.store.setItem(this.PERSONALIZATION_KEY, personalizations)
    }

    return personalizations[userId]
  }

  async updatePersonality(
    userId: string,
    personality: Partial<AIPersonalization['personality']>
  ): Promise<AIPersonalization> {
    const personalization = await this.getUserPersonalization(userId)

    personalization.personality = {
      ...personalization.personality,
      ...personality
    }

    await this.savePersonalization(userId, personalization)
    return personalization
  }

  async updatePreferences(
    userId: string,
    preferences: Partial<AIPersonalization['preferences']>
  ): Promise<AIPersonalization> {
    const personalization = await this.getUserPersonalization(userId)

    personalization.preferences = {
      ...personalization.preferences,
      ...preferences
    }

    await this.savePersonalization(userId, personalization)
    return personalization
  }

  async recordAdaptation(
    userId: string,
    type: 'style' | 'content' | 'format' | 'behavior',
    reason: string,
    change: Record<string, any>
  ): Promise<void> {
    const personalization = await this.getUserPersonalization(userId)

    const adaptation = {
      id: `adapt_${Date.now()}`,
      type,
      reason,
      change,
      effectiveFrom: Date.now(),
      metrics: {
        userSatisfaction: 0.5,
        responseQuality: 0.5,
        engagement: 0.5
      }
    }

    personalization.adaptations.push(adaptation)

    // Keep only last 100 adaptations
    if (personalization.adaptations.length > 100) {
      personalization.adaptations = personalization.adaptations.slice(-100)
    }

    await this.savePersonalization(userId, personalization)
  }

  private createDefaultPersonalization(userId: string): AIPersonalization {
    return {
      userId,
      personality: {
        style: 'professional',
        tone: 'neutral',
        verbosity: 'moderate',
        formality: 5,
        creativity: 5,
        technicality: 5
      },
      preferences: {
        responseLength: 'medium',
        includeExamples: true,
        includeExplanations: true,
        useEmojis: false,
        useMarkdown: true,
        codeStyle: 'blocks',
        language: 'en',
        expertise: []
      },
      learningProfile: {
        userInterests: [],
        commonTopics: [],
        preferredSources: [],
        learningStyle: 'mixed',
        proficiencyLevels: {}
      },
      adaptations: []
    }
  }

  private async savePersonalization(
    userId: string,
    personalization: AIPersonalization
  ): Promise<void> {
    const personalizations = await this.store.getItem<Record<string, AIPersonalization>>(
      this.PERSONALIZATION_KEY
    ) || {}

    personalizations[userId] = personalization
    await this.store.setItem(this.PERSONALIZATION_KEY, personalizations)
  }
}

// ===================================
// DIALOGUE CONTEXT SERVICE
// ===================================

class DialogueContextService {
  private readonly CONTEXT_KEY = 'dialogue_contexts'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'dialogue_context'
  })

  async getContext(conversationId: string): Promise<DialogueContext> {
    const contexts = await this.store.getItem<Record<string, DialogueContext>>(
      this.CONTEXT_KEY
    ) || {}

    if (!contexts[conversationId]) {
      contexts[conversationId] = this.createEmptyContext(conversationId)
      await this.store.setItem(this.CONTEXT_KEY, contexts)
    }

    return contexts[conversationId]
  }

  async updateTopic(conversationId: string, topic: string): Promise<void> {
    const context = await this.getContext(conversationId)

    // Add to topic history
    const existingTopic = context.topicHistory.find(t => t.name === topic)

    if (existingTopic) {
      existingTopic.lastMentioned = Date.now()
      existingTopic.importance++
    } else {
      context.topicHistory.push({
        id: `topic_${Date.now()}`,
        name: topic,
        introduced: Date.now(),
        lastMentioned: Date.now(),
        importance: 1,
        subtopics: []
      })
    }

    context.currentTopic = topic

    await this.saveContext(conversationId, context)
  }

  async addEntity(
    conversationId: string,
    text: string,
    type: string,
    messageId: string
  ): Promise<void> {
    const context = await this.getContext(conversationId)

    const entity = context.entities.find(e => e.text === text)

    if (entity) {
      entity.mentions.push({
        messageId,
        text,
        position: 0,
        confidence: 0.9
      })
    } else {
      context.entities.push({
        id: `entity_${Date.now()}`,
        text,
        type,
        mentions: [{ messageId, text, position: 0, confidence: 0.9 }],
        attributes: {}
      })
    }

    await this.saveContext(conversationId, context)
  }

  async resolveReference(
    conversationId: string,
    referenceText: string
  ): Promise<string | null> {
    const context = await this.getContext(conversationId)

    // Simple reference resolution
    const pronouns = ['it', 'that', 'this', 'they', 'them', 'he', 'she']

    if (pronouns.includes(referenceText.toLowerCase())) {
      // Return most recent entity
      if (context.entities.length > 0) {
        return context.entities[context.entities.length - 1].text
      }
    }

    return null
  }

  private createEmptyContext(conversationId: string): DialogueContext {
    return {
      conversationId,
      currentTopic: '',
      topicHistory: [],
      references: [],
      intentions: [],
      entities: [],
      relationships: []
    }
  }

  private async saveContext(
    conversationId: string,
    context: DialogueContext
  ): Promise<void> {
    const contexts = await this.store.getItem<Record<string, DialogueContext>>(
      this.CONTEXT_KEY
    ) || {}

    contexts[conversationId] = context
    await this.store.setItem(this.CONTEXT_KEY, contexts)
  }
}

// ===================================
// PROMPT OPTIMIZER SERVICE
// ===================================

class PromptOptimizerService {
  async optimizePrompt(prompt: string): Promise<PromptOptimization> {
    const score = this.scorePrompt(prompt)
    const suggestions = this.generateSuggestions(prompt, score)
    const improvements = this.generateImprovements(prompt)

    // Apply improvements
    let optimized = prompt

    suggestions.forEach(suggestion => {
      if (suggestion.priority === 'high') {
        optimized = this.applySuggestion(optimized, suggestion)
      }
    })

    return {
      original: prompt,
      optimized,
      score,
      suggestions,
      improvements,
      reasoning: this.generateReasoning(score, suggestions)
    }
  }

  private scorePrompt(prompt: string): {
    overall: number
    clarity: number
    specificity: number
    context: number
    structure: number
    effectiveness: number
  } {
    const words = prompt.split(/\s+/)
    const sentences = prompt.split(/[.!?]+/)

    // Clarity score
    const clarity = this.calculateClarity(prompt)

    // Specificity score
    const specificity = this.calculateSpecificity(prompt)

    // Context score
    const context = this.calculateContext(prompt)

    // Structure score
    const structure = sentences.length > 0 && words.length > 5 ? 0.8 : 0.5

    // Effectiveness score
    const effectiveness = (clarity + specificity + context + structure) / 4

    const overall = effectiveness

    return {
      overall,
      clarity,
      specificity,
      context,
      structure,
      effectiveness
    }
  }

  private calculateClarity(prompt: string): number {
    let score = 0.5

    // Check for clear instructions
    const instructionWords = ['please', 'explain', 'describe', 'analyze', 'create', 'write']
    if (instructionWords.some(word => prompt.toLowerCase().includes(word))) {
      score += 0.2
    }

    // Check for ambiguous words
    const ambiguousWords = ['thing', 'stuff', 'something', 'maybe']
    if (!ambiguousWords.some(word => prompt.toLowerCase().includes(word))) {
      score += 0.2
    }

    // Length check
    if (prompt.length >= 20 && prompt.length <= 500) {
      score += 0.1
    }

    return Math.min(score, 1.0)
  }

  private calculateSpecificity(prompt: string): number {
    let score = 0.5

    // Check for specific details
    const hasNumbers = /\d+/.test(prompt)
    const hasProperNouns = /[A-Z][a-z]+/.test(prompt)
    const hasDetails = prompt.includes('specifically') || prompt.includes('exactly')

    if (hasNumbers) score += 0.15
    if (hasProperNouns) score += 0.15
    if (hasDetails) score += 0.2

    return Math.min(score, 1.0)
  }

  private calculateContext(prompt: string): number {
    let score = 0.5

    // Check for contextual information
    const contextWords = ['because', 'for', 'context', 'background', 'purpose']
    if (contextWords.some(word => prompt.toLowerCase().includes(word))) {
      score += 0.3
    }

    // Check for examples
    if (prompt.includes('example') || prompt.includes('like')) {
      score += 0.2
    }

    return Math.min(score, 1.0)
  }

  private generateSuggestions(prompt: string, score: any): any[] {
    const suggestions = []

    if (score.clarity < 0.7) {
      suggestions.push({
        type: 'clarity',
        description: 'Make your prompt more clear and direct',
        example: 'Instead of "Can you help with this?", try "Please explain [specific topic]"',
        priority: 'high'
      })
    }

    if (score.specificity < 0.7) {
      suggestions.push({
        type: 'detail',
        description: 'Add more specific details',
        example: 'Include numbers, names, or specific requirements',
        priority: 'high'
      })
    }

    if (score.context < 0.7) {
      suggestions.push({
        type: 'context',
        description: 'Provide more context',
        example: 'Explain why you need this or what you\'ll use it for',
        priority: 'medium'
      })
    }

    if (prompt.length < 20) {
      suggestions.push({
        type: 'structure',
        description: 'Expand your prompt',
        example: 'Add more details about what you want',
        priority: 'medium'
      })
    }

    return suggestions
  }

  private generateImprovements(prompt: string): string[] {
    const improvements = []

    if (!prompt.includes('?') && !prompt.includes('.')) {
      improvements.push('Add proper punctuation')
    }

    if (prompt.length < 30) {
      improvements.push('Provide more details')
    }

    if (!prompt.match(/[A-Z]/)) {
      improvements.push('Use proper capitalization')
    }

    return improvements
  }

  private applySuggestion(prompt: string, suggestion: any): string {
    // Simple improvements
    let improved = prompt

    // Ensure proper capitalization
    improved = improved.charAt(0).toUpperCase() + improved.slice(1)

    // Add punctuation if missing
    if (!improved.match(/[.!?]$/)) {
      improved += '.'
    }

    return improved
  }

  private generateReasoning(score: any, suggestions: any[]): string {
    const parts = []

    parts.push(`Overall score: ${(score.overall * 100).toFixed(0)}%`)

    if (suggestions.length > 0) {
      parts.push(`Found ${suggestions.length} improvement opportunities`)
    } else {
      parts.push('Prompt is well-structured')
    }

    return parts.join('. ')
  }
}

// ===================================
// ANALYTICS SERVICE V2
// ===================================

class AnalyticsServiceV2 {
  async generateWordCloud(conversationId: string, messages: any[]): Promise<any> {
    const words: Record<string, number> = {}

    messages.forEach(msg => {
      const tokens = msg.content.toLowerCase().split(/\W+/)

      tokens.forEach(token => {
        if (token.length > 3) {
          words[token] = (words[token] || 0) + 1
        }
      })
    })

    // Convert to array and sort
    const wordArray = Object.entries(words)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 50)

    return {
      words: wordArray,
      generatedAt: Date.now()
    }
  }

  async analyzePatterns(messages: any[]): Promise<any[]> {
    const patterns = []

    // Time of day pattern
    const hourCounts: Record<number, number> = {}
    messages.forEach(msg => {
      const hour = new Date(msg.timestamp).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    const peakHour = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])[0]

    if (peakHour) {
      patterns.push({
        id: 'time_pattern',
        type: 'time_of_day',
        description: `Most active at ${peakHour[0]}:00`,
        frequency: peakHour[1],
        examples: []
      })
    }

    return patterns
  }
}

// ===================================
// CONTENT CREATION SERVICE
// ===================================

class ContentCreationService {
  private readonly DOCUMENTS_KEY = 'smart_documents'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'content'
  })

  async createDocument(
    title: string,
    content: string,
    userId: string
  ): Promise<SmartDocument> {
    const doc: SmartDocument = {
      id: `doc_${Date.now()}`,
      title,
      content,
      format: 'markdown',
      version: 1,
      versions: [{
        version: 1,
        content,
        changes: 'Initial version',
        author: userId,
        timestamp: Date.now()
      }],
      collaborators: [{
        userId,
        role: 'owner',
        online: true
      }],
      comments: [],
      status: 'draft',
      metadata: {
        tags: [],
        category: 'general',
        readTime: Math.ceil(content.split(/\s+/).length / 200),
        wordCount: content.split(/\s+/).length,
        language: 'en'
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const docs = await this.getAllDocuments()
    docs.push(doc)
    await this.store.setItem(this.DOCUMENTS_KEY, docs)

    return doc
  }

  async getAllDocuments(): Promise<SmartDocument[]> {
    return await this.store.getItem<SmartDocument[]>(this.DOCUMENTS_KEY) || []
  }

  async analyzeWriting(content: string): Promise<WritingAssistant> {
    return {
      suggestions: [],
      improvements: [],
      styleAnalysis: {
        readabilityScore: 75,
        gradeLevel: 10,
        tone: 'neutral',
        voice: 'active',
        sentenceVariety: 0.7,
        vocabulary: {
          uniqueWords: new Set(content.split(/\W+/)).size,
          complexity: 0.6,
          repetitiveness: 0.3,
          suggestions: []
        }
      },
      grammar: []
    }
  }
}

// ===================================
// EXPORTS
// ===================================

export const aiPersonalizationService = new AIPersonalizationService()
export const dialogueContextService = new DialogueContextService()
export const promptOptimizerService = new PromptOptimizerService()
export const analyticsServiceV2 = new AnalyticsServiceV2()
export const contentCreationService = new ContentCreationService()

export default {
  aiPersonalization: aiPersonalizationService,
  dialogueContext: dialogueContextService,
  promptOptimizer: promptOptimizerService,
  analyticsV2: analyticsServiceV2,
  contentCreation: contentCreationService
}

/**
 * AI Assistant Service
 * Provides intelligent text processing capabilities:
 * - Summarization
 * - Translation
 * - Sentiment Analysis
 * - Keyword Extraction
 * - Grammar Checking
 * - Text Enhancement
 */

import localforage from 'localforage'

export interface SummarizationOptions {
  length?: 'short' | 'medium' | 'long'
  style?: 'bullets' | 'paragraph' | 'highlights'
  language?: string
}

export interface SummarizationResult {
  summary: string
  keyPoints: string[]
  wordCount: number
  compressionRatio: number
  processingTime: number
}

export interface TranslationOptions {
  sourceLang?: string // Auto-detect if not specified
  targetLang: string
  preserveFormatting?: boolean
  glossary?: Record<string, string> // Custom term translations
}

export interface TranslationResult {
  translatedText: string
  detectedSourceLang: string
  confidence: number
  alternatives?: string[]
}

export interface SentimentAnalysisResult {
  overall: 'positive' | 'negative' | 'neutral' | 'mixed'
  score: number // -1 (very negative) to 1 (very positive)
  confidence: number
  emotions: {
    joy: number
    sadness: number
    anger: number
    fear: number
    surprise: number
  }
  aspects?: Array<{
    aspect: string
    sentiment: string
    score: number
  }>
}

export interface KeywordExtractionResult {
  keywords: Array<{
    keyword: string
    score: number
    frequency: number
  }>
  phrases: Array<{
    phrase: string
    score: number
  }>
  entities: Array<{
    entity: string
    type: 'person' | 'organization' | 'location' | 'date' | 'other'
  }>
}

export interface GrammarCheckResult {
  correctedText: string
  issues: Array<{
    type: 'grammar' | 'spelling' | 'punctuation' | 'style'
    original: string
    suggestion: string
    explanation: string
    position: { start: number; end: number }
    severity: 'error' | 'warning' | 'suggestion'
  }>
  score: number // 0-100, quality score
}

export interface TextEnhancementOptions {
  style?: 'formal' | 'casual' | 'professional' | 'creative'
  tone?: 'friendly' | 'authoritative' | 'empathetic' | 'persuasive'
  improve?: Array<'clarity' | 'conciseness' | 'engagement' | 'readability'>
}

export interface TextEnhancementResult {
  enhancedText: string
  improvements: Array<{
    type: string
    before: string
    after: string
    reason: string
  }>
  readabilityScore: number
}

export interface AIAssistantStats {
  totalSummarizations: number
  totalTranslations: number
  totalAnalyses: number
  averageProcessingTime: number
  mostUsedLanguages: Record<string, number>
}

export class AIAssistantService {
  private store: LocalForage
  private stats: AIAssistantStats
  private cache: Map<string, any> = new Map()
  private apiKey: string = ''

  constructor() {
    this.store = localforage.createInstance({
      name: 'ai-assistant-db',
      storeName: 'assistant-data'
    })

    this.stats = {
      totalSummarizations: 0,
      totalTranslations: 0,
      totalAnalyses: 0,
      averageProcessingTime: 0,
      mostUsedLanguages: {}
    }
  }

  /**
   * Initialize AI assistant service
   */
  async initialize(): Promise<void> {
    try {
      // Load stats
      const savedStats = await this.store.getItem<AIAssistantStats>('stats')
      if (savedStats) {
        this.stats = savedStats
      }

      // Load API key
      const apiKey = await this.store.getItem<string>('api-key')
      if (apiKey) {
        this.apiKey = apiKey
      }

      console.log('[AIAssistant] Initialized')
    } catch (error) {
      console.error('[AIAssistant] Initialization error:', error)
    }
  }

  /**
   * Set API key for AI services
   */
  async setApiKey(apiKey: string): Promise<void> {
    this.apiKey = apiKey
    await this.store.setItem('api-key', apiKey)
  }

  /**
   * Summarize text
   */
  async summarize(
    text: string,
    options: SummarizationOptions = {}
  ): Promise<SummarizationResult> {
    const startTime = Date.now()

    try {
      // Check cache
      const cacheKey = `summary:${this.hashText(text)}:${JSON.stringify(options)}`
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      // In production, call AI API (OpenAI, Anthropic, etc.)
      // For now, use mock implementation
      const result = await this.mockSummarize(text, options)

      const processingTime = Date.now() - startTime
      result.processingTime = processingTime

      // Cache result
      this.cache.set(cacheKey, result)

      // Update stats
      this.stats.totalSummarizations++
      this.updateAverageProcessingTime(processingTime)
      await this.saveStats()

      return result
    } catch (error: any) {
      console.error('[AIAssistant] Summarization error:', error)
      throw new Error(`Summarization failed: ${error.message}`)
    }
  }

  /**
   * Translate text
   */
  async translate(
    text: string,
    options: TranslationOptions
  ): Promise<TranslationResult> {
    const startTime = Date.now()

    try {
      // Check cache
      const cacheKey = `translate:${this.hashText(text)}:${JSON.stringify(options)}`
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      // In production, call translation API
      const result = await this.mockTranslate(text, options)

      // Cache result
      this.cache.set(cacheKey, result)

      // Update stats
      this.stats.totalTranslations++
      this.updateLanguageStats(options.targetLang)
      this.updateAverageProcessingTime(Date.now() - startTime)
      await this.saveStats()

      return result
    } catch (error: any) {
      console.error('[AIAssistant] Translation error:', error)
      throw new Error(`Translation failed: ${error.message}`)
    }
  }

  /**
   * Analyze sentiment
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
    const startTime = Date.now()

    try {
      // Check cache
      const cacheKey = `sentiment:${this.hashText(text)}`
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      // In production, call sentiment analysis API
      const result = await this.mockSentimentAnalysis(text)

      // Cache result
      this.cache.set(cacheKey, result)

      // Update stats
      this.stats.totalAnalyses++
      this.updateAverageProcessingTime(Date.now() - startTime)
      await this.saveStats()

      return result
    } catch (error: any) {
      console.error('[AIAssistant] Sentiment analysis error:', error)
      throw new Error(`Sentiment analysis failed: ${error.message}`)
    }
  }

  /**
   * Extract keywords
   */
  async extractKeywords(text: string, maxKeywords: number = 10): Promise<KeywordExtractionResult> {
    try {
      // Check cache
      const cacheKey = `keywords:${this.hashText(text)}:${maxKeywords}`
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      // In production, use NLP library or API
      const result = await this.mockKeywordExtraction(text, maxKeywords)

      // Cache result
      this.cache.set(cacheKey, result)

      return result
    } catch (error: any) {
      console.error('[AIAssistant] Keyword extraction error:', error)
      throw new Error(`Keyword extraction failed: ${error.message}`)
    }
  }

  /**
   * Check grammar
   */
  async checkGrammar(text: string): Promise<GrammarCheckResult> {
    try {
      // Check cache
      const cacheKey = `grammar:${this.hashText(text)}`
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      // In production, call grammar checking API (LanguageTool, Grammarly API, etc.)
      const result = await this.mockGrammarCheck(text)

      // Cache result
      this.cache.set(cacheKey, result)

      return result
    } catch (error: any) {
      console.error('[AIAssistant] Grammar check error:', error)
      throw new Error(`Grammar check failed: ${error.message}`)
    }
  }

  /**
   * Enhance text
   */
  async enhanceText(
    text: string,
    options: TextEnhancementOptions = {}
  ): Promise<TextEnhancementResult> {
    try {
      // Check cache
      const cacheKey = `enhance:${this.hashText(text)}:${JSON.stringify(options)}`
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)
      }

      // In production, call AI API
      const result = await this.mockTextEnhancement(text, options)

      // Cache result
      this.cache.set(cacheKey, result)

      return result
    } catch (error: any) {
      console.error('[AIAssistant] Text enhancement error:', error)
      throw new Error(`Text enhancement failed: ${error.message}`)
    }
  }

  /**
   * Mock summarization implementation
   */
  private async mockSummarize(
    text: string,
    options: SummarizationOptions
  ): Promise<SummarizationResult> {
    await new Promise(resolve => setTimeout(resolve, 500))

    const words = text.split(/\s+/)
    const wordCount = words.length

    let summaryLength: number
    switch (options.length) {
      case 'short':
        summaryLength = Math.min(50, Math.floor(wordCount * 0.2))
        break
      case 'long':
        summaryLength = Math.min(200, Math.floor(wordCount * 0.4))
        break
      default: // medium
        summaryLength = Math.min(100, Math.floor(wordCount * 0.3))
    }

    const summaryWords = words.slice(0, summaryLength)
    const summary = summaryWords.join(' ') + '...'

    // Extract key points (simplified)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const keyPoints = sentences.slice(0, 3).map(s => s.trim())

    return {
      summary,
      keyPoints,
      wordCount: summaryLength,
      compressionRatio: summaryLength / wordCount,
      processingTime: 0 // Will be set by caller
    }
  }

  /**
   * Mock translation implementation
   */
  private async mockTranslate(
    text: string,
    options: TranslationOptions
  ): Promise<TranslationResult> {
    await new Promise(resolve => setTimeout(resolve, 300))

    // Mock translation (in production, use real API)
    const mockTranslations: Record<string, string> = {
      'zh-CN': '这是翻译后的文本。',
      'en-US': 'This is the translated text.',
      'ja-JP': 'これは翻訳されたテキストです。',
      'ko-KR': '이것은 번역된 텍스트입니다.',
      'fr-FR': 'Ceci est le texte traduit.',
      'de-DE': 'Dies ist der übersetzte Text.',
      'es-ES': 'Este es el texto traducido.'
    }

    return {
      translatedText: mockTranslations[options.targetLang] || `[Translated to ${options.targetLang}]: ${text}`,
      detectedSourceLang: options.sourceLang || 'auto',
      confidence: 0.95,
      alternatives: []
    }
  }

  /**
   * Mock sentiment analysis implementation
   */
  private async mockSentimentAnalysis(text: string): Promise<SentimentAnalysisResult> {
    await new Promise(resolve => setTimeout(resolve, 200))

    // Simple keyword-based sentiment (in production, use ML model)
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'happy', '好', '棒', '优秀']
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', '差', '糟', '讨厌']

    const lowerText = text.toLowerCase()
    let score = 0

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 0.2
    })

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 0.2
    })

    score = Math.max(-1, Math.min(1, score))

    let overall: 'positive' | 'negative' | 'neutral' | 'mixed'
    if (score > 0.3) overall = 'positive'
    else if (score < -0.3) overall = 'negative'
    else if (Math.abs(score) < 0.1) overall = 'neutral'
    else overall = 'mixed'

    return {
      overall,
      score,
      confidence: 0.8,
      emotions: {
        joy: score > 0 ? Math.abs(score) : 0,
        sadness: score < 0 ? Math.abs(score) * 0.5 : 0,
        anger: score < -0.5 ? Math.abs(score) * 0.3 : 0,
        fear: 0,
        surprise: 0.1
      }
    }
  }

  /**
   * Mock keyword extraction implementation
   */
  private async mockKeywordExtraction(
    text: string,
    maxKeywords: number
  ): Promise<KeywordExtractionResult> {
    await new Promise(resolve => setTimeout(resolve, 200))

    // Simple frequency-based extraction (in production, use TF-IDF or NLP)
    const words = text.toLowerCase().match(/\b\w+\b/g) || []
    const frequency: Record<string, number> = {}

    words.forEach(word => {
      if (word.length > 3) { // Filter short words
        frequency[word] = (frequency[word] || 0) + 1
      }
    })

    const keywords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxKeywords)
      .map(([keyword, freq]) => ({
        keyword,
        score: freq / words.length,
        frequency: freq
      }))

    return {
      keywords,
      phrases: [],
      entities: []
    }
  }

  /**
   * Mock grammar check implementation
   */
  private async mockGrammarCheck(text: string): Promise<GrammarCheckResult> {
    await new Promise(resolve => setTimeout(resolve, 300))

    // Mock some common issues
    const issues: GrammarCheckResult['issues'] = []

    // Check for double spaces
    let match
    const doubleSpaceRegex = /  +/g
    while ((match = doubleSpaceRegex.exec(text)) !== null) {
      issues.push({
        type: 'punctuation',
        original: match[0],
        suggestion: ' ',
        explanation: 'Extra spaces detected',
        position: { start: match.index, end: match.index + match[0].length },
        severity: 'suggestion'
      })
    }

    return {
      correctedText: text.replace(/  +/g, ' '),
      issues,
      score: 95 - issues.length * 5
    }
  }

  /**
   * Mock text enhancement implementation
   */
  private async mockTextEnhancement(
    text: string,
    options: TextEnhancementOptions
  ): Promise<TextEnhancementResult> {
    await new Promise(resolve => setTimeout(resolve, 400))

    return {
      enhancedText: text, // In production, return enhanced version
      improvements: [
        {
          type: 'clarity',
          before: 'something',
          after: 'something better',
          reason: 'Improved clarity'
        }
      ],
      readabilityScore: 75
    }
  }

  /**
   * Hash text for caching
   */
  private hashText(text: string): string {
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Update average processing time
   */
  private updateAverageProcessingTime(time: number): void {
    const total = this.stats.totalSummarizations + this.stats.totalTranslations + this.stats.totalAnalyses
    this.stats.averageProcessingTime =
      (this.stats.averageProcessingTime * (total - 1) + time) / total
  }

  /**
   * Update language usage statistics
   */
  private updateLanguageStats(lang: string): void {
    this.stats.mostUsedLanguages[lang] = (this.stats.mostUsedLanguages[lang] || 0) + 1
  }

  /**
   * Get statistics
   */
  getStats(): AIAssistantStats {
    return { ...this.stats }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
    console.log('[AIAssistant] Cache cleared')
  }

  /**
   * Save statistics
   */
  private async saveStats(): Promise<void> {
    await this.store.setItem('stats', this.stats)
  }
}

/**
 * Global AI assistant service instance
 */
export const aiAssistantService = new AIAssistantService()

/**
 * Initialize on module load
 */
aiAssistantService.initialize().catch(console.error)

import { EventEmitter } from '@/utils/EventEmitter'
import type { Message, Conversation } from '@/types'

// Advanced search interfaces
export interface SearchFilter {
  dateRange?: {
    start: Date
    end: Date
  }
  messageType?: 'user' | 'assistant' | 'system' | 'all'
  models?: string[]
  hasAttachments?: boolean
  tokenRange?: {
    min: number
    max: number
  }
  conversationTags?: string[]
  messageLength?: {
    min: number
    max: number
  }
  sentiment?: 'positive' | 'negative' | 'neutral'
  languages?: string[]
}

export interface SearchResult {
  id: string
  type: 'message' | 'conversation'
  content: string
  snippet: string
  score: number
  highlights: string[]
  conversationId: string
  messageId?: string
  metadata: {
    timestamp: Date
    messageType?: 'user' | 'assistant' | 'system'
    model?: string
    tokens?: number
    language?: string
    sentiment?: number
    tags?: string[]
  }
}

export interface SearchQuery {
  text: string
  filters: SearchFilter
  sortBy: 'relevance' | 'date' | 'tokens' | 'length'
  sortOrder: 'asc' | 'desc'
  limit: number
  offset: number
}

export interface SearchSuggestion {
  text: string
  type: 'query' | 'filter' | 'command'
  description: string
  score: number
}

export interface SearchIndex {
  id: string
  content: string
  tokens: string[]
  metadata: SearchResult['metadata']
  vector?: number[] // For semantic search
}

class AdvancedSearchService extends EventEmitter {
  private searchIndex: Map<string, SearchIndex> = new Map()
  private recentQueries: string[] = []
  private popularFilters: Map<string, number> = new Map()
  private stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
  ])

  constructor() {
    super()
    this.loadSearchIndex()
  }

  // Initialize search index from existing data
  async initializeIndex(conversations: Conversation[]) {
    this.searchIndex.clear()

    for (const conversation of conversations) {
      // Index conversation metadata
      this.indexConversation(conversation)

      // Index all messages
      for (const message of conversation.messages) {
        this.indexMessage(message, conversation.id)
      }
    }

    this.emit('index_updated', { totalItems: this.searchIndex.size })
  }

  // Index a single conversation
  private indexConversation(conversation: Conversation) {
    const index: SearchIndex = {
      id: `conv_${conversation.id}`,
      content: `${conversation.title} ${conversation.tags?.join(' ') || ''}`,
      tokens: this.tokenize(`${conversation.title} ${conversation.tags?.join(' ') || ''}`),
      metadata: {
        timestamp: conversation.createdAt,
        tags: conversation.tags,
        language: this.detectLanguage(conversation.title)
      }
    }

    this.searchIndex.set(index.id, index)
  }

  // Index a single message
  private indexMessage(message: Message, conversationId: string) {
    const content = message.content
    const tokens = this.tokenize(content)

    const index: SearchIndex = {
      id: `msg_${message.id}`,
      content,
      tokens,
      metadata: {
        timestamp: message.timestamp,
        messageType: message.role,
        model: message.model,
        tokens: message.tokens,
        language: this.detectLanguage(content),
        sentiment: this.analyzeSentiment(content)
      }
    }

    // Add semantic vector (mock implementation)
    index.vector = this.generateSemanticVector(content)

    this.searchIndex.set(index.id, index)
  }

  // Perform advanced search
  async search(query: SearchQuery): Promise<{
    results: SearchResult[]
    totalCount: number
    suggestions: SearchSuggestion[]
    facets: {
      models: Map<string, number>
      languages: Map<string, number>
      messageTypes: Map<string, number>
      dateRanges: Map<string, number>
    }
  }> {
    // Add to recent queries
    if (query.text.trim()) {
      this.addRecentQuery(query.text)
    }

    // Get all search indices that match filters
    const filteredIndices = this.applyFilters(Array.from(this.searchIndex.values()), query.filters)

    // Perform text search if query provided
    let scoredResults: Array<{ index: SearchIndex; score: number; highlights: string[] }> = []

    if (query.text.trim()) {
      scoredResults = this.performTextSearch(filteredIndices, query.text)
    } else {
      // If no text query, return all filtered results
      scoredResults = filteredIndices.map(index => ({
        index,
        score: 1,
        highlights: []
      }))
    }

    // Sort results
    scoredResults = this.sortResults(scoredResults, query.sortBy, query.sortOrder)

    // Apply pagination
    const totalCount = scoredResults.length
    const paginatedResults = scoredResults.slice(query.offset, query.offset + query.limit)

    // Convert to SearchResult format
    const results: SearchResult[] = paginatedResults.map(({ index, score, highlights }) => ({
      id: index.id,
      type: index.id.startsWith('conv_') ? 'conversation' : 'message',
      content: index.content,
      snippet: this.generateSnippet(index.content, query.text, highlights),
      score,
      highlights,
      conversationId: index.id.startsWith('conv_') ? index.id.replace('conv_', '') : this.extractConversationId(index.id),
      messageId: index.id.startsWith('msg_') ? index.id.replace('msg_', '') : undefined,
      metadata: index.metadata
    }))

    // Generate suggestions
    const suggestions = this.generateSuggestions(query)

    // Generate facets
    const facets = this.generateFacets(filteredIndices)

    return {
      results,
      totalCount,
      suggestions,
      facets
    }
  }

  // Apply filters to search indices
  private applyFilters(indices: SearchIndex[], filters: SearchFilter): SearchIndex[] {
    return indices.filter(index => {
      // Date range filter
      if (filters.dateRange) {
        const timestamp = index.metadata.timestamp
        if (timestamp < filters.dateRange.start || timestamp > filters.dateRange.end) {
          return false
        }
      }

      // Message type filter
      if (filters.messageType && filters.messageType !== 'all') {
        if (index.metadata.messageType !== filters.messageType) {
          return false
        }
      }

      // Models filter
      if (filters.models && filters.models.length > 0) {
        if (!index.metadata.model || !filters.models.includes(index.metadata.model)) {
          return false
        }
      }

      // Token range filter
      if (filters.tokenRange) {
        const tokens = index.metadata.tokens || 0
        if (tokens < filters.tokenRange.min || tokens > filters.tokenRange.max) {
          return false
        }
      }

      // Message length filter
      if (filters.messageLength) {
        const length = index.content.length
        if (length < filters.messageLength.min || length > filters.messageLength.max) {
          return false
        }
      }

      // Sentiment filter
      if (filters.sentiment) {
        const sentiment = this.classifySentiment(index.metadata.sentiment || 0)
        if (sentiment !== filters.sentiment) {
          return false
        }
      }

      // Language filter
      if (filters.languages && filters.languages.length > 0) {
        if (!index.metadata.language || !filters.languages.includes(index.metadata.language)) {
          return false
        }
      }

      // Tags filter
      if (filters.conversationTags && filters.conversationTags.length > 0) {
        const tags = index.metadata.tags || []
        const hasMatchingTag = filters.conversationTags.some(tag => tags.includes(tag))
        if (!hasMatchingTag) {
          return false
        }
      }

      return true
    })
  }

  // Perform text-based search
  private performTextSearch(indices: SearchIndex[], queryText: string): Array<{ index: SearchIndex; score: number; highlights: string[] }> {
    const queryTokens = this.tokenize(queryText)
    const results: Array<{ index: SearchIndex; score: number; highlights: string[] }> = []

    for (const index of indices) {
      const { score, highlights } = this.calculateRelevanceScore(index, queryTokens, queryText)

      if (score > 0) {
        results.push({ index, score, highlights })
      }
    }

    return results.sort((a, b) => b.score - a.score)
  }

  // Calculate relevance score for text search
  private calculateRelevanceScore(index: SearchIndex, queryTokens: string[], originalQuery: string): { score: number; highlights: string[] } {
    let score = 0
    const highlights: string[] = []

    // Exact phrase matching (highest score)
    if (index.content.toLowerCase().includes(originalQuery.toLowerCase())) {
      score += 100
      highlights.push(originalQuery)
    }

    // Token-based matching
    for (const queryToken of queryTokens) {
      if (this.stopWords.has(queryToken.toLowerCase())) continue

      const tokenCount = index.tokens.filter(token =>
        token.toLowerCase().includes(queryToken.toLowerCase())
      ).length

      if (tokenCount > 0) {
        score += tokenCount * 10
        highlights.push(queryToken)
      }
    }

    // Semantic similarity (mock implementation)
    if (index.vector) {
      const queryVector = this.generateSemanticVector(originalQuery)
      const similarity = this.cosineSimilarity(index.vector, queryVector)
      score += similarity * 50
    }

    // Boost based on metadata
    if (index.metadata.messageType === 'assistant') {
      score *= 1.2 // Boost AI responses
    }

    if (index.metadata.tokens && index.metadata.tokens > 100) {
      score *= 1.1 // Boost longer messages
    }

    return { score, highlights: [...new Set(highlights)] }
  }

  // Sort search results
  private sortResults(
    results: Array<{ index: SearchIndex; score: number; highlights: string[] }>,
    sortBy: SearchQuery['sortBy'],
    sortOrder: SearchQuery['sortOrder']
  ) {
    return results.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'relevance':
          comparison = b.score - a.score
          break
        case 'date':
          comparison = b.index.metadata.timestamp.getTime() - a.index.metadata.timestamp.getTime()
          break
        case 'tokens':
          comparison = (b.index.metadata.tokens || 0) - (a.index.metadata.tokens || 0)
          break
        case 'length':
          comparison = b.index.content.length - a.index.content.length
          break
      }

      return sortOrder === 'desc' ? comparison : -comparison
    })
  }

  // Generate search suggestions
  private generateSuggestions(query: SearchQuery): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = []

    // Recent queries
    this.recentQueries.forEach((recentQuery, index) => {
      if (recentQuery.toLowerCase().includes(query.text.toLowerCase()) && recentQuery !== query.text) {
        suggestions.push({
          text: recentQuery,
          type: 'query',
          description: '最近搜索',
          score: 100 - index
        })
      }
    })

    // Auto-complete suggestions
    if (query.text.length > 2) {
      const matches = this.getAutocompleteSuggestions(query.text)
      matches.forEach(match => {
        suggestions.push({
          text: match,
          type: 'query',
          description: '自动补全',
          score: 80
        })
      })
    }

    // Filter suggestions
    if (query.text.startsWith('model:')) {
      const availableModels = this.getAvailableModels()
      availableModels.forEach(model => {
        suggestions.push({
          text: `model:${model}`,
          type: 'filter',
          description: `按模型筛选: ${model}`,
          score: 70
        })
      })
    }

    // Command suggestions
    if (query.text.startsWith('/')) {
      const commands = [
        { cmd: '/recent', desc: '显示最近消息' },
        { cmd: '/long', desc: '显示长消息' },
        { cmd: '/errors', desc: '显示错误消息' },
        { cmd: '/bookmarks', desc: '显示书签' }
      ]

      commands.forEach(({ cmd, desc }) => {
        if (cmd.startsWith(query.text)) {
          suggestions.push({
            text: cmd,
            type: 'command',
            description: desc,
            score: 60
          })
        }
      })
    }

    return suggestions.sort((a, b) => b.score - a.score).slice(0, 10)
  }

  // Generate search facets for filtering
  private generateFacets(indices: SearchIndex[]) {
    const facets = {
      models: new Map<string, number>(),
      languages: new Map<string, number>(),
      messageTypes: new Map<string, number>(),
      dateRanges: new Map<string, number>()
    }

    for (const index of indices) {
      // Models facet
      if (index.metadata.model) {
        facets.models.set(index.metadata.model, (facets.models.get(index.metadata.model) || 0) + 1)
      }

      // Languages facet
      if (index.metadata.language) {
        facets.languages.set(index.metadata.language, (facets.languages.get(index.metadata.language) || 0) + 1)
      }

      // Message types facet
      if (index.metadata.messageType) {
        facets.messageTypes.set(index.metadata.messageType, (facets.messageTypes.get(index.metadata.messageType) || 0) + 1)
      }

      // Date ranges facet
      const dateRange = this.getDateRange(index.metadata.timestamp)
      facets.dateRanges.set(dateRange, (facets.dateRanges.get(dateRange) || 0) + 1)
    }

    return facets
  }

  // Helper methods
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1 && !this.stopWords.has(token))
  }

  private detectLanguage(text: string): string {
    // Simple language detection (in production, use a proper library)
    const chinesePattern = /[\u4e00-\u9fff]/
    const englishPattern = /[a-zA-Z]/

    if (chinesePattern.test(text)) return 'zh'
    if (englishPattern.test(text)) return 'en'
    return 'unknown'
  }

  private analyzeSentiment(text: string): number {
    // Simple sentiment analysis (in production, use ML models)
    const positiveWords = ['好', 'great', 'excellent', '棒', '很好', 'amazing', 'wonderful']
    const negativeWords = ['坏', 'bad', 'terrible', '糟糕', '不好', 'awful', 'horrible']

    let score = 0
    const words = text.toLowerCase().split(/\s+/)

    for (const word of words) {
      if (positiveWords.some(pw => word.includes(pw))) score += 1
      if (negativeWords.some(nw => word.includes(nw))) score -= 1
    }

    return Math.max(-1, Math.min(1, score / words.length))
  }

  private classifySentiment(score: number): 'positive' | 'negative' | 'neutral' {
    if (score > 0.1) return 'positive'
    if (score < -0.1) return 'negative'
    return 'neutral'
  }

  private generateSemanticVector(text: string): number[] {
    // Mock semantic vector generation (in production, use embeddings)
    const tokens = this.tokenize(text)
    const vector = new Array(128).fill(0)

    for (let i = 0; i < tokens.length && i < vector.length; i++) {
      const hash = this.simpleHash(tokens[i])
      vector[i % vector.length] += hash
    }

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0))
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < Math.min(vec1.length, vec2.length); i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647 // Normalize to [0, 1]
  }

  private generateSnippet(content: string, query: string, highlights: string[]): string {
    const maxLength = 150

    if (!query || content.length <= maxLength) {
      return content.slice(0, maxLength) + (content.length > maxLength ? '...' : '')
    }

    // Find the best position to center the snippet around
    const queryIndex = content.toLowerCase().indexOf(query.toLowerCase())
    if (queryIndex >= 0) {
      const start = Math.max(0, queryIndex - maxLength / 2)
      const end = Math.min(content.length, start + maxLength)
      let snippet = content.slice(start, end)

      if (start > 0) snippet = '...' + snippet
      if (end < content.length) snippet = snippet + '...'

      return snippet
    }

    return content.slice(0, maxLength) + '...'
  }

  private extractConversationId(messageId: string): string {
    // In a real implementation, this would query the database
    // For now, return a mock conversation ID
    return 'unknown'
  }

  private addRecentQuery(query: string) {
    this.recentQueries = [query, ...this.recentQueries.filter(q => q !== query)].slice(0, 10)
    this.saveRecentQueries()
  }

  private getAutocompleteSuggestions(partial: string): string[] {
    // Get suggestions from search index
    const suggestions = new Set<string>()

    for (const index of this.searchIndex.values()) {
      for (const token of index.tokens) {
        if (token.toLowerCase().startsWith(partial.toLowerCase()) && token.length > partial.length) {
          suggestions.add(token)
          if (suggestions.size >= 5) break
        }
      }
    }

    return Array.from(suggestions)
  }

  private getAvailableModels(): string[] {
    const models = new Set<string>()

    for (const index of this.searchIndex.values()) {
      if (index.metadata.model) {
        models.add(index.metadata.model)
      }
    }

    return Array.from(models)
  }

  private getDateRange(date: Date): string {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays <= 7) return '本周'
    if (diffDays <= 30) return '本月'
    if (diffDays <= 365) return '今年'
    return '更早'
  }

  // Persistence methods
  private loadSearchIndex() {
    try {
      const stored = localStorage.getItem('advancedSearch_index')
      if (stored) {
        const data = JSON.parse(stored)
        // Note: In a real implementation, you'd properly deserialize the dates and other objects
        console.log('Loaded search index from storage')
      }
    } catch (error) {
      console.error('Failed to load search index:', error)
    }
  }

  private saveSearchIndex() {
    try {
      // In a real implementation, you'd serialize the search index
      localStorage.setItem('advancedSearch_lastUpdate', Date.now().toString())
    } catch (error) {
      console.error('Failed to save search index:', error)
    }
  }

  private saveRecentQueries() {
    try {
      localStorage.setItem('advancedSearch_recentQueries', JSON.stringify(this.recentQueries))
    } catch (error) {
      console.error('Failed to save recent queries:', error)
    }
  }

  private loadRecentQueries() {
    try {
      const stored = localStorage.getItem('advancedSearch_recentQueries')
      if (stored) {
        this.recentQueries = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load recent queries:', error)
    }
  }

  // Public methods for managing the search index
  async addMessage(message: Message, conversationId: string) {
    this.indexMessage(message, conversationId)
    this.emit('message_indexed', { messageId: message.id })
  }

  async removeMessage(messageId: string) {
    this.searchIndex.delete(`msg_${messageId}`)
    this.emit('message_removed', { messageId })
  }

  async updateMessage(message: Message, conversationId: string) {
    this.indexMessage(message, conversationId)
    this.emit('message_updated', { messageId: message.id })
  }

  async addConversation(conversation: Conversation) {
    this.indexConversation(conversation)
    this.emit('conversation_indexed', { conversationId: conversation.id })
  }

  async removeConversation(conversationId: string) {
    // Remove conversation and all its messages
    const keysToRemove = Array.from(this.searchIndex.keys()).filter(key =>
      key === `conv_${conversationId}` || key.startsWith(`msg_${conversationId}_`)
    )

    keysToRemove.forEach(key => this.searchIndex.delete(key))
    this.emit('conversation_removed', { conversationId })
  }

  // Export search results
  async exportResults(results: SearchResult[], format: 'json' | 'csv' | 'txt'): Promise<string> {
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2)

      case 'csv':
        const headers = ['ID', 'Type', 'Content', 'Score', 'Timestamp', 'Model']
        const rows = results.map(result => [
          result.id,
          result.type,
          `"${result.content.replace(/"/g, '""')}"`,
          result.score.toString(),
          result.metadata.timestamp.toISOString(),
          result.metadata.model || ''
        ])
        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

      case 'txt':
        return results.map(result =>
          `${result.type.toUpperCase()} [${result.score.toFixed(2)}]: ${result.content}`
        ).join('\n\n')

      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  // Get search statistics
  getSearchStats(): {
    totalIndexedItems: number
    recentQueriesCount: number
    popularFilters: Array<{ filter: string; count: number }>
    indexSize: string
  } {
    const indexSizeBytes = JSON.stringify(Array.from(this.searchIndex.entries())).length
    const indexSizeKB = (indexSizeBytes / 1024).toFixed(2)

    return {
      totalIndexedItems: this.searchIndex.size,
      recentQueriesCount: this.recentQueries.length,
      popularFilters: Array.from(this.popularFilters.entries())
        .map(([filter, count]) => ({ filter, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      indexSize: `${indexSizeKB} KB`
    }
  }
}

// Singleton instance
const advancedSearchService = new AdvancedSearchService()

export default advancedSearchService
export type { AdvancedSearchService }
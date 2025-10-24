import type { Conversation, Message } from '@/types'

export interface SearchFilter {
  dateRange?: {
    start: Date
    end: Date
  }
  messageType?: 'user' | 'assistant' | 'all'
  models?: string[]
  hasAttachments?: boolean
  minLength?: number
  maxLength?: number
}

export interface SearchResult {
  conversationId: string
  conversationTitle: string
  messageId: string
  message: Message
  highlightedContent: string
  relevanceScore: number
  context: {
    previousMessage?: Message
    nextMessage?: Message
  }
}

export interface SearchOptions {
  query: string
  filters?: SearchFilter
  limit?: number
  offset?: number
  sortBy?: 'relevance' | 'date' | 'conversation'
  sortOrder?: 'asc' | 'desc'
}

export class SearchService {
  private static instance: SearchService
  private searchHistory: string[] = []
  private recentSearches: string[] = []

  private constructor() {
    this.loadSearchHistory()
  }

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService()
    }
    return SearchService.instance
  }

  /**
   * 执行搜索
   */
  public async search(
    conversations: Conversation[],
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const { query, filters, limit = 50, offset = 0, sortBy = 'relevance', sortOrder = 'desc' } = options

    if (!query.trim()) {
      return []
    }

    // 记录搜索历史
    this.addToSearchHistory(query)

    // 获取所有符合条件的消息
    const candidateMessages = this.getFilteredMessages(conversations, filters)

    // 执行搜索匹配
    const results = this.performSearch(candidateMessages, query)

    // 排序
    const sortedResults = this.sortResults(results, sortBy, sortOrder)

    // 分页
    return sortedResults.slice(offset, offset + limit)
  }

  /**
   * 获取搜索建议
   */
  public getSearchSuggestions(query: string): string[] {
    const suggestions: string[] = []

    // 从搜索历史中获取相似的搜索
    const historySuggestions = this.searchHistory
      .filter(h => h.toLowerCase().includes(query.toLowerCase()) && h !== query)
      .slice(0, 3)

    suggestions.push(...historySuggestions)

    // 添加一些常用搜索建议
    const commonSuggestions = [
      '代码',
      '错误',
      '解决方案',
      '教程',
      '示例',
      '最佳实践',
      '性能优化',
      '安全',
      'API',
      '数据库'
    ].filter(s => s.toLowerCase().includes(query.toLowerCase()) && !suggestions.includes(s))

    suggestions.push(...commonSuggestions.slice(0, 5 - suggestions.length))

    return suggestions
  }

  /**
   * 获取搜索历史
   */
  public getSearchHistory(): string[] {
    return [...this.searchHistory].reverse()
  }

  /**
   * 清除搜索历史
   */
  public clearSearchHistory(): void {
    this.searchHistory = []
    this.saveSearchHistory()
  }

  /**
   * 高级搜索 - 支持多种搜索语法
   */
  public parseAdvancedQuery(query: string): {
    terms: string[]
    exactPhrases: string[]
    excludeTerms: string[]
    operators: string[]
  } {
    const terms: string[] = []
    const exactPhrases: string[] = []
    const excludeTerms: string[] = []
    const operators: string[] = []

    // 解析引号中的精确短语
    const phraseRegex = /"([^"]+)"/g
    let match
    while ((match = phraseRegex.exec(query)) !== null) {
      exactPhrases.push(match[1])
      query = query.replace(match[0], '')
    }

    // 解析排除词 (以 - 开头)
    const excludeRegex = /-(\w+)/g
    while ((match = excludeRegex.exec(query)) !== null) {
      excludeTerms.push(match[1])
      query = query.replace(match[0], '')
    }

    // 解析操作符
    const operatorRegex = /\b(AND|OR|NOT)\b/gi
    while ((match = operatorRegex.exec(query)) !== null) {
      operators.push(match[1].toUpperCase())
      query = query.replace(match[0], '')
    }

    // 剩余的词作为普通搜索词
    const remainingTerms = query
      .split(/\s+/)
      .filter(term => term.trim().length > 0)
    terms.push(...remainingTerms)

    return { terms, exactPhrases, excludeTerms, operators }
  }

  /**
   * 语义搜索 - 基于内容相似性
   */
  public async semanticSearch(
    conversations: Conversation[],
    query: string,
    limit: number = 10
  ): Promise<SearchResult[]> {
    // 这里可以集成更高级的语义搜索算法
    // 目前使用简化的关键词匹配和相关性评分

    const allMessages = this.getAllMessages(conversations)
    const results: SearchResult[] = []

    for (const { conversation, message, index } of allMessages) {
      const relevanceScore = this.calculateSemanticRelevance(message.content, query)

      if (relevanceScore > 0.3) { // 阈值过滤
        results.push({
          conversationId: conversation.id,
          conversationTitle: conversation.title,
          messageId: message.id,
          message,
          highlightedContent: this.highlightSearchTerms(message.content, query),
          relevanceScore,
          context: this.getMessageContext(conversation, index)
        })
      }
    }

    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
  }

  private getFilteredMessages(
    conversations: Conversation[],
    filters?: SearchFilter
  ): Array<{ conversation: Conversation; message: Message; index: number }> {
    const messages: Array<{ conversation: Conversation; message: Message; index: number }> = []

    for (const conversation of conversations) {
      // 检查模型过滤
      if (filters?.models && filters.models.length > 0) {
        if (!filters.models.includes(conversation.model)) {
          continue
        }
      }

      for (let i = 0; i < conversation.messages.length; i++) {
        const message = conversation.messages[i]

        // 检查消息类型过滤
        if (filters?.messageType && filters.messageType !== 'all') {
          if (message.role !== filters.messageType) {
            continue
          }
        }

        // 检查日期范围过滤
        if (filters?.dateRange) {
          const messageDate = new Date(message.timestamp)
          if (messageDate < filters.dateRange.start || messageDate > filters.dateRange.end) {
            continue
          }
        }

        // 检查消息长度过滤
        if (filters?.minLength && message.content.length < filters.minLength) {
          continue
        }
        if (filters?.maxLength && message.content.length > filters.maxLength) {
          continue
        }

        // 检查附件过滤
        if (filters?.hasAttachments !== undefined) {
          const hasAttachments = !!(message as any).attachments?.length
          if (filters.hasAttachments !== hasAttachments) {
            continue
          }
        }

        messages.push({ conversation, message, index: i })
      }
    }

    return messages
  }

  private performSearch(
    candidates: Array<{ conversation: Conversation; message: Message; index: number }>,
    query: string
  ): SearchResult[] {
    const results: SearchResult[] = []
    const { terms, exactPhrases, excludeTerms } = this.parseAdvancedQuery(query)

    for (const { conversation, message, index } of candidates) {
      const content = message.content.toLowerCase()
      let relevanceScore = 0
      let matchFound = false

      // 检查精确短语匹配
      for (const phrase of exactPhrases) {
        if (content.includes(phrase.toLowerCase())) {
          relevanceScore += 10
          matchFound = true
        }
      }

      // 检查普通词匹配
      for (const term of terms) {
        if (content.includes(term.toLowerCase())) {
          relevanceScore += 5
          matchFound = true
        }
      }

      // 检查排除词
      let shouldExclude = false
      for (const excludeTerm of excludeTerms) {
        if (content.includes(excludeTerm.toLowerCase())) {
          shouldExclude = true
          break
        }
      }

      if (matchFound && !shouldExclude) {
        results.push({
          conversationId: conversation.id,
          conversationTitle: conversation.title,
          messageId: message.id,
          message,
          highlightedContent: this.highlightSearchTerms(message.content, query),
          relevanceScore,
          context: this.getMessageContext(conversation, index)
        })
      }
    }

    return results
  }

  private sortResults(
    results: SearchResult[],
    sortBy: string,
    sortOrder: string
  ): SearchResult[] {
    return results.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'relevance':
          comparison = a.relevanceScore - b.relevanceScore
          break
        case 'date':
          comparison = a.message.timestamp - b.message.timestamp
          break
        case 'conversation':
          comparison = a.conversationTitle.localeCompare(b.conversationTitle)
          break
        default:
          comparison = a.relevanceScore - b.relevanceScore
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })
  }

  private highlightSearchTerms(content: string, query: string): string {
    const { terms, exactPhrases } = this.parseAdvancedQuery(query)
    let highlighted = content

    // 高亮精确短语
    for (const phrase of exactPhrases) {
      const regex = new RegExp(`(${phrase})`, 'gi')
      highlighted = highlighted.replace(regex, '<mark>$1</mark>')
    }

    // 高亮普通词
    for (const term of terms) {
      const regex = new RegExp(`\\b(${term})\\b`, 'gi')
      highlighted = highlighted.replace(regex, '<mark>$1</mark>')
    }

    return highlighted
  }

  private getMessageContext(
    conversation: Conversation,
    messageIndex: number
  ): { previousMessage?: Message; nextMessage?: Message } {
    return {
      previousMessage: messageIndex > 0 ? conversation.messages[messageIndex - 1] : undefined,
      nextMessage: messageIndex < conversation.messages.length - 1
        ? conversation.messages[messageIndex + 1]
        : undefined
    }
  }

  private getAllMessages(
    conversations: Conversation[]
  ): Array<{ conversation: Conversation; message: Message; index: number }> {
    const messages: Array<{ conversation: Conversation; message: Message; index: number }> = []

    for (const conversation of conversations) {
      for (let i = 0; i < conversation.messages.length; i++) {
        messages.push({
          conversation,
          message: conversation.messages[i],
          index: i
        })
      }
    }

    return messages
  }

  private calculateSemanticRelevance(content: string, query: string): number {
    // 简化的语义相关性计算
    // 在实际应用中，这里可以使用更复杂的算法，如 TF-IDF、Word2Vec 等

    const contentWords = content.toLowerCase().split(/\s+/)
    const queryWords = query.toLowerCase().split(/\s+/)

    let matchCount = 0
    let totalQueryWords = queryWords.length

    for (const queryWord of queryWords) {
      if (contentWords.some(word => word.includes(queryWord) || queryWord.includes(word))) {
        matchCount++
      }
    }

    return matchCount / totalQueryWords
  }

  private addToSearchHistory(query: string): void {
    // 避免重复
    const index = this.searchHistory.indexOf(query)
    if (index > -1) {
      this.searchHistory.splice(index, 1)
    }

    this.searchHistory.push(query)

    // 限制历史记录数量
    if (this.searchHistory.length > 50) {
      this.searchHistory.shift()
    }

    this.saveSearchHistory()
  }

  private loadSearchHistory(): void {
    try {
      const stored = localStorage.getItem('search-history')
      if (stored) {
        this.searchHistory = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Load search history error:', error)
    }
  }

  private saveSearchHistory(): void {
    try {
      localStorage.setItem('search-history', JSON.stringify(this.searchHistory))
    } catch (error) {
      console.error('Save search history error:', error)
    }
  }
}
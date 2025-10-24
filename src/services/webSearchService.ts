/**
 * Web Search Service
 * Supports multiple search providers: Serper, Tavily, DuckDuckGo, Brave
 */

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
  source?: string
  publishedDate?: string
  score?: number
}

export interface WebSearchConfig {
  provider: 'serper' | 'tavily' | 'duckduckgo' | 'brave'
  apiKey?: string
  maxResults?: number
  includeImages?: boolean
  includeNews?: boolean
  safeSearch?: boolean
}

export interface SerperResponse {
  searchParameters: {
    q: string
    type: string
  }
  organic: Array<{
    title: string
    link: string
    snippet: string
    position: number
    date?: string
  }>
  answerBox?: {
    answer?: string
    snippet?: string
    title?: string
  }
  knowledgeGraph?: {
    title?: string
    description?: string
  }
}

export interface TavilyResponse {
  query: string
  results: Array<{
    title: string
    url: string
    content: string
    score: number
    published_date?: string
  }>
  answer?: string
}

export class WebSearchService {
  private config: WebSearchConfig

  constructor(config: WebSearchConfig) {
    this.config = config
  }

  /**
   * Main search method - routes to appropriate provider
   */
  async search(query: string): Promise<WebSearchResult[]> {
    switch (this.config.provider) {
      case 'serper':
        return this.searchWithSerper(query)
      case 'tavily':
        return this.searchWithTavily(query)
      case 'duckduckgo':
        return this.searchWithDuckDuckGo(query)
      case 'brave':
        return this.searchWithBrave(query)
      default:
        throw new Error(`Unsupported search provider: ${this.config.provider}`)
    }
  }

  /**
   * Search with Serper API (Google Search)
   */
  private async searchWithSerper(query: string): Promise<WebSearchResult[]> {
    if (!this.config.apiKey) {
      throw new Error('Serper API key is required')
    }

    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.config.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: query,
          num: this.config.maxResults || 10,
          gl: 'us',
          hl: 'en'
        })
      })

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.status}`)
      }

      const data: SerperResponse = await response.json()

      const results: WebSearchResult[] = data.organic.map(item => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        source: 'Serper/Google',
        publishedDate: item.date
      }))

      // Add answer box if available
      if (data.answerBox?.snippet) {
        results.unshift({
          title: data.answerBox.title || 'Answer',
          url: '',
          snippet: data.answerBox.snippet,
          source: 'Google Answer Box'
        })
      }

      return results
    } catch (error: any) {
      console.error('Serper search error:', error)
      throw new Error(`Serper search failed: ${error.message}`)
    }
  }

  /**
   * Search with Tavily API (AI-optimized search)
   */
  private async searchWithTavily(query: string): Promise<WebSearchResult[]> {
    if (!this.config.apiKey) {
      throw new Error('Tavily API key is required')
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: this.config.apiKey,
          query: query,
          max_results: this.config.maxResults || 10,
          search_depth: 'advanced',
          include_answer: true,
          include_images: this.config.includeImages || false,
          include_raw_content: false
        })
      })

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status}`)
      }

      const data: TavilyResponse = await response.json()

      const results: WebSearchResult[] = data.results.map(item => ({
        title: item.title,
        url: item.url,
        snippet: item.content,
        source: 'Tavily',
        score: item.score,
        publishedDate: item.published_date
      }))

      // Add AI-generated answer if available
      if (data.answer) {
        results.unshift({
          title: 'AI Summary',
          url: '',
          snippet: data.answer,
          source: 'Tavily AI',
          score: 1.0
        })
      }

      return results
    } catch (error: any) {
      console.error('Tavily search error:', error)
      throw new Error(`Tavily search failed: ${error.message}`)
    }
  }

  /**
   * Search with DuckDuckGo (Free, no API key required)
   */
  private async searchWithDuckDuckGo(query: string): Promise<WebSearchResult[]> {
    try {
      // Using DuckDuckGo Instant Answer API
      const encodedQuery = encodeURIComponent(query)
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`
      )

      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status}`)
      }

      const data = await response.json()

      const results: WebSearchResult[] = []

      // Add abstract if available
      if (data.Abstract) {
        results.push({
          title: data.Heading || 'Summary',
          url: data.AbstractURL || '',
          snippet: data.Abstract,
          source: 'DuckDuckGo',
          publishedDate: data.AbstractSource
        })
      }

      // Add related topics
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        data.RelatedTopics.slice(0, this.config.maxResults || 10).forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || topic.Text,
              url: topic.FirstURL,
              snippet: topic.Text,
              source: 'DuckDuckGo'
            })
          }
        })
      }

      if (results.length === 0) {
        throw new Error('No results found from DuckDuckGo')
      }

      return results
    } catch (error: any) {
      console.error('DuckDuckGo search error:', error)
      throw new Error(`DuckDuckGo search failed: ${error.message}`)
    }
  }

  /**
   * Search with Brave Search API
   */
  private async searchWithBrave(query: string): Promise<WebSearchResult[]> {
    if (!this.config.apiKey) {
      throw new Error('Brave API key is required')
    }

    try {
      const encodedQuery = encodeURIComponent(query)
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodedQuery}&count=${this.config.maxResults || 10}`,
        {
          headers: {
            'X-Subscription-Token': this.config.apiKey,
            'Accept': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Brave API error: ${response.status}`)
      }

      const data = await response.json()

      const results: WebSearchResult[] = []

      // Add web results
      if (data.web?.results) {
        data.web.results.forEach((item: any) => {
          results.push({
            title: item.title,
            url: item.url,
            snippet: item.description || '',
            source: 'Brave',
            publishedDate: item.age
          })
        })
      }

      return results
    } catch (error: any) {
      console.error('Brave search error:', error)
      throw new Error(`Brave search failed: ${error.message}`)
    }
  }

  /**
   * Format search results for AI consumption
   */
  formatForAI(results: WebSearchResult[], query: string): string {
    const parts: string[] = []

    parts.push(`🔍 网络搜索结果: "${query}"`)
    parts.push(`来源: ${this.config.provider}`)
    parts.push(`找到 ${results.length} 个结果`)
    parts.push('')

    results.forEach((result, index) => {
      parts.push(`[${index + 1}] ${result.title}`)
      if (result.snippet) {
        parts.push(`   ${result.snippet}`)
      }
      if (result.url) {
        parts.push(`   🔗 ${result.url}`)
      }
      if (result.publishedDate) {
        parts.push(`   📅 ${result.publishedDate}`)
      }
      if (result.score !== undefined) {
        parts.push(`   📊 相关度: ${(result.score * 100).toFixed(0)}%`)
      }
      parts.push('')
    })

    return parts.join('\n')
  }

  /**
   * Search and get formatted results
   */
  async searchAndFormat(query: string): Promise<string> {
    const results = await this.search(query)
    return this.formatForAI(results, query)
  }
}

/**
 * Create search service instance
 */
export function createWebSearchService(config: WebSearchConfig): WebSearchService {
  return new WebSearchService(config)
}

/**
 * Quick search helper
 */
export async function quickWebSearch(
  query: string,
  provider: 'serper' | 'tavily' | 'duckduckgo' | 'brave' = 'duckduckgo',
  apiKey?: string
): Promise<WebSearchResult[]> {
  const service = createWebSearchService({
    provider,
    apiKey,
    maxResults: 10
  })

  return service.search(query)
}

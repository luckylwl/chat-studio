// Network Service - 网络功能服务
// 提供搜索、天气、股票、新闻等网络功能

import type { UserPreferences } from '@/types'

export interface SearchResult {
  title: string
  url: string
  snippet: string
  timestamp?: string
}

export interface WeatherData {
  location: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  forecast: Array<{
    date: string
    high: number
    low: number
    condition: string
  }>
}

export interface StockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  marketCap?: number
  volume?: number
}

export interface NewsItem {
  title: string
  url: string
  summary: string
  source: string
  publishedAt: string
  imageUrl?: string
}

export class NetworkService {
  private preferences: UserPreferences

  constructor(preferences: UserPreferences) {
    this.preferences = preferences
  }

  // 网络搜索功能
  async search(query: string, options?: {
    limit?: number
    language?: string
    region?: string
  }): Promise<SearchResult[]> {
    if (!this.preferences.enableWebSearch) {
      throw new Error('网络搜索功能未启用')
    }

    const searchEngine = this.preferences.searchEngine || 'google'
    const limit = options?.limit || 10

    try {
      // 根据配置的搜索引擎进行搜索
      switch (searchEngine) {
        case 'google':
          return await this.googleSearch(query, limit)
        case 'bing':
          return await this.bingSearch(query, limit)
        case 'duckduckgo':
          return await this.duckduckgoSearch(query, limit)
        default:
          throw new Error(`不支持的搜索引擎: ${searchEngine}`)
      }
    } catch (error) {
      console.error('搜索失败:', error)
      throw new Error(`搜索失败: ${error}`)
    }
  }

  // Google搜索实现
  private async googleSearch(query: string, limit: number): Promise<SearchResult[]> {
    // 使用 Google Custom Search API 或 SerpAPI
    const apiKey = this.preferences.searchApiKey

    if (apiKey) {
      // 使用付费API进行搜索
      const response = await this.fetchWithTimeout(
        `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}&num=${limit}`,
        { timeout: this.preferences.networkTimeout || 30000 }
      )
      const data = await response.json()

      return (data.organic_results || []).map((result: any) => ({
        title: result.title,
        url: result.link,
        snippet: result.snippet || '',
        timestamp: result.date
      }))
    } else {
      // 使用免费的搜索代理服务 (模拟实现)
      return this.simulateSearchResults(query, limit)
    }
  }

  // Bing搜索实现
  private async bingSearch(query: string, limit: number): Promise<SearchResult[]> {
    const apiKey = this.preferences.searchApiKey

    if (apiKey) {
      // 使用 Bing Search API
      const response = await this.fetchWithTimeout(
        `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${limit}`,
        {
          headers: { 'Ocp-Apim-Subscription-Key': apiKey },
          timeout: this.preferences.networkTimeout || 30000
        }
      )
      const data = await response.json()

      return (data.webPages?.value || []).map((result: any) => ({
        title: result.name,
        url: result.url,
        snippet: result.snippet || '',
        timestamp: result.dateLastCrawled
      }))
    } else {
      return this.simulateSearchResults(query, limit)
    }
  }

  // DuckDuckGo搜索实现
  private async duckduckgoSearch(query: string, limit: number): Promise<SearchResult[]> {
    // DuckDuckGo 即时回答API (免费但有限制)
    try {
      const response = await this.fetchWithTimeout(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
        { timeout: this.preferences.networkTimeout || 30000 }
      )
      const data = await response.json()

      const results: SearchResult[] = []

      // 添加即时回答
      if (data.Answer) {
        results.push({
          title: '即时回答',
          url: data.AnswerURL || '',
          snippet: data.Answer
        })
      }

      // 添加相关主题
      if (data.RelatedTopics) {
        data.RelatedTopics.slice(0, limit - results.length).forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || topic.Text,
              url: topic.FirstURL,
              snippet: topic.Text
            })
          }
        })
      }

      // 如果结果不足，使用模拟结果补充
      if (results.length < limit) {
        const simulatedResults = await this.simulateSearchResults(query, limit - results.length)
        results.push(...simulatedResults)
      }

      return results.slice(0, limit)
    } catch (error) {
      return this.simulateSearchResults(query, limit)
    }
  }

  // 获取天气信息
  async getWeather(location: string): Promise<WeatherData> {
    if (!this.preferences.enableWeather) {
      throw new Error('天气信息功能未启用')
    }

    // 使用免费的天气API (如 OpenWeatherMap 或 WeatherAPI)
    // 这里提供一个模拟实现
    return {
      location,
      temperature: Math.floor(Math.random() * 30) + 10,
      condition: ['晴', '多云', '小雨', '阴'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 40) + 40,
      windSpeed: Math.floor(Math.random() * 15) + 5,
      forecast: Array.from({ length: 5 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toLocaleDateString(),
        high: Math.floor(Math.random() * 25) + 15,
        low: Math.floor(Math.random() * 10) + 5,
        condition: ['晴', '多云', '小雨', '阴'][Math.floor(Math.random() * 4)]
      }))
    }
  }

  // 获取股票信息
  async getStock(symbol: string): Promise<StockData> {
    if (!this.preferences.enableStock) {
      throw new Error('股票信息功能未启用')
    }

    // 使用免费的股票API (如 Alpha Vantage 或 Yahoo Finance)
    // 这里提供一个模拟实现
    const basePrice = Math.random() * 1000 + 50
    const change = (Math.random() - 0.5) * 20

    return {
      symbol: symbol.toUpperCase(),
      name: `${symbol.toUpperCase()} Company`,
      price: Math.round((basePrice + Number.EPSILON) * 100) / 100,
      change: Math.round((change + Number.EPSILON) * 100) / 100,
      changePercent: Math.round(((change / basePrice) * 100 + Number.EPSILON) * 100) / 100,
      marketCap: Math.floor(Math.random() * 1000000000) + 1000000000,
      volume: Math.floor(Math.random() * 10000000) + 1000000
    }
  }

  // 获取新闻资讯
  async getNews(category?: string, limit: number = 10): Promise<NewsItem[]> {
    if (!this.preferences.enableNews) {
      throw new Error('新闻资讯功能未启用')
    }

    // 使用免费的新闻API (如 NewsAPI)
    // 这里提供一个模拟实现
    const categories = ['科技', '财经', '体育', '娱乐', '健康', '国际']
    const sources = ['TechCrunch', '财经网', '新浪体育', '娱乐头条', '健康时报', 'CNN']

    return Array.from({ length: limit }, (_, i) => ({
      title: `${category || categories[i % categories.length]}新闻标题 ${i + 1}`,
      url: `https://example.com/news/${i + 1}`,
      summary: `这是一条关于${category || categories[i % categories.length]}的新闻摘要，包含了最新的发展动态和重要信息。`,
      source: sources[i % sources.length],
      publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      imageUrl: `https://picsum.photos/400/200?random=${i}`
    }))
  }

  // 模拟搜索结果 (当没有API密钥时使用)
  private async simulateSearchResults(query: string, limit: number): Promise<SearchResult[]> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    return Array.from({ length: Math.min(limit, 8) }, (_, i) => ({
      title: `${query} 相关结果 ${i + 1}`,
      url: `https://example.com/result-${i + 1}`,
      snippet: `这是关于 "${query}" 的搜索结果摘要 ${i + 1}。包含了相关的信息和详细描述。`,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }))
  }

  // 带超时的fetch请求
  private async fetchWithTimeout(url: string, options: any = {}): Promise<Response> {
    const { timeout = 30000, ...fetchOptions } = options
    const controller = new AbortController()

    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // 更新用户偏好设置
  updatePreferences(preferences: UserPreferences) {
    this.preferences = preferences
  }
}

// 创建网络服务实例的工厂函数
export function createNetworkService(preferences: UserPreferences): NetworkService {
  return new NetworkService(preferences)
}

// 预定义的常用搜索命令模式
export const SEARCH_PATTERNS = {
  WEATHER: /^(天气|weather)\s+(.+)$/i,
  STOCK: /^(股票|stock)\s+([A-Z]{1,5})$/i,
  NEWS: /^(新闻|news)(?:\s+(.+))?$/i,
  SEARCH: /^(搜索|search)\s+(.+)$/i
}

// 检测用户输入是否包含网络功能命令
export function detectNetworkCommand(input: string): {
  type: 'weather' | 'stock' | 'news' | 'search' | null
  query: string
} {
  for (const [type, pattern] of Object.entries(SEARCH_PATTERNS)) {
    const match = input.match(pattern)
    if (match) {
      return {
        type: type.toLowerCase() as any,
        query: match[2] || match[1] || input
      }
    }
  }

  return { type: null, query: input }
}
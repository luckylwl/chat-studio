/**
 * 智能缓存管理器
 * 支持内存缓存、LocalStorage 持久化、过期策略
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  expiresAt: number
  hits: number
  size: number
}

interface CacheOptions {
  ttl?: number              // Time to live (ms)
  maxSize?: number          // Max cache size (MB)
  maxItems?: number         // Max number of items
  persistent?: boolean      // Use localStorage
  namespace?: string        // Cache namespace
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map()
  private options: Required<CacheOptions>
  private currentSize: number = 0

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000,        // 5 minutes
      maxSize: options.maxSize || 50,            // 50 MB
      maxItems: options.maxItems || 1000,        // 1000 items
      persistent: options.persistent ?? false,
      namespace: options.namespace || 'app-cache'
    }

    if (this.options.persistent) {
      this.loadFromStorage()
    }

    // 定期清理过期缓存
    setInterval(() => this.cleanup(), 60000) // 每分钟
  }

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.options.ttl)
    const size = this.estimateSize(data)

    // 检查是否超过大小限制
    if (this.currentSize + size > this.options.maxSize * 1024 * 1024) {
      this.evictLRU() // 淘汰最少使用的项
    }

    // 检查是否超过数量限制
    if (this.cache.size >= this.options.maxItems) {
      this.evictLRU()
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt,
      hits: 0,
      size
    }

    // 如果key已存在,先减去旧的大小
    const existing = this.cache.get(key)
    if (existing) {
      this.currentSize -= existing.size
    }

    this.cache.set(key, item)
    this.currentSize += size

    if (this.options.persistent) {
      this.saveToStorage()
    }
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) {
      return null
    }

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.delete(key)
      return null
    }

    // 增加命中次数
    item.hits++

    return item.data as T
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    if (Date.now() > item.expiresAt) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const item = this.cache.get(key)
    if (item) {
      this.currentSize -= item.size
      this.cache.delete(key)

      if (this.options.persistent) {
        this.saveToStorage()
      }

      return true
    }
    return false
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
    this.currentSize = 0

    if (this.options.persistent) {
      localStorage.removeItem(this.options.namespace)
    }
  }

  /**
   * 获取或设置缓存 (如果不存在则执行获取函数)
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // 先尝试从缓存获取
    const cached = this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // 缓存未命中,执行获取函数
    const data = await fetcher()
    this.set(key, data, ttl)

    return data
  }

  /**
   * 清理过期缓存
   */
  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => this.delete(key))

    if (expiredKeys.length > 0) {
      console.log(`[Cache] Cleaned up ${expiredKeys.length} expired items`)
    }
  }

  /**
   * LRU 淘汰策略 (Least Recently Used)
   */
  private evictLRU(): void {
    let lruKey: string | null = null
    let minHits = Infinity
    let oldestTime = Infinity

    for (const [key, item] of this.cache.entries()) {
      // 优先淘汰命中次数少的
      if (item.hits < minHits) {
        minHits = item.hits
        lruKey = key
        oldestTime = item.timestamp
      } else if (item.hits === minHits && item.timestamp < oldestTime) {
        // 命中次数相同,淘汰更旧的
        lruKey = key
        oldestTime = item.timestamp
      }
    }

    if (lruKey) {
      console.log(`[Cache] Evicting LRU item: ${lruKey}`)
      this.delete(lruKey)
    }
  }

  /**
   * 估算数据大小 (字节)
   */
  private estimateSize(data: any): number {
    const jsonString = JSON.stringify(data)
    return new Blob([jsonString]).size
  }

  /**
   * 保存到 LocalStorage
   */
  private saveToStorage(): void {
    try {
      const cacheData = Array.from(this.cache.entries())
      localStorage.setItem(this.options.namespace, JSON.stringify(cacheData))
    } catch (error) {
      console.error('[Cache] Failed to save to storage:', error)
      // LocalStorage 可能已满,清理一些数据
      this.evictLRU()
    }
  }

  /**
   * 从 LocalStorage 加载
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.options.namespace)
      if (stored) {
        const cacheData = JSON.parse(stored) as Array<[string, CacheItem<any>]>
        const now = Date.now()

        for (const [key, item] of cacheData) {
          // 只加载未过期的项
          if (now <= item.expiresAt) {
            this.cache.set(key, item)
            this.currentSize += item.size
          }
        }

        console.log(`[Cache] Loaded ${this.cache.size} items from storage`)
      }
    } catch (error) {
      console.error('[Cache] Failed to load from storage:', error)
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    let totalHits = 0
    let oldestItem = Date.now()
    let newestItem = 0

    for (const item of this.cache.values()) {
      totalHits += item.hits
      if (item.timestamp < oldestItem) oldestItem = item.timestamp
      if (item.timestamp > newestItem) newestItem = item.timestamp
    }

    return {
      itemCount: this.cache.size,
      totalSize: (this.currentSize / 1024 / 1024).toFixed(2) + ' MB',
      maxSize: this.options.maxSize + ' MB',
      utilization: ((this.currentSize / (this.options.maxSize * 1024 * 1024)) * 100).toFixed(2) + '%',
      totalHits,
      avgHits: this.cache.size > 0 ? (totalHits / this.cache.size).toFixed(2) : '0',
      oldestItem: new Date(oldestItem).toISOString(),
      newestItem: new Date(newestItem).toISOString()
    }
  }

  /**
   * 导出缓存数据 (用于调试)
   */
  export(): Record<string, any> {
    const exported: Record<string, any> = {}

    for (const [key, item] of this.cache.entries()) {
      exported[key] = {
        data: item.data,
        timestamp: new Date(item.timestamp).toISOString(),
        expiresAt: new Date(item.expiresAt).toISOString(),
        hits: item.hits,
        size: (item.size / 1024).toFixed(2) + ' KB'
      }
    }

    return exported
  }
}

// 预设缓存实例
export const apiCache = new CacheManager({
  ttl: 5 * 60 * 1000,      // 5分钟
  maxSize: 20,              // 20MB
  maxItems: 500,
  persistent: true,
  namespace: 'api-cache'
})

export const conversationCache = new CacheManager({
  ttl: 30 * 60 * 1000,     // 30分钟
  maxSize: 30,              // 30MB
  maxItems: 100,
  persistent: true,
  namespace: 'conversation-cache'
})

export const userDataCache = new CacheManager({
  ttl: 60 * 60 * 1000,     // 1小时
  maxSize: 10,              // 10MB
  maxItems: 50,
  persistent: true,
  namespace: 'user-data-cache'
})

export default CacheManager

// 添加到 window 对象供开发者工具使用
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__cacheStats = () => {
    console.log('API Cache:', apiCache.getStats())
    console.log('Conversation Cache:', conversationCache.getStats())
    console.log('User Data Cache:', userDataCache.getStats())
  }

  (window as any).__exportCache = () => {
    return {
      api: apiCache.export(),
      conversation: conversationCache.export(),
      userData: userDataCache.export()
    }
  }

  console.log('[Cache] Development tools available: window.__cacheStats(), window.__exportCache()')
}

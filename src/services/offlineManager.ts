/**
 * 离线模式管理器
 * 处理离线数据存储、同步和冲突解决
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'

// 数据库结构定义
interface OfflineDB extends DBSchema {
  conversations: {
    key: string
    value: {
      id: string
      title: string
      messages: any[]
      lastModified: number
      syncStatus: 'synced' | 'pending' | 'conflict'
    }
  }
  pendingActions: {
    key: string
    value: {
      id: string
      type: string
      data: any
      timestamp: number
      retryCount: number
    }
  }
  cache: {
    key: string
    value: {
      key: string
      data: any
      timestamp: number
      expiresAt: number
    }
  }
}

export interface OfflineConversation {
  id: string
  title: string
  messages: any[]
  lastModified: number
  syncStatus: 'synced' | 'pending' | 'conflict'
}

export interface PendingAction {
  id: string
  type: string
  data: any
  timestamp: number
  retryCount: number
}

class OfflineManager {
  private db: IDBPDatabase<OfflineDB> | null = null
  private readonly DB_NAME = 'chat-studio-offline'
  private readonly DB_VERSION = 1
  private syncQueue: PendingAction[] = []
  private isSyncing = false

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    try {
      this.db = await openDB<OfflineDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // 创建对话存储
          if (!db.objectStoreNames.contains('conversations')) {
            db.createObjectStore('conversations', { keyPath: 'id' })
          }

          // 创建待处理动作存储
          if (!db.objectStoreNames.contains('pendingActions')) {
            const store = db.createObjectStore('pendingActions', { keyPath: 'id' })
            store.createIndex('timestamp', 'timestamp')
          }

          // 创建缓存存储
          if (!db.objectStoreNames.contains('cache')) {
            const store = db.createObjectStore('cache', { keyPath: 'key' })
            store.createIndex('expiresAt', 'expiresAt')
          }
        },
      })

      // 加载待同步的动作
      await this.loadPendingActions()

      // 开始自动同步
      this.startAutoSync()

      console.log('Offline manager initialized')
    } catch (error) {
      console.error('Failed to initialize offline manager:', error)
    }
  }

  /**
   * 保存对话到离线存储
   */
  async saveConversation(conversation: OfflineConversation): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    try {
      await this.db!.put('conversations', {
        ...conversation,
        lastModified: Date.now(),
      })
    } catch (error) {
      console.error('Failed to save conversation:', error)
      throw error
    }
  }

  /**
   * 获取离线对话
   */
  async getConversation(id: string): Promise<OfflineConversation | undefined> {
    if (!this.db) {
      await this.initialize()
    }

    try {
      return await this.db!.get('conversations', id)
    } catch (error) {
      console.error('Failed to get conversation:', error)
      return undefined
    }
  }

  /**
   * 获取所有离线对话
   */
  async getAllConversations(): Promise<OfflineConversation[]> {
    if (!this.db) {
      await this.initialize()
    }

    try {
      return await this.db!.getAll('conversations')
    } catch (error) {
      console.error('Failed to get all conversations:', error)
      return []
    }
  }

  /**
   * 删除离线对话
   */
  async deleteConversation(id: string): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    try {
      await this.db!.delete('conversations', id)
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      throw error
    }
  }

  /**
   * 添加待处理动作
   */
  async addPendingAction(
    type: string,
    data: any
  ): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    const action: PendingAction = {
      id: `${type}-${Date.now()}-${Math.random()}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    }

    try {
      await this.db!.add('pendingActions', action)
      this.syncQueue.push(action)

      // 如果在线,立即尝试同步
      if (navigator.onLine && !this.isSyncing) {
        this.processSyncQueue()
      }
    } catch (error) {
      console.error('Failed to add pending action:', error)
      throw error
    }
  }

  /**
   * 加载待处理动作
   */
  private async loadPendingActions(): Promise<void> {
    if (!this.db) return

    try {
      const actions = await this.db.getAll('pendingActions')
      this.syncQueue = actions.sort((a, b) => a.timestamp - b.timestamp)
    } catch (error) {
      console.error('Failed to load pending actions:', error)
    }
  }

  /**
   * 处理同步队列
   */
  private async processSyncQueue(): Promise<void> {
    if (this.isSyncing || this.syncQueue.length === 0 || !navigator.onLine) {
      return
    }

    this.isSyncing = true

    while (this.syncQueue.length > 0) {
      const action = this.syncQueue[0]

      try {
        // 尝试同步动作
        await this.syncAction(action)

        // 同步成功,从队列和数据库中移除
        this.syncQueue.shift()
        await this.db!.delete('pendingActions', action.id)
      } catch (error) {
        console.error('Failed to sync action:', error)

        // 增加重试次数
        action.retryCount++

        // 如果重试次数超过限制,从队列中移除
        if (action.retryCount >= 3) {
          console.warn('Action failed after 3 retries, removing from queue:', action)
          this.syncQueue.shift()
          await this.db!.delete('pendingActions', action.id)
        } else {
          // 更新重试次数
          await this.db!.put('pendingActions', action)
          // 将失败的动作移到队列末尾
          this.syncQueue.push(this.syncQueue.shift()!)
        }

        break // 停止处理,等待下次同步
      }
    }

    this.isSyncing = false
  }

  /**
   * 同步单个动作
   */
  private async syncAction(action: PendingAction): Promise<void> {
    // 这里应该调用实际的 API
    // 示例实现:
    console.log('Syncing action:', action)

    return new Promise((resolve, reject) => {
      // 模拟 API 调用
      setTimeout(() => {
        if (Math.random() > 0.1) {
          resolve()
        } else {
          reject(new Error('Sync failed'))
        }
      }, 1000)
    })
  }

  /**
   * 开始自动同步
   */
  private startAutoSync(): void {
    // 监听在线状态
    window.addEventListener('online', () => {
      console.log('Network online, starting sync...')
      this.processSyncQueue()
    })

    // 定期同步(每30秒)
    setInterval(() => {
      if (navigator.onLine) {
        this.processSyncQueue()
      }
    }, 30000)
  }

  /**
   * 缓存数据
   */
  async cacheData(
    key: string,
    data: any,
    ttl: number = 3600000 // 默认1小时
  ): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    try {
      await this.db!.put('cache', {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      })
    } catch (error) {
      console.error('Failed to cache data:', error)
    }
  }

  /**
   * 获取缓存数据
   */
  async getCachedData(key: string): Promise<any | undefined> {
    if (!this.db) {
      await this.initialize()
    }

    try {
      const cached = await this.db!.get('cache', key)

      if (!cached) {
        return undefined
      }

      // 检查是否过期
      if (cached.expiresAt < Date.now()) {
        await this.db!.delete('cache', key)
        return undefined
      }

      return cached.data
    } catch (error) {
      console.error('Failed to get cached data:', error)
      return undefined
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanExpiredCache(): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    try {
      const tx = this.db!.transaction('cache', 'readwrite')
      const index = tx.store.index('expiresAt')
      const now = Date.now()

      let cursor = await index.openCursor(IDBKeyRange.upperBound(now))

      while (cursor) {
        await cursor.delete()
        cursor = await cursor.continue()
      }

      await tx.done
    } catch (error) {
      console.error('Failed to clean expired cache:', error)
    }
  }

  /**
   * 获取存储使用情况
   */
  async getStorageUsage(): Promise<{
    conversations: number
    pendingActions: number
    cache: number
    total: number
  }> {
    if (!this.db) {
      await this.initialize()
    }

    try {
      const conversations = await this.db!.count('conversations')
      const pendingActions = await this.db!.count('pendingActions')
      const cache = await this.db!.count('cache')

      return {
        conversations,
        pendingActions,
        cache,
        total: conversations + pendingActions + cache,
      }
    } catch (error) {
      console.error('Failed to get storage usage:', error)
      return {
        conversations: 0,
        pendingActions: 0,
        cache: 0,
        total: 0,
      }
    }
  }

  /**
   * 清空所有离线数据
   */
  async clearAllData(): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }

    try {
      await this.db!.clear('conversations')
      await this.db!.clear('pendingActions')
      await this.db!.clear('cache')
      this.syncQueue = []
    } catch (error) {
      console.error('Failed to clear all data:', error)
      throw error
    }
  }

  /**
   * 导出离线数据
   */
  async exportData(): Promise<{
    conversations: OfflineConversation[]
    pendingActions: PendingAction[]
  }> {
    if (!this.db) {
      await this.initialize()
    }

    try {
      const conversations = await this.db!.getAll('conversations')
      const pendingActions = await this.db!.getAll('pendingActions')

      return {
        conversations,
        pendingActions,
      }
    } catch (error) {
      console.error('Failed to export data:', error)
      return {
        conversations: [],
        pendingActions: [],
      }
    }
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): {
    isSyncing: boolean
    pendingCount: number
    isOnline: boolean
  } {
    return {
      isSyncing: this.isSyncing,
      pendingCount: this.syncQueue.length,
      isOnline: navigator.onLine,
    }
  }
}

// 单例导出
const offlineManager = new OfflineManager()
export default offlineManager

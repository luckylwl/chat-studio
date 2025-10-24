/**
 * IndexedDB 数据持久化服务
 * 提供对话和消息的本地存储
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb'
import { env } from '@/config/env'

// 数据库 Schema
interface ChatDB extends DBSchema {
  conversations: {
    key: string
    value: Conversation
    indexes: {
      'by-date': Date
      'by-updated': Date
    }
  }
  messages: {
    key: string
    value: Message
    indexes: {
      'by-conversation': string
      'by-date': Date
    }
  }
  settings: {
    key: string
    value: any
  }
  cache: {
    key: string
    value: {
      data: any
      timestamp: number
      ttl: number
    }
    indexes: {
      'by-timestamp': number
    }
  }
}

interface Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  model?: string
  provider?: string
  messageCount: number
}

interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  model?: string
  tokens?: number
}

/**
 * IndexedDB 服务类
 */
class IndexedDBService {
  private db: IDBPDatabase<ChatDB> | null = null
  private dbName = 'chat-studio'
  private dbVersion = 1

  /**
   * 初始化数据库
   */
  async init(): Promise<void> {
    if (!env.storage.useIndexedDB) {
      console.log('IndexedDB is disabled in config')
      return
    }

    try {
      this.db = await openDB<ChatDB>(this.dbName, this.dbVersion, {
        upgrade(db, oldVersion, newVersion, transaction) {
          // 对话存储
          if (!db.objectStoreNames.contains('conversations')) {
            const convStore = db.createObjectStore('conversations', {
              keyPath: 'id'
            })
            convStore.createIndex('by-date', 'createdAt')
            convStore.createIndex('by-updated', 'updatedAt')
          }

          // 消息存储
          if (!db.objectStoreNames.contains('messages')) {
            const msgStore = db.createObjectStore('messages', {
              keyPath: 'id'
            })
            msgStore.createIndex('by-conversation', 'conversationId')
            msgStore.createIndex('by-date', 'timestamp')
          }

          // 设置存储
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', {
              keyPath: 'key'
            })
          }

          // 缓存存储
          if (!db.objectStoreNames.contains('cache')) {
            const cacheStore = db.createObjectStore('cache', {
              keyPath: 'key'
            })
            cacheStore.createIndex('by-timestamp', 'timestamp')
          }
        }
      })

      console.log('IndexedDB initialized successfully')

      // 清理过期缓存
      await this.cleanExpiredCache()
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error)
      throw error
    }
  }

  /**
   * 保存对话
   */
  async saveConversation(conversation: Conversation): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.put('conversations', {
      ...conversation,
      updatedAt: new Date()
    })
  }

  /**
   * 获取所有对话
   */
  async getAllConversations(): Promise<Conversation[]> {
    if (!this.db) throw new Error('Database not initialized')

    return this.db.getAllFromIndex('conversations', 'by-updated')
  }

  /**
   * 获取单个对话
   */
  async getConversation(id: string): Promise<Conversation | undefined> {
    if (!this.db) throw new Error('Database not initialized')

    return this.db.get('conversations', id)
  }

  /**
   * 删除对话及其所有消息
   */
  async deleteConversation(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const tx = this.db.transaction(['conversations', 'messages'], 'readwrite')

    // 删除对话
    await tx.objectStore('conversations').delete(id)

    // 删除该对话的所有消息
    const messageStore = tx.objectStore('messages')
    const messageIndex = messageStore.index('by-conversation')
    const messages = await messageIndex.getAllKeys(id)

    for (const messageId of messages) {
      await messageStore.delete(messageId)
    }

    await tx.done
  }

  /**
   * 保存消息
   */
  async saveMessage(message: Message): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.put('messages', message)

    // 更新对话的更新时间和消息数
    const conversation = await this.getConversation(message.conversationId)
    if (conversation) {
      conversation.updatedAt = new Date()
      conversation.messageCount = (conversation.messageCount || 0) + 1
      await this.saveConversation(conversation)
    }
  }

  /**
   * 获取对话的所有消息
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    if (!this.db) throw new Error('Database not initialized')

    return this.db.getAllFromIndex('messages', 'by-conversation', conversationId)
  }

  /**
   * 保存设置
   */
  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.put('settings', { key, value })
  }

  /**
   * 获取设置
   */
  async getSetting(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized')

    const setting = await this.db.get('settings', key)
    return setting?.value
  }

  /**
   * 设置缓存
   */
  async setCache(key: string, data: any, ttl: number = 3600000): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    await this.db.put('cache', {
      key,
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * 获取缓存
   */
  async getCache(key: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized')

    const cache = await this.db.get('cache', key)

    if (!cache) return null

    // 检查是否过期
    if (Date.now() - cache.timestamp > cache.ttl) {
      await this.db.delete('cache', key)
      return null
    }

    return cache.data
  }

  /**
   * 清理过期缓存
   */
  async cleanExpiredCache(): Promise<void> {
    if (!this.db) return

    const tx = this.db.transaction('cache', 'readwrite')
    const store = tx.objectStore('cache')
    const index = store.index('by-timestamp')

    const allCache = await index.getAll()
    const now = Date.now()

    for (const cache of allCache) {
      if (now - cache.timestamp > cache.ttl) {
        await store.delete(cache.key)
      }
    }

    await tx.done
  }

  /**
   * 获取存储使用情况
   */
  async getStorageUsage(): Promise<{
    conversations: number
    messages: number
    settings: number
    cache: number
    total: number
  }> {
    if (!this.db) throw new Error('Database not initialized')

    const [conversations, messages, settings, cache] = await Promise.all([
      this.db.count('conversations'),
      this.db.count('messages'),
      this.db.count('settings'),
      this.db.count('cache')
    ])

    return {
      conversations,
      messages,
      settings,
      cache,
      total: conversations + messages + settings + cache
    }
  }

  /**
   * 导出所有数据
   */
  async exportData(): Promise<{
    conversations: Conversation[]
    messages: Message[]
    settings: any[]
  }> {
    if (!this.db) throw new Error('Database not initialized')

    const [conversations, messages, settings] = await Promise.all([
      this.db.getAll('conversations'),
      this.db.getAll('messages'),
      this.db.getAll('settings')
    ])

    return { conversations, messages, settings }
  }

  /**
   * 导入数据
   */
  async importData(data: {
    conversations?: Conversation[]
    messages?: Message[]
    settings?: any[]
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const tx = this.db.transaction(['conversations', 'messages', 'settings'], 'readwrite')

    if (data.conversations) {
      const convStore = tx.objectStore('conversations')
      for (const conv of data.conversations) {
        await convStore.put(conv)
      }
    }

    if (data.messages) {
      const msgStore = tx.objectStore('messages')
      for (const msg of data.messages) {
        await msgStore.put(msg)
      }
    }

    if (data.settings) {
      const settingStore = tx.objectStore('settings')
      for (const setting of data.settings) {
        await settingStore.put(setting)
      }
    }

    await tx.done
  }

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const tx = this.db.transaction(['conversations', 'messages', 'settings', 'cache'], 'readwrite')

    await Promise.all([
      tx.objectStore('conversations').clear(),
      tx.objectStore('messages').clear(),
      tx.objectStore('settings').clear(),
      tx.objectStore('cache').clear()
    ])

    await tx.done
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}

/**
 * 默认 IndexedDB 服务实例
 */
export const indexedDB = new IndexedDBService()

// 自动初始化
if (typeof window !== 'undefined') {
  indexedDB.init().catch(console.error)
}

export type { Conversation, Message }

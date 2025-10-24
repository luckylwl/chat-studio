import type { Conversation, Message } from '@/types'

interface OfflineQueueItem {
  id: string
  type: 'message' | 'conversation' | 'settings' | 'template'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  retryCount: number
}

interface SyncStatus {
  isOnline: boolean
  lastSync: number
  pendingItems: number
  syncInProgress: boolean
}

class OfflineStorageService {
  private static instance: OfflineStorageService
  private dbName = 'ai-chat-studio'
  private dbVersion = 1
  private db: IDBDatabase | null = null
  private syncQueue: OfflineQueueItem[] = []
  private isOnline = navigator.onLine
  private syncInProgress = false

  constructor() {
    this.initializeDB()
    this.setupOfflineDetection()
    this.loadSyncQueue()
  }

  static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService()
    }
    return OfflineStorageService.instance
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const conversationsStore = db.createObjectStore('conversations', { keyPath: 'id' })
          conversationsStore.createIndex('createdAt', 'createdAt', { unique: false })
          conversationsStore.createIndex('updatedAt', 'updatedAt', { unique: false })
        }

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: 'id' })
          messagesStore.createIndex('conversationId', 'conversationId', { unique: false })
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }

        // Templates store
        if (!db.objectStoreNames.contains('templates')) {
          const templatesStore = db.createObjectStore('templates', { keyPath: 'id' })
          templatesStore.createIndex('category', 'category', { unique: false })
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
          syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Cache store for API responses
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' })
          cacheStore.createIndex('expiry', 'expiry', { unique: false })
        }
      }
    })
  }

  private setupOfflineDetection(): void {
    window.addEventListener('online', () => {
      this.isOnline = true
      console.log('Back online - syncing data...')
      this.syncPendingItems()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      console.log('Gone offline - queuing changes...')
    })
  }

  private async loadSyncQueue(): Promise<void> {
    if (!this.db) await this.initializeDB()

    try {
      const transaction = this.db!.transaction(['syncQueue'], 'readonly')
      const store = transaction.objectStore('syncQueue')
      const request = store.getAll()

      request.onsuccess = () => {
        this.syncQueue = request.result || []
        console.log(`Loaded ${this.syncQueue.length} pending sync items`)
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error)
    }
  }

  // Conversation operations
  async saveConversation(conversation: Conversation): Promise<void> {
    if (!this.db) await this.initializeDB()

    try {
      const transaction = this.db!.transaction(['conversations'], 'readwrite')
      const store = transaction.objectStore('conversations')
      await this.promisifyRequest(store.put(conversation))

      // Queue for sync if offline
      if (!this.isOnline) {
        await this.addToSyncQueue({
          id: `conv-${conversation.id}-${Date.now()}`,
          type: 'conversation',
          action: 'update',
          data: conversation,
          timestamp: Date.now(),
          retryCount: 0
        })
      }
    } catch (error) {
      console.error('Failed to save conversation offline:', error)
      throw error
    }
  }

  async getConversation(id: string): Promise<Conversation | null> {
    if (!this.db) await this.initializeDB()

    try {
      const transaction = this.db!.transaction(['conversations'], 'readonly')
      const store = transaction.objectStore('conversations')
      const result = await this.promisifyRequest(store.get(id))
      return result || null
    } catch (error) {
      console.error('Failed to get conversation offline:', error)
      return null
    }
  }

  async getAllConversations(): Promise<Conversation[]> {
    if (!this.db) await this.initializeDB()

    try {
      const transaction = this.db!.transaction(['conversations'], 'readonly')
      const store = transaction.objectStore('conversations')
      const result = await this.promisifyRequest(store.getAll())
      return result || []
    } catch (error) {
      console.error('Failed to get conversations offline:', error)
      return []
    }
  }

  async deleteConversation(id: string): Promise<void> {
    if (!this.db) await this.initializeDB()

    try {
      const transaction = this.db!.transaction(['conversations', 'messages'], 'readwrite')
      const conversationsStore = transaction.objectStore('conversations')
      const messagesStore = transaction.objectStore('messages')

      // Delete conversation
      await this.promisifyRequest(conversationsStore.delete(id))

      // Delete associated messages
      const messagesIndex = messagesStore.index('conversationId')
      const messagesRequest = messagesIndex.getAll(id)
      messagesRequest.onsuccess = () => {
        messagesRequest.result.forEach(message => {
          messagesStore.delete(message.id)
        })
      }

      // Queue for sync if offline
      if (!this.isOnline) {
        await this.addToSyncQueue({
          id: `conv-del-${id}-${Date.now()}`,
          type: 'conversation',
          action: 'delete',
          data: { id },
          timestamp: Date.now(),
          retryCount: 0
        })
      }
    } catch (error) {
      console.error('Failed to delete conversation offline:', error)
      throw error
    }
  }

  // Message operations
  async saveMessage(message: Message): Promise<void> {
    if (!this.db) await this.initializeDB()

    try {
      const transaction = this.db!.transaction(['messages'], 'readwrite')
      const store = transaction.objectStore('messages')
      await this.promisifyRequest(store.put(message))

      // Queue for sync if offline
      if (!this.isOnline) {
        await this.addToSyncQueue({
          id: `msg-${message.id}-${Date.now()}`,
          type: 'message',
          action: 'create',
          data: message,
          timestamp: Date.now(),
          retryCount: 0
        })
      }
    } catch (error) {
      console.error('Failed to save message offline:', error)
      throw error
    }
  }

  async getConversationMessages(conversationId: string): Promise<Message[]> {
    if (!this.db) await this.initializeDB()

    try {
      const transaction = this.db!.transaction(['messages'], 'readonly')
      const store = transaction.objectStore('messages')
      const index = store.index('conversationId')
      const result = await this.promisifyRequest(index.getAll(conversationId))
      return result?.sort((a, b) => a.timestamp - b.timestamp) || []
    } catch (error) {
      console.error('Failed to get messages offline:', error)
      return []
    }
  }

  // Settings operations
  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.initializeDB()

    try {
      const transaction = this.db!.transaction(['settings'], 'readwrite')
      const store = transaction.objectStore('settings')
      await this.promisifyRequest(store.put({ key, value, updatedAt: Date.now() }))

      // Queue for sync if offline
      if (!this.isOnline) {
        await this.addToSyncQueue({
          id: `setting-${key}-${Date.now()}`,
          type: 'settings',
          action: 'update',
          data: { key, value },
          timestamp: Date.now(),
          retryCount: 0
        })
      }
    } catch (error) {
      console.error('Failed to save setting offline:', error)
      throw error
    }
  }

  async getSetting(key: string): Promise<any> {
    if (!this.db) await this.initializeDB()

    try {
      const transaction = this.db!.transaction(['settings'], 'readonly')
      const store = transaction.objectStore('settings')
      const result = await this.promisifyRequest(store.get(key))
      return result?.value || null
    } catch (error) {
      console.error('Failed to get setting offline:', error)
      return null
    }
  }

  // Cache operations
  async cacheApiResponse(key: string, data: any, ttl: number = 3600000): Promise<void> {
    if (!this.db) await this.initializeDB()

    try {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      await this.promisifyRequest(store.put({
        key,
        data,
        cached: Date.now(),
        expiry: Date.now() + ttl
      }))
    } catch (error) {
      console.error('Failed to cache API response:', error)
    }
  }

  async getCachedApiResponse(key: string): Promise<any> {
    if (!this.db) await this.initializeDB()

    try {
      const transaction = this.db!.transaction(['cache'], 'readonly')
      const store = transaction.objectStore('cache')
      const result = await this.promisifyRequest(store.get(key))

      if (result && result.expiry > Date.now()) {
        return result.data
      }

      // Clean up expired cache
      if (result) {
        store.delete(key)
      }

      return null
    } catch (error) {
      console.error('Failed to get cached API response:', error)
      return null
    }
  }

  // Sync queue operations
  private async addToSyncQueue(item: OfflineQueueItem): Promise<void> {
    if (!this.db) await this.initializeDB()

    try {
      this.syncQueue.push(item)
      const transaction = this.db!.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')
      await this.promisifyRequest(store.put(item))
    } catch (error) {
      console.error('Failed to add to sync queue:', error)
    }
  }

  async syncPendingItems(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return
    }

    this.syncInProgress = true
    console.log(`Starting sync of ${this.syncQueue.length} items...`)

    const successItems: string[] = []
    const failedItems: OfflineQueueItem[] = []

    for (const item of this.syncQueue) {
      try {
        await this.syncItem(item)
        successItems.push(item.id)
        console.log(`Synced item: ${item.id}`)
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error)
        item.retryCount++

        if (item.retryCount < 3) {
          failedItems.push(item)
        } else {
          console.error(`Giving up on item ${item.id} after 3 retries`)
        }
      }
    }

    // Remove successful items from queue
    this.syncQueue = failedItems
    await this.updateSyncQueue()

    this.syncInProgress = false
    console.log(`Sync completed. ${successItems.length} succeeded, ${failedItems.length} failed`)
  }

  private async syncItem(item: OfflineQueueItem): Promise<void> {
    // This would integrate with your actual API
    // For now, we'll just simulate the sync

    switch (item.type) {
      case 'conversation':
        if (item.action === 'update') {
          // await api.updateConversation(item.data)
          console.log('Would sync conversation:', item.data.id)
        } else if (item.action === 'delete') {
          // await api.deleteConversation(item.data.id)
          console.log('Would delete conversation:', item.data.id)
        }
        break

      case 'message':
        if (item.action === 'create') {
          // await api.createMessage(item.data)
          console.log('Would sync message:', item.data.id)
        }
        break

      case 'settings':
        if (item.action === 'update') {
          // await api.updateSetting(item.data.key, item.data.value)
          console.log('Would sync setting:', item.data.key)
        }
        break
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  private async updateSyncQueue(): Promise<void> {
    if (!this.db) return

    try {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite')
      const store = transaction.objectStore('syncQueue')

      // Clear existing queue
      await this.promisifyRequest(store.clear())

      // Add remaining items
      for (const item of this.syncQueue) {
        await this.promisifyRequest(store.put(item))
      }
    } catch (error) {
      console.error('Failed to update sync queue:', error)
    }
  }

  // Utility methods
  private promisifyRequest(request: IDBRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Public API
  getSyncStatus(): SyncStatus {
    return {
      isOnline: this.isOnline,
      lastSync: Date.now(), // Would be actual last sync time
      pendingItems: this.syncQueue.length,
      syncInProgress: this.syncInProgress
    }
  }

  async clearCache(): Promise<void> {
    if (!this.db) await this.initializeDB()

    try {
      const transaction = this.db!.transaction(['cache'], 'readwrite')
      const store = transaction.objectStore('cache')
      await this.promisifyRequest(store.clear())
      console.log('Cache cleared')
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  async getStorageUsage(): Promise<any> {
    if (!this.db) await this.initializeDB()

    try {
      const stats = {
        conversations: 0,
        messages: 0,
        settings: 0,
        cache: 0,
        syncQueue: this.syncQueue.length
      }

      const transaction = this.db!.transaction(['conversations', 'messages', 'settings', 'cache'], 'readonly')

      const conversationsCount = await this.promisifyRequest(transaction.objectStore('conversations').count())
      const messagesCount = await this.promisifyRequest(transaction.objectStore('messages').count())
      const settingsCount = await this.promisifyRequest(transaction.objectStore('settings').count())
      const cacheCount = await this.promisifyRequest(transaction.objectStore('cache').count())

      stats.conversations = conversationsCount
      stats.messages = messagesCount
      stats.settings = settingsCount
      stats.cache = cacheCount

      return stats
    } catch (error) {
      console.error('Failed to get storage usage:', error)
      return {}
    }
  }

  async exportData(): Promise<any> {
    if (!this.db) await this.initializeDB()

    try {
      const data = {
        conversations: await this.getAllConversations(),
        syncQueue: this.syncQueue,
        timestamp: Date.now()
      }

      return data
    } catch (error) {
      console.error('Failed to export data:', error)
      throw error
    }
  }
}

export const offlineStorageService = OfflineStorageService.getInstance()
export default offlineStorageService
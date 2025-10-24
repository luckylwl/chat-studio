export interface Bookmark {
  id: string
  type: 'conversation' | 'message'
  conversationId: string
  messageId?: string
  title: string
  description?: string
  tags: string[]
  createdAt: number
  updatedAt: number
  isFavorite: boolean
  color?: string
  note?: string
}

export interface BookmarkCollection {
  id: string
  name: string
  description?: string
  bookmarks: string[] // bookmark IDs
  createdAt: number
  updatedAt: number
  color?: string
  isShared: boolean
}

export interface BookmarkFilter {
  type?: 'conversation' | 'message' | 'all'
  tags?: string[]
  favorites?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  collections?: string[]
}

export class BookmarkService {
  private static instance: BookmarkService
  private bookmarks: Map<string, Bookmark> = new Map()
  private collections: Map<string, BookmarkCollection> = new Map()
  private tags: Set<string> = new Set()

  private constructor() {
    this.loadData()
  }

  public static getInstance(): BookmarkService {
    if (!BookmarkService.instance) {
      BookmarkService.instance = new BookmarkService()
    }
    return BookmarkService.instance
  }

  /**
   * 添加书签
   */
  public async addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = this.generateId()
    const now = Date.now()

    const newBookmark: Bookmark = {
      ...bookmark,
      id,
      createdAt: now,
      updatedAt: now
    }

    this.bookmarks.set(id, newBookmark)

    // 添加标签到标签集合
    bookmark.tags.forEach(tag => this.tags.add(tag))

    this.saveData()
    return id
  }

  /**
   * 删除书签
   */
  public async removeBookmark(bookmarkId: string): Promise<boolean> {
    const bookmark = this.bookmarks.get(bookmarkId)
    if (!bookmark) {
      return false
    }

    this.bookmarks.delete(bookmarkId)

    // 从所有集合中移除该书签
    this.collections.forEach(collection => {
      const index = collection.bookmarks.indexOf(bookmarkId)
      if (index > -1) {
        collection.bookmarks.splice(index, 1)
        collection.updatedAt = Date.now()
      }
    })

    this.saveData()
    return true
  }

  /**
   * 更新书签
   */
  public async updateBookmark(bookmarkId: string, updates: Partial<Omit<Bookmark, 'id' | 'createdAt'>>): Promise<boolean> {
    const bookmark = this.bookmarks.get(bookmarkId)
    if (!bookmark) {
      return false
    }

    const updatedBookmark: Bookmark = {
      ...bookmark,
      ...updates,
      updatedAt: Date.now()
    }

    this.bookmarks.set(bookmarkId, updatedBookmark)

    // 更新标签集合
    if (updates.tags) {
      updates.tags.forEach(tag => this.tags.add(tag))
    }

    this.saveData()
    return true
  }

  /**
   * 获取书签
   */
  public getBookmark(bookmarkId: string): Bookmark | undefined {
    return this.bookmarks.get(bookmarkId)
  }

  /**
   * 获取所有书签
   */
  public getAllBookmarks(): Bookmark[] {
    return Array.from(this.bookmarks.values())
  }

  /**
   * 根据过滤条件获取书签
   */
  public getFilteredBookmarks(filter: BookmarkFilter): Bookmark[] {
    let bookmarks = Array.from(this.bookmarks.values())

    // 类型过滤
    if (filter.type && filter.type !== 'all') {
      bookmarks = bookmarks.filter(bookmark => bookmark.type === filter.type)
    }

    // 标签过滤
    if (filter.tags && filter.tags.length > 0) {
      bookmarks = bookmarks.filter(bookmark =>
        filter.tags!.some(tag => bookmark.tags.includes(tag))
      )
    }

    // 收藏过滤
    if (filter.favorites !== undefined) {
      bookmarks = bookmarks.filter(bookmark => bookmark.isFavorite === filter.favorites)
    }

    // 日期范围过滤
    if (filter.dateRange) {
      const startTime = filter.dateRange.start.getTime()
      const endTime = filter.dateRange.end.getTime()
      bookmarks = bookmarks.filter(bookmark =>
        bookmark.createdAt >= startTime && bookmark.createdAt <= endTime
      )
    }

    // 集合过滤
    if (filter.collections && filter.collections.length > 0) {
      const collectionBookmarkIds = new Set<string>()
      filter.collections.forEach(collectionId => {
        const collection = this.collections.get(collectionId)
        if (collection) {
          collection.bookmarks.forEach(bookmarkId => collectionBookmarkIds.add(bookmarkId))
        }
      })
      bookmarks = bookmarks.filter(bookmark => collectionBookmarkIds.has(bookmark.id))
    }

    return bookmarks.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /**
   * 搜索书签
   */
  public searchBookmarks(query: string): Bookmark[] {
    if (!query.trim()) {
      return this.getAllBookmarks()
    }

    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0)

    return Array.from(this.bookmarks.values()).filter(bookmark => {
      const searchText = [
        bookmark.title,
        bookmark.description || '',
        bookmark.note || '',
        ...bookmark.tags
      ].join(' ').toLowerCase()

      return searchTerms.every(term => searchText.includes(term))
    }).sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /**
   * 检查是否已收藏
   */
  public isBookmarked(conversationId: string, messageId?: string): boolean {
    return Array.from(this.bookmarks.values()).some(bookmark =>
      bookmark.conversationId === conversationId &&
      (messageId ? bookmark.messageId === messageId : bookmark.type === 'conversation')
    )
  }

  /**
   * 获取对话的书签
   */
  public getConversationBookmarks(conversationId: string): Bookmark[] {
    return Array.from(this.bookmarks.values())
      .filter(bookmark => bookmark.conversationId === conversationId)
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * 切换收藏状态
   */
  public async toggleFavorite(bookmarkId: string): Promise<boolean> {
    const bookmark = this.bookmarks.get(bookmarkId)
    if (!bookmark) {
      return false
    }

    bookmark.isFavorite = !bookmark.isFavorite
    bookmark.updatedAt = Date.now()

    this.saveData()
    return true
  }

  /**
   * 获取所有标签
   */
  public getAllTags(): string[] {
    return Array.from(this.tags).sort()
  }

  /**
   * 获取热门标签
   */
  public getPopularTags(limit: number = 10): Array<{ tag: string; count: number }> {
    const tagCounts = new Map<string, number>()

    this.bookmarks.forEach(bookmark => {
      bookmark.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })
    })

    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  // 集合相关方法

  /**
   * 创建书签集合
   */
  public async createCollection(collection: Omit<BookmarkCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = this.generateId()
    const now = Date.now()

    const newCollection: BookmarkCollection = {
      ...collection,
      id,
      createdAt: now,
      updatedAt: now
    }

    this.collections.set(id, newCollection)
    this.saveData()
    return id
  }

  /**
   * 删除集合
   */
  public async removeCollection(collectionId: string): Promise<boolean> {
    const deleted = this.collections.delete(collectionId)
    if (deleted) {
      this.saveData()
    }
    return deleted
  }

  /**
   * 更新集合
   */
  public async updateCollection(collectionId: string, updates: Partial<Omit<BookmarkCollection, 'id' | 'createdAt'>>): Promise<boolean> {
    const collection = this.collections.get(collectionId)
    if (!collection) {
      return false
    }

    const updatedCollection: BookmarkCollection = {
      ...collection,
      ...updates,
      updatedAt: Date.now()
    }

    this.collections.set(collectionId, updatedCollection)
    this.saveData()
    return true
  }

  /**
   * 获取所有集合
   */
  public getAllCollections(): BookmarkCollection[] {
    return Array.from(this.collections.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /**
   * 获取集合
   */
  public getCollection(collectionId: string): BookmarkCollection | undefined {
    return this.collections.get(collectionId)
  }

  /**
   * 添加书签到集合
   */
  public async addBookmarkToCollection(collectionId: string, bookmarkId: string): Promise<boolean> {
    const collection = this.collections.get(collectionId)
    const bookmark = this.bookmarks.get(bookmarkId)

    if (!collection || !bookmark) {
      return false
    }

    if (!collection.bookmarks.includes(bookmarkId)) {
      collection.bookmarks.push(bookmarkId)
      collection.updatedAt = Date.now()
      this.saveData()
    }

    return true
  }

  /**
   * 从集合中移除书签
   */
  public async removeBookmarkFromCollection(collectionId: string, bookmarkId: string): Promise<boolean> {
    const collection = this.collections.get(collectionId)
    if (!collection) {
      return false
    }

    const index = collection.bookmarks.indexOf(bookmarkId)
    if (index > -1) {
      collection.bookmarks.splice(index, 1)
      collection.updatedAt = Date.now()
      this.saveData()
      return true
    }

    return false
  }

  /**
   * 获取集合中的书签
   */
  public getCollectionBookmarks(collectionId: string): Bookmark[] {
    const collection = this.collections.get(collectionId)
    if (!collection) {
      return []
    }

    return collection.bookmarks
      .map(bookmarkId => this.bookmarks.get(bookmarkId))
      .filter((bookmark): bookmark is Bookmark => bookmark !== undefined)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /**
   * 导出书签
   */
  public exportBookmarks(format: 'json' | 'csv' = 'json'): string {
    const bookmarks = this.getAllBookmarks()
    const collections = this.getAllCollections()

    if (format === 'json') {
      return JSON.stringify({
        bookmarks,
        collections,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }, null, 2)
    } else {
      // CSV格式
      const csvHeader = 'ID,Type,Title,Description,Tags,Created,Updated,Favorite,ConversationId,MessageId,Note\n'
      const csvRows = bookmarks.map(bookmark => [
        bookmark.id,
        bookmark.type,
        `"${bookmark.title.replace(/"/g, '""')}"`,
        `"${(bookmark.description || '').replace(/"/g, '""')}"`,
        `"${bookmark.tags.join(', ')}"`,
        new Date(bookmark.createdAt).toISOString(),
        new Date(bookmark.updatedAt).toISOString(),
        bookmark.isFavorite,
        bookmark.conversationId,
        bookmark.messageId || '',
        `"${(bookmark.note || '').replace(/"/g, '""')}"`
      ].join(','))

      return csvHeader + csvRows.join('\n')
    }
  }

  /**
   * 导入书签
   */
  public async importBookmarks(data: string, format: 'json' | 'csv' = 'json'): Promise<{
    imported: number
    skipped: number
    errors: string[]
  }> {
    const result = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    }

    try {
      if (format === 'json') {
        const parsed = JSON.parse(data)

        if (parsed.bookmarks && Array.isArray(parsed.bookmarks)) {
          for (const bookmark of parsed.bookmarks) {
            try {
              // 检查是否已存在
              const exists = this.isBookmarked(bookmark.conversationId, bookmark.messageId)
              if (exists) {
                result.skipped++
                continue
              }

              await this.addBookmark({
                type: bookmark.type,
                conversationId: bookmark.conversationId,
                messageId: bookmark.messageId,
                title: bookmark.title,
                description: bookmark.description,
                tags: bookmark.tags || [],
                isFavorite: bookmark.isFavorite || false,
                color: bookmark.color,
                note: bookmark.note
              })
              result.imported++
            } catch (error) {
              result.errors.push(`导入书签 ${bookmark.title} 失败: ${error}`)
            }
          }
        }

        if (parsed.collections && Array.isArray(parsed.collections)) {
          for (const collection of parsed.collections) {
            try {
              await this.createCollection({
                name: collection.name,
                description: collection.description,
                bookmarks: [], // 先创建空集合，稍后添加书签
                color: collection.color,
                isShared: collection.isShared || false
              })
            } catch (error) {
              result.errors.push(`导入集合 ${collection.name} 失败: ${error}`)
            }
          }
        }
      }
    } catch (error) {
      result.errors.push(`解析导入数据失败: ${error}`)
    }

    return result
  }

  private generateId(): string {
    return `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private loadData(): void {
    try {
      const bookmarksData = localStorage.getItem('ai-chat-studio-bookmarks')
      if (bookmarksData) {
        const parsed = JSON.parse(bookmarksData)

        // 加载书签
        if (parsed.bookmarks) {
          this.bookmarks = new Map(Object.entries(parsed.bookmarks))
        }

        // 加载集合
        if (parsed.collections) {
          this.collections = new Map(Object.entries(parsed.collections))
        }

        // 重建标签集合
        this.bookmarks.forEach(bookmark => {
          bookmark.tags.forEach(tag => this.tags.add(tag))
        })
      }
    } catch (error) {
      console.error('Load bookmarks error:', error)
    }
  }

  private saveData(): void {
    try {
      const data = {
        bookmarks: Object.fromEntries(this.bookmarks),
        collections: Object.fromEntries(this.collections),
        savedAt: Date.now()
      }
      localStorage.setItem('ai-chat-studio-bookmarks', JSON.stringify(data))
    } catch (error) {
      console.error('Save bookmarks error:', error)
    }
  }
}
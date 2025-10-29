/**
 * AI Chat Studio v4.0 - Collaboration Services
 *
 * This file contains collaboration and social features:
 * - Community Forum Service
 * - Collaborative Whiteboard Service
 * - Team Calendar Service
 * - Knowledge Wiki Service
 * - Share Cards Service
 */

import localforage from 'localforage'
import type {
  ForumPost,
  ForumThread,
  ForumCategory,
  ForumComment,
  WhiteboardCanvas,
  WhiteboardElement,
  WhiteboardSession,
  CalendarEvent,
  CalendarReminder,
  WikiPage,
  WikiRevision,
  WikiLink,
  ShareCard,
  SharePermission
} from '../types/v4-types'

// ===================================
// COMMUNITY FORUM SERVICE
// ===================================

class CommunityForumService {
  private readonly CATEGORIES_KEY = 'forum_categories'
  private readonly THREADS_KEY = 'forum_threads'
  private readonly POSTS_KEY = 'forum_posts'
  private readonly COMMENTS_KEY = 'forum_comments'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'forum'
  })

  // Category Management
  async createCategory(
    name: string,
    description: string,
    parentId?: string
  ): Promise<ForumCategory> {
    const category: ForumCategory = {
      id: `cat_${Date.now()}`,
      name,
      description,
      parentId,
      threadCount: 0,
      postCount: 0,
      order: 0,
      icon: '📁',
      moderators: [],
      createdAt: Date.now()
    }

    const categories = await this.getAllCategories()
    categories.push(category)
    await this.store.setItem(this.CATEGORIES_KEY, categories)

    return category
  }

  async getAllCategories(): Promise<ForumCategory[]> {
    return await this.store.getItem<ForumCategory[]>(this.CATEGORIES_KEY) || []
  }

  async getCategory(categoryId: string): Promise<ForumCategory | null> {
    const categories = await this.getAllCategories()
    return categories.find(c => c.id === categoryId) || null
  }

  // Thread Management
  async createThread(
    categoryId: string,
    title: string,
    content: string,
    userId: string,
    tags: string[] = []
  ): Promise<ForumThread> {
    const thread: ForumThread = {
      id: `thread_${Date.now()}`,
      categoryId,
      title,
      authorId: userId,
      postCount: 0,
      viewCount: 0,
      tags,
      isPinned: false,
      isLocked: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastActivityAt: Date.now()
    }

    const threads = await this.getAllThreads()
    threads.push(thread)
    await this.store.setItem(this.THREADS_KEY, threads)

    // Create initial post
    await this.createPost(thread.id, content, userId)

    // Update category counts
    const category = await this.getCategory(categoryId)
    if (category) {
      category.threadCount++
      await this.updateCategory(category)
    }

    return thread
  }

  async getAllThreads(categoryId?: string): Promise<ForumThread[]> {
    const threads = await this.store.getItem<ForumThread[]>(this.THREADS_KEY) || []

    if (categoryId) {
      return threads.filter(t => t.categoryId === categoryId)
    }

    return threads
  }

  async getThread(threadId: string): Promise<ForumThread | null> {
    const threads = await this.getAllThreads()
    return threads.find(t => t.id === threadId) || null
  }

  async incrementThreadViews(threadId: string): Promise<void> {
    const threads = await this.getAllThreads()
    const thread = threads.find(t => t.id === threadId)

    if (thread) {
      thread.viewCount++
      await this.store.setItem(this.THREADS_KEY, threads)
    }
  }

  // Post Management
  async createPost(
    threadId: string,
    content: string,
    userId: string
  ): Promise<ForumPost> {
    const post: ForumPost = {
      id: `post_${Date.now()}`,
      threadId,
      authorId: userId,
      content,
      upvotes: 0,
      downvotes: 0,
      isAccepted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      editHistory: []
    }

    const posts = await this.getAllPosts()
    posts.push(post)
    await this.store.setItem(this.POSTS_KEY, posts)

    // Update thread counts
    const thread = await this.getThread(threadId)
    if (thread) {
      thread.postCount++
      thread.lastActivityAt = Date.now()
      await this.updateThread(thread)
    }

    return post
  }

  async getAllPosts(threadId?: string): Promise<ForumPost[]> {
    const posts = await this.store.getItem<ForumPost[]>(this.POSTS_KEY) || []

    if (threadId) {
      return posts.filter(p => p.threadId === threadId)
    }

    return posts
  }

  async votePost(postId: string, userId: string, voteType: 'up' | 'down'): Promise<void> {
    const posts = await this.getAllPosts()
    const post = posts.find(p => p.id === postId)

    if (post) {
      if (voteType === 'up') {
        post.upvotes++
      } else {
        post.downvotes++
      }
      await this.store.setItem(this.POSTS_KEY, posts)
    }
  }

  // Comment Management
  async createComment(
    postId: string,
    content: string,
    userId: string
  ): Promise<ForumComment> {
    const comment: ForumComment = {
      id: `comment_${Date.now()}`,
      postId,
      authorId: userId,
      content,
      createdAt: Date.now()
    }

    const comments = await this.getAllComments()
    comments.push(comment)
    await this.store.setItem(this.COMMENTS_KEY, comments)

    return comment
  }

  async getAllComments(postId?: string): Promise<ForumComment[]> {
    const comments = await this.store.getItem<ForumComment[]>(this.COMMENTS_KEY) || []

    if (postId) {
      return comments.filter(c => c.postId === postId)
    }

    return comments
  }

  // Helper Methods
  private async updateCategory(category: ForumCategory): Promise<void> {
    const categories = await this.getAllCategories()
    const index = categories.findIndex(c => c.id === category.id)

    if (index >= 0) {
      categories[index] = category
      await this.store.setItem(this.CATEGORIES_KEY, categories)
    }
  }

  private async updateThread(thread: ForumThread): Promise<void> {
    const threads = await this.getAllThreads()
    const index = threads.findIndex(t => t.id === thread.id)

    if (index >= 0) {
      threads[index] = thread
      await this.store.setItem(this.THREADS_KEY, threads)
    }
  }
}

// ===================================
// COLLABORATIVE WHITEBOARD SERVICE
// ===================================

class CollaborativeWhiteboardService {
  private readonly CANVASES_KEY = 'whiteboard_canvases'
  private readonly SESSIONS_KEY = 'whiteboard_sessions'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'whiteboard'
  })

  // Canvas Management
  async createCanvas(
    name: string,
    ownerId: string,
    width: number = 1920,
    height: number = 1080
  ): Promise<WhiteboardCanvas> {
    const canvas: WhiteboardCanvas = {
      id: `canvas_${Date.now()}`,
      name,
      ownerId,
      width,
      height,
      elements: [],
      background: '#ffffff',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      collaborators: [],
      settings: {
        gridEnabled: true,
        snapToGrid: true,
        gridSize: 20,
        allowDrawing: true,
        allowShapes: true,
        allowText: true
      }
    }

    const canvases = await this.getAllCanvases()
    canvases.push(canvas)
    await this.store.setItem(this.CANVASES_KEY, canvases)

    return canvas
  }

  async getCanvas(canvasId: string): Promise<WhiteboardCanvas | null> {
    const canvases = await this.getAllCanvases()
    return canvases.find(c => c.id === canvasId) || null
  }

  async getAllCanvases(userId?: string): Promise<WhiteboardCanvas[]> {
    const canvases = await this.store.getItem<WhiteboardCanvas[]>(this.CANVASES_KEY) || []

    if (userId) {
      return canvases.filter(c => c.ownerId === userId || c.collaborators.some(col => col.userId === userId))
    }

    return canvases
  }

  // Element Management
  async addElement(
    canvasId: string,
    element: Omit<WhiteboardElement, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WhiteboardElement> {
    const canvas = await this.getCanvas(canvasId)

    if (!canvas) {
      throw new Error('Canvas not found')
    }

    const newElement: WhiteboardElement = {
      ...element,
      id: `element_${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    canvas.elements.push(newElement)
    canvas.updatedAt = Date.now()
    canvas.version++

    await this.updateCanvas(canvas)

    return newElement
  }

  async updateElement(
    canvasId: string,
    elementId: string,
    updates: Partial<WhiteboardElement>
  ): Promise<void> {
    const canvas = await this.getCanvas(canvasId)

    if (!canvas) {
      throw new Error('Canvas not found')
    }

    const element = canvas.elements.find(e => e.id === elementId)

    if (element) {
      Object.assign(element, updates, { updatedAt: Date.now() })
      canvas.updatedAt = Date.now()
      canvas.version++
      await this.updateCanvas(canvas)
    }
  }

  async deleteElement(canvasId: string, elementId: string): Promise<void> {
    const canvas = await this.getCanvas(canvasId)

    if (!canvas) {
      throw new Error('Canvas not found')
    }

    canvas.elements = canvas.elements.filter(e => e.id !== elementId)
    canvas.updatedAt = Date.now()
    canvas.version++

    await this.updateCanvas(canvas)
  }

  // Session Management
  async startSession(
    canvasId: string,
    userId: string
  ): Promise<WhiteboardSession> {
    const session: WhiteboardSession = {
      id: `session_${Date.now()}`,
      canvasId,
      participants: [{
        userId,
        color: this.generateUserColor(),
        cursor: { x: 0, y: 0 },
        selectedElement: null,
        joinedAt: Date.now()
      }],
      startedAt: Date.now(),
      active: true
    }

    const sessions = await this.getAllSessions()
    sessions.push(session)
    await this.store.setItem(this.SESSIONS_KEY, sessions)

    return session
  }

  async joinSession(sessionId: string, userId: string): Promise<void> {
    const sessions = await this.getAllSessions()
    const session = sessions.find(s => s.id === sessionId)

    if (session && !session.participants.some(p => p.userId === userId)) {
      session.participants.push({
        userId,
        color: this.generateUserColor(),
        cursor: { x: 0, y: 0 },
        selectedElement: null,
        joinedAt: Date.now()
      })

      await this.store.setItem(this.SESSIONS_KEY, sessions)
    }
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const sessions = await this.getAllSessions()
    const session = sessions.find(s => s.id === sessionId)

    if (session) {
      session.participants = session.participants.filter(p => p.userId !== userId)

      if (session.participants.length === 0) {
        session.active = false
        session.endedAt = Date.now()
      }

      await this.store.setItem(this.SESSIONS_KEY, sessions)
    }
  }

  async getAllSessions(canvasId?: string): Promise<WhiteboardSession[]> {
    const sessions = await this.store.getItem<WhiteboardSession[]>(this.SESSIONS_KEY) || []

    if (canvasId) {
      return sessions.filter(s => s.canvasId === canvasId)
    }

    return sessions
  }

  // Helper Methods
  private async updateCanvas(canvas: WhiteboardCanvas): Promise<void> {
    const canvases = await this.getAllCanvases()
    const index = canvases.findIndex(c => c.id === canvas.id)

    if (index >= 0) {
      canvases[index] = canvas
      await this.store.setItem(this.CANVASES_KEY, canvases)
    }
  }

  private generateUserColor(): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F']
    return colors[Math.floor(Math.random() * colors.length)]
  }
}

// ===================================
// TEAM CALENDAR SERVICE
// ===================================

class TeamCalendarService {
  private readonly EVENTS_KEY = 'calendar_events'
  private readonly REMINDERS_KEY = 'calendar_reminders'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'calendar'
  })

  // Event Management
  async createEvent(
    title: string,
    description: string,
    startTime: number,
    endTime: number,
    userId: string,
    attendees: string[] = []
  ): Promise<CalendarEvent> {
    const event: CalendarEvent = {
      id: `event_${Date.now()}`,
      title,
      description,
      startTime,
      endTime,
      location: '',
      attendees: attendees.map(id => ({
        userId: id,
        status: 'pending',
        responseTime: null
      })),
      organizerId: userId,
      type: 'meeting',
      recurring: null,
      reminders: [],
      color: '#3B82F6',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const events = await this.getAllEvents()
    events.push(event)
    await this.store.setItem(this.EVENTS_KEY, events)

    return event
  }

  async getAllEvents(userId?: string, startDate?: number, endDate?: number): Promise<CalendarEvent[]> {
    let events = await this.store.getItem<CalendarEvent[]>(this.EVENTS_KEY) || []

    if (userId) {
      events = events.filter(e =>
        e.organizerId === userId ||
        e.attendees.some(a => a.userId === userId)
      )
    }

    if (startDate && endDate) {
      events = events.filter(e =>
        (e.startTime >= startDate && e.startTime <= endDate) ||
        (e.endTime >= startDate && e.endTime <= endDate)
      )
    }

    return events
  }

  async getEvent(eventId: string): Promise<CalendarEvent | null> {
    const events = await this.getAllEvents()
    return events.find(e => e.id === eventId) || null
  }

  async updateEvent(
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEvent | null> {
    const events = await this.getAllEvents()
    const event = events.find(e => e.id === eventId)

    if (event) {
      Object.assign(event, updates, { updatedAt: Date.now() })
      await this.store.setItem(this.EVENTS_KEY, events)
      return event
    }

    return null
  }

  async deleteEvent(eventId: string): Promise<void> {
    const events = await this.getAllEvents()
    const filtered = events.filter(e => e.id !== eventId)
    await this.store.setItem(this.EVENTS_KEY, filtered)
  }

  // RSVP Management
  async respondToEvent(
    eventId: string,
    userId: string,
    status: 'accepted' | 'declined' | 'tentative'
  ): Promise<void> {
    const events = await this.getAllEvents()
    const event = events.find(e => e.id === eventId)

    if (event) {
      const attendee = event.attendees.find(a => a.userId === userId)

      if (attendee) {
        attendee.status = status
        attendee.responseTime = Date.now()
        await this.store.setItem(this.EVENTS_KEY, events)
      }
    }
  }

  // Reminder Management
  async createReminder(
    eventId: string,
    minutesBefore: number,
    method: 'notification' | 'email'
  ): Promise<CalendarReminder> {
    const reminder: CalendarReminder = {
      id: `reminder_${Date.now()}`,
      eventId,
      minutesBefore,
      method,
      sent: false,
      createdAt: Date.now()
    }

    const reminders = await this.getAllReminders()
    reminders.push(reminder)
    await this.store.setItem(this.REMINDERS_KEY, reminders)

    return reminder
  }

  async getAllReminders(eventId?: string): Promise<CalendarReminder[]> {
    const reminders = await this.store.getItem<CalendarReminder[]>(this.REMINDERS_KEY) || []

    if (eventId) {
      return reminders.filter(r => r.eventId === eventId)
    }

    return reminders
  }
}

// ===================================
// KNOWLEDGE WIKI SERVICE
// ===================================

class KnowledgeWikiService {
  private readonly PAGES_KEY = 'wiki_pages'
  private readonly REVISIONS_KEY = 'wiki_revisions'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'wiki'
  })

  // Page Management
  async createPage(
    title: string,
    content: string,
    authorId: string,
    tags: string[] = []
  ): Promise<WikiPage> {
    const page: WikiPage = {
      id: `page_${Date.now()}`,
      title,
      slug: this.generateSlug(title),
      content,
      authorId,
      tags,
      category: '',
      viewCount: 0,
      revisionCount: 1,
      contributors: [authorId],
      links: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      publishedAt: Date.now()
    }

    const pages = await this.getAllPages()
    pages.push(page)
    await this.store.setItem(this.PAGES_KEY, pages)

    // Create initial revision
    await this.createRevision(page.id, content, authorId, 'Initial version')

    return page
  }

  async getPage(pageId: string): Promise<WikiPage | null> {
    const pages = await this.getAllPages()
    return pages.find(p => p.id === pageId) || null
  }

  async getPageBySlug(slug: string): Promise<WikiPage | null> {
    const pages = await this.getAllPages()
    return pages.find(p => p.slug === slug) || null
  }

  async getAllPages(category?: string, tag?: string): Promise<WikiPage[]> {
    let pages = await this.store.getItem<WikiPage[]>(this.PAGES_KEY) || []

    if (category) {
      pages = pages.filter(p => p.category === category)
    }

    if (tag) {
      pages = pages.filter(p => p.tags.includes(tag))
    }

    return pages
  }

  async updatePage(
    pageId: string,
    content: string,
    authorId: string,
    changeMessage: string
  ): Promise<WikiPage | null> {
    const pages = await this.getAllPages()
    const page = pages.find(p => p.id === pageId)

    if (page) {
      page.content = content
      page.updatedAt = Date.now()
      page.revisionCount++

      if (!page.contributors.includes(authorId)) {
        page.contributors.push(authorId)
      }

      await this.store.setItem(this.PAGES_KEY, pages)

      // Create revision
      await this.createRevision(pageId, content, authorId, changeMessage)

      return page
    }

    return null
  }

  async deletePage(pageId: string): Promise<void> {
    const pages = await this.getAllPages()
    const filtered = pages.filter(p => p.id !== pageId)
    await this.store.setItem(this.PAGES_KEY, filtered)
  }

  async incrementPageViews(pageId: string): Promise<void> {
    const pages = await this.getAllPages()
    const page = pages.find(p => p.id === pageId)

    if (page) {
      page.viewCount++
      await this.store.setItem(this.PAGES_KEY, pages)
    }
  }

  // Revision Management
  async createRevision(
    pageId: string,
    content: string,
    authorId: string,
    changeMessage: string
  ): Promise<WikiRevision> {
    const revision: WikiRevision = {
      id: `rev_${Date.now()}`,
      pageId,
      content,
      authorId,
      changeMessage,
      timestamp: Date.now(),
      version: await this.getNextVersion(pageId)
    }

    const revisions = await this.getAllRevisions()
    revisions.push(revision)
    await this.store.setItem(this.REVISIONS_KEY, revisions)

    return revision
  }

  async getAllRevisions(pageId?: string): Promise<WikiRevision[]> {
    const revisions = await this.store.getItem<WikiRevision[]>(this.REVISIONS_KEY) || []

    if (pageId) {
      return revisions.filter(r => r.pageId === pageId).sort((a, b) => b.version - a.version)
    }

    return revisions
  }

  async getRevision(revisionId: string): Promise<WikiRevision | null> {
    const revisions = await this.getAllRevisions()
    return revisions.find(r => r.id === revisionId) || null
  }

  // Search
  async searchPages(query: string): Promise<WikiPage[]> {
    const pages = await this.getAllPages()
    const lowerQuery = query.toLowerCase()

    return pages.filter(p =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.content.toLowerCase().includes(lowerQuery) ||
      p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  // Helper Methods
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  private async getNextVersion(pageId: string): Promise<number> {
    const revisions = await this.getAllRevisions(pageId)
    return revisions.length + 1
  }
}

// ===================================
// SHARE CARDS SERVICE
// ===================================

class ShareCardsService {
  private readonly CARDS_KEY = 'share_cards'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'share_cards'
  })

  // Card Management
  async createShareCard(
    resourceType: string,
    resourceId: string,
    userId: string,
    permissions: SharePermission[] = ['view']
  ): Promise<ShareCard> {
    const card: ShareCard = {
      id: `card_${Date.now()}`,
      resourceType,
      resourceId,
      ownerId: userId,
      shareUrl: this.generateShareUrl(),
      permissions,
      expiresAt: null,
      viewCount: 0,
      maxViews: null,
      requiresPassword: false,
      password: null,
      createdAt: Date.now(),
      metadata: {}
    }

    const cards = await this.getAllCards()
    cards.push(card)
    await this.store.setItem(this.CARDS_KEY, cards)

    return card
  }

  async getCard(cardId: string): Promise<ShareCard | null> {
    const cards = await this.getAllCards()
    return cards.find(c => c.id === cardId) || null
  }

  async getCardByUrl(shareUrl: string): Promise<ShareCard | null> {
    const cards = await this.getAllCards()
    return cards.find(c => c.shareUrl === shareUrl) || null
  }

  async getAllCards(userId?: string): Promise<ShareCard[]> {
    const cards = await this.store.getItem<ShareCard[]>(this.CARDS_KEY) || []

    if (userId) {
      return cards.filter(c => c.ownerId === userId)
    }

    return cards
  }

  async updateCard(
    cardId: string,
    updates: Partial<ShareCard>
  ): Promise<ShareCard | null> {
    const cards = await this.getAllCards()
    const card = cards.find(c => c.id === cardId)

    if (card) {
      Object.assign(card, updates)
      await this.store.setItem(this.CARDS_KEY, cards)
      return card
    }

    return null
  }

  async deleteCard(cardId: string): Promise<void> {
    const cards = await this.getAllCards()
    const filtered = cards.filter(c => c.id !== cardId)
    await this.store.setItem(this.CARDS_KEY, filtered)
  }

  async incrementViewCount(cardId: string): Promise<void> {
    const cards = await this.getAllCards()
    const card = cards.find(c => c.id === cardId)

    if (card) {
      card.viewCount++
      await this.store.setItem(this.CARDS_KEY, cards)
    }
  }

  async validateAccess(cardId: string, password?: string): Promise<boolean> {
    const card = await this.getCard(cardId)

    if (!card) {
      return false
    }

    // Check expiration
    if (card.expiresAt && card.expiresAt < Date.now()) {
      return false
    }

    // Check max views
    if (card.maxViews && card.viewCount >= card.maxViews) {
      return false
    }

    // Check password
    if (card.requiresPassword && card.password !== password) {
      return false
    }

    return true
  }

  // Helper Methods
  private generateShareUrl(): string {
    return `https://chatstudio.com/share/${Math.random().toString(36).substring(2, 12)}`
  }
}

// ===================================
// EXPORTS
// ===================================

export const communityForumService = new CommunityForumService()
export const collaborativeWhiteboardService = new CollaborativeWhiteboardService()
export const teamCalendarService = new TeamCalendarService()
export const knowledgeWikiService = new KnowledgeWikiService()
export const shareCardsService = new ShareCardsService()

export default {
  communityForum: communityForumService,
  collaborativeWhiteboard: collaborativeWhiteboardService,
  teamCalendar: teamCalendarService,
  knowledgeWiki: knowledgeWikiService,
  shareCards: shareCardsService
}

/**
 * Conversation Sharing Service
 * Handles conversation sharing, permissions, and collaborative features
 */

import localforage from 'localforage'
import { authService } from './authService'

export interface SharedConversation {
  id: string
  conversationId: string
  conversationTitle: string
  shareUrl: string
  sharedBy: string
  sharedByName: string
  permissions: SharePermissions
  sharedWith: SharedUser[]
  isPublic: boolean
  expiresAt?: number
  createdAt: number
  accessCount: number
  lastAccessedAt?: number
}

export interface SharePermissions {
  canView: boolean
  canComment: boolean
  canEdit: boolean
  canShare: boolean
  canDelete: boolean
}

export interface SharedUser {
  userId?: string
  email: string
  displayName?: string
  permissions: SharePermissions
  addedAt: number
}

export interface ConversationComment {
  id: string
  conversationId: string
  messageId?: string // Optional: link to specific message
  userId: string
  userDisplayName: string
  userAvatar?: string
  content: string
  parentCommentId?: string // For threaded comments
  reactions: CommentReaction[]
  createdAt: number
  updatedAt?: number
  isEdited: boolean
  isDeleted: boolean
}

export interface CommentReaction {
  userId: string
  emoji: string
  createdAt: number
}

export interface ShareLink {
  id: string
  url: string
  token: string
  conversationId: string
  createdBy: string
  permissions: SharePermissions
  expiresAt?: number
  createdAt: number
  accessCount: number
}

export class SharingService {
  private store: LocalForage
  private sharedConversations: Map<string, SharedConversation> = new Map()
  private comments: Map<string, ConversationComment[]> = new Map()
  private shareLinks: Map<string, ShareLink> = new Map()

  constructor() {
    this.store = localforage.createInstance({
      name: 'sharing-db',
      storeName: 'shares'
    })
  }

  /**
   * Initialize sharing service
   */
  async initialize(): Promise<void> {
    try {
      const sharedList = await this.store.getItem<SharedConversation[]>('shared-conversations')
      if (sharedList) {
        sharedList.forEach(shared => this.sharedConversations.set(shared.id, shared))
      }

      const commentsList = await this.store.getItem<Record<string, ConversationComment[]>>('comments')
      if (commentsList) {
        Object.entries(commentsList).forEach(([convId, comments]) => {
          this.comments.set(convId, comments)
        })
      }

      const linksList = await this.store.getItem<ShareLink[]>('share-links')
      if (linksList) {
        linksList.forEach(link => this.shareLinks.set(link.id, link))
      }
    } catch (error) {
      console.error('Sharing service initialization error:', error)
    }
  }

  /**
   * Share conversation with specific users
   */
  async shareConversation(
    conversationId: string,
    conversationTitle: string,
    sharedWith: { email: string; permissions: SharePermissions }[],
    options: {
      isPublic?: boolean
      expiresIn?: number // milliseconds
    } = {}
  ): Promise<SharedConversation> {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const id = `share-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const shareUrl = this.generateShareUrl(id)
    const now = Date.now()

    const sharedConversation: SharedConversation = {
      id,
      conversationId,
      conversationTitle,
      shareUrl,
      sharedBy: user.id,
      sharedByName: user.displayName,
      permissions: {
        canView: true,
        canComment: true,
        canEdit: false,
        canShare: false,
        canDelete: false
      },
      sharedWith: sharedWith.map(sw => ({
        email: sw.email,
        permissions: sw.permissions,
        addedAt: now
      })),
      isPublic: options.isPublic || false,
      expiresAt: options.expiresIn ? now + options.expiresIn : undefined,
      createdAt: now,
      accessCount: 0
    }

    this.sharedConversations.set(id, sharedConversation)
    await this.saveSharedConversations()

    // In production, send email notifications
    sharedWith.forEach(sw => {
      console.log(`Share notification sent to ${sw.email}`)
    })

    return sharedConversation
  }

  /**
   * Create a public share link
   */
  async createShareLink(
    conversationId: string,
    permissions: SharePermissions,
    options: {
      expiresIn?: number // milliseconds
    } = {}
  ): Promise<ShareLink> {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const id = `link-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const token = this.generateToken()
    const url = this.generateShareUrl(token)
    const now = Date.now()

    const shareLink: ShareLink = {
      id,
      url,
      token,
      conversationId,
      createdBy: user.id,
      permissions,
      expiresAt: options.expiresIn ? now + options.expiresIn : undefined,
      createdAt: now,
      accessCount: 0
    }

    this.shareLinks.set(id, shareLink)
    await this.saveShareLinks()

    return shareLink
  }

  /**
   * Get shared conversation by ID
   */
  getSharedConversation(shareId: string): SharedConversation | undefined {
    const shared = this.sharedConversations.get(shareId)
    if (!shared) return undefined

    // Check if expired
    if (shared.expiresAt && Date.now() > shared.expiresAt) {
      return undefined
    }

    return shared
  }

  /**
   * Get share link by token
   */
  getShareLinkByToken(token: string): ShareLink | undefined {
    const link = Array.from(this.shareLinks.values()).find(l => l.token === token)
    if (!link) return undefined

    // Check if expired
    if (link.expiresAt && Date.now() > link.expiresAt) {
      return undefined
    }

    return link
  }

  /**
   * List all shares for current user
   */
  listMyShares(): SharedConversation[] {
    const user = authService.getCurrentUser()
    if (!user) return []

    return Array.from(this.sharedConversations.values())
      .filter(share => share.sharedBy === user.id)
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * List shares shared with current user
   */
  listSharedWithMe(): SharedConversation[] {
    const user = authService.getCurrentUser()
    if (!user) return []

    return Array.from(this.sharedConversations.values())
      .filter(share =>
        share.sharedWith.some(sw => sw.email === user.email) ||
        share.isPublic
      )
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * Update share permissions
   */
  async updateSharePermissions(
    shareId: string,
    email: string,
    newPermissions: SharePermissions
  ): Promise<void> {
    const shared = this.sharedConversations.get(shareId)
    if (!shared) {
      throw new Error('Share not found')
    }

    // Check if user is owner
    const user = authService.getCurrentUser()
    if (!user || shared.sharedBy !== user.id) {
      throw new Error('Only share owner can update permissions')
    }

    const sharedUser = shared.sharedWith.find(sw => sw.email === email)
    if (!sharedUser) {
      throw new Error('User not found in share')
    }

    sharedUser.permissions = newPermissions
    await this.saveSharedConversations()
  }

  /**
   * Revoke share access
   */
  async revokeShare(shareId: string, email?: string): Promise<void> {
    const shared = this.sharedConversations.get(shareId)
    if (!shared) {
      throw new Error('Share not found')
    }

    // Check if user is owner
    const user = authService.getCurrentUser()
    if (!user || shared.sharedBy !== user.id) {
      throw new Error('Only share owner can revoke access')
    }

    if (email) {
      // Remove specific user
      shared.sharedWith = shared.sharedWith.filter(sw => sw.email !== email)
    } else {
      // Revoke entire share
      this.sharedConversations.delete(shareId)
    }

    await this.saveSharedConversations()
  }

  /**
   * Add comment to conversation
   */
  async addComment(
    conversationId: string,
    content: string,
    messageId?: string,
    parentCommentId?: string
  ): Promise<ConversationComment> {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const id = `comment-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const now = Date.now()

    const comment: ConversationComment = {
      id,
      conversationId,
      messageId,
      userId: user.id,
      userDisplayName: user.displayName,
      userAvatar: user.avatar,
      content,
      parentCommentId,
      reactions: [],
      createdAt: now,
      isEdited: false,
      isDeleted: false
    }

    const conversationComments = this.comments.get(conversationId) || []
    conversationComments.push(comment)
    this.comments.set(conversationId, conversationComments)

    await this.saveComments()
    return comment
  }

  /**
   * Get comments for conversation
   */
  getComments(conversationId: string, messageId?: string): ConversationComment[] {
    const comments = this.comments.get(conversationId) || []

    if (messageId) {
      return comments.filter(c => c.messageId === messageId && !c.isDeleted)
    }

    return comments.filter(c => !c.isDeleted)
  }

  /**
   * Update comment
   */
  async updateComment(commentId: string, newContent: string): Promise<void> {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    for (const [convId, comments] of this.comments.entries()) {
      const comment = comments.find(c => c.id === commentId)
      if (comment) {
        if (comment.userId !== user.id) {
          throw new Error('Only comment author can edit comment')
        }

        comment.content = newContent
        comment.updatedAt = Date.now()
        comment.isEdited = true

        await this.saveComments()
        return
      }
    }

    throw new Error('Comment not found')
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId: string): Promise<void> {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    for (const [convId, comments] of this.comments.entries()) {
      const comment = comments.find(c => c.id === commentId)
      if (comment) {
        if (comment.userId !== user.id) {
          throw new Error('Only comment author can delete comment')
        }

        comment.isDeleted = true
        comment.content = '[已删除]'

        await this.saveComments()
        return
      }
    }

    throw new Error('Comment not found')
  }

  /**
   * Add reaction to comment
   */
  async addCommentReaction(commentId: string, emoji: string): Promise<void> {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    for (const [convId, comments] of this.comments.entries()) {
      const comment = comments.find(c => c.id === commentId)
      if (comment) {
        // Remove existing reaction from user
        comment.reactions = comment.reactions.filter(r => r.userId !== user.id)

        // Add new reaction
        comment.reactions.push({
          userId: user.id,
          emoji,
          createdAt: Date.now()
        })

        await this.saveComments()
        return
      }
    }

    throw new Error('Comment not found')
  }

  /**
   * Track share access
   */
  async trackAccess(shareId: string): Promise<void> {
    const shared = this.sharedConversations.get(shareId)
    if (shared) {
      shared.accessCount++
      shared.lastAccessedAt = Date.now()
      await this.saveSharedConversations()
    }
  }

  /**
   * Generate share URL
   */
  private generateShareUrl(id: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/shared/${id}`
  }

  /**
   * Generate secure token
   */
  private generateToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
  }

  /**
   * Save shared conversations to storage
   */
  private async saveSharedConversations(): Promise<void> {
    const list = Array.from(this.sharedConversations.values())
    await this.store.setItem('shared-conversations', list)
  }

  /**
   * Save share links to storage
   */
  private async saveShareLinks(): Promise<void> {
    const list = Array.from(this.shareLinks.values())
    await this.store.setItem('share-links', list)
  }

  /**
   * Save comments to storage
   */
  private async saveComments(): Promise<void> {
    const commentsList: Record<string, ConversationComment[]> = {}
    this.comments.forEach((comments, convId) => {
      commentsList[convId] = comments
    })
    await this.store.setItem('comments', commentsList)
  }

  /**
   * Get sharing statistics
   */
  getStats() {
    const user = authService.getCurrentUser()
    if (!user) return null

    const myShares = this.listMyShares()
    const sharedWithMe = this.listSharedWithMe()

    return {
      totalShares: myShares.length,
      totalSharedWithMe: sharedWithMe.length,
      totalAccessCount: myShares.reduce((sum, s) => sum + s.accessCount, 0),
      totalComments: Array.from(this.comments.values()).flat().length,
      publicShares: myShares.filter(s => s.isPublic).length
    }
  }
}

/**
 * Global sharing service instance
 */
export const sharingService = new SharingService()

/**
 * Initialize on module load
 */
sharingService.initialize().catch(console.error)

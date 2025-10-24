/**
 * Workspace Service
 * Manages team workspaces, members, and collaboration
 */

import localforage from 'localforage'
import { authService } from './authService'

export interface Workspace {
  id: string
  name: string
  description?: string
  ownerId: string
  members: WorkspaceMember[]
  settings: WorkspaceSettings
  createdAt: number
  updatedAt: number
}

export interface WorkspaceMember {
  userId: string
  email: string
  username: string
  displayName: string
  avatar?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  joinedAt: number
  lastActiveAt?: number
}

export interface WorkspaceSettings {
  isPublic: boolean
  allowInvites: boolean
  defaultMemberRole: 'member' | 'viewer'
  maxMembers?: number
  features: {
    chat: boolean
    fileSharing: boolean
    knowledgeBase: boolean
    agents: boolean
  }
}

export interface WorkspaceInvite {
  id: string
  workspaceId: string
  workspaceName: string
  invitedBy: string
  invitedByName: string
  email: string
  role: 'admin' | 'member' | 'viewer'
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  createdAt: number
  expiresAt: number
}

export interface WorkspaceStats {
  memberCount: number
  conversationCount: number
  messageCount: number
  storageUsed: number // bytes
}

export class WorkspaceService {
  private store: LocalForage
  private workspaces: Map<string, Workspace> = new Map()
  private currentWorkspaceId: string | null = null

  constructor() {
    this.store = localforage.createInstance({
      name: 'workspace-db',
      storeName: 'workspaces'
    })
  }

  /**
   * Initialize workspace service
   */
  async initialize(): Promise<void> {
    try {
      // Load all workspaces
      const workspaceList = await this.store.getItem<Workspace[]>('workspace-list')
      if (workspaceList) {
        workspaceList.forEach(ws => this.workspaces.set(ws.id, ws))
      }

      // Load current workspace
      const currentId = await this.store.getItem<string>('current-workspace-id')
      if (currentId && this.workspaces.has(currentId)) {
        this.currentWorkspaceId = currentId
      }
    } catch (error) {
      console.error('Workspace initialization error:', error)
    }
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(name: string, description?: string): Promise<Workspace> {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const id = `ws-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const now = Date.now()

    const workspace: Workspace = {
      id,
      name,
      description,
      ownerId: user.id,
      members: [{
        userId: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        role: 'owner',
        joinedAt: now
      }],
      settings: {
        isPublic: false,
        allowInvites: true,
        defaultMemberRole: 'member',
        maxMembers: 50,
        features: {
          chat: true,
          fileSharing: true,
          knowledgeBase: true,
          agents: true
        }
      },
      createdAt: now,
      updatedAt: now
    }

    this.workspaces.set(id, workspace)
    await this.saveWorkspaces()

    // Set as current workspace if it's the first one
    if (this.workspaces.size === 1) {
      await this.switchWorkspace(id)
    }

    return workspace
  }

  /**
   * Get workspace by ID
   */
  getWorkspace(workspaceId: string): Workspace | undefined {
    return this.workspaces.get(workspaceId)
  }

  /**
   * Get current workspace
   */
  getCurrentWorkspace(): Workspace | null {
    if (!this.currentWorkspaceId) return null
    return this.workspaces.get(this.currentWorkspaceId) || null
  }

  /**
   * List all workspaces for current user
   */
  listWorkspaces(): Workspace[] {
    const user = authService.getCurrentUser()
    if (!user) return []

    return Array.from(this.workspaces.values())
      .filter(ws => ws.members.some(m => m.userId === user.id))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  /**
   * Switch to a different workspace
   */
  async switchWorkspace(workspaceId: string): Promise<void> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found')
    }

    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Check if user is a member
    const isMember = workspace.members.some(m => m.userId === user.id)
    if (!isMember) {
      throw new Error('You are not a member of this workspace')
    }

    this.currentWorkspaceId = workspaceId
    await this.store.setItem('current-workspace-id', workspaceId)

    // Update last active time
    const member = workspace.members.find(m => m.userId === user.id)
    if (member) {
      member.lastActiveAt = Date.now()
      workspace.updatedAt = Date.now()
      await this.saveWorkspaces()
    }
  }

  /**
   * Update workspace details
   */
  async updateWorkspace(
    workspaceId: string,
    updates: Partial<Pick<Workspace, 'name' | 'description' | 'settings'>>
  ): Promise<Workspace> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found')
    }

    // Check permissions
    this.checkPermission(workspace, 'admin')

    Object.assign(workspace, updates)
    workspace.updatedAt = Date.now()

    await this.saveWorkspaces()
    return workspace
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(workspaceId: string): Promise<void> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found')
    }

    // Only owner can delete
    const user = authService.getCurrentUser()
    if (!user || workspace.ownerId !== user.id) {
      throw new Error('Only workspace owner can delete workspace')
    }

    this.workspaces.delete(workspaceId)

    if (this.currentWorkspaceId === workspaceId) {
      this.currentWorkspaceId = null
      await this.store.removeItem('current-workspace-id')
    }

    await this.saveWorkspaces()
  }

  /**
   * Invite user to workspace
   */
  async inviteMember(
    workspaceId: string,
    email: string,
    role: 'admin' | 'member' | 'viewer' = 'member'
  ): Promise<WorkspaceInvite> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found')
    }

    // Check permissions
    this.checkPermission(workspace, 'admin')

    // Check if already a member
    if (workspace.members.some(m => m.email === email)) {
      throw new Error('User is already a member')
    }

    // Check max members
    if (workspace.settings.maxMembers && workspace.members.length >= workspace.settings.maxMembers) {
      throw new Error('Workspace has reached maximum member limit')
    }

    const user = authService.getCurrentUser()!
    const inviteId = `invite-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const now = Date.now()

    const invite: WorkspaceInvite = {
      id: inviteId,
      workspaceId,
      workspaceName: workspace.name,
      invitedBy: user.id,
      invitedByName: user.displayName,
      email,
      role,
      status: 'pending',
      createdAt: now,
      expiresAt: now + 7 * 24 * 60 * 60 * 1000 // 7 days
    }

    // In production, send email notification
    console.log(`Invite sent to ${email} for workspace ${workspace.name}`)

    return invite
  }

  /**
   * Add member to workspace
   */
  async addMember(
    workspaceId: string,
    userId: string,
    email: string,
    username: string,
    displayName: string,
    avatar: string | undefined,
    role: 'admin' | 'member' | 'viewer' = 'member'
  ): Promise<void> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found')
    }

    // Check if already a member
    if (workspace.members.some(m => m.userId === userId)) {
      throw new Error('User is already a member')
    }

    const member: WorkspaceMember = {
      userId,
      email,
      username,
      displayName,
      avatar,
      role,
      joinedAt: Date.now()
    }

    workspace.members.push(member)
    workspace.updatedAt = Date.now()

    await this.saveWorkspaces()
  }

  /**
   * Remove member from workspace
   */
  async removeMember(workspaceId: string, userId: string): Promise<void> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found')
    }

    // Cannot remove owner
    if (workspace.ownerId === userId) {
      throw new Error('Cannot remove workspace owner')
    }

    // Check permissions
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // User can remove themselves, or admin can remove others
    if (user.id !== userId) {
      this.checkPermission(workspace, 'admin')
    }

    workspace.members = workspace.members.filter(m => m.userId !== userId)
    workspace.updatedAt = Date.now()

    await this.saveWorkspaces()

    // If user removed themselves and it's current workspace, clear current
    if (user.id === userId && this.currentWorkspaceId === workspaceId) {
      this.currentWorkspaceId = null
      await this.store.removeItem('current-workspace-id')
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    workspaceId: string,
    userId: string,
    newRole: 'admin' | 'member' | 'viewer'
  ): Promise<void> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found')
    }

    // Cannot change owner role
    if (workspace.ownerId === userId) {
      throw new Error('Cannot change owner role')
    }

    // Check permissions
    this.checkPermission(workspace, 'owner')

    const member = workspace.members.find(m => m.userId === userId)
    if (!member) {
      throw new Error('Member not found')
    }

    member.role = newRole
    workspace.updatedAt = Date.now()

    await this.saveWorkspaces()
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStats(workspaceId: string): Promise<WorkspaceStats> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found')
    }

    try {
      // Get conversation store to calculate stats
      const stats = await this.calculateWorkspaceStats(workspaceId, workspace)

      return {
        memberCount: workspace.members.length,
        conversationCount: stats.conversationCount,
        messageCount: stats.messageCount,
        storageUsed: stats.storageUsed
      }
    } catch (error) {
      console.error('[Workspace] Error calculating stats:', error)
      // Return basic stats on error
      return {
        memberCount: workspace.members.length,
        conversationCount: 0,
        messageCount: 0,
        storageUsed: 0
      }
    }
  }

  /**
   * Calculate workspace statistics from local storage
   */
  private async calculateWorkspaceStats(
    workspaceId: string,
    workspace: Workspace
  ): Promise<Omit<WorkspaceStats, 'memberCount'>> {
    try {
      // Get all conversations for workspace members
      const allConversations = await localforage.getItem<any[]>('conversations') || []

      // Filter conversations belonging to workspace members
      const memberIds = workspace.members.map(m => m.userId)
      const workspaceConversations = allConversations.filter(conv =>
        memberIds.includes(conv.userId || conv.createdBy)
      )

      // Calculate message count
      let totalMessages = 0
      for (const conv of workspaceConversations) {
        totalMessages += (conv.messages || []).length
      }

      // Calculate storage used (rough estimate based on JSON size)
      const dataSize = new Blob([JSON.stringify(workspaceConversations)]).size

      return {
        conversationCount: workspaceConversations.length,
        messageCount: totalMessages,
        storageUsed: dataSize
      }
    } catch (error) {
      console.error('[Workspace] Error in calculateWorkspaceStats:', error)
      return {
        conversationCount: 0,
        messageCount: 0,
        storageUsed: 0
      }
    }
  }

  /**
   * Check if user has permission in workspace
   */
  private checkPermission(
    workspace: Workspace,
    requiredRole: 'owner' | 'admin' | 'member' = 'member'
  ): void {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const member = workspace.members.find(m => m.userId === user.id)
    if (!member) {
      throw new Error('You are not a member of this workspace')
    }

    const roleLevel = {
      viewer: 0,
      member: 1,
      admin: 2,
      owner: 3
    }

    if (roleLevel[member.role] < roleLevel[requiredRole]) {
      throw new Error(`Insufficient permissions. Required: ${requiredRole}`)
    }
  }

  /**
   * Save workspaces to storage
   */
  private async saveWorkspaces(): Promise<void> {
    const workspaceList = Array.from(this.workspaces.values())
    await this.store.setItem('workspace-list', workspaceList)
  }

  /**
   * Transfer workspace ownership
   */
  async transferOwnership(workspaceId: string, newOwnerId: string): Promise<void> {
    const workspace = this.workspaces.get(workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found')
    }

    // Only current owner can transfer
    const user = authService.getCurrentUser()
    if (!user || workspace.ownerId !== user.id) {
      throw new Error('Only current owner can transfer ownership')
    }

    const newOwner = workspace.members.find(m => m.userId === newOwnerId)
    if (!newOwner) {
      throw new Error('New owner must be a workspace member')
    }

    // Update roles
    const currentOwner = workspace.members.find(m => m.userId === user.id)
    if (currentOwner) {
      currentOwner.role = 'admin'
    }

    newOwner.role = 'owner'
    workspace.ownerId = newOwnerId
    workspace.updatedAt = Date.now()

    await this.saveWorkspaces()
  }
}

/**
 * Global workspace service instance
 */
export const workspaceService = new WorkspaceService()

/**
 * Initialize on module load
 */
workspaceService.initialize().catch(console.error)

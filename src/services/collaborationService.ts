import { EventEmitter } from '@/utils/EventEmitter'

// Types for collaboration
export interface CollaborationUser {
  id: string
  name: string
  email: string
  avatar?: string
  color: string
  isOnline: boolean
  lastSeen: Date
  cursor?: {
    x: number
    y: number
    timestamp: Date
  }
  currentSelection?: {
    messageId: string
    start: number
    end: number
  }
}

export interface CollaborationSession {
  id: string
  conversationId: string
  participants: CollaborationUser[]
  owner: string
  createdAt: Date
  settings: {
    allowEditing: boolean
    allowComments: boolean
    allowVoiceChat: boolean
    shareMode: 'view' | 'edit' | 'comment'
  }
  isActive: boolean
}

export interface CollaborationEvent {
  id: string
  sessionId: string
  userId: string
  type: 'join' | 'leave' | 'cursor' | 'selection' | 'edit' | 'comment' | 'typing' | 'voice'
  data: any
  timestamp: Date
}

export interface LiveComment {
  id: string
  messageId: string
  userId: string
  content: string
  position: { x: number; y: number }
  replies?: LiveComment[]
  resolved: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TypingIndicator {
  userId: string
  messageId?: string
  isTyping: boolean
  timestamp: Date
}

export interface VoiceChatState {
  isActive: boolean
  participants: string[]
  isMuted: boolean
  isDeafened: boolean
}

// Mock WebSocket connection for real-time communication
class MockWebSocket extends EventEmitter {
  private connected = false
  private reconnectInterval: NodeJS.Timeout | null = null

  constructor(private url: string) {
    super()
    this.connect()
  }

  private connect() {
    // Simulate connection delay
    setTimeout(() => {
      this.connected = true
      this.emit('open')

      // Simulate periodic server messages
      setInterval(() => {
        if (this.connected) {
          this.simulateServerMessage()
        }
      }, 30000) // Every 30 seconds
    }, 1000)
  }

  private simulateServerMessage() {
    // Simulate random collaboration events
    const events = [
      { type: 'user_joined', data: { userId: 'user-' + Math.random().toString(36).substr(2, 9) } },
      { type: 'cursor_update', data: { x: Math.random() * 1000, y: Math.random() * 800 } },
      { type: 'presence_update', data: { userCount: Math.floor(Math.random() * 5) + 1 } }
    ]

    const event = events[Math.floor(Math.random() * events.length)]
    this.emit('message', { data: JSON.stringify(event) })
  }

  send(data: string) {
    if (!this.connected) {
      console.warn('WebSocket not connected, queuing message')
      return
    }

    // Simulate message processing
    setTimeout(() => {
      this.emit('message', { data: JSON.stringify({ type: 'ack', data: JSON.parse(data) }) })
    }, Math.random() * 100) // Random delay up to 100ms
  }

  close() {
    this.connected = false
    this.removeAllListeners()
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval)
    }
  }

  get readyState() {
    return this.connected ? 1 : 0 // WebSocket.OPEN : WebSocket.CONNECTING
  }
}

class CollaborationService extends EventEmitter {
  private sessions = new Map<string, CollaborationSession>()
  private currentSession: CollaborationSession | null = null
  private currentUser: CollaborationUser | null = null
  private webSocket: MockWebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private comments = new Map<string, LiveComment[]>()
  private typingIndicators = new Map<string, TypingIndicator>()
  private voiceChatState: VoiceChatState = {
    isActive: false,
    participants: [],
    isMuted: false,
    isDeafened: false
  }

  // Initialize collaboration service
  async initialize(user: Omit<CollaborationUser, 'isOnline' | 'lastSeen'>) {
    this.currentUser = {
      ...user,
      isOnline: true,
      lastSeen: new Date()
    }

    await this.connectWebSocket()
    this.setupHeartbeat()

    return this.currentUser
  }

  // Connect to WebSocket server
  private async connectWebSocket() {
    try {
      // In a real implementation, this would be a proper WebSocket URL
      this.webSocket = new MockWebSocket('ws://localhost:3001/collaboration')

      this.webSocket.on('open', () => {
        console.log('Connected to collaboration server')
        this.reconnectAttempts = 0
        this.emit('connected')
      })

      this.webSocket.on('message', (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleWebSocketMessage(data)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      })

      this.webSocket.on('error', (error) => {
        console.error('WebSocket error:', error)
        this.emit('error', error)
      })

      this.webSocket.on('close', () => {
        console.log('WebSocket connection closed')
        this.emit('disconnected')
        this.attemptReconnect()
      })

    } catch (error) {
      console.error('Failed to connect to collaboration server:', error)
      this.emit('error', error)
    }
  }

  // Handle incoming WebSocket messages
  private handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'session_update':
        this.updateSession(data.session)
        break
      case 'user_joined':
        this.handleUserJoined(data.user)
        break
      case 'user_left':
        this.handleUserLeft(data.user)
        break
      case 'cursor_update':
        this.handleCursorUpdate(data.userId, data.cursor)
        break
      case 'selection_update':
        this.handleSelectionUpdate(data.userId, data.selection)
        break
      case 'typing_update':
        this.handleTypingUpdate(data.userId, data.typing)
        break
      case 'comment_added':
        this.handleCommentAdded(data.comment)
        break
      case 'comment_resolved':
        this.handleCommentResolved(data.commentId)
        break
      case 'voice_chat_update':
        this.handleVoiceChatUpdate(data.voiceState)
        break
    }
  }

  // Setup heartbeat to maintain connection
  private setupHeartbeat() {
    setInterval(() => {
      if (this.webSocket && this.webSocket.readyState === 1) {
        this.sendMessage('heartbeat', { timestamp: new Date() })
      }
    }, 30000) // Every 30 seconds
  }

  // Attempt to reconnect WebSocket
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      this.emit('max_reconnect_attempts')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000) // Exponential backoff

    setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      this.connectWebSocket()
    }, delay)
  }

  // Create a new collaboration session
  async createSession(conversationId: string, settings?: Partial<CollaborationSession['settings']>): Promise<CollaborationSession> {
    if (!this.currentUser) {
      throw new Error('User not initialized')
    }

    const session: CollaborationSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conversationId,
      participants: [this.currentUser],
      owner: this.currentUser.id,
      createdAt: new Date(),
      settings: {
        allowEditing: true,
        allowComments: true,
        allowVoiceChat: true,
        shareMode: 'edit',
        ...settings
      },
      isActive: true
    }

    this.sessions.set(session.id, session)
    this.currentSession = session

    // Notify server
    this.sendMessage('create_session', { session })

    this.emit('session_created', session)
    return session
  }

  // Join an existing collaboration session
  async joinSession(sessionId: string): Promise<CollaborationSession> {
    if (!this.currentUser) {
      throw new Error('User not initialized')
    }

    // Notify server about joining
    this.sendMessage('join_session', { sessionId, user: this.currentUser })

    // In a real implementation, this would fetch from server
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    // Add current user to participants if not already present
    const existingParticipant = session.participants.find(p => p.id === this.currentUser!.id)
    if (!existingParticipant) {
      session.participants.push(this.currentUser)
    }

    this.currentSession = session
    this.emit('session_joined', session)

    return session
  }

  // Leave the current collaboration session
  async leaveSession() {
    if (!this.currentSession || !this.currentUser) {
      return
    }

    // Remove current user from participants
    this.currentSession.participants = this.currentSession.participants.filter(
      p => p.id !== this.currentUser!.id
    )

    // Notify server
    this.sendMessage('leave_session', {
      sessionId: this.currentSession.id,
      userId: this.currentUser.id
    })

    const sessionId = this.currentSession.id
    this.currentSession = null

    this.emit('session_left', sessionId)
  }

  // Update cursor position
  updateCursor(x: number, y: number) {
    if (!this.currentSession || !this.currentUser) {
      return
    }

    this.currentUser.cursor = { x, y, timestamp: new Date() }

    this.sendMessage('cursor_update', {
      sessionId: this.currentSession.id,
      userId: this.currentUser.id,
      cursor: this.currentUser.cursor
    })
  }

  // Update text selection
  updateSelection(messageId: string, start: number, end: number) {
    if (!this.currentSession || !this.currentUser) {
      return
    }

    this.currentUser.currentSelection = { messageId, start, end }

    this.sendMessage('selection_update', {
      sessionId: this.currentSession.id,
      userId: this.currentUser.id,
      selection: this.currentUser.currentSelection
    })
  }

  // Update typing indicator
  updateTyping(messageId: string | undefined, isTyping: boolean) {
    if (!this.currentSession || !this.currentUser) {
      return
    }

    const typing: TypingIndicator = {
      userId: this.currentUser.id,
      messageId,
      isTyping,
      timestamp: new Date()
    }

    this.sendMessage('typing_update', {
      sessionId: this.currentSession.id,
      typing
    })
  }

  // Add a live comment
  async addComment(messageId: string, content: string, position: { x: number; y: number }): Promise<LiveComment> {
    if (!this.currentSession || !this.currentUser) {
      throw new Error('No active session')
    }

    const comment: LiveComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messageId,
      userId: this.currentUser.id,
      content,
      position,
      resolved: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Store comment locally
    const messageComments = this.comments.get(messageId) || []
    messageComments.push(comment)
    this.comments.set(messageId, messageComments)

    // Notify server
    this.sendMessage('add_comment', {
      sessionId: this.currentSession.id,
      comment
    })

    this.emit('comment_added', comment)
    return comment
  }

  // Resolve a comment
  async resolveComment(commentId: string) {
    if (!this.currentSession) {
      return
    }

    // Update comment locally
    for (const [messageId, comments] of this.comments.entries()) {
      const comment = comments.find(c => c.id === commentId)
      if (comment) {
        comment.resolved = true
        comment.updatedAt = new Date()
        break
      }
    }

    // Notify server
    this.sendMessage('resolve_comment', {
      sessionId: this.currentSession.id,
      commentId
    })

    this.emit('comment_resolved', commentId)
  }

  // Start voice chat
  async startVoiceChat() {
    if (!this.currentSession || !this.currentUser) {
      return
    }

    this.voiceChatState = {
      isActive: true,
      participants: [this.currentUser.id],
      isMuted: false,
      isDeafened: false
    }

    // Notify server
    this.sendMessage('voice_chat_start', {
      sessionId: this.currentSession.id,
      voiceState: this.voiceChatState
    })

    this.emit('voice_chat_started', this.voiceChatState)
  }

  // End voice chat
  async endVoiceChat() {
    if (!this.currentSession) {
      return
    }

    this.voiceChatState = {
      isActive: false,
      participants: [],
      isMuted: false,
      isDeafened: false
    }

    // Notify server
    this.sendMessage('voice_chat_end', {
      sessionId: this.currentSession.id
    })

    this.emit('voice_chat_ended')
  }

  // Toggle mute in voice chat
  toggleMute() {
    this.voiceChatState.isMuted = !this.voiceChatState.isMuted

    this.sendMessage('voice_chat_update', {
      sessionId: this.currentSession?.id,
      voiceState: this.voiceChatState
    })

    this.emit('voice_chat_updated', this.voiceChatState)
  }

  // Send message via WebSocket
  private sendMessage(type: string, data: any) {
    if (!this.webSocket || this.webSocket.readyState !== 1) {
      console.warn('WebSocket not ready, message not sent:', type)
      return
    }

    const message = {
      type,
      data,
      timestamp: new Date(),
      userId: this.currentUser?.id
    }

    this.webSocket.send(JSON.stringify(message))
  }

  // Event handlers
  private updateSession(session: CollaborationSession) {
    this.sessions.set(session.id, session)
    if (this.currentSession?.id === session.id) {
      this.currentSession = session
    }
    this.emit('session_updated', session)
  }

  private handleUserJoined(user: CollaborationUser) {
    if (this.currentSession) {
      this.currentSession.participants.push(user)
      this.emit('user_joined', user)
    }
  }

  private handleUserLeft(user: CollaborationUser) {
    if (this.currentSession) {
      this.currentSession.participants = this.currentSession.participants.filter(
        p => p.id !== user.id
      )
      this.emit('user_left', user)
    }
  }

  private handleCursorUpdate(userId: string, cursor: CollaborationUser['cursor']) {
    if (this.currentSession) {
      const user = this.currentSession.participants.find(p => p.id === userId)
      if (user) {
        user.cursor = cursor
        this.emit('cursor_updated', { userId, cursor })
      }
    }
  }

  private handleSelectionUpdate(userId: string, selection: CollaborationUser['currentSelection']) {
    if (this.currentSession) {
      const user = this.currentSession.participants.find(p => p.id === userId)
      if (user) {
        user.currentSelection = selection
        this.emit('selection_updated', { userId, selection })
      }
    }
  }

  private handleTypingUpdate(userId: string, typing: TypingIndicator) {
    this.typingIndicators.set(userId, typing)
    this.emit('typing_updated', { userId, typing })
  }

  private handleCommentAdded(comment: LiveComment) {
    const messageComments = this.comments.get(comment.messageId) || []
    messageComments.push(comment)
    this.comments.set(comment.messageId, messageComments)
    this.emit('comment_added', comment)
  }

  private handleCommentResolved(commentId: string) {
    for (const [messageId, comments] of this.comments.entries()) {
      const comment = comments.find(c => c.id === commentId)
      if (comment) {
        comment.resolved = true
        comment.updatedAt = new Date()
        this.emit('comment_resolved', commentId)
        break
      }
    }
  }

  private handleVoiceChatUpdate(voiceState: VoiceChatState) {
    this.voiceChatState = voiceState
    this.emit('voice_chat_updated', voiceState)
  }

  // Getters
  getCurrentSession(): CollaborationSession | null {
    return this.currentSession
  }

  getCurrentUser(): CollaborationUser | null {
    return this.currentUser
  }

  getComments(messageId: string): LiveComment[] {
    return this.comments.get(messageId) || []
  }

  getTypingIndicators(): Map<string, TypingIndicator> {
    return this.typingIndicators
  }

  getVoiceChatState(): VoiceChatState {
    return this.voiceChatState
  }

  // Generate shareable link
  generateShareLink(sessionId: string, permissions: 'view' | 'edit' | 'comment' = 'view'): string {
    const baseUrl = window.location.origin
    const shareToken = btoa(JSON.stringify({ sessionId, permissions, expires: Date.now() + 86400000 })) // 24 hours
    return `${baseUrl}/collaborate/${shareToken}`
  }

  // Parse share link
  parseShareLink(shareToken: string): { sessionId: string; permissions: string; expires: number } | null {
    try {
      const decoded = JSON.parse(atob(shareToken))
      if (decoded.expires < Date.now()) {
        throw new Error('Share link expired')
      }
      return decoded
    } catch (error) {
      console.error('Invalid share link:', error)
      return null
    }
  }

  // Cleanup
  destroy() {
    this.leaveSession()
    this.webSocket?.close()
    this.removeAllListeners()
    this.sessions.clear()
    this.comments.clear()
    this.typingIndicators.clear()
  }
}

// Singleton instance
const collaborationService = new CollaborationService()

export default collaborationService
export type { CollaborationService }
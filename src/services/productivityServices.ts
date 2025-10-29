/**
 * AI Chat Studio v4.0 - Productivity Services
 *
 * This file contains productivity tools:
 * - Task Manager Service
 * - Note System Service
 * - Meeting Assistant Service
 * - Email Integration Service
 * - Schedule Assistant Service
 * - Pomodoro Timer Service
 */

import localforage from 'localforage'
import type {
  Task,
  TaskList,
  TaskPriority,
  TaskStatus,
  Note,
  NoteFolder,
  NoteTag,
  Meeting,
  MeetingAgenda,
  MeetingNote,
  EmailMessage,
  EmailFolder,
  EmailFilter,
  ScheduleSuggestion,
  TimeSlot,
  PomodoroSession,
  PomodoroStats
} from '../types/v4-types'

// ===================================
// TASK MANAGER SERVICE
// ===================================

class TaskManagerService {
  private readonly TASKS_KEY = 'tasks'
  private readonly LISTS_KEY = 'task_lists'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'tasks'
  })

  // Task Management
  async createTask(
    title: string,
    userId: string,
    listId?: string
  ): Promise<Task> {
    const task: Task = {
      id: `task_${Date.now()}`,
      title,
      description: '',
      userId,
      listId: listId || null,
      status: 'todo',
      priority: 'medium',
      dueDate: null,
      tags: [],
      subtasks: [],
      assignees: [],
      attachments: [],
      comments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      completedAt: null
    }

    const tasks = await this.getAllTasks()
    tasks.push(task)
    await this.store.setItem(this.TASKS_KEY, tasks)

    return task
  }

  async getTask(taskId: string): Promise<Task | null> {
    const tasks = await this.getAllTasks()
    return tasks.find(t => t.id === taskId) || null
  }

  async getAllTasks(userId?: string, filters?: {
    status?: TaskStatus
    priority?: TaskPriority
    listId?: string
    dueDate?: { from?: number; to?: number }
  }): Promise<Task[]> {
    let tasks = await this.store.getItem<Task[]>(this.TASKS_KEY) || []

    if (userId) {
      tasks = tasks.filter(t => t.userId === userId)
    }

    if (filters) {
      if (filters.status) {
        tasks = tasks.filter(t => t.status === filters.status)
      }
      if (filters.priority) {
        tasks = tasks.filter(t => t.priority === filters.priority)
      }
      if (filters.listId) {
        tasks = tasks.filter(t => t.listId === filters.listId)
      }
      if (filters.dueDate) {
        if (filters.dueDate.from) {
          tasks = tasks.filter(t => t.dueDate && t.dueDate >= filters.dueDate!.from!)
        }
        if (filters.dueDate.to) {
          tasks = tasks.filter(t => t.dueDate && t.dueDate <= filters.dueDate!.to!)
        }
      }
    }

    return tasks
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const tasks = await this.getAllTasks()
    const task = tasks.find(t => t.id === taskId)

    if (task) {
      Object.assign(task, updates, { updatedAt: Date.now() })

      if (updates.status === 'done' && !task.completedAt) {
        task.completedAt = Date.now()
      }

      await this.store.setItem(this.TASKS_KEY, tasks)
      return task
    }

    return null
  }

  async deleteTask(taskId: string): Promise<void> {
    const tasks = await this.getAllTasks()
    const filtered = tasks.filter(t => t.id !== taskId)
    await this.store.setItem(this.TASKS_KEY, filtered)
  }

  // Task List Management
  async createList(name: string, userId: string, color?: string): Promise<TaskList> {
    const list: TaskList = {
      id: `list_${Date.now()}`,
      name,
      userId,
      color: color || '#3B82F6',
      taskCount: 0,
      completedCount: 0,
      createdAt: Date.now()
    }

    const lists = await this.getAllLists()
    lists.push(list)
    await this.store.setItem(this.LISTS_KEY, lists)

    return list
  }

  async getAllLists(userId?: string): Promise<TaskList[]> {
    const lists = await this.store.getItem<TaskList[]>(this.LISTS_KEY) || []

    if (userId) {
      return lists.filter(l => l.userId === userId)
    }

    return lists
  }

  async updateListCounts(listId: string): Promise<void> {
    const tasks = await this.getAllTasks(undefined, { listId })
    const lists = await this.getAllLists()
    const list = lists.find(l => l.id === listId)

    if (list) {
      list.taskCount = tasks.length
      list.completedCount = tasks.filter(t => t.status === 'done').length
      await this.store.setItem(this.LISTS_KEY, lists)
    }
  }
}

// ===================================
// NOTE SYSTEM SERVICE
// ===================================

class NoteSystemService {
  private readonly NOTES_KEY = 'notes'
  private readonly FOLDERS_KEY = 'note_folders'
  private readonly TAGS_KEY = 'note_tags'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'notes'
  })

  // Note Management
  async createNote(
    title: string,
    content: string,
    userId: string,
    folderId?: string
  ): Promise<Note> {
    const note: Note = {
      id: `note_${Date.now()}`,
      title,
      content,
      userId,
      folderId: folderId || null,
      tags: [],
      isPinned: false,
      isArchived: false,
      isFavorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      format: 'markdown',
      color: null,
      attachments: []
    }

    const notes = await this.getAllNotes()
    notes.push(note)
    await this.store.setItem(this.NOTES_KEY, notes)

    return note
  }

  async getNote(noteId: string): Promise<Note | null> {
    const notes = await this.getAllNotes()
    return notes.find(n => n.id === noteId) || null
  }

  async getAllNotes(userId?: string, filters?: {
    folderId?: string
    tag?: string
    pinned?: boolean
    archived?: boolean
    favorite?: boolean
  }): Promise<Note[]> {
    let notes = await this.store.getItem<Note[]>(this.NOTES_KEY) || []

    if (userId) {
      notes = notes.filter(n => n.userId === userId)
    }

    if (filters) {
      if (filters.folderId) {
        notes = notes.filter(n => n.folderId === filters.folderId)
      }
      if (filters.tag) {
        notes = notes.filter(n => n.tags.includes(filters.tag!))
      }
      if (filters.pinned !== undefined) {
        notes = notes.filter(n => n.isPinned === filters.pinned)
      }
      if (filters.archived !== undefined) {
        notes = notes.filter(n => n.isArchived === filters.archived)
      }
      if (filters.favorite !== undefined) {
        notes = notes.filter(n => n.isFavorite === filters.favorite)
      }
    }

    return notes
  }

  async updateNote(noteId: string, updates: Partial<Note>): Promise<Note | null> {
    const notes = await this.getAllNotes()
    const note = notes.find(n => n.id === noteId)

    if (note) {
      Object.assign(note, updates, { updatedAt: Date.now() })
      await this.store.setItem(this.NOTES_KEY, notes)
      return note
    }

    return null
  }

  async deleteNote(noteId: string): Promise<void> {
    const notes = await this.getAllNotes()
    const filtered = notes.filter(n => n.id !== noteId)
    await this.store.setItem(this.NOTES_KEY, filtered)
  }

  async searchNotes(userId: string, query: string): Promise<Note[]> {
    const notes = await this.getAllNotes(userId)
    const lowerQuery = query.toLowerCase()

    return notes.filter(n =>
      n.title.toLowerCase().includes(lowerQuery) ||
      n.content.toLowerCase().includes(lowerQuery)
    )
  }

  // Folder Management
  async createFolder(name: string, userId: string, parentId?: string): Promise<NoteFolder> {
    const folder: NoteFolder = {
      id: `folder_${Date.now()}`,
      name,
      userId,
      parentId: parentId || null,
      noteCount: 0,
      color: null,
      createdAt: Date.now()
    }

    const folders = await this.getAllFolders()
    folders.push(folder)
    await this.store.setItem(this.FOLDERS_KEY, folders)

    return folder
  }

  async getAllFolders(userId?: string): Promise<NoteFolder[]> {
    const folders = await this.store.getItem<NoteFolder[]>(this.FOLDERS_KEY) || []

    if (userId) {
      return folders.filter(f => f.userId === userId)
    }

    return folders
  }

  // Tag Management
  async createTag(name: string, userId: string, color?: string): Promise<NoteTag> {
    const tag: NoteTag = {
      id: `tag_${Date.now()}`,
      name,
      userId,
      color: color || '#6B7280',
      usageCount: 0
    }

    const tags = await this.getAllTags()
    tags.push(tag)
    await this.store.setItem(this.TAGS_KEY, tags)

    return tag
  }

  async getAllTags(userId?: string): Promise<NoteTag[]> {
    const tags = await this.store.getItem<NoteTag[]>(this.TAGS_KEY) || []

    if (userId) {
      return tags.filter(t => t.userId === userId)
    }

    return tags
  }
}

// ===================================
// MEETING ASSISTANT SERVICE
// ===================================

class MeetingAssistantService {
  private readonly MEETINGS_KEY = 'meetings'
  private readonly AGENDAS_KEY = 'meeting_agendas'
  private readonly NOTES_KEY = 'meeting_notes'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'meetings'
  })

  // Meeting Management
  async createMeeting(
    title: string,
    startTime: number,
    endTime: number,
    organizerId: string,
    attendees: string[] = []
  ): Promise<Meeting> {
    const meeting: Meeting = {
      id: `meeting_${Date.now()}`,
      title,
      description: '',
      startTime,
      endTime,
      location: '',
      organizerId,
      attendees: attendees.map(id => ({
        userId: id,
        status: 'pending'
      })),
      agenda: null,
      notes: [],
      recording: null,
      transcript: null,
      actionItems: [],
      status: 'scheduled',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const meetings = await this.getAllMeetings()
    meetings.push(meeting)
    await this.store.setItem(this.MEETINGS_KEY, meetings)

    return meeting
  }

  async getMeeting(meetingId: string): Promise<Meeting | null> {
    const meetings = await this.getAllMeetings()
    return meetings.find(m => m.id === meetingId) || null
  }

  async getAllMeetings(userId?: string, filters?: {
    status?: Meeting['status']
    from?: number
    to?: number
  }): Promise<Meeting[]> {
    let meetings = await this.store.getItem<Meeting[]>(this.MEETINGS_KEY) || []

    if (userId) {
      meetings = meetings.filter(m =>
        m.organizerId === userId ||
        m.attendees.some(a => a.userId === userId)
      )
    }

    if (filters) {
      if (filters.status) {
        meetings = meetings.filter(m => m.status === filters.status)
      }
      if (filters.from) {
        meetings = meetings.filter(m => m.startTime >= filters.from!)
      }
      if (filters.to) {
        meetings = meetings.filter(m => m.endTime <= filters.to!)
      }
    }

    return meetings
  }

  async updateMeeting(meetingId: string, updates: Partial<Meeting>): Promise<Meeting | null> {
    const meetings = await this.getAllMeetings()
    const meeting = meetings.find(m => m.id === meetingId)

    if (meeting) {
      Object.assign(meeting, updates, { updatedAt: Date.now() })
      await this.store.setItem(this.MEETINGS_KEY, meetings)
      return meeting
    }

    return null
  }

  async startMeeting(meetingId: string): Promise<void> {
    await this.updateMeeting(meetingId, { status: 'in_progress' })
  }

  async endMeeting(meetingId: string): Promise<void> {
    await this.updateMeeting(meetingId, { status: 'completed' })
  }

  // Agenda Management
  async createAgenda(meetingId: string, items: string[]): Promise<MeetingAgenda> {
    const agenda: MeetingAgenda = {
      id: `agenda_${Date.now()}`,
      meetingId,
      items: items.map((item, index) => ({
        id: `item_${Date.now()}_${index}`,
        title: item,
        duration: 10,
        presenter: null,
        completed: false
      })),
      createdAt: Date.now()
    }

    const agendas = await this.getAllAgendas()
    agendas.push(agenda)
    await this.store.setItem(this.AGENDAS_KEY, agendas)

    // Update meeting
    await this.updateMeeting(meetingId, { agenda: agenda.id })

    return agenda
  }

  async getAllAgendas(): Promise<MeetingAgenda[]> {
    return await this.store.getItem<MeetingAgenda[]>(this.AGENDAS_KEY) || []
  }

  // Meeting Notes
  async createMeetingNote(
    meetingId: string,
    content: string,
    authorId: string
  ): Promise<MeetingNote> {
    const note: MeetingNote = {
      id: `note_${Date.now()}`,
      meetingId,
      content,
      authorId,
      type: 'general',
      timestamp: Date.now()
    }

    const notes = await this.getAllMeetingNotes()
    notes.push(note)
    await this.store.setItem(this.NOTES_KEY, notes)

    return note
  }

  async getAllMeetingNotes(meetingId?: string): Promise<MeetingNote[]> {
    const notes = await this.store.getItem<MeetingNote[]>(this.NOTES_KEY) || []

    if (meetingId) {
      return notes.filter(n => n.meetingId === meetingId)
    }

    return notes
  }

  // AI Summary
  async generateSummary(meetingId: string): Promise<string> {
    const meeting = await this.getMeeting(meetingId)

    if (!meeting) {
      throw new Error('Meeting not found')
    }

    const notes = await this.getAllMeetingNotes(meetingId)

    // Simulate AI summary generation
    return `Meeting Summary for "${meeting.title}":\n\nKey Points:\n- ${notes.length} notes taken\n- ${meeting.actionItems.length} action items identified\n\nNext Steps:\n- Review action items\n- Schedule follow-up`
  }
}

// ===================================
// EMAIL INTEGRATION SERVICE
// ===================================

class EmailIntegrationService {
  private readonly MESSAGES_KEY = 'email_messages'
  private readonly FOLDERS_KEY = 'email_folders'
  private readonly FILTERS_KEY = 'email_filters'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'email'
  })

  // Message Management
  async fetchMessages(userId: string, folderId?: string): Promise<EmailMessage[]> {
    let messages = await this.store.getItem<EmailMessage[]>(`${this.MESSAGES_KEY}_${userId}`) || []

    if (folderId) {
      messages = messages.filter(m => m.folderId === folderId)
    }

    return messages
  }

  async getMessage(messageId: string, userId: string): Promise<EmailMessage | null> {
    const messages = await this.fetchMessages(userId)
    return messages.find(m => m.id === messageId) || null
  }

  async sendMessage(
    from: string,
    to: string[],
    subject: string,
    body: string,
    userId: string
  ): Promise<EmailMessage> {
    const message: EmailMessage = {
      id: `email_${Date.now()}`,
      from,
      to,
      cc: [],
      bcc: [],
      subject,
      body,
      htmlBody: null,
      attachments: [],
      folderId: 'sent',
      isRead: true,
      isStarred: false,
      isDraft: false,
      labels: [],
      receivedAt: Date.now()
    }

    const messages = await this.fetchMessages(userId)
    messages.push(message)
    await this.store.setItem(`${this.MESSAGES_KEY}_${userId}`, messages)

    return message
  }

  async updateMessage(
    messageId: string,
    userId: string,
    updates: Partial<EmailMessage>
  ): Promise<EmailMessage | null> {
    const messages = await this.fetchMessages(userId)
    const message = messages.find(m => m.id === messageId)

    if (message) {
      Object.assign(message, updates)
      await this.store.setItem(`${this.MESSAGES_KEY}_${userId}`, messages)
      return message
    }

    return null
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const messages = await this.fetchMessages(userId)
    const filtered = messages.filter(m => m.id !== messageId)
    await this.store.setItem(`${this.MESSAGES_KEY}_${userId}`, filtered)
  }

  // Folder Management
  async createFolder(name: string, userId: string): Promise<EmailFolder> {
    const folder: EmailFolder = {
      id: `folder_${Date.now()}`,
      name,
      userId,
      messageCount: 0,
      unreadCount: 0,
      type: 'custom'
    }

    const folders = await this.getAllFolders(userId)
    folders.push(folder)
    await this.store.setItem(`${this.FOLDERS_KEY}_${userId}`, folders)

    return folder
  }

  async getAllFolders(userId: string): Promise<EmailFolder[]> {
    const defaultFolders: EmailFolder[] = [
      { id: 'inbox', name: 'Inbox', userId, messageCount: 0, unreadCount: 0, type: 'system' },
      { id: 'sent', name: 'Sent', userId, messageCount: 0, unreadCount: 0, type: 'system' },
      { id: 'drafts', name: 'Drafts', userId, messageCount: 0, unreadCount: 0, type: 'system' },
      { id: 'trash', name: 'Trash', userId, messageCount: 0, unreadCount: 0, type: 'system' }
    ]

    const customFolders = await this.store.getItem<EmailFolder[]>(`${this.FOLDERS_KEY}_${userId}`) || []

    return [...defaultFolders, ...customFolders]
  }

  // Filter Management
  async createFilter(
    name: string,
    userId: string,
    conditions: Record<string, any>,
    actions: Record<string, any>
  ): Promise<EmailFilter> {
    const filter: EmailFilter = {
      id: `filter_${Date.now()}`,
      name,
      userId,
      conditions,
      actions,
      enabled: true,
      createdAt: Date.now()
    }

    const filters = await this.getAllFilters(userId)
    filters.push(filter)
    await this.store.setItem(`${this.FILTERS_KEY}_${userId}`, filters)

    return filter
  }

  async getAllFilters(userId: string): Promise<EmailFilter[]> {
    return await this.store.getItem<EmailFilter[]>(`${this.FILTERS_KEY}_${userId}`) || []
  }

  // AI Features
  async generateReply(messageId: string, userId: string, tone: 'formal' | 'casual' = 'formal'): Promise<string> {
    const message = await this.getMessage(messageId, userId)

    if (!message) {
      throw new Error('Message not found')
    }

    // Simulate AI reply generation
    return `Thank you for your email regarding "${message.subject}". I will review and get back to you shortly.`
  }

  async categorizeMessage(content: string): Promise<string[]> {
    // Simulate AI categorization
    const categories = ['Work', 'Personal', 'Finance', 'Shopping', 'Social']
    return [categories[Math.floor(Math.random() * categories.length)]]
  }
}

// ===================================
// SCHEDULE ASSISTANT SERVICE
// ===================================

class ScheduleAssistantService {
  private readonly SUGGESTIONS_KEY = 'schedule_suggestions'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'schedule'
  })

  // Schedule Optimization
  async findBestTimeSlot(
    duration: number,
    attendees: string[],
    preferences?: {
      preferredTime?: 'morning' | 'afternoon' | 'evening'
      daysOfWeek?: number[]
      avoidWeekends?: boolean
    }
  ): Promise<ScheduleSuggestion> {
    // Simulate finding optimal time slot
    const suggestion: ScheduleSuggestion = {
      id: `suggestion_${Date.now()}`,
      timeSlots: this.generateTimeSlots(duration, preferences),
      attendees,
      confidence: 0.85,
      conflicts: [],
      reasoning: 'Based on availability patterns and preferences'
    }

    return suggestion
  }

  async suggestMeetingTimes(
    duration: number,
    attendees: string[],
    count: number = 3
  ): Promise<TimeSlot[]> {
    return this.generateTimeSlots(duration, undefined, count)
  }

  async optimizeSchedule(userId: string, date: number): Promise<any> {
    // Analyze schedule and suggest optimizations
    return {
      originalSchedule: [],
      optimizedSchedule: [],
      timesSaved: 30,
      suggestions: [
        'Batch similar meetings together',
        'Add buffer time between meetings',
        'Schedule focus time in the morning'
      ]
    }
  }

  // Time Zone Management
  async convertTimeZone(timestamp: number, from: string, to: string): Promise<number> {
    // Simplified timezone conversion (in real app, would use proper library)
    return timestamp
  }

  async suggestMeetingTime(attendees: string[], duration: number): Promise<TimeSlot[]> {
    return this.generateTimeSlots(duration)
  }

  // Helper Methods
  private generateTimeSlots(
    duration: number,
    preferences?: any,
    count: number = 3
  ): TimeSlot[] {
    const slots: TimeSlot[] = []
    let baseTime = Date.now() + 24 * 60 * 60 * 1000 // Tomorrow

    for (let i = 0; i < count; i++) {
      const startTime = baseTime + i * 60 * 60 * 1000 // Each hour apart
      slots.push({
        start: startTime,
        end: startTime + duration * 60 * 1000,
        available: true,
        confidence: 0.8 - i * 0.1
      })
    }

    return slots
  }
}

// ===================================
// POMODORO TIMER SERVICE
// ===================================

class PomodoroTimerService {
  private readonly SESSIONS_KEY = 'pomodoro_sessions'
  private readonly STATS_KEY = 'pomodoro_stats'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'pomodoro'
  })

  private activeSession: PomodoroSession | null = null

  // Session Management
  async startSession(
    userId: string,
    taskId?: string,
    duration: number = 25
  ): Promise<PomodoroSession> {
    const session: PomodoroSession = {
      id: `pomodoro_${Date.now()}`,
      userId,
      taskId: taskId || null,
      type: 'work',
      duration: duration * 60 * 1000,
      startTime: Date.now(),
      endTime: Date.now() + duration * 60 * 1000,
      pausedAt: null,
      completedAt: null,
      interrupted: false
    }

    this.activeSession = session

    const sessions = await this.getAllSessions()
    sessions.push(session)
    await this.store.setItem(this.SESSIONS_KEY, sessions)

    return session
  }

  async pauseSession(sessionId: string): Promise<void> {
    if (this.activeSession && this.activeSession.id === sessionId) {
      this.activeSession.pausedAt = Date.now()
      await this.saveSession(this.activeSession)
    }
  }

  async resumeSession(sessionId: string): Promise<void> {
    if (this.activeSession && this.activeSession.id === sessionId && this.activeSession.pausedAt) {
      const pauseDuration = Date.now() - this.activeSession.pausedAt
      this.activeSession.endTime += pauseDuration
      this.activeSession.pausedAt = null
      await this.saveSession(this.activeSession)
    }
  }

  async completeSession(sessionId: string): Promise<void> {
    if (this.activeSession && this.activeSession.id === sessionId) {
      this.activeSession.completedAt = Date.now()
      await this.saveSession(this.activeSession)
      await this.updateStats(this.activeSession.userId)
      this.activeSession = null
    }
  }

  async interruptSession(sessionId: string): Promise<void> {
    if (this.activeSession && this.activeSession.id === sessionId) {
      this.activeSession.interrupted = true
      this.activeSession.completedAt = Date.now()
      await this.saveSession(this.activeSession)
      this.activeSession = null
    }
  }

  async getActiveSession(userId: string): Promise<PomodoroSession | null> {
    if (this.activeSession && this.activeSession.userId === userId) {
      return this.activeSession
    }
    return null
  }

  async getAllSessions(userId?: string): Promise<PomodoroSession[]> {
    const sessions = await this.store.getItem<PomodoroSession[]>(this.SESSIONS_KEY) || []

    if (userId) {
      return sessions.filter(s => s.userId === userId)
    }

    return sessions
  }

  // Statistics
  async getStats(userId: string): Promise<PomodoroStats> {
    const stats = await this.store.getItem<PomodoroStats>(`${this.STATS_KEY}_${userId}`)

    if (!stats) {
      return {
        userId,
        totalSessions: 0,
        completedSessions: 0,
        totalFocusTime: 0,
        averageSessionLength: 0,
        longestStreak: 0,
        currentStreak: 0,
        todaysSessions: 0,
        thisWeeksSessions: 0
      }
    }

    return stats
  }

  private async updateStats(userId: string): Promise<void> {
    const stats = await this.getStats(userId)
    const sessions = await this.getAllSessions(userId)

    const completedSessions = sessions.filter(s => s.completedAt && !s.interrupted)

    stats.totalSessions = sessions.length
    stats.completedSessions = completedSessions.length
    stats.totalFocusTime = completedSessions.reduce((sum, s) => sum + s.duration, 0)
    stats.averageSessionLength = stats.completedSessions > 0
      ? stats.totalFocusTime / stats.completedSessions
      : 0

    // Today's sessions
    const today = new Date().setHours(0, 0, 0, 0)
    stats.todaysSessions = sessions.filter(s => s.startTime >= today).length

    // This week's sessions
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    stats.thisWeeksSessions = sessions.filter(s => s.startTime >= weekAgo).length

    await this.store.setItem(`${this.STATS_KEY}_${userId}`, stats)
  }

  private async saveSession(session: PomodoroSession): Promise<void> {
    const sessions = await this.getAllSessions()
    const index = sessions.findIndex(s => s.id === session.id)

    if (index >= 0) {
      sessions[index] = session
      await this.store.setItem(this.SESSIONS_KEY, sessions)
    }
  }
}

// ===================================
// EXPORTS
// ===================================

export const taskManagerService = new TaskManagerService()
export const noteSystemService = new NoteSystemService()
export const meetingAssistantService = new MeetingAssistantService()
export const emailIntegrationService = new EmailIntegrationService()
export const scheduleAssistantService = new ScheduleAssistantService()
export const pomodoroTimerService = new PomodoroTimerService()

export default {
  taskManager: taskManagerService,
  noteSystem: noteSystemService,
  meetingAssistant: meetingAssistantService,
  emailIntegration: emailIntegrationService,
  scheduleAssistant: scheduleAssistantService,
  pomodoroTimer: pomodoroTimerService
}

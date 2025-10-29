/**
 * Task Manager UI Component
 *
 * Comprehensive productivity suite with tasks, notes, meetings, and more
 */

import React, { useState, useEffect } from 'react'
import {
  taskManagerService,
  noteSystemService,
  meetingAssistantService,
  emailIntegrationService,
  scheduleAssistantService,
  pomodoroTimerService
} from '../services/productivityServices'
import type {
  Task,
  Note,
  Meeting,
  Email,
  ScheduleEvent,
  PomodoroSession
} from '../types/v4-types'

interface TaskManagerUIProps {
  userId: string
}

export const TaskManagerUI: React.FC<TaskManagerUIProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes' | 'meetings' | 'emails' | 'schedule' | 'pomodoro'>('tasks')

  // Task state
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')

  // Note state
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [noteContent, setNoteContent] = useState('')

  // Meeting state
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)

  // Email state
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)

  // Schedule state
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([])
  const [scheduleDate, setScheduleDate] = useState(new Date())

  // Pomodoro state
  const [pomodoroSession, setPomodoroSession] = useState<PomodoroSession | null>(null)
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60) // 25 minutes in seconds
  const [pomodoroRunning, setPomodoroRunning] = useState(false)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [userId])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (pomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime(prev => prev - 1)
      }, 1000)
    } else if (pomodoroTime === 0) {
      handlePomodoroComplete()
    }
    return () => clearInterval(interval)
  }, [pomodoroRunning, pomodoroTime])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load all data in parallel
      const [
        userTasks,
        userNotes,
        userMeetings,
        userEmails,
        userSchedule
      ] = await Promise.all([
        taskManagerService.getTasks(userId),
        noteSystemService.getNotes(userId),
        meetingAssistantService.getMeetings(userId),
        emailIntegrationService.getEmails(userId, 'inbox'),
        scheduleAssistantService.getEventsForDay(userId, new Date())
      ])

      setTasks(userTasks)
      setNotes(userNotes)
      setMeetings(userMeetings)
      setEmails(userEmails)
      setScheduleEvents(userSchedule)

      setLoading(false)
    } catch (error) {
      console.error('Failed to load data:', error)
      setLoading(false)
    }
  }

  // Task functions
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) return

    const task = await taskManagerService.createTask(userId, {
      title: newTaskTitle,
      description: newTaskDescription,
      priority: 'medium',
      status: 'pending',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
    })

    setTasks([...tasks, task])
    setNewTaskTitle('')
    setNewTaskDescription('')
  }

  const handleUpdateTaskStatus = async (taskId: string, status: Task['status']) => {
    await taskManagerService.updateTask(taskId, { status })
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t))
  }

  const handleDeleteTask = async (taskId: string) => {
    await taskManagerService.deleteTask(taskId)
    setTasks(tasks.filter(t => t.id !== taskId))
  }

  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'all') return true
    return task.status === taskFilter
  })

  // Note functions
  const handleCreateNote = async () => {
    const note = await noteSystemService.createNote(userId, 'Untitled Note', '')
    setNotes([...notes, note])
    setSelectedNote(note)
    setNoteContent('')
  }

  const handleSaveNote = async () => {
    if (!selectedNote) return

    const updated = await noteSystemService.updateNote(selectedNote.id, {
      content: noteContent
    })
    setNotes(notes.map(n => n.id === selectedNote.id ? updated : n))
  }

  const handleDeleteNote = async (noteId: string) => {
    await noteSystemService.deleteNote(noteId)
    setNotes(notes.filter(n => n.id !== noteId))
    if (selectedNote?.id === noteId) {
      setSelectedNote(null)
    }
  }

  // Meeting functions
  const handleRecordMeeting = async (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId)
    if (!meeting) return

    // Simulate recording
    await meetingAssistantService.transcribeMeeting(meetingId, 'audio-data')
    const summary = await meetingAssistantService.summarizeMeeting(meetingId)
    const actionItems = await meetingAssistantService.extractActionItems(meetingId)

    alert(`Meeting recorded!\n\nSummary: ${summary}\n\nAction Items: ${actionItems.length}`)
  }

  // Email functions
  const handleGenerateReply = async (emailId: string) => {
    const email = emails.find(e => e.id === emailId)
    if (!email) return

    const reply = await emailIntegrationService.generateReply(emailId, 'professional')
    alert(`AI Generated Reply:\n\n${reply}`)
  }

  // Schedule functions
  const handleOptimizeSchedule = async () => {
    const optimized = await scheduleAssistantService.optimizeSchedule(
      userId,
      scheduleEvents.map(e => e.id)
    )
    alert(`Schedule optimized!\n\nSuggestions: ${optimized.suggestions.join(', ')}`)
  }

  // Pomodoro functions
  const handleStartPomodoro = async () => {
    const session = await pomodoroTimerService.startSession(userId, 25, 5)
    setPomodoroSession(session)
    setPomodoroTime(25 * 60)
    setPomodoroRunning(true)
  }

  const handlePausePomodoro = () => {
    setPomodoroRunning(false)
  }

  const handleResumePomodoro = () => {
    setPomodoroRunning(true)
  }

  const handlePomodoroComplete = async () => {
    if (!pomodoroSession) return

    setPomodoroRunning(false)
    await pomodoroTimerService.completeSession(pomodoroSession.id)
    alert('Pomodoro session complete! Take a break.')

    // Start break
    setPomodoroTime(5 * 60) // 5 minute break
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const renderTasksTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.taskHeader}>
        <div style={styles.filterButtons}>
          <button
            style={taskFilter === 'all' ? styles.activeFilterButton : styles.filterButton}
            onClick={() => setTaskFilter('all')}
          >
            All ({tasks.length})
          </button>
          <button
            style={taskFilter === 'pending' ? styles.activeFilterButton : styles.filterButton}
            onClick={() => setTaskFilter('pending')}
          >
            Pending ({tasks.filter(t => t.status === 'pending').length})
          </button>
          <button
            style={taskFilter === 'in-progress' ? styles.activeFilterButton : styles.filterButton}
            onClick={() => setTaskFilter('in-progress')}
          >
            In Progress ({tasks.filter(t => t.status === 'in-progress').length})
          </button>
          <button
            style={taskFilter === 'completed' ? styles.activeFilterButton : styles.filterButton}
            onClick={() => setTaskFilter('completed')}
          >
            Completed ({tasks.filter(t => t.status === 'completed').length})
          </button>
        </div>
      </div>

      <div style={styles.createTaskForm}>
        <input
          type="text"
          style={styles.input}
          placeholder="Task title..."
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
        />
        <input
          type="text"
          style={styles.input}
          placeholder="Description..."
          value={newTaskDescription}
          onChange={(e) => setNewTaskDescription(e.target.value)}
        />
        <button style={styles.primaryButton} onClick={handleCreateTask}>
          Add Task
        </button>
      </div>

      <div style={styles.taskList}>
        {filteredTasks.map(task => (
          <div key={task.id} style={styles.taskCard}>
            <div style={styles.taskCardHeader}>
              <h3 style={styles.taskTitle}>{task.title}</h3>
              <span style={getPriorityBadgeStyle(task.priority)}>{task.priority}</span>
            </div>
            <p style={styles.taskDescription}>{task.description}</p>
            <div style={styles.taskFooter}>
              <span style={styles.taskDueDate}>
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </span>
              <div style={styles.taskActions}>
                {task.status !== 'completed' && (
                  <>
                    {task.status === 'pending' && (
                      <button
                        style={styles.actionButton}
                        onClick={() => handleUpdateTaskStatus(task.id, 'in-progress')}
                      >
                        Start
                      </button>
                    )}
                    {task.status === 'in-progress' && (
                      <button
                        style={styles.actionButton}
                        onClick={() => handleUpdateTaskStatus(task.id, 'completed')}
                      >
                        Complete
                      </button>
                    )}
                  </>
                )}
                <button
                  style={styles.deleteButton}
                  onClick={() => handleDeleteTask(task.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderNotesTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.notesContainer}>
        <div style={styles.notesList}>
          <button style={styles.primaryButton} onClick={handleCreateNote}>
            + New Note
          </button>
          {notes.map(note => (
            <div
              key={note.id}
              style={selectedNote?.id === note.id ? styles.activeNoteItem : styles.noteItem}
              onClick={() => {
                setSelectedNote(note)
                setNoteContent(note.content)
              }}
            >
              <h4 style={styles.noteItemTitle}>{note.title}</h4>
              <p style={styles.noteItemPreview}>
                {note.content.substring(0, 50)}...
              </p>
              <span style={styles.noteItemDate}>
                {new Date(note.updatedAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>

        <div style={styles.noteEditor}>
          {selectedNote ? (
            <>
              <input
                type="text"
                style={styles.noteTitleInput}
                value={selectedNote.title}
                onChange={(e) => setSelectedNote({ ...selectedNote, title: e.target.value })}
                placeholder="Note title..."
              />
              <textarea
                style={styles.noteTextarea}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Start writing..."
              />
              <div style={styles.noteEditorActions}>
                <button style={styles.primaryButton} onClick={handleSaveNote}>
                  Save Note
                </button>
                <button
                  style={styles.deleteButton}
                  onClick={() => selectedNote && handleDeleteNote(selectedNote.id)}
                >
                  Delete Note
                </button>
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              <p>Select a note or create a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderMeetingsTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.meetingsList}>
        {meetings.map(meeting => (
          <div key={meeting.id} style={styles.meetingCard}>
            <div style={styles.meetingHeader}>
              <h3 style={styles.meetingTitle}>{meeting.title}</h3>
              <span style={styles.meetingTime}>
                {new Date(meeting.startTime).toLocaleString()}
              </span>
            </div>
            <p style={styles.meetingDescription}>{meeting.description}</p>
            <div style={styles.meetingParticipants}>
              Participants: {meeting.participants.join(', ')}
            </div>
            {meeting.summary && (
              <div style={styles.meetingSummary}>
                <h4>Summary</h4>
                <p>{meeting.summary}</p>
              </div>
            )}
            <button
              style={styles.primaryButton}
              onClick={() => handleRecordMeeting(meeting.id)}
            >
              Record & Summarize
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  const renderEmailsTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.emailList}>
        {emails.map(email => (
          <div key={email.id} style={styles.emailCard}>
            <div style={styles.emailHeader}>
              <div>
                <h3 style={styles.emailSubject}>{email.subject}</h3>
                <p style={styles.emailFrom}>From: {email.from}</p>
              </div>
              <span style={styles.emailDate}>
                {new Date(email.date).toLocaleDateString()}
              </span>
            </div>
            <p style={styles.emailBody}>{email.body.substring(0, 200)}...</p>
            <div style={styles.emailActions}>
              <button
                style={styles.primaryButton}
                onClick={() => handleGenerateReply(email.id)}
              >
                AI Reply
              </button>
              <button style={styles.secondaryButton}>Mark as Read</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderScheduleTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.scheduleHeader}>
        <h2>{scheduleDate.toLocaleDateString()}</h2>
        <button style={styles.primaryButton} onClick={handleOptimizeSchedule}>
          Optimize Schedule
        </button>
      </div>

      <div style={styles.scheduleTimeline}>
        {scheduleEvents.map(event => (
          <div key={event.id} style={styles.scheduleEvent}>
            <div style={styles.eventTime}>
              {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={styles.eventDetails}>
              <h3 style={styles.eventTitle}>{event.title}</h3>
              <p style={styles.eventDescription}>{event.description}</p>
              {event.location && (
                <span style={styles.eventLocation}>📍 {event.location}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderPomodoroTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.pomodoroContainer}>
        <h2>Pomodoro Timer</h2>
        <div style={styles.pomodoroTimer}>
          <div style={styles.pomodoroDisplay}>{formatTime(pomodoroTime)}</div>
        </div>

        <div style={styles.pomodoroControls}>
          {!pomodoroSession ? (
            <button style={styles.largePrimaryButton} onClick={handleStartPomodoro}>
              Start Pomodoro
            </button>
          ) : (
            <>
              {pomodoroRunning ? (
                <button style={styles.largePrimaryButton} onClick={handlePausePomodoro}>
                  Pause
                </button>
              ) : (
                <button style={styles.largePrimaryButton} onClick={handleResumePomodoro}>
                  Resume
                </button>
              )}
            </>
          )}
        </div>

        {pomodoroSession && (
          <div style={styles.pomodoroStats}>
            <p>Session: {pomodoroSession.sessionCount}</p>
            <p>Status: {pomodoroSession.status}</p>
          </div>
        )}
      </div>
    </div>
  )

  const getPriorityBadgeStyle = (priority: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      padding: '4px 12px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: 600
    }

    switch (priority) {
      case 'high':
        return { ...baseStyle, background: '#FEE2E2', color: '#991B1B' }
      case 'medium':
        return { ...baseStyle, background: '#FEF3C7', color: '#92400E' }
      case 'low':
        return { ...baseStyle, background: '#DBEAFE', color: '#1E40AF' }
      default:
        return { ...baseStyle, background: '#F3F4F6', color: '#6B7280' }
    }
  }

  if (loading) {
    return <div style={styles.loading}>Loading...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Productivity Hub</h1>
      </div>

      <div style={styles.tabs}>
        <button
          style={activeTab === 'tasks' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('tasks')}
        >
          ✓ Tasks
        </button>
        <button
          style={activeTab === 'notes' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('notes')}
        >
          📝 Notes
        </button>
        <button
          style={activeTab === 'meetings' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('meetings')}
        >
          🎥 Meetings
        </button>
        <button
          style={activeTab === 'emails' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('emails')}
        >
          📧 Emails
        </button>
        <button
          style={activeTab === 'schedule' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('schedule')}
        >
          📅 Schedule
        </button>
        <button
          style={activeTab === 'pomodoro' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('pomodoro')}
        >
          ⏱️ Pomodoro
        </button>
      </div>

      {activeTab === 'tasks' && renderTasksTab()}
      {activeTab === 'notes' && renderNotesTab()}
      {activeTab === 'meetings' && renderMeetingsTab()}
      {activeTab === 'emails' && renderEmailsTab()}
      {activeTab === 'schedule' && renderScheduleTab()}
      {activeTab === 'pomodoro' && renderPomodoroTab()}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    marginBottom: '30px'
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: 0,
    color: '#1F2937'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '30px',
    borderBottom: '2px solid #E5E7EB',
    paddingBottom: '0'
  },
  tab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    fontSize: '16px',
    fontWeight: 500,
    color: '#6B7280',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  activeTab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid #3B82F6',
    fontSize: '16px',
    fontWeight: 600,
    color: '#3B82F6',
    cursor: 'pointer'
  },
  tabContent: {
    minHeight: '500px'
  },
  loading: {
    textAlign: 'center',
    padding: '100px',
    fontSize: '18px',
    color: '#6B7280'
  },
  // Task styles
  taskHeader: {
    marginBottom: '20px'
  },
  filterButtons: {
    display: 'flex',
    gap: '8px'
  },
  filterButton: {
    padding: '8px 16px',
    background: '#F3F4F6',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#6B7280'
  },
  activeFilterButton: {
    padding: '8px 16px',
    background: '#3B82F6',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    color: 'white',
    fontWeight: 600
  },
  createTaskForm: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    padding: '20px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px'
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  taskCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  taskCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  taskTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
    color: '#1F2937'
  },
  taskDescription: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '16px'
  },
  taskFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  taskDueDate: {
    fontSize: '14px',
    color: '#6B7280'
  },
  taskActions: {
    display: 'flex',
    gap: '8px'
  },
  actionButton: {
    padding: '8px 16px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  deleteButton: {
    padding: '8px 16px',
    background: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  // Notes styles
  notesContainer: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '20px',
    height: '700px'
  },
  notesList: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    overflowY: 'auto'
  },
  noteItem: {
    padding: '16px',
    marginTop: '12px',
    background: '#F9FAFB',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  activeNoteItem: {
    padding: '16px',
    marginTop: '12px',
    background: '#DBEAFE',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  noteItemTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#1F2937'
  },
  noteItemPreview: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 8px 0'
  },
  noteItemDate: {
    fontSize: '12px',
    color: '#9CA3AF'
  },
  noteEditor: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  noteTitleInput: {
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '20px',
    fontWeight: 600
  },
  noteTextarea: {
    flex: 1,
    padding: '16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.6',
    resize: 'none'
  },
  noteEditorActions: {
    display: 'flex',
    gap: '12px'
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#6B7280'
  },
  // Meeting styles
  meetingsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  meetingCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  meetingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  meetingTitle: {
    fontSize: '20px',
    fontWeight: 600,
    margin: 0,
    color: '#1F2937'
  },
  meetingTime: {
    fontSize: '14px',
    color: '#6B7280'
  },
  meetingDescription: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '12px'
  },
  meetingParticipants: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '16px'
  },
  meetingSummary: {
    padding: '16px',
    background: '#F9FAFB',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  // Email styles
  emailList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  emailCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  emailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  emailSubject: {
    fontSize: '18px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#1F2937'
  },
  emailFrom: {
    fontSize: '14px',
    color: '#6B7280',
    margin: 0
  },
  emailDate: {
    fontSize: '14px',
    color: '#9CA3AF'
  },
  emailBody: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '16px',
    lineHeight: '1.6'
  },
  emailActions: {
    display: 'flex',
    gap: '12px'
  },
  // Schedule styles
  scheduleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  scheduleTimeline: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  scheduleEvent: {
    display: 'flex',
    gap: '20px',
    padding: '16px',
    marginBottom: '12px',
    background: '#F9FAFB',
    borderRadius: '8px',
    borderLeft: '4px solid #3B82F6'
  },
  eventTime: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#3B82F6',
    minWidth: '80px'
  },
  eventDetails: {
    flex: 1
  },
  eventTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#1F2937'
  },
  eventDescription: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 8px 0'
  },
  eventLocation: {
    fontSize: '14px',
    color: '#6B7280'
  },
  // Pomodoro styles
  pomodoroContainer: {
    textAlign: 'center',
    padding: '60px'
  },
  pomodoroTimer: {
    margin: '40px 0'
  },
  pomodoroDisplay: {
    fontSize: '96px',
    fontWeight: 'bold',
    color: '#3B82F6',
    fontFamily: 'monospace'
  },
  pomodoroControls: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    marginBottom: '32px'
  },
  pomodoroStats: {
    fontSize: '16px',
    color: '#6B7280'
  },
  // Common button styles
  primaryButton: {
    padding: '12px 24px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  largePrimaryButton: {
    padding: '16px 48px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  secondaryButton: {
    padding: '12px 24px',
    background: '#F3F4F6',
    color: '#1F2937',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  }
}

export default TaskManagerUI

/**
 * Collaborative Whiteboard Component
 *
 * Real-time collaborative whiteboard with drawing, annotations, and team features
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  whiteboardService,
  forumService,
  calendarService,
  wikiService,
  shareCardsService
} from '../services/collaborationServices'
import type {
  Whiteboard,
  WhiteboardElement,
  ForumCategory,
  ForumThread,
  CalendarEvent,
  WikiPage,
  ShareCard
} from '../types/v4-types'

interface CollaborativeWhiteboardProps {
  workspaceId: string
  userId: string
}

export const CollaborativeWhiteboard: React.FC<CollaborativeWhiteboardProps> = ({ workspaceId, userId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [activeTab, setActiveTab] = useState<'whiteboard' | 'forum' | 'calendar' | 'wiki' | 'share'>('whiteboard')

  // Whiteboard state
  const [whiteboard, setWhiteboard] = useState<Whiteboard | null>(null)
  const [elements, setElements] = useState<WhiteboardElement[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<'pen' | 'eraser' | 'text' | 'shape'>('pen')
  const [color, setColor] = useState('#000000')
  const [lineWidth, setLineWidth] = useState(2)
  const [participants, setParticipants] = useState<string[]>([])

  // Forum state
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | null>(null)
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [newThreadTitle, setNewThreadTitle] = useState('')
  const [newThreadContent, setNewThreadContent] = useState('')

  // Calendar state
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDescription, setNewEventDescription] = useState('')

  // Wiki state
  const [wikiPages, setWikiPages] = useState<WikiPage[]>([])
  const [selectedPage, setSelectedPage] = useState<WikiPage | null>(null)
  const [editingPage, setEditingPage] = useState(false)
  const [pageContent, setPageContent] = useState('')

  // Share state
  const [shareCards, setShareCards] = useState<ShareCard[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [workspaceId, userId])

  useEffect(() => {
    if (whiteboard && canvasRef.current) {
      renderCanvas()
    }
  }, [elements, whiteboard])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load or create whiteboard
      const boards = await whiteboardService.getBoards(workspaceId)
      let board = boards.length > 0 ? boards[0] : null
      if (!board) {
        board = await whiteboardService.createBoard(workspaceId, 'Main Whiteboard')
      }
      setWhiteboard(board)
      setElements(board.elements)
      setParticipants(board.participants)

      // Load forum data
      const forumCategories = await forumService.getCategories(workspaceId)
      setCategories(forumCategories)

      // Load calendar events
      const calendarEvents = await calendarService.getEvents(workspaceId, selectedDate)
      setEvents(calendarEvents)

      // Load wiki pages
      const pages = await wikiService.getPages(workspaceId)
      setWikiPages(pages)

      // Load share cards
      const cards = await shareCardsService.getCards(workspaceId)
      setShareCards(cards)

      setLoading(false)
    } catch (error) {
      console.error('Failed to load collaboration data:', error)
      setLoading(false)
    }
  }

  // Whiteboard functions
  const renderCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    elements.forEach(element => {
      if (element.type === 'path') {
        ctx.strokeStyle = element.color || '#000000'
        ctx.lineWidth = element.lineWidth || 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        ctx.beginPath()
        const points = element.points || []
        if (points.length > 0) {
          ctx.moveTo(points[0].x, points[0].y)
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y)
          }
        }
        ctx.stroke()
      } else if (element.type === 'text') {
        ctx.fillStyle = element.color || '#000000'
        ctx.font = `${element.fontSize || 16}px Arial`
        ctx.fillText(element.text || '', element.x || 0, element.y || 0)
      } else if (element.type === 'rectangle') {
        ctx.strokeStyle = element.color || '#000000'
        ctx.lineWidth = element.lineWidth || 2
        ctx.strokeRect(element.x || 0, element.y || 0, element.width || 0, element.height || 0)
      } else if (element.type === 'circle') {
        ctx.strokeStyle = element.color || '#000000'
        ctx.lineWidth = element.lineWidth || 2
        ctx.beginPath()
        ctx.arc(element.x || 0, element.y || 0, element.radius || 0, 0, 2 * Math.PI)
        ctx.stroke()
      }
    })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!whiteboard) return

    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === 'pen' || tool === 'eraser') {
      const newElement: WhiteboardElement = {
        id: Date.now().toString(),
        type: 'path',
        points: [{ x, y }],
        color: tool === 'eraser' ? '#FFFFFF' : color,
        lineWidth: tool === 'eraser' ? lineWidth * 3 : lineWidth,
        userId
      }
      setElements([...elements, newElement])
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !whiteboard) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (tool === 'pen' || tool === 'eraser') {
      const lastElement = elements[elements.length - 1]
      if (lastElement && lastElement.type === 'path') {
        const updatedElement = {
          ...lastElement,
          points: [...(lastElement.points || []), { x, y }]
        }
        setElements([...elements.slice(0, -1), updatedElement])
      }
    }
  }

  const handleMouseUp = async () => {
    if (!isDrawing || !whiteboard) return

    setIsDrawing(false)

    // Save the latest element to the backend
    const lastElement = elements[elements.length - 1]
    if (lastElement) {
      await whiteboardService.addElement(whiteboard.id, lastElement)
    }
  }

  const handleClearCanvas = async () => {
    if (!whiteboard) return

    if (confirm('Are you sure you want to clear the whiteboard?')) {
      await whiteboardService.clearBoard(whiteboard.id)
      setElements([])
    }
  }

  const handleInviteUser = async () => {
    if (!whiteboard) return

    const email = prompt('Enter user email to invite:')
    if (email) {
      await whiteboardService.inviteUser(whiteboard.id, email)
      alert(`Invitation sent to ${email}`)
    }
  }

  // Forum functions
  const handleLoadThreads = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    if (category) {
      setSelectedCategory(category)
      const categoryThreads = await forumService.getThreads(categoryId)
      setThreads(categoryThreads)
    }
  }

  const handleCreateThread = async () => {
    if (!selectedCategory || !newThreadTitle.trim()) return

    await forumService.createThread(selectedCategory.id, userId, newThreadTitle, newThreadContent)
    const updatedThreads = await forumService.getThreads(selectedCategory.id)
    setThreads(updatedThreads)
    setNewThreadTitle('')
    setNewThreadContent('')
  }

  // Calendar functions
  const handleCreateEvent = async () => {
    if (!newEventTitle.trim()) return

    const startTime = new Date(selectedDate)
    startTime.setHours(9, 0, 0, 0)
    const endTime = new Date(selectedDate)
    endTime.setHours(10, 0, 0, 0)

    await calendarService.createEvent(workspaceId, {
      title: newEventTitle,
      description: newEventDescription,
      startTime,
      endTime,
      participants: [userId]
    })

    const updatedEvents = await calendarService.getEvents(workspaceId, selectedDate)
    setEvents(updatedEvents)
    setNewEventTitle('')
    setNewEventDescription('')
  }

  const handleRSVP = async (eventId: string, status: 'attending' | 'not-attending' | 'maybe') => {
    await calendarService.rsvp(eventId, userId, status)
    alert(`RSVP status updated to: ${status}`)
  }

  // Wiki functions
  const handleCreatePage = async () => {
    const title = prompt('Enter page title:')
    if (!title) return

    const page = await wikiService.createPage(workspaceId, title, '', userId)
    setWikiPages([...wikiPages, page])
    setSelectedPage(page)
    setPageContent('')
    setEditingPage(true)
  }

  const handleSavePage = async () => {
    if (!selectedPage) return

    const updated = await wikiService.updatePage(selectedPage.id, pageContent, userId)
    setWikiPages(wikiPages.map(p => p.id === updated.id ? updated : p))
    setSelectedPage(updated)
    setEditingPage(false)
  }

  // Share functions
  const handleCreateShareCard = async () => {
    if (!whiteboard) return

    const card = await shareCardsService.createCard(workspaceId, {
      title: whiteboard.name,
      type: 'whiteboard',
      resourceId: whiteboard.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week
    })

    setShareCards([...shareCards, card])
    alert(`Share link created: ${card.shareUrl}`)
  }

  const renderWhiteboardTab = () => (
    <div style={styles.whiteboardContainer}>
      <div style={styles.whiteboardToolbar}>
        <div style={styles.toolGroup}>
          <button
            style={tool === 'pen' ? styles.activeToolButton : styles.toolButton}
            onClick={() => setTool('pen')}
          >
             Pen
          </button>
          <button
            style={tool === 'eraser' ? styles.activeToolButton : styles.toolButton}
            onClick={() => setTool('eraser')}
          >
            >ù Eraser
          </button>
          <button
            style={tool === 'text' ? styles.activeToolButton : styles.toolButton}
            onClick={() => setTool('text')}
          >
            =Ý Text
          </button>
          <button
            style={tool === 'shape' ? styles.activeToolButton : styles.toolButton}
            onClick={() => setTool('shape')}
          >
            =7 Shape
          </button>
        </div>

        <div style={styles.toolGroup}>
          <label style={styles.colorLabel}>Color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={styles.colorPicker}
          />
          <label style={styles.widthLabel}>Width:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
            style={styles.slider}
          />
          <span style={styles.widthValue}>{lineWidth}px</span>
        </div>

        <div style={styles.toolGroup}>
          <button style={styles.secondaryButton} onClick={handleClearCanvas}>
            =Ñ Clear
          </button>
          <button style={styles.secondaryButton} onClick={handleInviteUser}>
            =e Invite
          </button>
          <button style={styles.primaryButton} onClick={handleCreateShareCard}>
            = Share
          </button>
        </div>
      </div>

      <div style={styles.canvasWrapper}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={600}
          style={styles.canvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>

      <div style={styles.participantsBar}>
        <h4>Active Participants ({participants.length})</h4>
        <div style={styles.participantsList}>
          {participants.map((participant, idx) => (
            <div key={idx} style={styles.participantBadge}>
              {participant}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderForumTab = () => (
    <div style={styles.forumContainer}>
      <div style={styles.forumSidebar}>
        <h3>Categories</h3>
        <div style={styles.categoriesList}>
          {categories.map(category => (
            <div
              key={category.id}
              style={selectedCategory?.id === category.id ? styles.activeCategoryCard : styles.categoryCard}
              onClick={() => handleLoadThreads(category.id)}
            >
              <h4>{category.name}</h4>
              <p style={styles.categoryDesc}>{category.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.forumMain}>
        {selectedCategory ? (
          <>
            <div style={styles.forumHeader}>
              <h3>{selectedCategory.name}</h3>
              <button style={styles.primaryButton}>New Thread</button>
            </div>

            <div style={styles.createThreadForm}>
              <input
                type="text"
                style={styles.input}
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                placeholder="Thread title..."
              />
              <textarea
                style={styles.textarea}
                value={newThreadContent}
                onChange={(e) => setNewThreadContent(e.target.value)}
                placeholder="Thread content..."
              />
              <button style={styles.primaryButton} onClick={handleCreateThread}>
                Create Thread
              </button>
            </div>

            <div style={styles.threadsList}>
              {threads.map(thread => (
                <div key={thread.id} style={styles.threadCard}>
                  <h4 style={styles.threadTitle}>{thread.title}</h4>
                  <p style={styles.threadMeta}>
                    By {thread.authorId} " {thread.posts.length} replies " {new Date(thread.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={styles.emptyState}>
            <p>Select a category to view threads</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderCalendarTab = () => (
    <div style={styles.calendarContainer}>
      <div style={styles.calendarHeader}>
        <h3>Team Calendar</h3>
        <input
          type="date"
          style={styles.dateInput}
          value={selectedDate.toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value))}
        />
      </div>

      <div style={styles.createEventForm}>
        <input
          type="text"
          style={styles.input}
          value={newEventTitle}
          onChange={(e) => setNewEventTitle(e.target.value)}
          placeholder="Event title..."
        />
        <input
          type="text"
          style={styles.input}
          value={newEventDescription}
          onChange={(e) => setNewEventDescription(e.target.value)}
          placeholder="Description..."
        />
        <button style={styles.primaryButton} onClick={handleCreateEvent}>
          Create Event
        </button>
      </div>

      <div style={styles.eventsList}>
        {events.map(event => (
          <div key={event.id} style={styles.eventCard}>
            <div style={styles.eventHeader}>
              <h4 style={styles.eventTitle}>{event.title}</h4>
              <span style={styles.eventTime}>
                {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p style={styles.eventDescription}>{event.description}</p>
            <div style={styles.eventActions}>
              <button style={styles.rsvpButton} onClick={() => handleRSVP(event.id, 'attending')}>
                 Attending
              </button>
              <button style={styles.rsvpButton} onClick={() => handleRSVP(event.id, 'maybe')}>
                ? Maybe
              </button>
              <button style={styles.rsvpButton} onClick={() => handleRSVP(event.id, 'not-attending')}>
                 Not Attending
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderWikiTab = () => (
    <div style={styles.wikiContainer}>
      <div style={styles.wikiSidebar}>
        <div style={styles.wikiSidebarHeader}>
          <h3>Pages</h3>
          <button style={styles.smallButton} onClick={handleCreatePage}>+</button>
        </div>
        <div style={styles.pagesList}>
          {wikiPages.map(page => (
            <div
              key={page.id}
              style={selectedPage?.id === page.id ? styles.activePageItem : styles.pageItem}
              onClick={() => {
                setSelectedPage(page)
                setPageContent(page.content)
                setEditingPage(false)
              }}
            >
              {page.title}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.wikiMain}>
        {selectedPage ? (
          <>
            <div style={styles.wikiHeader}>
              <h2>{selectedPage.title}</h2>
              {!editingPage && (
                <button style={styles.primaryButton} onClick={() => setEditingPage(true)}>
                  Edit
                </button>
              )}
            </div>

            {editingPage ? (
              <>
                <textarea
                  style={styles.wikiTextarea}
                  value={pageContent}
                  onChange={(e) => setPageContent(e.target.value)}
                />
                <div style={styles.wikiActions}>
                  <button style={styles.primaryButton} onClick={handleSavePage}>
                    Save
                  </button>
                  <button style={styles.secondaryButton} onClick={() => setEditingPage(false)}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div style={styles.wikiContent}>
                <pre style={styles.wikiPre}>{selectedPage.content}</pre>
              </div>
            )}
          </>
        ) : (
          <div style={styles.emptyState}>
            <p>Select a page or create a new one</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderShareTab = () => (
    <div style={styles.shareContainer}>
      <h3>Share Cards</h3>
      <p style={styles.description}>Create shareable links for your whiteboard and resources</p>

      <div style={styles.shareCardsList}>
        {shareCards.map(card => (
          <div key={card.id} style={styles.shareCardItem}>
            <div style={styles.shareCardHeader}>
              <h4>{card.title}</h4>
              <span style={styles.shareCardType}>{card.type}</span>
            </div>
            <div style={styles.shareCardUrl}>
              <input
                type="text"
                readOnly
                value={card.shareUrl}
                style={styles.shareUrlInput}
              />
              <button
                style={styles.copyButton}
                onClick={() => {
                  navigator.clipboard.writeText(card.shareUrl)
                  alert('Link copied!')
                }}
              >
                Copy
              </button>
            </div>
            <p style={styles.shareCardExpiry}>
              Expires: {new Date(card.expiresAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )

  if (loading) {
    return <div style={styles.loading}>Loading collaboration tools...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Collaboration Hub</h1>
      </div>

      <div style={styles.tabs}>
        <button
          style={activeTab === 'whiteboard' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('whiteboard')}
        >
          <¨ Whiteboard
        </button>
        <button
          style={activeTab === 'forum' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('forum')}
        >
          =¬ Forum
        </button>
        <button
          style={activeTab === 'calendar' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('calendar')}
        >
          =Å Calendar
        </button>
        <button
          style={activeTab === 'wiki' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('wiki')}
        >
          =Ö Wiki
        </button>
        <button
          style={activeTab === 'share' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('share')}
        >
          = Share
        </button>
      </div>

      {activeTab === 'whiteboard' && renderWhiteboardTab()}
      {activeTab === 'forum' && renderForumTab()}
      {activeTab === 'calendar' && renderCalendarTab()}
      {activeTab === 'wiki' && renderWikiTab()}
      {activeTab === 'share' && renderShareTab()}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1600px',
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
  loading: {
    textAlign: 'center',
    padding: '100px',
    fontSize: '18px',
    color: '#6B7280'
  },
  description: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '24px'
  },
  // Whiteboard styles
  whiteboardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  whiteboardToolbar: {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px'
  },
  toolGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  toolButton: {
    padding: '8px 16px',
    background: '#F3F4F6',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  activeToolButton: {
    padding: '8px 16px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  colorLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151'
  },
  colorPicker: {
    width: '40px',
    height: '32px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  widthLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginLeft: '16px'
  },
  slider: {
    width: '100px'
  },
  widthValue: {
    fontSize: '14px',
    color: '#6B7280',
    minWidth: '40px'
  },
  canvasWrapper: {
    background: 'white',
    borderRadius: '12px',
    border: '2px solid #E5E7EB',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  canvas: {
    cursor: 'crosshair',
    display: 'block'
  },
  participantsBar: {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  participantsList: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '12px'
  },
  participantBadge: {
    padding: '6px 12px',
    background: '#DBEAFE',
    color: '#1E40AF',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 500
  },
  // Forum styles
  forumContainer: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '20px'
  },
  forumSidebar: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    height: 'fit-content'
  },
  categoriesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  categoryCard: {
    padding: '12px',
    background: '#F9FAFB',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  activeCategoryCard: {
    padding: '12px',
    background: '#DBEAFE',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  categoryDesc: {
    fontSize: '13px',
    color: '#6B7280',
    margin: '4px 0 0 0'
  },
  forumMain: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  forumHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  createThreadForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
    padding: '16px',
    background: '#F9FAFB',
    borderRadius: '8px'
  },
  threadsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  threadCard: {
    padding: '16px',
    background: '#F9FAFB',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  threadTitle: {
    fontSize: '16px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#1F2937'
  },
  threadMeta: {
    fontSize: '13px',
    color: '#6B7280',
    margin: 0
  },
  // Calendar styles
  calendarContainer: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  calendarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  dateInput: {
    padding: '8px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '14px'
  },
  createEventForm: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    padding: '16px',
    background: '#F9FAFB',
    borderRadius: '8px'
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  eventCard: {
    padding: '20px',
    background: '#F9FAFB',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  eventHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  eventTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
    color: '#1F2937'
  },
  eventTime: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#3B82F6'
  },
  eventDescription: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '16px'
  },
  eventActions: {
    display: 'flex',
    gap: '8px'
  },
  rsvpButton: {
    padding: '8px 16px',
    background: '#F3F4F6',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  // Wiki styles
  wikiContainer: {
    display: 'grid',
    gridTemplateColumns: '250px 1fr',
    gap: '20px',
    height: '700px'
  },
  wikiSidebar: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    overflowY: 'auto'
  },
  wikiSidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  smallButton: {
    width: '28px',
    height: '28px',
    padding: '0',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  pageItem: {
    padding: '8px 12px',
    background: '#F9FAFB',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  activePageItem: {
    padding: '8px 12px',
    background: '#DBEAFE',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#1E40AF',
    cursor: 'pointer'
  },
  wikiMain: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto'
  },
  wikiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #E5E7EB'
  },
  wikiTextarea: {
    flex: 1,
    padding: '16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.6',
    fontFamily: 'inherit',
    resize: 'none'
  },
  wikiActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px'
  },
  wikiContent: {
    flex: 1,
    padding: '16px',
    background: '#F9FAFB',
    borderRadius: '8px',
    overflowY: 'auto'
  },
  wikiPre: {
    margin: 0,
    fontFamily: 'inherit',
    whiteSpace: 'pre-wrap',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#1F2937'
  },
  // Share styles
  shareContainer: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  shareCardsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  shareCardItem: {
    padding: '20px',
    background: '#F9FAFB',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  shareCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  shareCardType: {
    padding: '4px 12px',
    background: '#DBEAFE',
    color: '#1E40AF',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600
  },
  shareCardUrl: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px'
  },
  shareUrlInput: {
    flex: 1,
    padding: '8px 12px',
    background: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'monospace'
  },
  copyButton: {
    padding: '8px 16px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  shareCardExpiry: {
    fontSize: '13px',
    color: '#6B7280'
  },
  // Common styles
  input: {
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px'
  },
  textarea: {
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    minHeight: '100px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
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
  secondaryButton: {
    padding: '12px 24px',
    background: '#F3F4F6',
    color: '#1F2937',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    color: '#6B7280',
    fontSize: '16px'
  }
}

export default CollaborativeWhiteboard

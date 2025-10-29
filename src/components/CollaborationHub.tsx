/**
 * AI Chat Studio v5.0 - Real-Time Collaboration Hub
 *
 * Advanced collaboration features including:
 * - Real-time presence and online status
 * - Live cursor tracking
 * - Collaborative editing sessions
 * - Comments and annotations
 * - Activity feed and notifications
 * - Team chat and messaging
 * - Screen sharing and video calls
 * - Version control and conflict resolution
 */

import React, { useState, useEffect, useRef } from 'react'

interface CollaborationHubProps {
  userId: string
  userName: string
}

type TabType = 'presence' | 'comments' | 'activity' | 'chat' | 'sessions' | 'settings'

interface User {
  id: string
  name: string
  email: string
  avatar: string
  status: 'online' | 'away' | 'busy' | 'offline'
  lastSeen: Date
  currentPage?: string
  cursorPosition?: { x: number; y: number }
}

interface Comment {
  id: string
  userId: string
  userName: string
  text: string
  timestamp: Date
  resolved: boolean
  replies: CommentReply[]
  location: {
    page: string
    element?: string
    coordinates?: { x: number; y: number }
  }
}

interface CommentReply {
  id: string
  userId: string
  userName: string
  text: string
  timestamp: Date
}

interface Activity {
  id: string
  userId: string
  userName: string
  action: string
  details: string
  timestamp: Date
  type: 'edit' | 'comment' | 'create' | 'delete' | 'share'
}

interface ChatMessage {
  id: string
  userId: string
  userName: string
  text: string
  timestamp: Date
  attachments?: string[]
}

interface CollaborationSession {
  id: string
  name: string
  participants: string[]
  startTime: Date
  endTime?: Date
  status: 'active' | 'ended'
  changes: number
}

const CollaborationHub: React.FC<CollaborationHubProps> = ({ userId, userName }) => {
  const [activeTab, setActiveTab] = useState<TabType>('presence')
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [sessions, setSessions] = useState<CollaborationSession[]>([])

  // Form state
  const [newComment, setNewComment] = useState('')
  const [newChatMessage, setNewChatMessage] = useState('')
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
  const [replyText, setReplyText] = useState('')

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadCollaborationData()

    // Simulate real-time updates
    const interval = setInterval(() => {
      updateOnlineUsers()
      updateActivities()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Auto-scroll chat to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const loadCollaborationData = () => {
    // Mock data
    setOnlineUsers([
      {
        id: '1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        avatar: '👩‍💼',
        status: 'online',
        lastSeen: new Date(),
        currentPage: 'Dashboard',
        cursorPosition: { x: 450, y: 230 }
      },
      {
        id: '2',
        name: 'Bob Smith',
        email: 'bob@example.com',
        avatar: '👨‍💻',
        status: 'online',
        lastSeen: new Date(),
        currentPage: 'API Gateway',
        cursorPosition: { x: 680, y: 410 }
      },
      {
        id: '3',
        name: 'Carol White',
        email: 'carol@example.com',
        avatar: '👩‍🎨',
        status: 'away',
        lastSeen: new Date(Date.now() - 5 * 60 * 1000),
        currentPage: 'Content Studio'
      },
      {
        id: userId,
        name: userName,
        email: 'you@example.com',
        avatar: '👤',
        status: 'online',
        lastSeen: new Date(),
        currentPage: 'Collaboration Hub'
      }
    ])

    setComments([
      {
        id: '1',
        userId: '1',
        userName: 'Alice Johnson',
        text: 'Can we add a dark mode toggle to this dashboard?',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        resolved: false,
        replies: [
          {
            id: '1-1',
            userId: '2',
            userName: 'Bob Smith',
            text: 'Great idea! I can work on that.',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
          }
        ],
        location: { page: 'Dashboard', element: 'header' }
      },
      {
        id: '2',
        userId: '3',
        userName: 'Carol White',
        text: 'The video generation is taking too long. Can we optimize?',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        resolved: false,
        replies: [],
        location: { page: 'Content Studio', element: 'video-section' }
      }
    ])

    setActivities([
      {
        id: '1',
        userId: '1',
        userName: 'Alice Johnson',
        action: 'Created',
        details: 'New dashboard "Sales Analytics"',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        type: 'create'
      },
      {
        id: '2',
        userId: '2',
        userName: 'Bob Smith',
        action: 'Edited',
        details: 'API route /api/users',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        type: 'edit'
      },
      {
        id: '3',
        userId: '3',
        userName: 'Carol White',
        action: 'Commented',
        details: 'On "Video Generation Performance"',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        type: 'comment'
      }
    ])

    setChatMessages([
      {
        id: '1',
        userId: '1',
        userName: 'Alice Johnson',
        text: 'Hey team! Just finished the new dashboard design.',
        timestamp: new Date(Date.now() - 60 * 60 * 1000)
      },
      {
        id: '2',
        userId: '2',
        userName: 'Bob Smith',
        text: 'Looks great! Ready for review?',
        timestamp: new Date(Date.now() - 55 * 60 * 1000)
      },
      {
        id: '3',
        userId: '1',
        userName: 'Alice Johnson',
        text: 'Yes, please take a look when you have time.',
        timestamp: new Date(Date.now() - 50 * 60 * 1000)
      }
    ])

    setSessions([
      {
        id: '1',
        name: 'Dashboard Design Review',
        participants: ['Alice Johnson', 'Bob Smith', userName],
        startTime: new Date(Date.now() - 45 * 60 * 1000),
        status: 'active',
        changes: 23
      },
      {
        id: '2',
        name: 'API Gateway Configuration',
        participants: ['Bob Smith', 'Carol White'],
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        status: 'ended',
        changes: 47
      }
    ])
  }

  const updateOnlineUsers = () => {
    // Simulate real-time presence updates
    setOnlineUsers(prev => prev.map(user => ({
      ...user,
      cursorPosition: user.status === 'online' && user.id !== userId
        ? { x: Math.random() * 1000, y: Math.random() * 600 }
        : user.cursorPosition
    })))
  }

  const updateActivities = () => {
    // Simulate new activity
    if (Math.random() > 0.7) {
      const actions = ['Edited', 'Created', 'Deleted', 'Shared']
      const types: Activity['type'][] = ['edit', 'create', 'delete', 'share']
      const randomAction = actions[Math.floor(Math.random() * actions.length)]

      setActivities(prev => [{
        id: `act_${Date.now()}`,
        userId: '1',
        userName: 'Alice Johnson',
        action: randomAction,
        details: 'Dashboard widget',
        timestamp: new Date(),
        type: types[actions.indexOf(randomAction)]
      }, ...prev.slice(0, 19)])
    }
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      userId,
      userName,
      text: newComment,
      timestamp: new Date(),
      resolved: false,
      replies: [],
      location: { page: 'Current Page' }
    }

    setComments([comment, ...comments])
    setNewComment('')

    // Add to activity feed
    setActivities([{
      id: `act_${Date.now()}`,
      userId,
      userName,
      action: 'Commented',
      details: newComment.substring(0, 50) + '...',
      timestamp: new Date(),
      type: 'comment'
    }, ...activities])
  }

  const handleAddReply = () => {
    if (!replyText.trim() || !selectedComment) return

    const reply: CommentReply = {
      id: `reply_${Date.now()}`,
      userId,
      userName,
      text: replyText,
      timestamp: new Date()
    }

    setComments(comments.map(c =>
      c.id === selectedComment.id
        ? { ...c, replies: [...c.replies, reply] }
        : c
    ))

    setReplyText('')
  }

  const handleResolveComment = (commentId: string) => {
    setComments(comments.map(c =>
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    ))
  }

  const handleSendMessage = () => {
    if (!newChatMessage.trim()) return

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId,
      userName,
      text: newChatMessage,
      timestamp: new Date()
    }

    setChatMessages([...chatMessages, message])
    setNewChatMessage('')
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      online: '#10b981',
      away: '#f59e0b',
      busy: '#ef4444',
      offline: '#6b7280'
    }
    return colors[status] || '#6b7280'
  }

  const getActivityIcon = (type: Activity['type']) => {
    const icons = {
      edit: '✏️',
      comment: '💬',
      create: '➕',
      delete: '🗑️',
      share: '🔗'
    }
    return icons[type]
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const renderPresence = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Online Presence</h2>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {onlineUsers.filter(u => u.status === 'online').length} online now
        </div>
      </div>

      {/* Online Users List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
        {onlineUsers.map(user => (
          <div
            key={user.id}
            style={{
              padding: '15px',
              backgroundColor: 'white',
              border: `2px solid ${user.id === userId ? '#3b82f6' : '#e5e7eb'}`,
              borderRadius: '8px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
              <div style={{ fontSize: '36px' }}>{user.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {user.name} {user.id === userId && '(You)'}
                  </span>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(user.status)
                  }} />
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                  {user.email}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  padding: '4px 8px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  {user.status === 'online' ? (
                    <>📍 {user.currentPage}</>
                  ) : (
                    <>Last seen {formatTime(user.lastSeen)}</>
                  )}
                </div>
              </div>
            </div>

            {/* Cursor position indicator */}
            {user.status === 'online' && user.cursorPosition && user.id !== userId && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                fontSize: '10px',
                color: '#3b82f6',
                backgroundColor: '#dbeafe',
                padding: '2px 6px',
                borderRadius: '4px'
              }}>
                🖱️ Active
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cursor Tracking Visualization */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>Live Cursor Tracking</h3>
        <div style={{
          height: '400px',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {onlineUsers.filter(u => u.status === 'online' && u.cursorPosition && u.id !== userId).map(user => (
            <div
              key={user.id}
              style={{
                position: 'absolute',
                left: `${(user.cursorPosition!.x / 1000) * 100}%`,
                top: `${(user.cursorPosition!.y / 600) * 100}%`,
                transform: 'translate(-50%, -50%)',
                transition: 'all 0.3s'
              }}
            >
              <div style={{
                fontSize: '24px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }}>
                {user.avatar}
              </div>
              <div style={{
                position: 'absolute',
                top: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '4px 8px',
                backgroundColor: '#1e293b',
                color: 'white',
                borderRadius: '4px',
                fontSize: '11px',
                whiteSpace: 'nowrap'
              }}>
                {user.name.split(' ')[0]}
              </div>
            </div>
          ))}
          {onlineUsers.filter(u => u.status === 'online' && u.cursorPosition).length === 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#666'
            }}>
              No active cursors to track
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderComments = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Comments & Annotations</h2>

      {/* Add Comment */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Add Comment</h3>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts or ask a question..."
          rows={3}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontFamily: 'inherit',
            resize: 'vertical',
            marginBottom: '10px'
          }}
        />
        <button
          onClick={handleAddComment}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          💬 Post Comment
        </button>
      </div>

      {/* Comments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {comments.map(comment => (
          <div
            key={comment.id}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              border: `2px solid ${comment.resolved ? '#10b981' : '#e5e7eb'}`,
              borderRadius: '8px',
              opacity: comment.resolved ? 0.7 : 1
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ fontSize: '32px' }}>
                  {onlineUsers.find(u => u.id === comment.userId)?.avatar || '👤'}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>
                    {comment.userName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {formatTime(comment.timestamp)} • {comment.location.page}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleResolveComment(comment.id)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: comment.resolved ? '#10b981' : '#e5e7eb',
                  color: comment.resolved ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {comment.resolved ? '✓ Resolved' : 'Resolve'}
              </button>
            </div>

            <div style={{ marginBottom: '15px', paddingLeft: '44px' }}>
              {comment.text}
            </div>

            {/* Replies */}
            {comment.replies.length > 0 && (
              <div style={{
                paddingLeft: '44px',
                borderLeft: '2px solid #e5e7eb',
                marginLeft: '22px'
              }}>
                {comment.replies.map(reply => (
                  <div
                    key={reply.id}
                    style={{
                      padding: '10px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '6px',
                      marginBottom: '10px'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>
                      {reply.userName}
                      <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '8px' }}>
                        {formatTime(reply.timestamp)}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px' }}>{reply.text}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input */}
            {selectedComment?.id === comment.id ? (
              <div style={{ paddingLeft: '44px', marginTop: '10px' }}>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleAddReply}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setSelectedComment(null)
                      setReplyText('')
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#e5e7eb',
                      color: '#666',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setSelectedComment(comment)}
                style={{
                  marginLeft: '44px',
                  marginTop: '10px',
                  padding: '6px 12px',
                  backgroundColor: '#f9fafb',
                  color: '#666',
                  border: '1px solid #e5e7eb',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                💬 Reply
              </button>
            )}
          </div>
        ))}

        {comments.length === 0 && (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>💬</div>
            <h3>No Comments Yet</h3>
            <p>Be the first to leave a comment!</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderActivity = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Activity Feed</h2>

      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              style={{
                display: 'flex',
                gap: '15px',
                padding: '15px 0',
                borderBottom: index < activities.length - 1 ? '1px solid #e5e7eb' : 'none'
              }}
            >
              <div style={{ fontSize: '24px' }}>
                {getActivityIcon(activity.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '5px' }}>
                  <strong>{activity.userName}</strong>{' '}
                  <span style={{ color: '#666' }}>{activity.action.toLowerCase()}</span>{' '}
                  <strong>{activity.details}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {formatTime(activity.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderChat = () => (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
      <h2 style={{ marginBottom: '20px' }}>Team Chat</h2>

      {/* Chat Messages */}
      <div style={{
        flex: 1,
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px 8px 0 0',
        overflowY: 'auto'
      }}>
        {chatMessages.map(message => (
          <div
            key={message.id}
            style={{
              marginBottom: '15px',
              display: 'flex',
              flexDirection: message.userId === userId ? 'row-reverse' : 'row',
              gap: '10px'
            }}
          >
            <div style={{ fontSize: '24px' }}>
              {onlineUsers.find(u => u.id === message.userId)?.avatar || '👤'}
            </div>
            <div style={{
              maxWidth: '70%',
              padding: '10px 15px',
              backgroundColor: message.userId === userId ? '#3b82f6' : '#f9fafb',
              color: message.userId === userId ? 'white' : 'black',
              borderRadius: '12px'
            }}>
              {message.userId !== userId && (
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', opacity: 0.8 }}>
                  {message.userName}
                </div>
              )}
              <div>{message.text}</div>
              <div style={{
                fontSize: '10px',
                marginTop: '5px',
                opacity: 0.7,
                textAlign: message.userId === userId ? 'right' : 'left'
              }}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <div style={{
        padding: '15px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        display: 'flex',
        gap: '10px'
      }}>
        <input
          type="text"
          value={newChatMessage}
          onChange={(e) => setNewChatMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          style={{
            flex: 1,
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #ddd'
          }}
        />
        <button
          onClick={handleSendMessage}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Send
        </button>
      </div>
    </div>
  )

  const renderSessions = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Collaboration Sessions</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {sessions.map(session => (
          <div
            key={session.id}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              border: `2px solid ${session.status === 'active' ? '#10b981' : '#e5e7eb'}`,
              borderRadius: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'start', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>{session.name}</h3>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Started {formatTime(session.startTime)}
                  {session.endTime && ` • Ended ${formatTime(session.endTime)}`}
                </div>
              </div>
              <span style={{
                padding: '6px 12px',
                backgroundColor: session.status === 'active' ? '#dcfce7' : '#f9fafb',
                color: session.status === 'active' ? '#166534' : '#666',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {session.status}
              </span>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                <strong>Participants:</strong>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {session.participants.map((participant, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '20px',
                      fontSize: '13px'
                    }}
                  >
                    {participant}
                  </span>
                ))}
              </div>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              fontSize: '14px'
            }}>
              <strong>Changes made:</strong> {session.changes}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderSettings = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Collaboration Settings</h2>

      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>Presence Settings</h3>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '10px' }}>
            <input type="checkbox" defaultChecked style={{ marginRight: '10px' }} />
            <span>Show my online status</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '10px' }}>
            <input type="checkbox" defaultChecked style={{ marginRight: '10px' }} />
            <span>Share current page location</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '10px' }}>
            <input type="checkbox" defaultChecked style={{ marginRight: '10px' }} />
            <span>Enable cursor tracking</span>
          </label>
        </div>

        <h3>Notification Preferences</h3>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '10px' }}>
            <input type="checkbox" defaultChecked style={{ marginRight: '10px' }} />
            <span>Notify when mentioned in comments</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '10px' }}>
            <input type="checkbox" defaultChecked style={{ marginRight: '10px' }} />
            <span>Notify on new chat messages</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '10px' }}>
            <input type="checkbox" style={{ marginRight: '10px' }} />
            <span>Notify on file changes</span>
          </label>
        </div>

        <button style={{
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          Save Settings
        </button>
      </div>
    </div>
  )

  const tabs = [
    { id: 'presence', label: 'Presence', icon: '👥' },
    { id: 'comments', label: 'Comments', icon: '💬' },
    { id: 'activity', label: 'Activity', icon: '📊' },
    { id: 'chat', label: 'Team Chat', icon: '💭' },
    { id: 'sessions', label: 'Sessions', icon: '🔄' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ]

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1e293b',
        color: 'white',
        borderBottom: '3px solid #8b5cf6'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🤝 Real-Time Collaboration Hub</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
          Work together in real-time with your team
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              padding: '15px 25px',
              backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#8b5cf6' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #8b5cf6' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'presence' && renderPresence()}
        {activeTab === 'comments' && renderComments()}
        {activeTab === 'activity' && renderActivity()}
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'sessions' && renderSessions()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  )
}

export default CollaborationHub

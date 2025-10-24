import React, { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/store'
import { Button, Input } from './ui'
import { cn } from '@/utils'
import {
  UsersIcon,
  ShareIcon,
  LinkIcon,
  EyeIcon,
  PencilIcon,
  LockClosedIcon,
  LockOpenIcon,
  UserPlusIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  CursorArrowRaysIcon,
  HandRaisedIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'

interface User {
  id: string
  name: string
  avatar?: string
  color: string
  isActive: boolean
  lastActivity: number
  cursor?: {
    x: number
    y: number
    visible: boolean
  }
  selection?: {
    start: number
    end: number
    text: string
  }
}

interface CollaborationRoom {
  id: string
  name: string
  description: string
  owner: string
  isPublic: boolean
  password?: string
  maxUsers: number
  users: User[]
  permissions: {
    canEdit: boolean
    canInvite: boolean
    canShare: boolean
    canExport: boolean
  }
  createdAt: number
  lastActivity: number
}

interface ShareOptions {
  method: 'link' | 'email' | 'qr' | 'embed'
  permissions: 'view' | 'comment' | 'edit'
  expiresAt?: number
  requireAuth: boolean
  allowDownload: boolean
}

interface LiveCursor {
  userId: string
  position: { x: number; y: number }
  color: string
  userName: string
}

interface CollaborativeEditingProps {
  className?: string
  conversationId?: string
}

const CollaborativeEditing: React.FC<CollaborativeEditingProps> = ({
  className,
  conversationId
}) => {
  const { conversations, user } = useAppStore()
  const [activeRoom, setActiveRoom] = useState<CollaborationRoom | null>(null)
  const [rooms, setRooms] = useState<CollaborationRoom[]>([])
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    method: 'link',
    permissions: 'view',
    requireAuth: false,
    allowDownload: true
  })
  const [liveCursors, setLiveCursors] = useState<LiveCursor[]>([])
  const [currentUsers, setCurrentUsers] = useState<User[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')

  const cursorRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // Mock WebSocket connection
  const connectToRoom = (roomId: string) => {
    setConnectionStatus('connecting')

    // Simulate connection delay
    setTimeout(() => {
      setConnectionStatus('connected')
      setIsConnected(true)

      // Mock users joining
      const mockUsers: User[] = [
        {
          id: user?.id || 'current-user',
          name: user?.name || '当前用户',
          color: '#3B82F6',
          isActive: true,
          lastActivity: Date.now()
        },
        {
          id: 'user-2',
          name: '张明',
          color: '#EF4444',
          isActive: true,
          lastActivity: Date.now() - 30000
        },
        {
          id: 'user-3',
          name: 'Sarah',
          color: '#10B981',
          isActive: false,
          lastActivity: Date.now() - 300000
        }
      ]

      setCurrentUsers(mockUsers)

      // Simulate live cursors
      const mockCursors: LiveCursor[] = [
        {
          userId: 'user-2',
          position: { x: 150, y: 200 },
          color: '#EF4444',
          userName: '张明'
        }
      ]
      setLiveCursors(mockCursors)
    }, 2000)
  }

  // Initialize mock rooms
  useEffect(() => {
    const mockRooms: CollaborationRoom[] = [
      {
        id: 'room-1',
        name: 'AI项目讨论',
        description: '关于新AI产品功能的讨论和头脑风暴',
        owner: user?.id || 'current-user',
        isPublic: false,
        maxUsers: 10,
        users: [],
        permissions: {
          canEdit: true,
          canInvite: true,
          canShare: true,
          canExport: true
        },
        createdAt: Date.now() - 86400000,
        lastActivity: Date.now() - 3600000
      },
      {
        id: 'room-2',
        name: '产品需求分析',
        description: '产品经理和开发团队的协作空间',
        owner: 'other-user',
        isPublic: true,
        maxUsers: 20,
        users: [],
        permissions: {
          canEdit: false,
          canInvite: false,
          canShare: true,
          canExport: true
        },
        createdAt: Date.now() - 172800000,
        lastActivity: Date.now() - 7200000
      }
    ]
    setRooms(mockRooms)
  }, [user])

  // Mouse tracking for live cursors
  useEffect(() => {
    if (!isConnected || !editorRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = editorRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Update live cursor position (would send to WebSocket in real implementation)
      setLiveCursors(prev =>
        prev.map(cursor =>
          cursor.userId === (user?.id || 'current-user')
            ? { ...cursor, position: { x, y } }
            : cursor
        )
      )
    }

    const editor = editorRef.current
    editor.addEventListener('mousemove', handleMouseMove)

    return () => {
      editor.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isConnected, user])

  const createRoom = (name: string, description: string, isPublic: boolean, password?: string) => {
    const newRoom: CollaborationRoom = {
      id: `room-${Date.now()}`,
      name,
      description,
      owner: user?.id || 'current-user',
      isPublic,
      password,
      maxUsers: 10,
      users: [],
      permissions: {
        canEdit: true,
        canInvite: true,
        canShare: true,
        canExport: true
      },
      createdAt: Date.now(),
      lastActivity: Date.now()
    }

    setRooms(prev => [newRoom, ...prev])
    setActiveRoom(newRoom)
    connectToRoom(newRoom.id)
    setIsCreateRoomOpen(false)
  }

  const joinRoom = (room: CollaborationRoom) => {
    setActiveRoom(room)
    connectToRoom(room.id)
  }

  const leaveRoom = () => {
    setActiveRoom(null)
    setIsConnected(false)
    setConnectionStatus('disconnected')
    setCurrentUsers([])
    setLiveCursors([])
  }

  const generateShareLink = () => {
    if (!activeRoom) return ''

    const baseUrl = window.location.origin
    const roomId = activeRoom.id
    const permissions = shareOptions.permissions
    const auth = shareOptions.requireAuth ? '&auth=required' : ''

    return `${baseUrl}/collaborate/${roomId}?permission=${permissions}${auth}`
  }

  const copyShareLink = () => {
    const link = generateShareLink()
    navigator.clipboard.writeText(link)
    // Would show toast notification in real implementation
    console.log('Link copied:', link)
  }

  const exportCollaboration = () => {
    if (!activeRoom) return

    const exportData = {
      room: activeRoom,
      conversation: conversations.find(c => c.id === conversationId),
      users: currentUsers,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `collaboration-${activeRoom.name}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const CreateRoomModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">创建协作房间</h3>

        <form onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          createRoom(
            formData.get('name') as string,
            formData.get('description') as string,
            formData.get('isPublic') === 'on',
            formData.get('password') as string || undefined
          )
        }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                房间名称
              </label>
              <Input name="name" placeholder="输入房间名称" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                描述
              </label>
              <textarea
                name="description"
                placeholder="房间描述（可选）"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" name="isPublic" id="isPublic" className="rounded" />
              <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                公开房间
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                密码（可选）
              </label>
              <Input name="password" type="password" placeholder="设置房间密码" />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button type="submit" className="flex-1">创建房间</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateRoomOpen(false)}
            >
              取消
            </Button>
          </div>
        </form>
      </div>
    </div>
  )

  const ShareModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">分享协作</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsShareModalOpen(false)}
          >
            <XMarkIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              分享方式
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'link', label: '链接分享', icon: LinkIcon },
                { value: 'email', label: '邮件邀请', icon: ShareIcon },
                { value: 'qr', label: '二维码', icon: DocumentDuplicateIcon },
                { value: 'embed', label: '嵌入代码', icon: ClipboardDocumentIcon }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setShareOptions(prev => ({ ...prev, method: value as any }))}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border transition-colors',
                    shareOptions.method === value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              权限设置
            </label>
            <select
              value={shareOptions.permissions}
              onChange={(e) => setShareOptions(prev => ({ ...prev, permissions: e.target.value as any }))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="view">仅查看</option>
              <option value="comment">可评论</option>
              <option value="edit">可编辑</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={shareOptions.requireAuth}
                onChange={(e) => setShareOptions(prev => ({ ...prev, requireAuth: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">需要登录验证</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={shareOptions.allowDownload}
                onChange={(e) => setShareOptions(prev => ({ ...prev, allowDownload: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">允许下载</span>
            </label>
          </div>

          {shareOptions.method === 'link' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                分享链接
              </label>
              <div className="flex gap-2">
                <Input
                  value={generateShareLink()}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button onClick={copyShareLink} variant="outline" size="sm">
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button onClick={copyShareLink} className="flex-1">
            {shareOptions.method === 'link' ? '复制链接' : '发送邀请'}
          </Button>
          <Button variant="outline" onClick={() => setIsShareModalOpen(false)}>
            关闭
          </Button>
        </div>
      </div>
    </div>
  )

  if (!activeRoom) {
    return (
      <div className={cn('bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700', className)}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                <UsersIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">协作编辑</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">与团队成员实时协作讨论</p>
              </div>
            </div>
            <Button
              onClick={() => setIsCreateRoomOpen(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <UserPlusIcon className="h-4 w-4 mr-2" />
              创建房间
            </Button>
          </div>
        </div>

        {/* Room List */}
        <div className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">可用房间</h3>

            {rooms.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  暂无协作房间
                </h4>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  创建你的第一个协作房间开始团队协作
                </p>
                <Button onClick={() => setIsCreateRoomOpen(true)}>
                  创建房间
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => joinRoom(room)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {room.name}
                        </h4>
                        {room.isPublic ? (
                          <LockOpenIcon className="h-4 w-4 text-green-500" title="公开房间" />
                        ) : (
                          <LockClosedIcon className="h-4 w-4 text-orange-500" title="私有房间" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <UsersIcon className="h-4 w-4" />
                        <span>{room.users.length}/{room.maxUsers}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {room.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        创建于 {new Date(room.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        最后活动 {Math.floor((Date.now() - room.lastActivity) / 60000)} 分钟前
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-2">
                      {room.permissions.canEdit && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                          <PencilIcon className="h-3 w-3" />
                          可编辑
                        </span>
                      )}
                      {room.permissions.canShare && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-xs">
                          <ShareIcon className="h-3 w-3" />
                          可分享
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isCreateRoomOpen && <CreateRoomModal />}
      </div>
    )
  }

  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700', className)}>
      {/* Active Room Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={leaveRoom}
              className="text-gray-500 hover:text-gray-700"
            >
              ← 返回
            </Button>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{activeRoom.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{activeRoom.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-full text-sm',
              connectionStatus === 'connected'
                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                : connectionStatus === 'connecting'
                ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
            )}>
              <div className={cn(
                'w-2 h-2 rounded-full',
                connectionStatus === 'connected'
                  ? 'bg-green-500 animate-pulse'
                  : connectionStatus === 'connecting'
                  ? 'bg-yellow-500 animate-spin'
                  : 'bg-red-500'
              )} />
              {connectionStatus === 'connected' ? '已连接' : connectionStatus === 'connecting' ? '连接中...' : '已断开'}
            </div>

            <Button variant="outline" size="sm" onClick={() => setIsShareModalOpen(true)}>
              <ShareIcon className="h-4 w-4 mr-1" />
              分享
            </Button>

            <Button variant="outline" size="sm" onClick={exportCollaboration}>
              <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
              导出
            </Button>
          </div>
        </div>

        {/* Active Users */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">在线用户:</span>
            <div className="flex -space-x-2">
              {currentUsers.filter(u => u.isActive).map((user) => (
                <div
                  key={user.id}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white dark:border-gray-800"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.name.charAt(0)}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <UsersIcon className="h-4 w-4" />
            <span>{currentUsers.filter(u => u.isActive).length} 人在线</span>
          </div>
        </div>
      </div>

      {/* Collaboration Area */}
      <div className="relative h-96 overflow-hidden">
        <div
          ref={editorRef}
          className="w-full h-full p-6 bg-gray-50 dark:bg-gray-800 relative"
        >
          {/* Live Cursors */}
          {liveCursors.map((cursor) => (
            <div
              key={cursor.userId}
              className="absolute pointer-events-none z-10 transition-all duration-100"
              style={{
                left: cursor.position.x,
                top: cursor.position.y,
                transform: 'translate(-2px, -2px)'
              }}
            >
              <div className="flex items-center gap-1">
                <CursorArrowRaysIcon
                  className="h-5 w-5"
                  style={{ color: cursor.color }}
                />
                <span
                  className="px-2 py-1 text-xs text-white rounded shadow-lg whitespace-nowrap"
                  style={{ backgroundColor: cursor.color }}
                >
                  {cursor.userName}
                </span>
              </div>
            </div>
          ))}

          {/* Mock Collaboration Content */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">张明 正在编辑</span>
                <span className="text-xs text-gray-500">2分钟前</span>
              </div>
              <p className="text-gray-800 dark:text-gray-200">
                我觉得这个AI功能的用户体验还可以进一步优化，特别是语音交互这一块...
                <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">{user?.name || '当前用户'}</span>
                <span className="text-xs text-gray-500">刚刚</span>
              </div>
              <p className="text-gray-800 dark:text-gray-200">
                同意！我们可以考虑添加更多的语音反馈和个性化设置选项。
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Sarah</span>
                <span className="text-xs text-gray-500">5分钟前</span>
              </div>
              <p className="text-gray-800 dark:text-gray-200">
                我已经准备了一些用户测试的数据，稍后分享给大家参考。
              </p>
            </div>
          </div>

          {/* Typing Indicators */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-2 rounded-full shadow-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">张明 正在输入...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Collaboration Tools */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <VideoCameraIcon className="h-4 w-4 mr-1" />
              视频通话
            </Button>
            <Button variant="outline" size="sm">
              <MicrophoneIcon className="h-4 w-4 mr-1" />
              语音通话
            </Button>
            <Button variant="outline" size="sm">
              <HandRaisedIcon className="h-4 w-4 mr-1" />
              举手发言
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <EyeIcon className="h-4 w-4" />
              <span>3 人查看</span>
            </div>
            <div className="flex items-center gap-1">
              <PencilIcon className="h-4 w-4" />
              <span>1 人编辑</span>
            </div>
          </div>
        </div>
      </div>

      {isShareModalOpen && <ShareModal />}
    </div>
  )
}

export default CollaborativeEditing
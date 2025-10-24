import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UsersIcon,
  ShareIcon,
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  VideoCameraIcon,
  PhoneIcon,
  UserPlusIcon,
  CogIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import collaborationService, { type CollaborationSession, type CollaborationUser, type VoiceChatState } from '@/services/collaborationService'
import { Button } from './ui'
import { cn } from '@/utils'

interface CollaborationPanelProps {
  isOpen: boolean
  onClose: () => void
  conversationId: string
  className?: string
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  isOpen,
  onClose,
  conversationId,
  className
}) => {
  const [session, setSession] = useState<CollaborationSession | null>(null)
  const [participants, setParticipants] = useState<CollaborationUser[]>([])
  const [voiceChatState, setVoiceChatState] = useState<VoiceChatState>({
    isActive: false,
    participants: [],
    isMuted: false,
    isDeafened: false
  })
  const [shareLink, setShareLink] = useState<string>('')
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [permissions, setPermissions] = useState<'view' | 'edit' | 'comment'>('view')
  const [isConnected, setIsConnected] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      initializeCollaboration()
    }

    return () => {
      // Cleanup on unmount
      collaborationService.removeAllListeners()
    }
  }, [isOpen, conversationId])

  useEffect(() => {
    // Set up event listeners
    const handleSessionCreated = (newSession: CollaborationSession) => {
      setSession(newSession)
      setParticipants(newSession.participants)
    }

    const handleSessionJoined = (joinedSession: CollaborationSession) => {
      setSession(joinedSession)
      setParticipants(joinedSession.participants)
    }

    const handleUserJoined = (user: CollaborationUser) => {
      setParticipants(prev => [...prev.filter(p => p.id !== user.id), user])
    }

    const handleUserLeft = (user: CollaborationUser) => {
      setParticipants(prev => prev.filter(p => p.id !== user.id))
    }

    const handleVoiceChatUpdated = (state: VoiceChatState) => {
      setVoiceChatState(state)
    }

    const handleConnected = () => {
      setIsConnected(true)
    }

    const handleDisconnected = () => {
      setIsConnected(false)
    }

    collaborationService.on('session_created', handleSessionCreated)
    collaborationService.on('session_joined', handleSessionJoined)
    collaborationService.on('user_joined', handleUserJoined)
    collaborationService.on('user_left', handleUserLeft)
    collaborationService.on('voice_chat_updated', handleVoiceChatUpdated)
    collaborationService.on('connected', handleConnected)
    collaborationService.on('disconnected', handleDisconnected)

    return () => {
      collaborationService.off('session_created', handleSessionCreated)
      collaborationService.off('session_joined', handleSessionJoined)
      collaborationService.off('user_joined', handleUserJoined)
      collaborationService.off('user_left', handleUserLeft)
      collaborationService.off('voice_chat_updated', handleVoiceChatUpdated)
      collaborationService.off('connected', handleConnected)
      collaborationService.off('disconnected', handleDisconnected)
    }
  }, [])

  const initializeCollaboration = async () => {
    try {
      setIsCreating(true)

      // Initialize current user
      const currentUser = await collaborationService.initialize({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: 'Current User', // This would come from user context
        email: 'user@example.com',
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`
      })

      // Check if there's an existing session for this conversation
      const existingSession = collaborationService.getCurrentSession()
      if (existingSession && existingSession.conversationId === conversationId) {
        setSession(existingSession)
        setParticipants(existingSession.participants)
      } else {
        // Create new session
        const newSession = await collaborationService.createSession(conversationId, {
          allowEditing: true,
          allowComments: true,
          allowVoiceChat: true,
          shareMode: 'edit'
        })

        setSession(newSession)
        setParticipants(newSession.participants)
      }
    } catch (error) {
      console.error('Failed to initialize collaboration:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleStartVoiceChat = async () => {
    try {
      await collaborationService.startVoiceChat()
    } catch (error) {
      console.error('Failed to start voice chat:', error)
    }
  }

  const handleEndVoiceChat = async () => {
    try {
      await collaborationService.endVoiceChat()
    } catch (error) {
      console.error('Failed to end voice chat:', error)
    }
  }

  const handleToggleMute = () => {
    collaborationService.toggleMute()
  }

  const handleGenerateShareLink = () => {
    if (!session) return

    const link = collaborationService.generateShareLink(session.id, permissions)
    setShareLink(link)
    setShowShareDialog(true)
  }

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      // Show success feedback
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const getParticipantInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getConnectionStatus = () => {
    if (!isConnected) return { icon: ExclamationTriangleIcon, color: 'text-red-500', text: '已断开' }
    if (isCreating) return { icon: ClockIcon, color: 'text-yellow-500', text: '连接中...' }
    return { icon: CheckCircleIcon, color: 'text-green-500', text: '已连接' }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={cn(
            "bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <UsersIcon className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  实时协作
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  {(() => {
                    const status = getConnectionStatus()
                    return (
                      <>
                        <status.icon className={cn('w-3 h-3', status.color)} />
                        <span className={status.color}>{status.text}</span>
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Participants Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  参与者 ({participants.length})
                </h4>
                <Button
                  onClick={handleGenerateShareLink}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <UserPlusIcon className="w-4 h-4" />
                  邀请
                </Button>
              </div>

              <div className="space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                      style={{ backgroundColor: participant.color }}
                    >
                      {participant.avatar ? (
                        <img
                          src={participant.avatar}
                          alt={participant.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getParticipantInitials(participant.name)
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {participant.name}
                        </span>
                        {session?.owner === participant.id && (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                            主持人
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          participant.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                        {participant.isOnline ? '在线' : '离线'}
                      </div>
                    </div>
                    {voiceChatState.isActive && voiceChatState.participants.includes(participant.id) && (
                      <div className="flex items-center gap-1">
                        <MicrophoneIcon className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Voice Chat Section */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                语音聊天
              </h4>

              {!voiceChatState.isActive ? (
                <Button
                  onClick={handleStartVoiceChat}
                  className="w-full flex items-center justify-center gap-2"
                  disabled={!isConnected}
                >
                  <MicrophoneIcon className="w-4 h-4" />
                  开始语音聊天
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-green-700 dark:text-green-400">
                      语音聊天进行中
                    </span>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <Button
                      onClick={handleToggleMute}
                      variant={voiceChatState.isMuted ? "destructive" : "outline"}
                      size="icon"
                      title={voiceChatState.isMuted ? '取消静音' : '静音'}
                    >
                      {voiceChatState.isMuted ? (
                        <SpeakerXMarkIcon className="w-4 h-4" />
                      ) : (
                        <SpeakerWaveIcon className="w-4 h-4" />
                      )}
                    </Button>

                    <Button
                      onClick={handleEndVoiceChat}
                      variant="destructive"
                      size="icon"
                      title="结束通话"
                    >
                      <PhoneIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Section */}
            {session?.owner === collaborationService.getCurrentUser()?.id && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                  协作设置
                </h4>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={session.settings.allowEditing}
                      onChange={(e) => {
                        // Update session settings
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      允许编辑
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={session.settings.allowComments}
                      onChange={(e) => {
                        // Update session settings
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      允许评论
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={session.settings.allowVoiceChat}
                      onChange={(e) => {
                        // Update session settings
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      允许语音聊天
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Share Dialog */}
        {showShareDialog && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setShowShareDialog(false)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                分享协作链接
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    权限级别
                  </label>
                  <select
                    value={permissions}
                    onChange={(e) => setPermissions(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="view">仅查看</option>
                    <option value="comment">查看和评论</option>
                    <option value="edit">完全编辑</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    分享链接
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    />
                    <Button
                      onClick={handleCopyShareLink}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <ClipboardDocumentIcon className="w-4 h-4" />
                      复制
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => setShowShareDialog(false)}
                    variant="outline"
                  >
                    关闭
                  </Button>
                  <Button onClick={handleGenerateShareLink}>
                    重新生成
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default CollaborationPanel
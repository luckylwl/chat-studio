import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  UserGroupIcon,
  CursorArrowRaysIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'

export interface CollaboratorUser {
  id: string
  name: string
  avatar?: string
  color: string
  status: 'active' | 'idle' | 'away'
  cursor?: { x: number; y: number }
  currentlyEditing?: string
}

interface RealtimeCollaborationProps {
  conversationId: string
  currentUser: CollaboratorUser
  websocketUrl?: string
  enabled?: boolean
}

const RealtimeCollaboration: React.FC<RealtimeCollaborationProps> = ({
  conversationId,
  currentUser,
  websocketUrl,
  enabled = true,
}) => {
  const [collaborators, setCollaborators] = useState<CollaboratorUser[]>([])
  const [isConnected, setIsConnected] = useState(false)

  if (!enabled) return null

  return (
    <div className="realtime-collaboration">
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center gap-2 mb-2">
            <UserGroupIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {collaborators.length + 1} º(¿
            </span>
            {isConnected && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex -space-x-2">
            <div
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
              style={{ borderColor: currentUser.color, backgroundColor: currentUser.color }}
              title={`${currentUser.name} (`)`}
            >
              {currentUser.name[0]}
            </div>
            {collaborators.map((user) => (
              <motion.div
                key={user.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
                style={{ borderColor: user.color, backgroundColor: user.color }}
                title={user.name}
              >
                {user.name[0]}
                {user.currentlyEditing && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <PencilIcon className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealtimeCollaboration
export type { CollaboratorUser }

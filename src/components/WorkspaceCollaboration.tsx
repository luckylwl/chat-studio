import React, { useState, useEffect } from 'react'
import {
  Users, Plus, MessageCircle, Activity, Settings,
  Crown, Shield, Edit, Eye, Trash2, UserPlus
} from 'lucide-react'
import { Workspace, Comment, ActivityLog } from '../types'
import { collaborationService } from '../services/advancedFeaturesService'
import toast from 'react-hot-toast'

export const WorkspaceCollaboration: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [activeTab, setActiveTab] = useState<'members' | 'comments' | 'activity'>('members')
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false)
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  useEffect(() => {
    if (selectedWorkspace) {
      loadWorkspaceData()
    }
  }, [selectedWorkspace, activeTab])

  const loadWorkspaces = async () => {
    try {
      const data = await collaborationService.getAllWorkspaces()
      setWorkspaces(data)
      if (data.length > 0 && !selectedWorkspace) {
        setSelectedWorkspace(data[0])
      }
    } catch (error) {
      console.error('Error loading workspaces:', error)
    }
  }

  const loadWorkspaceData = async () => {
    if (!selectedWorkspace) return

    try {
      if (activeTab === 'comments') {
        const data = await collaborationService.getAllComments()
        setComments(data.filter(c => selectedWorkspace.conversationIds.includes(c.conversationId)))
      } else if (activeTab === 'activity') {
        const data = await collaborationService.getAllActivityLogs()
        setActivityLogs(data.slice(0, 50)) // Last 50 activities
      }
    } catch (error) {
      console.error('Error loading workspace data:', error)
    }
  }

  const createWorkspace = async (name: string, description: string) => {
    try {
      const newWorkspace = await collaborationService.createWorkspace({
        id: `ws_${Date.now()}`,
        name,
        description,
        ownerId: 'current_user',
        members: [{
          userId: 'current_user',
          role: 'owner',
          joinedAt: Date.now(),
          permissions: [
            { resource: 'conversation', actions: ['read', 'write', 'delete', 'share'] },
            { resource: 'document', actions: ['read', 'write', 'delete', 'share'] },
            { resource: 'settings', actions: ['read', 'write'] }
          ]
        }],
        conversationIds: [],
        knowledgeBaseIds: [],
        settings: {
          isPublic: false,
          allowInvites: true,
          defaultRole: 'viewer'
        }
      })

      setWorkspaces([...workspaces, newWorkspace])
      setSelectedWorkspace(newWorkspace)
      setShowNewWorkspaceModal(false)
      toast.success('Workspace created!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create workspace')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown size={16} className="text-yellow-500" />
      case 'admin':
        return <Shield size={16} className="text-blue-500" />
      case 'editor':
        return <Edit size={16} className="text-green-500" />
      case 'viewer':
        return <Eye size={16} className="text-gray-500" />
      default:
        return null
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'editor':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Team Workspaces
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Collaborate with your team in shared spaces
            </p>
          </div>
          <button
            onClick={() => setShowNewWorkspaceModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            New Workspace
          </button>
        </div>

        {/* Workspace Selector */}
        {workspaces.length > 0 && (
          <select
            value={selectedWorkspace?.id || ''}
            onChange={(e) => {
              const ws = workspaces.find(w => w.id === e.target.value)
              setSelectedWorkspace(ws || null)
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {workspaces.map(ws => (
              <option key={ws.id} value={ws.id}>
                {ws.name} ({ws.members.length} members)
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Content */}
      {selectedWorkspace ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
            <div className="flex gap-4">
              {['members', 'comments', 'activity'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-3 border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'members' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Members ({selectedWorkspace.members.length})
                  </h3>
                  <button
                    onClick={() => setShowInviteMemberModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <UserPlus size={16} />
                    Invite Member
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedWorkspace.members.map((member, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {member.userId.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {member.userId}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(member.joinedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {member.role !== 'owner' && (
                          <button className="text-gray-400 hover:text-red-600">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        {getRoleIcon(member.role)}
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getRoleBadgeColor(member.role)}`}>
                          {member.role.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <div className="font-medium mb-1">Permissions:</div>
                        <div className="space-y-1">
                          {member.permissions.map((perm, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="text-gray-500">•</span>
                              <span className="capitalize">{perm.resource}: </span>
                              <span className="text-xs">{perm.actions.join(', ')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Recent Comments ({comments.length})
                </h3>

                {comments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageCircle className="mx-auto mb-3" size={48} />
                    <p>No comments yet</p>
                    <p className="text-sm">Start a discussion on any message</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <div
                        key={comment.id}
                        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {comment.userId.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {comment.userId}
                              </span>
                              <span className="text-sm text-gray-500">
                                {new Date(comment.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">
                              {comment.content}
                            </p>
                            {comment.reactions.length > 0 && (
                              <div className="flex gap-2">
                                {comment.reactions.map((reaction, i) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm"
                                  >
                                    {reaction.emoji}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Activity Log ({activityLogs.length})
                </h3>

                {activityLogs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="mx-auto mb-3" size={48} />
                    <p>No activity yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activityLogs.map(log => (
                      <div
                        key={log.id}
                        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start gap-3">
                          <Activity className="text-blue-600 mt-1" size={16} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {log.userId}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {log.action}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {log.resourceType}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Users className="mx-auto mb-3" size={48} />
            <p className="mb-4">No workspaces yet</p>
            <button
              onClick={() => setShowNewWorkspaceModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Workspace
            </button>
          </div>
        </div>
      )}

      {/* New Workspace Modal */}
      {showNewWorkspaceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create Workspace
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                createWorkspace(
                  formData.get('name') as string,
                  formData.get('description') as string
                )
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g., Product Team"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="What is this workspace for?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewWorkspaceModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Invite Member
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                toast.success('Invitation sent!')
                setShowInviteMemberModal(false)
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="colleague@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowInviteMemberModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkspaceCollaboration

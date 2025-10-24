/**
 * Workspace Manager Component
 * Manages team workspaces and members
 */

import React, { useState, useEffect } from 'react'
import {
  UsersIcon,
  PlusIcon,
  TrashIcon,
  CogIcon,
  UserPlusIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { Button, Card } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import {
  workspaceService,
  type Workspace,
  type WorkspaceMember
} from '@/services/workspaceService'

interface WorkspaceManagerProps {
  onWorkspaceChange?: (workspace: Workspace | null) => void
  className?: string
}

const WorkspaceManager: React.FC<WorkspaceManagerProps> = ({
  onWorkspaceChange,
  className
}) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)

  // Create workspace form
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState('')

  // Invite member form
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member')

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    setIsLoading(true)
    try {
      await workspaceService.initialize()
      const wsList = workspaceService.listWorkspaces()
      setWorkspaces(wsList)

      const current = workspaceService.getCurrentWorkspace()
      setCurrentWorkspace(current)

      if (onWorkspaceChange) {
        onWorkspaceChange(current)
      }
    } catch (error: any) {
      toast.error(`加载失败: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('请输入工作空间名称')
      return
    }

    try {
      const workspace = await workspaceService.createWorkspace(
        newWorkspaceName,
        newWorkspaceDesc
      )

      setWorkspaces([...workspaces, workspace])
      setNewWorkspaceName('')
      setNewWorkspaceDesc('')
      setShowCreateModal(false)
      toast.success('工作空间创建成功')
    } catch (error: any) {
      toast.error(`创建失败: ${error.message}`)
    }
  }

  const switchWorkspace = async (workspaceId: string) => {
    try {
      await workspaceService.switchWorkspace(workspaceId)
      const workspace = workspaceService.getCurrentWorkspace()
      setCurrentWorkspace(workspace)

      if (onWorkspaceChange) {
        onWorkspaceChange(workspace)
      }

      toast.success(`已切换到 ${workspace?.name}`)
    } catch (error: any) {
      toast.error(`切换失败: ${error.message}`)
    }
  }

  const deleteWorkspace = async (workspaceId: string) => {
    const workspace = workspaces.find(w => w.id === workspaceId)
    if (!workspace) return

    if (!confirm(`确定要删除工作空间"${workspace.name}"吗？此操作不可恢复。`)) {
      return
    }

    try {
      await workspaceService.deleteWorkspace(workspaceId)
      setWorkspaces(workspaces.filter(w => w.id !== workspaceId))

      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace(null)
        if (onWorkspaceChange) {
          onWorkspaceChange(null)
        }
      }

      toast.success('工作空间已删除')
    } catch (error: any) {
      toast.error(`删除失败: ${error.message}`)
    }
  }

  const inviteMember = async () => {
    if (!currentWorkspace) return

    if (!inviteEmail.trim()) {
      toast.error('请输入邮箱地址')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      toast.error('邮箱格式不正确')
      return
    }

    try {
      const invite = await workspaceService.inviteMember(
        currentWorkspace.id,
        inviteEmail,
        inviteRole
      )

      toast.success(`已向 ${inviteEmail} 发送邀请`)
      setInviteEmail('')
      setInviteRole('member')
      setShowInviteModal(false)
    } catch (error: any) {
      toast.error(`邀请失败: ${error.message}`)
    }
  }

  const removeMember = async (userId: string) => {
    if (!currentWorkspace) return

    const member = currentWorkspace.members.find(m => m.userId === userId)
    if (!member) return

    if (!confirm(`确定要移除成员"${member.displayName}"吗？`)) {
      return
    }

    try {
      await workspaceService.removeMember(currentWorkspace.id, userId)
      await loadWorkspaces()
      toast.success('成员已移除')
    } catch (error: any) {
      toast.error(`移除失败: ${error.message}`)
    }
  }

  const updateMemberRole = async (userId: string, newRole: 'admin' | 'member' | 'viewer') => {
    if (!currentWorkspace) return

    try {
      await workspaceService.updateMemberRole(currentWorkspace.id, userId, newRole)
      await loadWorkspaces()
      toast.success('角色已更新')
    } catch (error: any) {
      toast.error(`更新失败: ${error.message}`)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'member':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return '所有者'
      case 'admin': return '管理员'
      case 'member': return '成员'
      case 'viewer': return '访客'
      default: return role
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UsersIcon className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            工作空间
          </h2>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          <PlusIcon className="w-4 h-4 mr-1" />
          新建空间
        </Button>
      </div>

      {/* Current Workspace Info */}
      {currentWorkspace && (
        <Card className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-primary-200 dark:border-primary-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {currentWorkspace.name}
              </h3>
              {currentWorkspace.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {currentWorkspace.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                <span>👥 {currentWorkspace.members.length} 成员</span>
                <span>🕒 创建于 {new Date(currentWorkspace.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMembersModal(true)}
                className="h-8 w-8 p-0"
                title="管理成员"
              >
                <UsersIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowInviteModal(true)}
                className="h-8 w-8 p-0"
                title="邀请成员"
              >
                <UserPlusIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Workspaces List */}
      <div className="space-y-2">
        {workspaces.length === 0 ? (
          <Card className="p-8 text-center">
            <UsersIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 dark:text-gray-400">
              还没有工作空间，创建一个开始协作吧
            </p>
          </Card>
        ) : (
          workspaces.map((workspace) => {
            const isCurrent = currentWorkspace?.id === workspace.id
            const isOwner = workspace.members.some(m => m.role === 'owner')

            return (
              <Card
                key={workspace.id}
                className={cn(
                  'p-4 cursor-pointer transition-all',
                  isCurrent
                    ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
                onClick={() => !isCurrent && switchWorkspace(workspace.id)}
              >
                <div className="flex items-start gap-3">
                  <UsersIcon className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {workspace.name}
                      </h3>
                      {isCurrent && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <CheckCircleIcon className="w-3 h-3 mr-1" />
                          当前
                        </span>
                      )}
                    </div>
                    {workspace.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {workspace.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>👥 {workspace.members.length} 成员</span>
                      <span>
                        🕒 {new Date(workspace.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteWorkspace(workspace.id)
                        }}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="删除"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              创建新工作空间
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  工作空间名称 *
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="例如: 产品团队、研发部门"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  描述 (可选)
                </label>
                <textarea
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  placeholder="简要描述这个工作空间的用途"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewWorkspaceName('')
                  setNewWorkspaceDesc('')
                }}
              >
                取消
              </Button>
              <Button onClick={createWorkspace}>
                创建
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && currentWorkspace && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              邀请成员加入 {currentWorkspace.name}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  邮箱地址 *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  角色
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="viewer">访客 - 只读权限</option>
                  <option value="member">成员 - 标准权限</option>
                  <option value="admin">管理员 - 完全管理权限</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowInviteModal(false)
                  setInviteEmail('')
                  setInviteRole('member')
                }}
              >
                取消
              </Button>
              <Button onClick={inviteMember}>
                发送邀请
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && currentWorkspace && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                工作空间成员 ({currentWorkspace.members.length})
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMembersModal(false)}
              >
                <XCircleIcon className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-2">
              {currentWorkspace.members.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                      {member.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {member.displayName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {member.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.role !== 'owner' ? (
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.userId, e.target.value as any)}
                        className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="viewer">访客</option>
                        <option value="member">成员</option>
                        <option value="admin">管理员</option>
                      </select>
                    ) : (
                      <span className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getRoleBadgeColor(member.role)
                      )}>
                        {getRoleLabel(member.role)}
                      </span>
                    )}
                    {member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMember(member.userId)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default WorkspaceManager

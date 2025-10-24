/**
 * Share Dialog Component
 * UI for sharing conversations with users and managing permissions
 */

import React, { useState, useEffect } from 'react'
import {
  ShareIcon,
  LinkIcon,
  UserPlusIcon,
  TrashIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  XMarkIcon,
  LockClosedIcon,
  LockOpenIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { Button, Card } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import {
  sharingService,
  type SharePermissions,
  type SharedUser
} from '@/services/sharingService'

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  conversationId: string
  conversationTitle: string
  className?: string
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  conversationId,
  conversationTitle,
  className
}) => {
  const [shareMode, setShareMode] = useState<'users' | 'link'>('users')
  const [isPublic, setIsPublic] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [isCreatingLink, setIsCreatingLink] = useState(false)

  // Share with users
  const [email, setEmail] = useState('')
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([])
  const [permissions, setPermissions] = useState<SharePermissions>({
    canView: true,
    canComment: true,
    canEdit: false,
    canShare: false,
    canDelete: false
  })

  // Link sharing options
  const [expiresIn, setExpiresIn] = useState<number | null>(null)
  const [linkPermissions, setLinkPermissions] = useState<SharePermissions>({
    canView: true,
    canComment: true,
    canEdit: false,
    canShare: false,
    canDelete: false
  })

  if (!isOpen) return null

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const handleAddUser = () => {
    if (!email.trim()) {
      toast.error('请输入邮箱地址')
      return
    }

    if (!validateEmail(email)) {
      toast.error('邮箱格式不正确')
      return
    }

    // Check if already added
    if (sharedUsers.some(u => u.email === email)) {
      toast.error('该用户已添加')
      return
    }

    const newUser: SharedUser = {
      email,
      permissions: { ...permissions },
      addedAt: Date.now()
    }

    setSharedUsers([...sharedUsers, newUser])
    setEmail('')
    toast.success(`已添加 ${email}`)
  }

  const handleRemoveUser = (userEmail: string) => {
    setSharedUsers(sharedUsers.filter(u => u.email !== userEmail))
    toast.success('已移除用户')
  }

  const handleUpdateUserPermissions = (userEmail: string, newPermissions: Partial<SharePermissions>) => {
    setSharedUsers(sharedUsers.map(u =>
      u.email === userEmail
        ? { ...u, permissions: { ...u.permissions, ...newPermissions } }
        : u
    ))
  }

  const handleShare = async () => {
    if (sharedUsers.length === 0) {
      toast.error('请至少添加一个用户')
      return
    }

    try {
      const shared = await sharingService.shareConversation(
        conversationId,
        conversationTitle,
        sharedUsers.map(u => ({
          email: u.email,
          permissions: u.permissions
        })),
        {
          isPublic
        }
      )

      toast.success(`已分享给 ${sharedUsers.length} 个用户`)
      setShareUrl(shared.shareUrl)
      setSharedUsers([])
      setEmail('')
    } catch (error: any) {
      toast.error(`分享失败: ${error.message}`)
    }
  }

  const handleCreateLink = async () => {
    setIsCreatingLink(true)

    try {
      const link = await sharingService.createShareLink(
        conversationId,
        linkPermissions,
        {
          expiresIn: expiresIn || undefined
        }
      )

      setShareUrl(link.url)
      toast.success('分享链接已创建')
    } catch (error: any) {
      toast.error(`创建失败: ${error.message}`)
    } finally {
      setIsCreatingLink(false)
    }
  }

  const handleCopyLink = () => {
    if (!shareUrl) return

    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('链接已复制到剪贴板')

    setTimeout(() => setCopied(false), 2000)
  }

  const getPermissionLabel = (key: keyof SharePermissions): string => {
    const labels = {
      canView: '查看',
      canComment: '评论',
      canEdit: '编辑',
      canShare: '分享',
      canDelete: '删除'
    }
    return labels[key]
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className={cn('w-full max-w-2xl p-6 space-y-6', className)}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShareIcon className="w-6 h-6 text-primary-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                分享对话
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                {conversationTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Share Mode Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShareMode('users')}
            className={cn(
              'px-4 py-2 font-medium transition-colors border-b-2',
              shareMode === 'users'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            )}
          >
            <UserPlusIcon className="w-4 h-4 inline mr-1" />
            分享给用户
          </button>
          <button
            onClick={() => setShareMode('link')}
            className={cn(
              'px-4 py-2 font-medium transition-colors border-b-2',
              shareMode === 'link'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            )}
          >
            <LinkIcon className="w-4 h-4 inline mr-1" />
            创建链接
          </button>
        </div>

        {/* Share with Users */}
        {shareMode === 'users' && (
          <div className="space-y-4">
            {/* Public Toggle */}
            <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
              />
              <LockOpenIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  公开分享
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  任何人都可以通过链接访问
                </div>
              </div>
            </label>

            {/* Add User */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                添加用户
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddUser()}
                  placeholder="user@example.com"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <Button onClick={handleAddUser}>
                  <UserPlusIcon className="w-4 h-4 mr-1" />
                  添加
                </Button>
              </div>
            </div>

            {/* Default Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                默认权限
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(permissions).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setPermissions({
                        ...permissions,
                        [key]: e.target.checked
                      })}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {getPermissionLabel(key as keyof SharePermissions)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Shared Users List */}
            {sharedUsers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  已添加的用户 ({sharedUsers.length})
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sharedUsers.map((user) => (
                    <div
                      key={user.email}
                      className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {user.email}
                        </div>
                        <div className="flex gap-2 mt-1">
                          {Object.entries(user.permissions)
                            .filter(([_, value]) => value)
                            .map(([key]) => (
                              <span
                                key={key}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300"
                              >
                                {getPermissionLabel(key as keyof SharePermissions)}
                              </span>
                            ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(user.email)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share Button */}
            <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="ghost" onClick={onClose}>
                取消
              </Button>
              <Button
                onClick={handleShare}
                disabled={sharedUsers.length === 0}
              >
                <ShareIcon className="w-4 h-4 mr-1" />
                分享
              </Button>
            </div>
          </div>
        )}

        {/* Create Link */}
        {shareMode === 'link' && (
          <div className="space-y-4">
            {/* Link Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                链接权限
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(linkPermissions).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setLinkPermissions({
                        ...linkPermissions,
                        [key]: e.target.checked
                      })}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {getPermissionLabel(key as keyof SharePermissions)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Expiration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <ClockIcon className="w-4 h-4 inline mr-1" />
                过期时间
              </label>
              <select
                value={expiresIn || ''}
                onChange={(e) => setExpiresIn(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="">永不过期</option>
                <option value={3600000}>1 小时</option>
                <option value={86400000}>1 天</option>
                <option value={604800000}>7 天</option>
                <option value={2592000000}>30 天</option>
              </select>
            </div>

            {/* Generate Link Button */}
            {!shareUrl && (
              <Button
                onClick={handleCreateLink}
                disabled={isCreatingLink}
                className="w-full"
              >
                <LinkIcon className="w-4 h-4 mr-1" />
                {isCreatingLink ? '创建中...' : '生成分享链接'}
              </Button>
            )}

            {/* Share URL Display */}
            {shareUrl && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-900 dark:text-green-100">
                    链接已创建
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-mono text-gray-900 dark:text-gray-100"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="w-4 h-4 mr-1" />
                        已复制
                      </>
                    ) : (
                      <>
                        <ClipboardDocumentIcon className="w-4 h-4 mr-1" />
                        复制
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Close Button */}
            {shareUrl && (
              <div className="flex justify-end">
                <Button onClick={onClose}>
                  完成
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

export default ShareDialog

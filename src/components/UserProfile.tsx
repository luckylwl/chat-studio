/**
 * User Profile Management Component
 * Allows users to view and edit their profile information
 */

import React, { useState, useEffect } from 'react'
import {
  UserCircleIcon,
  PencilIcon,
  PhotoIcon,
  KeyIcon,
  CheckIcon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { Button, Card } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import { authService, type User, type UserPreferences } from '@/services/authService'

interface UserProfileProps {
  onLogout?: () => void
  className?: string
}

const UserProfile: React.FC<UserProfileProps> = ({ onLogout, className }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Profile edit state
  const [displayName, setDisplayName] = useState('')
  const [avatar, setAvatar] = useState('')

  // Preferences edit state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [language, setLanguage] = useState('zh-CN')
  const [notifications, setNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(false)

  // Password change state
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = () => {
    const currentUser = authService.getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      setDisplayName(currentUser.displayName)
      setAvatar(currentUser.avatar || '')
      setTheme(currentUser.preferences.theme)
      setLanguage(currentUser.preferences.language)
      setNotifications(currentUser.preferences.notifications)
      setEmailNotifications(currentUser.preferences.emailNotifications)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (user) {
      setDisplayName(user.displayName)
      setAvatar(user.avatar || '')
      setTheme(user.preferences.theme)
      setLanguage(user.preferences.language)
      setNotifications(user.preferences.notifications)
      setEmailNotifications(user.preferences.emailNotifications)
    }
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)

    try {
      const updates: Partial<User> = {
        displayName,
        avatar: avatar || undefined,
        preferences: {
          theme,
          language,
          notifications,
          emailNotifications,
          timezone: user.preferences.timezone
        }
      }

      const updatedUser = await authService.updateProfile(updates)
      setUser(updatedUser)
      setIsEditing(false)
      toast.success('个人资料已更新')
    } catch (error: any) {
      toast.error(error.message || '更新失败')
    } finally {
      setIsSaving(false)
    }
  }

  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!oldPassword) {
      errors.oldPassword = '请输入当前密码'
    }

    if (!newPassword) {
      errors.newPassword = '请输入新密码'
    } else if (newPassword.length < 6) {
      errors.newPassword = '新密码至少需要 6 个字符'
    }

    if (!confirmNewPassword) {
      errors.confirmNewPassword = '请确认新密码'
    } else if (confirmNewPassword !== newPassword) {
      errors.confirmNewPassword = '两次输入的密码不一致'
    }

    if (oldPassword && newPassword && oldPassword === newPassword) {
      errors.newPassword = '新密码不能与当前密码相同'
    }

    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return
    }

    setIsSaving(true)

    try {
      await authService.changePassword(oldPassword, newPassword)
      toast.success('密码已更改')
      setIsChangingPassword(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setPasswordErrors({})
    } catch (error: any) {
      toast.error(error.message || '密码更改失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    if (confirm('确定要退出登录吗？')) {
      try {
        await authService.logout()
        toast.success('已退出登录')
        if (onLogout) {
          onLogout()
        }
      } catch (error: any) {
        toast.error('退出失败')
      }
    }
  }

  if (!user) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <p className="text-gray-600 dark:text-gray-400">未登录</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCircleIcon className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            个人资料
          </h2>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-2">
            <Button onClick={handleEdit} size="sm" variant="ghost">
              <PencilIcon className="w-4 h-4 mr-1" />
              编辑
            </Button>
            <Button
              onClick={handleLogout}
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4 mr-1" />
              退出
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card className="p-6 space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {isEditing && (
              <button
                className="absolute bottom-0 right-0 p-1.5 bg-primary-500 rounded-full text-white hover:bg-primary-600 transition-colors"
                title="更换头像"
              >
                <PhotoIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  显示名称
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {user.displayName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  @{user.username}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              邮箱
            </label>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-gray-100">
              {user.email}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              角色
            </label>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className={cn(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                user.role === 'admin' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                user.role === 'user' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                user.role === 'guest' && 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
              )}>
                {user.role === 'admin' && '管理员'}
                {user.role === 'user' && '用户'}
                {user.role === 'guest' && '访客'}
              </span>
            </div>
          </div>
        </div>

        {/* Preferences */}
        {isEditing && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">偏好设置</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  主题
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="light">浅色</option>
                  <option value="dark">深色</option>
                  <option value="system">跟随系统</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  语言
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="zh-CN">简体中文</option>
                  <option value="zh-TW">繁體中文</option>
                  <option value="en-US">English</option>
                  <option value="ja-JP">日本語</option>
                </select>
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  启用通知
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  启用邮件通知
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Edit Actions */}
        {isEditing && (
          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleCancel}
              variant="ghost"
              disabled={isSaving}
            >
              <XMarkIcon className="w-4 h-4 mr-1" />
              取消
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              <CheckIcon className="w-4 h-4 mr-1" />
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        )}
      </Card>

      {/* Account Info */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-gray-600 dark:text-gray-400">注册时间</div>
            <div className="font-medium text-gray-900 dark:text-gray-100 mt-1">
              {new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-gray-600 dark:text-gray-400">最后登录</div>
            <div className="font-medium text-gray-900 dark:text-gray-100 mt-1">
              {new Date(user.lastLoginAt).toLocaleDateString()}
            </div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="text-gray-600 dark:text-gray-400">用户 ID</div>
            <div className="font-mono text-xs text-gray-900 dark:text-gray-100 mt-1">
              {user.id}
            </div>
          </div>
        </div>
      </Card>

      {/* Password Change Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              安全设置
            </h3>
          </div>
          {!isChangingPassword && (
            <Button
              onClick={() => setIsChangingPassword(true)}
              size="sm"
              variant="outline"
            >
              更改密码
            </Button>
          )}
        </div>

        {isChangingPassword && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                当前密码
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg',
                  'bg-white dark:bg-gray-800',
                  'text-gray-900 dark:text-gray-100',
                  passwordErrors.oldPassword
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                )}
              />
              {passwordErrors.oldPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordErrors.oldPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                新密码
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少 6 个字符"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg',
                  'bg-white dark:bg-gray-800',
                  'text-gray-900 dark:text-gray-100',
                  passwordErrors.newPassword
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                )}
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordErrors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                确认新密码
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="再次输入新密码"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg',
                  'bg-white dark:bg-gray-800',
                  'text-gray-900 dark:text-gray-100',
                  passwordErrors.confirmNewPassword
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                )}
              />
              {passwordErrors.confirmNewPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {passwordErrors.confirmNewPassword}
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => {
                  setIsChangingPassword(false)
                  setOldPassword('')
                  setNewPassword('')
                  setConfirmNewPassword('')
                  setPasswordErrors({})
                }}
                variant="ghost"
                disabled={isSaving}
              >
                取消
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={isSaving}
              >
                {isSaving ? '更改中...' : '确认更改'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default UserProfile

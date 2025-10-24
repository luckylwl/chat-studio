/**
 * Login and Registration Modal
 * Provides user authentication interface with form validation
 */

import React, { useState } from 'react'
import { XMarkIcon, UserCircleIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { Button, Card } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import { authService, type LoginCredentials, type RegisterData } from '@/services/authService'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  defaultMode?: 'login' | 'register'
}

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)
  const [isLoading, setIsLoading] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)

  // Register form state
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerUsername, setRegisterUsername] = useState('')
  const [registerDisplayName, setRegisterDisplayName] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({})

  if (!isOpen) return null

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const validateLoginForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!loginEmail.trim()) {
      newErrors.email = '请输入邮箱'
    } else if (!validateEmail(loginEmail)) {
      newErrors.email = '邮箱格式不正确'
    }

    if (!loginPassword) {
      newErrors.password = '请输入密码'
    } else if (loginPassword.length < 6) {
      newErrors.password = '密码至少需要 6 个字符'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateRegisterForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!registerEmail.trim()) {
      newErrors.email = '请输入邮箱'
    } else if (!validateEmail(registerEmail)) {
      newErrors.email = '邮箱格式不正确'
    }

    if (!registerUsername.trim()) {
      newErrors.username = '请输入用户名'
    } else if (registerUsername.length < 3) {
      newErrors.username = '用户名至少需要 3 个字符'
    } else if (!/^[a-zA-Z0-9_-]+$/.test(registerUsername)) {
      newErrors.username = '用户名只能包含字母、数字、下划线和连字符'
    }

    if (!registerDisplayName.trim()) {
      newErrors.displayName = '请输入显示名称'
    }

    if (!registerPassword) {
      newErrors.password = '请输入密码'
    } else if (registerPassword.length < 6) {
      newErrors.password = '密码至少需要 6 个字符'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = '请确认密码'
    } else if (confirmPassword !== registerPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateLoginForm()) {
      return
    }

    setIsLoading(true)

    try {
      const credentials: LoginCredentials = {
        email: loginEmail,
        password: loginPassword,
        rememberMe
      }

      const user = await authService.login(credentials)

      toast.success(`欢迎回来，${user.displayName}！`)

      // Reset form
      setLoginEmail('')
      setLoginPassword('')
      setErrors({})

      if (onSuccess) {
        onSuccess()
      }

      onClose()
    } catch (error: any) {
      toast.error(error.message || '登录失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateRegisterForm()) {
      return
    }

    setIsLoading(true)

    try {
      const data: RegisterData = {
        email: registerEmail,
        username: registerUsername,
        displayName: registerDisplayName,
        password: registerPassword
      }

      const user = await authService.register(data)

      toast.success(`注册成功，欢迎 ${user.displayName}！`)

      // Reset form
      setRegisterEmail('')
      setRegisterUsername('')
      setRegisterDisplayName('')
      setRegisterPassword('')
      setConfirmPassword('')
      setErrors({})

      if (onSuccess) {
        onSuccess()
      }

      onClose()
    } catch (error: any) {
      toast.error(error.message || '注册失败')
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login')
    setErrors({})
  }

  const handleClose = () => {
    if (!isLoading) {
      setErrors({})
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCircleIcon className="w-6 h-6 text-primary-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {mode === 'login' ? '登录' : '注册账号'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                邮箱地址
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isLoading}
                  className={cn(
                    'w-full pl-10 pr-3 py-2 border rounded-lg',
                    'bg-white dark:bg-gray-800',
                    'text-gray-900 dark:text-gray-100',
                    'placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors.email
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                密码
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className={cn(
                    'w-full pl-10 pr-3 py-2 border rounded-lg',
                    'bg-white dark:bg-gray-800',
                    'text-gray-900 dark:text-gray-100',
                    'placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors.password
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  记住我
                </span>
              </label>
              <button
                type="button"
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                disabled={isLoading}
              >
                忘记密码？
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '登录中...' : '登录'}
            </Button>

            {/* Demo Account Hint */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 演示账号：demo@example.com / demo123
              </p>
            </div>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                邮箱地址 *
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  placeholder="your@email.com"
                  disabled={isLoading}
                  className={cn(
                    'w-full pl-10 pr-3 py-2 border rounded-lg',
                    'bg-white dark:bg-gray-800',
                    'text-gray-900 dark:text-gray-100',
                    'placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors.email
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                用户名 *
              </label>
              <input
                type="text"
                value={registerUsername}
                onChange={(e) => setRegisterUsername(e.target.value)}
                placeholder="username123"
                disabled={isLoading}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg',
                  'bg-white dark:bg-gray-800',
                  'text-gray-900 dark:text-gray-100',
                  'placeholder:text-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  errors.username
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                )}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.username}
                </p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                显示名称 *
              </label>
              <input
                type="text"
                value={registerDisplayName}
                onChange={(e) => setRegisterDisplayName(e.target.value)}
                placeholder="你的名字"
                disabled={isLoading}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg',
                  'bg-white dark:bg-gray-800',
                  'text-gray-900 dark:text-gray-100',
                  'placeholder:text-gray-400',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  errors.displayName
                    ? 'border-red-500'
                    : 'border-gray-300 dark:border-gray-600'
                )}
              />
              {errors.displayName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.displayName}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                密码 *
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="至少 6 个字符"
                  disabled={isLoading}
                  className={cn(
                    'w-full pl-10 pr-3 py-2 border rounded-lg',
                    'bg-white dark:bg-gray-800',
                    'text-gray-900 dark:text-gray-100',
                    'placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors.password
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                确认密码 *
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  disabled={isLoading}
                  className={cn(
                    'w-full pl-10 pr-3 py-2 border rounded-lg',
                    'bg-white dark:bg-gray-800',
                    'text-gray-900 dark:text-gray-100',
                    'placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors.confirmPassword
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '注册中...' : '注册账号'}
            </Button>
          </form>
        )}

        {/* Switch Mode */}
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {mode === 'login' ? '还没有账号？' : '已有账号？'}
            <button
              type="button"
              onClick={switchMode}
              disabled={isLoading}
              className="ml-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              {mode === 'login' ? '立即注册' : '立即登录'}
            </button>
          </p>
        </div>
      </Card>
    </div>
  )
}

export default LoginModal

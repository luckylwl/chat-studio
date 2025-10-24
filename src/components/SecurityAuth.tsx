import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  QrCodeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import securityService from '@/services/securityService'
import encryptionService from '@/services/encryptionService'

interface SecurityAuthProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess?: () => void
  onAuthFailure?: (error: string) => void
  authType?: 'unlock' | 'setup' | 'verify'
  className?: string
}

interface PasswordStrength {
  score: number
  label: string
  color: string
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    numbers: boolean
    specialChars: boolean
  }
}

const SecurityAuth: React.FC<SecurityAuthProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onAuthFailure,
  authType = 'unlock',
  className
}) => {
  const [step, setStep] = useState<'password' | 'twoFactor' | 'biometric' | 'setup'>('password')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0)
  const [qrCode, setQrCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  const policy = securityService.getPolicy()
  const maxAttempts = policy.maxFailedAttempts

  useEffect(() => {
    if (authType === 'setup') {
      setStep('setup')
    } else {
      setStep('password')
    }
  }, [authType, isOpen])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLocked && lockTimeRemaining > 0) {
      interval = setInterval(() => {
        setLockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsLocked(false)
            setAttempts(0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isLocked, lockTimeRemaining])

  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    const requirements = {
      length: pwd.length >= policy.passwordComplexity.minLength,
      uppercase: policy.passwordComplexity.requireUppercase ? /[A-Z]/.test(pwd) : true,
      lowercase: policy.passwordComplexity.requireLowercase ? /[a-z]/.test(pwd) : true,
      numbers: policy.passwordComplexity.requireNumbers ? /\d/.test(pwd) : true,
      specialChars: policy.passwordComplexity.requireSpecialChars ? /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) : true
    }

    const score = Object.values(requirements).filter(Boolean).length
    const maxScore = Object.keys(requirements).length

    let label = '很弱'
    let color = 'red'

    if (score === maxScore) {
      label = '很强'
      color = 'green'
    } else if (score >= maxScore - 1) {
      label = '强'
      color = 'yellow'
    } else if (score >= maxScore - 2) {
      label = '中等'
      color = 'orange'
    }

    return {
      score: (score / maxScore) * 100,
      label,
      color,
      requirements
    }
  }

  const handlePasswordSubmit = async () => {
    if (isLocked) return

    setIsLoading(true)
    setError('')

    try {
      const success = await securityService.authenticateUser({
        password,
        twoFactorCode: policy.enableTwoFactor ? undefined : '000000' // Bypass if 2FA not enabled
      })

      if (success) {
        if (policy.enableTwoFactor && !twoFactorCode) {
          setStep('twoFactor')
        } else {
          onAuthSuccess?.()
          resetForm()
        }
        setAttempts(0)
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        if (newAttempts >= maxAttempts) {
          setIsLocked(true)
          setLockTimeRemaining(60) // 1 minute lock
          setError(`账户已锁定 60 秒`)
        } else {
          setError(`密码错误，还剩 ${maxAttempts - newAttempts} 次尝试`)
        }

        onAuthFailure?.(`Authentication failed: ${newAttempts}/${maxAttempts} attempts`)
      }
    } catch (error) {
      setError('认证失败，请重试')
      onAuthFailure?.(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTwoFactorSubmit = async () => {
    setIsLoading(true)
    setError('')

    try {
      const success = await securityService.authenticateUser({
        password,
        twoFactorCode
      })

      if (success) {
        onAuthSuccess?.()
        resetForm()
      } else {
        setError('两步验证码错误')
        onAuthFailure?.('Two-factor authentication failed')
      }
    } catch (error) {
      setError('两步验证失败')
      onAuthFailure?.(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetupPassword = async () => {
    setIsLoading(true)
    setError('')

    try {
      if (password !== confirmPassword) {
        setError('密码不匹配')
        return
      }

      const strength = calculatePasswordStrength(password)
      if (strength.score < 80) {
        setError('密码强度不够，请选择更强的密码')
        return
      }

      // Initialize encryption with the new password
      await encryptionService.initialize(password)

      // Initialize security service
      await securityService.initialize('user-' + Date.now())

      if (policy.enableTwoFactor) {
        await setupTwoFactor()
        setStep('twoFactor')
      } else {
        onAuthSuccess?.()
        resetForm()
      }
    } catch (error) {
      setError('设置失败，请重试')
      onAuthFailure?.(error instanceof Error ? error.message : 'Setup failed')
    } finally {
      setIsLoading(false)
    }
  }

  const setupTwoFactor = async () => {
    // Generate QR code for TOTP setup
    const secret = await generateTOTPSecret()
    const qrCodeData = `otpauth://totp/AI%20Chat%20Studio?secret=${secret}&issuer=AI%20Chat%20Studio`
    setQrCode(qrCodeData)

    // Generate backup codes
    const codes = await generateBackupCodes()
    setBackupCodes(codes)
  }

  const generateTOTPSecret = async (): Promise<string> => {
    // Simplified TOTP secret generation
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += chars[Math.floor(Math.random() * chars.length)]
    }
    return secret
  }

  const generateBackupCodes = async (): Promise<string[]> => {
    const codes = []
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substr(2, 8).toUpperCase()
      codes.push(code)
    }
    return codes
  }

  const resetForm = () => {
    setPassword('')
    setConfirmPassword('')
    setTwoFactorCode('')
    setError('')
    setAttempts(0)
    setIsLocked(false)
    setStep('password')
    onClose()
  }

  const handleClose = () => {
    resetForm()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && !isLocked) {
      if (step === 'password') {
        handlePasswordSubmit()
      } else if (step === 'twoFactor') {
        handleTwoFactorSubmit()
      } else if (step === 'setup') {
        handleSetupPassword()
      }
    }
  }

  const passwordStrength = calculatePasswordStrength(password)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50" onClick={handleClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={cn(
            "inline-block w-full max-w-md p-6 my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl",
            className
          )}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {authType === 'setup' ? '安全设置' : authType === 'verify' ? '身份验证' : '解锁会话'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {authType === 'setup' ? '设置您的安全认证' : '请输入密码以继续'}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 'password' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      密码
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                        placeholder="输入您的密码"
                        disabled={isLocked}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        disabled={isLocked}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isLocked && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                      <span className="text-sm text-red-700 dark:text-red-300">
                        账户已锁定 {lockTimeRemaining} 秒
                      </span>
                    </div>
                  )}

                  {attempts > 0 && !isLocked && (
                    <div className="text-sm text-yellow-600 dark:text-yellow-400">
                      警告: {attempts}/{maxAttempts} 次失败尝试
                    </div>
                  )}

                  {error && (
                    <div className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handlePasswordSubmit}
                      disabled={!password || isLoading || isLocked}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <LockClosedIcon className="h-4 w-4 mr-2" />
                      )}
                      {isLoading ? '验证中...' : '解锁'}
                    </Button>
                  </div>
                </div>
              )}

              {step === 'setup' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      设置密码
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                        placeholder="创建安全密码"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    {password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">密码强度</span>
                          <span className={`font-medium text-${passwordStrength.color}-600`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full bg-${passwordStrength.color}-500 transition-all duration-300`}
                            style={{ width: `${passwordStrength.score}%` }}
                          />
                        </div>
                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                          {Object.entries(passwordStrength.requirements).map(([key, met]) => (
                            <div key={key} className="flex items-center gap-2">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                met ? 'bg-green-500' : 'bg-gray-300'
                              )} />
                              <span className={met ? 'text-green-600' : 'text-gray-500'}>
                                {key === 'length' && `至少 ${policy.passwordComplexity.minLength} 个字符`}
                                {key === 'uppercase' && '包含大写字母'}
                                {key === 'lowercase' && '包含小写字母'}
                                {key === 'numbers' && '包含数字'}
                                {key === 'specialChars' && '包含特殊字符'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      确认密码
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="再次输入密码"
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">密码不匹配</p>
                    )}
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleClose}
                      className="flex-1"
                    >
                      取消
                    </Button>
                    <Button
                      onClick={handleSetupPassword}
                      disabled={!password || !confirmPassword || password !== confirmPassword || isLoading || passwordStrength.score < 80}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <KeyIcon className="h-4 w-4 mr-2" />
                      )}
                      {isLoading ? '设置中...' : '设置密码'}
                    </Button>
                  </div>
                </div>
              )}

              {step === 'twoFactor' && (
                <div className="space-y-4">
                  {authType === 'setup' ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          设置两步验证
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          使用认证应用扫描二维码
                        </p>
                      </div>

                      {qrCode && (
                        <div className="flex justify-center">
                          <div className="w-48 h-48 bg-white p-4 rounded-lg border">
                            <QrCodeIcon className="w-full h-full text-gray-800" />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          验证码
                        </label>
                        <input
                          type="text"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          onKeyDown={handleKeyDown}
                          className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-widest"
                          placeholder="输入 6 位验证码"
                          maxLength={6}
                        />
                      </div>

                      {backupCodes.length > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                            备用恢复码
                          </h5>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                            请保存这些恢复码，在无法使用认证应用时可以使用
                          </p>
                          <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                            {backupCodes.map((code, index) => (
                              <div key={index} className="text-yellow-800 dark:text-yellow-200">
                                {code}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <DevicePhoneMobileIcon className="h-4 w-4 inline mr-1" />
                        两步验证码
                      </label>
                      <input
                        type="text"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-widest"
                        placeholder="输入 6 位验证码"
                        maxLength={6}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        请输入认证应用中显示的 6 位数字
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep('password')}
                      className="flex-1"
                    >
                      返回
                    </Button>
                    <Button
                      onClick={authType === 'setup' ? handleSetupPassword : handleTwoFactorSubmit}
                      disabled={twoFactorCode.length !== 6 || isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                      )}
                      {isLoading ? '验证中...' : authType === 'setup' ? '完成设置' : '验证'}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}

export default SecurityAuth
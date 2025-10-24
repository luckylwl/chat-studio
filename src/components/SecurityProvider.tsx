import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  ShieldCheckIcon,
  KeyIcon,
  LockClosedIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface SecuritySettings {
  enableEncryption: boolean
  enablePrivacyMode: boolean
  autoLockTimeout: number
  requireAuth: boolean
  enableAuditLog: boolean
  dataRetentionDays: number
  allowExternalSharing: boolean
  enableSecureMode: boolean
}

interface SecurityEvent {
  id: string
  type: 'login' | 'logout' | 'data_access' | 'data_export' | 'settings_change' | 'security_breach'
  timestamp: number
  userId: string
  details: string
  ipAddress?: string
  userAgent?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface SecurityContextType {
  settings: SecuritySettings
  updateSettings: (settings: Partial<SecuritySettings>) => void
  encrypt: (data: string) => Promise<string>
  decrypt: (encryptedData: string) => Promise<string>
  isLocked: boolean
  lock: () => void
  unlock: (password: string) => Promise<boolean>
  auditLog: SecurityEvent[]
  logSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => void
  sanitizeData: (data: any) => any
  checkDataIntegrity: (data: any) => boolean
}

const SecurityContext = createContext<SecurityContextType | null>(null)

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext)
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider')
  }
  return context
}

// Simple encryption/decryption utilities
class CryptoUtils {
  private static readonly ALGORITHM = 'AES-GCM'
  private static readonly KEY_LENGTH = 256

  static async generateKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  static async encrypt(data: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder()
    const iv = window.crypto.getRandomValues(new Uint8Array(12))

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      key,
      encoder.encode(data)
    )

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)

    return btoa(String.fromCharCode(...combined))
  }

  static async decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
    try {
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      )

      const iv = combined.slice(0, 12)
      const encrypted = combined.slice(12)

      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        encrypted
      )

      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt data')
    }
  }

  static hashData(data: string): string {
    // Simple hash for demo purposes (in production, use proper cryptographic hash)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(16)
  }
}

interface SecurityProviderProps {
  children: React.ReactNode
}

export const SecurityProvider: React.FC<SecurityProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SecuritySettings>({
    enableEncryption: true,
    enablePrivacyMode: false,
    autoLockTimeout: 15, // minutes
    requireAuth: false,
    enableAuditLog: true,
    dataRetentionDays: 30,
    allowExternalSharing: true,
    enableSecureMode: false
  })

  const [isLocked, setIsLocked] = useState(false)
  const [auditLog, setAuditLog] = useState<SecurityEvent[]>([])
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null)
  const [lockTimer, setLockTimer] = useState<NodeJS.Timeout | null>(null)

  // Initialize encryption key
  useEffect(() => {
    const initCrypto = async () => {
      try {
        const key = await CryptoUtils.generateKey()
        setCryptoKey(key)
      } catch (error) {
        console.error('Failed to initialize encryption:', error)
        toast.error('加密初始化失败')
      }
    }

    if (settings.enableEncryption) {
      initCrypto()
    }
  }, [settings.enableEncryption])

  // Auto-lock functionality
  useEffect(() => {
    if (settings.autoLockTimeout > 0 && !isLocked) {
      const timer = setTimeout(() => {
        lock()
      }, settings.autoLockTimeout * 60 * 1000)

      setLockTimer(timer)

      return () => {
        if (timer) clearTimeout(timer)
      }
    }
  }, [settings.autoLockTimeout, isLocked])

  // Reset lock timer on user activity
  useEffect(() => {
    const resetLockTimer = () => {
      if (lockTimer) {
        clearTimeout(lockTimer)
        if (settings.autoLockTimeout > 0 && !isLocked) {
          const timer = setTimeout(() => {
            lock()
          }, settings.autoLockTimeout * 60 * 1000)
          setLockTimer(timer)
        }
      }
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => {
      document.addEventListener(event, resetLockTimer, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetLockTimer)
      })
    }
  }, [lockTimer, settings.autoLockTimeout, isLocked])

  const updateSettings = (newSettings: Partial<SecuritySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))

    logSecurityEvent({
      type: 'settings_change',
      userId: 'current-user',
      details: `Security settings updated: ${Object.keys(newSettings).join(', ')}`,
      severity: 'medium'
    })

    toast.success('安全设置已更新')
  }

  const encrypt = async (data: string): Promise<string> => {
    if (!settings.enableEncryption || !cryptoKey) {
      return data
    }

    try {
      return await CryptoUtils.encrypt(data, cryptoKey)
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('数据加密失败')
    }
  }

  const decrypt = async (encryptedData: string): Promise<string> => {
    if (!settings.enableEncryption || !cryptoKey) {
      return encryptedData
    }

    try {
      return await CryptoUtils.decrypt(encryptedData, cryptoKey)
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('数据解密失败')
    }
  }

  const lock = () => {
    setIsLocked(true)
    logSecurityEvent({
      type: 'logout',
      userId: 'current-user',
      details: 'Application locked due to inactivity',
      severity: 'low'
    })
    toast.info('应用已锁定')
  }

  const unlock = async (password: string): Promise<boolean> => {
    // Mock authentication (in real app, verify against secure backend)
    const isValidPassword = password === 'admin' || password === '123456'

    if (isValidPassword) {
      setIsLocked(false)
      logSecurityEvent({
        type: 'login',
        userId: 'current-user',
        details: 'Application unlocked successfully',
        severity: 'low'
      })
      toast.success('应用已解锁')
      return true
    } else {
      logSecurityEvent({
        type: 'security_breach',
        userId: 'current-user',
        details: 'Failed unlock attempt with incorrect password',
        severity: 'high'
      })
      toast.error('密码错误')
      return false
    }
  }

  const logSecurityEvent = (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => {
    if (!settings.enableAuditLog) return

    const newEvent: SecurityEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      ...event
    }

    setAuditLog(prev => {
      const updated = [newEvent, ...prev]
      // Keep only recent events based on retention policy
      const cutoff = Date.now() - (settings.dataRetentionDays * 24 * 60 * 60 * 1000)
      return updated.filter(e => e.timestamp > cutoff).slice(0, 1000) // Max 1000 events
    })

    // Alert for critical events
    if (event.severity === 'critical') {
      toast.error(`安全警告: ${event.details}`)
    }
  }

  const sanitizeData = (data: any): any => {
    if (!settings.enablePrivacyMode) return data

    // Recursively sanitize object
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        // Replace sensitive patterns
        return obj
          .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
          .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
          .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
          .replace(/\b(?:\+1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, '[PHONE]')
      } else if (Array.isArray(obj)) {
        return obj.map(sanitize)
      } else if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = {}
        for (const [key, value] of Object.entries(obj)) {
          // Skip sensitive keys
          if (['password', 'apiKey', 'token', 'secret'].some(sensitive =>
            key.toLowerCase().includes(sensitive))) {
            sanitized[key] = '[REDACTED]'
          } else {
            sanitized[key] = sanitize(value)
          }
        }
        return sanitized
      }
      return obj
    }

    return sanitize(data)
  }

  const checkDataIntegrity = (data: any): boolean => {
    try {
      // Basic integrity check
      if (data === null || data === undefined) return true

      // Check for malicious patterns
      const maliciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /data:text\/html/gi,
        /vbscript:/gi
      ]

      const dataStr = JSON.stringify(data)
      return !maliciousPatterns.some(pattern => pattern.test(dataStr))
    } catch (error) {
      console.error('Data integrity check failed:', error)
      return false
    }
  }

  // Monitor for security threats
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && settings.enableSecureMode) {
        logSecurityEvent({
          type: 'data_access',
          userId: 'current-user',
          details: 'Application became hidden - potential privacy concern',
          severity: 'low'
        })
      }
    }

    const handleBeforeUnload = () => {
      if (settings.enableSecureMode) {
        logSecurityEvent({
          type: 'logout',
          userId: 'current-user',
          details: 'Application is being closed',
          severity: 'low'
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [settings.enableSecureMode])

  const value: SecurityContextType = {
    settings,
    updateSettings,
    encrypt,
    decrypt,
    isLocked,
    lock,
    unlock,
    auditLog,
    logSecurityEvent,
    sanitizeData,
    checkDataIntegrity
  }

  return (
    <SecurityContext.Provider value={value}>
      {children}

      {/* Security Lock Screen */}
      {isLocked && <SecurityLockScreen onUnlock={unlock} />}
    </SecurityContext.Provider>
  )
}

// Lock screen component
interface SecurityLockScreenProps {
  onUnlock: (password: string) => Promise<boolean>
}

const SecurityLockScreen: React.FC<SecurityLockScreenProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('')
  const [isUnlocking, setIsUnlocking] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) return

    setIsUnlocking(true)
    try {
      await onUnlock(password)
      setPassword('')
    } catch (error) {
      console.error('Unlock failed:', error)
    } finally {
      setIsUnlocking(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-900/95 backdrop-blur-lg z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-6">
          <LockClosedIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            应用已锁定
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            请输入密码以解锁应用
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="sr-only">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              disabled={isUnlocking}
            />
          </div>

          <button
            type="submit"
            disabled={!password.trim() || isUnlocking}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isUnlocking ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                解锁中...
              </div>
            ) : (
              '解锁'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          提示: 演示密码为 "admin" 或 "123456"
        </div>
      </div>
    </div>
  )
}

export default SecurityProvider
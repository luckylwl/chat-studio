/**
 * 安全工具函数
 * 提供加密、解密、XSS防护等安全功能
 */

import CryptoJS from 'crypto-js'
import DOMPurify from 'dompurify'

// 加密密钥（生产环境应该从环境变量读取）
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default-encryption-key-change-in-production'

/**
 * 加密 API 密钥
 */
export function encryptApiKey(apiKey: string): string {
  try {
    return CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString()
  } catch (error) {
    console.error('Failed to encrypt API key:', error)
    throw new Error('Encryption failed')
  }
}

/**
 * 解密 API 密钥
 */
export function decryptApiKey(encrypted: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)

    if (!decrypted) {
      throw new Error('Decryption resulted in empty string')
    }

    return decrypted
  } catch (error) {
    console.error('Failed to decrypt API key:', error)
    throw new Error('Decryption failed')
  }
}

/**
 * 生成随机 ID
 */
export function generateSecureId(): string {
  return CryptoJS.lib.WordArray.random(16).toString()
}

/**
 * 哈希字符串（用于存储密码等）
 */
export function hashString(str: string): string {
  return CryptoJS.SHA256(str).toString()
}

/**
 * XSS 防护 - 清理 HTML
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'img',
      'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOW_DATA_ATTR: false,
  })
}

/**
 * 清理用户输入
 */
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

/**
 * 验证 URL 是否安全
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)

    // 只允许 http 和 https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }

    // 不允许本地网络（可选）
    const hostname = parsed.hostname.toLowerCase()
    const localPatterns = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      'local',
      '.local',
    ]

    if (localPatterns.some(pattern => hostname.includes(pattern))) {
      return false
    }

    return true
  } catch {
    return false
  }
}

/**
 * 验证 API 密钥格式
 */
export function validateApiKey(apiKey: string, provider: 'openai' | 'anthropic' | 'google'): boolean {
  const patterns = {
    openai: /^sk-[A-Za-z0-9]{48}$/,
    anthropic: /^sk-ant-[A-Za-z0-9\-_]{95,}$/,
    google: /^[A-Za-z0-9\-_]{39}$/,
  }

  const pattern = patterns[provider]
  return pattern ? pattern.test(apiKey) : false
}

/**
 * 混淆敏感信息（用于日志）
 */
export function obfuscate(str: string, visibleChars: number = 4): string {
  if (str.length <= visibleChars * 2) {
    return '*'.repeat(str.length)
  }

  const start = str.slice(0, visibleChars)
  const end = str.slice(-visibleChars)
  const middle = '*'.repeat(str.length - visibleChars * 2)

  return `${start}${middle}${end}
}`
}

/**
 * Content Security Policy 配置
 */
export const CSP_CONFIG = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // 开发时需要，生产环境应移除
    "'unsafe-eval'",   // 某些库需要，尽量避免
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'https:',
    'blob:',
  ],
  'font-src': [
    "'self'",
    'data:',
    'https://fonts.gstatic.com',
  ],
  'connect-src': [
    "'self'",
    'https://api.openai.com',
    'https://api.anthropic.com',
    'https://generativelanguage.googleapis.com',
    'wss:',
    'ws:',
  ],
  'media-src': ["'self'", 'blob:'],
  'object-src': ["'none'"],
  'frame-ancestors': ["'self'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
}

/**
 * 生成 CSP 字符串
 */
export function generateCSP(): string {
  return Object.entries(CSP_CONFIG)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
}

/**
 * 速率限制器（防止暴力破解）
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map()
  private maxAttempts: number
  private windowMs: number

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
  }

  /**
   * 检查是否超过速率限制
   */
  check(key: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []

    // 清理过期的尝试
    const validAttempts = attempts.filter(time => now - time < this.windowMs)

    if (validAttempts.length >= this.maxAttempts) {
      return false
    }

    validAttempts.push(now)
    this.attempts.set(key, validAttempts)

    return true
  }

  /**
   * 重置计数
   */
  reset(key: string): void {
    this.attempts.delete(key)
  }

  /**
   * 清理所有过期记录
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, attempts] of this.attempts.entries()) {
      const validAttempts = attempts.filter(time => now - time < this.windowMs)
      if (validAttempts.length === 0) {
        this.attempts.delete(key)
      } else {
        this.attempts.set(key, validAttempts)
      }
    }
  }
}

/**
 * 安全存储（自动加密）
 */
export class SecureStorage {
  private storage: Storage

  constructor(storage: Storage = localStorage) {
    this.storage = storage
  }

  /**
   * 安全设置值
   */
  setItem(key: string, value: any, encrypt: boolean = true): void {
    try {
      const serialized = JSON.stringify(value)
      const stored = encrypt ? encryptApiKey(serialized) : serialized
      this.storage.setItem(key, stored)
    } catch (error) {
      console.error('Failed to store item:', error)
      throw error
    }
  }

  /**
   * 安全获取值
   */
  getItem<T = any>(key: string, decrypt: boolean = true): T | null {
    try {
      const stored = this.storage.getItem(key)
      if (!stored) return null

      const serialized = decrypt ? decryptApiKey(stored) : stored
      return JSON.parse(serialized) as T
    } catch (error) {
      console.error('Failed to retrieve item:', error)
      return null
    }
  }

  /**
   * 移除值
   */
  removeItem(key: string): void {
    this.storage.removeItem(key)
  }

  /**
   * 清空存储
   */
  clear(): void {
    this.storage.clear()
  }
}

/**
 * 默认安全存储实例
 */
export const secureStorage = new SecureStorage()

/**
 * 检查是否是安全上下文（HTTPS）
 */
export function isSecureContext(): boolean {
  return window.isSecureContext || location.protocol === 'https:'
}

/**
 * 验证 CORS 来源
 */
export function validateOrigin(origin: string): boolean {
  const allowedOrigins = [
    window.location.origin,
    'http://localhost:5173',
    'http://localhost:3000',
    // 添加你的生产域名
  ]

  return allowedOrigins.includes(origin)
}

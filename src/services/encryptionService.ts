import { EventEmitter } from '@/utils/EventEmitter'

interface EncryptionConfig {
  algorithm: 'AES-GCM' | 'AES-CBC' | 'AES-CTR'
  keyLength: 128 | 192 | 256
  ivLength: 12 | 16
  tagLength?: 128
  saltLength: 16 | 32
  iterations: number
}

interface EncryptedData {
  data: string
  iv: string
  salt: string
  tag?: string
  algorithm: string
  keyLength: number
  iterations: number
}

interface KeyDerivationOptions {
  password: string
  salt: Uint8Array
  iterations: number
  keyLength: number
}

interface SecurityAuditEvent {
  timestamp: Date
  type: 'encryption' | 'decryption' | 'key_derivation' | 'key_rotation' | 'security_violation'
  success: boolean
  algorithm?: string
  dataSize?: number
  error?: string
  metadata?: any
}

class EncryptionService extends EventEmitter {
  private static instance: EncryptionService
  private config: EncryptionConfig
  private masterKey: CryptoKey | null = null
  private keyCache: Map<string, CryptoKey> = new Map()
  private auditLog: SecurityAuditEvent[] = []
  private isInitialized = false

  constructor() {
    super()
    this.config = {
      algorithm: 'AES-GCM',
      keyLength: 256,
      ivLength: 12,
      tagLength: 128,
      saltLength: 32,
      iterations: 100000
    }
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService()
    }
    return EncryptionService.instance
  }

  async initialize(masterPassword?: string): Promise<void> {
    try {
      if (masterPassword) {
        await this.deriveMasterKey(masterPassword)
      }
      this.isInitialized = true
      this.emit('initialized')

      this.logSecurityEvent({
        timestamp: new Date(),
        type: 'key_derivation',
        success: true,
        algorithm: this.config.algorithm
      })
    } catch (error) {
      this.logSecurityEvent({
        timestamp: new Date(),
        type: 'key_derivation',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  async deriveMasterKey(password: string): Promise<void> {
    const salt = this.generateSalt()
    const keyMaterial = await this.deriveKeyFromPassword({
      password,
      salt,
      iterations: this.config.iterations,
      keyLength: this.config.keyLength
    })

    this.masterKey = await window.crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: this.config.algorithm },
      false,
      ['encrypt', 'decrypt']
    )

    // Store salt securely for key regeneration
    localStorage.setItem('encryption_salt', this.arrayBufferToBase64(salt))
  }

  private async deriveKeyFromPassword(options: KeyDerivationOptions): Promise<ArrayBuffer> {
    const encoder = new TextEncoder()
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(options.password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    return await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: options.salt,
        iterations: options.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      options.keyLength
    )
  }

  async encrypt(data: string, password?: string): Promise<EncryptedData> {
    if (!this.isInitialized && !password) {
      throw new Error('Encryption service not initialized. Provide a password or initialize first.')
    }

    try {
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)

      let key: CryptoKey
      let salt: Uint8Array

      if (password) {
        // Use provided password for one-time encryption
        salt = this.generateSalt()
        const keyMaterial = await this.deriveKeyFromPassword({
          password,
          salt,
          iterations: this.config.iterations,
          keyLength: this.config.keyLength
        })

        key = await window.crypto.subtle.importKey(
          'raw',
          keyMaterial,
          { name: this.config.algorithm },
          false,
          ['encrypt', 'decrypt']
        )
      } else {
        // Use master key
        if (!this.masterKey) {
          throw new Error('Master key not available')
        }
        key = this.masterKey
        salt = this.base64ToArrayBuffer(localStorage.getItem('encryption_salt') || '')
      }

      const iv = this.generateIV()

      let encrypted: ArrayBuffer
      let tag: ArrayBuffer | undefined

      if (this.config.algorithm === 'AES-GCM') {
        const result = await window.crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv: iv,
            tagLength: this.config.tagLength
          },
          key,
          dataBuffer
        )

        // For AES-GCM, the tag is appended to the encrypted data
        const encryptedArray = new Uint8Array(result)
        const tagSize = (this.config.tagLength || 128) / 8
        encrypted = result.slice(0, -tagSize)
        tag = result.slice(-tagSize)
      } else {
        encrypted = await window.crypto.subtle.encrypt(
          {
            name: this.config.algorithm,
            iv: iv
          },
          key,
          dataBuffer
        )
      }

      const encryptedData: EncryptedData = {
        data: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv),
        salt: this.arrayBufferToBase64(salt),
        algorithm: this.config.algorithm,
        keyLength: this.config.keyLength,
        iterations: this.config.iterations
      }

      if (tag) {
        encryptedData.tag = this.arrayBufferToBase64(tag)
      }

      this.logSecurityEvent({
        timestamp: new Date(),
        type: 'encryption',
        success: true,
        algorithm: this.config.algorithm,
        dataSize: data.length
      })

      return encryptedData
    } catch (error) {
      this.logSecurityEvent({
        timestamp: new Date(),
        type: 'encryption',
        success: false,
        algorithm: this.config.algorithm,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  async decrypt(encryptedData: EncryptedData, password?: string): Promise<string> {
    try {
      let key: CryptoKey

      if (password) {
        // Derive key from provided password
        const salt = this.base64ToArrayBuffer(encryptedData.salt)
        const keyMaterial = await this.deriveKeyFromPassword({
          password,
          salt,
          iterations: encryptedData.iterations,
          keyLength: encryptedData.keyLength
        })

        key = await window.crypto.subtle.importKey(
          'raw',
          keyMaterial,
          { name: encryptedData.algorithm },
          false,
          ['encrypt', 'decrypt']
        )
      } else {
        // Use master key
        if (!this.masterKey) {
          throw new Error('Master key not available')
        }
        key = this.masterKey
      }

      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData.data)
      const iv = this.base64ToArrayBuffer(encryptedData.iv)

      let decrypted: ArrayBuffer

      if (encryptedData.algorithm === 'AES-GCM' && encryptedData.tag) {
        const tag = this.base64ToArrayBuffer(encryptedData.tag)
        const combinedBuffer = new Uint8Array(encryptedBuffer.byteLength + tag.byteLength)
        combinedBuffer.set(new Uint8Array(encryptedBuffer))
        combinedBuffer.set(new Uint8Array(tag), encryptedBuffer.byteLength)

        decrypted = await window.crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: iv,
            tagLength: this.config.tagLength
          },
          key,
          combinedBuffer
        )
      } else {
        decrypted = await window.crypto.subtle.decrypt(
          {
            name: encryptedData.algorithm,
            iv: iv
          },
          key,
          encryptedBuffer
        )
      }

      const decoder = new TextDecoder()
      const result = decoder.decode(decrypted)

      this.logSecurityEvent({
        timestamp: new Date(),
        type: 'decryption',
        success: true,
        algorithm: encryptedData.algorithm,
        dataSize: result.length
      })

      return result
    } catch (error) {
      this.logSecurityEvent({
        timestamp: new Date(),
        type: 'decryption',
        success: false,
        algorithm: encryptedData.algorithm,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  async encryptObject<T>(obj: T, password?: string): Promise<EncryptedData> {
    const jsonString = JSON.stringify(obj)
    return await this.encrypt(jsonString, password)
  }

  async decryptObject<T>(encryptedData: EncryptedData, password?: string): Promise<T> {
    const jsonString = await this.decrypt(encryptedData, password)
    return JSON.parse(jsonString) as T
  }

  async rotateKeys(): Promise<void> {
    try {
      // Clear cached keys
      this.keyCache.clear()

      // Generate new master key (would require re-encryption of all data in production)
      if (this.masterKey) {
        // In production, you would re-encrypt all existing data with the new key
        this.emit('key_rotation_required')
      }

      this.logSecurityEvent({
        timestamp: new Date(),
        type: 'key_rotation',
        success: true
      })
    } catch (error) {
      this.logSecurityEvent({
        timestamp: new Date(),
        type: 'key_rotation',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  async generateSecurePassword(length: number = 32): Promise<string> {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
    const array = new Uint8Array(length)
    window.crypto.getRandomValues(array)

    return Array.from(array, byte => charset[byte % charset.length]).join('')
  }

  async hashPassword(password: string, salt?: Uint8Array): Promise<{ hash: string; salt: string }> {
    const encoder = new TextEncoder()
    const saltBuffer = salt || this.generateSalt()

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    )

    const hashBuffer = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: this.config.iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    )

    return {
      hash: this.arrayBufferToBase64(hashBuffer),
      salt: this.arrayBufferToBase64(saltBuffer)
    }
  }

  async verifyPassword(password: string, hashedPassword: string, salt: string): Promise<boolean> {
    const saltBuffer = this.base64ToArrayBuffer(salt)
    const result = await this.hashPassword(password, saltBuffer)
    return result.hash === hashedPassword
  }

  private generateSalt(): Uint8Array {
    const salt = new Uint8Array(this.config.saltLength)
    window.crypto.getRandomValues(salt)
    return salt
  }

  private generateIV(): Uint8Array {
    const iv = new Uint8Array(this.config.ivLength)
    window.crypto.getRandomValues(iv)
    return iv
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  private logSecurityEvent(event: SecurityAuditEvent): void {
    this.auditLog.push(event)

    // Keep only last 1000 events
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000)
    }

    this.emit('security_event', event)

    // Alert on security violations
    if (event.type === 'security_violation' || !event.success) {
      this.emit('security_alert', event)
    }
  }

  getSecurityAuditLog(): SecurityAuditEvent[] {
    return [...this.auditLog]
  }

  getSecurityStats(): {
    totalEvents: number
    successfulOperations: number
    failedOperations: number
    lastActivity: Date | null
    encryptionCount: number
    decryptionCount: number
  } {
    const successful = this.auditLog.filter(e => e.success).length
    const failed = this.auditLog.filter(e => !e.success).length
    const lastEvent = this.auditLog.length > 0 ? this.auditLog[this.auditLog.length - 1] : null

    return {
      totalEvents: this.auditLog.length,
      successfulOperations: successful,
      failedOperations: failed,
      lastActivity: lastEvent?.timestamp || null,
      encryptionCount: this.auditLog.filter(e => e.type === 'encryption').length,
      decryptionCount: this.auditLog.filter(e => e.type === 'decryption').length
    }
  }

  updateConfig(newConfig: Partial<EncryptionConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.emit('config_updated', this.config)
  }

  getConfig(): EncryptionConfig {
    return { ...this.config }
  }

  clearCache(): void {
    this.keyCache.clear()
    this.emit('cache_cleared')
  }

  isReady(): boolean {
    return this.isInitialized && this.masterKey !== null
  }

  async secureDelete(data: string): Promise<void> {
    // Overwrite the string memory (limited effectiveness in JavaScript)
    // In a real implementation, you'd want to use secure memory allocation
    const encoder = new TextEncoder()
    const buffer = encoder.encode(data)
    window.crypto.getRandomValues(buffer)

    // Clear references
    data = ''
  }
}

export default EncryptionService.getInstance()
export { EncryptionService, type EncryptedData, type EncryptionConfig, type SecurityAuditEvent }
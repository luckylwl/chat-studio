import { EventEmitter } from '@/utils/EventEmitter'
import encryptionService, { type EncryptedData } from './encryptionService'

interface SecurityPolicy {
  enforceEncryption: boolean
  autoLockTimeout: number // minutes
  maxFailedAttempts: number
  passwordComplexity: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
  }
  sessionTimeout: number // minutes
  enableTwoFactor: boolean
  enableAuditLogging: boolean
  allowDataExport: boolean
  enableSecureDelete: boolean
}

interface SecuritySession {
  id: string
  userId: string
  createdAt: Date
  lastActivity: Date
  isLocked: boolean
  failedAttempts: number
  ipAddress?: string
  userAgent?: string
  encryptionEnabled: boolean
}

interface SecurityThreat {
  id: string
  type: 'brute_force' | 'suspicious_activity' | 'unauthorized_access' | 'data_breach' | 'policy_violation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  timestamp: Date
  source?: string
  metadata?: any
  resolved: boolean
}

interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted'
  encryption: boolean
  accessControl: string[]
  retention: number // days
  autoDelete: boolean
}

interface SecureStorageItem {
  id: string
  data: EncryptedData
  classification: DataClassification
  createdAt: Date
  lastAccessed: Date
  accessCount: number
  checksum: string
}

class SecurityService extends EventEmitter {
  private static instance: SecurityService
  private policy: SecurityPolicy
  private currentSession: SecuritySession | null = null
  private threats: SecurityThreat[] = []
  private secureStorage: Map<string, SecureStorageItem> = new Map()
  private lockTimeout: NodeJS.Timeout | null = null
  private isInitialized = false

  constructor() {
    super()
    this.policy = this.getDefaultPolicy()
    this.loadPolicy()
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService()
    }
    return SecurityService.instance
  }

  async initialize(userId: string): Promise<void> {
    try {
      // Create security session
      this.currentSession = {
        id: this.generateSecureId(),
        userId,
        createdAt: new Date(),
        lastActivity: new Date(),
        isLocked: false,
        failedAttempts: 0,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        encryptionEnabled: this.policy.enforceEncryption
      }

      // Initialize encryption if required
      if (this.policy.enforceEncryption) {
        await this.initializeEncryption()
      }

      // Start session monitoring
      this.startSessionMonitoring()

      // Load secure storage
      await this.loadSecureStorage()

      this.isInitialized = true
      this.emit('initialized', this.currentSession)

      this.logSecurityEvent('session_created', {
        sessionId: this.currentSession.id,
        userId
      })
    } catch (error) {
      this.reportThreat({
        type: 'unauthorized_access',
        severity: 'high',
        description: `Failed to initialize security session: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      throw error
    }
  }

  private async initializeEncryption(): Promise<void> {
    // In a real implementation, this would prompt for master password
    // For demo purposes, we'll use a derived key
    const masterPassword = await this.deriveMasterPassword()
    await encryptionService.initialize(masterPassword)
  }

  private async deriveMasterPassword(): Promise<string> {
    // This is a simplified implementation
    // In production, you'd want proper key derivation from user credentials
    const userId = this.currentSession?.userId || 'anonymous'
    const timestamp = Date.now().toString()

    return await encryptionService.generateSecurePassword(32)
  }

  async authenticateUser(credentials: { password: string; twoFactorCode?: string }): Promise<boolean> {
    if (!this.currentSession) {
      throw new Error('No active session')
    }

    try {
      // Check failed attempts
      if (this.currentSession.failedAttempts >= this.policy.maxFailedAttempts) {
        this.lockSession()
        this.reportThreat({
          type: 'brute_force',
          severity: 'high',
          description: `Exceeded maximum failed authentication attempts (${this.policy.maxFailedAttempts})`
        })
        return false
      }

      // Validate password complexity
      if (!this.validatePasswordComplexity(credentials.password)) {
        this.currentSession.failedAttempts++
        return false
      }

      // In production, verify against stored hash
      const isValidPassword = await this.verifyPassword(credentials.password)

      if (!isValidPassword) {
        this.currentSession.failedAttempts++
        this.logSecurityEvent('authentication_failed', {
          sessionId: this.currentSession.id,
          attempt: this.currentSession.failedAttempts
        })
        return false
      }

      // Check two-factor if enabled
      if (this.policy.enableTwoFactor && credentials.twoFactorCode) {
        const isValidTwoFactor = await this.verifyTwoFactor(credentials.twoFactorCode)
        if (!isValidTwoFactor) {
          this.currentSession.failedAttempts++
          return false
        }
      }

      // Reset failed attempts on successful authentication
      this.currentSession.failedAttempts = 0
      this.currentSession.isLocked = false
      this.updateSessionActivity()

      this.logSecurityEvent('authentication_successful', {
        sessionId: this.currentSession.id
      })

      return true
    } catch (error) {
      this.reportThreat({
        type: 'unauthorized_access',
        severity: 'medium',
        description: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      return false
    }
  }

  private async verifyPassword(password: string): Promise<boolean> {
    // In production, compare against stored hash
    // For demo purposes, accept any password that meets complexity requirements
    return this.validatePasswordComplexity(password)
  }

  private async verifyTwoFactor(code: string): Promise<boolean> {
    // Simplified two-factor verification
    // In production, verify against TOTP or sent SMS code
    return code.length === 6 && /^\d+$/.test(code)
  }

  private validatePasswordComplexity(password: string): boolean {
    const { passwordComplexity } = this.policy

    if (password.length < passwordComplexity.minLength) {
      return false
    }

    if (passwordComplexity.requireUppercase && !/[A-Z]/.test(password)) {
      return false
    }

    if (passwordComplexity.requireLowercase && !/[a-z]/.test(password)) {
      return false
    }

    if (passwordComplexity.requireNumbers && !/\d/.test(password)) {
      return false
    }

    if (passwordComplexity.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return false
    }

    return true
  }

  async secureStore(key: string, data: any, classification: DataClassification): Promise<void> {
    if (!this.currentSession || this.currentSession.isLocked) {
      throw new Error('Session not available or locked')
    }

    try {
      let encryptedData: EncryptedData

      if (classification.encryption || this.policy.enforceEncryption) {
        encryptedData = await encryptionService.encryptObject(data)
      } else {
        // Store as encrypted JSON even if not required for consistency
        encryptedData = await encryptionService.encryptObject(data)
      }

      const checksum = await this.calculateChecksum(JSON.stringify(data))

      const item: SecureStorageItem = {
        id: this.generateSecureId(),
        data: encryptedData,
        classification,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 0,
        checksum
      }

      this.secureStorage.set(key, item)
      await this.persistSecureStorage()

      this.logSecurityEvent('data_stored', {
        key,
        classification: classification.level,
        encrypted: classification.encryption
      })

      this.updateSessionActivity()
    } catch (error) {
      this.reportThreat({
        type: 'data_breach',
        severity: 'medium',
        description: `Failed to securely store data: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      throw error
    }
  }

  async secureRetrieve(key: string): Promise<any> {
    if (!this.currentSession || this.currentSession.isLocked) {
      throw new Error('Session not available or locked')
    }

    try {
      const item = this.secureStorage.get(key)
      if (!item) {
        return null
      }

      // Check access control
      if (!this.checkAccessPermission(item.classification)) {
        this.reportThreat({
          type: 'unauthorized_access',
          severity: 'high',
          description: `Unauthorized access attempt to classified data: ${key}`
        })
        throw new Error('Access denied')
      }

      const decryptedData = await encryptionService.decryptObject(item.data)

      // Verify integrity
      const checksum = await this.calculateChecksum(JSON.stringify(decryptedData))
      if (checksum !== item.checksum) {
        this.reportThreat({
          type: 'data_breach',
          severity: 'critical',
          description: `Data integrity check failed for key: ${key}`
        })
        throw new Error('Data integrity compromised')
      }

      // Update access statistics
      item.lastAccessed = new Date()
      item.accessCount++

      this.logSecurityEvent('data_accessed', {
        key,
        classification: item.classification.level,
        accessCount: item.accessCount
      })

      this.updateSessionActivity()
      return decryptedData
    } catch (error) {
      this.reportThreat({
        type: 'data_breach',
        severity: 'high',
        description: `Failed to retrieve secure data: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      throw error
    }
  }

  async secureDelete(key: string): Promise<boolean> {
    if (!this.currentSession || this.currentSession.isLocked) {
      throw new Error('Session not available or locked')
    }

    try {
      const item = this.secureStorage.get(key)
      if (!item) {
        return false
      }

      // Check if secure delete is allowed by policy
      if (!this.policy.enableSecureDelete) {
        throw new Error('Secure delete not allowed by policy')
      }

      // Perform secure deletion
      await encryptionService.secureDelete(JSON.stringify(item.data))

      this.secureStorage.delete(key)
      await this.persistSecureStorage()

      this.logSecurityEvent('data_deleted', {
        key,
        classification: item.classification.level
      })

      this.updateSessionActivity()
      return true
    } catch (error) {
      this.reportThreat({
        type: 'policy_violation',
        severity: 'medium',
        description: `Failed to securely delete data: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
      throw error
    }
  }

  private checkAccessPermission(classification: DataClassification): boolean {
    if (!this.currentSession) return false

    // Simplified access control - in production, implement proper RBAC
    const userLevel = this.getUserSecurityLevel()

    const levelHierarchy = ['public', 'internal', 'confidential', 'restricted']
    const requiredLevel = levelHierarchy.indexOf(classification.level)
    const userLevelIndex = levelHierarchy.indexOf(userLevel)

    return userLevelIndex >= requiredLevel
  }

  private getUserSecurityLevel(): DataClassification['level'] {
    // In production, get from user profile
    return 'confidential'
  }

  private async calculateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  lockSession(): void {
    if (this.currentSession) {
      this.currentSession.isLocked = true
      this.emit('session_locked', this.currentSession)

      this.logSecurityEvent('session_locked', {
        sessionId: this.currentSession.id
      })
    }
  }

  unlockSession(): void {
    if (this.currentSession) {
      this.currentSession.isLocked = false
      this.currentSession.failedAttempts = 0
      this.updateSessionActivity()
      this.emit('session_unlocked', this.currentSession)

      this.logSecurityEvent('session_unlocked', {
        sessionId: this.currentSession.id
      })
    }
  }

  private updateSessionActivity(): void {
    if (this.currentSession) {
      this.currentSession.lastActivity = new Date()
      this.resetLockTimeout()
    }
  }

  private resetLockTimeout(): void {
    if (this.lockTimeout) {
      clearTimeout(this.lockTimeout)
    }

    if (this.policy.autoLockTimeout > 0) {
      this.lockTimeout = setTimeout(() => {
        this.lockSession()
      }, this.policy.autoLockTimeout * 60 * 1000)
    }
  }

  private startSessionMonitoring(): void {
    // Monitor for suspicious activity
    setInterval(() => {
      this.detectSuspiciousActivity()
    }, 30000) // Check every 30 seconds

    // Check session timeout
    setInterval(() => {
      this.checkSessionTimeout()
    }, 60000) // Check every minute
  }

  private detectSuspiciousActivity(): void {
    if (!this.currentSession) return

    // Check for rapid failed attempts
    if (this.currentSession.failedAttempts > 3) {
      this.reportThreat({
        type: 'suspicious_activity',
        severity: 'medium',
        description: `Multiple failed authentication attempts detected`
      })
    }

    // Check session duration
    const sessionDuration = Date.now() - this.currentSession.createdAt.getTime()
    if (sessionDuration > 8 * 60 * 60 * 1000) { // 8 hours
      this.reportThreat({
        type: 'suspicious_activity',
        severity: 'low',
        description: `Unusually long session duration detected`
      })
    }
  }

  private checkSessionTimeout(): void {
    if (!this.currentSession) return

    const inactiveTime = Date.now() - this.currentSession.lastActivity.getTime()
    const timeoutMs = this.policy.sessionTimeout * 60 * 1000

    if (inactiveTime > timeoutMs) {
      this.terminateSession()
    }
  }

  terminateSession(): void {
    if (this.currentSession) {
      this.logSecurityEvent('session_terminated', {
        sessionId: this.currentSession.id
      })

      this.emit('session_terminated', this.currentSession)
      this.currentSession = null

      if (this.lockTimeout) {
        clearTimeout(this.lockTimeout)
        this.lockTimeout = null
      }

      // Clear sensitive data
      encryptionService.clearCache()
    }
  }

  private reportThreat(threat: Omit<SecurityThreat, 'id' | 'timestamp' | 'resolved'>): void {
    const newThreat: SecurityThreat = {
      id: this.generateSecureId(),
      timestamp: new Date(),
      resolved: false,
      ...threat
    }

    this.threats.push(newThreat)

    // Keep only last 100 threats
    if (this.threats.length > 100) {
      this.threats = this.threats.slice(-100)
    }

    this.emit('threat_detected', newThreat)

    // Auto-respond to critical threats
    if (newThreat.severity === 'critical') {
      this.respondToThreat(newThreat)
    }
  }

  private respondToThreat(threat: SecurityThreat): void {
    switch (threat.type) {
      case 'brute_force':
      case 'unauthorized_access':
        this.lockSession()
        break
      case 'data_breach':
        // In production, implement incident response
        this.logSecurityEvent('threat_response', {
          threatId: threat.id,
          action: 'data_breach_response'
        })
        break
    }
  }

  resolveThreat(threatId: string): void {
    const threat = this.threats.find(t => t.id === threatId)
    if (threat) {
      threat.resolved = true
      this.emit('threat_resolved', threat)
    }
  }

  private logSecurityEvent(type: string, data: any): void {
    if (this.policy.enableAuditLogging) {
      console.log(`[SECURITY] ${type}:`, data)
      // In production, send to secure logging service
    }
  }

  private async loadSecureStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('secure_storage')
      if (stored) {
        const encrypted = JSON.parse(stored)
        // In production, decrypt the entire storage
        // For now, we'll start with empty storage
      }
    } catch (error) {
      console.warn('Failed to load secure storage:', error)
    }
  }

  private async persistSecureStorage(): Promise<void> {
    try {
      // In production, encrypt the entire storage
      const data = Array.from(this.secureStorage.entries())
      localStorage.setItem('secure_storage', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to persist secure storage:', error)
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      // In a real app, get from server
      return 'localhost'
    } catch {
      return 'unknown'
    }
  }

  private generateSecureId(): string {
    return crypto.randomUUID()
  }

  private getDefaultPolicy(): SecurityPolicy {
    return {
      enforceEncryption: true,
      autoLockTimeout: 15,
      maxFailedAttempts: 3,
      passwordComplexity: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      },
      sessionTimeout: 60,
      enableTwoFactor: false,
      enableAuditLogging: true,
      allowDataExport: false,
      enableSecureDelete: true
    }
  }

  private loadPolicy(): void {
    try {
      const stored = localStorage.getItem('security_policy')
      if (stored) {
        this.policy = { ...this.policy, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.warn('Failed to load security policy:', error)
    }
  }

  updatePolicy(updates: Partial<SecurityPolicy>): void {
    this.policy = { ...this.policy, ...updates }
    localStorage.setItem('security_policy', JSON.stringify(this.policy))
    this.emit('policy_updated', this.policy)
  }

  getPolicy(): SecurityPolicy {
    return { ...this.policy }
  }

  getSession(): SecuritySession | null {
    return this.currentSession ? { ...this.currentSession } : null
  }

  getThreats(): SecurityThreat[] {
    return [...this.threats]
  }

  getSecurityStatus(): {
    sessionActive: boolean
    sessionLocked: boolean
    encryptionEnabled: boolean
    unresolvedThreats: number
    highSeverityThreats: number
    lastActivity: Date | null
    securityLevel: 'low' | 'medium' | 'high'
  } {
    const unresolvedThreats = this.threats.filter(t => !t.resolved).length
    const highSeverityThreats = this.threats.filter(t => !t.resolved && (t.severity === 'high' || t.severity === 'critical')).length

    let securityLevel: 'low' | 'medium' | 'high' = 'high'
    if (highSeverityThreats > 0) securityLevel = 'low'
    else if (unresolvedThreats > 2) securityLevel = 'medium'

    return {
      sessionActive: this.currentSession !== null,
      sessionLocked: this.currentSession?.isLocked || false,
      encryptionEnabled: this.policy.enforceEncryption,
      unresolvedThreats,
      highSeverityThreats,
      lastActivity: this.currentSession?.lastActivity || null,
      securityLevel
    }
  }

  exportAuditLog(): string {
    if (!this.policy.allowDataExport) {
      throw new Error('Data export not allowed by security policy')
    }

    return JSON.stringify({
      exportedAt: new Date(),
      session: this.currentSession,
      threats: this.threats,
      policy: this.policy
    }, null, 2)
  }
}

export default SecurityService.getInstance()
export { SecurityService, type SecurityPolicy, type SecuritySession, type SecurityThreat, type DataClassification }
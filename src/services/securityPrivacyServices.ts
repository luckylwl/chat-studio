/**
 * AI Chat Studio v4.0 - Security & Privacy Services
 *
 * This file contains security and privacy-focused services:
 * - E2E Encryption Service
 * - Privacy Mode Service
 * - Sensitive Data Detection Service
 * - Access Control Lists (ACL) Service
 * - Security Scanning Service
 */

import localforage from 'localforage'
import type {
  EncryptionConfig,
  EncryptedMessage,
  PrivacySettings,
  PrivacyMode,
  SensitiveDataPattern,
  SensitiveDataMatch,
  ACLRule,
  AccessControlList,
  SecurityScan,
  SecurityVulnerability,
  SecurityReport
} from '../types/v4-types'

// ===================================
// E2E ENCRYPTION SERVICE
// ===================================

class E2EEncryptionService {
  private readonly KEYS_KEY = 'encryption_keys'
  private readonly CONFIG_KEY = 'encryption_config'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'encryption'
  })

  // Key Management
  async generateKeyPair(userId: string): Promise<{ publicKey: string; privateKey: string }> {
    // In real app, would use Web Crypto API
    const publicKey = this.generateKey('public')
    const privateKey = this.generateKey('private')

    await this.storeKeys(userId, { publicKey, privateKey })

    return { publicKey, privateKey }
  }

  async getPublicKey(userId: string): Promise<string | null> {
    const keys = await this.store.getItem<Record<string, any>>(`${this.KEYS_KEY}_${userId}`)
    return keys?.publicKey || null
  }

  async getPrivateKey(userId: string): Promise<string | null> {
    const keys = await this.store.getItem<Record<string, any>>(`${this.KEYS_KEY}_${userId}`)
    return keys?.privateKey || null
  }

  // Encryption
  async encryptMessage(
    content: string,
    recipientPublicKey: string,
    senderPrivateKey: string
  ): Promise<EncryptedMessage> {
    // Simulate encryption (in real app, would use actual crypto)
    const encrypted = btoa(content)
    const signature = this.sign(encrypted, senderPrivateKey)

    return {
      id: `enc_${Date.now()}`,
      encryptedContent: encrypted,
      algorithm: 'AES-256-GCM',
      iv: this.generateIV(),
      signature,
      timestamp: Date.now(),
      metadata: {
        recipientPublicKey,
        senderPublicKey: this.derivePublicKey(senderPrivateKey)
      }
    }
  }

  async decryptMessage(
    encryptedMessage: EncryptedMessage,
    privateKey: string
  ): Promise<string> {
    // Verify signature first
    const signatureValid = this.verifySignature(
      encryptedMessage.encryptedContent,
      encryptedMessage.signature,
      encryptedMessage.metadata.senderPublicKey
    )

    if (!signatureValid) {
      throw new Error('Invalid signature')
    }

    // Decrypt (in real app, would use actual crypto)
    const decrypted = atob(encryptedMessage.encryptedContent)

    return decrypted
  }

  // Configuration
  async getConfig(userId: string): Promise<EncryptionConfig> {
    const config = await this.store.getItem<EncryptionConfig>(`${this.CONFIG_KEY}_${userId}`)

    if (!config) {
      return this.createDefaultConfig(userId)
    }

    return config
  }

  async updateConfig(userId: string, updates: Partial<EncryptionConfig>): Promise<EncryptionConfig> {
    const config = await this.getConfig(userId)
    const updated = { ...config, ...updates }
    await this.store.setItem(`${this.CONFIG_KEY}_${userId}`, updated)
    return updated
  }

  // Helper Methods
  private generateKey(type: 'public' | 'private'): string {
    const prefix = type === 'public' ? 'pub' : 'priv'
    return `${prefix}_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`
  }

  private generateIV(): string {
    return Math.random().toString(36).substring(2, 18)
  }

  private sign(data: string, privateKey: string): string {
    // Simulate signing (in real app, would use actual crypto)
    return `sig_${btoa(data + privateKey).substring(0, 32)}`
  }

  private verifySignature(data: string, signature: string, publicKey: string): boolean {
    // Simulate verification (in real app, would use actual crypto)
    return signature.startsWith('sig_')
  }

  private derivePublicKey(privateKey: string): string {
    // Simulate key derivation (in real app, would use actual crypto)
    return privateKey.replace('priv_', 'pub_')
  }

  private async storeKeys(userId: string, keys: any): Promise<void> {
    await this.store.setItem(`${this.KEYS_KEY}_${userId}`, keys)
  }

  private createDefaultConfig(userId: string): EncryptionConfig {
    return {
      userId,
      enabled: false,
      algorithm: 'AES-256-GCM',
      keyRotationDays: 90,
      requireE2E: false,
      allowedAlgorithms: ['AES-256-GCM', 'ChaCha20-Poly1305']
    }
  }
}

// ===================================
// PRIVACY MODE SERVICE
// ===================================

class PrivacyModeService {
  private readonly SETTINGS_KEY = 'privacy_settings'
  private readonly MODES_KEY = 'privacy_modes'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'privacy'
  })

  // Settings Management
  async getSettings(userId: string): Promise<PrivacySettings> {
    const settings = await this.store.getItem<PrivacySettings>(`${this.SETTINGS_KEY}_${userId}`)

    if (!settings) {
      return this.createDefaultSettings(userId)
    }

    return settings
  }

  async updateSettings(
    userId: string,
    updates: Partial<PrivacySettings>
  ): Promise<PrivacySettings> {
    const settings = await this.getSettings(userId)
    const updated = { ...settings, ...updates, updatedAt: Date.now() }
    await this.store.setItem(`${this.SETTINGS_KEY}_${userId}`, updated)
    return updated
  }

  // Privacy Modes
  async activateMode(userId: string, mode: PrivacyMode['type']): Promise<PrivacyMode> {
    const privacyMode: PrivacyMode = {
      id: `mode_${Date.now()}`,
      type: mode,
      active: true,
      activatedAt: Date.now(),
      settings: this.getModeSettings(mode)
    }

    await this.store.setItem(`${this.MODES_KEY}_${userId}`, privacyMode)

    // Apply mode settings
    await this.applyModeSettings(userId, privacyMode)

    return privacyMode
  }

  async deactivateMode(userId: string): Promise<void> {
    await this.store.removeItem(`${this.MODES_KEY}_${userId}`)
  }

  async getActiveMode(userId: string): Promise<PrivacyMode | null> {
    return await this.store.getItem<PrivacyMode>(`${this.MODES_KEY}_${userId}`)
  }

  // Data Management
  async clearHistory(userId: string): Promise<void> {
    // Clear conversation history
    console.log('Clearing conversation history for user:', userId)
    // In real app, would clear actual data
  }

  async exportData(userId: string): Promise<any> {
    // Export all user data
    const settings = await this.getSettings(userId)
    const mode = await this.getActiveMode(userId)

    return {
      settings,
      mode,
      exportedAt: Date.now()
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    // Delete all user data
    await this.store.removeItem(`${this.SETTINGS_KEY}_${userId}`)
    await this.store.removeItem(`${this.MODES_KEY}_${userId}`)
    console.log('Account deleted for user:', userId)
  }

  // Helper Methods
  private createDefaultSettings(userId: string): PrivacySettings {
    return {
      userId,
      dataCollection: {
        analytics: false,
        diagnostics: true,
        personalizedAds: false
      },
      dataRetention: {
        conversations: 90,
        logs: 30,
        analytics: 365
      },
      dataSharing: {
        thirdParty: false,
        affiliates: false,
        research: false
      },
      visibility: {
        profile: 'private',
        activity: 'private',
        connections: 'private'
      },
      communicationPreferences: {
        marketing: false,
        updates: true,
        security: true
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  private getModeSettings(mode: PrivacyMode['type']): Record<string, any> {
    switch (mode) {
      case 'strict':
        return {
          dataCollection: false,
          thirdPartySharing: false,
          analytics: false,
          encryption: true
        }
      case 'balanced':
        return {
          dataCollection: true,
          thirdPartySharing: false,
          analytics: true,
          encryption: true
        }
      case 'minimal':
        return {
          dataCollection: true,
          thirdPartySharing: true,
          analytics: true,
          encryption: false
        }
      default:
        return {}
    }
  }

  private async applyModeSettings(userId: string, mode: PrivacyMode): Promise<void> {
    const settings = await this.getSettings(userId)

    if (mode.type === 'strict') {
      settings.dataCollection = {
        analytics: false,
        diagnostics: false,
        personalizedAds: false
      }
      settings.dataSharing = {
        thirdParty: false,
        affiliates: false,
        research: false
      }
    }

    await this.store.setItem(`${this.SETTINGS_KEY}_${userId}`, settings)
  }
}

// ===================================
// SENSITIVE DATA DETECTION SERVICE
// ===================================

class SensitiveDataDetectionService {
  private readonly PATTERNS_KEY = 'sensitive_patterns'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'data_detection'
  })

  private patterns: SensitiveDataPattern[] = []

  async initialize(): Promise<void> {
    this.patterns = await this.getPatterns()

    if (this.patterns.length === 0) {
      this.patterns = this.createDefaultPatterns()
      await this.store.setItem(this.PATTERNS_KEY, this.patterns)
    }
  }

  // Detection
  async scanText(text: string): Promise<SensitiveDataMatch[]> {
    await this.initialize()

    const matches: SensitiveDataMatch[] = []

    for (const pattern of this.patterns) {
      if (!pattern.enabled) continue

      const regex = new RegExp(pattern.regex, 'gi')
      let match

      while ((match = regex.exec(text)) !== null) {
        matches.push({
          id: `match_${Date.now()}_${matches.length}`,
          patternId: pattern.id,
          type: pattern.type,
          value: match[0],
          position: match.index,
          length: match[0].length,
          confidence: pattern.confidence,
          severity: pattern.severity,
          context: this.getContext(text, match.index, match[0].length),
          suggestions: this.getSuggestions(pattern.type)
        })
      }
    }

    return matches
  }

  async redactMatches(text: string, matches: SensitiveDataMatch[]): Promise<string> {
    let redacted = text

    // Sort matches by position in reverse order to maintain indices
    const sortedMatches = [...matches].sort((a, b) => b.position - a.position)

    for (const match of sortedMatches) {
      const redaction = '*'.repeat(match.length)
      redacted =
        redacted.substring(0, match.position) +
        redaction +
        redacted.substring(match.position + match.length)
    }

    return redacted
  }

  async maskMatches(text: string, matches: SensitiveDataMatch[]): Promise<string> {
    let masked = text

    const sortedMatches = [...matches].sort((a, b) => b.position - a.position)

    for (const match of sortedMatches) {
      const mask = this.getMask(match.type, match.value)
      masked =
        masked.substring(0, match.position) +
        mask +
        masked.substring(match.position + match.length)
    }

    return masked
  }

  // Pattern Management
  async getPatterns(): Promise<SensitiveDataPattern[]> {
    return await this.store.getItem<SensitiveDataPattern[]>(this.PATTERNS_KEY) || []
  }

  async addPattern(pattern: Omit<SensitiveDataPattern, 'id'>): Promise<SensitiveDataPattern> {
    const newPattern: SensitiveDataPattern = {
      ...pattern,
      id: `pattern_${Date.now()}`
    }

    this.patterns.push(newPattern)
    await this.store.setItem(this.PATTERNS_KEY, this.patterns)

    return newPattern
  }

  async updatePattern(
    patternId: string,
    updates: Partial<SensitiveDataPattern>
  ): Promise<SensitiveDataPattern | null> {
    const pattern = this.patterns.find(p => p.id === patternId)

    if (!pattern) return null

    Object.assign(pattern, updates)
    await this.store.setItem(this.PATTERNS_KEY, this.patterns)

    return pattern
  }

  // Helper Methods
  private createDefaultPatterns(): SensitiveDataPattern[] {
    return [
      {
        id: 'pattern_email',
        type: 'email',
        name: 'Email Address',
        description: 'Detects email addresses',
        regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        severity: 'medium',
        confidence: 0.95,
        enabled: true,
        category: 'pii'
      },
      {
        id: 'pattern_phone',
        type: 'phone',
        name: 'Phone Number',
        description: 'Detects phone numbers',
        regex: '\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b',
        severity: 'medium',
        confidence: 0.85,
        enabled: true,
        category: 'pii'
      },
      {
        id: 'pattern_ssn',
        type: 'ssn',
        name: 'Social Security Number',
        description: 'Detects SSN patterns',
        regex: '\\b\\d{3}-\\d{2}-\\d{4}\\b',
        severity: 'high',
        confidence: 0.9,
        enabled: true,
        category: 'pii'
      },
      {
        id: 'pattern_credit_card',
        type: 'credit_card',
        name: 'Credit Card Number',
        description: 'Detects credit card numbers',
        regex: '\\b\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}[\\s-]?\\d{4}\\b',
        severity: 'high',
        confidence: 0.8,
        enabled: true,
        category: 'financial'
      },
      {
        id: 'pattern_api_key',
        type: 'api_key',
        name: 'API Key',
        description: 'Detects API keys',
        regex: '(?:api[_-]?key|apikey)[\\s:=]+[\'"]?([a-zA-Z0-9_\\-]{20,})[\'"]?',
        severity: 'critical',
        confidence: 0.9,
        enabled: true,
        category: 'credentials'
      }
    ]
  }

  private getContext(text: string, position: number, length: number): string {
    const start = Math.max(0, position - 20)
    const end = Math.min(text.length, position + length + 20)
    return text.substring(start, end)
  }

  private getSuggestions(type: string): string[] {
    const suggestions: Record<string, string[]> = {
      email: ['Use a placeholder email', 'Remove email address', 'Ask user for permission'],
      phone: ['Use a placeholder phone', 'Remove phone number', 'Mask middle digits'],
      ssn: ['Remove SSN immediately', 'Never store SSN in plain text'],
      credit_card: ['Remove card number', 'Use tokenization', 'PCI compliance required'],
      api_key: ['Remove API key', 'Use environment variables', 'Rotate compromised keys']
    }

    return suggestions[type] || ['Review and redact if necessary']
  }

  private getMask(type: string, value: string): string {
    switch (type) {
      case 'email': {
        const [local, domain] = value.split('@')
        return `${local[0]}***@${domain}`
      }
      case 'phone': {
        return `***-***-${value.slice(-4)}`
      }
      case 'credit_card': {
        return `****-****-****-${value.slice(-4)}`
      }
      case 'ssn': {
        return `***-**-${value.slice(-4)}`
      }
      default:
        return '*'.repeat(value.length)
    }
  }
}

// ===================================
// ACCESS CONTROL LIST (ACL) SERVICE
// ===================================

class ACLService {
  private readonly ACL_KEY = 'access_control_lists'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'acl'
  })

  // ACL Management
  async createACL(
    resourceId: string,
    resourceType: string,
    ownerId: string
  ): Promise<AccessControlList> {
    const acl: AccessControlList = {
      id: `acl_${Date.now()}`,
      resourceId,
      resourceType,
      ownerId,
      rules: [],
      defaultPermissions: ['read'],
      inheritFromParent: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const acls = await this.getAllACLs()
    acls.push(acl)
    await this.store.setItem(this.ACL_KEY, acls)

    return acl
  }

  async getACL(resourceId: string): Promise<AccessControlList | null> {
    const acls = await this.getAllACLs()
    return acls.find(acl => acl.resourceId === resourceId) || null
  }

  async getAllACLs(): Promise<AccessControlList[]> {
    return await this.store.getItem<AccessControlList[]>(this.ACL_KEY) || []
  }

  // Rule Management
  async addRule(resourceId: string, rule: Omit<ACLRule, 'id'>): Promise<ACLRule> {
    const acl = await this.getACL(resourceId)

    if (!acl) {
      throw new Error('ACL not found')
    }

    const newRule: ACLRule = {
      ...rule,
      id: `rule_${Date.now()}`
    }

    acl.rules.push(newRule)
    acl.updatedAt = Date.now()

    await this.updateACL(acl)

    return newRule
  }

  async removeRule(resourceId: string, ruleId: string): Promise<void> {
    const acl = await this.getACL(resourceId)

    if (!acl) {
      throw new Error('ACL not found')
    }

    acl.rules = acl.rules.filter(r => r.id !== ruleId)
    acl.updatedAt = Date.now()

    await this.updateACL(acl)
  }

  // Permission Checking
  async checkPermission(
    resourceId: string,
    userId: string,
    permission: string
  ): Promise<boolean> {
    const acl = await this.getACL(resourceId)

    if (!acl) {
      return false
    }

    // Owner has all permissions
    if (acl.ownerId === userId) {
      return true
    }

    // Check explicit rules
    for (const rule of acl.rules) {
      if (rule.subjectType === 'user' && rule.subjectId === userId) {
        if (rule.effect === 'deny') {
          return false
        }
        return rule.permissions.includes(permission) || rule.permissions.includes('*')
      }
    }

    // Check default permissions
    return acl.defaultPermissions.includes(permission)
  }

  async getUserPermissions(resourceId: string, userId: string): Promise<string[]> {
    const acl = await this.getACL(resourceId)

    if (!acl) {
      return []
    }

    if (acl.ownerId === userId) {
      return ['*']
    }

    const permissions = new Set<string>(acl.defaultPermissions)

    for (const rule of acl.rules) {
      if (rule.subjectType === 'user' && rule.subjectId === userId) {
        if (rule.effect === 'allow') {
          rule.permissions.forEach(p => permissions.add(p))
        } else {
          rule.permissions.forEach(p => permissions.delete(p))
        }
      }
    }

    return Array.from(permissions)
  }

  // Helper Methods
  private async updateACL(acl: AccessControlList): Promise<void> {
    const acls = await this.getAllACLs()
    const index = acls.findIndex(a => a.id === acl.id)

    if (index >= 0) {
      acls[index] = acl
      await this.store.setItem(this.ACL_KEY, acls)
    }
  }
}

// ===================================
// SECURITY SCANNING SERVICE
// ===================================

class SecurityScanningService {
  private readonly SCANS_KEY = 'security_scans'
  private readonly REPORTS_KEY = 'security_reports'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'security_scanning'
  })

  // Scanning
  async runScan(targetType: string, targetId: string): Promise<SecurityScan> {
    const scan: SecurityScan = {
      id: `scan_${Date.now()}`,
      type: 'full',
      targetType,
      targetId,
      status: 'running',
      startedAt: Date.now(),
      progress: 0,
      vulnerabilities: [],
      checkedItems: 0,
      totalItems: 100
    }

    await this.saveScan(scan)

    // Simulate scanning
    setTimeout(async () => {
      scan.status = 'completed'
      scan.completedAt = Date.now()
      scan.progress = 100
      scan.checkedItems = 100
      scan.vulnerabilities = await this.detectVulnerabilities()
      await this.saveScan(scan)
    }, 2000)

    return scan
  }

  async getScan(scanId: string): Promise<SecurityScan | null> {
    const scans = await this.getAllScans()
    return scans.find(s => s.id === scanId) || null
  }

  async getAllScans(): Promise<SecurityScan[]> {
    return await this.store.getItem<SecurityScan[]>(this.SCANS_KEY) || []
  }

  // Reporting
  async generateReport(scanId: string): Promise<SecurityReport> {
    const scan = await this.getScan(scanId)

    if (!scan) {
      throw new Error('Scan not found')
    }

    const report: SecurityReport = {
      id: `report_${Date.now()}`,
      scanId,
      generatedAt: Date.now(),
      summary: {
        totalVulnerabilities: scan.vulnerabilities.length,
        critical: scan.vulnerabilities.filter(v => v.severity === 'critical').length,
        high: scan.vulnerabilities.filter(v => v.severity === 'high').length,
        medium: scan.vulnerabilities.filter(v => v.severity === 'medium').length,
        low: scan.vulnerabilities.filter(v => v.severity === 'low').length
      },
      vulnerabilities: scan.vulnerabilities,
      recommendations: this.generateRecommendations(scan.vulnerabilities),
      complianceStatus: this.checkCompliance(scan.vulnerabilities)
    }

    const reports = await this.getAllReports()
    reports.push(report)
    await this.store.setItem(this.REPORTS_KEY, reports)

    return report
  }

  async getAllReports(): Promise<SecurityReport[]> {
    return await this.store.getItem<SecurityReport[]>(this.REPORTS_KEY) || []
  }

  // Helper Methods
  private async detectVulnerabilities(): Promise<SecurityVulnerability[]> {
    // Simulate vulnerability detection
    return [
      {
        id: 'vuln_1',
        type: 'xss',
        severity: 'high',
        title: 'Potential XSS vulnerability',
        description: 'User input not properly sanitized',
        location: 'messageInput.tsx:45',
        remediation: 'Sanitize user input before rendering',
        cveId: null,
        cvssScore: 7.5
      }
    ]
  }

  private generateRecommendations(vulnerabilities: SecurityVulnerability[]): string[] {
    const recommendations: string[] = []

    const critical = vulnerabilities.filter(v => v.severity === 'critical').length
    if (critical > 0) {
      recommendations.push(`Address ${critical} critical vulnerabilities immediately`)
    }

    const high = vulnerabilities.filter(v => v.severity === 'high').length
    if (high > 0) {
      recommendations.push(`Fix ${high} high-severity issues within 7 days`)
    }

    recommendations.push('Schedule regular security scans')
    recommendations.push('Update dependencies to latest versions')
    recommendations.push('Enable security monitoring')

    return recommendations
  }

  private checkCompliance(vulnerabilities: SecurityVulnerability[]): Record<string, boolean> {
    return {
      OWASP: vulnerabilities.filter(v => v.severity === 'critical').length === 0,
      PCI_DSS: vulnerabilities.length === 0,
      GDPR: true,
      SOC2: vulnerabilities.filter(v => v.severity === 'high').length === 0
    }
  }

  private async saveScan(scan: SecurityScan): Promise<void> {
    const scans = await this.getAllScans()
    const index = scans.findIndex(s => s.id === scan.id)

    if (index >= 0) {
      scans[index] = scan
    } else {
      scans.push(scan)
    }

    await this.store.setItem(this.SCANS_KEY, scans)
  }
}

// ===================================
// EXPORTS
// ===================================

export const e2eEncryptionService = new E2EEncryptionService()
export const privacyModeService = new PrivacyModeService()
export const sensitiveDataDetectionService = new SensitiveDataDetectionService()
export const aclService = new ACLService()
export const securityScanningService = new SecurityScanningService()

export default {
  e2eEncryption: e2eEncryptionService,
  privacyMode: privacyModeService,
  sensitiveDataDetection: sensitiveDataDetectionService,
  acl: aclService,
  securityScanning: securityScanningService
}

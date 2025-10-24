/**
 * Cloud Sync Service
 * Synchronizes data across devices using cloud storage
 * Supports offline mode with conflict resolution
 */

import localforage from 'localforage'
import { authService } from './authService'

export interface SyncConfig {
  autoSync: boolean
  syncInterval: number // milliseconds
  conflictResolution: 'local' | 'remote' | 'manual'
  enableEncryption: boolean
  maxRetries: number
}

export interface SyncData {
  id: string
  userId: string
  dataType: 'conversation' | 'settings' | 'workspace' | 'knowledge'
  data: any
  version: number
  checksum: string
  createdAt: number
  updatedAt: number
  deviceId: string
  isSynced: boolean
}

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncAt?: number
  pendingChanges: number
  failedSyncs: number
  syncedDevices: string[]
}

export interface SyncConflict {
  id: string
  dataType: string
  localData: SyncData
  remoteData: SyncData
  resolvedAt?: number
  resolution?: 'local' | 'remote' | 'merge'
}

export interface DeviceInfo {
  id: string
  name: string
  type: 'desktop' | 'mobile' | 'web'
  lastSyncAt: number
  isActive: boolean
}

export class CloudSyncService {
  private store: LocalForage
  private config: SyncConfig
  private syncStatus: SyncStatus
  private syncTimer: NodeJS.Timeout | null = null
  private pendingData: Map<string, SyncData> = new Map()
  private conflicts: Map<string, SyncConflict> = new Map()
  private deviceId: string
  private deviceInfo: DeviceInfo

  constructor(config: Partial<SyncConfig> = {}) {
    this.store = localforage.createInstance({
      name: 'cloud-sync-db',
      storeName: 'sync-data'
    })

    this.config = {
      autoSync: true,
      syncInterval: 60000, // 1 minute
      conflictResolution: 'local',
      enableEncryption: false,
      maxRetries: 3,
      ...config
    }

    this.syncStatus = {
      isOnline: navigator.onLine,
      isSyncing: false,
      pendingChanges: 0,
      failedSyncs: 0,
      syncedDevices: []
    }

    this.deviceId = this.getOrCreateDeviceId()
    this.deviceInfo = this.getDeviceInfo()

    // Listen to online/offline events
    window.addEventListener('online', () => this.handleOnline())
    window.addEventListener('offline', () => this.handleOffline())
  }

  /**
   * Initialize cloud sync service
   */
  async initialize(): Promise<void> {
    try {
      // Load pending data
      const pendingList = await this.store.getItem<SyncData[]>('pending-sync')
      if (pendingList) {
        pendingList.forEach(data => this.pendingData.set(data.id, data))
        this.syncStatus.pendingChanges = pendingList.length
      }

      // Load conflicts
      const conflictsList = await this.store.getItem<SyncConflict[]>('sync-conflicts')
      if (conflictsList) {
        conflictsList.forEach(conflict => this.conflicts.set(conflict.id, conflict))
      }

      // Load last sync time
      const lastSyncAt = await this.store.getItem<number>('last-sync-at')
      if (lastSyncAt) {
        this.syncStatus.lastSyncAt = lastSyncAt
      }

      // Start auto sync if enabled
      if (this.config.autoSync) {
        this.startAutoSync()
      }

      console.log('[CloudSync] Initialized', {
        deviceId: this.deviceId,
        pendingChanges: this.syncStatus.pendingChanges,
        conflicts: this.conflicts.size
      })
    } catch (error) {
      console.error('[CloudSync] Initialization error:', error)
    }
  }

  /**
   * Queue data for sync
   */
  async queueSync(
    dataType: 'conversation' | 'settings' | 'workspace' | 'knowledge',
    data: any,
    id?: string
  ): Promise<string> {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const syncId = id || `sync-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const now = Date.now()

    // Get existing data to determine version
    const existing = this.pendingData.get(syncId)
    const version = existing ? existing.version + 1 : 1

    const syncData: SyncData = {
      id: syncId,
      userId: user.id,
      dataType,
      data,
      version,
      checksum: this.calculateChecksum(data),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      deviceId: this.deviceId,
      isSynced: false
    }

    this.pendingData.set(syncId, syncData)
    this.syncStatus.pendingChanges = this.pendingData.size

    await this.savePendingData()

    // Trigger immediate sync if online
    if (this.syncStatus.isOnline && this.config.autoSync) {
      this.sync().catch(console.error)
    }

    return syncId
  }

  /**
   * Perform sync operation
   */
  async sync(): Promise<void> {
    if (this.syncStatus.isSyncing) {
      console.log('[CloudSync] Sync already in progress')
      return
    }

    if (!this.syncStatus.isOnline) {
      console.log('[CloudSync] Offline, sync skipped')
      return
    }

    const user = authService.getCurrentUser()
    if (!user) {
      console.log('[CloudSync] User not authenticated, sync skipped')
      return
    }

    this.syncStatus.isSyncing = true

    try {
      console.log(`[CloudSync] Starting sync (${this.pendingData.size} pending changes)`)

      // In production, this would call backend API
      // For now, simulate sync process
      await this.performMockSync()

      this.syncStatus.lastSyncAt = Date.now()
      await this.store.setItem('last-sync-at', this.syncStatus.lastSyncAt)

      console.log('[CloudSync] Sync completed successfully')
    } catch (error: any) {
      console.error('[CloudSync] Sync error:', error)
      this.syncStatus.failedSyncs++
      throw error
    } finally {
      this.syncStatus.isSyncing = false
    }
  }

  /**
   * Mock sync implementation (replace with real API calls in production)
   */
  private async performMockSync(): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mark all pending data as synced
    const synced: string[] = []
    for (const [id, data] of this.pendingData.entries()) {
      data.isSynced = true
      synced.push(id)
    }

    // Remove synced data
    synced.forEach(id => this.pendingData.delete(id))
    this.syncStatus.pendingChanges = this.pendingData.size

    await this.savePendingData()

    // Update device info
    this.deviceInfo.lastSyncAt = Date.now()
    this.deviceInfo.isActive = true
  }

  /**
   * Pull latest data from cloud
   */
  async pullFromCloud(): Promise<SyncData[]> {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    if (!this.syncStatus.isOnline) {
      throw new Error('No internet connection')
    }

    try {
      // In production, call backend API to fetch user's data
      // For now, return empty array
      console.log('[CloudSync] Pulling data from cloud')

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      const remoteData: SyncData[] = []

      // Check for conflicts
      for (const remote of remoteData) {
        const local = Array.from(this.pendingData.values())
          .find(d => d.dataType === remote.dataType && d.id === remote.id)

        if (local && local.version !== remote.version) {
          // Conflict detected
          const conflict: SyncConflict = {
            id: `conflict-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            dataType: remote.dataType,
            localData: local,
            remoteData: remote
          }

          this.conflicts.set(conflict.id, conflict)
          await this.saveConflicts()

          console.warn('[CloudSync] Conflict detected:', conflict)
        }
      }

      return remoteData
    } catch (error: any) {
      console.error('[CloudSync] Pull error:', error)
      throw error
    }
  }

  /**
   * Push local data to cloud
   */
  async pushToCloud(): Promise<void> {
    const user = authService.getCurrentUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    if (!this.syncStatus.isOnline) {
      throw new Error('No internet connection')
    }

    if (this.pendingData.size === 0) {
      console.log('[CloudSync] No pending changes to push')
      return
    }

    try {
      console.log(`[CloudSync] Pushing ${this.pendingData.size} changes to cloud`)

      // In production, call backend API to upload data
      // For now, simulate push
      await this.performMockSync()

      console.log('[CloudSync] Push completed')
    } catch (error: any) {
      console.error('[CloudSync] Push error:', error)
      throw error
    }
  }

  /**
   * Resolve sync conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: 'local' | 'remote' | 'merge',
    mergedData?: any
  ): Promise<void> {
    const conflict = this.conflicts.get(conflictId)
    if (!conflict) {
      throw new Error('Conflict not found')
    }

    let resolvedData: SyncData

    switch (resolution) {
      case 'local':
        resolvedData = conflict.localData
        break
      case 'remote':
        resolvedData = conflict.remoteData
        break
      case 'merge':
        if (!mergedData) {
          throw new Error('Merged data required for merge resolution')
        }
        resolvedData = {
          ...conflict.localData,
          data: mergedData,
          version: Math.max(conflict.localData.version, conflict.remoteData.version) + 1,
          updatedAt: Date.now(),
          checksum: this.calculateChecksum(mergedData)
        }
        break
    }

    // Queue resolved data for sync
    await this.queueSync(resolvedData.dataType, resolvedData.data, resolvedData.id)

    // Mark conflict as resolved
    conflict.resolvedAt = Date.now()
    conflict.resolution = resolution
    this.conflicts.delete(conflictId)

    await this.saveConflicts()

    console.log(`[CloudSync] Conflict ${conflictId} resolved using ${resolution}`)
  }

  /**
   * Get sync status
   */
  getStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  /**
   * Get pending changes
   */
  getPendingChanges(): SyncData[] {
    return Array.from(this.pendingData.values())
  }

  /**
   * Get unresolved conflicts
   */
  getConflicts(): SyncConflict[] {
    return Array.from(this.conflicts.values())
      .filter(c => !c.resolvedAt)
  }

  /**
   * Get device info
   */
  getDevice(): DeviceInfo {
    return { ...this.deviceInfo }
  }

  /**
   * List synced devices
   */
  async listDevices(): Promise<DeviceInfo[]> {
    // In production, fetch from backend
    // For now, return current device only
    return [this.deviceInfo]
  }

  /**
   * Remove device from sync
   */
  async removeDevice(deviceId: string): Promise<void> {
    // In production, call backend API
    console.log(`[CloudSync] Device ${deviceId} removed`)
  }

  /**
   * Enable/disable auto sync
   */
  setAutoSync(enabled: boolean): void {
    this.config.autoSync = enabled

    if (enabled) {
      this.startAutoSync()
    } else {
      this.stopAutoSync()
    }
  }

  /**
   * Start auto sync timer
   */
  private startAutoSync(): void {
    if (this.syncTimer) return

    this.syncTimer = setInterval(() => {
      this.sync().catch(console.error)
    }, this.config.syncInterval)

    console.log(`[CloudSync] Auto sync started (interval: ${this.config.syncInterval}ms)`)
  }

  /**
   * Stop auto sync timer
   */
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
      console.log('[CloudSync] Auto sync stopped')
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('[CloudSync] Network online')
    this.syncStatus.isOnline = true

    // Trigger sync if there are pending changes
    if (this.pendingData.size > 0 && this.config.autoSync) {
      this.sync().catch(console.error)
    }
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('[CloudSync] Network offline')
    this.syncStatus.isOnline = false
  }

  /**
   * Calculate data checksum
   */
  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Get or create device ID
   */
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('cloud-sync-device-id')
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substring(7)}`
      localStorage.setItem('cloud-sync-device-id', deviceId)
    }
    return deviceId
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): DeviceInfo {
    const name = this.getDeviceName()
    const type = this.getDeviceType()

    return {
      id: this.deviceId,
      name,
      type,
      lastSyncAt: Date.now(),
      isActive: true
    }
  }

  /**
   * Get device name
   */
  private getDeviceName(): string {
    const stored = localStorage.getItem('cloud-sync-device-name')
    if (stored) return stored

    const ua = navigator.userAgent
    if (/Windows/.test(ua)) return 'Windows PC'
    if (/Macintosh/.test(ua)) return 'Mac'
    if (/Linux/.test(ua)) return 'Linux PC'
    if (/Android/.test(ua)) return 'Android Device'
    if (/iPhone|iPad/.test(ua)) return 'iOS Device'

    return 'Unknown Device'
  }

  /**
   * Get device type
   */
  private getDeviceType(): 'desktop' | 'mobile' | 'web' {
    const ua = navigator.userAgent
    if (/Mobile|Android|iPhone|iPad/.test(ua)) return 'mobile'
    return 'desktop'
  }

  /**
   * Save pending data to storage
   */
  private async savePendingData(): Promise<void> {
    const list = Array.from(this.pendingData.values())
    await this.store.setItem('pending-sync', list)
  }

  /**
   * Save conflicts to storage
   */
  private async saveConflicts(): Promise<void> {
    const list = Array.from(this.conflicts.values())
    await this.store.setItem('sync-conflicts', list)
  }

  /**
   * Export sync data for backup
   */
  async exportData(): Promise<any> {
    return {
      config: this.config,
      pendingData: Array.from(this.pendingData.values()),
      conflicts: Array.from(this.conflicts.values()),
      device: this.deviceInfo,
      exportedAt: Date.now()
    }
  }

  /**
   * Import sync data from backup
   */
  async importData(data: any): Promise<void> {
    if (data.pendingData) {
      this.pendingData.clear()
      data.pendingData.forEach((d: SyncData) => this.pendingData.set(d.id, d))
      await this.savePendingData()
    }

    if (data.conflicts) {
      this.conflicts.clear()
      data.conflicts.forEach((c: SyncConflict) => this.conflicts.set(c.id, c))
      await this.saveConflicts()
    }

    console.log('[CloudSync] Data imported successfully')
  }

  /**
   * Clear all sync data
   */
  async clearAll(): Promise<void> {
    this.pendingData.clear()
    this.conflicts.clear()
    this.syncStatus.pendingChanges = 0
    this.syncStatus.failedSyncs = 0

    await this.store.clear()

    console.log('[CloudSync] All sync data cleared')
  }
}

/**
 * Global cloud sync service instance
 */
export const cloudSyncService = new CloudSyncService({
  autoSync: true,
  syncInterval: 60000,
  conflictResolution: 'local',
  enableEncryption: false,
  maxRetries: 3
})

/**
 * Initialize on module load
 */
cloudSyncService.initialize().catch(console.error)

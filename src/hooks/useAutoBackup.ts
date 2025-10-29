import { useEffect, useRef, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import localforage from 'localforage'

export interface AutoBackupOptions {
  enabled?: boolean
  interval?: number // 备份间隔（毫秒）
  maxBackups?: number // 最大备份数量
  onBackup?: (backup: Backup) => void
  onRestore?: (backup: Backup) => void
  onError?: (error: Error) => void
}

export interface Backup {
  id: string
  timestamp: number
  data: any
  size: number
  type: 'auto' | 'manual'
  description?: string
}

const DEFAULT_OPTIONS: Required<AutoBackupOptions> = {
  enabled: true,
  interval: 5 * 60 * 1000, // 5 分钟
  maxBackups: 10,
  onBackup: () => {},
  onRestore: () => {},
  onError: () => {}
}

/**
 * 自动备份 Hook
 *
 * 功能:
 * - 定时自动备份
 * - 本地存储备份
 * - 备份历史管理
 * - 手动备份/恢复
 * - 备份数据压缩
 *
 * @example
 * const backup = useAutoBackup(conversations, {
 *   interval: 5 * 60 * 1000, // 5分钟
 *   maxBackups: 10
 * })
 *
 * // 手动备份
 * backup.createBackup('重要节点')
 *
 * // 查看备份历史
 * const backups = await backup.listBackups()
 *
 * // 恢复备份
 * await backup.restoreBackup(backupId)
 */
export const useAutoBackup = <T = any>(
  data: T,
  options: AutoBackupOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastBackupRef = useRef<number>(0)

  // 备份存储键
  const BACKUP_KEY = 'chat-studio-backups'

  // 初始化 localforage
  const backupStore = localforage.createInstance({
    name: 'chat-studio',
    storeName: 'backups'
  })

  /**
   * 计算数据大小（字节）
   */
  const calculateSize = (data: any): number => {
    return new Blob([JSON.stringify(data)]).size
  }

  /**
   * 创建备份
   */
  const createBackup = useCallback(async (
    description?: string,
    type: 'auto' | 'manual' = 'manual'
  ): Promise<Backup | null> => {
    try {
      const backup: Backup = {
        id: `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        data,
        size: calculateSize(data),
        type,
        description
      }

      // 获取现有备份
      const existingBackups = await listBackups()

      // 添加新备份
      const updatedBackups = [backup, ...existingBackups]

      // 限制备份数量
      const trimmedBackups = updatedBackups.slice(0, opts.maxBackups)

      // 保存
      await backupStore.setItem(BACKUP_KEY, trimmedBackups)

      lastBackupRef.current = Date.now()
      opts.onBackup(backup)

      if (type === 'manual') {
        toast.success('备份创建成功')
      }

      return backup
    } catch (error) {
      const err = error as Error
      opts.onError(err)
      toast.error(`备份失败: ${err.message}`)
      return null
    }
  }, [data, opts])

  /**
   * 列出所有备份
   */
  const listBackups = useCallback(async (): Promise<Backup[]> => {
    try {
      const backups = await backupStore.getItem<Backup[]>(BACKUP_KEY)
      return backups || []
    } catch (error) {
      console.error('Failed to list backups:', error)
      return []
    }
  }, [])

  /**
   * 恢复备份
   */
  const restoreBackup = useCallback(async (backupId: string): Promise<T | null> => {
    try {
      const backups = await listBackups()
      const backup = backups.find(b => b.id === backupId)

      if (!backup) {
        toast.error('备份不存在')
        return null
      }

      opts.onRestore(backup)
      toast.success('备份恢复成功')

      return backup.data as T
    } catch (error) {
      const err = error as Error
      opts.onError(err)
      toast.error(`恢复失败: ${err.message}`)
      return null
    }
  }, [opts])

  /**
   * 删除备份
   */
  const deleteBackup = useCallback(async (backupId: string): Promise<boolean> => {
    try {
      const backups = await listBackups()
      const updatedBackups = backups.filter(b => b.id !== backupId)
      await backupStore.setItem(BACKUP_KEY, updatedBackups)
      toast.success('备份已删除')
      return true
    } catch (error) {
      const err = error as Error
      toast.error(`删除失败: ${err.message}`)
      return false
    }
  }, [])

  /**
   * 清空所有备份
   */
  const clearAllBackups = useCallback(async (): Promise<boolean> => {
    try {
      await backupStore.removeItem(BACKUP_KEY)
      toast.success('所有备份已清空')
      return true
    } catch (error) {
      const err = error as Error
      toast.error(`清空失败: ${err.message}`)
      return false
    }
  }, [])

  /**
   * 导出备份
   */
  const exportBackup = useCallback(async (backupId: string): Promise<void> => {
    try {
      const backups = await listBackups()
      const backup = backups.find(b => b.id === backupId)

      if (!backup) {
        toast.error('备份不存在')
        return
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup_${new Date(backup.timestamp).toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('备份已导出')
    } catch (error) {
      const err = error as Error
      toast.error(`导出失败: ${err.message}`)
    }
  }, [])

  /**
   * 导入备份
   */
  const importBackup = useCallback(async (file: File): Promise<Backup | null> => {
    try {
      const text = await file.text()
      const backup = JSON.parse(text) as Backup

      // 验证备份格式
      if (!backup.id || !backup.timestamp || !backup.data) {
        throw new Error('无效的备份文件格式')
      }

      // 获取现有备份
      const existingBackups = await listBackups()

      // 检查是否已存在
      if (existingBackups.some(b => b.id === backup.id)) {
        toast.warning('该备份已存在')
        return backup
      }

      // 添加到备份列表
      const updatedBackups = [backup, ...existingBackups].slice(0, opts.maxBackups)
      await backupStore.setItem(BACKUP_KEY, updatedBackups)

      toast.success('备份导入成功')
      return backup
    } catch (error) {
      const err = error as Error
      toast.error(`导入失败: ${err.message}`)
      return null
    }
  }, [opts.maxBackups])

  /**
   * 获取备份统计
   */
  const getBackupStats = useCallback(async () => {
    const backups = await listBackups()
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0)
    const autoBackups = backups.filter(b => b.type === 'auto').length
    const manualBackups = backups.filter(b => b.type === 'manual').length
    const lastBackup = backups[0]

    return {
      total: backups.length,
      autoBackups,
      manualBackups,
      totalSize,
      lastBackup,
      averageSize: backups.length > 0 ? totalSize / backups.length : 0
    }
  }, [])

  // 自动备份
  useEffect(() => {
    if (!opts.enabled) return

    const performAutoBackup = async () => {
      const now = Date.now()
      const timeSinceLastBackup = now - lastBackupRef.current

      // 如果距离上次备份超过间隔时间，执行备份
      if (timeSinceLastBackup >= opts.interval) {
        await createBackup('自动备份', 'auto')
      }
    }

    // 立即执行一次检查
    performAutoBackup()

    // 设置定时器
    intervalRef.current = setInterval(performAutoBackup, opts.interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [data, opts.enabled, opts.interval, createBackup])

  return {
    createBackup,
    listBackups,
    restoreBackup,
    deleteBackup,
    clearAllBackups,
    exportBackup,
    importBackup,
    getBackupStats
  }
}

export default useAutoBackup

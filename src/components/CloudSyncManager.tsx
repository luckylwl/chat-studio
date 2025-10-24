/**
 * Cloud Sync Manager Component
 * UI for managing cloud synchronization settings and status
 */

import React, { useState, useEffect } from 'react'
import {
  CloudIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  Cog6ToothIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'
import { Button, Card } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import {
  cloudSyncService,
  type SyncStatus,
  type SyncConflict,
  type DeviceInfo,
  type SyncData
} from '@/services/cloudSyncService'

interface CloudSyncManagerProps {
  className?: string
}

const CloudSyncManager: React.FC<CloudSyncManagerProps> = ({ className }) => {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [pendingChanges, setPendingChanges] = useState<SyncData[]>([])
  const [conflicts, setConflicts] = useState<SyncConflict[]>([])
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [autoSync, setAutoSync] = useState(true)
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null)

  useEffect(() => {
    loadSyncInfo()
    const interval = setInterval(loadSyncInfo, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const loadSyncInfo = async () => {
    try {
      const syncStatus = cloudSyncService.getStatus()
      setStatus(syncStatus)

      const pending = cloudSyncService.getPendingChanges()
      setPendingChanges(pending)

      const conflictsList = cloudSyncService.getConflicts()
      setConflicts(conflictsList)

      const devicesList = await cloudSyncService.listDevices()
      setDevices(devicesList)

      const currentDevice = cloudSyncService.getDevice()
      // Auto-sync is determined by service config
    } catch (error: any) {
      console.error('Failed to load sync info:', error)
    }
  }

  const handleManualSync = async () => {
    setIsSyncing(true)
    try {
      await cloudSyncService.sync()
      toast.success('同步完成')
      await loadSyncInfo()
    } catch (error: any) {
      toast.error(`同步失败: ${error.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const handlePullFromCloud = async () => {
    setIsSyncing(true)
    try {
      const data = await cloudSyncService.pullFromCloud()
      toast.success(`从云端拉取了 ${data.length} 项数据`)
      await loadSyncInfo()
    } catch (error: any) {
      toast.error(`拉取失败: ${error.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const handlePushToCloud = async () => {
    setIsSyncing(true)
    try {
      await cloudSyncService.pushToCloud()
      toast.success('推送完成')
      await loadSyncInfo()
    } catch (error: any) {
      toast.error(`推送失败: ${error.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleToggleAutoSync = (enabled: boolean) => {
    cloudSyncService.setAutoSync(enabled)
    setAutoSync(enabled)
    toast.success(enabled ? '已启用自动同步' : '已禁用自动同步')
  }

  const handleResolveConflict = async (
    conflictId: string,
    resolution: 'local' | 'remote'
  ) => {
    try {
      await cloudSyncService.resolveConflict(conflictId, resolution)
      toast.success('冲突已解决')
      setShowConflictModal(false)
      setSelectedConflict(null)
      await loadSyncInfo()
    } catch (error: any) {
      toast.error(`解决冲突失败: ${error.message}`)
    }
  }

  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm('确定要移除这个设备吗？')) return

    try {
      await cloudSyncService.removeDevice(deviceId)
      toast.success('设备已移除')
      await loadSyncInfo()
    } catch (error: any) {
      toast.error(`移除失败: ${error.message}`)
    }
  }

  const handleExportData = async () => {
    try {
      const data = await cloudSyncService.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sync-backup-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('数据已导出')
    } catch (error: any) {
      toast.error(`导出失败: ${error.message}`)
    }
  }

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile':
        return <DevicePhoneMobileIcon className="w-5 h-5" />
      case 'desktop':
        return <ComputerDesktopIcon className="w-5 h-5" />
      default:
        return <CloudIcon className="w-5 h-5" />
    }
  }

  const getDataTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      conversation: '对话',
      settings: '设置',
      workspace: '工作空间',
      knowledge: '知识库'
    }
    return labels[type] || type
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = Date.now()
    const diff = now - timestamp

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    return date.toLocaleDateString()
  }

  if (!status) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <p className="text-gray-600 dark:text-gray-400">加载中...</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudIcon className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            云端同步
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleManualSync}
            disabled={isSyncing || !status.isOnline}
            size="sm"
          >
            <ArrowPathIcon className={cn('w-4 h-4 mr-1', isSyncing && 'animate-spin')} />
            {isSyncing ? '同步中...' : '立即同步'}
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className={cn(
        'p-4',
        status.isOnline
          ? 'bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800'
          : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800'
      )}>
        <div className="flex items-start gap-3">
          {status.isOnline ? (
            <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
          ) : (
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {status.isOnline ? '在线 - 自动同步已启用' : '离线 - 更改将在在线时同步'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-gray-600 dark:text-gray-400">上次同步</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {status.lastSyncAt ? formatTimestamp(status.lastSyncAt) : '从未'}
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">待同步</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {status.pendingChanges} 项
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">冲突</div>
                <div className={cn(
                  'font-medium',
                  conflicts.length > 0
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-gray-900 dark:text-gray-100'
                )}>
                  {conflicts.length} 个
                </div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-gray-400">设备数</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {devices.length} 台
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Settings */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cog6ToothIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">
                自动同步
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                自动同步数据到云端
              </div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => handleToggleAutoSync(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </Card>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                同步冲突需要解决 ({conflicts.length})
              </h3>
              <div className="space-y-2">
                {conflicts.map((conflict) => (
                  <div
                    key={conflict.id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {getDataTypeLabel(conflict.dataType)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        本地版本 vs 云端版本
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveConflict(conflict.id, 'local')}
                      >
                        保留本地
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResolveConflict(conflict.id, 'remote')}
                      >
                        使用云端
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Pending Changes */}
      {pendingChanges.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              待同步更改 ({pendingChanges.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePushToCloud}
              disabled={isSyncing || !status.isOnline}
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-1" />
              推送到云端
            </Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {pendingChanges.map((change) => (
              <div
                key={change.id}
                className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm"
              >
                <ClockIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {getDataTypeLabel(change.dataType)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {formatTimestamp(change.updatedAt)}
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  v{change.version}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Devices */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          已同步设备 ({devices.length})
        </h3>
        <div className="space-y-2">
          {devices.map((device) => (
            <div
              key={device.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="text-gray-600 dark:text-gray-400">
                {getDeviceIcon(device.type)}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {device.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  上次同步: {formatTimestamp(device.lastSyncAt)}
                </div>
              </div>
              {device.isActive && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  当前设备
                </span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
          数据管理
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePullFromCloud}
            disabled={isSyncing || !status.isOnline}
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
            从云端拉取
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
          >
            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
            导出备份
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (confirm('确定要清除所有同步数据吗？这不会删除云端数据。')) {
                await cloudSyncService.clearAll()
                await loadSyncInfo()
                toast.success('本地同步数据已清除')
              }
            }}
            className="text-red-600 hover:text-red-700"
          >
            <TrashIcon className="w-4 h-4 mr-1" />
            清除本地数据
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default CloudSyncManager

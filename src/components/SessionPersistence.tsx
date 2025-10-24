import React, { useState, useEffect, useRef } from 'react'
import { Save, RefreshCw, Upload, Download, Clock, Database, AlertTriangle, CheckCircle, XCircle, Settings, Shield, FileText, Trash2, Eye, Copy, Archive, Zap, Cloud, HardDrive, Wifi, WifiOff } from 'lucide-react'

interface SessionData {
  id: string
  timestamp: Date
  version: string
  data: {
    conversations: any[]
    settings: any
    models: any[]
    plugins: any[]
    themes: any
    shortcuts: any[]
    userPreferences: any
  }
  size: number
  checksum: string
  metadata: {
    userAgent: string
    platform: string
    appVersion: string
    dataVersion: string
  }
}

interface AutoSaveConfig {
  enabled: boolean
  interval: number // minutes
  maxSessions: number
  compression: boolean
  encryption: boolean
  cloudSync: boolean
}

interface RecoveryOption {
  id: string
  name: string
  description: string
  timestamp: Date
  size: number
  isCorrupted: boolean
  hasConflicts: boolean
  dataTypes: string[]
}

const SessionPersistence: React.FC = () => {
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [autoSaveConfig, setAutoSaveConfig] = useState<AutoSaveConfig>({
    enabled: true,
    interval: 5,
    maxSessions: 50,
    compression: true,
    encryption: true,
    cloudSync: false
  })
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastSave, setLastSave] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [recoveryOptions, setRecoveryOptions] = useState<RecoveryOption[]>([])
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [storageStats, setStorageStats] = useState({
    used: 0,
    total: 0,
    available: 0
  })
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [conflictResolution, setConflictResolution] = useState<'local' | 'remote' | 'merge'>('merge')

  const autoSaveIntervalRef = useRef<NodeJS.Timeout>()
  const saveQueueRef = useRef<any[]>([])

  // Mock session data
  useEffect(() => {
    const mockSessions: SessionData[] = [
      {
        id: 'session-1',
        timestamp: new Date('2024-01-15T10:30:00'),
        version: '1.0.0',
        data: {
          conversations: Array(15).fill(null).map((_, i) => ({ id: `conv-${i}`, title: `Conversation ${i + 1}` })),
          settings: { theme: 'dark', language: 'zh' },
          models: [{ id: 'gpt-4', name: 'GPT-4' }],
          plugins: [],
          themes: {},
          shortcuts: [],
          userPreferences: {}
        },
        size: 2450000, // ~2.45MB
        checksum: 'a1b2c3d4e5f6',
        metadata: {
          userAgent: 'Chrome/120.0.0.0',
          platform: 'Windows',
          appVersion: '1.0.0',
          dataVersion: '1.0'
        }
      },
      {
        id: 'session-2',
        timestamp: new Date('2024-01-15T09:15:00'),
        version: '1.0.0',
        data: {
          conversations: Array(12).fill(null).map((_, i) => ({ id: `conv-${i}`, title: `Conversation ${i + 1}` })),
          settings: { theme: 'light', language: 'en' },
          models: [{ id: 'gpt-3.5', name: 'GPT-3.5' }],
          plugins: [],
          themes: {},
          shortcuts: [],
          userPreferences: {}
        },
        size: 1980000, // ~1.98MB
        checksum: 'b2c3d4e5f6a1',
        metadata: {
          userAgent: 'Chrome/120.0.0.0',
          platform: 'Windows',
          appVersion: '1.0.0',
          dataVersion: '1.0'
        }
      }
    ]

    const mockRecoveryOptions: RecoveryOption[] = [
      {
        id: 'auto-save-1',
        name: '自动保存 - 最新',
        description: '应用崩溃前5分钟的自动保存',
        timestamp: new Date('2024-01-15T10:35:00'),
        size: 2560000,
        isCorrupted: false,
        hasConflicts: false,
        dataTypes: ['conversations', 'settings', 'models']
      },
      {
        id: 'manual-save-1',
        name: '手动保存 - 工作会话',
        description: '用户手动保存的完整工作会话',
        timestamp: new Date('2024-01-15T09:45:00'),
        size: 3120000,
        isCorrupted: false,
        hasConflicts: true,
        dataTypes: ['conversations', 'settings', 'models', 'plugins', 'themes']
      },
      {
        id: 'cloud-backup-1',
        name: '云端备份',
        description: '上次同步到云端的备份数据',
        timestamp: new Date('2024-01-15T08:30:00'),
        size: 2890000,
        isCorrupted: false,
        hasConflicts: false,
        dataTypes: ['conversations', 'settings']
      }
    ]

    setSessions(mockSessions)
    setRecoveryOptions(mockRecoveryOptions)
    setLastSave(new Date('2024-01-15T10:30:00'))

    // Mock storage stats
    setStorageStats({
      used: 15.7 * 1024 * 1024, // 15.7MB
      total: 100 * 1024 * 1024, // 100MB
      available: 84.3 * 1024 * 1024 // 84.3MB
    })
  }, [])

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveConfig.enabled) {
      autoSaveIntervalRef.current = setInterval(() => {
        performAutoSave()
      }, autoSaveConfig.interval * 60 * 1000)
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current)
      }
    }
  }, [autoSaveConfig.enabled, autoSaveConfig.interval])

  const performAutoSave = async () => {
    if (saveStatus === 'saving') return

    setSaveStatus('saving')

    try {
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newSession: SessionData = {
        id: `auto-save-${Date.now()}`,
        timestamp: new Date(),
        version: '1.0.0',
        data: {
          conversations: [],
          settings: {},
          models: [],
          plugins: [],
          themes: {},
          shortcuts: [],
          userPreferences: {}
        },
        size: Math.random() * 3000000,
        checksum: Math.random().toString(36).substring(7),
        metadata: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          appVersion: '1.0.0',
          dataVersion: '1.0'
        }
      }

      setSessions(prev => {
        const updated = [newSession, ...prev]
        if (updated.length > autoSaveConfig.maxSessions) {
          return updated.slice(0, autoSaveConfig.maxSessions)
        }
        return updated
      })

      setLastSave(new Date())
      setSaveStatus('success')

      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const manualSave = async () => {
    await performAutoSave()
  }

  const loadSession = async (sessionId: string) => {
    setSaveStatus('saving')

    try {
      // Simulate loading
      await new Promise(resolve => setTimeout(resolve, 1500))

      const session = sessions.find(s => s.id === sessionId)
      if (session) {
        // Here you would restore the session data
        console.log('Loading session:', session)
        setSaveStatus('success')
      }
    } catch (error) {
      setSaveStatus('error')
    }

    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const exportSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `session-${session.id}-${session.timestamp.toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const importSession = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const sessionData = JSON.parse(e.target?.result as string)
          setSessions(prev => [sessionData, ...prev])
        } catch (error) {
          alert('Invalid session file format')
        }
      }
      reader.readAsText(file)
    }
  }

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId))
  }

  const performRecovery = async (recoveryId: string) => {
    const option = recoveryOptions.find(r => r.id === recoveryId)
    if (!option) return

    setSaveStatus('saving')

    try {
      // Simulate recovery
      await new Promise(resolve => setTimeout(resolve, 2000))

      console.log('Recovering from:', option)
      setSaveStatus('success')
      setShowRecoveryModal(false)
    } catch (error) {
      setSaveStatus('error')
    }

    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  const performCloudSync = async () => {
    if (!isOnline) return

    setSyncStatus('syncing')

    try {
      // Simulate cloud sync
      await new Promise(resolve => setTimeout(resolve, 3000))
      setSyncStatus('success')
    } catch (error) {
      setSyncStatus('error')
    }

    setTimeout(() => setSyncStatus('idle'), 2000)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'saving':
      case 'syncing':
        return <RefreshCw className="w-4 h-4 animate-spin" />
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header & Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">会话持久化</h2>
              <p className="text-gray-600 dark:text-gray-400">自动保存和恢复系统</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              {isOnline ? (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Wifi className="w-4 h-4" />
                  <span>在线</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <WifiOff className="w-4 h-4" />
                  <span>离线</span>
                </div>
              )}
            </div>

            <button
              onClick={manualSave}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {getStatusIcon(saveStatus)}
              <span>手动保存</span>
            </button>
          </div>
        </div>

        {/* Status Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">最后保存</span>
              {getStatusIcon(saveStatus)}
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {lastSave ? lastSave.toLocaleTimeString() : '从未'}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">存储使用</span>
              <HardDrive className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatFileSize(storageStats.used)} / {formatFileSize(storageStats.total)}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">会话数量</span>
              <FileText className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {sessions.length}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">云同步</span>
              {getStatusIcon(syncStatus)}
            </div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {autoSaveConfig.cloudSync ? '已启用' : '已禁用'}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Save Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">自动保存配置</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={autoSaveConfig.enabled}
                onChange={(e) => setAutoSaveConfig(prev => ({ ...prev, enabled: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">启用自动保存</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-500">定期自动保存会话数据</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              保存间隔 (分钟)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={autoSaveConfig.interval}
              onChange={(e) => setAutoSaveConfig(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              最大保存数量
            </label>
            <input
              type="number"
              min="5"
              max="100"
              value={autoSaveConfig.maxSessions}
              onChange={(e) => setAutoSaveConfig(prev => ({ ...prev, maxSessions: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={autoSaveConfig.compression}
                onChange={(e) => setAutoSaveConfig(prev => ({ ...prev, compression: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">数据压缩</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-500">减少存储空间占用</p>
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={autoSaveConfig.encryption}
                onChange={(e) => setAutoSaveConfig(prev => ({ ...prev, encryption: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">数据加密</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-500">保护隐私数据安全</p>
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={autoSaveConfig.cloudSync}
                onChange={(e) => setAutoSaveConfig(prev => ({ ...prev, cloudSync: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">云端同步</span>
            </label>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 dark:text-gray-500">自动同步到云端</p>
              {autoSaveConfig.cloudSync && (
                <button
                  onClick={performCloudSync}
                  disabled={!isOnline || syncStatus === 'syncing'}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  立即同步
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Session Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Archive className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">会话管理</h3>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".json"
              onChange={importSession}
              className="hidden"
              id="import-session"
            />
            <label
              htmlFor="import-session"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>导入</span>
            </label>

            <button
              onClick={() => setShowRecoveryModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>恢复选项</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-all ${
                selectedSession === session.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <input
                    type="radio"
                    name="selected-session"
                    checked={selectedSession === session.id}
                    onChange={() => setSelectedSession(session.id)}
                    className="text-blue-500"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        会话 {session.id}
                      </h4>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                        v{session.version}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{session.timestamp.toLocaleString()}</span>
                      <span>{formatFileSize(session.size)}</span>
                      <span>{session.data.conversations.length} 对话</span>
                      <span>校验: {session.checksum}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadSession(session.id)}
                    className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                    title="加载会话"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => exportSession(session.id)}
                    className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded transition-colors"
                    title="导出会话"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(JSON.stringify(session, null, 2))}
                    className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="复制到剪贴板"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                    title="删除会话"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">会话恢复选项</h3>
                <button
                  onClick={() => setShowRecoveryModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {recoveryOptions.map((option) => (
                  <div
                    key={option.id}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{option.name}</h4>
                      <div className="flex items-center gap-2">
                        {option.isCorrupted && (
                          <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs rounded">
                            损坏
                          </span>
                        )}
                        {option.hasConflicts && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs rounded">
                            冲突
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{option.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                        <span>{option.timestamp.toLocaleString()}</span>
                        <span>{formatFileSize(option.size)}</span>
                        <span>{option.dataTypes.join(', ')}</span>
                      </div>

                      <button
                        onClick={() => performRecovery(option.id)}
                        disabled={option.isCorrupted}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        恢复
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Conflict Resolution */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">冲突解决策略</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'local', label: '保留本地' },
                    { value: 'remote', label: '使用远程' },
                    { value: 'merge', label: '智能合并' }
                  ].map((strategy) => (
                    <label key={strategy.value} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="conflict-resolution"
                        value={strategy.value}
                        checked={conflictResolution === strategy.value}
                        onChange={(e) => setConflictResolution(e.target.value as any)}
                        className="text-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{strategy.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Storage Analytics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">存储分析</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">存储使用情况</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">已使用</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatFileSize(storageStats.used)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(storageStats.used / storageStats.total) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
                <span>0</span>
                <span>{formatFileSize(storageStats.total)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">数据分布</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">会话数据</span>
                <span className="font-medium text-gray-900 dark:text-white">85%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">设置配置</span>
                <span className="font-medium text-gray-900 dark:text-white">8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">缓存文件</span>
                <span className="font-medium text-gray-900 dark:text-white">7%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SessionPersistence
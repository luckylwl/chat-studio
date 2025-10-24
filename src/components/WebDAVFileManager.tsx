import React, { useState, useEffect, useRef } from 'react'
import { Cloud, Upload, Download, Folder, File, Plus, Trash2, Edit3, Copy, Move, RefreshCw, Settings, Lock, Unlock, Calendar, Clock, HardDrive, Database, RefreshCw as Sync, CheckCircle, XCircle, AlertTriangle, Search, Filter, Grid, List, MoreVertical, FolderOpen, Share2, Archive, Tag, Star, Eye, ExternalLink, Shield } from 'lucide-react'

interface WebDAVFile {
  id: string
  name: string
  type: 'file' | 'folder'
  size: number
  lastModified: Date
  path: string
  mimeType?: string
  isShared: boolean
  isStarred: boolean
  tags: string[]
  permissions: {
    read: boolean
    write: boolean
    delete: boolean
  }
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error'
  checksumLocal?: string
  checksumRemote?: string
}

interface WebDAVConnection {
  id: string
  name: string
  url: string
  username: string
  password: string // 实际应用中应该加密存储
  isActive: boolean
  lastSync: Date | null
  syncInterval: number // minutes
  autoSync: boolean
  encryption: boolean
  compression: boolean
  maxFileSize: number // MB
  allowedExtensions: string[]
  totalSpace: number
  usedSpace: number
}

interface BackupJob {
  id: string
  name: string
  description: string
  connectionId: string
  sourcePaths: string[]
  targetPath: string
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly'
  scheduleTime?: string
  retentionDays: number
  compression: boolean
  encryption: boolean
  isActive: boolean
  lastRun: Date | null
  nextRun: Date | null
  status: 'idle' | 'running' | 'success' | 'error'
  progress: number
  filesProcessed: number
  totalFiles: number
}

const WebDAVFileManager: React.FC = () => {
  const [connections, setConnections] = useState<WebDAVConnection[]>([])
  const [activeConnection, setActiveConnection] = useState<string | null>(null)
  const [files, setFiles] = useState<WebDAVFile[]>([])
  const [currentPath, setCurrentPath] = useState('/')
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([])
  const [activeJob, setActiveJob] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [conflictFiles, setConflictFiles] = useState<WebDAVFile[]>([])
  const [showConflictModal, setShowConflictModal] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock data initialization
  useEffect(() => {
    const mockConnections: WebDAVConnection[] = [
      {
        id: 'webdav-1',
        name: 'Nextcloud Personal',
        url: 'https://cloud.example.com/remote.php/dav/files/username/',
        username: 'user@example.com',
        password: '********',
        isActive: true,
        lastSync: new Date('2024-01-15T14:30:00'),
        syncInterval: 15,
        autoSync: true,
        encryption: true,
        compression: true,
        maxFileSize: 500,
        allowedExtensions: ['*'],
        totalSpace: 10 * 1024 * 1024 * 1024, // 10GB
        usedSpace: 3.2 * 1024 * 1024 * 1024 // 3.2GB
      },
      {
        id: 'webdav-2',
        name: 'Company SharePoint',
        url: 'https://company.sharepoint.com/sites/team/Shared%20Documents/',
        username: 'user@company.com',
        password: '********',
        isActive: false,
        lastSync: new Date('2024-01-14T10:15:00'),
        syncInterval: 30,
        autoSync: false,
        encryption: false,
        compression: false,
        maxFileSize: 250,
        allowedExtensions: ['pdf', 'docx', 'xlsx', 'pptx'],
        totalSpace: 1024 * 1024 * 1024 * 1024, // 1TB
        usedSpace: 45.8 * 1024 * 1024 * 1024 // 45.8GB
      }
    ]

    const mockFiles: WebDAVFile[] = [
      {
        id: 'file-1',
        name: 'AI研究文档',
        type: 'folder',
        size: 0,
        lastModified: new Date('2024-01-15T12:00:00'),
        path: '/AI研究文档',
        isShared: true,
        isStarred: false,
        tags: ['research', 'ai'],
        permissions: { read: true, write: true, delete: true },
        syncStatus: 'synced'
      },
      {
        id: 'file-2',
        name: 'ChatGPT对话记录.json',
        type: 'file',
        size: 2450000,
        lastModified: new Date('2024-01-15T14:30:00'),
        path: '/ChatGPT对话记录.json',
        mimeType: 'application/json',
        isShared: false,
        isStarred: true,
        tags: ['chatgpt', 'backup'],
        permissions: { read: true, write: true, delete: true },
        syncStatus: 'pending',
        checksumLocal: 'a1b2c3d4',
        checksumRemote: 'a1b2c3d5'
      },
      {
        id: 'file-3',
        name: 'AI模型配置.yaml',
        type: 'file',
        size: 15680,
        lastModified: new Date('2024-01-14T16:45:00'),
        path: '/AI模型配置.yaml',
        mimeType: 'application/x-yaml',
        isShared: true,
        isStarred: false,
        tags: ['config', 'models'],
        permissions: { read: true, write: false, delete: false },
        syncStatus: 'conflict',
        checksumLocal: 'x1y2z3w4',
        checksumRemote: 'x1y2z3w5'
      },
      {
        id: 'file-4',
        name: '项目备份',
        type: 'folder',
        size: 0,
        lastModified: new Date('2024-01-13T09:20:00'),
        path: '/项目备份',
        isShared: false,
        isStarred: true,
        tags: ['backup', 'projects'],
        permissions: { read: true, write: true, delete: true },
        syncStatus: 'synced'
      }
    ]

    const mockBackupJobs: BackupJob[] = [
      {
        id: 'backup-1',
        name: '每日对话备份',
        description: '自动备份所有对话记录到云端',
        connectionId: 'webdav-1',
        sourcePaths: ['/conversations', '/settings'],
        targetPath: '/backups/daily',
        schedule: 'daily',
        scheduleTime: '02:00',
        retentionDays: 30,
        compression: true,
        encryption: true,
        isActive: true,
        lastRun: new Date('2024-01-15T02:00:00'),
        nextRun: new Date('2024-01-16T02:00:00'),
        status: 'success',
        progress: 100,
        filesProcessed: 156,
        totalFiles: 156
      },
      {
        id: 'backup-2',
        name: '项目文档同步',
        description: '同步项目文档到公司SharePoint',
        connectionId: 'webdav-2',
        sourcePaths: ['/projects', '/documents'],
        targetPath: '/team-ai-projects',
        schedule: 'weekly',
        scheduleTime: '18:00',
        retentionDays: 90,
        compression: false,
        encryption: false,
        isActive: false,
        lastRun: new Date('2024-01-08T18:00:00'),
        nextRun: new Date('2024-01-15T18:00:00'),
        status: 'idle',
        progress: 0,
        filesProcessed: 0,
        totalFiles: 0
      }
    ]

    setConnections(mockConnections)
    setFiles(mockFiles)
    setBackupJobs(mockBackupJobs)
    setActiveConnection('webdav-1')
    setConflictFiles(mockFiles.filter(f => f.syncStatus === 'conflict'))
  }, [])

  const activeConn = connections.find(c => c.id === activeConnection)

  const filteredFiles = files
    .filter(file => {
      if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'date':
          comparison = a.lastModified.getTime() - b.lastModified.getTime()
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: WebDAVFile) => {
    if (file.type === 'folder') {
      return <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf':
        return <File className="w-5 h-5 text-red-600 dark:text-red-400" />
      case 'json':
      case 'yaml':
      case 'yml':
        return <File className="w-5 h-5 text-green-600 dark:text-green-400" />
      case 'md':
        return <File className="w-5 h-5 text-purple-600 dark:text-purple-400" />
      default:
        return <File className="w-5 h-5 text-gray-600 dark:text-gray-400" />
    }
  }

  const getSyncStatusIcon = (status: WebDAVFile['syncStatus']) => {
    switch (status) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'conflict':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)))
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (!activeConnection) return

    setSyncStatus('syncing')

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileId = `upload-${Date.now()}-${i}`

      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))

      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setUploadProgress(prev => ({ ...prev, [fileId]: progress }))
      }

      // Add to files list
      const newFile: WebDAVFile = {
        id: fileId,
        name: file.name,
        type: 'file',
        size: file.size,
        lastModified: new Date(),
        path: `${currentPath}/${file.name}`,
        mimeType: file.type,
        isShared: false,
        isStarred: false,
        tags: [],
        permissions: { read: true, write: true, delete: true },
        syncStatus: 'synced'
      }

      setFiles(prev => [...prev, newFile])
      setUploadProgress(prev => {
        const { [fileId]: _, ...rest } = prev
        return rest
      })
    }

    setSyncStatus('success')
    setTimeout(() => setSyncStatus('idle'), 2000)
  }

  const performSync = async () => {
    if (!activeConnection) return

    setSyncStatus('syncing')

    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Update sync status for pending files
      setFiles(prev => prev.map(file =>
        file.syncStatus === 'pending'
          ? { ...file, syncStatus: 'synced' as const }
          : file
      ))

      setSyncStatus('success')

      // Update last sync time
      setConnections(prev => prev.map(conn =>
        conn.id === activeConnection
          ? { ...conn, lastSync: new Date() }
          : conn
      ))
    } catch (error) {
      setSyncStatus('error')
    }

    setTimeout(() => setSyncStatus('idle'), 2000)
  }

  const runBackupJob = async (jobId: string) => {
    const job = backupJobs.find(j => j.id === jobId)
    if (!job) return

    setActiveJob(jobId)

    // Update job status
    setBackupJobs(prev => prev.map(j =>
      j.id === jobId
        ? { ...j, status: 'running' as const, progress: 0, filesProcessed: 0 }
        : j
    ))

    // Simulate backup progress
    for (let progress = 0; progress <= 100; progress += 5) {
      await new Promise(resolve => setTimeout(resolve, 100))
      setBackupJobs(prev => prev.map(j =>
        j.id === jobId
          ? { ...j, progress, filesProcessed: Math.floor((progress / 100) * j.totalFiles) }
          : j
      ))
    }

    // Complete backup
    setBackupJobs(prev => prev.map(j =>
      j.id === jobId
        ? {
            ...j,
            status: 'success' as const,
            progress: 100,
            lastRun: new Date(),
            nextRun: new Date(Date.now() + (j.schedule === 'daily' ? 24 : j.schedule === 'weekly' ? 7 * 24 : 30 * 24) * 60 * 60 * 1000)
          }
        : j
    ))

    setActiveJob(null)
  }

  const resolveConflict = (fileId: string, resolution: 'local' | 'remote' | 'merge') => {
    setFiles(prev => prev.map(file =>
      file.id === fileId
        ? {
            ...file,
            syncStatus: 'synced' as const,
            checksumRemote: resolution === 'local' ? file.checksumLocal : file.checksumRemote
          }
        : file
    ))

    setConflictFiles(prev => prev.filter(f => f.id !== fileId))

    if (conflictFiles.length <= 1) {
      setShowConflictModal(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Cloud className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">WebDAV文件管理</h2>
              <p className="text-gray-600 dark:text-gray-400">云端文件同步和备份系统</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              {getSyncStatusIcon(syncStatus === 'syncing' ? 'pending' : syncStatus === 'success' ? 'synced' : syncStatus === 'error' ? 'error' : 'synced')}
              <span className="text-gray-600 dark:text-gray-400">
                {syncStatus === 'syncing' ? '同步中...' :
                 syncStatus === 'success' ? '同步完成' :
                 syncStatus === 'error' ? '同步失败' : '就绪'}
              </span>
            </div>

            <button
              onClick={() => setShowConnectionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>连接设置</span>
            </button>

            <button
              onClick={() => setShowBackupModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Archive className="w-4 h-4" />
              <span>备份任务</span>
            </button>
          </div>
        </div>

        {/* Connection Status */}
        {activeConn && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${activeConn.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{activeConn.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{activeConn.url}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <HardDrive className="w-4 h-4" />
                  <span>{formatFileSize(activeConn.usedSpace)} / {formatFileSize(activeConn.totalSpace)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>上次同步: {activeConn.lastSync?.toLocaleString() || '从未'}</span>
                </div>
                <button
                  onClick={performSync}
                  disabled={syncStatus === 'syncing'}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  <Sync className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  <span>同步</span>
                </button>
              </div>
            </div>

            {/* Storage Usage */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(activeConn.usedSpace / activeConn.totalSpace) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* File Browser Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索文件和文件夹..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="name">名称</option>
                <option value="date">修改时间</option>
                <option value="size">大小</option>
                <option value="type">类型</option>
              </select>

              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {conflictFiles.length > 0 && (
              <button
                onClick={() => setShowConflictModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{conflictFiles.length} 个冲突</span>
              </button>
            )}

            {selectedFiles.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  已选择 {selectedFiles.size} 个项目
                </span>
                <button className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                  下载
                </button>
                <button className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                  删除
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>上传</span>
            </button>
          </div>
        </div>
      </div>

      {/* File Browser */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span>路径:</span>
            <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{currentPath}</span>
          </div>

          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
          >
            {selectedFiles.size === filteredFiles.length ? '取消全选' : '全选'}
          </button>
        </div>

        {filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery ? '没有找到匹配的文件' : '文件夹为空'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchQuery ? '试试调整搜索关键词' : '上传文件开始使用'}
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-2'
          }>
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`border border-gray-200 dark:border-gray-600 rounded-lg transition-all hover:shadow-md cursor-pointer ${
                  selectedFiles.has(file.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:border-gray-300 dark:hover:border-gray-500'
                } ${viewMode === 'list' ? 'p-3' : 'p-4'}`}
                onClick={() => handleFileSelect(file.id)}
              >
                <div className={`flex items-center ${viewMode === 'list' ? 'gap-3' : 'flex-col gap-3'}`}>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedFiles.has(file.id)}
                      onChange={() => handleFileSelect(file.id)}
                      className="text-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {getFileIcon(file)}
                  </div>

                  <div className={`flex-1 min-w-0 ${viewMode === 'grid' ? 'text-center' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </h4>
                      {file.isStarred && <Star className="w-3 h-3 text-yellow-500 fill-current" />}
                      {file.isShared && <Share2 className="w-3 h-3 text-blue-500" />}
                      {getSyncStatusIcon(file.syncStatus)}
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {file.type === 'file' && (
                        <>
                          <span>{formatFileSize(file.size)}</span>
                          <span className="mx-2">•</span>
                        </>
                      )}
                      <span>{file.lastModified.toLocaleDateString()}</span>
                    </div>

                    {file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {file.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {file.tags.length > 2 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                            +{file.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {viewMode === 'list' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle download
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle more options
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Upload Progress */}
                {uploadProgress[file.id] !== undefined && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mb-1">
                      <span>上传中...</span>
                      <span>{uploadProgress[file.id]}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress[file.id]}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backup Jobs Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">备份任务</h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {backupJobs.filter(j => j.isActive).length} 个活跃任务
          </span>
        </div>

        <div className="space-y-3">
          {backupJobs.map((job) => (
            <div
              key={job.id}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    job.status === 'running' ? 'bg-blue-500 animate-pulse' :
                    job.status === 'success' ? 'bg-green-500' :
                    job.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{job.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{job.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {job.status === 'running' && (
                    <div className="text-sm text-blue-600 dark:text-blue-400">
                      {job.progress}% ({job.filesProcessed}/{job.totalFiles})
                    </div>
                  )}
                  <button
                    onClick={() => runBackupJob(job.id)}
                    disabled={job.status === 'running' || !job.isActive}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
                  >
                    {job.status === 'running' ? '运行中' : '立即运行'}
                  </button>
                </div>
              </div>

              {job.status === 'running' && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500">
                <div className="flex items-center gap-4">
                  <span>计划: {job.schedule}</span>
                  {job.lastRun && <span>上次运行: {job.lastRun.toLocaleString()}</span>}
                  {job.nextRun && <span>下次运行: {job.nextRun.toLocaleString()}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {job.compression && <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">压缩</span>}
                  {job.encryption && <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">加密</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conflict Resolution Modal */}
      {showConflictModal && conflictFiles.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">解决同步冲突</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                发现 {conflictFiles.length} 个文件存在同步冲突，请选择解决方案
              </p>
            </div>

            <div className="p-6 space-y-4">
              {conflictFiles.map((file) => (
                <div key={file.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    {getFileIcon(file)}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{file.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{file.path}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => resolveConflict(file.id, 'local')}
                      className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">使用本地版本</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        校验: {file.checksumLocal}
                      </div>
                    </button>

                    <button
                      onClick={() => resolveConflict(file.id, 'remote')}
                      className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">使用远程版本</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        校验: {file.checksumRemote}
                      </div>
                    </button>

                    <button
                      onClick={() => resolveConflict(file.id, 'merge')}
                      className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">智能合并</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        尝试自动合并
                      </div>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowConflictModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WebDAVFileManager
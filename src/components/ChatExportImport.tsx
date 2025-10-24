import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiDownload, FiUpload, FiFile, FiFolder, FiSave, FiRefreshCw, FiTrash2, FiCopy, FiShare2, FiCalendar, FiFilter, FiSearch, FiArchive, FiDatabase, FiCloud, FiHardDrive, FiSettings, FiCheck, FiX, FiClock, FiBarChart2, FiPieChart, FiTrendingUp } from 'react-icons/fi'

interface ExportFormat {
  id: string
  name: string
  extension: string
  description: string
  icon: string
  supports: {
    metadata: boolean
    attachments: boolean
    formatting: boolean
    analytics: boolean
  }
  size: 'small' | 'medium' | 'large'
}

interface ExportJob {
  id: string
  name: string
  format: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  startTime: number
  endTime?: number
  fileSize?: number
  downloadUrl?: string
  options: ExportOptions
  error?: string
}

interface ExportOptions {
  dateRange: {
    start: Date | null
    end: Date | null
  }
  includeAttachments: boolean
  includeMetadata: boolean
  includeAnalytics: boolean
  compression: 'none' | 'zip' | 'gzip'
  format: string
  selectedChats: string[]
  privacy: {
    anonymize: boolean
    excludePersonalInfo: boolean
    excludeAPIKeys: boolean
  }
}

interface ImportResult {
  id: string
  filename: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  chatsImported: number
  errors: string[]
  startTime: number
  endTime?: number
}

interface BackupSchedule {
  id: string
  name: string
  frequency: 'daily' | 'weekly' | 'monthly'
  format: string
  destination: 'local' | 'cloud'
  enabled: boolean
  lastRun?: number
  nextRun: number
  options: ExportOptions
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'json',
    name: 'JSON',
    extension: '.json',
    description: 'Complete data export with full metadata and structure',
    icon: '📄',
    supports: {
      metadata: true,
      attachments: true,
      formatting: true,
      analytics: true
    },
    size: 'large'
  },
  {
    id: 'markdown',
    name: 'Markdown',
    extension: '.md',
    description: 'Human-readable format with formatting preserved',
    icon: '📝',
    supports: {
      metadata: true,
      attachments: false,
      formatting: true,
      analytics: false
    },
    size: 'medium'
  },
  {
    id: 'html',
    name: 'HTML',
    extension: '.html',
    description: 'Web-ready format with rich formatting and styling',
    icon: '🌐',
    supports: {
      metadata: true,
      attachments: true,
      formatting: true,
      analytics: false
    },
    size: 'medium'
  },
  {
    id: 'pdf',
    name: 'PDF',
    extension: '.pdf',
    description: 'Printable format with professional layout',
    icon: '📕',
    supports: {
      metadata: true,
      attachments: false,
      formatting: true,
      analytics: false
    },
    size: 'medium'
  },
  {
    id: 'csv',
    name: 'CSV',
    extension: '.csv',
    description: 'Spreadsheet format for data analysis',
    icon: '📊',
    supports: {
      metadata: true,
      attachments: false,
      formatting: false,
      analytics: true
    },
    size: 'small'
  },
  {
    id: 'txt',
    name: 'Plain Text',
    extension: '.txt',
    description: 'Simple text format without formatting',
    icon: '📃',
    supports: {
      metadata: false,
      attachments: false,
      formatting: false,
      analytics: false
    },
    size: 'small'
  },
  {
    id: 'xml',
    name: 'XML',
    extension: '.xml',
    description: 'Structured data format for system integration',
    icon: '🔧',
    supports: {
      metadata: true,
      attachments: true,
      formatting: true,
      analytics: true
    },
    size: 'large'
  },
  {
    id: 'backup',
    name: 'Backup Archive',
    extension: '.backup',
    description: 'Complete application backup with all settings',
    icon: '💾',
    supports: {
      metadata: true,
      attachments: true,
      formatting: true,
      analytics: true
    },
    size: 'large'
  }
]

export default function ChatExportImport() {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'backup' | 'analytics'>('export')
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [importResults, setImportResults] = useState<ImportResult[]>([])
  const [backupSchedules, setBackupSchedules] = useState<BackupSchedule[]>([])
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(EXPORT_FORMATS[0])
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    dateRange: { start: null, end: null },
    includeAttachments: true,
    includeMetadata: true,
    includeAnalytics: false,
    compression: 'zip',
    format: 'json',
    selectedChats: [],
    privacy: {
      anonymize: false,
      excludePersonalInfo: false,
      excludeAPIKeys: true
    }
  })
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  // Sample data
  useEffect(() => {
    // Sample export jobs
    setExportJobs([
      {
        id: 'job-1',
        name: 'Weekly Backup - JSON',
        format: 'json',
        status: 'completed',
        progress: 100,
        startTime: Date.now() - 3600000,
        endTime: Date.now() - 3540000,
        fileSize: 15728640, // 15 MB
        downloadUrl: '#',
        options: exportOptions
      },
      {
        id: 'job-2',
        name: 'Chat Export - Markdown',
        format: 'markdown',
        status: 'processing',
        progress: 65,
        startTime: Date.now() - 300000,
        options: exportOptions
      },
      {
        id: 'job-3',
        name: 'Analytics Export - CSV',
        format: 'csv',
        status: 'failed',
        progress: 30,
        startTime: Date.now() - 7200000,
        error: 'Insufficient permissions to access analytics data',
        options: exportOptions
      }
    ])

    // Sample backup schedules
    setBackupSchedules([
      {
        id: 'backup-1',
        name: 'Daily Automatic Backup',
        frequency: 'daily',
        format: 'backup',
        destination: 'local',
        enabled: true,
        lastRun: Date.now() - 86400000,
        nextRun: Date.now() + 3600000,
        options: exportOptions
      },
      {
        id: 'backup-2',
        name: 'Weekly Cloud Sync',
        frequency: 'weekly',
        format: 'json',
        destination: 'cloud',
        enabled: false,
        nextRun: Date.now() + 604800000,
        options: exportOptions
      }
    ])
  }, [])

  const startExport = async () => {
    setIsExporting(true)

    const newJob: ExportJob = {
      id: Date.now().toString(),
      name: `Export - ${selectedFormat.name}`,
      format: selectedFormat.id,
      status: 'processing',
      progress: 0,
      startTime: Date.now(),
      options: exportOptions
    }

    setExportJobs(prev => [newJob, ...prev])

    // Simulate export process
    const progressInterval = setInterval(() => {
      setExportJobs(prev => prev.map(job => {
        if (job.id === newJob.id && job.status === 'processing') {
          const newProgress = Math.min(job.progress + Math.random() * 15, 100)

          if (newProgress >= 100) {
            clearInterval(progressInterval)
            setIsExporting(false)
            return {
              ...job,
              status: 'completed' as const,
              progress: 100,
              endTime: Date.now(),
              fileSize: Math.floor(Math.random() * 50000000) + 1000000, // 1-50 MB
              downloadUrl: '#'
            }
          }

          return { ...job, progress: newProgress }
        }
        return job
      }))
    }, 500)
  }

  const handleFileImport = async (files: FileList) => {
    setIsImporting(true)

    Array.from(files).forEach(async (file) => {
      const importResult: ImportResult = {
        id: Date.now().toString() + Math.random(),
        filename: file.name,
        status: 'processing',
        progress: 0,
        chatsImported: 0,
        errors: [],
        startTime: Date.now()
      }

      setImportResults(prev => [importResult, ...prev])

      // Simulate import process
      const progressInterval = setInterval(() => {
        setImportResults(prev => prev.map(result => {
          if (result.id === importResult.id && result.status === 'processing') {
            const newProgress = Math.min(result.progress + Math.random() * 12, 100)

            if (newProgress >= 100) {
              clearInterval(progressInterval)
              setIsImporting(false)
              return {
                ...result,
                status: 'completed' as const,
                progress: 100,
                endTime: Date.now(),
                chatsImported: Math.floor(Math.random() * 500) + 50
              }
            }

            return {
              ...result,
              progress: newProgress,
              chatsImported: Math.floor(newProgress * 5) // Estimate chats imported
            }
          }
          return result
        }))
      }, 600)
    })
  }

  const downloadExport = (job: ExportJob) => {
    // Simulate download
    const blob = new Blob(['Sample export data'], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${job.name}.${selectedFormat.extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const deleteJob = (jobId: string) => {
    setExportJobs(prev => prev.filter(job => job.id !== jobId))
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatDuration = (start: number, end?: number) => {
    const duration = (end || Date.now()) - start
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'processing': return 'text-blue-400'
      case 'failed': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <FiCheck className="w-4 h-4" />
      case 'processing': return <FiRefreshCw className="w-4 h-4 animate-spin" />
      case 'failed': return <FiX className="w-4 h-4" />
      default: return <FiClock className="w-4 h-4" />
    }
  }

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent flex items-center gap-2">
              <FiDatabase className="text-blue-400" />
              Chat Export & Import
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Backup, export, and import your conversations and data
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>{exportJobs.filter(j => j.status === 'completed').length} Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>{exportJobs.filter(j => j.status === 'processing').length} Processing</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
          {[
            { id: 'export', label: 'Export Data', icon: FiDownload },
            { id: 'import', label: 'Import Data', icon: FiUpload },
            { id: 'backup', label: 'Automated Backup', icon: FiSave },
            { id: 'analytics', label: 'Export Analytics', icon: FiBarChart2 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'export' && (
            <motion.div
              key="export"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex"
            >
              {/* Export Configuration */}
              <div className="w-1/3 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-2">Export Configuration</h3>
                  <p className="text-gray-400 text-sm">Configure your export settings and format</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-6">
                    {/* Format Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Export Format</label>
                      <div className="grid gap-2">
                        {EXPORT_FORMATS.map(format => (
                          <button
                            key={format.id}
                            onClick={() => setSelectedFormat(format)}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              selectedFormat.id === format.id
                                ? 'border-blue-500 bg-blue-600/10'
                                : 'border-gray-700 hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-lg">{format.icon}</span>
                              <div>
                                <div className="font-medium text-white">{format.name}</div>
                                <div className="text-xs text-gray-400">{format.extension}</div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-400">{format.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Date Range</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                          <input
                            type="date"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">End Date</label>
                          <input
                            type="date"
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Export Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Export Options</label>
                      <div className="space-y-3">
                        {selectedFormat.supports.metadata && (
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={exportOptions.includeMetadata}
                              onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-300">Include metadata</span>
                          </label>
                        )}

                        {selectedFormat.supports.attachments && (
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={exportOptions.includeAttachments}
                              onChange={(e) => setExportOptions(prev => ({ ...prev, includeAttachments: e.target.checked }))}
                              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-300">Include attachments</span>
                          </label>
                        )}

                        {selectedFormat.supports.analytics && (
                          <label className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={exportOptions.includeAnalytics}
                              onChange={(e) => setExportOptions(prev => ({ ...prev, includeAnalytics: e.target.checked }))}
                              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-300">Include analytics data</span>
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Privacy Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Privacy & Security</label>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={exportOptions.privacy.anonymize}
                            onChange={(e) => setExportOptions(prev => ({
                              ...prev,
                              privacy: { ...prev.privacy, anonymize: e.target.checked }
                            }))}
                            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-300">Anonymize personal data</span>
                        </label>

                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={exportOptions.privacy.excludeAPIKeys}
                            onChange={(e) => setExportOptions(prev => ({
                              ...prev,
                              privacy: { ...prev.privacy, excludeAPIKeys: e.target.checked }
                            }))}
                            className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-300">Exclude API keys</span>
                        </label>
                      </div>
                    </div>

                    {/* Compression */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">Compression</label>
                      <select
                        value={exportOptions.compression}
                        onChange={(e) => setExportOptions(prev => ({ ...prev, compression: e.target.value as any }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">No compression</option>
                        <option value="zip">ZIP compression</option>
                        <option value="gzip">GZIP compression</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-800">
                  <button
                    onClick={startExport}
                    disabled={isExporting}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {isExporting ? (
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiDownload className="w-4 h-4" />
                    )}
                    {isExporting ? 'Exporting...' : 'Start Export'}
                  </button>
                </div>
              </div>

              {/* Export Jobs */}
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="text-lg font-semibold text-white">Export Jobs</h3>
                  <p className="text-gray-400 text-sm">Track your export progress and download files</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {exportJobs.length === 0 ? (
                    <div className="text-center py-12">
                      <FiDownload className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 mb-4">No export jobs yet</p>
                      <p className="text-gray-500 text-sm">Configure export settings and start your first export</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {exportJobs.map(job => (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-white">{job.name}</h4>
                                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${getStatusColor(job.status)}`}>
                                  {getStatusIcon(job.status)}
                                  {job.status}
                                </span>
                              </div>

                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>Format: {job.format.toUpperCase()}</span>
                                <span>Started: {new Date(job.startTime).toLocaleTimeString()}</span>
                                {job.endTime && (
                                  <span>Duration: {formatDuration(job.startTime, job.endTime)}</span>
                                )}
                                {job.fileSize && (
                                  <span>Size: {formatFileSize(job.fileSize)}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              {job.status === 'completed' && job.downloadUrl && (
                                <button
                                  onClick={() => downloadExport(job)}
                                  className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                  title="Download export"
                                >
                                  <FiDownload className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={() => deleteJob(job.id)}
                                className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400"
                                title="Delete job"
                              >
                                <FiTrash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {job.status === 'processing' && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-400">Progress</span>
                                <span className="text-white">{Math.round(job.progress)}%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${job.progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Error Message */}
                          {job.status === 'failed' && job.error && (
                            <div className="p-3 bg-red-600/10 border border-red-600/20 rounded-lg">
                              <p className="text-red-400 text-sm">{job.error}</p>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'import' && (
            <motion.div
              key="import"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col"
            >
              <div className="p-6">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <FiUpload className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">Import Chat Data</h3>
                    <p className="text-gray-400">
                      Upload your exported chat files to restore conversations and data
                    </p>
                  </div>

                  {/* File Drop Zone */}
                  <div
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-6 hover:border-blue-500 transition-colors cursor-pointer"
                    onDrop={(e) => {
                      e.preventDefault()
                      handleFileImport(e.dataTransfer.files)
                    }}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <FiFile className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-white mb-2">Drop files here or click to browse</p>
                    <p className="text-gray-500 text-sm">
                      Supports JSON, XML, Backup files and more
                    </p>

                    <input
                      type="file"
                      multiple
                      accept=".json,.xml,.backup,.zip"
                      onChange={(e) => e.target.files && handleFileImport(e.target.files)}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg cursor-pointer transition-colors"
                    >
                      Choose Files
                    </label>
                  </div>

                  {/* Import Results */}
                  {importResults.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-white">Import Results</h4>
                      {importResults.map(result => (
                        <div key={result.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-medium text-white">{result.filename}</h5>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className={getStatusColor(result.status)}>
                                  {result.status}
                                </span>
                                {result.chatsImported > 0 && (
                                  <span>{result.chatsImported} chats imported</span>
                                )}
                                <span>Started: {new Date(result.startTime).toLocaleTimeString()}</span>
                              </div>
                            </div>
                            <span className={`${getStatusColor(result.status)}`}>
                              {getStatusIcon(result.status)}
                            </span>
                          </div>

                          {result.status === 'processing' && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-400">Progress</span>
                                <span className="text-white">{Math.round(result.progress)}%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${result.progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {result.errors.length > 0 && (
                            <div className="p-3 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
                              <p className="text-yellow-400 text-sm">
                                {result.errors.length} warnings/errors during import
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'backup' && (
            <motion.div
              key="backup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-6 overflow-y-auto"
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Automated Backup</h3>
                    <p className="text-gray-400">Set up automatic backups to keep your data safe</p>
                  </div>

                  <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors">
                    <FiSave className="w-4 h-4" />
                    Create Schedule
                  </button>
                </div>

                <div className="grid gap-6">
                  {backupSchedules.map(schedule => (
                    <div key={schedule.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-white">{schedule.name}</h4>
                            <span className={`text-xs px-2 py-1 rounded ${
                              schedule.enabled ? 'bg-green-600/20 text-green-400' : 'bg-gray-600/20 text-gray-400'
                            }`}>
                              {schedule.enabled ? 'Active' : 'Disabled'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Frequency:</span>
                              <div className="text-white font-medium capitalize">{schedule.frequency}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Format:</span>
                              <div className="text-white font-medium">{schedule.format.toUpperCase()}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Destination:</span>
                              <div className="text-white font-medium flex items-center gap-1">
                                {schedule.destination === 'local' ? <FiHardDrive className="w-3 h-3" /> : <FiCloud className="w-3 h-3" />}
                                {schedule.destination === 'local' ? 'Local Storage' : 'Cloud Storage'}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-500">Next Run:</span>
                              <div className="text-white font-medium">
                                {new Date(schedule.nextRun).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          {schedule.lastRun && (
                            <p className="text-xs text-gray-500 mt-2">
                              Last backup: {new Date(schedule.lastRun).toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                            <FiSettings className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center">
                <FiBarChart2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Export Analytics</h3>
                <p className="text-gray-500 mb-4">
                  Detailed analytics and insights about your exports and data usage
                </p>
                <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors">
                  View Analytics
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
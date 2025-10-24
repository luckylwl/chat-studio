import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  Badge,
  Progress,
  Modal,
  Textarea,
  Switch
} from '@/components/ui'
import {
  CloudArrowDownIcon,
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  Cog6ToothIcon,
  LinkIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  GlobeAltIcon,
  ServerIcon,
  CircleStackIcon,
  BeakerIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import exportService, {
  type ExportJob,
  type ExportFormat,
  type IntegrationConfig,
  type SyncJob,
  type APIEndpoint
} from '@/services/exportService'
import { toast } from 'react-hot-toast'

interface MetricCard {
  label: string
  value: string | number
  status: 'good' | 'warning' | 'danger' | 'neutral'
  icon: React.ReactNode
  description: string
}

const ExportIntegrationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([])
  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([])
  const [supportedFormats, setSupportedFormats] = useState<ExportFormat[]>([])
  const [syncJobs, setSyncJobs] = useState<SyncJob[]>([])
  const [showCreateExportModal, setShowCreateExportModal] = useState(false)
  const [showCreateIntegrationModal, setShowCreateIntegrationModal] = useState(false)
  const [showCreateEndpointModal, setShowCreateEndpointModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<ExportJob | null>(null)
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null)
  const [newExportJob, setNewExportJob] = useState({
    name: '',
    type: 'conversations' as ExportJob['type'],
    format: 'json',
    dateRange: {
      start: '',
      end: ''
    },
    includeMetadata: true,
    compression: 'none' as 'none' | 'zip' | 'gzip',
    encryption: false
  })
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    type: 'webhook' as IntegrationConfig['type'],
    enabled: true,
    url: '',
    authType: 'none' as IntegrationConfig['authentication']['type'],
    apiKey: '',
    events: [] as string[]
  })
  const [newEndpoint, setNewEndpoint] = useState({
    name: '',
    url: '',
    method: 'POST' as APIEndpoint['method'],
    authType: 'none' as APIEndpoint['authentication']['type'],
    apiKey: '',
    headers: ''
  })

  useEffect(() => {
    const initializeService = async () => {
      try {
        if (!exportService.isReady()) {
          await exportService.initialize()
        }
        loadData()
      } catch (error) {
        console.error('Failed to initialize export service:', error)
        toast.error('初始化导出服务失败')
      }
    }

    initializeService()

    // Event listeners
    const handleExportProgress = (data: any) => {
      setExportJobs(prev => prev.map(job =>
        job.id === data.jobId ? { ...job, progress: data.progress } : job
      ))
    }

    const handleExportCompleted = (job: ExportJob) => {
      setExportJobs(prev => prev.map(j => j.id === job.id ? job : j))
      toast.success(`导出完成: ${job.name}`)
    }

    const handleExportFailed = (data: any) => {
      loadData() // Reload to get updated job status
      toast.error(`导出失败: ${data.jobId}`)
    }

    const handleSyncCompleted = (job: SyncJob) => {
      setSyncJobs(prev => prev.map(j => j.id === job.id ? job : j))
      toast.success('数据同步完成')
    }

    exportService.on('export_progress', handleExportProgress)
    exportService.on('export_completed', handleExportCompleted)
    exportService.on('export_failed', handleExportFailed)
    exportService.on('sync_completed', handleSyncCompleted)

    return () => {
      exportService.off('export_progress', handleExportProgress)
      exportService.off('export_completed', handleExportCompleted)
      exportService.off('export_failed', handleExportFailed)
      exportService.off('sync_completed', handleSyncCompleted)
    }
  }, [])

  const loadData = () => {
    setExportJobs(exportService.getExportJobs())
    setIntegrations(exportService.getIntegrations())
    setApiEndpoints(exportService.getAPIEndpoints())
    setSupportedFormats(exportService.getSupportedFormats())
    setSyncJobs(exportService.getSyncJobs())
  }

  const getOverviewMetrics = (): MetricCard[] => {
    const activeExports = exportJobs.filter(job => job.status === 'processing').length
    const completedExports = exportJobs.filter(job => job.status === 'completed').length
    const enabledIntegrations = integrations.filter(integration => integration.enabled).length
    const successfulSyncs = syncJobs.filter(job => job.status === 'completed').length
    const totalDataExported = exportJobs
      .filter(job => job.status === 'completed' && job.results)
      .reduce((sum, job) => sum + (job.results?.exportedItems || 0), 0)

    return [
      {
        label: '活跃导出',
        value: activeExports,
        status: activeExports > 0 ? 'warning' : 'neutral',
        icon: <CloudArrowDownIcon className="h-5 w-5" />,
        description: '正在进行的导出任务数量'
      },
      {
        label: '完成导出',
        value: completedExports,
        status: completedExports > 0 ? 'good' : 'neutral',
        icon: <CheckCircleIcon className="h-5 w-5" />,
        description: '已完成的导出任务数量'
      },
      {
        label: '活跃集成',
        value: `${enabledIntegrations}/${integrations.length}`,
        status: integrations.length > 0 ? (enabledIntegrations / integrations.length >= 0.8 ? 'good' : 'warning') : 'neutral',
        icon: <LinkIcon className="h-5 w-5" />,
        description: '启用/总集成数量'
      },
      {
        label: '成功同步',
        value: successfulSyncs,
        status: successfulSyncs > 0 ? 'good' : 'neutral',
        icon: <ArrowPathIcon className="h-5 w-5" />,
        description: '成功完成的同步任务数量'
      },
      {
        label: '导出数据量',
        value: totalDataExported,
        status: totalDataExported > 0 ? 'good' : 'neutral',
        icon: <CircleStackIcon className="h-5 w-5" />,
        description: '总计导出的数据项数量'
      },
      {
        label: '支持格式',
        value: supportedFormats.length,
        status: 'good',
        icon: <DocumentDuplicateIcon className="h-5 w-5" />,
        description: '支持的导出格式数量'
      }
    ]
  }

  const handleCreateExport = async () => {
    if (!newExportJob.name.trim()) {
      toast.error('请输入导出任务名称')
      return
    }

    try {
      const config: any = {
        formatting: {
          includeMetadata: newExportJob.includeMetadata,
          includeAttachments: false,
          compression: newExportJob.compression,
          encryption: newExportJob.encryption
        }
      }

      if (newExportJob.dateRange.start && newExportJob.dateRange.end) {
        config.dateRange = {
          start: new Date(newExportJob.dateRange.start),
          end: new Date(newExportJob.dateRange.end)
        }
      }

      await exportService.createExportJob(
        newExportJob.name,
        newExportJob.type,
        newExportJob.format,
        config
      )

      setShowCreateExportModal(false)
      setNewExportJob({
        name: '',
        type: 'conversations',
        format: 'json',
        dateRange: { start: '', end: '' },
        includeMetadata: true,
        compression: 'none',
        encryption: false
      })
      loadData()
      toast.success('导出任务已创建')
    } catch (error) {
      console.error('Failed to create export job:', error)
      toast.error('创建导出任务失败')
    }
  }

  const handleCreateIntegration = async () => {
    if (!newIntegration.name.trim()) {
      toast.error('请输入集成名称')
      return
    }

    try {
      const config: any = {}
      if (newIntegration.url) config.url = newIntegration.url

      const authentication: any = { type: newIntegration.authType }
      if (newIntegration.authType === 'api_key' && newIntegration.apiKey) {
        authentication.credentials = { apiKey: newIntegration.apiKey }
      }

      await exportService.createIntegration({
        name: newIntegration.name,
        type: newIntegration.type,
        enabled: newIntegration.enabled,
        config,
        authentication,
        events: newIntegration.events
      })

      setShowCreateIntegrationModal(false)
      setNewIntegration({
        name: '',
        type: 'webhook',
        enabled: true,
        url: '',
        authType: 'none',
        apiKey: '',
        events: []
      })
      loadData()
      toast.success('集成已创建')
    } catch (error) {
      console.error('Failed to create integration:', error)
      toast.error('创建集成失败')
    }
  }

  const handleCreateEndpoint = async () => {
    if (!newEndpoint.name.trim() || !newEndpoint.url.trim()) {
      toast.error('请输入端点名称和URL')
      return
    }

    try {
      const headers: Record<string, string> = {}
      if (newEndpoint.headers) {
        try {
          const parsedHeaders = JSON.parse(newEndpoint.headers)
          Object.assign(headers, parsedHeaders)
        } catch {
          // Treat as simple key:value format
          const lines = newEndpoint.headers.split('\n')
          lines.forEach(line => {
            const [key, value] = line.split(':').map(s => s.trim())
            if (key && value) headers[key] = value
          })
        }
      }

      const authentication: any = { type: newEndpoint.authType }
      if (newEndpoint.authType === 'api_key' && newEndpoint.apiKey) {
        authentication.credentials = { apiKey: newEndpoint.apiKey }
      }

      await exportService.createAPIEndpoint({
        name: newEndpoint.name,
        url: newEndpoint.url,
        method: newEndpoint.method,
        headers,
        authentication
      })

      setShowCreateEndpointModal(false)
      setNewEndpoint({
        name: '',
        url: '',
        method: 'POST',
        authType: 'none',
        apiKey: '',
        headers: ''
      })
      loadData()
      toast.success('API端点已创建')
    } catch (error) {
      console.error('Failed to create API endpoint:', error)
      toast.error('创建API端点失败')
    }
  }

  const handleTestIntegration = async (integrationId: string) => {
    try {
      const result = await exportService.testIntegration(integrationId)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
      loadData()
    } catch (error) {
      console.error('Failed to test integration:', error)
      toast.error('测试集成失败')
    }
  }

  const handleSyncIntegration = async (integrationId: string) => {
    try {
      await exportService.syncIntegration(integrationId)
      toast.success('同步已开始')
      loadData()
    } catch (error) {
      console.error('Failed to sync integration:', error)
      toast.error('启动同步失败')
    }
  }

  const handleTestEndpoint = async (endpointId: string) => {
    try {
      const result = await exportService.testAPIEndpoint(endpointId)
      if (result.success) {
        toast.success('API端点测试成功')
      } else {
        toast.error(`API端点测试失败: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to test endpoint:', error)
      toast.error('测试API端点失败')
    }
  }

  const handleDownloadExport = (job: ExportJob) => {
    if (job.downloadUrl) {
      // Simulate download
      const link = document.createElement('a')
      link.href = job.downloadUrl
      link.download = `${job.name}.${supportedFormats.find(f => f.id === job.format)?.extension || 'txt'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('下载已开始')
    }
  }

  const handleCancelExport = async (jobId: string) => {
    try {
      await exportService.cancelExportJob(jobId)
      loadData()
      toast.success('导出已取消')
    } catch (error) {
      console.error('Failed to cancel export:', error)
      toast.error('取消导出失败')
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'success'
      case 'processing':
      case 'running':
      case 'pending':
        return 'warning'
      case 'failed':
      case 'error':
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'processing':
      case 'running':
        return <ClockIcon className="h-4 w-4" />
      case 'failed':
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  const getIntegrationTypeIcon = (type: string) => {
    switch (type) {
      case 'webhook':
        return <LinkIcon className="h-5 w-5" />
      case 'api':
        return <GlobeAltIcon className="h-5 w-5" />
      case 'database':
        return <CircleStackIcon className="h-5 w-5" />
      case 'cloud_storage':
        return <CloudArrowUpIcon className="h-5 w-5" />
      case 'analytics_platform':
        return <BeakerIcon className="h-5 w-5" />
      default:
        return <ServerIcon className="h-5 w-5" />
    }
  }

  const tabs = [
    { id: 'overview', name: '概览', icon: <Cog6ToothIcon className="h-5 w-5" /> },
    { id: 'exports', name: '数据导出', icon: <CloudArrowDownIcon className="h-5 w-5" /> },
    { id: 'integrations', name: '外部集成', icon: <LinkIcon className="h-5 w-5" /> },
    { id: 'endpoints', name: 'API端点', icon: <GlobeAltIcon className="h-5 w-5" /> }
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getOverviewMetrics().map((metric, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {metric.label}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {metric.value}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {metric.description}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${
                        metric.status === 'good' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' :
                        metric.status === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' :
                        metric.status === 'danger' ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {metric.icon}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
                <CardDescription>常用的导出和集成操作</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    onClick={() => setShowCreateExportModal(true)}
                    className="h-auto py-4 px-6 flex flex-col items-center gap-2"
                  >
                    <CloudArrowDownIcon className="h-6 w-6" />
                    <span className="text-sm">新建导出</span>
                  </Button>
                  <Button
                    onClick={() => setShowCreateIntegrationModal(true)}
                    variant="outline"
                    className="h-auto py-4 px-6 flex flex-col items-center gap-2"
                  >
                    <LinkIcon className="h-6 w-6" />
                    <span className="text-sm">添加集成</span>
                  </Button>
                  <Button
                    onClick={() => setShowCreateEndpointModal(true)}
                    variant="outline"
                    className="h-auto py-4 px-6 flex flex-col items-center gap-2"
                  >
                    <GlobeAltIcon className="h-6 w-6" />
                    <span className="text-sm">配置端点</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 px-6 flex flex-col items-center gap-2"
                    disabled={integrations.filter(i => i.enabled).length === 0}
                  >
                    <ArrowPathIcon className="h-6 w-6" />
                    <span className="text-sm">批量同步</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>最近活动</CardTitle>
                <CardDescription>最新的导出任务和集成活动</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...exportJobs, ...syncJobs.map(job => ({ ...job, type: 'sync' }))]
                    .sort((a, b) => new Date(b.createdAt || b.startedAt).getTime() - new Date(a.createdAt || a.startedAt).getTime())
                    .slice(0, 5)
                    .map((item: any, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.type === 'sync' ? (
                            <ArrowPathIcon className="h-5 w-5 text-blue-500" />
                          ) : (
                            <CloudArrowDownIcon className="h-5 w-5 text-green-500" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {item.name || `同步任务 ${item.integrationId}`}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {item.type === 'sync' ? '数据同步' : `${item.type} 导出`} • {(item.createdAt || item.startedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(item.status)}
                            {item.status === 'completed' ? '已完成' :
                             item.status === 'processing' || item.status === 'running' ? '进行中' :
                             item.status === 'failed' ? '失败' :
                             item.status === 'pending' ? '等待中' : item.status}
                          </div>
                        </Badge>
                      </div>
                    ))}
                  {exportJobs.length === 0 && syncJobs.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      暂无活动记录
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Exports Tab */}
        {activeTab === 'exports' && (
          <motion.div
            key="exports"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">数据导出</h2>
                <p className="text-gray-600 dark:text-gray-400">导出对话、分析数据等到多种格式</p>
              </div>
              <Button onClick={() => setShowCreateExportModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                新建导出
              </Button>
            </div>

            <div className="grid gap-6">
              {exportJobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {job.name}
                          <Badge variant={getStatusBadgeVariant(job.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(job.status)}
                              {job.status === 'completed' ? '已完成' :
                               job.status === 'processing' ? '处理中' :
                               job.status === 'failed' ? '失败' :
                               job.status === 'pending' ? '等待中' :
                               job.status === 'cancelled' ? '已取消' : job.status}
                            </div>
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {job.type === 'conversations' ? '对话数据' :
                           job.type === 'analytics' ? '分析数据' :
                           job.type === 'training_data' ? '训练数据' :
                           job.type === 'models' ? '模型数据' :
                           job.type === 'security_logs' ? '安全日志' :
                           job.type === 'full_backup' ? '完整备份' : job.type} •
                          {supportedFormats.find(f => f.id === job.format)?.name || job.format}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {job.status === 'processing' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelExport(job.id)}
                          >
                            <StopIcon className="h-4 w-4 mr-1" />
                            取消
                          </Button>
                        )}
                        {job.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleDownloadExport(job)}
                          >
                            <CloudArrowDownIcon className="h-4 w-4 mr-1" />
                            下载
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedJob(job)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {job.status === 'processing' && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>导出进度</span>
                          <span>{job.progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">创建时间</p>
                        <p className="font-medium">{job.createdAt.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">格式</p>
                        <p className="font-medium">{supportedFormats.find(f => f.id === job.format)?.name || job.format}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">压缩</p>
                        <p className="font-medium">{job.config.formatting?.compression || 'none'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">文件大小</p>
                        <p className="font-medium">
                          {job.fileSize ? `${(job.fileSize / 1024).toFixed(1)} KB` : '未知'}
                        </p>
                      </div>
                    </div>

                    {job.results && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-blue-800 dark:text-blue-200">导出项目: {job.results.exportedItems}</p>
                          </div>
                          <div>
                            <p className="text-blue-800 dark:text-blue-200">跳过项目: {job.results.skippedItems}</p>
                          </div>
                          <div>
                            <p className="text-blue-800 dark:text-blue-200">错误: {job.results.errors.length}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {exportJobs.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <CloudArrowDownIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      暂无导出任务
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      创建您的第一个数据导出任务
                    </p>
                    <Button onClick={() => setShowCreateExportModal(true)}>
                      新建导出任务
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <motion.div
            key="integrations"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">外部集成</h2>
                <p className="text-gray-600 dark:text-gray-400">连接第三方服务和平台</p>
              </div>
              <Button onClick={() => setShowCreateIntegrationModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                添加集成
              </Button>
            </div>

            <div className="grid gap-6">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {getIntegrationTypeIcon(integration.type)}
                          {integration.name}
                          <Badge variant={integration.enabled ? 'success' : 'secondary'}>
                            {integration.enabled ? '已启用' : '已禁用'}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(integration.syncStatus)}>
                            {integration.syncStatus === 'success' ? '同步成功' :
                             integration.syncStatus === 'error' ? '同步错误' :
                             integration.syncStatus === 'pending' ? '同步中' :
                             integration.syncStatus === 'never' ? '未同步' : integration.syncStatus}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {integration.type === 'webhook' ? 'Webhook集成' :
                           integration.type === 'api' ? 'API集成' :
                           integration.type === 'database' ? '数据库集成' :
                           integration.type === 'cloud_storage' ? '云存储集成' :
                           integration.type === 'analytics_platform' ? '分析平台集成' : integration.type}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestIntegration(integration.id)}
                        >
                          <BeakerIcon className="h-4 w-4 mr-1" />
                          测试
                        </Button>
                        {integration.enabled && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSyncIntegration(integration.id)}
                          >
                            <ArrowPathIcon className="h-4 w-4 mr-1" />
                            同步
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedIntegration(integration)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">认证类型</p>
                        <p className="font-medium">
                          {integration.authentication.type === 'none' ? '无认证' :
                           integration.authentication.type === 'api_key' ? 'API密钥' :
                           integration.authentication.type === 'oauth' ? 'OAuth' :
                           integration.authentication.type === 'basic_auth' ? '基础认证' :
                           integration.authentication.type === 'bearer_token' ? 'Bearer令牌' : integration.authentication.type}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">监听事件</p>
                        <p className="font-medium">{integration.events.length} 个事件</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">最后同步</p>
                        <p className="font-medium">
                          {integration.lastSync ? integration.lastSync.toLocaleString() : '从未同步'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">错误日志</p>
                        <p className="font-medium">{integration.errorLog.length} 条</p>
                      </div>
                    </div>

                    {integration.errorLog.length > 0 && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-sm text-red-800 dark:text-red-200">
                          最近错误: {integration.errorLog[integration.errorLog.length - 1].error}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {integrations.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <LinkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      暂无集成配置
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      添加外部服务集成来扩展功能
                    </p>
                    <Button onClick={() => setShowCreateIntegrationModal(true)}>
                      添加第一个集成
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}

        {/* API Endpoints Tab */}
        {activeTab === 'endpoints' && (
          <motion.div
            key="endpoints"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">API端点</h2>
                <p className="text-gray-600 dark:text-gray-400">管理自定义API端点配置</p>
              </div>
              <Button onClick={() => setShowCreateEndpointModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                添加端点
              </Button>
            </div>

            <div className="grid gap-6">
              {apiEndpoints.map((endpoint) => (
                <Card key={endpoint.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <GlobeAltIcon className="h-5 w-5" />
                          {endpoint.name}
                          <Badge variant="outline">{endpoint.method}</Badge>
                        </CardTitle>
                        <CardDescription className="font-mono text-xs">
                          {endpoint.url}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTestEndpoint(endpoint.id)}
                        >
                          <BeakerIcon className="h-4 w-4 mr-1" />
                          测试
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">认证方式</p>
                        <p className="font-medium">
                          {endpoint.authentication.type === 'none' ? '无认证' :
                           endpoint.authentication.type === 'api_key' ? 'API密钥' :
                           endpoint.authentication.type === 'oauth' ? 'OAuth' :
                           endpoint.authentication.type === 'basic_auth' ? '基础认证' :
                           endpoint.authentication.type === 'bearer_token' ? 'Bearer令牌' : endpoint.authentication.type}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">请求头</p>
                        <p className="font-medium">{Object.keys(endpoint.headers).length} 个</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">速率限制</p>
                        <p className="font-medium">
                          {endpoint.rateLimit ? `${endpoint.rateLimit.requests}/${endpoint.rateLimit.period}s` : '无限制'}
                        </p>
                      </div>
                    </div>

                    {Object.keys(endpoint.headers).length > 0 && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">请求头:</h4>
                        <div className="space-y-1 text-xs font-mono">
                          {Object.entries(endpoint.headers).map(([key, value]) => (
                            <div key={key}>
                              <span className="text-blue-600 dark:text-blue-400">{key}:</span>{' '}
                              <span className="text-gray-600 dark:text-gray-300">{value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {apiEndpoints.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <GlobeAltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      暂无API端点
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      配置自定义API端点进行数据交互
                    </p>
                    <Button onClick={() => setShowCreateEndpointModal(true)}>
                      添加第一个端点
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Export Modal */}
      <Modal
        open={showCreateExportModal}
        onClose={() => setShowCreateExportModal(false)}
        title="新建导出任务"
        description="创建新的数据导出任务"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              任务名称
            </label>
            <Input
              value={newExportJob.name}
              onChange={(e) => setNewExportJob(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入导出任务名称"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                数据类型
              </label>
              <Select
                options={[
                  { value: 'conversations', label: '对话数据' },
                  { value: 'analytics', label: '分析数据' },
                  { value: 'training_data', label: '训练数据' },
                  { value: 'models', label: '模型数据' },
                  { value: 'security_logs', label: '安全日志' },
                  { value: 'full_backup', label: '完整备份' }
                ]}
                value={newExportJob.type}
                onChange={(value) => setNewExportJob(prev => ({ ...prev, type: value as any }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                导出格式
              </label>
              <Select
                options={supportedFormats.map(format => ({
                  value: format.id,
                  label: format.name,
                  description: format.description
                }))}
                value={newExportJob.format}
                onChange={(value) => setNewExportJob(prev => ({ ...prev, format: value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                开始日期
              </label>
              <Input
                type="date"
                value={newExportJob.dateRange.start}
                onChange={(e) => setNewExportJob(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                结束日期
              </label>
              <Input
                type="date"
                value={newExportJob.dateRange.end}
                onChange={(e) => setNewExportJob(prev => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                压缩方式
              </label>
              <Select
                options={[
                  { value: 'none', label: '不压缩' },
                  { value: 'zip', label: 'ZIP压缩' },
                  { value: 'gzip', label: 'GZIP压缩' }
                ]}
                value={newExportJob.compression}
                onChange={(value) => setNewExportJob(prev => ({ ...prev, compression: value as any }))}
              />
            </div>
            <div className="flex items-end">
              <Switch
                label="包含元数据"
                checked={newExportJob.includeMetadata}
                onChange={(e) => setNewExportJob(prev => ({ ...prev, includeMetadata: e.target.checked }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateExportModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateExport} disabled={!newExportJob.name.trim()}>
              创建导出任务
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Integration Modal */}
      <Modal
        open={showCreateIntegrationModal}
        onClose={() => setShowCreateIntegrationModal(false)}
        title="添加外部集成"
        description="配置新的外部服务集成"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              集成名称
            </label>
            <Input
              value={newIntegration.name}
              onChange={(e) => setNewIntegration(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入集成名称"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                集成类型
              </label>
              <Select
                options={[
                  { value: 'webhook', label: 'Webhook' },
                  { value: 'api', label: 'REST API' },
                  { value: 'database', label: '数据库' },
                  { value: 'cloud_storage', label: '云存储' },
                  { value: 'analytics_platform', label: '分析平台' }
                ]}
                value={newIntegration.type}
                onChange={(value) => setNewIntegration(prev => ({ ...prev, type: value as any }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                认证类型
              </label>
              <Select
                options={[
                  { value: 'none', label: '无认证' },
                  { value: 'api_key', label: 'API密钥' },
                  { value: 'oauth', label: 'OAuth' },
                  { value: 'basic_auth', label: '基础认证' },
                  { value: 'bearer_token', label: 'Bearer令牌' }
                ]}
                value={newIntegration.authType}
                onChange={(value) => setNewIntegration(prev => ({ ...prev, authType: value as any }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL地址
            </label>
            <Input
              value={newIntegration.url}
              onChange={(e) => setNewIntegration(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://api.example.com/webhook"
            />
          </div>
          {newIntegration.authType === 'api_key' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API密钥
              </label>
              <Input
                type="password"
                value={newIntegration.apiKey}
                onChange={(e) => setNewIntegration(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="请输入API密钥"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch
              label="启用集成"
              checked={newIntegration.enabled}
              onChange={(e) => setNewIntegration(prev => ({ ...prev, enabled: e.target.checked }))}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateIntegrationModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateIntegration} disabled={!newIntegration.name.trim()}>
              创建集成
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create API Endpoint Modal */}
      <Modal
        open={showCreateEndpointModal}
        onClose={() => setShowCreateEndpointModal(false)}
        title="配置API端点"
        description="添加自定义API端点"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              端点名称
            </label>
            <Input
              value={newEndpoint.name}
              onChange={(e) => setNewEndpoint(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入端点名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL地址
            </label>
            <Input
              value={newEndpoint.url}
              onChange={(e) => setNewEndpoint(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://api.example.com/endpoint"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                请求方法
              </label>
              <Select
                options={[
                  { value: 'GET', label: 'GET' },
                  { value: 'POST', label: 'POST' },
                  { value: 'PUT', label: 'PUT' },
                  { value: 'DELETE', label: 'DELETE' }
                ]}
                value={newEndpoint.method}
                onChange={(value) => setNewEndpoint(prev => ({ ...prev, method: value as any }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                认证类型
              </label>
              <Select
                options={[
                  { value: 'none', label: '无认证' },
                  { value: 'api_key', label: 'API密钥' },
                  { value: 'oauth', label: 'OAuth' },
                  { value: 'basic_auth', label: '基础认证' },
                  { value: 'bearer_token', label: 'Bearer令牌' }
                ]}
                value={newEndpoint.authType}
                onChange={(value) => setNewEndpoint(prev => ({ ...prev, authType: value as any }))}
              />
            </div>
          </div>
          {newEndpoint.authType === 'api_key' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API密钥
              </label>
              <Input
                type="password"
                value={newEndpoint.apiKey}
                onChange={(e) => setNewEndpoint(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="请输入API密钥"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              请求头 (JSON格式或键值对)
            </label>
            <Textarea
              value={newEndpoint.headers}
              onChange={(e) => setNewEndpoint(prev => ({ ...prev, headers: e.target.value }))}
              placeholder='{"Content-Type": "application/json"} 或 Content-Type: application/json'
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateEndpointModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateEndpoint} disabled={!newEndpoint.name.trim() || !newEndpoint.url.trim()}>
              创建端点
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ExportIntegrationDashboard
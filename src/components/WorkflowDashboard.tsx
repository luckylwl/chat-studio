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
  PlayIcon,
  StopIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  BeakerIcon,
  LinkIcon,
  ArrowPathIcon,
  SparklesIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline'
import workflowService, {
  type Workflow,
  type WorkflowExecution,
  type WorkflowTemplate,
  type WorkflowMetrics
} from '@/services/workflowService'
import { toast } from 'react-hot-toast'

interface MetricCard {
  label: string
  value: string | number
  status: 'good' | 'warning' | 'danger' | 'neutral'
  icon: React.ReactNode
  description: string
}

const WorkflowDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showExecutionModal, setShowExecutionModal] = useState(false)
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    category: 'custom' as Workflow['category']
  })
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [executionContext, setExecutionContext] = useState<string>('{}')

  useEffect(() => {
    const initializeService = async () => {
      try {
        if (!workflowService.isReady()) {
          await workflowService.initialize()
        }
        loadData()
      } catch (error) {
        console.error('Failed to initialize workflow service:', error)
        toast.error('初始化工作流服务失败')
      }
    }

    initializeService()

    // Event listeners
    const handleWorkflowCreated = (workflow: Workflow) => {
      setWorkflows(prev => [...prev, workflow])
      toast.success(`工作流已创建: ${workflow.name}`)
    }

    const handleExecutionStarted = (execution: WorkflowExecution) => {
      setExecutions(prev => [...prev, execution])
      toast.success('工作流执行已开始')
    }

    const handleExecutionCompleted = (execution: WorkflowExecution) => {
      setExecutions(prev => prev.map(exec => exec.id === execution.id ? execution : exec))
      toast.success(`工作流执行完成: ${execution.workflowId}`)
    }

    const handleExecutionFailed = (execution: WorkflowExecution) => {
      setExecutions(prev => prev.map(exec => exec.id === execution.id ? execution : exec))
      toast.error(`工作流执行失败: ${execution.result?.error}`)
    }

    workflowService.on('workflow_created', handleWorkflowCreated)
    workflowService.on('workflow_execution_started', handleExecutionStarted)
    workflowService.on('workflow_execution_completed', handleExecutionCompleted)
    workflowService.on('workflow_execution_failed', handleExecutionFailed)

    return () => {
      workflowService.off('workflow_created', handleWorkflowCreated)
      workflowService.off('workflow_execution_started', handleExecutionStarted)
      workflowService.off('workflow_execution_completed', handleExecutionCompleted)
      workflowService.off('workflow_execution_failed', handleExecutionFailed)
    }
  }, [])

  const loadData = () => {
    setWorkflows(workflowService.getWorkflows())
    setExecutions(workflowService.getExecutions())
    setTemplates(workflowService.getTemplates())
    setMetrics(workflowService.getWorkflowMetrics())
  }

  const getOverviewMetrics = (): MetricCard[] => {
    if (!metrics) return []

    const runningExecutions = executions.filter(exec => exec.status === 'running').length
    const todayExecutions = executions.filter(exec => {
      const today = new Date()
      const execDate = new Date(exec.startTime)
      return execDate.toDateString() === today.toDateString()
    }).length

    return [
      {
        label: '总工作流',
        value: metrics.totalWorkflows,
        status: metrics.totalWorkflows > 0 ? 'good' : 'neutral',
        icon: <BoltIcon className="h-5 w-5" />,
        description: '已创建的工作流总数'
      },
      {
        label: '活跃工作流',
        value: metrics.activeWorkflows,
        status: metrics.activeWorkflows > 0 ? 'good' : 'neutral',
        icon: <PlayIcon className="h-5 w-5" />,
        description: '当前活跃的工作流数量'
      },
      {
        label: '运行中任务',
        value: runningExecutions,
        status: runningExecutions > 0 ? 'warning' : 'neutral',
        icon: <ClockIcon className="h-5 w-5" />,
        description: '正在执行的工作流任务'
      },
      {
        label: '成功率',
        value: `${(metrics.successRate * 100).toFixed(1)}%`,
        status: metrics.successRate >= 0.9 ? 'good' : metrics.successRate >= 0.7 ? 'warning' : 'danger',
        icon: <CheckCircleIcon className="h-5 w-5" />,
        description: '工作流执行成功率'
      },
      {
        label: '今日执行',
        value: todayExecutions,
        status: todayExecutions > 0 ? 'good' : 'neutral',
        icon: <ChartBarIcon className="h-5 w-5" />,
        description: '今日执行的工作流数量'
      },
      {
        label: '平均执行时间',
        value: `${(metrics.averageExecutionTime / 1000).toFixed(1)}s`,
        status: metrics.averageExecutionTime < 5000 ? 'good' : metrics.averageExecutionTime < 10000 ? 'warning' : 'danger',
        icon: <ArrowPathIcon className="h-5 w-5" />,
        description: '工作流平均执行时间'
      }
    ]
  }

  const handleCreateWorkflow = async () => {
    if (!newWorkflow.name.trim()) {
      toast.error('请输入工作流名称')
      return
    }

    try {
      await workflowService.createWorkflow(
        newWorkflow.name,
        newWorkflow.description,
        newWorkflow.category,
        'current_user' // In real app, get from auth context
      )

      setShowCreateModal(false)
      setNewWorkflow({ name: '', description: '', category: 'custom' })
      loadData()
    } catch (error) {
      console.error('Failed to create workflow:', error)
      toast.error('创建工作流失败')
    }
  }

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) {
      toast.error('请选择模板')
      return
    }

    try {
      await workflowService.createWorkflowFromTemplate(
        selectedTemplate,
        'current_user'
      )

      setShowTemplateModal(false)
      setSelectedTemplate('')
      loadData()
    } catch (error) {
      console.error('Failed to create workflow from template:', error)
      toast.error('从模板创建工作流失败')
    }
  }

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      let context = {}
      try {
        context = JSON.parse(executionContext)
      } catch {
        context = {}
      }

      await workflowService.executeWorkflow(workflowId, context, {
        type: 'manual',
        userId: 'current_user'
      })

      setShowExecutionModal(false)
      setExecutionContext('{}')
      loadData()
    } catch (error) {
      console.error('Failed to execute workflow:', error)
      toast.error('执行工作流失败')
    }
  }

  const handleToggleWorkflowStatus = async (workflowId: string, newStatus: 'active' | 'paused') => {
    try {
      await workflowService.updateWorkflow(workflowId, { status: newStatus })
      loadData()
      toast.success(`工作流已${newStatus === 'active' ? '激活' : '暂停'}`)
    } catch (error) {
      console.error('Failed to update workflow status:', error)
      toast.error('更新工作流状态失败')
    }
  }

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('确定要删除这个工作流吗？')) {
      return
    }

    try {
      await workflowService.deleteWorkflow(workflowId)
      loadData()
      toast.success('工作流已删除')
    } catch (error) {
      console.error('Failed to delete workflow:', error)
      toast.error('删除工作流失败')
    }
  }

  const handleCancelExecution = async (executionId: string) => {
    try {
      await workflowService.cancelExecution(executionId)
      loadData()
      toast.success('执行已取消')
    } catch (error) {
      console.error('Failed to cancel execution:', error)
      toast.error('取消执行失败')
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'success'
      case 'running':
      case 'paused':
        return 'warning'
      case 'failed':
      case 'cancelled':
        return 'destructive'
      case 'draft':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayIcon className="h-4 w-4" />
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'running':
        return <ClockIcon className="h-4 w-4" />
      case 'failed':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'customer_service':
        return <UserGroupIcon className="h-5 w-5" />
      case 'lead_generation':
        return <SparklesIcon className="h-5 w-5" />
      case 'content_moderation':
        return <BeakerIcon className="h-5 w-5" />
      case 'data_processing':
        return <ChartBarIcon className="h-5 w-5" />
      case 'notification':
        return <LinkIcon className="h-5 w-5" />
      case 'integration':
        return <CommandLineIcon className="h-5 w-5" />
      default:
        return <BoltIcon className="h-5 w-5" />
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const tabs = [
    { id: 'overview', name: '概览', icon: <ChartBarIcon className="h-5 w-5" /> },
    { id: 'workflows', name: '工作流', icon: <BoltIcon className="h-5 w-5" /> },
    { id: 'executions', name: '执行历史', icon: <ClockIcon className="h-5 w-5" /> },
    { id: 'templates', name: '模板库', icon: <DocumentTextIcon className="h-5 w-5" /> }
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
                <CardDescription>常用的工作流管理操作</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="h-auto py-4 px-6 flex flex-col items-center gap-2"
                  >
                    <PlusIcon className="h-6 w-6" />
                    <span className="text-sm">创建工作流</span>
                  </Button>
                  <Button
                    onClick={() => setShowTemplateModal(true)}
                    variant="outline"
                    className="h-auto py-4 px-6 flex flex-col items-center gap-2"
                  >
                    <DocumentTextIcon className="h-6 w-6" />
                    <span className="text-sm">从模板创建</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 px-6 flex flex-col items-center gap-2"
                    disabled={workflows.filter(wf => wf.status === 'active').length === 0}
                  >
                    <ArrowPathIcon className="h-6 w-6" />
                    <span className="text-sm">批量执行</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 px-6 flex flex-col items-center gap-2"
                  >
                    <ChartBarIcon className="h-6 w-6" />
                    <span className="text-sm">性能分析</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Workflows */}
            {metrics && metrics.topPerformingWorkflows.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>性能最佳工作流</CardTitle>
                  <CardDescription>执行次数最多的工作流</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics.topPerformingWorkflows.map((workflow, index) => (
                      <div key={workflow.workflowId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {workflow.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {workflow.executions} 次执行 • 成功率 {(workflow.successRate * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const fullWorkflow = workflows.find(wf => wf.id === workflow.workflowId)
                            if (fullWorkflow) setSelectedWorkflow(fullWorkflow)
                          }}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Executions */}
            <Card>
              <CardHeader>
                <CardTitle>最近执行</CardTitle>
                <CardDescription>最新的工作流执行记录</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {executions
                    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                    .slice(0, 5)
                    .map((execution) => (
                      <div key={execution.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(execution.status)}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {workflows.find(wf => wf.id === execution.workflowId)?.name || execution.workflowId}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {execution.startTime.toLocaleString()} • {execution.executionTime ? formatDuration(execution.executionTime) : '执行中'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(execution.status)}>
                            {execution.status === 'completed' ? '已完成' :
                             execution.status === 'running' ? '执行中' :
                             execution.status === 'failed' ? '失败' :
                             execution.status === 'cancelled' ? '已取消' : execution.status}
                          </Badge>
                          {execution.status === 'running' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancelExecution(execution.id)}
                            >
                              <StopIcon className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedExecution(execution)}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  {executions.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      暂无执行记录
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <motion.div
            key="workflows"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">工作流管理</h2>
                <p className="text-gray-600 dark:text-gray-400">创建和管理自动化工作流</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowTemplateModal(true)} variant="outline">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  从模板创建
                </Button>
                <Button onClick={() => setShowCreateModal(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  创建工作流
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {workflows.map((workflow) => (
                <Card key={workflow.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {getCategoryIcon(workflow.category)}
                          {workflow.name}
                          <Badge variant={getStatusBadgeVariant(workflow.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(workflow.status)}
                              {workflow.status === 'active' ? '活跃' :
                               workflow.status === 'paused' ? '暂停' :
                               workflow.status === 'draft' ? '草稿' :
                               workflow.status === 'deprecated' ? '已弃用' : workflow.status}
                            </div>
                          </Badge>
                          {workflow.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </CardTitle>
                        <CardDescription>{workflow.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {workflow.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedWorkflow(workflow)
                                setShowExecutionModal(true)
                              }}
                            >
                              <PlayIcon className="h-4 w-4 mr-1" />
                              执行
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleWorkflowStatus(workflow.id, 'paused')}
                            >
                              <StopIcon className="h-4 w-4 mr-1" />
                              暂停
                            </Button>
                          </>
                        )}
                        {workflow.status === 'paused' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleWorkflowStatus(workflow.id, 'active')}
                          >
                            <PlayIcon className="h-4 w-4 mr-1" />
                            激活
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          编辑
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedWorkflow(workflow)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteWorkflow(workflow.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">总执行次数</p>
                        <p className="font-medium">{workflow.analytics.totalExecutions}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">成功率</p>
                        <p className="font-medium">
                          {workflow.analytics.totalExecutions > 0
                            ? `${((workflow.analytics.successfulExecutions / workflow.analytics.totalExecutions) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">平均执行时间</p>
                        <p className="font-medium">{formatDuration(workflow.analytics.averageExecutionTime)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">最后执行</p>
                        <p className="font-medium">
                          {workflow.analytics.lastExecuted
                            ? workflow.analytics.lastExecuted.toLocaleDateString()
                            : '从未执行'
                          }
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {workflow.nodes.length} 个节点 • 版本 {workflow.version} • 创建于 {workflow.createdAt.toLocaleDateString()}
                      </div>
                      {workflow.schedule?.enabled && (
                        <Badge variant="outline" className="text-xs">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          已调度
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {workflows.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <BoltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      暂无工作流
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      创建您的第一个自动化工作流
                    </p>
                    <div className="flex justify-center gap-2">
                      <Button onClick={() => setShowCreateModal(true)}>
                        创建工作流
                      </Button>
                      <Button onClick={() => setShowTemplateModal(true)} variant="outline">
                        从模板创建
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}

        {/* Executions Tab */}
        {activeTab === 'executions' && (
          <motion.div
            key="executions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">执行历史</h2>
                <p className="text-gray-600 dark:text-gray-400">查看工作流执行记录和日志</p>
              </div>
            </div>

            <div className="grid gap-6">
              {executions
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .map((execution) => (
                  <Card key={execution.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {getStatusIcon(execution.status)}
                            {workflows.find(wf => wf.id === execution.workflowId)?.name || execution.workflowId}
                            <Badge variant={getStatusBadgeVariant(execution.status)}>
                              {execution.status === 'completed' ? '已完成' :
                               execution.status === 'running' ? '执行中' :
                               execution.status === 'failed' ? '失败' :
                               execution.status === 'cancelled' ? '已取消' :
                               execution.status === 'waiting' ? '等待中' : execution.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            执行ID: {execution.id} • 触发方式: {
                              execution.triggeredBy.type === 'manual' ? '手动执行' :
                              execution.triggeredBy.type === 'trigger' ? '自动触发' :
                              execution.triggeredBy.type === 'api' ? 'API调用' :
                              execution.triggeredBy.type === 'schedule' ? '定时调度' : execution.triggeredBy.type
                            }
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {execution.status === 'running' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelExecution(execution.id)}
                            >
                              <StopIcon className="h-4 w-4 mr-1" />
                              取消
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedExecution(execution)}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {execution.status === 'running' && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>执行进度</span>
                            <span>当前节点: {execution.currentNodeId || '准备中'}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            已执行节点: {execution.executedNodes.length}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">开始时间</p>
                          <p className="font-medium">{execution.startTime.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">结束时间</p>
                          <p className="font-medium">
                            {execution.endTime ? execution.endTime.toLocaleString() : '执行中'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">执行时长</p>
                          <p className="font-medium">
                            {execution.executionTime ? formatDuration(execution.executionTime) : '计算中'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">日志条数</p>
                          <p className="font-medium">{execution.logs.length}</p>
                        </div>
                      </div>

                      {execution.result && (
                        <div className={`mt-4 p-3 rounded-lg ${
                          execution.result.success
                            ? 'bg-green-50 dark:bg-green-900/20'
                            : 'bg-red-50 dark:bg-red-900/20'
                        }`}>
                          <p className={`text-sm ${
                            execution.result.success
                              ? 'text-green-800 dark:text-green-200'
                              : 'text-red-800 dark:text-red-200'
                          }`}>
                            {execution.result.success
                              ? '执行成功完成'
                              : `执行失败: ${execution.result.error}`
                            }
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

              {executions.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      暂无执行记录
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      执行工作流后将显示历史记录
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">工作流模板</h2>
                <p className="text-gray-600 dark:text-gray-400">预设的工作流模板，快速创建常用自动化</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {getCategoryIcon(template.category)}
                          {template.name}
                          <Badge variant="outline" className="text-xs">
                            {template.difficulty === 'beginner' ? '初级' :
                             template.difficulty === 'intermediate' ? '中级' :
                             template.difficulty === 'advanced' ? '高级' : template.difficulty}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {template.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">使用次数</p>
                          <p className="font-medium">{template.usageCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">评分</p>
                          <p className="font-medium">★ {template.rating.toFixed(1)}</p>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        作者: {template.author}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedTemplate(template.id)
                            handleCreateFromTemplate()
                          }}
                        >
                          <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                          使用模板
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Workflow Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建工作流"
        description="创建新的自动化工作流"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              工作流名称
            </label>
            <Input
              value={newWorkflow.name}
              onChange={(e) => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入工作流名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              描述
            </label>
            <Textarea
              value={newWorkflow.description}
              onChange={(e) => setNewWorkflow(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请输入工作流描述"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              类别
            </label>
            <Select
              options={[
                { value: 'customer_service', label: '客户服务' },
                { value: 'lead_generation', label: '潜客开发' },
                { value: 'content_moderation', label: '内容审核' },
                { value: 'data_processing', label: '数据处理' },
                { value: 'notification', label: '通知提醒' },
                { value: 'integration', label: '系统集成' },
                { value: 'custom', label: '自定义' }
              ]}
              value={newWorkflow.category}
              onChange={(value) => setNewWorkflow(prev => ({ ...prev, category: value as any }))}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateWorkflow} disabled={!newWorkflow.name.trim()}>
              创建工作流
            </Button>
          </div>
        </div>
      </Modal>

      {/* Template Selection Modal */}
      <Modal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="选择模板"
        description="从预设模板创建工作流"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              选择模板
            </label>
            <Select
              options={templates.map(template => ({
                value: template.id,
                label: template.name,
                description: template.description
              }))}
              value={selectedTemplate}
              onChange={(value) => setSelectedTemplate(value)}
              placeholder="请选择模板"
            />
          </div>
          {selectedTemplate && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                {templates.find(t => t.id === selectedTemplate)?.name}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {templates.find(t => t.id === selectedTemplate)?.description}
              </p>
              <div className="mt-2 flex gap-1">
                {templates.find(t => t.id === selectedTemplate)?.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateFromTemplate} disabled={!selectedTemplate}>
              创建工作流
            </Button>
          </div>
        </div>
      </Modal>

      {/* Execute Workflow Modal */}
      <Modal
        open={showExecutionModal}
        onClose={() => setShowExecutionModal(false)}
        title="执行工作流"
        description={`执行工作流: ${selectedWorkflow?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              执行上下文 (JSON格式)
            </label>
            <Textarea
              value={executionContext}
              onChange={(e) => setExecutionContext(e.target.value)}
              placeholder='{"message": {"content": "Hello"}, "user": {"id": "user123"}}'
              rows={4}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              提供工作流执行时需要的上下文数据
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowExecutionModal(false)}>
              取消
            </Button>
            <Button
              onClick={() => selectedWorkflow && handleExecuteWorkflow(selectedWorkflow.id)}
              disabled={!selectedWorkflow}
            >
              <PlayIcon className="h-4 w-4 mr-1" />
              执行
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default WorkflowDashboard
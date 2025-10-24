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
  CpuChipIcon,
  DocumentTextIcon,
  PlayIcon,
  StopIcon,
  ChartBarIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  Cog6ToothIcon,
  BeakerIcon,
  DocumentChartBarIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import modelTrainingService, {
  type TrainingDataset,
  type FineTuningJob,
  type ModelEvaluation,
  type TrainingTemplate
} from '@/services/modelTrainingService'
import { toast } from 'react-hot-toast'

interface MetricCard {
  label: string
  value: string | number
  status: 'good' | 'warning' | 'danger' | 'neutral'
  icon: React.ReactNode
  description: string
}

const ModelTrainingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [datasets, setDatasets] = useState<TrainingDataset[]>([])
  const [trainingJobs, setTrainingJobs] = useState<FineTuningJob[]>([])
  const [evaluations, setEvaluations] = useState<ModelEvaluation[]>([])
  const [templates, setTemplates] = useState<TrainingTemplate[]>([])
  const [selectedDataset, setSelectedDataset] = useState<TrainingDataset | null>(null)
  const [selectedJob, setSelectedJob] = useState<FineTuningJob | null>(null)
  const [showCreateDatasetModal, setShowCreateDatasetModal] = useState(false)
  const [showCreateJobModal, setShowCreateJobModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [newDataset, setNewDataset] = useState({ name: '', description: '', category: 'general' })
  const [newJob, setNewJob] = useState({
    name: '',
    baseModel: 'gpt-3.5-turbo',
    datasetId: '',
    templateId: 'chatbot',
    config: {
      epochs: 3,
      batchSize: 4,
      learningRate: 0.00005,
      validationSplit: 0.2
    }
  })
  const [importConfig, setImportConfig] = useState({
    format: 'json' as 'json' | 'csv' | 'jsonl',
    data: '',
    datasetId: ''
  })

  useEffect(() => {
    const initializeService = async () => {
      try {
        if (!modelTrainingService.isReady()) {
          await modelTrainingService.initialize()
        }
        loadData()
      } catch (error) {
        console.error('Failed to initialize model training service:', error)
        toast.error('初始化模型训练服务失败')
      }
    }

    initializeService()

    // Event listeners
    const handleTrainingProgress = (data: any) => {
      setTrainingJobs(prev => prev.map(job =>
        job.id === data.jobId ? { ...job, progress: data.progress, metrics: data.metrics } : job
      ))
    }

    const handleTrainingCompleted = (job: FineTuningJob) => {
      setTrainingJobs(prev => prev.map(j => j.id === job.id ? job : j))
      toast.success(`训练完成: ${job.name}`)
    }

    const handleDatasetCreated = (dataset: TrainingDataset) => {
      setDatasets(prev => [...prev, dataset])
      toast.success(`数据集已创建: ${dataset.name}`)
    }

    modelTrainingService.on('training_progress', handleTrainingProgress)
    modelTrainingService.on('training_completed', handleTrainingCompleted)
    modelTrainingService.on('dataset_created', handleDatasetCreated)

    return () => {
      modelTrainingService.off('training_progress', handleTrainingProgress)
      modelTrainingService.off('training_completed', handleTrainingCompleted)
      modelTrainingService.off('dataset_created', handleDatasetCreated)
    }
  }, [])

  const loadData = () => {
    setDatasets(modelTrainingService.getDatasets())
    setTrainingJobs(modelTrainingService.getTrainingJobs())
    setEvaluations(modelTrainingService.getEvaluations())
    setTemplates(modelTrainingService.getTemplates())
  }

  const getOverviewMetrics = (): MetricCard[] => {
    const activeJobs = trainingJobs.filter(job => ['training', 'preparing'].includes(job.status)).length
    const completedJobs = trainingJobs.filter(job => job.status === 'completed').length
    const totalDatasets = datasets.length
    const validatedDatasets = datasets.filter(ds => ds.status === 'validated').length
    const avgAccuracy = evaluations.length > 0
      ? evaluations.reduce((sum, evaluation) => sum + evaluation.results.accuracy, 0) / evaluations.length
      : 0

    return [
      {
        label: '活跃训练',
        value: activeJobs,
        status: activeJobs > 0 ? 'good' : 'neutral',
        icon: <RocketLaunchIcon className="h-5 w-5" />,
        description: '正在进行的训练任务数量'
      },
      {
        label: '完成训练',
        value: completedJobs,
        status: completedJobs > 0 ? 'good' : 'neutral',
        icon: <CheckCircleIcon className="h-5 w-5" />,
        description: '已完成的训练任务数量'
      },
      {
        label: '数据集',
        value: `${validatedDatasets}/${totalDatasets}`,
        status: totalDatasets > 0 ? (validatedDatasets / totalDatasets >= 0.8 ? 'good' : 'warning') : 'neutral',
        icon: <DocumentTextIcon className="h-5 w-5" />,
        description: '已验证/总数据集数量'
      },
      {
        label: '平均准确率',
        value: `${(avgAccuracy * 100).toFixed(1)}%`,
        status: avgAccuracy >= 0.9 ? 'good' : avgAccuracy >= 0.8 ? 'warning' : 'danger',
        icon: <ChartBarIcon className="h-5 w-5" />,
        description: '所有评估的平均准确率'
      },
      {
        label: '模型评估',
        value: evaluations.length,
        status: evaluations.length > 0 ? 'good' : 'neutral',
        icon: <BeakerIcon className="h-5 w-5" />,
        description: '已完成的模型评估数量'
      },
      {
        label: '训练模板',
        value: templates.length,
        status: 'good',
        icon: <DocumentChartBarIcon className="h-5 w-5" />,
        description: '可用的训练模板数量'
      }
    ]
  }

  const handleCreateDataset = async () => {
    try {
      await modelTrainingService.createDataset(
        newDataset.name,
        newDataset.description,
        newDataset.category
      )
      setShowCreateDatasetModal(false)
      setNewDataset({ name: '', description: '', category: 'general' })
      loadData()
    } catch (error) {
      console.error('Failed to create dataset:', error)
      toast.error('创建数据集失败')
    }
  }

  const handleStartTraining = async () => {
    try {
      await modelTrainingService.startFineTuning(
        newJob.name,
        newJob.baseModel,
        newJob.datasetId,
        newJob.templateId,
        newJob.config
      )
      setShowCreateJobModal(false)
      setNewJob({
        name: '',
        baseModel: 'gpt-3.5-turbo',
        datasetId: '',
        templateId: 'chatbot',
        config: { epochs: 3, batchSize: 4, learningRate: 0.00005, validationSplit: 0.2 }
      })
      loadData()
      toast.success('训练已开始')
    } catch (error) {
      console.error('Failed to start training:', error)
      toast.error('启动训练失败')
    }
  }

  const handleCancelTraining = async (jobId: string) => {
    try {
      await modelTrainingService.cancelTraining(jobId)
      loadData()
      toast.success('训练已取消')
    } catch (error) {
      console.error('Failed to cancel training:', error)
      toast.error('取消训练失败')
    }
  }

  const handleValidateDataset = async (datasetId: string) => {
    try {
      await modelTrainingService.validateDataset(datasetId)
      loadData()
      toast.success('数据集验证完成')
    } catch (error) {
      console.error('Failed to validate dataset:', error)
      toast.error('数据集验证失败')
    }
  }

  const handleImportData = async () => {
    try {
      await modelTrainingService.importDataset(
        importConfig.data,
        importConfig.format,
        importConfig.datasetId || undefined
      )
      setShowImportModal(false)
      setImportConfig({ format: 'json', data: '', datasetId: '' })
      loadData()
      toast.success('数据导入成功')
    } catch (error) {
      console.error('Failed to import data:', error)
      toast.error('数据导入失败')
    }
  }

  const handleEvaluateModel = async (modelId: string) => {
    const testDataset = datasets.find(ds => ds.status === 'validated')
    if (!testDataset) {
      toast.error('没有可用的验证数据集')
      return
    }

    try {
      await modelTrainingService.evaluateModel(modelId, testDataset.id)
      loadData()
      toast.success('模型评估完成')
    } catch (error) {
      console.error('Failed to evaluate model:', error)
      toast.error('模型评估失败')
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
      case 'validated':
      case 'ready':
        return 'success'
      case 'training':
      case 'preparing':
        return 'warning'
      case 'failed':
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'training':
      case 'preparing':
        return <ClockIcon className="h-4 w-4" />
      case 'failed':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  const tabs = [
    { id: 'overview', name: '概览', icon: <ChartBarIcon className="h-5 w-5" /> },
    { id: 'datasets', name: '数据集', icon: <DocumentTextIcon className="h-5 w-5" /> },
    { id: 'training', name: '训练任务', icon: <RocketLaunchIcon className="h-5 w-5" /> },
    { id: 'evaluation', name: '模型评估', icon: <BeakerIcon className="h-5 w-5" /> },
    { id: 'templates', name: '训练模板', icon: <DocumentChartBarIcon className="h-5 w-5" /> }
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
                <CardDescription>常用的训练和数据管理操作</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    onClick={() => setShowCreateDatasetModal(true)}
                    className="h-auto py-4 px-6 flex flex-col items-center gap-2"
                  >
                    <PlusIcon className="h-6 w-6" />
                    <span className="text-sm">创建数据集</span>
                  </Button>
                  <Button
                    onClick={() => setShowImportModal(true)}
                    variant="outline"
                    className="h-auto py-4 px-6 flex flex-col items-center gap-2"
                  >
                    <CloudArrowUpIcon className="h-6 w-6" />
                    <span className="text-sm">导入数据</span>
                  </Button>
                  <Button
                    onClick={() => setShowCreateJobModal(true)}
                    variant="outline"
                    className="h-auto py-4 px-6 flex flex-col items-center gap-2"
                    disabled={datasets.filter(ds => ds.status === 'validated').length === 0}
                  >
                    <RocketLaunchIcon className="h-6 w-6" />
                    <span className="text-sm">开始训练</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 px-6 flex flex-col items-center gap-2"
                    disabled={trainingJobs.filter(job => job.status === 'completed').length === 0}
                  >
                    <BeakerIcon className="h-6 w-6" />
                    <span className="text-sm">模型评估</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>最近活动</CardTitle>
                <CardDescription>最新的训练任务和数据集活动</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...trainingJobs, ...datasets.map(ds => ({ ...ds, type: 'dataset' }))]
                    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
                    .slice(0, 5)
                    .map((item: any, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          {item.type === 'dataset' ? (
                            <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                          ) : (
                            <RocketLaunchIcon className="h-5 w-5 text-green-500" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {item.type === 'dataset' ? '数据集' : '训练任务'} • {(item.updatedAt || item.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(item.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(item.status)}
                            {item.status === 'validated' ? '已验证' :
                             item.status === 'ready' ? '就绪' :
                             item.status === 'training' ? '训练中' :
                             item.status === 'completed' ? '已完成' :
                             item.status === 'draft' ? '草稿' : item.status}
                          </div>
                        </Badge>
                      </div>
                    ))}
                  {trainingJobs.length === 0 && datasets.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      暂无活动记录
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Datasets Tab */}
        {activeTab === 'datasets' && (
          <motion.div
            key="datasets"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">训练数据集</h2>
                <p className="text-gray-600 dark:text-gray-400">管理用于模型训练的数据集</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowImportModal(true)} variant="outline">
                  <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                  导入数据
                </Button>
                <Button onClick={() => setShowCreateDatasetModal(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  创建数据集
                </Button>
              </div>
            </div>

            <div className="grid gap-6">
              {datasets.map((dataset) => (
                <Card key={dataset.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {dataset.name}
                          <Badge variant={getStatusBadgeVariant(dataset.status)}>
                            {dataset.status === 'validated' ? '已验证' :
                             dataset.status === 'ready' ? '就绪' :
                             dataset.status === 'draft' ? '草稿' : dataset.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{dataset.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {dataset.status === 'draft' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleValidateDataset(dataset.id)}
                          >
                            验证数据集
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedDataset(dataset)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">数据量</p>
                        <p className="font-medium">{dataset.statistics.totalItems} 条</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">平均输入长度</p>
                        <p className="font-medium">{dataset.statistics.avgInputLength.toFixed(0)} 字符</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">创建时间</p>
                        <p className="font-medium">{dataset.createdAt.toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">版本</p>
                        <p className="font-medium">{dataset.version}</p>
                      </div>
                    </div>
                    {dataset.validationResults && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          验证通过率: {(dataset.validationResults.passRate * 100).toFixed(1)}% •
                          覆盖率: {(dataset.validationResults.coverage * 100).toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {datasets.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      暂无数据集
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      创建或导入您的第一个训练数据集
                    </p>
                    <Button onClick={() => setShowCreateDatasetModal(true)}>
                      创建数据集
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}

        {/* Training Tab */}
        {activeTab === 'training' && (
          <motion.div
            key="training"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">训练任务</h2>
                <p className="text-gray-600 dark:text-gray-400">管理模型微调和训练过程</p>
              </div>
              <Button
                onClick={() => setShowCreateJobModal(true)}
                disabled={datasets.filter(ds => ds.status === 'validated').length === 0}
              >
                <RocketLaunchIcon className="h-4 w-4 mr-2" />
                开始新训练
              </Button>
            </div>

            <div className="grid gap-6">
              {trainingJobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {job.name}
                          <Badge variant={getStatusBadgeVariant(job.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(job.status)}
                              {job.status === 'pending' ? '等待中' :
                               job.status === 'preparing' ? '准备中' :
                               job.status === 'training' ? '训练中' :
                               job.status === 'validating' ? '验证中' :
                               job.status === 'completed' ? '已完成' :
                               job.status === 'failed' ? '失败' :
                               job.status === 'cancelled' ? '已取消' : job.status}
                            </div>
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          基于 {job.baseModel} • 数据集: {datasets.find(ds => ds.id === job.datasetId)?.name || 'Unknown'}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {['training', 'preparing'].includes(job.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelTraining(job.id)}
                          >
                            <StopIcon className="h-4 w-4 mr-1" />
                            停止
                          </Button>
                        )}
                        {job.status === 'completed' && job.resultModel && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEvaluateModel(job.resultModel!.id)}
                          >
                            <BeakerIcon className="h-4 w-4 mr-1" />
                            评估
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
                    {['training', 'preparing', 'validating'].includes(job.status) && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>训练进度</span>
                          <span>{job.progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={job.progress} className="h-2" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">训练轮数</p>
                        <p className="font-medium">{job.config.epochs}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">批次大小</p>
                        <p className="font-medium">{job.config.batchSize}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">学习率</p>
                        <p className="font-medium">{job.config.learningRate}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">开始时间</p>
                        <p className="font-medium">
                          {job.startTime ? job.startTime.toLocaleString() : '未开始'}
                        </p>
                      </div>
                    </div>

                    {job.resultModel && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">训练结果</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-green-600 dark:text-green-300">准确率: {(job.resultModel.performance.accuracy * 100).toFixed(2)}%</p>
                            <p className="text-green-600 dark:text-green-300">F1分数: {job.resultModel.performance.f1Score.toFixed(3)}</p>
                          </div>
                          <div>
                            <p className="text-green-600 dark:text-green-300">推理速度: {job.resultModel.performance.inferenceSpeed} tokens/s</p>
                            <p className="text-green-600 dark:text-green-300">模型大小: {job.resultModel.size} MB</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {trainingJobs.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <RocketLaunchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      暂无训练任务
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      开始您的第一个模型训练任务
                    </p>
                    <Button
                      onClick={() => setShowCreateJobModal(true)}
                      disabled={datasets.filter(ds => ds.status === 'validated').length === 0}
                    >
                      开始训练
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}

        {/* Evaluation Tab */}
        {activeTab === 'evaluation' && (
          <motion.div
            key="evaluation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">模型评估</h2>
                <p className="text-gray-600 dark:text-gray-400">评估训练模型的性能指标</p>
              </div>
            </div>

            <div className="grid gap-6">
              {evaluations.map((evaluation) => (
                <Card key={evaluation.id}>
                  <CardHeader>
                    <CardTitle>
                      模型评估 - {evaluation.modelId}
                    </CardTitle>
                    <CardDescription>
                      评估时间: {evaluation.timestamp.toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Performance Metrics */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">性能指标</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>准确率</span>
                            <span className="font-medium">{(evaluation.results.accuracy * 100).toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>精确率</span>
                            <span className="font-medium">{(evaluation.results.precision * 100).toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>召回率</span>
                            <span className="font-medium">{(evaluation.results.recall * 100).toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>F1分数</span>
                            <span className="font-medium">{evaluation.results.f1Score.toFixed(3)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Benchmark Metrics */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">性能基准</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>推理速度</span>
                            <span className="font-medium">{evaluation.benchmarks.inferenceSpeed} tokens/s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>内存使用</span>
                            <span className="font-medium">{evaluation.benchmarks.memoryUsage} MB</span>
                          </div>
                          <div className="flex justify-between">
                            <span>CPU使用率</span>
                            <span className="font-medium">{evaluation.benchmarks.cpuUsage}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>响应时间</span>
                            <span className="font-medium">{evaluation.benchmarks.responseTime} ms</span>
                          </div>
                        </div>
                      </div>

                      {/* Qualitative Results */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">质量评分</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>连贯性</span>
                            <span className="font-medium">{evaluation.qualitativeResults.coherence}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>相关性</span>
                            <span className="font-medium">{evaluation.qualitativeResults.relevance}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>流畅性</span>
                            <span className="font-medium">{evaluation.qualitativeResults.fluency}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>创造性</span>
                            <span className="font-medium">{evaluation.qualitativeResults.creativity}/10</span>
                          </div>
                        </div>
                      </div>

                      {/* Test Cases Sample */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">测试样例</h4>
                        <div className="text-sm">
                          <p className="text-gray-500 dark:text-gray-400">
                            测试用例: {evaluation.testCases.length} 个
                          </p>
                          <p className="text-gray-500 dark:text-gray-400">
                            平均得分: {(evaluation.testCases.reduce((sum, tc) => sum + tc.score, 0) / evaluation.testCases.length * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {evaluations.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <BeakerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      暂无评估记录
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      完成模型训练后进行评估
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
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">训练模板</h2>
              <p className="text-gray-600 dark:text-gray-400">预配置的训练模板，适用于不同的任务类型</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DocumentChartBarIcon className="h-5 w-5" />
                      {template.name}
                    </CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">配置参数</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span>训练轮数</span>
                            <span>{template.config.epochs}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>批次大小</span>
                            <span>{template.config.batchSize}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>学习率</span>
                            <span>{template.config.learningRate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>验证比例</span>
                            <span>{template.config.validationSplit}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">数据要求</h4>
                        <div className="text-sm space-y-1">
                          <p>最少样本: {template.dataRequirements.minSamples}</p>
                          <p>最多样本: {template.dataRequirements.maxSamples}</p>
                          <p>数据格式: {template.dataRequirements.format}</p>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => {
                          setNewJob(prev => ({ ...prev, templateId: template.id }))
                          setShowCreateJobModal(true)
                        }}
                        disabled={datasets.filter(ds => ds.status === 'validated').length === 0}
                      >
                        使用此模板
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Dataset Modal */}
      <Modal
        open={showCreateDatasetModal}
        onClose={() => setShowCreateDatasetModal(false)}
        title="创建训练数据集"
        description="创建新的训练数据集"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              数据集名称
            </label>
            <Input
              value={newDataset.name}
              onChange={(e) => setNewDataset(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入数据集名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              描述
            </label>
            <Textarea
              value={newDataset.description}
              onChange={(e) => setNewDataset(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请输入数据集描述"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              类别
            </label>
            <Select
              options={[
                { value: 'general', label: '通用' },
                { value: 'chatbot', label: '聊天机器人' },
                { value: 'classification', label: '分类' },
                { value: 'completion', label: '文本补全' },
                { value: 'translation', label: '翻译' }
              ]}
              value={newDataset.category}
              onChange={(value) => setNewDataset(prev => ({ ...prev, category: value }))}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateDatasetModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateDataset} disabled={!newDataset.name.trim()}>
              创建数据集
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Training Job Modal */}
      <Modal
        open={showCreateJobModal}
        onClose={() => setShowCreateJobModal(false)}
        title="开始模型训练"
        description="配置并启动新的训练任务"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              训练任务名称
            </label>
            <Input
              value={newJob.name}
              onChange={(e) => setNewJob(prev => ({ ...prev, name: e.target.value }))}
              placeholder="请输入训练任务名称"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              基础模型
            </label>
            <Select
              options={[
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                { value: 'gpt-4', label: 'GPT-4' },
                { value: 'claude-3', label: 'Claude 3' },
                { value: 'llama-2', label: 'Llama 2' }
              ]}
              value={newJob.baseModel}
              onChange={(value) => setNewJob(prev => ({ ...prev, baseModel: value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              训练数据集
            </label>
            <Select
              options={datasets
                .filter(ds => ds.status === 'validated')
                .map(ds => ({ value: ds.id, label: ds.name, description: `${ds.statistics.totalItems} 条数据` }))}
              value={newJob.datasetId}
              onChange={(value) => setNewJob(prev => ({ ...prev, datasetId: value }))}
              placeholder="选择训练数据集"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              训练模板
            </label>
            <Select
              options={templates.map(t => ({ value: t.id, label: t.name, description: t.description }))}
              value={newJob.templateId}
              onChange={(value) => setNewJob(prev => ({ ...prev, templateId: value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                训练轮数
              </label>
              <Input
                type="number"
                value={newJob.config.epochs}
                onChange={(e) => setNewJob(prev => ({
                  ...prev,
                  config: { ...prev.config, epochs: parseInt(e.target.value) }
                }))}
                min="1"
                max="20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                批次大小
              </label>
              <Input
                type="number"
                value={newJob.config.batchSize}
                onChange={(e) => setNewJob(prev => ({
                  ...prev,
                  config: { ...prev.config, batchSize: parseInt(e.target.value) }
                }))}
                min="1"
                max="32"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateJobModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleStartTraining}
              disabled={!newJob.name.trim() || !newJob.datasetId}
            >
              开始训练
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Data Modal */}
      <Modal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="导入训练数据"
        description="从文件导入训练数据"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              数据格式
            </label>
            <Select
              options={[
                { value: 'json', label: 'JSON', description: 'JSON格式数据' },
                { value: 'jsonl', label: 'JSONL', description: '每行一个JSON对象' },
                { value: 'csv', label: 'CSV', description: 'CSV格式数据' }
              ]}
              value={importConfig.format}
              onChange={(value) => setImportConfig(prev => ({ ...prev, format: value as any }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              目标数据集 (可选)
            </label>
            <Select
              options={datasets.map(ds => ({ value: ds.id, label: ds.name }))}
              value={importConfig.datasetId}
              onChange={(value) => setImportConfig(prev => ({ ...prev, datasetId: value }))}
              placeholder="选择现有数据集或留空创建新数据集"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              数据内容
            </label>
            <Textarea
              value={importConfig.data}
              onChange={(e) => setImportConfig(prev => ({ ...prev, data: e.target.value }))}
              placeholder={`请粘贴${importConfig.format.toUpperCase()}格式的数据...`}
              rows={8}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowImportModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleImportData}
              disabled={!importConfig.data.trim()}
            >
              导入数据
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ModelTrainingDashboard
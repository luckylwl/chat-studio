import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Modal,
  Input,
  Select,
  Switch,
  Textarea
} from '@/components/ui'
import contentModerationService, {
  ModerationRule,
  ModerationResult,
  ModerationAnalytics,
  AutoModerationConfig
} from '@/services/contentModerationService'
import {
  ShieldExclamationIcon,
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FlagIcon,
  BoltIcon,
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  InformationCircleIcon,
  SparklesIcon,
  LockClosedIcon,
  GlobeAltIcon,
  CpuChipIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

const ContentModerationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [rules, setRules] = useState<ModerationRule[]>([])
  const [results, setResults] = useState<ModerationResult[]>([])
  const [analytics, setAnalytics] = useState<ModerationAnalytics | null>(null)
  const [config, setConfig] = useState<AutoModerationConfig | null>(null)
  const [loading, setLoading] = useState(false)

  // Modal states
  const [showCreateRuleModal, setShowCreateRuleModal] = useState(false)
  const [showEditRuleModal, setShowEditRuleModal] = useState(false)
  const [showResultDetailsModal, setShowResultDetailsModal] = useState(false)
  const [showTestModerationModal, setShowTestModerationModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedRule, setSelectedRule] = useState<ModerationRule | null>(null)
  const [selectedResult, setSelectedResult] = useState<ModerationResult | null>(null)

  // Form states
  const [ruleForm, setRuleForm] = useState<Partial<ModerationRule>>({
    name: '',
    description: '',
    category: 'safety',
    type: 'keyword',
    isActive: true,
    severity: 'medium',
    config: {},
    actions: [],
    whitelist: [],
    blacklist: []
  })
  const [testContent, setTestContent] = useState('')
  const [testResult, setTestResult] = useState<ModerationResult | null>(null)
  const [tempConfig, setTempConfig] = useState<Partial<AutoModerationConfig>>({})

  const tabs = [
    { id: 'overview', name: '概览', icon: <ShieldExclamationIcon className="h-5 w-5" /> },
    { id: 'rules', name: '审核规则', icon: <DocumentTextIcon className="h-5 w-5" /> },
    { id: 'results', name: '审核结果', icon: <FlagIcon className="h-5 w-5" /> },
    { id: 'analytics', name: '数据分析', icon: <ChartBarIcon className="h-5 w-5" /> },
    { id: 'test', name: '测试工具', icon: <BeakerIcon className="h-5 w-5" /> },
    { id: 'config', name: '系统配置', icon: <AdjustmentsHorizontalIcon className="h-5 w-5" /> }
  ]

  const categoryOptions = [
    { value: 'safety', label: '安全内容' },
    { value: 'policy', label: '政策合规' },
    { value: 'quality', label: '内容质量' },
    { value: 'privacy', label: '隐私保护' },
    { value: 'spam', label: '垃圾信息' },
    { value: 'custom', label: '自定义' }
  ]

  const typeOptions = [
    { value: 'keyword', label: '关键词' },
    { value: 'pattern', label: '正则模式' },
    { value: 'ai_classifier', label: 'AI分类器' },
    { value: 'sentiment', label: '情感分析' },
    { value: 'toxicity', label: '毒性检测' },
    { value: 'pii', label: 'PII检测' }
  ]

  const severityOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
    { value: 'critical', label: '严重' }
  ]

  const actionOptions = [
    { value: 'block', label: '阻止' },
    { value: 'flag', label: '标记' },
    { value: 'warn', label: '警告' },
    { value: 'review', label: '人工审核' },
    { value: 'replace', label: '替换' },
    { value: 'escalate', label: '升级' },
    { value: 'log', label: '记录日志' },
    { value: 'notify', label: '通知' }
  ]

  useEffect(() => {
    loadData()

    // Listen for service events
    const handleContentModerated = (result: ModerationResult) => {
      setResults(prev => [result, ...prev.slice(0, 99)]) // Keep last 100
      toast.success('内容审核完成')
    }

    const handleRuleCreated = (rule: ModerationRule) => {
      setRules(prev => [rule, ...prev])
      toast.success('审核规则创建成功')
    }

    const handleRuleUpdated = (rule: ModerationRule) => {
      setRules(prev => prev.map(r => r.id === rule.id ? rule : r))
      toast.success('审核规则更新成功')
    }

    contentModerationService.on('contentModerated', handleContentModerated)
    contentModerationService.on('ruleCreated', handleRuleCreated)
    contentModerationService.on('ruleUpdated', handleRuleUpdated)

    return () => {
      contentModerationService.off('contentModerated', handleContentModerated)
      contentModerationService.off('ruleCreated', handleRuleCreated)
      contentModerationService.off('ruleUpdated', handleRuleUpdated)
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [rulesData, resultsData, analyticsData, configData] = await Promise.all([
        contentModerationService.getRules(),
        contentModerationService.getModerationResults({ limit: 100 }),
        contentModerationService.getAnalytics(),
        contentModerationService.getConfig()
      ])

      setRules(rulesData)
      setResults(resultsData)
      setAnalytics(analyticsData)
      setConfig(configData)
      setTempConfig(configData)
    } catch (error) {
      console.error('Failed to load content moderation data:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async () => {
    if (!ruleForm.name || !ruleForm.description) {
      toast.error('请填写规则名称和描述')
      return
    }

    setLoading(true)
    try {
      await contentModerationService.createRule({
        name: ruleForm.name!,
        description: ruleForm.description!,
        category: ruleForm.category as any || 'safety',
        type: ruleForm.type as any || 'keyword',
        isActive: ruleForm.isActive || true,
        severity: ruleForm.severity as any || 'medium',
        config: ruleForm.config || {},
        actions: ruleForm.actions || [],
        whitelist: ruleForm.whitelist || [],
        blacklist: ruleForm.blacklist || []
      })

      setShowCreateRuleModal(false)
      resetRuleForm()
      await loadData()
    } catch (error) {
      console.error('Failed to create rule:', error)
      toast.error('创建规则失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRule = async () => {
    if (!selectedRule || !ruleForm.name || !ruleForm.description) {
      toast.error('请填写完整信息')
      return
    }

    setLoading(true)
    try {
      await contentModerationService.updateRule(selectedRule.id, {
        name: ruleForm.name!,
        description: ruleForm.description!,
        category: ruleForm.category as any,
        type: ruleForm.type as any,
        isActive: ruleForm.isActive,
        severity: ruleForm.severity as any,
        config: ruleForm.config,
        actions: ruleForm.actions,
        whitelist: ruleForm.whitelist,
        blacklist: ruleForm.blacklist
      })

      setShowEditRuleModal(false)
      setSelectedRule(null)
      resetRuleForm()
      await loadData()
    } catch (error) {
      console.error('Failed to update rule:', error)
      toast.error('更新规则失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('确定要删除此规则吗？')) return

    setLoading(true)
    try {
      await contentModerationService.deleteRule(ruleId)
      await loadData()
    } catch (error) {
      console.error('Failed to delete rule:', error)
      toast.error('删除规则失败')
    } finally {
      setLoading(false)
    }
  }

  const handleTestModeration = async () => {
    if (!testContent.trim()) {
      toast.error('请输入测试内容')
      return
    }

    setLoading(true)
    try {
      const result = await contentModerationService.moderateContent(
        testContent,
        'message',
        'test_user',
        'test_org',
        { test: true }
      )
      setTestResult(result)
    } catch (error) {
      console.error('Failed to test moderation:', error)
      toast.error('测试失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateConfig = async () => {
    setLoading(true)
    try {
      await contentModerationService.updateConfig(tempConfig)
      await loadData()
      setShowConfigModal(false)
      toast.success('配置已更新')
    } catch (error) {
      console.error('Failed to update config:', error)
      toast.error('更新配置失败')
    } finally {
      setLoading(false)
    }
  }

  const resetRuleForm = () => {
    setRuleForm({
      name: '',
      description: '',
      category: 'safety',
      type: 'keyword',
      isActive: true,
      severity: 'medium',
      config: {},
      actions: [],
      whitelist: [],
      blacklist: []
    })
  }

  const openEditRuleModal = (rule: ModerationRule) => {
    setSelectedRule(rule)
    setRuleForm({
      name: rule.name,
      description: rule.description,
      category: rule.category,
      type: rule.type,
      isActive: rule.isActive,
      severity: rule.severity,
      config: rule.config,
      actions: rule.actions,
      whitelist: rule.whitelist,
      blacklist: rule.blacklist
    })
    setShowEditRuleModal(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'flagged':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'under_review':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'escalated':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safety':
        return <ShieldExclamationIcon className="h-4 w-4" />
      case 'policy':
        return <DocumentTextIcon className="h-4 w-4" />
      case 'quality':
        return <SparklesIcon className="h-4 w-4" />
      case 'privacy':
        return <LockClosedIcon className="h-4 w-4" />
      case 'spam':
        return <XMarkIcon className="h-4 w-4" />
      default:
        return <InformationCircleIcon className="h-4 w-4" />
    }
  }

  if (loading && !rules.length && !analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-500 dark:text-gray-400">加载内容审核数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            智能内容审核
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            AI驱动的内容审核系统，自动检测和处理不当内容
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowTestModerationModal(true)}
            variant="outline"
          >
            <BeakerIcon className="h-4 w-4 mr-2" />
            测试审核
          </Button>
          <Button
            onClick={() => setShowCreateRuleModal(true)}
            className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            新建规则
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总内容数</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analytics.totalContent.toLocaleString()}
                    </p>
                  </div>
                  <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">标记内容</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analytics.flaggedContent.toLocaleString()}
                    </p>
                  </div>
                  <FlagIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {analytics.totalContent > 0 ? ((analytics.flaggedContent / analytics.totalContent) * 100).toFixed(1) : 0}% 标记率
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">阻止内容</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analytics.blockedContent.toLocaleString()}
                    </p>
                  </div>
                  <XMarkIcon className="h-8 w-8 text-red-500" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {analytics.totalContent > 0 ? ((analytics.blockedContent / analytics.totalContent) * 100).toFixed(1) : 0}% 阻止率
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">平均响应时间</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analytics.averageResponseTime}ms
                    </p>
                  </div>
                  <ClockIcon className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Violations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" />
                  主要违规类型
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topViolations.slice(0, 5).map((violation, index) => (
                    <div key={violation.rule} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-xs font-medium text-red-600 dark:text-red-400">
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {violation.rule}
                        </span>
                      </div>
                      <Badge variant="secondary">{violation.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-blue-500" />
                  内容分类统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.contentByCategory).slice(0, 5).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getCategoryIcon(category)}
                        <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                          {category === 'safety' ? '安全' :
                           category === 'policy' ? '政策' :
                           category === 'quality' ? '质量' :
                           category === 'privacy' ? '隐私' :
                           category === 'spam' ? '垃圾' : category}
                        </span>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>最近审核活动</CardTitle>
              <CardDescription>最新的内容审核结果</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.slice(0, 10).map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => {
                      setSelectedResult(result)
                      setShowResultDetailsModal(true)
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(result.status)}>
                        {result.status === 'approved' ? '通过' :
                         result.status === 'flagged' ? '标记' :
                         result.status === 'blocked' ? '阻止' :
                         result.status === 'under_review' ? '审核中' : '升级'}
                      </Badge>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {result.content.length > 50 ? result.content.substring(0, 50) + '...' : result.content}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          触发规则: {result.triggeredRules.length} • 置信度: {(result.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {results.length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                    暂无审核记录
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              审核规则管理 ({rules.length})
            </h3>
            <Button
              onClick={() => setShowCreateRuleModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              新建规则
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rules.map((rule) => (
              <Card key={rule.id} className={rule.isActive ? '' : 'opacity-60'}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getCategoryIcon(rule.category)}
                        {rule.name}
                      </CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getSeverityColor(rule.severity)}>
                        {rule.severity === 'critical' ? '严重' :
                         rule.severity === 'high' ? '高' :
                         rule.severity === 'medium' ? '中' : '低'}
                      </Badge>
                      <Switch
                        checked={rule.isActive}
                        onChange={async (e) => {
                          await contentModerationService.updateRule(rule.id, { isActive: e.target.checked })
                          await loadData()
                        }}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">类型</span>
                      <Badge variant="secondary">
                        {rule.type === 'keyword' ? '关键词' :
                         rule.type === 'pattern' ? '正则' :
                         rule.type === 'ai_classifier' ? 'AI分类' :
                         rule.type === 'sentiment' ? '情感' :
                         rule.type === 'toxicity' ? '毒性' :
                         rule.type === 'pii' ? 'PII' : rule.type}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">动作</span>
                      <div className="flex gap-1">
                        {rule.actions.slice(0, 3).map((action, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {action.type === 'block' ? '阻止' :
                             action.type === 'flag' ? '标记' :
                             action.type === 'warn' ? '警告' :
                             action.type === 'review' ? '审核' :
                             action.type === 'replace' ? '替换' :
                             action.type === 'escalate' ? '升级' :
                             action.type === 'log' ? '记录' :
                             action.type === 'notify' ? '通知' : action.type}
                          </Badge>
                        ))}
                        {rule.actions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{rule.actions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">配置</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {rule.config.keywords?.length ? `${rule.config.keywords.length} 关键词` :
                         rule.config.patterns?.length ? `${rule.config.patterns.length} 模式` :
                         rule.config.threshold ? `阈值: ${rule.config.threshold}` : '基础配置'}
                      </span>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditRuleModal(rule)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {rules.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                暂无审核规则
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                创建您的第一个内容审核规则
              </p>
              <Button onClick={() => setShowCreateRuleModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                新建规则
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Results Tab */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>审核结果</CardTitle>
              <CardDescription>最近的内容审核结果详情</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => {
                      setSelectedResult(result)
                      setShowResultDetailsModal(true)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={getStatusColor(result.status)}>
                            {result.status === 'approved' ? '通过' :
                             result.status === 'flagged' ? '标记' :
                             result.status === 'blocked' ? '阻止' :
                             result.status === 'under_review' ? '审核中' : '升级'}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            置信度: {(result.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(result.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <p className="text-gray-900 dark:text-gray-100 mb-2">
                          {result.content.length > 200 ? result.content.substring(0, 200) + '...' : result.content}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>用户: {result.userId}</span>
                          <span>类型: {result.contentType}</span>
                          <span>触发规则: {result.triggeredRules.length}</span>
                          <span>应用动作: {result.appliedActions.length}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {result.triggeredRules.slice(0, 3).map((rule) => (
                          <Badge key={rule.ruleId} className={getSeverityColor(rule.severity)}>
                            {rule.ruleName}
                          </Badge>
                        ))}
                        {result.triggeredRules.length > 3 && (
                          <Badge variant="secondary">
                            +{result.triggeredRules.length - 3} 更多
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {results.length === 0 && (
                  <div className="text-center py-12">
                    <FlagIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      暂无审核结果
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      开始审核内容以查看结果
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Tab */}
      {activeTab === 'test' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BeakerIcon className="h-5 w-5 text-purple-500" />
                内容审核测试
              </CardTitle>
              <CardDescription>测试您的审核规则是否正常工作</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  测试内容
                </label>
                <Textarea
                  value={testContent}
                  onChange={(e) => setTestContent(e.target.value)}
                  placeholder="输入要测试的内容..."
                  rows={6}
                />
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleTestModeration}
                  disabled={!testContent.trim() || loading}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {loading ? '测试中...' : '开始测试'}
                </Button>
              </div>

              {testResult && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">测试结果</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900 dark:text-gray-100">审核状态</h5>
                          <Badge className={getStatusColor(testResult.status)}>
                            {testResult.status === 'approved' ? '通过' :
                             testResult.status === 'flagged' ? '标记' :
                             testResult.status === 'blocked' ? '阻止' :
                             testResult.status === 'under_review' ? '审核中' : '升级'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          置信度: {(testResult.confidence * 100).toFixed(1)}%
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">检测结果</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>毒性: </span>
                            <span>{(testResult.results.toxicity.score * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>安全: </span>
                            <span>{(testResult.results.safety.score * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>隐私: </span>
                            <span>{(testResult.results.privacy.score * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>质量: </span>
                            <span>{(testResult.results.quality.score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {testResult.triggeredRules.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                          触发规则 ({testResult.triggeredRules.length})
                        </h5>
                        <div className="space-y-2">
                          {testResult.triggeredRules.map((rule) => (
                            <div key={rule.ruleId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <span className="font-medium">{rule.ruleName}</span>
                              <div className="flex items-center gap-2">
                                <Badge className={getSeverityColor(rule.severity)}>
                                  {rule.severity}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {(rule.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {testResult.appliedActions.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                          应用动作 ({testResult.appliedActions.length})
                        </h5>
                        <div className="space-y-2">
                          {testResult.appliedActions.map((action, index) => (
                            <div key={index} className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline">{action.actionType}</Badge>
                                <span className={`text-xs ${action.success ? 'text-green-600' : 'text-red-600'}`}>
                                  {action.success ? '成功' : '失败'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {action.details}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'config' && config && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>自动审核配置</CardTitle>
              <CardDescription>配置AI模型和审核参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">启用自动审核</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">开启AI驱动的内容自动审核</p>
                </div>
                <Switch
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  审核强度
                </label>
                <Select
                  options={[
                    { value: 'conservative', label: '保守 - 更少误报' },
                    { value: 'balanced', label: '平衡 - 均衡处理' },
                    { value: 'aggressive', label: '激进 - 更严格审核' }
                  ]}
                  value={config.aggressiveness}
                  onChange={(value) => setConfig({ ...config, aggressiveness: value as any })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    自动通过阈值: {config.thresholds.autoApprove}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.thresholds.autoApprove}
                    onChange={(e) => setConfig({
                      ...config,
                      thresholds: { ...config.thresholds, autoApprove: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    自动阻止阈值: {config.thresholds.autoBlock}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.thresholds.autoBlock}
                    onChange={(e) => setConfig({
                      ...config,
                      thresholds: { ...config.thresholds, autoBlock: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  需要审核阈值: {config.thresholds.requireReview}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.thresholds.requireReview}
                  onChange={(e) => setConfig({
                    ...config,
                    thresholds: { ...config.thresholds, requireReview: parseFloat(e.target.value) }
                  })}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">实时处理</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">即时审核新内容</p>
                  </div>
                  <Switch
                    checked={config.realTimeProcessing}
                    onChange={(e) => setConfig({ ...config, realTimeProcessing: e.target.checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">批处理</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">定期批量处理</p>
                  </div>
                  <Switch
                    checked={config.batchProcessing.enabled}
                    onChange={(e) => setConfig({
                      ...config,
                      batchProcessing: { ...config.batchProcessing, enabled: e.target.checked }
                    })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => contentModerationService.updateConfig(config)}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  保存配置
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Rule Modal */}
      <Modal
        open={showCreateRuleModal}
        onClose={() => setShowCreateRuleModal(false)}
        title="创建审核规则"
        description="设置内容审核规则和动作"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                规则名称 *
              </label>
              <Input
                value={ruleForm.name || ''}
                onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入规则名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                类别
              </label>
              <Select
                options={categoryOptions}
                value={ruleForm.category || ''}
                onChange={(value) => setRuleForm(prev => ({ ...prev, category: value as any }))}
                placeholder="选择类别"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              描述 *
            </label>
            <Textarea
              value={ruleForm.description || ''}
              onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="描述此规则的用途"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                类型
              </label>
              <Select
                options={typeOptions}
                value={ruleForm.type || ''}
                onChange={(value) => setRuleForm(prev => ({ ...prev, type: value as any }))}
                placeholder="选择类型"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                严重性
              </label>
              <Select
                options={severityOptions}
                value={ruleForm.severity || ''}
                onChange={(value) => setRuleForm(prev => ({ ...prev, severity: value as any }))}
                placeholder="选择严重性"
              />
            </div>
          </div>

          {ruleForm.type === 'keyword' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                关键词 (用逗号分隔)
              </label>
              <Input
                placeholder="敏感词1, 敏感词2, 敏感词3"
                onChange={(e) => {
                  const keywords = e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                  setRuleForm(prev => ({
                    ...prev,
                    config: { ...prev.config, keywords }
                  }))
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Switch
              label="启用规则"
              checked={ruleForm.isActive || false}
              onChange={(e) => setRuleForm(prev => ({ ...prev, isActive: e.target.checked }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateRuleModal(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateRule}
              disabled={!ruleForm.name || !ruleForm.description || loading}
            >
              {loading ? '创建中...' : '创建规则'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Result Details Modal */}
      <Modal
        open={showResultDetailsModal}
        onClose={() => setShowResultDetailsModal(false)}
        title="审核结果详情"
        description={selectedResult?.id.slice(-8) || ''}
      >
        {selectedResult && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">内容</h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {selectedResult.content}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">状态</p>
                <Badge className={getStatusColor(selectedResult.status)}>
                  {selectedResult.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">置信度</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {(selectedResult.confidence * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">语言</p>
                <p className="text-gray-900 dark:text-gray-100">{selectedResult.language}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">时间</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {new Date(selectedResult.timestamp).toLocaleString()}
                </p>
              </div>
            </div>

            {selectedResult.triggeredRules.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">触发的规则</h4>
                <div className="space-y-2">
                  {selectedResult.triggeredRules.map((rule) => (
                    <div key={rule.ruleId} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {rule.ruleName}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(rule.severity)}>
                            {rule.severity}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {(rule.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      {rule.matchedContent.length > 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          匹配内容: {rule.matchedContent.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Test Moderation Modal */}
      <Modal
        open={showTestModerationModal}
        onClose={() => setShowTestModerationModal(false)}
        title="测试内容审核"
        description="输入内容测试审核规则"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              测试内容
            </label>
            <Textarea
              value={testContent}
              onChange={(e) => setTestContent(e.target.value)}
              placeholder="输入要测试的内容..."
              rows={6}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowTestModerationModal(false)}
            >
              取消
            </Button>
            <Button
              onClick={async () => {
                await handleTestModeration()
                setShowTestModerationModal(false)
              }}
              disabled={!testContent.trim() || loading}
            >
              {loading ? '测试中...' : '开始测试'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ContentModerationDashboard
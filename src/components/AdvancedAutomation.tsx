import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  PlusIcon,
  TrashIcon,
  CogIcon,
  ClockIcon,
  BoltIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  EnvelopeIcon,
  BellIcon,
  CalendarIcon,
  CloudIcon,
  CodeBracketIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface AutomationRule {
  id: string
  name: string
  description: string
  isActive: boolean
  trigger: Trigger
  conditions: Condition[]
  actions: Action[]
  lastRun?: number
  nextRun?: number
  runCount: number
  successRate: number
  createdAt: number
  tags: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: 'communication' | 'analysis' | 'content' | 'integration' | 'monitoring'
}

interface Trigger {
  type: 'time' | 'event' | 'condition' | 'webhook' | 'manual'
  config: {
    [key: string]: any
  }
  name: string
  icon: string
}

interface Condition {
  id: string
  type: 'text_contains' | 'user_property' | 'time_range' | 'message_count' | 'custom'
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

interface Action {
  id: string
  type: 'send_message' | 'api_call' | 'email' | 'notification' | 'data_export' | 'ai_analysis' | 'custom'
  config: {
    [key: string]: any
  }
  name: string
  icon: string
  delay?: number
}

interface WorkflowExecution {
  id: string
  ruleId: string
  status: 'running' | 'completed' | 'failed' | 'pending'
  startTime: number
  endTime?: number
  result?: any
  error?: string
  logs: string[]
}

const AdvancedAutomation: React.FC = () => {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([])
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [activeTab, setActiveTab] = useState<'rules' | 'executions' | 'templates'>('rules')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const triggerTypes = [
    { type: 'time', name: '定时触发', icon: '⏰', description: '按计划执行工作流' },
    { type: 'event', name: '事件触发', icon: '⚡', description: '响应特定事件' },
    { type: 'condition', name: '条件触发', icon: '🎯', description: '满足条件时执行' },
    { type: 'webhook', name: 'Webhook', icon: '🔗', description: '外部API触发' },
    { type: 'manual', name: '手动触发', icon: '👆', description: '手动执行工作流' }
  ]

  const actionTypes = [
    { type: 'send_message', name: '发送消息', icon: '💬', description: '自动发送AI回复' },
    { type: 'api_call', name: 'API调用', icon: '🔌', description: '调用外部API接口' },
    { type: 'email', name: '发送邮件', icon: '📧', description: '发送邮件通知' },
    { type: 'notification', name: '系统通知', icon: '🔔', description: '推送系统通知' },
    { type: 'data_export', name: '数据导出', icon: '📊', description: '导出数据报告' },
    { type: 'ai_analysis', name: 'AI分析', icon: '🧠', description: '执行AI分析任务' },
    { type: 'custom', name: '自定义脚本', icon: '⚙️', description: '运行自定义代码' }
  ]

  const categories = [
    { id: 'all', name: '全部', icon: '📋' },
    { id: 'communication', name: '通信', icon: '💬' },
    { id: 'analysis', name: '分析', icon: '📊' },
    { id: 'content', name: '内容', icon: '📄' },
    { id: 'integration', name: '集成', icon: '🔗' },
    { id: 'monitoring', name: '监控', icon: '👁️' }
  ]

  const mockRules: AutomationRule[] = [
    {
      id: 'rule-1',
      name: '智能客服自动回复',
      description: '检测到特定关键词时自动回复相关信息',
      isActive: true,
      trigger: {
        type: 'event',
        config: { event: 'message_received' },
        name: '收到消息',
        icon: '💬'
      },
      conditions: [
        {
          id: 'cond-1',
          type: 'text_contains',
          field: 'message_content',
          operator: 'contains',
          value: ['帮助', '价格', '功能'],
          logicalOperator: 'OR'
        }
      ],
      actions: [
        {
          id: 'action-1',
          type: 'send_message',
          config: {
            template: '感谢您的咨询！我是AI助手，正在为您准备相关信息...',
            delay: 2000
          },
          name: '发送回复',
          icon: '💬'
        },
        {
          id: 'action-2',
          type: 'ai_analysis',
          config: {
            prompt: '分析用户问题并提供专业回答',
            model: 'gpt-4'
          },
          name: 'AI分析',
          icon: '🧠',
          delay: 5000
        }
      ],
      lastRun: Date.now() - 3600000,
      runCount: 156,
      successRate: 98.7,
      createdAt: Date.now() - 86400000 * 7,
      tags: ['客服', '自动回复', 'AI'],
      priority: 'high',
      category: 'communication'
    },
    {
      id: 'rule-2',
      name: '每日数据分析报告',
      description: '每天定时生成对话数据分析报告并发送',
      isActive: true,
      trigger: {
        type: 'time',
        config: {
          schedule: 'daily',
          time: '09:00',
          timezone: 'Asia/Shanghai'
        },
        name: '每日9点',
        icon: '⏰'
      },
      conditions: [],
      actions: [
        {
          id: 'action-3',
          type: 'data_export',
          config: {
            type: 'conversation_stats',
            format: 'pdf',
            period: 'yesterday'
          },
          name: '生成报告',
          icon: '📊'
        },
        {
          id: 'action-4',
          type: 'email',
          config: {
            to: 'admin@example.com',
            subject: '每日AI对话数据报告',
            template: 'daily_report'
          },
          name: '发送邮件',
          icon: '📧',
          delay: 30000
        }
      ],
      lastRun: Date.now() - 3600000 * 15,
      nextRun: Date.now() + 3600000 * 9,
      runCount: 45,
      successRate: 100,
      createdAt: Date.now() - 86400000 * 30,
      tags: ['报告', '数据分析', '自动化'],
      priority: 'medium',
      category: 'analysis'
    },
    {
      id: 'rule-3',
      name: '异常对话监控',
      description: '监控异常对话模式并及时报警',
      isActive: true,
      trigger: {
        type: 'condition',
        config: {
          condition: 'error_rate_threshold',
          threshold: 5
        },
        name: '错误率超阈值',
        icon: '⚠️'
      },
      conditions: [
        {
          id: 'cond-2',
          type: 'message_count',
          field: 'error_messages',
          operator: 'greater_than',
          value: 10
        }
      ],
      actions: [
        {
          id: 'action-5',
          type: 'notification',
          config: {
            level: 'critical',
            title: '异常对话检测',
            message: '检测到异常对话模式，请及时处理'
          },
          name: '发送警报',
          icon: '🚨'
        },
        {
          id: 'action-6',
          type: 'api_call',
          config: {
            url: 'https://api.monitoring.com/alert',
            method: 'POST',
            headers: { 'Authorization': 'Bearer xxx' }
          },
          name: '调用监控API',
          icon: '🔌'
        }
      ],
      runCount: 8,
      successRate: 87.5,
      createdAt: Date.now() - 86400000 * 14,
      tags: ['监控', '报警', '异常检测'],
      priority: 'critical',
      category: 'monitoring'
    }
  ]

  useEffect(() => {
    setAutomationRules(mockRules)

    // 模拟执行记录
    const mockExecutions: WorkflowExecution[] = [
      {
        id: 'exec-1',
        ruleId: 'rule-1',
        status: 'completed',
        startTime: Date.now() - 3600000,
        endTime: Date.now() - 3600000 + 15000,
        result: { messagesProcessed: 5, responseSent: true },
        logs: ['开始执行自动回复', '检测到关键词: 帮助', '生成AI回复', '发送回复成功']
      },
      {
        id: 'exec-2',
        ruleId: 'rule-2',
        status: 'running',
        startTime: Date.now() - 1800000,
        logs: ['开始生成报告', '收集昨日数据', '分析对话统计']
      },
      {
        id: 'exec-3',
        ruleId: 'rule-3',
        status: 'failed',
        startTime: Date.now() - 900000,
        endTime: Date.now() - 870000,
        error: 'API调用失败: 网络超时',
        logs: ['检测到异常条件', '尝试发送警报', 'API调用失败']
      }
    ]
    setExecutions(mockExecutions)
  }, [])

  const handleToggleRule = (ruleId: string) => {
    setAutomationRules(prev =>
      prev.map(rule =>
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    )
  }

  const handleDeleteRule = (ruleId: string) => {
    setAutomationRules(prev => prev.filter(rule => rule.id !== ruleId))
  }

  const handleRunRule = async (ruleId: string) => {
    const rule = automationRules.find(r => r.id === ruleId)
    if (!rule) return

    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}`,
      ruleId,
      status: 'running',
      startTime: Date.now(),
      logs: [`开始执行工作流: ${rule.name}`]
    }

    setExecutions(prev => [execution, ...prev])

    // 模拟执行过程
    setTimeout(() => {
      setExecutions(prev =>
        prev.map(exec =>
          exec.id === execution.id
            ? {
                ...exec,
                status: 'completed',
                endTime: Date.now(),
                result: { success: true },
                logs: [...exec.logs, '执行完成']
              }
            : exec
        )
      )

      // 更新规则统计
      setAutomationRules(prev =>
        prev.map(rule =>
          rule.id === ruleId
            ? { ...rule, runCount: rule.runCount + 1, lastRun: Date.now() }
            : rule
        )
      )
    }, 3000)
  }

  const getFilteredRules = () => {
    return automationRules.filter(rule => {
      const matchesSearch = searchQuery === '' ||
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesCategory = filterCategory === 'all' || rule.category === filterCategory

      return matchesSearch && matchesCategory
    })
  }

  const RuleCard: React.FC<{ rule: AutomationRule }> = ({ rule }) => {
    const priorityColors = {
      low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    }

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{rule.trigger.icon}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {rule.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {rule.description}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[rule.priority]}`}>
              {rule.priority.toUpperCase()}
            </span>
            <div className={`w-3 h-3 rounded-full ${rule.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {rule.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">触发器:</span>
            <div className="font-medium">{rule.trigger.name}</div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">动作数:</span>
            <div className="font-medium">{rule.actions.length} 个</div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">执行次数:</span>
            <div className="font-medium">{rule.runCount}</div>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">成功率:</span>
            <div className="font-medium">{rule.successRate}%</div>
          </div>
        </div>

        {rule.lastRun && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            上次执行: {new Date(rule.lastRun).toLocaleString()}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleToggleRule(rule.id)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              rule.isActive
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {rule.isActive ? '已启用' : '已停用'}
          </button>

          <button
            onClick={() => handleRunRule(rule.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={!rule.isActive}
          >
            立即执行
          </button>

          <button
            onClick={() => setSelectedRule(rule)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <CogIcon className="w-5 h-5 text-gray-500" />
          </button>

          <button
            onClick={() => handleDeleteRule(rule.id)}
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded-lg transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    )
  }

  const ExecutionCard: React.FC<{ execution: WorkflowExecution }> = ({ execution }) => {
    const rule = automationRules.find(r => r.id === execution.ruleId)
    const statusColors = {
      running: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      pending: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }

    const StatusIcon = {
      running: PlayIcon,
      completed: CheckCircleIcon,
      failed: ExclamationTriangleIcon,
      pending: ClockIcon
    }[execution.status]

    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <StatusIcon className="w-5 h-5 text-gray-500" />
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">
                {rule?.name || '未知规则'}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(execution.startTime).toLocaleString()}
              </p>
            </div>
          </div>

          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[execution.status]}`}>
            {execution.status.toUpperCase()}
          </span>
        </div>

        {execution.endTime && (
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            耗时: {Math.round((execution.endTime - execution.startTime) / 1000)}秒
          </div>
        )}

        {execution.error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-2 rounded text-sm mb-2">
            错误: {execution.error}
          </div>
        )}

        <div className="space-y-1">
          {execution.logs.map((log, index) => (
            <div key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <span>{log}</span>
            </div>
          ))}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            高级自动化工作流
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            创建智能工作流，自动化重复任务，提升效率
          </p>
        </div>

        {/* 标签页导航 */}
        <div className="flex space-x-1 mb-6 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
          {[
            { id: 'rules', name: '自动化规则', icon: BoltIcon },
            { id: 'executions', name: '执行记录', icon: ChartBarIcon },
            { id: 'templates', name: '模板库', icon: DocumentTextIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* 搜索和筛选 */}
        {activeTab === 'rules' && (
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索自动化规则..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                <span>创建规则</span>
              </button>
            </div>
          </div>
        )}

        {/* 内容区域 */}
        <AnimatePresence mode="wait">
          {activeTab === 'rules' && (
            <motion.div
              key="rules"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {getFilteredRules().length === 0 ? (
                <div className="text-center py-12">
                  <BoltIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchQuery || filterCategory !== 'all' ? '未找到匹配的规则' : '暂无自动化规则'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchQuery || filterCategory !== 'all'
                      ? '尝试调整搜索条件或筛选器'
                      : '创建你的第一个自动化工作流'
                    }
                  </p>
                  {!searchQuery && filterCategory === 'all' && (
                    <button
                      onClick={() => setIsCreating(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      创建规则
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {getFilteredRules().map((rule) => (
                    <RuleCard key={rule.id} rule={rule} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'executions' && (
            <motion.div
              key="executions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  执行统计
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{executions.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">总执行次数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {executions.filter(e => e.status === 'completed').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">成功</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {executions.filter(e => e.status === 'failed').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">失败</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {executions.filter(e => e.status === 'running').length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">运行中</div>
                  </div>
                </div>
              </div>

              {executions.length === 0 ? (
                <div className="text-center py-12">
                  <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    暂无执行记录
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    当自动化规则运行时，执行记录将显示在这里
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {executions.map((execution) => (
                    <ExecutionCard key={execution.id} execution={execution} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[
                {
                  name: '智能客服助手',
                  description: '自动识别用户问题并提供智能回复',
                  category: '客服',
                  triggers: ['消息接收'],
                  actions: ['AI分析', '自动回复'],
                  icon: '🤖'
                },
                {
                  name: '数据监控报警',
                  description: '监控系统指标，异常时及时通知',
                  category: '监控',
                  triggers: ['条件触发'],
                  actions: ['发送通知', 'API调用'],
                  icon: '📊'
                },
                {
                  name: '定时报告生成',
                  description: '定期生成业务报告并自动发送',
                  category: '报告',
                  triggers: ['定时执行'],
                  actions: ['数据导出', '邮件发送'],
                  icon: '📈'
                },
                {
                  name: '内容自动审核',
                  description: '自动检测和过滤不当内容',
                  category: '安全',
                  triggers: ['内容提交'],
                  actions: ['AI审核', '标记处理'],
                  icon: '🛡️'
                },
                {
                  name: '用户行为分析',
                  description: '分析用户使用模式并优化体验',
                  category: '分析',
                  triggers: ['用户操作'],
                  actions: ['数据收集', '行为分析'],
                  icon: '👥'
                },
                {
                  name: 'API集成同步',
                  description: '与外部系统保持数据同步',
                  category: '集成',
                  triggers: ['数据变更'],
                  actions: ['API同步', '状态更新'],
                  icon: '🔄'
                }
              ].map((template, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl group-hover:scale-110 transition-transform">
                      {template.icon}
                    </div>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                      {template.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {template.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">触发器:</span>
                      <div className="flex flex-wrap gap-1">
                        {template.triggers.map((trigger) => (
                          <span
                            key={trigger}
                            className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded"
                          >
                            {trigger}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">动作:</span>
                      <div className="flex flex-wrap gap-1">
                        {template.actions.map((action) => (
                          <span
                            key={action}
                            className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded"
                          >
                            {action}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors group-hover:bg-blue-700">
                    使用模板
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 规则详情/创建模态框 */}
        <AnimatePresence>
          {(selectedRule || isCreating) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => {
                setSelectedRule(null)
                setIsCreating(false)
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {isCreating ? '创建自动化规则' : '编辑规则'}
                    </h2>
                    <button
                      onClick={() => {
                        setSelectedRule(null)
                        setIsCreating(false)
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* 基本信息 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        基本信息
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            规则名称
                          </label>
                          <input
                            type="text"
                            placeholder="输入规则名称"
                            defaultValue={selectedRule?.name || ''}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            优先级
                          </label>
                          <select
                            defaultValue={selectedRule?.priority || 'medium'}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="low">低</option>
                            <option value="medium">中</option>
                            <option value="high">高</option>
                            <option value="critical">紧急</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          描述
                        </label>
                        <textarea
                          placeholder="描述这个自动化规则的功能和用途"
                          defaultValue={selectedRule?.description || ''}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* 触发器配置 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        触发器
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {triggerTypes.map((trigger) => (
                          <div
                            key={trigger.type}
                            className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-xl">{trigger.icon}</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {trigger.name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {trigger.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 动作配置 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        动作
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {actionTypes.map((action) => (
                          <div
                            key={action.type}
                            className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-xl">{action.icon}</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {action.name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {action.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => {
                          setSelectedRule(null)
                          setIsCreating(false)
                        }}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                      >
                        取消
                      </button>
                      <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        {isCreating ? '创建规则' : '保存更改'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AdvancedAutomation
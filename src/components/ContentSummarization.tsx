import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { Button, Input } from './ui'
import { cn } from '@/utils'
import {
  DocumentTextIcon,
  SparklesIcon,
  ClockIcon,
  TagIcon,
  BookmarkIcon,
  ShareIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BoltIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

interface SummaryConfig {
  length: 'brief' | 'medium' | 'detailed'
  style: 'bullet' | 'paragraph' | 'structured' | 'timeline'
  includeKeywords: boolean
  includeQuestions: boolean
  includeActionItems: boolean
  includeReferences: boolean
  language: 'zh-CN' | 'en-US' | 'auto'
  tone: 'formal' | 'casual' | 'technical' | 'creative'
}

interface SummaryResult {
  id: string
  conversationId: string
  title: string
  content: string
  keywords: string[]
  keyPoints: string[]
  actionItems: string[]
  questions: string[]
  references: string[]
  statistics: {
    originalLength: number
    summaryLength: number
    compressionRatio: number
    processingTime: number
    confidence: number
  }
  metadata: {
    createdAt: number
    config: SummaryConfig
    version: string
  }
}

interface ContentSummarizationProps {
  className?: string
  conversationId?: string
}

const ContentSummarization: React.FC<ContentSummarizationProps> = ({
  className,
  conversationId
}) => {
  const { conversations } = useAppStore()
  const [summaries, setSummaries] = useState<SummaryResult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState(conversationId || '')
  const [config, setConfig] = useState<SummaryConfig>({
    length: 'medium',
    style: 'bullet',
    includeKeywords: true,
    includeQuestions: false,
    includeActionItems: true,
    includeReferences: false,
    language: 'zh-CN',
    tone: 'formal'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'recent' | 'starred'>('all')
  const [activeSummary, setActiveSummary] = useState<SummaryResult | null>(null)

  // Load existing summaries
  useEffect(() => {
    const mockSummaries: SummaryResult[] = [
      {
        id: 'summary-1',
        conversationId: conversations[0]?.id || '',
        title: 'AI产品功能讨论总结',
        content: `本次对话主要围绕AI产品的新功能开发展开深入讨论：

**核心功能点：**
• 语音交互系统的优化，包括多语言支持和实时响应
• 智能推荐算法的改进，提升个性化体验
• 数据分析功能的扩展，增加可视化报表

**技术方案：**
• 采用最新的语音识别技术，支持连续对话模式
• 实现基于用户行为的机器学习推荐系统
• 集成多种图表类型，支持自定义仪表板

**预期效果：**
• 用户体验提升30%以上
• 功能使用率预计增长50%
• 用户留存率目标达到85%`,
        keywords: ['AI产品', '语音交互', '智能推荐', '数据分析', '用户体验'],
        keyPoints: [
          '语音交互系统需要支持多语言和连续对话',
          '推荐算法要基于用户行为数据进行个性化',
          '数据可视化功能需要灵活的自定义选项',
          '目标是显著提升用户体验和留存率'
        ],
        actionItems: [
          '技术团队开始语音模块的原型开发',
          '产品经理整理详细的需求文档',
          '设计团队准备新功能的UI/UX设计',
          '下周安排用户调研和反馈收集'
        ],
        questions: [
          '语音识别的准确率能否达到95%以上？',
          '推荐算法需要多长时间的学习周期？',
          '数据可视化模块的开发成本是多少？'
        ],
        references: [
          'conversation-msg-12', 'conversation-msg-25', 'conversation-msg-38'
        ],
        statistics: {
          originalLength: 2450,
          summaryLength: 380,
          compressionRatio: 84.5,
          processingTime: 1.2,
          confidence: 0.92
        },
        metadata: {
          createdAt: Date.now() - 3600000,
          config,
          version: '1.0'
        }
      },
      {
        id: 'summary-2',
        conversationId: conversations[1]?.id || '',
        title: '技术架构设计讨论',
        content: `技术团队针对新系统架构进行了全面的技术评估和讨论。

**架构特点：**
• 微服务架构设计，提高系统可扩展性
• 容器化部署，支持弹性伸缩
• API网关统一管理，提升安全性

**技术选型：**
• 后端采用Node.js + TypeScript
• 数据库使用PostgreSQL + Redis
• 前端基于React + Next.js

**部署方案：**
• 使用Docker容器化部署
• Kubernetes集群管理
• CI/CD自动化流水线`,
        keywords: ['技术架构', '微服务', '容器化', 'API网关', '自动化部署'],
        keyPoints: [
          '采用微服务架构提升系统可维护性',
          '容器化部署方案提高开发效率',
          '技术栈选择注重性能和开发体验',
          '自动化部署减少人工操作风险'
        ],
        actionItems: [
          '架构师准备详细的技术方案文档',
          '开发团队评估技术栈学习成本',
          '运维团队准备容器化环境',
          '制定开发和测试时间表'
        ],
        questions: [],
        references: [],
        statistics: {
          originalLength: 1890,
          summaryLength: 290,
          compressionRatio: 84.7,
          processingTime: 0.8,
          confidence: 0.89
        },
        metadata: {
          createdAt: Date.now() - 7200000,
          config,
          version: '1.0'
        }
      }
    ]
    setSummaries(mockSummaries)
  }, [conversations, config])

  // Generate summary
  const generateSummary = async () => {
    if (!selectedConversation) return

    setIsGenerating(true)

    // Simulate AI processing
    setTimeout(() => {
      const conversation = conversations.find(c => c.id === selectedConversation)
      if (!conversation) {
        setIsGenerating(false)
        return
      }

      const mockSummary: SummaryResult = {
        id: `summary-${Date.now()}`,
        conversationId: selectedConversation,
        title: `${conversation.title} - 智能总结`,
        content: generateMockSummary(conversation, config),
        keywords: extractKeywords(conversation),
        keyPoints: generateKeyPoints(conversation, config),
        actionItems: config.includeActionItems ? generateActionItems(conversation) : [],
        questions: config.includeQuestions ? generateQuestions(conversation) : [],
        references: config.includeReferences ? generateReferences(conversation) : [],
        statistics: {
          originalLength: conversation.messages.reduce((sum, msg) => sum + msg.content.length, 0),
          summaryLength: 350,
          compressionRatio: 85.2,
          processingTime: Math.random() * 2 + 0.5,
          confidence: Math.random() * 0.2 + 0.8
        },
        metadata: {
          createdAt: Date.now(),
          config: { ...config },
          version: '1.0'
        }
      }

      setSummaries(prev => [mockSummary, ...prev])
      setActiveSummary(mockSummary)
      setIsGenerating(false)
    }, 2000)
  }

  // Mock content generation functions
  const generateMockSummary = (conversation: any, config: SummaryConfig) => {
    const styles = {
      bullet: `**对话要点：**
• 讨论了${conversation.model}模型的性能表现
• 分析了用户体验优化的具体方案
• 确定了下一步的开发重点和时间安排
• 评估了技术实现的可行性和成本

**主要结论：**
• 当前方案技术可行，建议继续推进
• 需要增加用户测试环节确保质量
• 预计开发周期为2-3个月`,

      paragraph: `本次对话围绕${conversation.model}模型的应用和优化展开。团队详细讨论了用户体验改进方案，包括界面优化、功能增强和性能提升等方面。经过充分的技术评估，确认当前方案具有很好的可行性，建议按计划推进开发。同时，为了确保最终产品质量，建议在开发过程中增加更多的用户测试环节，预计整个项目的开发周期为2-3个月。`,

      structured: `## 对话总结

### 讨论主题
- ${conversation.model}模型性能优化
- 用户体验提升方案
- 技术实现可行性分析

### 关键决策
1. **技术方案确认**：采用当前提出的优化方案
2. **开发计划**：预计2-3个月完成开发
3. **质量保证**：增加用户测试环节

### 后续行动
- 制定详细的开发时间表
- 准备用户测试方案
- 开始原型开发`,

      timeline: `**时间线总结：**

**第1阶段（当前）：**
- 完成技术方案评估
- 确定开发可行性

**第2阶段（未来2周）：**
- 制定详细开发计划
- 开始原型设计

**第3阶段（未来1-2个月）：**
- 核心功能开发
- 用户测试收集反馈

**第4阶段（未来2-3个月）：**
- 功能完善和优化
- 准备正式发布`
    }

    return styles[config.style] || styles.bullet
  }

  const extractKeywords = (conversation: any): string[] => {
    return ['AI模型', '用户体验', '性能优化', '技术方案', '开发计划']
  }

  const generateKeyPoints = (conversation: any, config: SummaryConfig): string[] => {
    return [
      `${conversation.model}模型的性能表现良好`,
      '用户体验优化方案获得团队认可',
      '技术实现方案具有可行性',
      '预计开发周期为2-3个月',
      '需要加强用户测试环节'
    ]
  }

  const generateActionItems = (conversation: any): string[] => {
    return [
      '制定详细的项目开发时间表',
      '准备用户体验测试方案',
      '开始技术原型开发工作',
      '组织下次进度评审会议'
    ]
  }

  const generateQuestions = (conversation: any): string[] => {
    return [
      '如何确保用户测试的有效性？',
      '开发过程中遇到技术难题怎么办？',
      '项目预算是否能够支撑完整开发？'
    ]
  }

  const generateReferences = (conversation: any): string[] => {
    return conversation.messages.slice(0, 3).map((msg: any) => msg.id)
  }

  const filteredSummaries = summaries.filter(summary => {
    const matchesSearch = searchTerm === '' ||
      summary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesFilter = filterBy === 'all' ||
      (filterBy === 'recent' && Date.now() - summary.metadata.createdAt < 86400000)

    return matchesSearch && matchesFilter
  })

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    // Would show toast notification in real implementation
    console.log('Content copied to clipboard')
  }

  const exportSummary = (summary: SummaryResult) => {
    const exportData = {
      ...summary,
      exportedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `summary-${summary.title.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">智能内容总结</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI驱动的对话内容总结和关键信息提取</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{summaries.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">总结数量</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {summaries.length > 0 ? Math.round(summaries.reduce((avg, s) => avg + s.statistics.compressionRatio, 0) / summaries.length) : 0}%
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">平均压缩率</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {summaries.length > 0 ? (summaries.reduce((avg, s) => avg + s.statistics.processingTime, 0) / summaries.length).toFixed(1) : 0}s
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">平均处理时间</div>
          </div>
        </div>
      </div>

      {/* Generation Panel */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">生成新总结</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Basic Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                选择对话
              </label>
              <select
                value={selectedConversation}
                onChange={(e) => setSelectedConversation(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">请选择对话</option>
                {conversations.map(conv => (
                  <option key={conv.id} value={conv.id}>
                    {conv.title} ({conv.messages.length} 条消息)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  总结长度
                </label>
                <select
                  value={config.length}
                  onChange={(e) => setConfig(prev => ({ ...prev, length: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="brief">简短</option>
                  <option value="medium">中等</option>
                  <option value="detailed">详细</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  总结风格
                </label>
                <select
                  value={config.style}
                  onChange={(e) => setConfig(prev => ({ ...prev, style: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="bullet">要点列表</option>
                  <option value="paragraph">段落形式</option>
                  <option value="structured">结构化</option>
                  <option value="timeline">时间线</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Advanced Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                包含内容
              </label>
              <div className="space-y-2">
                {[
                  { key: 'includeKeywords', label: '关键词提取' },
                  { key: 'includeQuestions', label: '问题总结' },
                  { key: 'includeActionItems', label: '行动项目' },
                  { key: 'includeReferences', label: '引用链接' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={config[key as keyof SummaryConfig] as boolean}
                      onChange={(e) => setConfig(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  语言
                </label>
                <select
                  value={config.language}
                  onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="zh-CN">中文</option>
                  <option value="en-US">英文</option>
                  <option value="auto">自动检测</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  语调风格
                </label>
                <select
                  value={config.tone}
                  onChange={(e) => setConfig(prev => ({ ...prev, tone: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="formal">正式</option>
                  <option value="casual">随意</option>
                  <option value="technical">技术性</option>
                  <option value="creative">创意性</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            onClick={generateSummary}
            disabled={!selectedConversation || isGenerating}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                生成中...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <SparklesIcon className="h-4 w-4" />
                生成智能总结
              </div>
            )}
          </Button>

          <Button variant="outline">
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            高级设置
          </Button>
        </div>
      </div>

      {/* Summaries List */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">历史总结</h3>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索总结..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">全部</option>
              <option value="recent">最近</option>
              <option value="starred">收藏</option>
            </select>
          </div>
        </div>

        {filteredSummaries.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              暂无总结记录
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              选择一个对话开始生成智能总结
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSummaries.map((summary) => (
              <div
                key={summary.id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {summary.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>{new Date(summary.metadata.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ChartBarIcon className="h-4 w-4" />
                        <span>压缩率 {summary.statistics.compressionRatio.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BoltIcon className="h-4 w-4" />
                        <span>置信度 {(summary.statistics.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(summary.content)}
                      title="复制内容"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => exportSummary(summary)}
                      title="导出总结"
                    >
                      <ShareIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveSummary(activeSummary?.id === summary.id ? null : summary)}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Keywords */}
                {summary.keywords.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TagIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">关键词</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {summary.keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary Content */}
                <div className="prose dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {activeSummary?.id === summary.id ? summary.content : summary.content.slice(0, 200) + '...'}
                  </div>
                </div>

                {/* Expanded Content */}
                {activeSummary?.id === summary.id && (
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Key Points */}
                      {summary.keyPoints.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">关键要点</h5>
                          <ul className="space-y-2">
                            {summary.keyPoints.map((point, index) => (
                              <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Items */}
                      {summary.actionItems.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">行动项目</h5>
                          <ul className="space-y-2">
                            {summary.actionItems.map((item, index) => (
                              <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Questions */}
                      {summary.questions.length > 0 && (
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">待解决问题</h5>
                          <ul className="space-y-2">
                            {summary.questions.map((question, index) => (
                              <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                                <span className="text-blue-500 font-bold flex-shrink-0">?</span>
                                {question}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Statistics */}
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">处理统计</h5>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <div className="text-gray-500">原始长度</div>
                            <div className="font-medium">{summary.statistics.originalLength.toLocaleString()} 字符</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <div className="text-gray-500">总结长度</div>
                            <div className="font-medium">{summary.statistics.summaryLength.toLocaleString()} 字符</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <div className="text-gray-500">处理时间</div>
                            <div className="font-medium">{summary.statistics.processingTime.toFixed(1)}秒</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <div className="text-gray-500">置信度</div>
                            <div className="font-medium">{(summary.statistics.confidence * 100).toFixed(0)}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ContentSummarization
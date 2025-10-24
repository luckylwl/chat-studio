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
import conversationIntelligenceService, {
  ConversationInsight,
  AnalyticsData,
  ConversationPattern,
  AIModelConfig,
  SmartReply
} from '@/services/conversationIntelligenceService'
import {
  ChartBarIcon,
  CpuChipIcon,
  EyeIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
  HeartIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  CogIcon,
  DocumentTextIcon,
  LightBulbIcon,
  ClockIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

const ConversationIntelligenceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [insights, setInsights] = useState<ConversationInsight[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [patterns, setPatterns] = useState<ConversationPattern[]>([])
  const [config, setConfig] = useState<AIModelConfig | null>(null)
  const [loading, setLoading] = useState(false)

  // Modal states
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [showInsightDetails, setShowInsightDetails] = useState<ConversationInsight | null>(null)
  const [showSmartReplies, setShowSmartReplies] = useState<SmartReply[]>([])

  // Form states
  const [analyzeText, setAnalyzeText] = useState('')
  const [tempConfig, setTempConfig] = useState<Partial<AIModelConfig>>({})

  const tabs = [
    { id: 'overview', name: '概览', icon: <ChartBarIcon className="h-5 w-5" /> },
    { id: 'insights', name: '洞察分析', icon: <BrainIcon className="h-5 w-5" /> },
    { id: 'patterns', name: '模式识别', icon: <EyeIcon className="h-5 w-5" /> },
    { id: 'smart-replies', name: '智能回复', icon: <SparklesIcon className="h-5 w-5" /> },
    { id: 'quality', name: '质量评估', icon: <CheckCircleIcon className="h-5 w-5" /> },
    { id: 'config', name: '配置', icon: <AdjustmentsHorizontalIcon className="h-5 w-5" /> }
  ]

  useEffect(() => {
    loadData()

    // Listen for service events
    const handleInsightGenerated = (insight: ConversationInsight) => {
      setInsights(prev => [insight, ...prev])
      toast.success('新的对话洞察已生成')
    }

    conversationIntelligenceService.on('insightGenerated', handleInsightGenerated)

    return () => {
      conversationIntelligenceService.off('insightGenerated', handleInsightGenerated)
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [insightsData, analyticsData, patternsData, configData] = await Promise.all([
        conversationIntelligenceService.getInsights(),
        conversationIntelligenceService.getAnalytics(),
        conversationIntelligenceService.getPatterns(),
        conversationIntelligenceService.getConfig()
      ])

      setInsights(insightsData)
      setAnalytics(analyticsData)
      setPatterns(patternsData)
      setConfig(configData)
    } catch (error) {
      console.error('Failed to load conversation intelligence data:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyzeConversation = async () => {
    if (!analyzeText.trim()) {
      toast.error('请输入对话内容')
      return
    }

    setLoading(true)
    try {
      const messages = [
        { id: '1', text: analyzeText, role: 'user', timestamp: Date.now() }
      ]

      const insight = await conversationIntelligenceService.analyzeConversation(
        `manual_${Date.now()}`,
        messages
      )

      setShowInsightDetails(insight)
      setAnalyzeText('')
      setShowAnalyzeModal(false)
      await loadData()
    } catch (error) {
      console.error('Failed to analyze conversation:', error)
      toast.error('分析失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateConfig = async () => {
    setLoading(true)
    try {
      await conversationIntelligenceService.updateConfig(tempConfig)
      await loadData()
      setShowConfigModal(false)
      setTempConfig({})
      toast.success('配置已更新')
    } catch (error) {
      console.error('Failed to update config:', error)
      toast.error('更新配置失败')
    } finally {
      setLoading(false)
    }
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <FaceSmileIcon className="h-5 w-5 text-green-500" />
      case 'negative':
        return <FaceFrownIcon className="h-5 w-5 text-red-500" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600'
    if (score >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-500 dark:text-gray-400">加载对话智能数据...</p>
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
            AI对话智能分析
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            深度分析对话内容，提供情感、意图、质量等多维度洞察
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAnalyzeModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <BrainIcon className="h-4 w-4 mr-2" />
            分析对话
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setTempConfig(config || {})
              setShowConfigModal(true)
            }}
          >
            <CogIcon className="h-4 w-4 mr-2" />
            配置
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Key Metrics */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总对话数</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analytics.totalConversations.toLocaleString()}
                  </p>
                </div>
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                累计分析的对话数量
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">平均情感</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {(analytics.averageSentiment * 100).toFixed(1)}%
                  </p>
                </div>
                <HeartIcon className={`h-8 w-8 ${analytics.averageSentiment > 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                整体情感倾向指数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">平均质量</p>
                  <p className={`text-2xl font-bold ${getQualityColor(analytics.averageQuality)}`}>
                    {(analytics.averageQuality * 100).toFixed(1)}%
                  </p>
                </div>
                <CheckCircleIcon className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                对话质量评分
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">响应时间</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {(analytics.responseTime / 1000).toFixed(1)}s
                  </p>
                </div>
                <ClockIcon className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                平均AI响应时间
              </p>
            </CardContent>
          </Card>

          {/* Top Topics */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-blue-500" />
                热门话题
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topTopics.slice(0, 5).map((topic, index) => (
                  <div key={topic.topic} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {topic.topic}
                      </span>
                    </div>
                    <Badge variant="secondary">{topic.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Common Intents */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LightBulbIcon className="h-5 w-5 text-yellow-500" />
                常见意图
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.commonIntents.slice(0, 5).map((intent, index) => (
                  <div key={intent.intent} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center text-xs font-medium text-yellow-600 dark:text-yellow-400">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {intent.intent.replace('_', ' ')}
                      </span>
                    </div>
                    <Badge variant="secondary">{intent.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {insights.slice(0, 9).map((insight) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="cursor-pointer"
                onClick={() => setShowInsightDetails(insight)}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        对话洞察 #{insight.id.slice(-8)}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(insight.sentiment.sentiment)}
                        <Badge className={getSentimentColor(insight.sentiment.sentiment)}>
                          {insight.sentiment.sentiment}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">主要话题</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {insight.topics.mainTopic}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">用户意图</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {insight.intent.intent.replace('_', ' ')}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">质量评分</p>
                        <p className={`text-sm font-bold ${getQualityColor(insight.quality.overallScore)}`}>
                          {(insight.quality.overallScore * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">消息数</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {insight.summary.messageCount}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {insights.length === 0 && (
            <div className="text-center py-12">
              <BrainIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                暂无对话洞察
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                开始分析对话以获得深度洞察
              </p>
              <Button onClick={() => setShowAnalyzeModal(true)}>
                <BrainIcon className="h-4 w-4 mr-2" />
                分析对话
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Patterns Tab */}
      {activeTab === 'patterns' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patterns.map((pattern) => (
              <Card key={pattern.id}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <EyeIcon className="h-4 w-4" />
                    {pattern.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">识别模式</p>
                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {pattern.pattern}
                    </code>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">出现频率</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {pattern.frequency} 次
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">类别</p>
                    <Badge
                      className={
                        pattern.category === 'escalation' ? 'bg-red-100 text-red-800' :
                        pattern.category === 'satisfaction' ? 'bg-green-100 text-green-800' :
                        pattern.category === 'confusion' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {pattern.category}
                    </Badge>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">示例</p>
                    <div className="space-y-1">
                      {pattern.examples.slice(0, 2).map((example, index) => (
                        <p key={index} className="text-xs text-gray-600 dark:text-gray-300 italic">
                          "{example}"
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {patterns.length === 0 && (
            <div className="text-center py-12">
              <EyeIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                暂无识别模式
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                随着更多对话分析，系统将自动识别对话模式
              </p>
            </div>
          )}
        </div>
      )}

      {/* Smart Replies Tab */}
      {activeTab === 'smart-replies' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-purple-500" />
                智能回复建议
              </CardTitle>
              <CardDescription>
                基于上下文和用户意图生成的智能回复建议
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="输入用户消息以获取智能回复建议..."
                    value={analyzeText}
                    onChange={(e) => setAnalyzeText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && analyzeText.trim()) {
                        handleGenerateSmartReplies()
                      }
                    }}
                  />
                  <Button
                    onClick={handleGenerateSmartReplies}
                    disabled={!analyzeText.trim() || loading}
                  >
                    <SparklesIcon className="h-4 w-4 mr-2" />
                    生成建议
                  </Button>
                </div>

                {showSmartReplies.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">建议回复：</h4>
                    {showSmartReplies.map((reply) => (
                      <div
                        key={reply.id}
                        className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge
                            className={
                              reply.type === 'informative' ? 'bg-blue-100 text-blue-800' :
                              reply.type === 'empathetic' ? 'bg-green-100 text-green-800' :
                              reply.type === 'clarifying' ? 'bg-yellow-100 text-yellow-800' :
                              reply.type === 'action' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            {reply.type}
                          </Badge>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            置信度: {(reply.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-gray-100 mb-2">
                          {reply.text}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                          {reply.reasoning}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quality Tab */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    对话质量分析 #{insight.id.slice(-8)}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${getQualityColor(insight.quality.overallScore)}`}>
                      {(insight.quality.overallScore * 100).toFixed(0)}%
                    </span>
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quality Metrics */}
                  <div className="space-y-3">
                    {Object.entries(insight.quality.metrics).map(([metric, score]) => (
                      <div key={metric} className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                          {metric === 'clarity' ? '清晰度' :
                           metric === 'engagement' ? '参与度' :
                           metric === 'coherence' ? '连贯性' :
                           metric === 'relevance' ? '相关性' :
                           metric === 'helpfulness' ? '有用性' :
                           metric === 'politeness' ? '礼貌性' : metric}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                            <div
                              className={`h-2 rounded-full ${getQualityColor(score)} bg-current`}
                              style={{ width: `${score * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-900 dark:text-gray-100 w-10">
                            {(score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Suggestions */}
                  {insight.quality.suggestions.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">改进建议：</p>
                      <div className="space-y-1">
                        {insight.quality.suggestions.slice(0, 2).map((suggestion, index) => (
                          <p key={index} className="text-xs text-blue-600 dark:text-blue-400">
                            • {suggestion}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {insights.length === 0 && (
            <div className="text-center py-12">
              <CheckCircleIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                暂无质量分析
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                分析对话以查看质量评估结果
              </p>
            </div>
          )}
        </div>
      )}

      {/* Config Tab */}
      {activeTab === 'config' && config && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI模型配置</CardTitle>
              <CardDescription>配置各个分析模块使用的AI模型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    情感分析模型
                  </label>
                  <Input
                    value={config.sentimentModel}
                    onChange={(e) => setConfig({ ...config, sentimentModel: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    话题检测模型
                  </label>
                  <Input
                    value={config.topicModel}
                    onChange={(e) => setConfig({ ...config, topicModel: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    意图分类模型
                  </label>
                  <Input
                    value={config.intentModel}
                    onChange={(e) => setConfig({ ...config, intentModel: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    质量评估模型
                  </label>
                  <Input
                    value={config.qualityModel}
                    onChange={(e) => setConfig({ ...config, qualityModel: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    置信度阈值: {config.confidenceThreshold}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={config.confidenceThreshold}
                    onChange={(e) => setConfig({ ...config, confidenceThreshold: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Switch
                    label="启用实时分析"
                    checked={config.enableRealtime}
                    onChange={(e) => setConfig({ ...config, enableRealtime: e.target.checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => conversationIntelligenceService.updateConfig(config)}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  保存配置
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analyze Conversation Modal */}
      <Modal
        open={showAnalyzeModal}
        onClose={() => setShowAnalyzeModal(false)}
        title="分析对话"
        description="输入对话内容进行AI智能分析"
      >
        <div className="space-y-4">
          <Textarea
            value={analyzeText}
            onChange={(e) => setAnalyzeText(e.target.value)}
            placeholder="请输入要分析的对话内容..."
            rows={6}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAnalyzeModal(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleAnalyzeConversation}
              disabled={!analyzeText.trim() || loading}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {loading ? '分析中...' : '开始分析'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Insight Details Modal */}
      <Modal
        open={!!showInsightDetails}
        onClose={() => setShowInsightDetails(null)}
        title="对话洞察详情"
        description={`详细分析结果 - ${showInsightDetails?.id.slice(-8)}`}
      >
        {showInsightDetails && (
          <div className="space-y-6">
            {/* Sentiment Analysis */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <HeartIcon className="h-5 w-5 text-red-500" />
                情感分析
              </h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-4 mb-3">
                  <Badge className={getSentimentColor(showInsightDetails.sentiment.sentiment)}>
                    {showInsightDetails.sentiment.sentiment}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    置信度: {(showInsightDetails.sentiment.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(showInsightDetails.sentiment.emotions).map(([emotion, score]) => (
                    <div key={emotion} className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{emotion}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {(score * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Topics */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-5 w-5 text-blue-500" />
                话题分析
              </h4>
              <div className="space-y-3">
                {showInsightDetails.topics.topics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{topic.name}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {(topic.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-green-500" />
                对话摘要
              </h4>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-900 dark:text-gray-100 mb-3">
                  {showInsightDetails.summary.summary}
                </p>
                {showInsightDetails.summary.keyPoints.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">关键点：</p>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      {showInsightDetails.summary.keyPoints.map((point, index) => (
                        <li key={index}>• {point}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )

  async function handleGenerateSmartReplies() {
    if (!analyzeText.trim()) {
      toast.error('请输入消息内容')
      return
    }

    setLoading(true)
    try {
      const messages = [{ id: '1', text: analyzeText, role: 'user', timestamp: Date.now() }]
      const insight = await conversationIntelligenceService.analyzeConversation(
        `temp_${Date.now()}`,
        messages,
        { includeReplies: true, includeSentiment: false, includeTopics: false, includeIntent: false, includeQuality: false, includeSummary: false }
      )

      setShowSmartReplies(insight.smartReplies)
    } catch (error) {
      console.error('Failed to generate smart replies:', error)
      toast.error('生成智能回复失败')
    } finally {
      setLoading(false)
    }
  }
}

export default ConversationIntelligenceDashboard
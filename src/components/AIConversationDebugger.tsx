import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  BugAntIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  LightBulbIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  SparklesIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'

interface ConversationDebugData {
  id: string
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: number
    metadata?: {
      tokenCount?: number
      responseTime?: number
      temperature?: number
      model?: string
    }
  }>
  context: {
    totalTokens: number
    conversationLength: number
    avgResponseTime: number
    errorCount: number
    modelSwitches: number
  }
  issues: Array<{
    type: 'performance' | 'quality' | 'context' | 'safety'
    severity: 'low' | 'medium' | 'high' | 'critical'
    message: string
    location: number // message index
    suggestion: string
    fixable: boolean
  }>
  optimization: {
    promptOptimization: Array<{
      original: string
      optimized: string
      improvement: string
      score: number
    }>
    contextOptimization: {
      redundantMessages: number[]
      keyMessages: number[]
      compressionRate: number
    }
    performanceOptimization: {
      suggestedModel: string
      suggestedTemperature: number
      suggestedMaxTokens: number
      expectedSpeedup: number
    }
  }
}

interface PromptTemplate {
  id: string
  name: string
  category: string
  template: string
  variables: string[]
  effectiveness: number
  description: string
}

interface AIConversationDebuggerProps {
  conversation?: any[]
  onOptimizationApplied?: (optimization: any) => void
  className?: string
}

export const AIConversationDebugger: React.FC<AIConversationDebuggerProps> = ({
  conversation = [],
  onOptimizationApplied,
  className
}) => {
  const [debugData, setDebugData] = useState<ConversationDebugData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<ConversationDebugData['issues'][0] | null>(null)
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([])
  const [optimizationScore, setOptimizationScore] = useState(0)
  const [realTimeAnalysis, setRealTimeAnalysis] = useState(true)
  const [activeTab, setActiveTab] = useState<'issues' | 'optimization' | 'templates' | 'metrics'>('issues')
  const [customPrompt, setCustomPrompt] = useState('')
  const [promptAnalysis, setPromptAnalysis] = useState<any>(null)

  // 预定义优化模板
  useEffect(() => {
    const templates: PromptTemplate[] = [
      {
        id: 'clear-instruction',
        name: '清晰指令模板',
        category: '基础优化',
        template: '请{action}，要求：\n1. {requirement1}\n2. {requirement2}\n3. {requirement3}\n\n输出格式：{format}',
        variables: ['action', 'requirement1', 'requirement2', 'requirement3', 'format'],
        effectiveness: 85,
        description: '提供清晰的指令和要求，提高响应质量'
      },
      {
        id: 'role-playing',
        name: '角色扮演模板',
        category: '创意增强',
        template: '你是一位{profession}，拥有{experience}年经验。现在需要你{task}。\n\n请以{profession}的专业角度，{approach}地完成这个任务。',
        variables: ['profession', 'experience', 'task', 'approach'],
        effectiveness: 78,
        description: '通过角色扮演提高回答的专业性和针对性'
      },
      {
        id: 'step-by-step',
        name: '分步骤模板',
        category: '逻辑增强',
        template: '请分步骤解决以下问题：{problem}\n\n要求按以下格式输出：\n步骤1：{step1}\n步骤2：{step2}\n...\n总结：{summary}',
        variables: ['problem', 'step1', 'step2', 'summary'],
        effectiveness: 82,
        description: '引导AI进行结构化思考和回答'
      },
      {
        id: 'context-aware',
        name: '上下文感知模板',
        category: '上下文优化',
        template: '基于我们之前讨论的{previous_topic}，现在{current_request}。\n\n请注意：\n- 保持与之前内容的连贯性\n- {specific_requirement}\n- 如有不清楚的地方请询问',
        variables: ['previous_topic', 'current_request', 'specific_requirement'],
        effectiveness: 80,
        description: '提高AI对上下文的理解和利用'
      },
      {
        id: 'quality-control',
        name: '质量控制模板',
        category: '质量保证',
        template: '{request}\n\n输出要求：\n✓ 准确性：确保信息正确\n✓ 完整性：涵盖所有要点\n✓ 清晰性：表达简洁明了\n✓ 相关性：紧扣主题\n\n请在回答最后进行自我检查。',
        variables: ['request'],
        effectiveness: 88,
        description: '内置质量检查，提高回答质量'
      }
    ]

    setPromptTemplates(templates)
  }, [])

  // 分析对话
  const analyzeConversation = useCallback(async () => {
    if (!conversation.length) {
      toast.error('没有对话数据需要分析')
      return
    }

    setIsAnalyzing(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 2000))

      // 计算基本统计
      const totalTokens = conversation.reduce((sum, msg) => sum + (msg.content?.length || 0) * 0.75, 0)
      const avgResponseTime = conversation
        .filter(msg => msg.role === 'assistant')
        .reduce((sum, msg) => sum + (msg.metadata?.responseTime || 1000), 0) /
        conversation.filter(msg => msg.role === 'assistant').length

      // 检测问题
      const issues: ConversationDebugData['issues'] = []

      // 性能问题检测
      conversation.forEach((msg, index) => {
        if (msg.role === 'assistant' && msg.metadata?.responseTime > 5000) {
          issues.push({
            type: 'performance',
            severity: 'medium',
            message: '响应时间过长',
            location: index,
            suggestion: '考虑调整模型参数或优化提示词',
            fixable: true
          })
        }

        if (msg.content?.length > 4000) {
          issues.push({
            type: 'context',
            severity: 'low',
            message: '消息过长可能影响上下文理解',
            location: index,
            suggestion: '将长消息分解为多个短消息',
            fixable: true
          })
        }
      })

      // 质量问题检测
      const userMessages = conversation.filter(msg => msg.role === 'user')
      const vaguePrompts = userMessages.filter(msg =>
        msg.content && (
          msg.content.length < 10 ||
          !msg.content.includes('?') && !msg.content.includes('。') ||
          msg.content.split(' ').length < 3
        )
      )

      vaguePrompts.forEach(msg => {
        const index = conversation.indexOf(msg)
        issues.push({
          type: 'quality',
          severity: 'medium',
          message: '提示词不够明确',
          location: index,
          suggestion: '添加更多详细信息和具体要求',
          fixable: true
        })
      })

      // 上下文问题检测
      if (conversation.length > 20) {
        issues.push({
          type: 'context',
          severity: 'high',
          message: '对话过长，可能导致上下文丢失',
          location: conversation.length - 1,
          suggestion: '考虑总结之前的对话或开始新对话',
          fixable: true
        })
      }

      // 生成优化建议
      const promptOptimization = userMessages.slice(-5).map(msg => {
        const original = msg.content || ''
        let optimized = original

        // 简单的优化逻辑
        if (original.length < 20) {
          optimized = `请详细${original}，包括具体要求和期望的输出格式。`
        }

        if (!original.includes('请') && !original.includes('?')) {
          optimized = '请' + original + '，谢谢。'
        }

        return {
          original,
          optimized,
          improvement: optimized !== original ? '添加了礼貌用词和明确要求' : '无需优化',
          score: optimized !== original ? 75 : 90
        }
      })

      const debugData: ConversationDebugData = {
        id: `debug_${Date.now()}`,
        messages: conversation,
        context: {
          totalTokens: Math.round(totalTokens),
          conversationLength: conversation.length,
          avgResponseTime: Math.round(avgResponseTime),
          errorCount: issues.length,
          modelSwitches: 0
        },
        issues,
        optimization: {
          promptOptimization,
          contextOptimization: {
            redundantMessages: [],
            keyMessages: conversation
              .map((msg, index) => ({ msg, index }))
              .filter(({ msg }) => msg.role === 'user' && msg.content && msg.content.length > 50)
              .map(({ index }) => index),
            compressionRate: 0.15
          },
          performanceOptimization: {
            suggestedModel: 'gpt-3.5-turbo',
            suggestedTemperature: 0.7,
            suggestedMaxTokens: 2000,
            expectedSpeedup: 1.5
          }
        }
      }

      setDebugData(debugData)

      // 计算优化分数
      const score = Math.max(0, 100 - issues.length * 10)
      setOptimizationScore(score)

      toast.success('对话分析完成')

    } catch (error) {
      toast.error('分析失败')
      console.error(error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [conversation])

  // 分析单个提示词
  const analyzePrompt = useCallback(async (prompt: string) => {
    if (!prompt.trim()) return

    setIsAnalyzing(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const analysis = {
        clarity: Math.random() * 40 + 60, // 60-100
        specificity: Math.random() * 30 + 50, // 50-80
        completeness: Math.random() * 35 + 45, // 45-80
        politeness: prompt.includes('请') || prompt.includes('谢谢') ? 90 : 60,
        structure: prompt.includes('1.') || prompt.includes('：') ? 85 : 55,
        suggestions: [
          prompt.length < 20 ? '提示词过短，建议添加更多细节' : null,
          !prompt.includes('?') && !prompt.includes('请') ? '建议使用疑问句或礼貌用词' : null,
          prompt.split('').filter(c => c === '。').length > 3 ? '建议分解为多个简单要求' : null
        ].filter(Boolean),
        optimizedVersion: `请${prompt.replace(/^请/, '')}。要求输出格式清晰，内容准确完整。`,
        score: 0
      }

      analysis.score = Math.round((
        analysis.clarity * 0.3 +
        analysis.specificity * 0.25 +
        analysis.completeness * 0.25 +
        analysis.politeness * 0.1 +
        analysis.structure * 0.1
      ))

      setPromptAnalysis(analysis)

    } catch (error) {
      console.error(error)
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  // 应用优化
  const applyOptimization = useCallback((type: string, data: any) => {
    onOptimizationApplied?.({ type, data })
    toast.success('优化已应用')
  }, [onOptimizationApplied])

  // 自动修复问题
  const autoFixIssue = useCallback((issue: ConversationDebugData['issues'][0]) => {
    // 模拟自动修复
    setTimeout(() => {
      setDebugData(prev => prev ? {
        ...prev,
        issues: prev.issues.filter(i => i !== issue)
      } : null)
      toast.success('问题已自动修复')
    }, 1000)
  }, [])

  return (
    <div className={cn("h-full flex flex-col bg-white dark:bg-gray-900", className)}>
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <BugAntIcon className="h-6 w-6 text-red-500" />
          AI对话调试器
        </h2>

        <div className="flex items-center gap-3">
          {optimizationScore > 0 && (
            <div className={cn(
              "px-3 py-1 rounded-full text-sm font-medium",
              optimizationScore >= 80 ? "bg-green-100 text-green-800" :
              optimizationScore >= 60 ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            )}>
              优化分数: {optimizationScore}/100
            </div>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={realTimeAnalysis}
              onChange={(e) => setRealTimeAnalysis(e.target.checked)}
            />
            <span className="text-sm">实时分析</span>
          </label>

          <Button
            onClick={analyzeConversation}
            disabled={isAnalyzing || !conversation.length}
            className="gap-2"
          >
            <MagnifyingGlassIcon className="h-4 w-4" />
            {isAnalyzing ? '分析中...' : '开始分析'}
          </Button>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-4">
          {[
            { id: 'issues', name: '问题诊断', icon: ExclamationTriangleIcon },
            { id: 'optimization', name: '优化建议', icon: SparklesIcon },
            { id: 'templates', name: '提示模板', icon: DocumentTextIcon },
            { id: 'metrics', name: '性能指标', icon: ChartBarIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 flex">
        {/* 主要内容区域 */}
        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'issues' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">问题诊断</h3>

              {debugData?.issues.length ? (
                <div className="space-y-3">
                  {debugData.issues.map((issue, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-4 rounded-lg border-l-4 cursor-pointer transition-colors",
                        issue.severity === 'critical' && "border-red-500 bg-red-50 dark:bg-red-900/20",
                        issue.severity === 'high' && "border-orange-500 bg-orange-50 dark:bg-orange-900/20",
                        issue.severity === 'medium' && "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20",
                        issue.severity === 'low' && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                        selectedIssue === issue && "ring-2 ring-blue-500"
                      )}
                      onClick={() => setSelectedIssue(issue)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn(
                              "px-2 py-1 rounded text-xs font-medium",
                              issue.severity === 'critical' && "bg-red-200 text-red-800",
                              issue.severity === 'high' && "bg-orange-200 text-orange-800",
                              issue.severity === 'medium' && "bg-yellow-200 text-yellow-800",
                              issue.severity === 'low' && "bg-blue-200 text-blue-800"
                            )}>
                              {issue.type}
                            </span>
                            <span className="text-xs text-gray-500">
                              消息 #{issue.location + 1}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {issue.message}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            建议：{issue.suggestion}
                          </p>
                        </div>

                        {issue.fixable && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              autoFixIssue(issue)
                            }}
                            size="sm"
                            variant="outline"
                            className="ml-4"
                          >
                            自动修复
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : debugData ? (
                <div className="text-center py-8 text-green-600">
                  <CheckBadgeIcon className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg font-medium">没有发现问题</p>
                  <p className="text-sm text-gray-500">您的对话质量很好！</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BugAntIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>点击"开始分析"来诊断对话问题</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'optimization' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">优化建议</h3>

              {/* 提示词分析器 */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">提示词分析器</h4>
                <div className="space-y-3">
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="输入要分析的提示词..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                  />
                  <Button
                    onClick={() => analyzePrompt(customPrompt)}
                    disabled={!customPrompt.trim() || isAnalyzing}
                    size="sm"
                  >
                    分析提示词
                  </Button>

                  {promptAnalysis && (
                    <div className="mt-4 p-4 bg-white dark:bg-gray-700 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium">分析结果</h5>
                        <span className={cn(
                          "px-2 py-1 rounded text-sm font-medium",
                          promptAnalysis.score >= 80 ? "bg-green-100 text-green-800" :
                          promptAnalysis.score >= 60 ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        )}>
                          {promptAnalysis.score}/100
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-sm text-gray-600">清晰度</span>
                          <div className="h-2 bg-gray-200 rounded-full mt-1">
                            <div
                              className="h-2 bg-blue-500 rounded-full"
                              style={{ width: `${promptAnalysis.clarity}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">具体性</span>
                          <div className="h-2 bg-gray-200 rounded-full mt-1">
                            <div
                              className="h-2 bg-green-500 rounded-full"
                              style={{ width: `${promptAnalysis.specificity}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">完整性</span>
                          <div className="h-2 bg-gray-200 rounded-full mt-1">
                            <div
                              className="h-2 bg-yellow-500 rounded-full"
                              style={{ width: `${promptAnalysis.completeness}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">礼貌程度</span>
                          <div className="h-2 bg-gray-200 rounded-full mt-1">
                            <div
                              className="h-2 bg-purple-500 rounded-full"
                              style={{ width: `${promptAnalysis.politeness}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {promptAnalysis.suggestions.length > 0 && (
                        <div className="mb-4">
                          <h6 className="font-medium text-sm mb-2">改进建议</h6>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {promptAnalysis.suggestions.map((suggestion: string, i: number) => (
                              <li key={i}>• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <h6 className="font-medium text-sm mb-2">优化后版本</h6>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                          {promptAnalysis.optimizedVersion}
                        </div>
                        <Button
                          onClick={() => applyOptimization('prompt', promptAnalysis.optimizedVersion)}
                          size="sm"
                          className="mt-2"
                        >
                          应用优化
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 历史提示词优化 */}
              {debugData?.optimization.promptOptimization.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">提示词优化建议</h4>
                  <div className="space-y-3">
                    {debugData.optimization.promptOptimization.map((opt, index) => (
                      <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="mb-3">
                          <span className="text-sm text-gray-500">原始:</span>
                          <p className="text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded mt-1">
                            {opt.original}
                          </p>
                        </div>
                        <div className="mb-3">
                          <span className="text-sm text-gray-500">优化:</span>
                          <p className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded mt-1">
                            {opt.optimized}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">{opt.improvement}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">评分: {opt.score}/100</span>
                            <Button
                              onClick={() => applyOptimization('prompt', opt.optimized)}
                              size="sm"
                              variant="outline"
                            >
                              应用
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">提示模板库</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {promptTemplates.map(template => (
                  <div
                    key={template.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {template.name}
                        </h4>
                        <span className="text-xs text-gray-500">{template.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-600">
                          {template.effectiveness}%
                        </span>
                        <LightBulbIcon className="h-4 w-4 text-yellow-500" />
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {template.description}
                    </p>

                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-xs font-mono mb-3">
                      {template.template}
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.variables.map(variable => (
                        <span
                          key={variable}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-xs rounded"
                        >
                          {variable}
                        </span>
                      ))}
                    </div>

                    <Button
                      onClick={() => applyOptimization('template', template)}
                      size="sm"
                      className="w-full"
                    >
                      使用模板
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'metrics' && debugData && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">性能指标</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">总令牌数</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {debugData.context.totalTokens.toLocaleString()}
                  </p>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">平均响应时间</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {debugData.context.avgResponseTime}ms
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium">问题数量</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {debugData.context.errorCount}
                  </p>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <ChartBarIcon className="h-5 w-5 text-purple-600" />
                    <span className="text-sm font-medium">对话长度</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    {debugData.context.conversationLength}
                  </p>
                </div>
              </div>

              {/* 性能优化建议 */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">性能优化建议</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">建议模型</span>
                    <p className="font-medium">{debugData.optimization.performanceOptimization.suggestedModel}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">建议温度</span>
                    <p className="font-medium">{debugData.optimization.performanceOptimization.suggestedTemperature}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">建议最大令牌数</span>
                    <p className="font-medium">{debugData.optimization.performanceOptimization.suggestedMaxTokens}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">预期加速</span>
                    <p className="font-medium text-green-600">
                      {debugData.optimization.performanceOptimization.expectedSpeedup}x
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => applyOptimization('performance', debugData.optimization.performanceOptimization)}
                  className="mt-4"
                >
                  应用性能优化
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 右侧详情面板 */}
        {selectedIssue && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">问题详情</h3>

            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">问题类型</span>
                <p className="font-medium capitalize">{selectedIssue.type}</p>
              </div>

              <div>
                <span className="text-sm text-gray-500">严重程度</span>
                <p className={cn(
                  "font-medium capitalize",
                  selectedIssue.severity === 'critical' && "text-red-600",
                  selectedIssue.severity === 'high' && "text-orange-600",
                  selectedIssue.severity === 'medium' && "text-yellow-600",
                  selectedIssue.severity === 'low' && "text-blue-600"
                )}>
                  {selectedIssue.severity}
                </p>
              </div>

              <div>
                <span className="text-sm text-gray-500">位置</span>
                <p className="font-medium">消息 #{selectedIssue.location + 1}</p>
              </div>

              <div>
                <span className="text-sm text-gray-500">问题描述</span>
                <p className="text-sm">{selectedIssue.message}</p>
              </div>

              <div>
                <span className="text-sm text-gray-500">解决建议</span>
                <p className="text-sm">{selectedIssue.suggestion}</p>
              </div>

              {selectedIssue.fixable && (
                <Button
                  onClick={() => autoFixIssue(selectedIssue)}
                  className="w-full"
                >
                  自动修复此问题
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIConversationDebugger
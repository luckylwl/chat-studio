import React, { useState, useMemo } from 'react'
import {
  SparklesIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Button, Textarea, Modal } from '@/components/ui'
import { cn } from '@/utils'

interface PromptSuggestion {
  type: 'improvement' | 'warning' | 'tip'
  title: string
  description: string
  example?: string
}

interface PromptAnalysis {
  score: number  // 0-100
  length: number
  clarity: number  // 0-100
  specificity: number  // 0-100
  structure: number  // 0-100
  suggestions: PromptSuggestion[]
  optimizedVersion?: string
}

interface PromptOptimizerProps {
  isOpen: boolean
  onClose: () => void
  initialPrompt?: string
  onApplyOptimization: (optimizedPrompt: string) => void
}

/**
 * 智能提示词优化器
 * 功能:
 * - 分析提示词质量
 * - 提供优化建议
 * - 自动生成优化版本
 * - 模板库
 */
export const PromptOptimizer: React.FC<PromptOptimizerProps> = ({
  isOpen,
  onClose,
  initialPrompt = '',
  onApplyOptimization
}) => {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // 分析提示词
  const analysis = useMemo<PromptAnalysis>(() => {
    if (!prompt.trim()) {
      return {
        score: 0,
        length: 0,
        clarity: 0,
        specificity: 0,
        structure: 0,
        suggestions: []
      }
    }

    const suggestions: PromptSuggestion[] = []
    let score = 100
    const length = prompt.length
    let clarity = 100
    let specificity = 100
    let structure = 100

    // 长度检查
    if (length < 20) {
      clarity -= 30
      score -= 20
      suggestions.push({
        type: 'warning',
        title: '提示词过短',
        description: '提示词太简短可能导致AI理解不准确',
        example: '建议至少20个字符,详细描述你的需求'
      })
    } else if (length > 500) {
      clarity -= 10
      score -= 5
      suggestions.push({
        type: 'tip',
        title: '提示词较长',
        description: '过长的提示词可能包含冗余信息',
        example: '尝试精简到关键信息,保持在200-300字符'
      })
    }

    // 结构检查
    const hasContext = /背景|场景|情况|问题/.test(prompt)
    const hasTask = /请|帮我|需要|想要/.test(prompt)
    const hasFormat = /格式|样式|方式|步骤/.test(prompt)

    if (!hasContext) {
      structure -= 30
      score -= 15
      suggestions.push({
        type: 'improvement',
        title: '缺少背景信息',
        description: '提供背景信息可以帮助AI更好地理解上下文',
        example: '添加: "背景: [描述当前情况]"'
      })
    }

    if (!hasTask) {
      structure -= 30
      score -= 15
      suggestions.push({
        type: 'improvement',
        title: '缺少明确任务',
        description: '明确说明你需要AI做什么',
        example: '添加: "请帮我..."或"我需要..."'
      })
    }

    if (!hasFormat) {
      structure -= 20
      score -= 10
      suggestions.push({
        type: 'tip',
        title: '可以指定输出格式',
        description: '指定期望的输出格式可以获得更符合预期的结果',
        example: '添加: "请以列表/步骤/代码的形式输出"'
      })
    }

    // 具体性检查
    const hasVagueTerms = /(一些|很多|可能|大概|差不多|之类)/.test(prompt)
    if (hasVagueTerms) {
      specificity -= 20
      score -= 10
      suggestions.push({
        type: 'improvement',
        title: '表述过于模糊',
        description: '避免使用模糊的词语,使用具体的描述',
        example: '将"一些"改为具体数量,"很多"改为"至少5个"'
      })
    }

    // 检查是否有示例
    const hasExample = /(例如|比如|示例|example)/.test(prompt)
    if (!hasExample && length > 50) {
      specificity -= 15
      score -= 8
      suggestions.push({
        type: 'tip',
        title: '可以提供示例',
        description: '提供具体示例可以让AI更准确地理解你的需求',
        example: '添加: "例如: [具体示例]"'
      })
    }

    // 检查是否有约束条件
    const hasConstraints = /(限制|要求|不要|避免|必须|应该)/.test(prompt)
    if (!hasConstraints && length > 30) {
      specificity -= 10
      score -= 5
      suggestions.push({
        type: 'tip',
        title: '可以添加约束条件',
        description: '明确限制条件和要求可以获得更精准的结果',
        example: '添加: "要求: 不超过200字"或"避免使用专业术语"'
      })
    }

    // 生成优化版本
    let optimizedVersion = prompt

    if (!hasContext && !hasTask) {
      optimizedVersion = `【背景】\n${prompt}\n\n【任务】\n请根据以上背景,提供详细的回答。\n\n【要求】\n- 清晰易懂\n- 提供具体示例\n- 分步骤说明`
    } else if (!hasStructure) {
      optimizedVersion = `${prompt}\n\n请以清晰的结构输出,包括:\n1. 核心要点\n2. 详细说明\n3. 实际示例`
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      length,
      clarity,
      specificity,
      structure,
      suggestions,
      optimizedVersion: optimizedVersion !== prompt ? optimizedVersion : undefined
    }
  }, [prompt])

  const handleOptimize = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      if (analysis.optimizedVersion) {
        setPrompt(analysis.optimizedVersion)
      }
    }, 800)
  }

  const handleApply = () => {
    onApplyOptimization(prompt)
    onClose()
  }

  // 优化模板
  const templates = [
    {
      name: '代码开发',
      prompt: `【背景】我正在开发[项目名称],使用[技术栈]

【任务】请帮我[具体任务]

【要求】
- 代码要简洁高效
- 添加必要的注释
- 遵循最佳实践
- 提供使用示例

【约束】
- 不使用第三方库(或指定允许的库)
- 代码长度控制在[数量]行以内`
    },
    {
      name: '文案撰写',
      prompt: `【目标】撰写[类型]文案

【受众】[目标受众群体]

【要求】
- 风格: [正式/活泼/专业等]
- 长度: [字数要求]
- 重点突出: [核心卖点]
- 包含关键词: [关键词列表]

【参考】
[提供参考文案或示例]`
    },
    {
      name: '学习辅导',
      prompt: `【主题】[学习主题]

【当前水平】[初学者/中级/高级]

【学习目标】[具体目标]

【请求】
1. 提供核心概念讲解
2. 给出3-5个实际例子
3. 推荐学习资源
4. 设计练习题

【注意】使用简单易懂的语言,避免过于专业的术语`
    }
  ]

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="智能提示词优化器"
      size="xl"
    >
      <div className="flex flex-col h-[700px]">
        {/* 输入区域 */}
        <div className="flex-shrink-0 mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            你的提示词
          </label>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="输入你的提示词,AI将为你分析并提供优化建议..."
            rows={6}
            className="resize-none"
          />

          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {prompt.length} 字符
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOptimize}
                disabled={!prompt.trim() || isAnalyzing}
              >
                {isAnalyzing ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                    优化中...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 mr-1" />
                    自动优化
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 分析结果 */}
        {prompt.trim() && (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* 总体评分 */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  质量评分
                </span>
                <span className={cn('text-2xl font-bold', getScoreColor(analysis.score))}>
                  {Math.round(analysis.score)}
                </span>
              </div>

              {/* 进度条 */}
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-500', getScoreBg(analysis.score))}
                  style={{ width: `${analysis.score}%` }}
                />
              </div>

              {/* 细分指标 */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">清晰度</div>
                  <div className="text-lg font-semibold">{analysis.clarity}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">具体性</div>
                  <div className="text-lg font-semibold">{analysis.specificity}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">结构化</div>
                  <div className="text-lg font-semibold">{analysis.structure}%</div>
                </div>
              </div>
            </div>

            {/* 优化建议 */}
            {analysis.suggestions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  优化建议 ({analysis.suggestions.length})
                </h3>
                <div className="space-y-3">
                  {analysis.suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={cn(
                        'p-3 rounded-lg border',
                        suggestion.type === 'improvement' && 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700',
                        suggestion.type === 'warning' && 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700',
                        suggestion.type === 'tip' && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {suggestion.type === 'improvement' && (
                          <SparklesIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        )}
                        {suggestion.type === 'warning' && (
                          <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        )}
                        {suggestion.type === 'tip' && (
                          <LightBulbIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {suggestion.title}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {suggestion.description}
                          </div>
                          {suggestion.example && (
                            <div className="mt-2 text-xs bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
                              💡 {suggestion.example}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 模板推荐 */}
            {!prompt.trim() && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  优质模板
                </h3>
                <div className="grid gap-3">
                  {templates.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(template.prompt)}
                      className="text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {template.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {template.prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex-shrink-0 flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            disabled={!prompt.trim()}
          >
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            应用
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default PromptOptimizer

/**
 * AI Assistant Panel Component
 * UI for accessing AI-powered text processing features
 */

import React, { useState } from 'react'
import {
  SparklesIcon,
  DocumentTextIcon,
  LanguageIcon,
  FaceSmileIcon,
  TagIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Button, Card } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import {
  aiAssistantService,
  type SummarizationOptions,
  type TranslationOptions,
  type TextEnhancementOptions
} from '@/services/aiAssistantService'

interface AIAssistantPanelProps {
  initialText?: string
  onApplyResult?: (text: string) => void
  className?: string
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  initialText = '',
  onApplyResult,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'summarize' | 'translate' | 'sentiment' | 'keywords' | 'grammar' | 'enhance'>('summarize')
  const [inputText, setInputText] = useState(initialText)
  const [outputText, setOutputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)

  // Summarization options
  const [summaryLength, setSummaryLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [summaryStyle, setSummaryStyle] = useState<'bullets' | 'paragraph' | 'highlights'>('paragraph')

  // Translation options
  const [targetLang, setTargetLang] = useState('zh-CN')
  const [sourceLang, setSourceLang] = useState('auto')

  // Enhancement options
  const [enhanceStyle, setEnhanceStyle] = useState<'formal' | 'casual' | 'professional' | 'creative'>('professional')
  const [enhanceTone, setEnhanceTone] = useState<'friendly' | 'authoritative' | 'empathetic' | 'persuasive'>('friendly')

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      toast.error('请输入要摘要的文本')
      return
    }

    setIsProcessing(true)
    try {
      const options: SummarizationOptions = {
        length: summaryLength,
        style: summaryStyle
      }

      const result = await aiAssistantService.summarize(inputText, options)
      setResult(result)
      setOutputText(result.summary)
      toast.success(`摘要生成成功 (${result.processingTime}ms)`)
    } catch (error: any) {
      toast.error(`摘要失败: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      toast.error('请输入要翻译的文本')
      return
    }

    setIsProcessing(true)
    try {
      const options: TranslationOptions = {
        sourceLang: sourceLang !== 'auto' ? sourceLang : undefined,
        targetLang
      }

      const result = await aiAssistantService.translate(inputText, options)
      setResult(result)
      setOutputText(result.translatedText)
      toast.success(`翻译完成 (${result.detectedSourceLang} → ${targetLang})`)
    } catch (error: any) {
      toast.error(`翻译失败: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAnalyzeSentiment = async () => {
    if (!inputText.trim()) {
      toast.error('请输入要分析的文本')
      return
    }

    setIsProcessing(true)
    try {
      const result = await aiAssistantService.analyzeSentiment(inputText)
      setResult(result)
      setOutputText('')
      toast.success('情感分析完成')
    } catch (error: any) {
      toast.error(`分析失败: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleExtractKeywords = async () => {
    if (!inputText.trim()) {
      toast.error('请输入要分析的文本')
      return
    }

    setIsProcessing(true)
    try {
      const result = await aiAssistantService.extractKeywords(inputText, 10)
      setResult(result)
      setOutputText('')
      toast.success('关键词提取完成')
    } catch (error: any) {
      toast.error(`提取失败: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCheckGrammar = async () => {
    if (!inputText.trim()) {
      toast.error('请输入要检查的文本')
      return
    }

    setIsProcessing(true)
    try {
      const result = await aiAssistantService.checkGrammar(inputText)
      setResult(result)
      setOutputText(result.correctedText)
      toast.success(`语法检查完成 (得分: ${result.score})`)
    } catch (error: any) {
      toast.error(`检查失败: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEnhanceText = async () => {
    if (!inputText.trim()) {
      toast.error('请输入要改进的文本')
      return
    }

    setIsProcessing(true)
    try {
      const options: TextEnhancementOptions = {
        style: enhanceStyle,
        tone: enhanceTone,
        improve: ['clarity', 'conciseness', 'engagement']
      }

      const result = await aiAssistantService.enhanceText(inputText, options)
      setResult(result)
      setOutputText(result.enhancedText)
      toast.success('文本改进完成')
    } catch (error: any) {
      toast.error(`改进失败: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProcess = () => {
    switch (activeTab) {
      case 'summarize':
        handleSummarize()
        break
      case 'translate':
        handleTranslate()
        break
      case 'sentiment':
        handleAnalyzeSentiment()
        break
      case 'keywords':
        handleExtractKeywords()
        break
      case 'grammar':
        handleCheckGrammar()
        break
      case 'enhance':
        handleEnhanceText()
        break
    }
  }

  const handleApply = () => {
    if (outputText && onApplyResult) {
      onApplyResult(outputText)
      toast.success('已应用结果')
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 dark:text-green-400'
      case 'negative':
        return 'text-red-600 dark:text-red-400'
      case 'neutral':
        return 'text-gray-600 dark:text-gray-400'
      case 'mixed':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getSentimentEmoji = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊'
      case 'negative': return '😞'
      case 'neutral': return '😐'
      case 'mixed': return '🤔'
      default: return '❓'
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <SparklesIcon className="w-6 h-6 text-primary-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          AI 智能助手
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('summarize')}
          className={cn(
            'flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors',
            activeTab === 'summarize'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          <DocumentTextIcon className="w-4 h-4" />
          摘要
        </button>
        <button
          onClick={() => setActiveTab('translate')}
          className={cn(
            'flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors',
            activeTab === 'translate'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          <LanguageIcon className="w-4 h-4" />
          翻译
        </button>
        <button
          onClick={() => setActiveTab('sentiment')}
          className={cn(
            'flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors',
            activeTab === 'sentiment'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          <FaceSmileIcon className="w-4 h-4" />
          情感
        </button>
        <button
          onClick={() => setActiveTab('keywords')}
          className={cn(
            'flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors',
            activeTab === 'keywords'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          <TagIcon className="w-4 h-4" />
          关键词
        </button>
        <button
          onClick={() => setActiveTab('grammar')}
          className={cn(
            'flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors',
            activeTab === 'grammar'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          <CheckCircleIcon className="w-4 h-4" />
          语法
        </button>
        <button
          onClick={() => setActiveTab('enhance')}
          className={cn(
            'flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors',
            activeTab === 'enhance'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          <LightBulbIcon className="w-4 h-4" />
          改进
        </button>
      </div>

      {/* Options */}
      <Card className="p-4">
        {activeTab === 'summarize' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                摘要长度
              </label>
              <select
                value={summaryLength}
                onChange={(e) => setSummaryLength(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="short">简短</option>
                <option value="medium">中等</option>
                <option value="long">详细</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                摘要风格
              </label>
              <select
                value={summaryStyle}
                onChange={(e) => setSummaryStyle(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="paragraph">段落</option>
                <option value="bullets">要点</option>
                <option value="highlights">重点</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'translate' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                源语言
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="auto">自动检测</option>
                <option value="zh-CN">简体中文</option>
                <option value="en-US">英语</option>
                <option value="ja-JP">日语</option>
                <option value="ko-KR">韩语</option>
                <option value="fr-FR">法语</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                目标语言
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="zh-CN">简体中文</option>
                <option value="en-US">英语</option>
                <option value="ja-JP">日语</option>
                <option value="ko-KR">韩语</option>
                <option value="fr-FR">法语</option>
                <option value="de-DE">德语</option>
                <option value="es-ES">西班牙语</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'enhance' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                文本风格
              </label>
              <select
                value={enhanceStyle}
                onChange={(e) => setEnhanceStyle(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="formal">正式</option>
                <option value="casual">随意</option>
                <option value="professional">专业</option>
                <option value="creative">创意</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                语气
              </label>
              <select
                value={enhanceTone}
                onChange={(e) => setEnhanceTone(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="friendly">友好</option>
                <option value="authoritative">权威</option>
                <option value="empathetic">共情</option>
                <option value="persuasive">说服</option>
              </select>
            </div>
          </div>
        )}
      </Card>

      {/* Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          输入文本
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="输入或粘贴文本..."
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
        />
      </div>

      {/* Process Button */}
      <Button
        onClick={handleProcess}
        disabled={isProcessing || !inputText.trim()}
        className="w-full"
      >
        <ArrowPathIcon className={cn('w-4 h-4 mr-2', isProcessing && 'animate-spin')} />
        {isProcessing ? '处理中...' : '开始处理'}
      </Button>

      {/* Results */}
      {result && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">处理结果</h3>

          {/* Summarization Results */}
          {activeTab === 'summarize' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  摘要
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100">
                  {result.summary}
                </div>
              </div>
              {result.keyPoints && result.keyPoints.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    关键要点
                  </label>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {result.keyPoints.map((point: string, i: number) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>字数: {result.wordCount}</span>
                <span>压缩率: {(result.compressionRatio * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}

          {/* Translation Results */}
          {activeTab === 'translate' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  翻译结果
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-gray-100">
                  {result.translatedText}
                </div>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                置信度: {(result.confidence * 100).toFixed(1)}%
              </div>
            </div>
          )}

          {/* Sentiment Analysis Results */}
          {activeTab === 'sentiment' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{getSentimentEmoji(result.overall)}</span>
                <div>
                  <div className={cn('text-lg font-semibold', getSentimentColor(result.overall))}>
                    {result.overall === 'positive' && '积极'}
                    {result.overall === 'negative' && '消极'}
                    {result.overall === 'neutral' && '中性'}
                    {result.overall === 'mixed' && '复杂'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    得分: {result.score.toFixed(2)} | 置信度: {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  情感维度
                </label>
                <div className="space-y-2">
                  {Object.entries(result.emotions).map(([emotion, value]: [string, any]) => (
                    <div key={emotion} className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300 w-16">
                        {emotion === 'joy' && '喜悦'}
                        {emotion === 'sadness' && '悲伤'}
                        {emotion === 'anger' && '愤怒'}
                        {emotion === 'fear' && '恐惧'}
                        {emotion === 'surprise' && '惊讶'}
                      </span>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500"
                          style={{ width: `${value * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 w-12 text-right">
                        {(value * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Keyword Extraction Results */}
          {activeTab === 'keywords' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  关键词
                </label>
                <div className="flex flex-wrap gap-2">
                  {result.keywords.map((kw: any, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300"
                    >
                      {kw.keyword}
                      <span className="text-xs opacity-70">({kw.frequency})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Grammar Check Results */}
          {activeTab === 'grammar' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  质量得分
                </label>
                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {result.score}/100
                </span>
              </div>
              {result.issues && result.issues.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    发现 {result.issues.length} 个问题
                  </label>
                  <div className="space-y-2">
                    {result.issues.map((issue: any, i: number) => (
                      <div key={i} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {issue.type}: {issue.original} → {issue.suggestion}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {issue.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Apply Button */}
          {outputText && (
            <Button onClick={handleApply} variant="outline" className="w-full">
              应用结果
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}

export default AIAssistantPanel

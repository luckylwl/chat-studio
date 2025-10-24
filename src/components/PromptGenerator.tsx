import React, { useState, useMemo } from 'react'
import {
  SparklesIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  BeakerIcon,
  LightBulbIcon,
  AcademicCapIcon,
  CodeBracketIcon,
  PaintBrushIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Button, Badge } from './ui'
import { cn } from '@/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface PromptTemplate {
  id: string
  name: string
  category: string
  icon: string
  description: string
  template: string
  variables: string[]
  examples: string[]
}

interface PromptGeneratorProps {
  isOpen: boolean
  onClose: () => void
  onUsePrompt: (prompt: string) => void
}

const PromptGenerator: React.FC<PromptGeneratorProps> = ({
  isOpen,
  onClose,
  onUsePrompt
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [generatedPrompt, setGeneratedPrompt] = useState('')

  const templates: PromptTemplate[] = [
    // 写作助手
    {
      id: 'blog-writer',
      name: '博客文章生成器',
      category: '写作',
      icon: '✍️',
      description: '生成高质量的博客文章',
      template: '请帮我写一篇关于{topic}的博客文章。文章应该：\n1. 目标受众：{audience}\n2. 文章风格：{style}\n3. 字数要求：{wordCount}字\n4. 包含要点：{keyPoints}\n5. SEO关键词：{keywords}',
      variables: ['topic', 'audience', 'style', 'wordCount', 'keyPoints', 'keywords'],
      examples: [
        'topic: AI技术发展趋势\naudience: 技术爱好者\nstyle: 专业严谨\nwordCount: 2000\nkeyPoints: 机器学习、深度学习、应用场景\nkeywords: AI, 人工智能, 机器学习'
      ]
    },
    {
      id: 'email-composer',
      name: '邮件撰写助手',
      category: '写作',
      icon: '📧',
      description: '撰写专业的商务邮件',
      template: '请帮我撰写一封{emailType}邮件。\n收件人：{recipient}\n目的：{purpose}\n语气：{tone}\n关键信息：{keyInfo}\n希望的结果：{expectedOutcome}',
      variables: ['emailType', 'recipient', 'purpose', 'tone', 'keyInfo', 'expectedOutcome'],
      examples: [
        'emailType: 商务合作\nrecipient: 潜在客户\npurpose: 介绍产品服务\ntone: 专业友好\nkeyInfo: AI解决方案、价格优势\nexpectedOutcome: 预约会议'
      ]
    },
    // 代码助手
    {
      id: 'code-generator',
      name: '代码生成器',
      category: '编程',
      icon: '💻',
      description: '生成高质量代码片段',
      template: '请用{language}语言编写代码来实现以下功能：\n功能描述：{functionality}\n输入：{input}\n输出：{output}\n性能要求：{performance}\n代码风格：{style}\n请包含注释和错误处理。',
      variables: ['language', 'functionality', 'input', 'output', 'performance', 'style'],
      examples: [
        'language: TypeScript\nfunctionality: 实现防抖函数\ninput: 函数和延迟时间\noutput: 防抖后的函数\nperformance: 高效\nstyle: 函数式编程'
      ]
    },
    {
      id: 'code-reviewer',
      name: '代码审查助手',
      category: '编程',
      icon: '🔍',
      description: '专业的代码审查和建议',
      template: '请审查以下{language}代码，重点关注：\n1. {aspect1}\n2. {aspect2}\n3. {aspect3}\n\n代码：\n```{language}\n{code}\n```\n\n请提供详细的改进建议和最佳实践。',
      variables: ['language', 'aspect1', 'aspect2', 'aspect3', 'code'],
      examples: [
        'language: JavaScript\naspect1: 性能优化\naspect2: 代码可读性\naspect3: 错误处理\ncode: function getData() { ... }'
      ]
    },
    // 学习助手
    {
      id: 'concept-explainer',
      name: '概念解释器',
      category: '学习',
      icon: '📚',
      description: '深入浅出地解释复杂概念',
      template: '请用{level}的方式解释{concept}这个概念。\n1. 背景：{background}\n2. 目标受众：{audience}\n3. 包含：定义、原理、实例、应用场景\n4. 类比：{analogy}\n5. 避免：{avoid}',
      variables: ['level', 'concept', 'background', 'audience', 'analogy', 'avoid'],
      examples: [
        'level: 通俗易懂\nconcept: 区块链\nbackground: 计算机基础\naudience: 初学者\nanalogy: 用账本类比\navoid: 过于技术的术语'
      ]
    },
    {
      id: 'study-plan',
      name: '学习计划生成',
      category: '学习',
      icon: '📅',
      description: '定制个性化学习路径',
      template: '请为我制定一个学习{subject}的计划：\n当前水平：{currentLevel}\n目标水平：{targetLevel}\n可用时间：{timeAvailable}\n学习偏好：{preference}\n重点领域：{focus}\n时间期限：{deadline}',
      variables: ['subject', 'currentLevel', 'targetLevel', 'timeAvailable', 'preference', 'focus', 'deadline'],
      examples: [
        'subject: Python编程\ncurrentLevel: 零基础\ntargetLevel: 能独立开发项目\ntimeAvailable: 每天2小时\npreference: 实践为主\nfocus: Web开发\ndeadline: 3个月'
      ]
    },
    // 创意助手
    {
      id: 'brainstorm',
      name: '创意头脑风暴',
      category: '创意',
      icon: '💡',
      description: '激发创意灵感',
      template: '让我们进行一次关于{topic}的头脑风暴。\n目标：{goal}\n限制条件：{constraints}\n目标用户：{targetUser}\n创新程度：{innovation}\n请提供{count}个创意想法，每个包含：名称、描述、优势、潜在挑战。',
      variables: ['topic', 'goal', 'constraints', 'targetUser', 'innovation', 'count'],
      examples: [
        'topic: 新产品功能\ngoal: 提升用户参与度\nconstraints: 预算有限\ntargetUser: 年轻用户\ninnovation: 突破性\ncount: 5'
      ]
    },
    {
      id: 'story-writer',
      name: '故事创作助手',
      category: '创意',
      icon: '📖',
      description: '创作引人入胜的故事',
      template: '请创作一个{genre}类型的故事：\n主题：{theme}\n角色设定：{characters}\n背景设定：{setting}\n情节要素：{plotElements}\n风格：{style}\n长度：{length}',
      variables: ['genre', 'theme', 'characters', 'setting', 'plotElements', 'style', 'length'],
      examples: [
        'genre: 科幻\ntheme: 人工智能觉醒\ncharacters: 科学家、AI系统\nsetting: 2050年的研究所\nplotElements: 悬疑、转折\nstyle: 紧张刺激\nlength: 1500字'
      ]
    },
    // 分析助手
    {
      id: 'data-analyzer',
      name: '数据分析助手',
      category: '分析',
      icon: '📊',
      description: '深度数据分析和洞察',
      template: '请分析以下{dataType}数据：\n数据描述：{dataDescription}\n分析目标：{objective}\n关注指标：{metrics}\n分析维度：{dimensions}\n输出格式：{outputFormat}\n\n请提供：数据概览、关键发现、趋势分析、建议行动。',
      variables: ['dataType', 'dataDescription', 'objective', 'metrics', 'dimensions', 'outputFormat'],
      examples: [
        'dataType: 销售数据\ndataDescription: 过去6个月的销售记录\nobjective: 提升销售额\nmetrics: 销售额、转化率、客单价\ndimensions: 时间、地区、产品类别\noutputFormat: 可视化图表+文字说明'
      ]
    },
    // 翻译助手
    {
      id: 'translator',
      name: '专业翻译助手',
      category: '语言',
      icon: '🌐',
      description: '准确流畅的专业翻译',
      template: '请将以下{sourceLanguage}文本翻译成{targetLanguage}：\n文本类型：{textType}\n专业领域：{domain}\n语言风格：{style}\n目标读者：{audience}\n特殊要求：{requirements}\n\n原文：\n{text}',
      variables: ['sourceLanguage', 'targetLanguage', 'textType', 'domain', 'style', 'audience', 'requirements', 'text'],
      examples: [
        'sourceLanguage: 英语\ntargetLanguage: 中文\ntextType: 技术文档\ndomain: 软件开发\nstyle: 专业准确\naudience: 开发者\nrequirements: 保留专业术语\ntext: [待翻译文本]'
      ]
    }
  ]

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))]

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
      const matchesSearch = searchQuery === '' ||
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery, templates])

  const handleSelectTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template)
    // 初始化变量
    const initialVars: Record<string, string> = {}
    template.variables.forEach(v => {
      initialVars[v] = ''
    })
    setVariables(initialVars)
    setGeneratedPrompt('')
  }

  const handleGeneratePrompt = () => {
    if (!selectedTemplate) return

    let prompt = selectedTemplate.template
    Object.entries(variables).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `[${key}]`)
    })

    setGeneratedPrompt(prompt)
    toast.success('提示词已生成')
  }

  const handleUsePrompt = () => {
    if (!generatedPrompt) {
      toast.error('请先生成提示词')
      return
    }

    onUsePrompt(generatedPrompt)
    toast.success('提示词已应用到输入框')
    onClose()
  }

  const handleCopyPrompt = () => {
    if (!generatedPrompt) {
      toast.error('请先生成提示词')
      return
    }

    navigator.clipboard.writeText(generatedPrompt)
    toast.success('已复制到剪贴板')
  }

  const handleLoadExample = () => {
    if (!selectedTemplate || !selectedTemplate.examples[0]) return

    const example = selectedTemplate.examples[0]
    const lines = example.split('\n')
    const newVars: Record<string, string> = {}

    lines.forEach(line => {
      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim()
      if (key && value) {
        newVars[key.trim()] = value
      }
    })

    setVariables(newVars)
    toast.success('示例已加载')
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ElementType> = {
      '写作': PaintBrushIcon,
      '编程': CodeBracketIcon,
      '学习': AcademicCapIcon,
      '创意': LightBulbIcon,
      '分析': BeakerIcon,
      '语言': ChatBubbleLeftRightIcon
    }
    return icons[category] || SparklesIcon
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                智能提示词生成器
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                使用专业模板快速生成高质量提示词
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XMarkIcon className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Templates List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索模板..."
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Categories */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      selectedCategory === cat
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    {cat === 'all' ? '全部' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Templates */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredTemplates.map((template, index) => {
                  const Icon = getCategoryIcon(template.category)
                  return (
                    <motion.button
                      key={template.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelectTemplate(template)}
                      className={cn(
                        'w-full p-3 rounded-lg border text-left transition-all',
                        selectedTemplate?.id === template.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                          : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{template.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                            {template.name}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              <Icon className="w-3 h-3 mr-1" />
                              {template.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {template.variables.length} 变量
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col">
            {selectedTemplate ? (
              <>
                {/* Template Info */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {selectedTemplate.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedTemplate.description}
                      </p>
                    </div>
                    {selectedTemplate.examples.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLoadExample}
                      >
                        加载示例
                      </Button>
                    )}
                  </div>
                </div>

                {/* Variables Form */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4 max-w-2xl">
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {variable}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <textarea
                          value={variables[variable] || ''}
                          onChange={(e) =>
                            setVariables(prev => ({ ...prev, [variable]: e.target.value }))
                          }
                          placeholder={`请输入${variable}...`}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                          rows={3}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-6">
                    <Button onClick={handleGeneratePrompt} className="flex-1">
                      <SparklesIcon className="w-4 h-4 mr-2" />
                      生成提示词
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setVariables({})}
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Generated Prompt */}
                  {generatedPrompt && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          生成的提示词
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCopyPrompt}
                        >
                          <DocumentDuplicateIcon className="w-4 h-4 mr-1" />
                          复制
                        </Button>
                      </div>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-4 rounded-lg">
                          {generatedPrompt}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <SparklesIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    请从左侧选择一个模板开始
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {selectedTemplate && generatedPrompt && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💡 提示：生成的提示词可以根据需要进一步调整
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                取消
              </Button>
              <Button onClick={handleUsePrompt}>
                使用此提示词
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default PromptGenerator
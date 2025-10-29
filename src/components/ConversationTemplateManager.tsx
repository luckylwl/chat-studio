import React, { useState } from 'react'
import {
  BookmarkIcon,
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  FolderIcon,
  CodeBracketIcon,
  ChatBubbleBottomCenterTextIcon,
  AcademicCapIcon,
  LightBulbIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline'
import { Button, Badge, Card } from './ui'
import { cn } from '@/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useAppStore } from '@/store'

interface ConversationTemplateManagerProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: ConversationTemplate) => void
}

export interface ConversationTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  systemPrompt: string
  initialMessages?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  model?: string
  temperature?: number
  createdAt: number
}

type TemplateCategory = 'general' | 'coding' | 'writing' | 'learning' | 'business' | 'creative'

const CATEGORY_INFO: Record<TemplateCategory, { name: string; icon: any; color: string }> = {
  general: { name: '通用', icon: ChatBubbleBottomCenterTextIcon, color: 'gray' },
  coding: { name: '编程', icon: CodeBracketIcon, color: 'blue' },
  writing: { name: '写作', icon: PencilIcon, color: 'green' },
  learning: { name: '学习', icon: AcademicCapIcon, color: 'purple' },
  business: { name: '商务', icon: BriefcaseIcon, color: 'orange' },
  creative: { name: '创意', icon: LightBulbIcon, color: 'pink' }
}

const DEFAULT_TEMPLATES: ConversationTemplate[] = [
  {
    id: 'template_general_assistant',
    name: '通用助手',
    description: '全能型 AI 助手，可以回答各种问题',
    category: 'general',
    systemPrompt: '你是一个友好、专业的 AI 助手，致力于帮助用户解决各种问题。',
    createdAt: Date.now()
  },
  {
    id: 'template_code_review',
    name: '代码审查',
    description: '专业的代码审查助手，提供代码质量建议',
    category: 'coding',
    systemPrompt: '你是一位经验丰富的高级开发工程师，擅长代码审查。请仔细分析代码的质量、性能、安全性和最佳实践，并提供详细的改进建议。',
    model: 'gpt-4',
    temperature: 0.3,
    createdAt: Date.now()
  },
  {
    id: 'template_creative_writing',
    name: '创意写作',
    description: '激发创意，帮助你完成优秀的写作',
    category: 'writing',
    systemPrompt: '你是一位富有创造力的写作导师，擅长激发灵感，帮助用户创作优秀的文章、故事和文案。',
    temperature: 0.9,
    createdAt: Date.now()
  },
  {
    id: 'template_language_tutor',
    name: '语言学习',
    description: '个性化语言学习导师',
    category: 'learning',
    systemPrompt: '你是一位耐心的语言学习导师，会根据学生的水平调整教学方式，提供清晰的解释和实用的练习。',
    createdAt: Date.now()
  },
  {
    id: 'template_business_consultant',
    name: '商业顾问',
    description: '提供专业的商业建议和战略规划',
    category: 'business',
    systemPrompt: '你是一位经验丰富的商业顾问，擅长市场分析、战略规划和商业决策。请用专业、严谨的语言提供建议。',
    model: 'gpt-4',
    temperature: 0.5,
    createdAt: Date.now()
  },
  {
    id: 'template_brainstorming',
    name: '头脑风暴',
    description: '激发创新想法的创意伙伴',
    category: 'creative',
    systemPrompt: '你是一个充满创意的头脑风暴伙伴，善于从不同角度思考问题，提供新颖的想法和解决方案。不要害怕提出大胆的想法！',
    temperature: 0.95,
    createdAt: Date.now()
  }
]

const ConversationTemplateManager: React.FC<ConversationTemplateManagerProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  const [templates, setTemplates] = useState<ConversationTemplate[]>(DEFAULT_TEMPLATES)
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all')
  const [isCreating, setIsCreating] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<ConversationTemplate | null>(null)

  // 表单状态
  const [formData, setFormData] = useState<Partial<ConversationTemplate>>({
    name: '',
    description: '',
    category: 'general',
    systemPrompt: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7
  })

  // 过滤模板
  const filteredTemplates = templates.filter(template =>
    selectedCategory === 'all' || template.category === selectedCategory
  )

  // 保存模板
  const saveTemplate = () => {
    if (!formData.name || !formData.systemPrompt) {
      toast.error('请填写模板名称和系统提示词')
      return
    }

    if (editingTemplate) {
      // 更新现有模板
      setTemplates(templates.map(t =>
        t.id === editingTemplate.id
          ? { ...editingTemplate, ...formData } as ConversationTemplate
          : t
      ))
      toast.success('模板已更新')
    } else {
      // 创建新模板
      const newTemplate: ConversationTemplate = {
        id: `template_${Date.now()}`,
        name: formData.name!,
        description: formData.description || '',
        category: formData.category as TemplateCategory,
        systemPrompt: formData.systemPrompt!,
        model: formData.model,
        temperature: formData.temperature,
        createdAt: Date.now()
      }
      setTemplates([...templates, newTemplate])
      toast.success('模板已创建')
    }

    resetForm()
  }

  // 删除模板
  const deleteTemplate = (id: string) => {
    if (confirm('确定要删除这个模板吗？')) {
      setTemplates(templates.filter(t => t.id !== id))
      toast.success('模板已删除')
    }
  }

  // 编辑模板
  const startEdit = (template: ConversationTemplate) => {
    setEditingTemplate(template)
    setFormData(template)
    setIsCreating(true)
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'general',
      systemPrompt: '',
      model: 'gpt-3.5-turbo',
      temperature: 0.7
    })
    setEditingTemplate(null)
    setIsCreating(false)
  }

  // 应用模板
  const applyTemplate = (template: ConversationTemplate) => {
    onSelectTemplate(template)
    toast.success(`已应用模板: ${template.name}`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl max-h-[90vh] rounded-xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <BookmarkIcon className="w-6 h-6 text-purple-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                对话模板管理
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                保存和管理常用的对话场景
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!isCreating ? (
            <div className="space-y-6">
              {/* Category Filter & Create Button */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                      selectedCategory === 'all'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    全部 ({templates.length})
                  </button>
                  {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                    const count = templates.filter(t => t.category === key).length
                    const Icon = info.icon
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedCategory(key as TemplateCategory)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          selectedCategory === key
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {info.name} ({count})
                      </button>
                    )
                  })}
                </div>
                <Button onClick={() => setIsCreating(true)}>
                  <PlusIcon className="w-5 h-5 mr-2" />
                  创建模板
                </Button>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredTemplates.map(template => {
                    const categoryInfo = CATEGORY_INFO[template.category]
                    const Icon = categoryInfo.icon
                    return (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer group">
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={cn(
                                  'p-2 rounded-lg',
                                  `bg-${categoryInfo.color}-100 dark:bg-${categoryInfo.color}-900/20`
                                )}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                    {template.name}
                                  </h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                                    {template.description}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Tags */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary">
                                {categoryInfo.name}
                              </Badge>
                              {template.model && (
                                <Badge variant="info">{template.model}</Badge>
                              )}
                              {template.temperature !== undefined && (
                                <Badge variant="secondary">
                                  Temp: {template.temperature}
                                </Badge>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => applyTemplate(template)}
                                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                使用
                              </button>
                              <button
                                onClick={() => startEdit(template)}
                                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                title="编辑"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteTemplate(template.id)}
                                className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
                                title="删除"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <FolderIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    该分类下暂无模板
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingTemplate ? '编辑模板' : '创建新模板'}
              </h3>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    模板名称 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="给模板起个名字"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    描述
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="简短描述模板的用途"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    分类
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as TemplateCategory })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                      <option key={key} value={key}>{info.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    系统提示词 *
                  </label>
                  <textarea
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={6}
                    placeholder="定义 AI 的角色和行为方式..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      默认模型
                    </label>
                    <select
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="claude-3-opus">Claude 3 Opus</option>
                      <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      <option value="gemini-pro">Gemini Pro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Temperature
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="2"
                      step="0.1"
                      value={formData.temperature}
                      onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="secondary" onClick={resetForm} className="flex-1">
                  取消
                </Button>
                <Button onClick={saveTemplate} className="flex-1">
                  <CheckIcon className="w-5 h-5 mr-2" />
                  {editingTemplate ? '保存更改' : '创建模板'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ConversationTemplateManager

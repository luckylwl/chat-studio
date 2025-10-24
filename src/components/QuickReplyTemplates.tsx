import React, { useState } from 'react'
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  FolderIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { Button, Input, Textarea, Modal } from '@/components/ui'
import { cn } from '@/utils'

export interface QuickReplyTemplate {
  id: string
  title: string
  content: string
  category: string
  isFavorite: boolean
  usageCount: number
  createdAt: number
  updatedAt: number
}

interface QuickReplyTemplatesProps {
  isOpen: boolean
  onClose: () => void
  onTemplateSelect: (template: QuickReplyTemplate) => void
}

// 默认模板
const DEFAULT_TEMPLATES: QuickReplyTemplate[] = [
  {
    id: '1',
    title: '请解释',
    content: '请详细解释一下[主题],包括其核心概念、应用场景和重要性。',
    category: '学习',
    isFavorite: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: '2',
    title: '代码审查',
    content: '请审查以下代码,指出潜在问题、性能优化建议和最佳实践:\n\n```\n[粘贴代码]\n```',
    category: '编程',
    isFavorite: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: '3',
    title: '翻译',
    content: '请将以下内容翻译成[目标语言],保持专业性和准确性:\n\n[待翻译内容]',
    category: '工具',
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: '4',
    title: '写邮件',
    content: '请帮我撰写一封专业的邮件:\n收件人: [收件人]\n主题: [主题]\n要点:\n- [要点1]\n- [要点2]',
    category: '写作',
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: '5',
    title: '总结文章',
    content: '请总结以下文章的核心内容,提炼关键要点(控制在300字以内):\n\n[文章内容]',
    category: '学习',
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: '6',
    title: '优化代码',
    content: '请优化以下代码,提高性能、可读性和可维护性:\n\n```\n[代码]\n```\n\n重点关注: [优化重点]',
    category: '编程',
    isFavorite: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: '7',
    title: '头脑风暴',
    content: '针对[问题/主题],请帮我进行头脑风暴,提供至少5个创新想法或解决方案。',
    category: '创意',
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: '8',
    title: '调试帮助',
    content: '我遇到了以下错误:\n\n```\n[错误信息]\n```\n\n相关代码:\n```\n[代码片段]\n```\n\n请帮我分析原因并提供解决方案。',
    category: '编程',
    isFavorite: false,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
]

/**
 * 快速回复模板组件
 * 功能:
 * - 预设模板库
 * - 自定义模板
 * - 分类管理
 * - 收藏功能
 * - 使用统计
 */
export const QuickReplyTemplates: React.FC<QuickReplyTemplatesProps> = ({
  isOpen,
  onClose,
  onTemplateSelect
}) => {
  const [templates, setTemplates] = useState<QuickReplyTemplate[]>(() => {
    // 从localStorage加载模板
    const saved = localStorage.getItem('quickReplyTemplates')
    return saved ? JSON.parse(saved) : DEFAULT_TEMPLATES
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('全部')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<QuickReplyTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // 保存模板到localStorage
  const saveTemplates = (newTemplates: QuickReplyTemplate[]) => {
    setTemplates(newTemplates)
    localStorage.setItem('quickReplyTemplates', JSON.stringify(newTemplates))
  }

  // 获取所有分类
  const categories = ['全部', ...Array.from(new Set(templates.map(t => t.category)))]

  // 过滤模板
  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      !searchQuery ||
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      selectedCategory === '全部' || template.category === selectedCategory

    const matchesFavorite = !showFavoritesOnly || template.isFavorite

    return matchesSearch && matchesCategory && matchesFavorite
  }).sort((a, b) => {
    // 收藏的排在前面,然后按使用次数排序
    if (a.isFavorite !== b.isFavorite) {
      return a.isFavorite ? -1 : 1
    }
    return b.usageCount - a.usageCount
  })

  // 选择模板
  const handleSelectTemplate = (template: QuickReplyTemplate) => {
    // 更新使用次数
    const updatedTemplates = templates.map(t =>
      t.id === template.id
        ? { ...t, usageCount: t.usageCount + 1, updatedAt: Date.now() }
        : t
    )
    saveTemplates(updatedTemplates)

    onTemplateSelect(template)
    onClose()
  }

  // 切换收藏
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updatedTemplates = templates.map(t =>
      t.id === id ? { ...t, isFavorite: !t.isFavorite, updatedAt: Date.now() } : t
    )
    saveTemplates(updatedTemplates)
  }

  // 编辑模板
  const handleEdit = (template: QuickReplyTemplate, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTemplate({ ...template })
  }

  // 删除模板
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('确定要删除此模板吗?')) {
      const updatedTemplates = templates.filter(t => t.id !== id)
      saveTemplates(updatedTemplates)
    }
  }

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingTemplate) return

    const updatedTemplates = templates.map(t =>
      t.id === editingTemplate.id
        ? { ...editingTemplate, updatedAt: Date.now() }
        : t
    )
    saveTemplates(updatedTemplates)
    setEditingTemplate(null)
  }

  // 创建新模板
  const handleCreate = () => {
    setEditingTemplate({
      id: Date.now().toString(),
      title: '',
      content: '',
      category: '自定义',
      isFavorite: false,
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    setIsCreating(true)
  }

  // 保存新模板
  const handleSaveNew = () => {
    if (!editingTemplate || !editingTemplate.title || !editingTemplate.content) {
      alert('请填写标题和内容')
      return
    }

    saveTemplates([...templates, editingTemplate])
    setEditingTemplate(null)
    setIsCreating(false)
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="快速回复模板"
        size="lg"
      >
        <div className="flex flex-col h-[600px]">
          {/* 搜索和筛选 */}
          <div className="flex-shrink-0 space-y-3 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索模板..."
                className="flex-1"
              />
              <Button onClick={handleCreate} variant="primary" size="sm">
                <PlusIcon className="w-4 h-4 mr-1" />
                新建
              </Button>
            </div>

            {/* 分类标签 */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                    selectedCategory === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  )}
                >
                  {category}
                </button>
              ))}

              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1 transition-colors',
                  showFavoritesOnly
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                <StarIcon className="w-4 h-4" />
                收藏
              </button>
            </div>
          </div>

          {/* 模板列表 */}
          <div className="flex-1 overflow-y-auto mt-4">
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <ChatBubbleLeftRightIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">没有找到模板</p>
                <p className="text-sm">尝试其他搜索条件或创建新模板</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="relative group text-left p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200"
                  >
                    {/* 标题和操作按钮 */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex-1 pr-2">
                        {template.title}
                      </h3>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => toggleFavorite(template.id, e)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          {template.isFavorite ? (
                            <StarSolidIcon className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <StarIcon className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={(e) => handleEdit(template, e)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <PencilIcon className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(template.id, e)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <TrashIcon className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* 分类和使用次数 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {template.category}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        使用 {template.usageCount} 次
                      </span>
                    </div>

                    {/* 内容预览 */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {template.content}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* 编辑/创建模板对话框 */}
      <Modal
        isOpen={!!editingTemplate}
        onClose={() => {
          setEditingTemplate(null)
          setIsCreating(false)
        }}
        title={isCreating ? '创建模板' : '编辑模板'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              标题
            </label>
            <Input
              type="text"
              value={editingTemplate?.title || ''}
              onChange={(e) =>
                setEditingTemplate(prev =>
                  prev ? { ...prev, title: e.target.value } : null
                )
              }
              placeholder="输入模板标题..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              分类
            </label>
            <Input
              type="text"
              value={editingTemplate?.category || ''}
              onChange={(e) =>
                setEditingTemplate(prev =>
                  prev ? { ...prev, category: e.target.value } : null
                )
              }
              placeholder="输入分类..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              内容
            </label>
            <Textarea
              value={editingTemplate?.content || ''}
              onChange={(e) =>
                setEditingTemplate(prev =>
                  prev ? { ...prev, content: e.target.value } : null
                )
              }
              placeholder="输入模板内容...&#10;使用 [占位符] 标记需要替换的部分"
              rows={10}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setEditingTemplate(null)
                setIsCreating(false)
              }}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={isCreating ? handleSaveNew : handleSaveEdit}
            >
              保存
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default QuickReplyTemplates

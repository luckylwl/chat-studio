import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  HeartIcon,
  ClockIcon,
  FireIcon,
  SparklesIcon,
  PlusIcon,
  FolderIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import {
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIcon
} from '@heroicons/react/24/solid'
import { Button, Input, Badge } from './ui'
import templateService, { ConversationTemplate, TemplateCategory } from '@/services/templateService'
import { useAppStore } from '@/store'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils'

interface ConversationTemplatesProps {
  isOpen: boolean
  onClose: () => void
  onTemplateSelect: (template: ConversationTemplate) => void
}

const ConversationTemplates: React.FC<ConversationTemplatesProps> = ({
  isOpen,
  onClose,
  onTemplateSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'browse' | 'favorites' | 'recent' | 'popular'>('browse')
  const [templates, setTemplates] = useState<ConversationTemplate[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [favorites, setFavorites] = useState<ConversationTemplate[]>([])
  const [recent, setRecent] = useState<ConversationTemplate[]>([])
  const [popular, setPopular] = useState<ConversationTemplate[]>([])

  const { createConversation, setCurrentConversation } = useAppStore()

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  const loadTemplates = () => {
    setTemplates(templateService.getAllTemplates())
    setCategories(templateService.getCategories())
    setFavorites(templateService.getFavoriteTemplates())
    setRecent(templateService.getRecentTemplates())
    setPopular(templateService.getPopularTemplates())
  }

  const filteredTemplates = () => {
    let filtered = templates

    // 按分类筛选
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    // 按搜索词筛选
    if (searchQuery) {
      filtered = templateService.searchTemplates(searchQuery)
    }

    return filtered
  }

  const getDisplayTemplates = () => {
    switch (activeTab) {
      case 'favorites':
        return favorites
      case 'recent':
        return recent
      case 'popular':
        return popular
      default:
        return filteredTemplates()
    }
  }

  const handleTemplateSelect = (template: ConversationTemplate) => {
    const usedTemplate = templateService.useTemplate(template.id)
    if (usedTemplate) {
      onTemplateSelect(usedTemplate)
      loadTemplates() // 刷新数据
      onClose()
      toast.success(`已应用模板：${template.name}`)
    }
  }

  const handleFavoriteToggle = (templateId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    const isFavorite = templateService.toggleFavorite(templateId)
    toast.success(isFavorite ? '已添加到收藏' : '已取消收藏')
    loadTemplates()
  }

  const TemplateCard: React.FC<{ template: ConversationTemplate }> = ({ template }) => {
    const isFavorite = templateService.isFavorite(template.id)

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -2 }}
        className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
        onClick={() => handleTemplateSelect(template)}
      >
        {/* 收藏按钮 */}
        <button
          onClick={(e) => handleFavoriteToggle(template.id, e)}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white dark:hover:bg-gray-700"
        >
          {isFavorite ? (
            <HeartSolidIcon className="w-4 h-4 text-red-500" />
          ) : (
            <HeartIcon className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {/* 模板图标 */}
        <div className="p-4 pb-2">
          <div className="text-3xl mb-3">{template.icon}</div>

          {/* 模板信息 */}
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {template.name}
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {template.description}
          </p>

          {/* 标签 */}
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>

          {/* 底部信息 */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <UsersIcon className="w-3 h-3" />
                {template.usage}
              </div>
              {template.rating > 0 && (
                <div className="flex items-center gap-1">
                  <StarSolidIcon className="w-3 h-3 text-yellow-400" />
                  {template.rating.toFixed(1)}
                </div>
              )}
            </div>

            {template.isBuiltIn && (
              <Badge variant="outline" className="text-xs">
                内置
              </Badge>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  const TabButton: React.FC<{
    active: boolean
    onClick: () => void
    children: React.ReactNode
  }> = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full justify-start px-3 py-2 rounded-lg text-sm transition-colors",
        active
          ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
    >
      {children}
    </button>
  )

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                对话模板
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                选择预设模板快速开始专业对话
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              创建模板
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex h-[calc(100%-80px)]">
          {/* 侧边栏 */}
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
            {/* 搜索 */}
            <div className="relative mb-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 标签页 */}
            <div className="space-y-1 mb-4">
              <TabButton
                active={activeTab === 'browse'}
                onClick={() => setActiveTab('browse')}
              >
                <FolderIcon className="w-4 h-4" />
                浏览
              </TabButton>
              <TabButton
                active={activeTab === 'favorites'}
                onClick={() => setActiveTab('favorites')}
              >
                <HeartIcon className="w-4 h-4" />
                收藏 ({favorites.length})
              </TabButton>
              <TabButton
                active={activeTab === 'recent'}
                onClick={() => setActiveTab('recent')}
              >
                <ClockIcon className="w-4 h-4" />
                最近使用
              </TabButton>
              <TabButton
                active={activeTab === 'popular'}
                onClick={() => setActiveTab('popular')}
              >
                <FireIcon className="w-4 h-4" />
                热门
              </TabButton>
            </div>

            {/* 分类筛选 */}
            {activeTab === 'browse' && (
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">分类</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      selectedCategory === 'all'
                        ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    全部分类
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                        selectedCategory === category.id
                          ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      <span>{category.icon}</span>
                      {category.name}
                      <span className="ml-auto text-xs">
                        {category.templates.length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 主内容区 */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {getDisplayTemplates().map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </AnimatePresence>
            </div>

            {getDisplayTemplates().length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <SparklesIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  没有找到模板
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  {searchQuery ? '尝试调整搜索关键词或选择其他分类' : '当前分类下暂无模板'}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ConversationTemplates
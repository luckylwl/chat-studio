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
import promptTemplateService, {
  PromptTemplate,
  TemplateCategory,
  TemplateCollection,
  TemplateAnalytics,
  TemplateVariable,
  TemplateOptimization
} from '@/services/promptTemplateService'
import {
  DocumentTextIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TagIcon,
  StarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  ClipboardDocumentIcon,
  ShareIcon,
  ChartBarIcon,
  SparklesIcon,
  ClockIcon,
  UserIcon,
  FolderIcon,
  CodeBracketIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  FireIcon,
  BookmarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

const PromptTemplateDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('templates')
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [collections, setCollections] = useState<TemplateCollection[]>([])
  const [analytics, setAnalytics] = useState<TemplateAnalytics | null>(null)
  const [optimizations, setOptimizations] = useState<TemplateOptimization[]>([])
  const [loading, setLoading] = useState(false)

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'usage' | 'created' | 'updated'>('updated')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [showOptimizeModal, setShowOptimizeModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)

  // Form states
  const [templateForm, setTemplateForm] = useState<Partial<PromptTemplate>>({
    name: '',
    description: '',
    content: '',
    category: '',
    tags: [],
    variables: [],
    isPublic: true,
    language: 'zh-CN',
    modelCompatibility: ['gpt-4']
  })
  const [testVariables, setTestVariables] = useState<{ [key: string]: any }>({})
  const [testResult, setTestResult] = useState<{ content: string; errors: string[] }>({ content: '', errors: [] })

  const tabs = [
    { id: 'templates', name: '模板库', icon: <DocumentTextIcon className="h-5 w-5" /> },
    { id: 'collections', name: '收藏夹', icon: <FolderIcon className="h-5 w-5" /> },
    { id: 'analytics', name: '数据分析', icon: <ChartBarIcon className="h-5 w-5" /> },
    { id: 'optimize', name: '智能优化', icon: <SparklesIcon className="h-5 w-5" /> }
  ]

  useEffect(() => {
    loadData()

    // Listen for service events
    const handleTemplateCreated = (template: PromptTemplate) => {
      setTemplates(prev => [template, ...prev])
      toast.success('模板创建成功')
    }

    const handleTemplateUpdated = (template: PromptTemplate) => {
      setTemplates(prev => prev.map(t => t.id === template.id ? template : t))
      toast.success('模板更新成功')
    }

    const handleTemplateDeleted = (templateId: string) => {
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      toast.success('模板删除成功')
    }

    promptTemplateService.on('templateCreated', handleTemplateCreated)
    promptTemplateService.on('templateUpdated', handleTemplateUpdated)
    promptTemplateService.on('templateDeleted', handleTemplateDeleted)

    return () => {
      promptTemplateService.off('templateCreated', handleTemplateCreated)
      promptTemplateService.off('templateUpdated', handleTemplateUpdated)
      promptTemplateService.off('templateDeleted', handleTemplateDeleted)
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [
        templatesData,
        categoriesData,
        collectionsData,
        analyticsData,
        optimizationsData
      ] = await Promise.all([
        promptTemplateService.getTemplates({
          search: searchQuery,
          category: selectedCategory || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          sortBy,
          sortOrder
        }),
        promptTemplateService.getCategories(),
        promptTemplateService.getCollections(),
        promptTemplateService.getAnalytics(),
        promptTemplateService.getOptimizations()
      ])

      setTemplates(templatesData.templates)
      setCategories(categoriesData)
      setCollections(collectionsData)
      setAnalytics(analyticsData)
      setOptimizations(optimizationsData)
    } catch (error) {
      console.error('Failed to load prompt template data:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.content) {
      toast.error('请填写模板名称和内容')
      return
    }

    setLoading(true)
    try {
      await promptTemplateService.createTemplate({
        name: templateForm.name!,
        description: templateForm.description || '',
        content: templateForm.content!,
        category: templateForm.category || categories[0]?.id || 'general',
        tags: templateForm.tags || [],
        variables: templateForm.variables || [],
        version: '1.0.0',
        author: 'User',
        isPublic: templateForm.isPublic || false,
        isEditable: true,
        language: templateForm.language || 'zh-CN',
        modelCompatibility: templateForm.modelCompatibility || ['gpt-4'],
        examples: [],
        metadata: {
          complexity: 'medium',
          useCase: [],
          industry: [],
          estimatedTokens: templateForm.content?.length || 0,
          performance: {
            successRate: 0,
            avgResponseTime: 0,
            avgQualityScore: 0
          },
          optimizationSuggestions: []
        }
      })

      setShowCreateModal(false)
      resetForm()
      await loadData()
    } catch (error) {
      console.error('Failed to create template:', error)
      toast.error('创建模板失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate || !templateForm.name || !templateForm.content) {
      toast.error('请填写完整信息')
      return
    }

    setLoading(true)
    try {
      await promptTemplateService.updateTemplate(selectedTemplate.id, {
        name: templateForm.name!,
        description: templateForm.description || '',
        content: templateForm.content!,
        category: templateForm.category!,
        tags: templateForm.tags || [],
        variables: templateForm.variables || []
      })

      setShowEditModal(false)
      setSelectedTemplate(null)
      resetForm()
      await loadData()
    } catch (error) {
      console.error('Failed to update template:', error)
      toast.error('更新模板失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('确定要删除这个模板吗？')) return

    setLoading(true)
    try {
      await promptTemplateService.deleteTemplate(templateId)
      await loadData()
    } catch (error) {
      console.error('Failed to delete template:', error)
      toast.error('删除模板失败')
    } finally {
      setLoading(false)
    }
  }

  const handleTestTemplate = async () => {
    if (!selectedTemplate) return

    setLoading(true)
    try {
      const result = await promptTemplateService.renderTemplate(selectedTemplate.id, testVariables)
      setTestResult(result)
    } catch (error) {
      console.error('Failed to test template:', error)
      toast.error('测试模板失败')
    } finally {
      setLoading(false)
    }
  }

  const handleOptimizeTemplate = async (templateId: string) => {
    setLoading(true)
    try {
      const optimization = await promptTemplateService.optimizeTemplate(templateId)
      setOptimizations(prev => [optimization, ...prev])
      toast.success('模板优化建议已生成')
    } catch (error) {
      console.error('Failed to optimize template:', error)
      toast.error('优化模板失败')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyOptimization = async (optimizationId: string) => {
    setLoading(true)
    try {
      await promptTemplateService.applyOptimization(optimizationId)
      await loadData()
      toast.success('优化建议已应用')
    } catch (error) {
      console.error('Failed to apply optimization:', error)
      toast.error('应用优化失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRateTemplate = async (templateId: string, rating: number) => {
    try {
      await promptTemplateService.rateTemplate(templateId, rating)
      await loadData()
    } catch (error) {
      console.error('Failed to rate template:', error)
      toast.error('评分失败')
    }
  }

  const resetForm = () => {
    setTemplateForm({
      name: '',
      description: '',
      content: '',
      category: '',
      tags: [],
      variables: [],
      isPublic: true,
      language: 'zh-CN',
      modelCompatibility: ['gpt-4']
    })
  }

  const openEditModal = (template: PromptTemplate) => {
    setSelectedTemplate(template)
    setTemplateForm({
      name: template.name,
      description: template.description,
      content: template.content,
      category: template.category,
      tags: template.tags,
      variables: template.variables,
      isPublic: template.isPublic,
      language: template.language,
      modelCompatibility: template.modelCompatibility
    })
    setShowEditModal(true)
  }

  const openTestModal = (template: PromptTemplate) => {
    setSelectedTemplate(template)
    setTestVariables({})
    setTestResult({ content: '', errors: [] })
    setShowTestModal(true)
  }

  const getVariableInput = (variable: TemplateVariable) => {
    const value = testVariables[variable.name] || variable.defaultValue || ''

    switch (variable.type) {
      case 'select':
        return (
          <Select
            options={variable.options?.map(opt => ({ value: opt, label: opt })) || []}
            value={value}
            onChange={(newValue) => setTestVariables(prev => ({ ...prev, [variable.name]: newValue }))}
            placeholder={`选择${variable.description}`}
          />
        )
      case 'multiline':
        return (
          <Textarea
            value={value}
            onChange={(e) => setTestVariables(prev => ({ ...prev, [variable.name]: e.target.value }))}
            placeholder={variable.description}
            rows={3}
          />
        )
      case 'boolean':
        return (
          <Switch
            checked={Boolean(value)}
            onChange={(e) => setTestVariables(prev => ({ ...prev, [variable.name]: e.target.checked }))}
            label={variable.description}
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setTestVariables(prev => ({ ...prev, [variable.name]: Number(e.target.value) }))}
            placeholder={variable.description}
            min={variable.validation?.min}
            max={variable.validation?.max}
          />
        )
      default:
        return (
          <Input
            value={value}
            onChange={(e) => setTestVariables(prev => ({ ...prev, [variable.name]: e.target.value }))}
            placeholder={variable.description}
            type={variable.type === 'email' ? 'email' : variable.type === 'url' ? 'url' : 'text'}
          />
        )
    }
  }

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    return category?.icon || '📄'
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId)
    switch (category?.color) {
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'green': return 'bg-green-100 text-green-800 border-green-200'
      case 'purple': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'red': return 'bg-red-100 text-red-800 border-red-200'
      case 'orange': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'teal': return 'bg-teal-100 text-teal-800 border-teal-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading && !templates.length && !analytics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-500 dark:text-gray-400">加载提示词模板...</p>
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
            提示词模板管理
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            创建、管理和优化AI提示词模板，提升对话质量
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          新建模板
        </Button>
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

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <Input
                    placeholder="搜索模板..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && loadData()}
                    leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
                  />
                </div>
                <Select
                  options={[
                    { value: '', label: '所有分类' },
                    ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                  ]}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="分类筛选"
                />
                <Select
                  options={[
                    { value: 'updated', label: '更新时间' },
                    { value: 'created', label: '创建时间' },
                    { value: 'rating', label: '评分' },
                    { value: 'usage', label: '使用次数' },
                    { value: 'name', label: '名称' }
                  ]}
                  value={sortBy}
                  onChange={(value) => setSortBy(value as any)}
                />
                <Button onClick={loadData} variant="outline">
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  刷新
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold line-clamp-2">
                          {template.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <Badge className={getCategoryColor(template.category)}>
                          {getCategoryIcon(template.category)} {categories.find(c => c.id === template.category)?.name}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Tags */}
                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {template.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {template.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{template.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-4 w-4 text-yellow-500" />
                          <span>{template.rating.toFixed(1)}</span>
                          <span className="text-xs">({template.ratingCount})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <EyeIcon className="h-4 w-4" />
                          <span>{template.usageCount}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <UserIcon className="h-4 w-4" />
                        <span className="text-xs">{template.author}</span>
                      </div>
                    </div>

                    {/* Variables Count */}
                    {template.variables.length > 0 && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <CodeBracketIcon className="h-4 w-4" />
                        <span>{template.variables.length} 个变量</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template)
                          setShowViewModal(true)
                        }}
                        className="flex-1"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        查看
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openTestModal(template)}
                      >
                        <PlayIcon className="h-4 w-4 mr-1" />
                        测试
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(template)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {templates.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                暂无模板
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                创建您的第一个提示词模板
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                新建模板
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总模板数</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analytics.totalTemplates}
                    </p>
                  </div>
                  <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总使用次数</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analytics.totalUsage.toLocaleString()}
                    </p>
                  </div>
                  <PlayIcon className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">用户创建</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analytics.userStats.created}
                    </p>
                  </div>
                  <UserIcon className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">评分次数</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {analytics.userStats.rated}
                    </p>
                  </div>
                  <StarIcon className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Popular Categories */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FireIcon className="h-5 w-5 text-orange-500" />
                  热门分类
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.popularCategories.map((category, index) => {
                    const categoryInfo = categories.find(c => c.id === category.category)
                    return (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {getCategoryIcon(category.category)} {categoryInfo?.name || category.category}
                          </span>
                        </div>
                        <Badge variant="secondary">{category.count}</Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StarIcon className="h-5 w-5 text-yellow-500" />
                  高评分模板
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topRatedTemplates.slice(0, 5).map((item, index) => {
                    const template = templates.find(t => t.id === item.templateId)
                    return (
                      <div key={item.templateId} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center text-xs">
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                            {template?.name || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">{item.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent and Trending */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-blue-500" />
                  最近创建
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.recentlyCreated.map((template) => (
                    <div key={template.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                          {template.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getCategoryColor(template.category)}>
                        {getCategoryIcon(template.category)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FireIcon className="h-5 w-5 text-red-500" />
                  热门模板
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.trendingTemplates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                          {template.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          使用 {template.usageCount} 次
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{template.usageCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Optimize Tab */}
      {activeTab === 'optimize' && (
        <div className="space-y-6">
          <div className="text-center">
            <SparklesIcon className="h-16 w-16 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              AI智能优化
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              使用AI分析和优化您的提示词模板
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Available Templates for Optimization */}
            <Card>
              <CardHeader>
                <CardTitle>可优化模板</CardTitle>
                <CardDescription>选择模板进行AI智能优化</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {templates.slice(0, 5).map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{template.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {template.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleOptimizeTemplate(template.id)}
                        disabled={loading}
                      >
                        <SparklesIcon className="h-4 w-4 mr-1" />
                        优化
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Optimization Results */}
            <Card>
              <CardHeader>
                <CardTitle>优化建议</CardTitle>
                <CardDescription>AI生成的优化建议和改进方案</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {optimizations.slice(0, 3).map((optimization) => {
                    const template = templates.find(t => t.id === optimization.templateId)
                    return (
                      <div key={optimization.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {template?.name}
                          </h4>
                          <Badge
                            className={
                              optimization.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              optimization.status === 'applied' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }
                          >
                            {optimization.status}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          {optimization.improvements.map((improvement, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className={`w-2 h-2 rounded-full mt-2 ${
                                improvement.impact === 'high' ? 'bg-red-500' :
                                improvement.impact === 'medium' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`} />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                                  {improvement.type}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {improvement.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            预计性能提升: {(optimization.metrics.estimatedPerformanceImprovement * 100).toFixed(1)}%
                          </div>
                          {optimization.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleApplyOptimization(optimization.id)}
                              disabled={loading}
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              应用
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {optimizations.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        暂无优化建议，请先对模板进行优化分析
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="创建新模板"
        description="设计一个新的提示词模板"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                模板名称 *
              </label>
              <Input
                value={templateForm.name || ''}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入模板名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                分类
              </label>
              <Select
                options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                value={templateForm.category || ''}
                onChange={(value) => setTemplateForm(prev => ({ ...prev, category: value }))}
                placeholder="选择分类"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              描述
            </label>
            <Input
              value={templateForm.description || ''}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="简要描述模板用途"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              模板内容 *
            </label>
            <Textarea
              value={templateForm.content || ''}
              onChange={(e) => setTemplateForm(prev => ({ ...prev, content: e.target.value }))}
              placeholder="输入提示词内容，使用 {{variable_name}} 定义变量"
              rows={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              标签
            </label>
            <Input
              placeholder="用逗号分隔多个标签"
              onChange={(e) => {
                const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                setTemplateForm(prev => ({ ...prev, tags }))
              }}
            />
          </div>

          <Switch
            label="公开模板"
            description="其他用户可以查看和使用此模板"
            checked={templateForm.isPublic || false}
            onChange={(e) => setTemplateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={!templateForm.name || !templateForm.content || loading}
            >
              {loading ? '创建中...' : '创建模板'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* View Template Modal */}
      <Modal
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={selectedTemplate?.name || ''}
        description="模板详情"
      >
        {selectedTemplate && (
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">描述</h4>
              <p className="text-gray-600 dark:text-gray-400">{selectedTemplate.description}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">模板内容</h4>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {selectedTemplate.content}
                </pre>
              </div>
            </div>

            {selectedTemplate.variables.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">变量定义</h4>
                <div className="space-y-2">
                  {selectedTemplate.variables.map((variable, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {variable.name}
                          {variable.required && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{variable.description}</p>
                      </div>
                      <Badge variant="secondary">{variable.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  <span>{selectedTemplate.rating.toFixed(1)}</span>
                  <span className="text-sm text-gray-500">({selectedTemplate.ratingCount})</span>
                </div>
                <div className="flex items-center gap-1">
                  <EyeIcon className="h-4 w-4 text-gray-400" />
                  <span>{selectedTemplate.usageCount}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRateTemplate(selectedTemplate.id, rating)}
                    className="text-gray-300 hover:text-yellow-500 transition-colors"
                  >
                    <StarIcon className={`h-5 w-5 ${rating <= selectedTemplate.rating ? 'text-yellow-500 fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Test Template Modal */}
      <Modal
        open={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="测试模板"
        description="为模板变量提供值并预览结果"
      >
        {selectedTemplate && (
          <div className="space-y-6">
            {selectedTemplate.variables.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">设置变量值</h4>
                <div className="space-y-4">
                  {selectedTemplate.variables.map((variable) => (
                    <div key={variable.name}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {variable.description}
                        {variable.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {getVariableInput(variable)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                onClick={handleTestTemplate}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              >
                {loading ? '生成中...' : '生成结果'}
              </Button>
            </div>

            {testResult.content && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">生成结果</h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <pre className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                    {testResult.content}
                  </pre>
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(testResult.content)}
                  >
                    <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                    复制
                  </Button>
                </div>
              </div>
            )}

            {testResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-600 mb-2">错误信息</h4>
                <div className="space-y-1">
                  {testResult.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      {error}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default PromptTemplateDashboard
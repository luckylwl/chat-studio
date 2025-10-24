import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  Badge,
  Modal,
  Textarea,
  Switch
} from '@/components/ui'
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentDuplicateIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TagIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import modelTrainingService, {
  type TrainingDataset,
  type TrainingDataItem
} from '@/services/modelTrainingService'
import { toast } from 'react-hot-toast'

interface TrainingDataManagerProps {
  datasetId: string
  onClose: () => void
}

const TrainingDataManager: React.FC<TrainingDataManagerProps> = ({ datasetId, onClose }) => {
  const [dataset, setDataset] = useState<TrainingDataset | null>(null)
  const [filteredItems, setFilteredItems] = useState<TrainingDataItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [qualityFilter, setQualityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'timestamp' | 'quality' | 'length'>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [showEditItemModal, setShowEditItemModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<TrainingDataItem | null>(null)
  const [newItem, setNewItem] = useState({
    input: '',
    output: '',
    category: 'general',
    quality: 'medium' as 'high' | 'medium' | 'low',
    tags: ''
  })
  const [bulkEditConfig, setBulkEditConfig] = useState({
    category: '',
    quality: '' as '' | 'high' | 'medium' | 'low',
    tags: '',
    action: 'update' as 'update' | 'delete'
  })

  useEffect(() => {
    loadDataset()
  }, [datasetId])

  useEffect(() => {
    if (dataset) {
      filterAndSortItems()
    }
  }, [dataset, searchQuery, qualityFilter, categoryFilter, sortBy, sortOrder])

  const loadDataset = () => {
    const ds = modelTrainingService.getDataset(datasetId)
    if (ds) {
      setDataset(ds)
    }
  }

  const filterAndSortItems = () => {
    if (!dataset) return

    let items = [...dataset.items]

    // Apply filters
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      items = items.filter(item =>
        item.input.toLowerCase().includes(query) ||
        item.output.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        (item.metadata?.tags && item.metadata.tags.some(tag => tag.toLowerCase().includes(query)))
      )
    }

    if (qualityFilter !== 'all') {
      items = items.filter(item => item.quality === qualityFilter)
    }

    if (categoryFilter !== 'all') {
      items = items.filter(item => item.category === categoryFilter)
    }

    // Apply sorting
    items.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime()
          break
        case 'quality':
          const qualityOrder = { high: 3, medium: 2, low: 1 }
          comparison = qualityOrder[a.quality] - qualityOrder[b.quality]
          break
        case 'length':
          comparison = a.input.length - b.input.length
          break
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

    setFilteredItems(items)
  }

  const getCategories = (): string[] => {
    if (!dataset) return []
    const categories = new Set(dataset.items.map(item => item.category))
    return Array.from(categories)
  }

  const handleAddItem = async () => {
    if (!newItem.input.trim() || !newItem.output.trim()) {
      toast.error('请填写输入和输出内容')
      return
    }

    try {
      const itemData = {
        input: newItem.input.trim(),
        output: newItem.output.trim(),
        category: newItem.category,
        quality: newItem.quality,
        metadata: {
          tags: newItem.tags ? newItem.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
          source: 'manual',
          verified: true
        }
      }

      await modelTrainingService.addTrainingData(datasetId, [itemData])
      loadDataset()
      setShowAddItemModal(false)
      setNewItem({
        input: '',
        output: '',
        category: 'general',
        quality: 'medium',
        tags: ''
      })
      toast.success('训练数据已添加')
    } catch (error) {
      console.error('Failed to add training data:', error)
      toast.error('添加训练数据失败')
    }
  }

  const handleEditItem = async () => {
    if (!editingItem || !editingItem.input.trim() || !editingItem.output.trim()) {
      toast.error('请填写输入和输出内容')
      return
    }

    try {
      // Update the item in the dataset
      if (dataset) {
        const updatedItems = dataset.items.map(item =>
          item.id === editingItem.id ? editingItem : item
        )
        dataset.items = updatedItems

        // Save the updated dataset
        await modelTrainingService.addTrainingData(datasetId, [])
        loadDataset()
        setShowEditItemModal(false)
        setEditingItem(null)
        toast.success('训练数据已更新')
      }
    } catch (error) {
      console.error('Failed to update training data:', error)
      toast.error('更新训练数据失败')
    }
  }

  const handleBulkEdit = async () => {
    if (selectedItems.size === 0) {
      toast.error('请选择要操作的数据项')
      return
    }

    try {
      if (bulkEditConfig.action === 'delete') {
        // Remove selected items
        if (dataset) {
          dataset.items = dataset.items.filter(item => !selectedItems.has(item.id))
          await modelTrainingService.addTrainingData(datasetId, [])
          loadDataset()
          setSelectedItems(new Set())
          toast.success(`已删除 ${selectedItems.size} 条数据`)
        }
      } else {
        // Update selected items
        if (dataset) {
          dataset.items = dataset.items.map(item => {
            if (selectedItems.has(item.id)) {
              const updatedItem = { ...item }
              if (bulkEditConfig.category) updatedItem.category = bulkEditConfig.category
              if (bulkEditConfig.quality) updatedItem.quality = bulkEditConfig.quality
              if (bulkEditConfig.tags) {
                const newTags = bulkEditConfig.tags.split(',').map(tag => tag.trim()).filter(Boolean)
                updatedItem.metadata = {
                  ...updatedItem.metadata,
                  tags: [...(updatedItem.metadata?.tags || []), ...newTags]
                }
              }
              return updatedItem
            }
            return item
          })
          await modelTrainingService.addTrainingData(datasetId, [])
          loadDataset()
          setSelectedItems(new Set())
          toast.success(`已更新 ${selectedItems.size} 条数据`)
        }
      }

      setShowBulkEditModal(false)
      setBulkEditConfig({
        category: '',
        quality: '',
        tags: '',
        action: 'update'
      })
    } catch (error) {
      console.error('Failed to perform bulk edit:', error)
      toast.error('批量操作失败')
    }
  }

  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)))
    }
  }

  const generateSampleData = async () => {
    const sampleItems = [
      {
        input: '你好，请介绍一下人工智能的发展历史。',
        output: '人工智能的发展可以追溯到20世纪40年代。1950年，阿兰·图灵提出了著名的图灵测试...',
        category: 'general',
        quality: 'high' as const,
        metadata: { tags: ['AI', '历史', '介绍'], source: 'generated', verified: true }
      },
      {
        input: '如何学习编程？',
        output: '学习编程建议从基础语法开始，选择一门合适的编程语言如Python，然后通过实践项目来巩固知识...',
        category: 'education',
        quality: 'high' as const,
        metadata: { tags: ['编程', '学习', '教育'], source: 'generated', verified: true }
      },
      {
        input: '什么是机器学习？',
        output: '机器学习是人工智能的一个分支，它让计算机能够在没有明确编程的情况下学习和改进...',
        category: 'technology',
        quality: 'medium' as const,
        metadata: { tags: ['机器学习', 'AI', '技术'], source: 'generated', verified: true }
      }
    ]

    try {
      await modelTrainingService.addTrainingData(datasetId, sampleItems)
      loadDataset()
      toast.success('示例数据已添加')
    } catch (error) {
      console.error('Failed to add sample data:', error)
      toast.error('添加示例数据失败')
    }
  }

  const getQualityBadgeVariant = (quality: string) => {
    switch (quality) {
      case 'high':
        return 'success'
      case 'medium':
        return 'warning'
      case 'low':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'high':
        return '高质量'
      case 'medium':
        return '中等质量'
      case 'low':
        return '低质量'
      default:
        return quality
    }
  }

  if (!dataset) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">加载数据集中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            训练数据管理 - {dataset.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {dataset.statistics.totalItems} 条数据 • {getQualityLabel('high')}: {dataset.statistics.qualityDistribution.high || 0} 条
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedItems.size > 0 && (
            <Button
              onClick={() => setShowBulkEditModal(true)}
              variant="outline"
              size="sm"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
              批量操作 ({selectedItems.size})
            </Button>
          )}
          <Button onClick={generateSampleData} variant="outline" size="sm">
            <SparklesIcon className="h-4 w-4 mr-1" />
            添加示例
          </Button>
          <Button onClick={() => setShowAddItemModal(true)} size="sm">
            <PlusIcon className="h-4 w-4 mr-1" />
            添加数据
          </Button>
          <Button onClick={onClose} variant="outline" size="sm">
            关闭
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="搜索内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select
                options={[
                  { value: 'all', label: '所有质量' },
                  { value: 'high', label: '高质量' },
                  { value: 'medium', label: '中等质量' },
                  { value: 'low', label: '低质量' }
                ]}
                value={qualityFilter}
                onChange={(value) => setQualityFilter(value as any)}
              />
            </div>
            <div>
              <Select
                options={[
                  { value: 'all', label: '所有类别' },
                  ...getCategories().map(cat => ({ value: cat, label: cat }))
                ]}
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value)}
              />
            </div>
            <div className="flex gap-2">
              <Select
                options={[
                  { value: 'timestamp', label: '时间' },
                  { value: 'quality', label: '质量' },
                  { value: 'length', label: '长度' }
                ]}
                value={sortBy}
                onChange={(value) => setSortBy(value as any)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Selection */}
      {filteredItems.length > 0 && (
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedItems.size === filteredItems.length}
              onChange={handleSelectAll}
              className="rounded"
            />
            <span>选择全部 ({filteredItems.length} 条)</span>
          </label>
          {selectedItems.size > 0 && (
            <span className="text-primary-600 dark:text-primary-400">
              已选择 {selectedItems.size} 条数据
            </span>
          )}
        </div>
      )}

      {/* Data Items */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={selectedItems.has(item.id) ? 'ring-2 ring-primary-500' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedItems)
                        if (e.target.checked) {
                          newSelected.add(item.id)
                        } else {
                          newSelected.delete(item.id)
                        }
                        setSelectedItems(newSelected)
                      }}
                      className="mt-1 rounded"
                    />
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getQualityBadgeVariant(item.quality)}>
                            {getQualityLabel(item.quality)}
                          </Badge>
                          <Badge variant="outline">{item.category}</Badge>
                          {item.metadata?.tags && item.metadata.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              <TagIcon className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {item.metadata.tags.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingItem({ ...item })
                              setShowEditItemModal(true)
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              // Copy content to clipboard
                              navigator.clipboard.writeText(`输入: ${item.input}\n输出: ${item.output}`)
                              toast.success('内容已复制到剪贴板')
                            }}
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            输入 ({item.input.length} 字符)
                          </h4>
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                            {item.input.length > 200 ? (
                              <>
                                {item.input.substring(0, 200)}...
                                <button className="text-primary-600 dark:text-primary-400 ml-1">
                                  展开
                                </button>
                              </>
                            ) : (
                              item.input
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            输出 ({item.output.length} 字符)
                          </h4>
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                            {item.output.length > 200 ? (
                              <>
                                {item.output.substring(0, 200)}...
                                <button className="text-primary-600 dark:text-primary-400 ml-1">
                                  展开
                                </button>
                              </>
                            ) : (
                              item.output
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {item.timestamp.toLocaleString()}
                        </div>
                        {item.metadata?.source && (
                          <div>来源: {item.metadata.source}</div>
                        )}
                        {item.metadata?.verified && (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="h-3 w-3" />
                            已验证
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                {searchQuery || qualityFilter !== 'all' || categoryFilter !== 'all' ? (
                  <ExclamationTriangleIcon className="h-12 w-12 mx-auto" />
                ) : (
                  <DocumentDuplicateIcon className="h-12 w-12 mx-auto" />
                )}
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchQuery || qualityFilter !== 'all' || categoryFilter !== 'all'
                  ? '没有找到匹配的数据'
                  : '暂无训练数据'
                }
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery || qualityFilter !== 'all' || categoryFilter !== 'all'
                  ? '尝试调整搜索条件或筛选器'
                  : '添加训练数据来开始训练您的模型'
                }
              </p>
              {(!searchQuery && qualityFilter === 'all' && categoryFilter === 'all') && (
                <div className="flex justify-center gap-2">
                  <Button onClick={() => setShowAddItemModal(true)}>
                    添加数据
                  </Button>
                  <Button onClick={generateSampleData} variant="outline">
                    添加示例数据
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Item Modal */}
      <Modal
        open={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        title="添加训练数据"
        description="添加新的训练数据项"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              输入内容
            </label>
            <Textarea
              value={newItem.input}
              onChange={(e) => setNewItem(prev => ({ ...prev, input: e.target.value }))}
              placeholder="请输入训练输入内容..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              期望输出
            </label>
            <Textarea
              value={newItem.output}
              onChange={(e) => setNewItem(prev => ({ ...prev, output: e.target.value }))}
              placeholder="请输入期望的输出内容..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                类别
              </label>
              <Select
                options={[
                  { value: 'general', label: '通用' },
                  { value: 'education', label: '教育' },
                  { value: 'technology', label: '技术' },
                  { value: 'business', label: '商务' },
                  { value: 'creative', label: '创意' },
                  ...getCategories().filter(cat => !['general', 'education', 'technology', 'business', 'creative'].includes(cat)).map(cat => ({ value: cat, label: cat }))
                ]}
                value={newItem.category}
                onChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                质量
              </label>
              <Select
                options={[
                  { value: 'high', label: '高质量' },
                  { value: 'medium', label: '中等质量' },
                  { value: 'low', label: '低质量' }
                ]}
                value={newItem.quality}
                onChange={(value) => setNewItem(prev => ({ ...prev, quality: value as any }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              标签 (用逗号分隔)
            </label>
            <Input
              value={newItem.tags}
              onChange={(e) => setNewItem(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="例如: AI, 对话, 问答"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddItemModal(false)}>
              取消
            </Button>
            <Button onClick={handleAddItem} disabled={!newItem.input.trim() || !newItem.output.trim()}>
              添加数据
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        open={showEditItemModal}
        onClose={() => setShowEditItemModal(false)}
        title="编辑训练数据"
        description="修改训练数据项"
      >
        {editingItem && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                输入内容
              </label>
              <Textarea
                value={editingItem.input}
                onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, input: e.target.value }) : null)}
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                期望输出
              </label>
              <Textarea
                value={editingItem.output}
                onChange={(e) => setEditingItem(prev => prev ? ({ ...prev, output: e.target.value }) : null)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  类别
                </label>
                <Select
                  options={[
                    { value: 'general', label: '通用' },
                    { value: 'education', label: '教育' },
                    { value: 'technology', label: '技术' },
                    { value: 'business', label: '商务' },
                    { value: 'creative', label: '创意' },
                    ...getCategories().map(cat => ({ value: cat, label: cat }))
                  ]}
                  value={editingItem.category}
                  onChange={(value) => setEditingItem(prev => prev ? ({ ...prev, category: value }) : null)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  质量
                </label>
                <Select
                  options={[
                    { value: 'high', label: '高质量' },
                    { value: 'medium', label: '中等质量' },
                    { value: 'low', label: '低质量' }
                  ]}
                  value={editingItem.quality}
                  onChange={(value) => setEditingItem(prev => prev ? ({ ...prev, quality: value as any }) : null)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditItemModal(false)}>
                取消
              </Button>
              <Button onClick={handleEditItem}>
                保存修改
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Edit Modal */}
      <Modal
        open={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        title="批量操作"
        description={`对选中的 ${selectedItems.size} 条数据进行批量操作`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              操作类型
            </label>
            <Select
              options={[
                { value: 'update', label: '批量更新' },
                { value: 'delete', label: '批量删除' }
              ]}
              value={bulkEditConfig.action}
              onChange={(value) => setBulkEditConfig(prev => ({ ...prev, action: value as any }))}
            />
          </div>

          {bulkEditConfig.action === 'update' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  更新类别 (可选)
                </label>
                <Select
                  options={[
                    { value: '', label: '不修改' },
                    { value: 'general', label: '通用' },
                    { value: 'education', label: '教育' },
                    { value: 'technology', label: '技术' },
                    { value: 'business', label: '商务' },
                    { value: 'creative', label: '创意' }
                  ]}
                  value={bulkEditConfig.category}
                  onChange={(value) => setBulkEditConfig(prev => ({ ...prev, category: value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  更新质量 (可选)
                </label>
                <Select
                  options={[
                    { value: '', label: '不修改' },
                    { value: 'high', label: '高质量' },
                    { value: 'medium', label: '中等质量' },
                    { value: 'low', label: '低质量' }
                  ]}
                  value={bulkEditConfig.quality}
                  onChange={(value) => setBulkEditConfig(prev => ({ ...prev, quality: value as any }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  添加标签 (可选，用逗号分隔)
                </label>
                <Input
                  value={bulkEditConfig.tags}
                  onChange={(e) => setBulkEditConfig(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="例如: 批量处理, 已审核"
                />
              </div>
            </>
          )}

          {bulkEditConfig.action === 'delete' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <span className="font-medium">警告</span>
              </div>
              <p className="text-red-700 dark:text-red-300 mt-1">
                此操作将永久删除选中的 {selectedItems.size} 条训练数据，无法撤销。
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowBulkEditModal(false)}>
              取消
            </Button>
            <Button
              onClick={handleBulkEdit}
              variant={bulkEditConfig.action === 'delete' ? 'destructive' : 'default'}
            >
              {bulkEditConfig.action === 'delete' ? '确认删除' : '批量更新'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default TrainingDataManager
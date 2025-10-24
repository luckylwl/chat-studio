import React, { useState, useEffect } from 'react'
import {
  BookOpenIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  TagIcon,
  CalendarIcon,
  FolderIcon
} from '@heroicons/react/24/outline'
import { Button, Textarea } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'

interface Document {
  id: string
  title: string
  content: string
  source: string
  tags: string[]
  createdAt: number
  updatedAt: number
  size: number
  type: 'text' | 'document' | 'web' | 'code'
  embedding?: number[]
  metadata?: Record<string, any>
}

interface SearchResult {
  document: Document
  score: number
  relevantChunks: string[]
}

interface KnowledgeBaseProps {
  onDocumentSelect?: (document: Document) => void
  onSearchResults?: (results: SearchResult[]) => void
  className?: string
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({
  onDocumentSelect,
  onSearchResults,
  className
}) => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showAddDocument, setShowAddDocument] = useState(false)
  const [newDocument, setNewDocument] = useState({
    title: '',
    content: '',
    tags: '',
    source: 'manual'
  })
  const [isSearching, setIsSearching] = useState(false)
  const [isIndexing, setIsIndexing] = useState(false)

  // Mock documents
  useEffect(() => {
    const mockDocuments: Document[] = [
      {
        id: '1',
        title: 'React开发最佳实践',
        content: 'React是一个用于构建用户界面的JavaScript库。在开发React应用时，应该遵循以下最佳实践：1. 使用函数组件和Hooks；2. 合理使用useEffect避免内存泄漏；3. 使用React.memo优化性能；4. 保持组件的纯净性...',
        source: 'manual',
        tags: ['React', '最佳实践', 'JavaScript', '前端'],
        createdAt: Date.now() - 86400000 * 7,
        updatedAt: Date.now() - 86400000 * 2,
        size: 1024,
        type: 'text'
      },
      {
        id: '2',
        title: 'TypeScript类型系统详解',
        content: 'TypeScript是JavaScript的超集，提供了静态类型检查。类型系统包括基础类型、接口、泛型、联合类型、交叉类型等。使用TypeScript可以提高代码质量和开发效率...',
        source: 'document',
        tags: ['TypeScript', '类型系统', '静态类型', '编程语言'],
        createdAt: Date.now() - 86400000 * 14,
        updatedAt: Date.now() - 86400000 * 5,
        size: 2048,
        type: 'document'
      },
      {
        id: '3',
        title: 'AI模型上下文协议(MCP)介绍',
        content: 'Model Context Protocol (MCP) 是一个标准化协议，允许AI模型访问外部工具和服务。MCP提供了统一的接口，使得AI能够执行文件操作、网络请求、数据库查询等任务...',
        source: 'web',
        tags: ['MCP', 'AI', '协议', '外部工具'],
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now() - 86400000 * 1,
        size: 1536,
        type: 'web'
      },
      {
        id: '4',
        title: 'Python数据处理代码示例',
        content: 'import pandas as pd\nimport numpy as np\n\n# 数据清洗和处理\ndef process_data(df):\n    # 删除重复值\n    df = df.drop_duplicates()\n    # 处理缺失值\n    df = df.fillna(df.mean())\n    return df\n\n# 数据分析\ndef analyze_data(df):\n    return df.describe()',
        source: 'code',
        tags: ['Python', '数据处理', 'Pandas', '代码示例'],
        createdAt: Date.now() - 86400000 * 10,
        updatedAt: Date.now() - 86400000 * 8,
        size: 512,
        type: 'code'
      }
    ]

    setDocuments(mockDocuments)
  }, [])

  // Get all unique tags
  const getAllTags = (): string[] => {
    const tags = new Set<string>()
    documents.forEach(doc => doc.tags.forEach(tag => tags.add(tag)))
    return Array.from(tags)
  }

  // Simulate embedding-based search
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800))

      // Simple text-based search (in real implementation, would use embeddings)
      const results: SearchResult[] = documents
        .filter(doc => {
          // Filter by selected tags
          if (selectedTags.length > 0) {
            return selectedTags.some(tag => doc.tags.includes(tag))
          }
          return true
        })
        .map(doc => {
          const queryLower = query.toLowerCase()
          const titleMatch = doc.title.toLowerCase().includes(queryLower)
          const contentMatch = doc.content.toLowerCase().includes(queryLower)
          const tagMatch = doc.tags.some(tag => tag.toLowerCase().includes(queryLower))

          let score = 0
          if (titleMatch) score += 0.6
          if (contentMatch) score += 0.3
          if (tagMatch) score += 0.1

          // Get relevant chunks (simulate)
          const chunks = doc.content.split('.').filter(chunk =>
            chunk.toLowerCase().includes(queryLower)
          ).slice(0, 2)

          return {
            document: doc,
            score,
            relevantChunks: chunks.length > 0 ? chunks : [doc.content.substring(0, 200) + '...']
          }
        })
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)

      setSearchResults(results)
      onSearchResults?.(results)

      if (results.length === 0) {
        toast.info('未找到相关文档')
      } else {
        toast.success(`找到 ${results.length} 个相关文档`)
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('搜索失败')
    } finally {
      setIsSearching(false)
    }
  }

  const addDocument = async () => {
    if (!newDocument.title.trim() || !newDocument.content.trim()) {
      toast.error('请填写文档标题和内容')
      return
    }

    setIsIndexing(true)
    try {
      // Simulate indexing delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      const document: Document = {
        id: Date.now().toString(),
        title: newDocument.title,
        content: newDocument.content,
        source: newDocument.source,
        tags: newDocument.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        size: newDocument.content.length,
        type: 'text'
      }

      setDocuments(prev => [document, ...prev])
      setNewDocument({ title: '', content: '', tags: '', source: 'manual' })
      setShowAddDocument(false)

      toast.success('文档已添加到知识库')
    } catch (error) {
      console.error('Add document error:', error)
      toast.error('添加文档失败')
    } finally {
      setIsIndexing(false)
    }
  }

  const deleteDocument = (documentId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== documentId))
    setSearchResults(prev => prev.filter(result => result.document.id !== documentId))
    toast.success('文档已删除')
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
  }

  const getTypeIcon = (type: string) => {
    const iconClass = "h-4 w-4"
    switch (type) {
      case 'document':
        return <DocumentTextIcon className={cn(iconClass, "text-blue-500")} />
      case 'web':
        return <div className={cn(iconClass, "text-green-500")}>🌐</div>
      case 'code':
        return <div className={cn(iconClass, "text-purple-500")}>💻</div>
      default:
        return <DocumentTextIcon className={cn(iconClass, "text-gray-500")} />
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('zh-CN')
  }

  const allTags = getAllTags()

  return (
    <div className={cn("space-y-6", className)}>
      {/* 知识库统计 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <BookOpenIcon className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900 dark:text-gray-100">知识库</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {documents.length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">总文档数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {allTags.length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">标签数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Math.round(documents.reduce((sum, doc) => sum + doc.size, 0) / 1024)}
            </div>
            <div className="text-gray-600 dark:text-gray-400">总大小(KB)</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {searchResults.length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">搜索结果</div>
          </div>
        </div>
      </div>

      {/* 搜索和标签过滤 */}
      <div className="space-y-4">
        {/* 搜索框 */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && performSearch(searchQuery)}
            placeholder="搜索知识库文档..."
            className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100"
          />
          <Button
            onClick={() => performSearch(searchQuery)}
            disabled={isSearching}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8"
            size="sm"
          >
            {isSearching ? '搜索中...' : '搜索'}
          </Button>
        </div>

        {/* 标签过滤 */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">标签筛选</label>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "px-3 py-1 text-sm rounded-full border transition-colors",
                    selectedTags.includes(tag)
                      ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  )}
                >
                  <TagIcon className="inline h-3 w-3 mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 添加文档 */}
      <div className="space-y-3">
        <Button
          onClick={() => setShowAddDocument(!showAddDocument)}
          className="gap-2"
          variant="outline"
        >
          <PlusIcon className="h-4 w-4" />
          添加文档
        </Button>

        {showAddDocument && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                文档标题
              </label>
              <input
                type="text"
                value={newDocument.title}
                onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                placeholder="输入文档标题..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                文档内容
              </label>
              <Textarea
                value={newDocument.content}
                onChange={(e) => setNewDocument(prev => ({ ...prev, content: e.target.value }))}
                placeholder="输入文档内容..."
                className="min-h-[120px] resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                标签 (用逗号分隔)
              </label>
              <input
                type="text"
                value={newDocument.tags}
                onChange={(e) => setNewDocument(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="例如: React, TypeScript, 前端"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={addDocument}
                disabled={isIndexing}
                className="flex-1"
              >
                {isIndexing ? (
                  <>
                    <ChartBarIcon className="h-4 w-4 animate-pulse mr-2" />
                    索引中...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                    添加到知识库
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddDocument(false)}
                className="px-4"
              >
                取消
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 搜索结果 */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            搜索结果 ({searchResults.length})
          </h4>

          {searchResults.map((result, index) => (
            <div
              key={result.document.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
              onClick={() => onDocumentSelect?.(result.document)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTypeIcon(result.document.type)}
                  <h5 className="font-medium text-gray-900 dark:text-gray-100">
                    {result.document.title}
                  </h5>
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                    相似度: {Math.round(result.score * 100)}%
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteDocument(result.document.id)
                  }}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {result.relevantChunks[0]}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {formatDate(result.document.updatedAt)}
                  </span>
                  <span>{formatFileSize(result.document.size)}</span>
                  <span>{result.document.source}</span>
                </div>

                <div className="flex items-center gap-1">
                  {result.document.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-block px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 文档列表 */}
      {searchResults.length === 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            所有文档 ({documents.length})
          </h4>

          {documents.map(document => (
            <div
              key={document.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
              onClick={() => onDocumentSelect?.(document)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTypeIcon(document.type)}
                  <h5 className="font-medium text-gray-900 dark:text-gray-100">
                    {document.title}
                  </h5>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteDocument(document.id)
                  }}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {document.content.substring(0, 150)}...
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {formatDate(document.updatedAt)}
                  </span>
                  <span>{formatFileSize(document.size)}</span>
                  <span>{document.source}</span>
                </div>

                <div className="flex items-center gap-1">
                  {document.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-block px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 提示信息 */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
        <div className="flex items-start gap-2">
          <BookOpenIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">知识库说明:</p>
            <ul className="text-xs space-y-1 opacity-90">
              <li>• 支持语义搜索，基于文档内容相似度排序</li>
              <li>• 可通过标签快速过滤相关文档</li>
              <li>• 搜索结果可直接在对话中引用</li>
              <li>• 支持多种文档类型和来源</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default KnowledgeBase
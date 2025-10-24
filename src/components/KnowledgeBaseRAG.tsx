import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  FolderIcon,
  CloudArrowUpIcon,
  TrashIcon,
  PencilIcon,
  ShareIcon,
  EyeIcon,
  CpuChipIcon,
  SparklesIcon,
  ChartBarIcon,
  TagIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
  BeakerIcon,
  DocumentDuplicateIcon,
  LinkIcon
} from '@heroicons/react/24/outline'

interface Document {
  id: string
  name: string
  content: string
  type: 'text' | 'pdf' | 'docx' | 'md' | 'url' | 'image'
  size: number
  createdAt: number
  updatedAt: number
  collectionId: string
  embeddings?: number[]
  metadata: {
    author?: string
    source?: string
    tags: string[]
    summary?: string
    language: string
    tokens: number
  }
  chunks: DocumentChunk[]
  indexStatus: 'pending' | 'processing' | 'completed' | 'error'
  similarity?: number
}

interface DocumentChunk {
  id: string
  content: string
  embeddings: number[]
  metadata: {
    start: number
    end: number
    tokens: number
  }
}

interface KnowledgeCollection {
  id: string
  name: string
  description: string
  documentCount: number
  totalTokens: number
  createdAt: number
  updatedAt: number
  isPublic: boolean
  tags: string[]
  embeddingModel: string
  chunkSize: number
  chunkOverlap: number
}

interface RAGQuery {
  id: string
  query: string
  results: SearchResult[]
  timestamp: number
  responseTime: number
  model: string
  topK: number
  threshold: number
}

interface SearchResult {
  document: Document
  chunk: DocumentChunk
  similarity: number
  relevanceScore: number
}

const KnowledgeBaseRAG: React.FC = () => {
  const [collections, setCollections] = useState<KnowledgeCollection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'documents' | 'search' | 'settings'>('documents')
  const [showUploader, setShowUploader] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ragQueries, setRagQueries] = useState<RAGQuery[]>([])
  const [ragSettings, setRagSettings] = useState({
    embeddingModel: 'text-embedding-ada-002',
    chunkSize: 1000,
    chunkOverlap: 200,
    topK: 5,
    similarityThreshold: 0.7,
    reranking: true
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  const mockCollections: KnowledgeCollection[] = [
    {
      id: 'collection-1',
      name: '技术文档库',
      description: '包含编程、开发、架构等技术相关文档',
      documentCount: 145,
      totalTokens: 2850000,
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now() - 86400000 * 2,
      isPublic: false,
      tags: ['技术', '编程', '开发'],
      embeddingModel: 'text-embedding-ada-002',
      chunkSize: 1000,
      chunkOverlap: 200
    },
    {
      id: 'collection-2',
      name: '产品知识库',
      description: '产品文档、用户手册、FAQ等内容',
      documentCount: 89,
      totalTokens: 1750000,
      createdAt: Date.now() - 86400000 * 20,
      updatedAt: Date.now() - 86400000 * 1,
      isPublic: true,
      tags: ['产品', '文档', '用户手册'],
      embeddingModel: 'text-embedding-ada-002',
      chunkSize: 800,
      chunkOverlap: 150
    },
    {
      id: 'collection-3',
      name: '学术论文集',
      description: '学术研究论文和文献资料',
      documentCount: 67,
      totalTokens: 3200000,
      createdAt: Date.now() - 86400000 * 45,
      updatedAt: Date.now() - 86400000 * 5,
      isPublic: false,
      tags: ['学术', '研究', '论文'],
      embeddingModel: 'text-embedding-ada-002',
      chunkSize: 1200,
      chunkOverlap: 300
    }
  ]

  const mockDocuments: Document[] = [
    {
      id: 'doc-1',
      name: 'React Hooks 完整指南.md',
      content: 'React Hooks 是 React 16.8 的新增特性。它可以让你在不编写 class 的情况下使用 state 以及其他的 React 特性...',
      type: 'md',
      size: 15420,
      createdAt: Date.now() - 86400000 * 5,
      updatedAt: Date.now() - 86400000 * 2,
      collectionId: 'collection-1',
      metadata: {
        author: 'React 团队',
        source: 'https://react.dev/reference/react',
        tags: ['React', 'Hooks', '前端'],
        summary: 'React Hooks 的完整使用指南，包含 useState、useEffect 等常用钩子的详细说明',
        language: 'zh-CN',
        tokens: 3855
      },
      chunks: [
        {
          id: 'chunk-1',
          content: 'React Hooks 是 React 16.8 的新增特性...',
          embeddings: new Array(1536).fill(0).map(() => Math.random()),
          metadata: { start: 0, end: 500, tokens: 125 }
        }
      ],
      indexStatus: 'completed'
    },
    {
      id: 'doc-2',
      name: 'TypeScript 高级类型系统.pdf',
      content: 'TypeScript 提供了强大的类型系统，包括联合类型、交叉类型、条件类型等高级特性...',
      type: 'pdf',
      size: 2450000,
      createdAt: Date.now() - 86400000 * 8,
      updatedAt: Date.now() - 86400000 * 3,
      collectionId: 'collection-1',
      metadata: {
        author: 'TypeScript 专家',
        tags: ['TypeScript', '类型系统', '编程'],
        summary: 'TypeScript 高级类型系统的深度解析，适合进阶开发者学习',
        language: 'zh-CN',
        tokens: 6120
      },
      chunks: [
        {
          id: 'chunk-2',
          content: 'TypeScript 提供了强大的类型系统...',
          embeddings: new Array(1536).fill(0).map(() => Math.random()),
          metadata: { start: 0, end: 800, tokens: 200 }
        }
      ],
      indexStatus: 'completed'
    },
    {
      id: 'doc-3',
      name: '产品需求文档模板.docx',
      content: '产品需求文档（PRD）是产品管理中的重要文档，用于明确产品功能和需求...',
      type: 'docx',
      size: 845000,
      createdAt: Date.now() - 86400000 * 12,
      updatedAt: Date.now() - 86400000 * 6,
      collectionId: 'collection-2',
      metadata: {
        author: '产品团队',
        tags: ['产品', '需求', '文档'],
        summary: '标准的产品需求文档模板，包含完整的产品规格说明',
        language: 'zh-CN',
        tokens: 2110
      },
      chunks: [
        {
          id: 'chunk-3',
          content: '产品需求文档（PRD）是产品管理中的重要文档...',
          embeddings: new Array(1536).fill(0).map(() => Math.random()),
          metadata: { start: 0, end: 600, tokens: 150 }
        }
      ],
      indexStatus: 'completed'
    }
  ]

  useEffect(() => {
    setCollections(mockCollections)
    setDocuments(mockDocuments)
    if (mockCollections.length > 0) {
      setSelectedCollection(mockCollections[0].id)
    }
  }, [])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)

    // 模拟向量搜索
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 模拟搜索结果
    const mockResults: SearchResult[] = documents
      .filter(doc => selectedCollection ? doc.collectionId === selectedCollection : true)
      .map(doc => ({
        document: doc,
        chunk: doc.chunks[0],
        similarity: Math.random() * 0.4 + 0.6, // 0.6-1.0
        relevanceScore: Math.random() * 0.3 + 0.7 // 0.7-1.0
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, ragSettings.topK)

    setSearchResults(mockResults)

    // 记录查询历史
    const newQuery: RAGQuery = {
      id: `query-${Date.now()}`,
      query: searchQuery,
      results: mockResults,
      timestamp: Date.now(),
      responseTime: 1500,
      model: ragSettings.embeddingModel,
      topK: ragSettings.topK,
      threshold: ragSettings.similarityThreshold
    }

    setRagQueries(prev => [newQuery, ...prev].slice(0, 10))
    setIsSearching(false)
  }

  const handleFileUpload = async (files: FileList) => {
    if (!selectedCollection) return

    setIsProcessing(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      const newDocument: Document = {
        id: `doc-${Date.now()}-${i}`,
        name: file.name,
        content: `这是${file.name}的内容，正在处理中...`,
        type: getFileType(file.name),
        size: file.size,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        collectionId: selectedCollection,
        metadata: {
          tags: ['新文档'],
          language: 'zh-CN',
          tokens: 0
        },
        chunks: [],
        indexStatus: 'pending'
      }

      setDocuments(prev => [newDocument, ...prev])

      // 模拟文档处理流程
      setTimeout(() => {
        setDocuments(prev => prev.map(doc =>
          doc.id === newDocument.id
            ? { ...doc, indexStatus: 'processing' as const }
            : doc
        ))
      }, 1000)

      setTimeout(() => {
        setDocuments(prev => prev.map(doc =>
          doc.id === newDocument.id
            ? {
                ...doc,
                indexStatus: 'completed' as const,
                content: `${file.name} 的处理完整内容。这里包含了文档的详细信息和知识内容。`,
                metadata: {
                  ...doc.metadata,
                  tokens: Math.floor(file.size / 4),
                  summary: `${file.name} 的自动生成摘要`
                },
                chunks: [
                  {
                    id: `chunk-${newDocument.id}`,
                    content: `${file.name} 的文档块内容...`,
                    embeddings: new Array(1536).fill(0).map(() => Math.random()),
                    metadata: { start: 0, end: 500, tokens: 125 }
                  }
                ]
              }
            : doc
        ))

        // 更新集合统计
        setCollections(prev => prev.map(collection =>
          collection.id === selectedCollection
            ? {
                ...collection,
                documentCount: collection.documentCount + 1,
                totalTokens: collection.totalTokens + Math.floor(file.size / 4),
                updatedAt: Date.now()
              }
            : collection
        ))
      }, 4000)
    }

    setIsProcessing(false)
    setShowUploader(false)
  }

  const getFileType = (filename: string): Document['type'] => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf': return 'pdf'
      case 'docx':
      case 'doc': return 'docx'
      case 'md': return 'md'
      case 'txt': return 'text'
      default: return 'text'
    }
  }

  const getCollectionDocuments = () => {
    return documents.filter(doc => selectedCollection ? doc.collectionId === selectedCollection : true)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const DocumentCard: React.FC<{ document: Document }> = ({ document }) => {
    const getStatusIcon = () => {
      switch (document.indexStatus) {
        case 'pending':
          return <ClockIcon className="w-4 h-4 text-yellow-500" />
        case 'processing':
          return <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />
        case 'completed':
          return <CheckCircleIcon className="w-4 h-4 text-green-500" />
        case 'error':
          return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
      }
    }

    const getStatusText = () => {
      switch (document.indexStatus) {
        case 'pending': return '等待处理'
        case 'processing': return '正在索引'
        case 'completed': return '已完成'
        case 'error': return '处理失败'
      }
    }

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="w-8 h-8 text-blue-500" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{document.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatFileSize(document.size)} • {document.metadata.tokens.toLocaleString()} tokens
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {getStatusIcon()}
              <span className="text-xs text-gray-500">{getStatusText()}</span>
            </div>
          </div>
        </div>

        {document.metadata.summary && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {document.metadata.summary}
          </p>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {document.metadata.tags.map(tag => (
            <span
              key={tag}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {new Date(document.createdAt).toLocaleDateString()}
          </span>
          <div className="flex items-center space-x-2">
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <EyeIcon className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <PencilIcon className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <ShareIcon className="w-4 h-4" />
            </button>
            <button className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded">
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  const SearchResultCard: React.FC<{ result: SearchResult }> = ({ result }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 mb-4"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
            {result.document.name}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
            <span>相似度: {(result.similarity * 100).toFixed(1)}%</span>
            <span>相关性: {(result.relevanceScore * 100).toFixed(1)}%</span>
            <span>{result.chunk.metadata.tokens} tokens</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <div className={`w-2 h-2 rounded-full ${
            result.similarity > 0.8 ? 'bg-green-500' :
            result.similarity > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
          }`} />
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {result.chunk.content}
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {result.document.metadata.tags.map(tag => (
          <span
            key={tag}
            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            知识库 & RAG
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            智能文档管理和检索增强生成，让AI基于你的知识库回答问题
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 侧边栏 - 知识库集合 */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  知识库集合
                </h2>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {collections.map(collection => (
                  <div
                    key={collection.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCollection === collection.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedCollection(collection.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium">{collection.name}</h3>
                      {collection.isPublic && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {collection.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{collection.documentCount} 个文档</span>
                      <span>{(collection.totalTokens / 1000).toFixed(0)}K tokens</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 主内容区 */}
          <div className="flex-1">
            {/* 标签页导航 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                {[
                  { id: 'documents', name: '文档管理', icon: DocumentTextIcon },
                  { id: 'search', name: 'RAG 搜索', icon: MagnifyingGlassIcon },
                  { id: 'settings', name: '设置', icon: AdjustmentsHorizontalIcon }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                      selectedTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {selectedTab === 'documents' && (
                    <motion.div
                      key="documents"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          文档管理
                        </h3>
                        <button
                          onClick={() => setShowUploader(true)}
                          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <CloudArrowUpIcon className="w-4 h-4" />
                          <span>上传文档</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence>
                          {getCollectionDocuments().map(document => (
                            <DocumentCard key={document.id} document={document} />
                          ))}
                        </AnimatePresence>
                      </div>

                      {getCollectionDocuments().length === 0 && (
                        <div className="text-center py-12">
                          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            暂无文档
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            上传文档开始构建你的知识库
                          </p>
                          <button
                            onClick={() => setShowUploader(true)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            上传第一个文档
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {selectedTab === 'search' && (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          RAG 智能搜索
                        </h3>

                        <div className="flex space-x-4 mb-4">
                          <div className="flex-1 relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              placeholder="输入问题，AI将基于知识库回答..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <button
                            onClick={handleSearch}
                            disabled={!searchQuery.trim() || isSearching}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                          >
                            {isSearching ? (
                              <>
                                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                <span>搜索中</span>
                              </>
                            ) : (
                              <>
                                <BeakerIcon className="w-4 h-4" />
                                <span>RAG 搜索</span>
                              </>
                            )}
                          </button>
                        </div>

                        {searchResults.length > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <InformationCircleIcon className="w-5 h-5 text-blue-600" />
                              <span className="font-medium text-blue-900 dark:text-blue-300">
                                找到 {searchResults.length} 个相关文档片段
                              </span>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              基于这些内容，AI可以为你提供准确的答案和解决方案
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <AnimatePresence>
                          {searchResults.map((result, index) => (
                            <SearchResultCard key={index} result={result} />
                          ))}
                        </AnimatePresence>
                      </div>

                      {ragQueries.length > 0 && (
                        <div className="mt-8">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            搜索历史
                          </h4>
                          <div className="space-y-2">
                            {ragQueries.slice(0, 5).map(query => (
                              <div
                                key={query.id}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">
                                    {query.query}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {query.results.length} 个结果 • {query.responseTime}ms
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    setSearchQuery(query.query)
                                    setSearchResults(query.results)
                                  }}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <LinkIcon className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {selectedTab === 'settings' && (
                    <motion.div
                      key="settings"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        RAG 设置
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            向量化设置
                          </h4>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              嵌入模型
                            </label>
                            <select
                              value={ragSettings.embeddingModel}
                              onChange={(e) => setRagSettings({...ragSettings, embeddingModel: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                              <option value="text-embedding-ada-002">OpenAI Ada-002</option>
                              <option value="text-embedding-3-small">OpenAI Embedding v3 Small</option>
                              <option value="text-embedding-3-large">OpenAI Embedding v3 Large</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              文档块大小: {ragSettings.chunkSize}
                            </label>
                            <input
                              type="range"
                              min="500"
                              max="2000"
                              step="100"
                              value={ragSettings.chunkSize}
                              onChange={(e) => setRagSettings({...ragSettings, chunkSize: parseInt(e.target.value)})}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              重叠大小: {ragSettings.chunkOverlap}
                            </label>
                            <input
                              type="range"
                              min="50"
                              max="500"
                              step="50"
                              value={ragSettings.chunkOverlap}
                              onChange={(e) => setRagSettings({...ragSettings, chunkOverlap: parseInt(e.target.value)})}
                              className="w-full"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            搜索设置
                          </h4>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              返回结果数: {ragSettings.topK}
                            </label>
                            <input
                              type="range"
                              min="1"
                              max="20"
                              step="1"
                              value={ragSettings.topK}
                              onChange={(e) => setRagSettings({...ragSettings, topK: parseInt(e.target.value)})}
                              className="w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              相似度阈值: {ragSettings.similarityThreshold}
                            </label>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.1"
                              value={ragSettings.similarityThreshold}
                              onChange={(e) => setRagSettings({...ragSettings, similarityThreshold: parseFloat(e.target.value)})}
                              className="w-full"
                            />
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={ragSettings.reranking}
                              onChange={(e) => setRagSettings({...ragSettings, reranking: e.target.checked})}
                              className="mr-2"
                            />
                            <label className="text-sm text-gray-700 dark:text-gray-300">
                              启用重排序优化
                            </label>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* 文档上传器 */}
        <AnimatePresence>
          {showUploader && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowUploader(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  上传文档到知识库
                </h3>

                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    点击或拖拽文件到此处
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    支持 PDF, DOCX, TXT, MD 等格式
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.md"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileUpload(e.target.files)
                    }
                  }}
                  className="hidden"
                />

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowUploader(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default KnowledgeBaseRAG
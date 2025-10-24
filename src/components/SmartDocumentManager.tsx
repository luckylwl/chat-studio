import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DocumentTextIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  CloudArrowUpIcon,
  TrashIcon,
  ShareIcon,
  StarIcon,
  TagIcon,
  EyeIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  ChartBarIcon,
  SparklesIcon,
  DocumentDuplicateIcon,
  ArchiveBoxIcon,
  LockClosedIcon,
  GlobeAltIcon,
  CogIcon,
  PlusIcon,
  FunnelIcon,
  ViewColumnsIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

interface Document {
  id: string
  name: string
  type: 'pdf' | 'doc' | 'txt' | 'md' | 'image' | 'video' | 'audio' | 'other'
  size: number
  createdAt: number
  modifiedAt: number
  folderId?: string
  tags: string[]
  isStarred: boolean
  isShared: boolean
  shareSettings?: {
    isPublic: boolean
    allowEdit: boolean
    password?: string
    expiresAt?: number
  }
  aiAnalysis?: {
    summary: string
    keywords: string[]
    language: string
    sentiment: 'positive' | 'negative' | 'neutral'
    topics: string[]
    readingTime: number
    complexity: 'simple' | 'medium' | 'complex'
  }
  url?: string
  thumbnail?: string
  version: number
  history: DocumentVersion[]
}

interface DocumentVersion {
  id: string
  version: number
  createdAt: number
  author: string
  changes: string
  size: number
}

interface Folder {
  id: string
  name: string
  parentId?: string
  color: string
  isExpanded: boolean
  documentCount: number
  createdAt: number
}

interface SearchFilter {
  type?: string[]
  tags?: string[]
  dateRange?: {
    start: number
    end: number
  }
  sizeRange?: {
    min: number
    max: number
  }
  isStarred?: boolean
  isShared?: boolean
}

const SmartDocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFilter, setSearchFilter] = useState<SearchFilter>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'timeline'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'type'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [showUploader, setShowUploader] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const documentTypes = [
    { type: 'pdf', icon: '📄', color: 'text-red-500', name: 'PDF' },
    { type: 'doc', icon: '📝', color: 'text-blue-500', name: 'Word' },
    { type: 'txt', icon: '📋', color: 'text-gray-500', name: 'Text' },
    { type: 'md', icon: '📑', color: 'text-purple-500', name: 'Markdown' },
    { type: 'image', icon: '🖼️', color: 'text-green-500', name: 'Image' },
    { type: 'video', icon: '🎬', color: 'text-pink-500', name: 'Video' },
    { type: 'audio', icon: '🎵', color: 'text-orange-500', name: 'Audio' },
    { type: 'other', icon: '📦', color: 'text-gray-400', name: 'Other' }
  ]

  const mockFolders: Folder[] = [
    {
      id: 'folder-1',
      name: '项目文档',
      color: 'blue',
      isExpanded: true,
      documentCount: 15,
      createdAt: Date.now() - 86400000 * 30
    },
    {
      id: 'folder-2',
      name: '会议记录',
      color: 'green',
      isExpanded: false,
      documentCount: 8,
      createdAt: Date.now() - 86400000 * 20
    },
    {
      id: 'folder-3',
      name: '研究资料',
      color: 'purple',
      isExpanded: false,
      documentCount: 23,
      createdAt: Date.now() - 86400000 * 45
    },
    {
      id: 'folder-4',
      name: '设计素材',
      color: 'pink',
      isExpanded: false,
      documentCount: 12,
      createdAt: Date.now() - 86400000 * 15
    }
  ]

  const mockDocuments: Document[] = [
    {
      id: 'doc-1',
      name: 'AI聊天应用产品需求文档.pdf',
      type: 'pdf',
      size: 2450000,
      createdAt: Date.now() - 86400000 * 5,
      modifiedAt: Date.now() - 86400000 * 2,
      folderId: 'folder-1',
      tags: ['产品', 'AI', '需求'],
      isStarred: true,
      isShared: true,
      shareSettings: {
        isPublic: false,
        allowEdit: false,
        password: 'abc123'
      },
      aiAnalysis: {
        summary: '这是一份详细的AI聊天应用产品需求文档，包含了功能规格、技术架构和用户体验设计',
        keywords: ['AI聊天', '产品需求', '用户体验', '技术架构'],
        language: 'zh-CN',
        sentiment: 'neutral',
        topics: ['人工智能', '产品设计', '软件开发'],
        readingTime: 15,
        complexity: 'medium'
      },
      version: 3,
      history: [
        {
          id: 'v1',
          version: 1,
          createdAt: Date.now() - 86400000 * 5,
          author: '产品经理',
          changes: '初始版本创建',
          size: 1800000
        },
        {
          id: 'v2',
          version: 2,
          createdAt: Date.now() - 86400000 * 3,
          author: '技术负责人',
          changes: '添加技术架构章节',
          size: 2200000
        },
        {
          id: 'v3',
          version: 3,
          createdAt: Date.now() - 86400000 * 2,
          author: 'UI设计师',
          changes: '完善用户界面设计部分',
          size: 2450000
        }
      ]
    },
    {
      id: 'doc-2',
      name: '团队会议纪要_2024_01_20.md',
      type: 'md',
      size: 156000,
      createdAt: Date.now() - 86400000 * 8,
      modifiedAt: Date.now() - 86400000 * 8,
      folderId: 'folder-2',
      tags: ['会议', '团队', '纪要'],
      isStarred: false,
      isShared: false,
      aiAnalysis: {
        summary: '团队周例会纪要，包含项目进度、问题讨论和下周计划',
        keywords: ['项目进度', '问题讨论', '下周计划', '团队协作'],
        language: 'zh-CN',
        sentiment: 'positive',
        topics: ['团队管理', '项目管理', '工作规划'],
        readingTime: 5,
        complexity: 'simple'
      },
      version: 1,
      history: []
    },
    {
      id: 'doc-3',
      name: 'AI模型训练数据集.zip',
      type: 'other',
      size: 125000000,
      createdAt: Date.now() - 86400000 * 12,
      modifiedAt: Date.now() - 86400000 * 10,
      folderId: 'folder-3',
      tags: ['AI', '数据集', '训练'],
      isStarred: true,
      isShared: true,
      shareSettings: {
        isPublic: true,
        allowEdit: false
      },
      version: 2,
      history: [
        {
          id: 'v1',
          version: 1,
          createdAt: Date.now() - 86400000 * 12,
          author: '算法工程师',
          changes: '初始数据集上传',
          size: 98000000
        },
        {
          id: 'v2',
          version: 2,
          createdAt: Date.now() - 86400000 * 10,
          author: '数据科学家',
          changes: '增加清洗后的数据样本',
          size: 125000000
        }
      ]
    },
    {
      id: 'doc-4',
      name: 'UI设计稿_主界面.fig',
      type: 'other',
      size: 8900000,
      createdAt: Date.now() - 86400000 * 3,
      modifiedAt: Date.now() - 86400000 * 1,
      folderId: 'folder-4',
      tags: ['UI', '设计', '界面'],
      isStarred: false,
      isShared: true,
      shareSettings: {
        isPublic: false,
        allowEdit: true,
        expiresAt: Date.now() + 86400000 * 7
      },
      aiAnalysis: {
        summary: 'AI聊天应用主界面的UI设计稿，包含完整的用户界面布局和交互设计',
        keywords: ['UI设计', '界面布局', '交互设计', '用户体验'],
        language: 'visual',
        sentiment: 'positive',
        topics: ['界面设计', '用户体验', '视觉设计'],
        readingTime: 0,
        complexity: 'medium'
      },
      version: 4,
      history: []
    }
  ]

  useEffect(() => {
    setFolders(mockFolders)
    setDocuments(mockDocuments)
  }, [])

  const handleFileUpload = async (files: FileList) => {
    setIsAnalyzing(true)

    // 模拟文件上传和AI分析
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      const newDocument: Document = {
        id: `doc-${Date.now()}-${i}`,
        name: file.name,
        type: getFileType(file.name),
        size: file.size,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        folderId: selectedFolder || undefined,
        tags: [],
        isStarred: false,
        isShared: false,
        version: 1,
        history: []
      }

      // 模拟AI分析
      await new Promise(resolve => setTimeout(resolve, 2000))

      newDocument.aiAnalysis = {
        summary: `AI分析: ${file.name} 是一个${getFileType(file.name)}文件，包含相关内容的智能摘要`,
        keywords: ['自动提取', '关键词', '内容分析'],
        language: 'auto-detect',
        sentiment: 'neutral',
        topics: ['自动识别', '内容主题'],
        readingTime: Math.floor(file.size / 10000),
        complexity: 'medium'
      }

      setDocuments(prev => [newDocument, ...prev])
    }

    setIsAnalyzing(false)
    setShowUploader(false)
  }

  const getFileType = (filename: string): Document['type'] => {
    const ext = filename.split('.').pop()?.toLowerCase()
    switch (ext) {
      case 'pdf': return 'pdf'
      case 'doc':
      case 'docx': return 'doc'
      case 'txt': return 'txt'
      case 'md': return 'md'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp': return 'image'
      case 'mp4':
      case 'avi':
      case 'mov': return 'video'
      case 'mp3':
      case 'wav':
      case 'flac': return 'audio'
      default: return 'other'
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getFilteredDocuments = () => {
    let filtered = documents

    // 文件夹筛选
    if (selectedFolder) {
      filtered = filtered.filter(doc => doc.folderId === selectedFolder)
    } else if (selectedFolder === null) {
      // 显示所有文档
    }

    // 搜索筛选
    if (searchQuery) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        doc.aiAnalysis?.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.aiAnalysis?.keywords.some(keyword =>
          keyword.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    }

    // 类型筛选
    if (searchFilter.type && searchFilter.type.length > 0) {
      filtered = filtered.filter(doc => searchFilter.type!.includes(doc.type))
    }

    // 标签筛选
    if (searchFilter.tags && searchFilter.tags.length > 0) {
      filtered = filtered.filter(doc =>
        searchFilter.tags!.some(tag => doc.tags.includes(tag))
      )
    }

    // 收藏筛选
    if (searchFilter.isStarred) {
      filtered = filtered.filter(doc => doc.isStarred)
    }

    // 共享筛选
    if (searchFilter.isShared) {
      filtered = filtered.filter(doc => doc.isShared)
    }

    // 排序
    filtered.sort((a, b) => {
      let aVal: any, bVal: any

      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'date':
          aVal = a.modifiedAt
          bVal = b.modifiedAt
          break
        case 'size':
          aVal = a.size
          bVal = b.size
          break
        case 'type':
          aVal = a.type
          bVal = b.type
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return filtered
  }

  const handleToggleStar = (docId: string) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === docId ? { ...doc, isStarred: !doc.isStarred } : doc
      )
    )
  }

  const handleDeleteDocument = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId))
    setSelectedDocuments(prev => prev.filter(id => id !== docId))
  }

  const DocumentCard: React.FC<{ document: Document }> = ({ document }) => {
    const typeInfo = documentTypes.find(t => t.type === document.type)

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 group cursor-pointer"
        onClick={() => setSelectedDocument(document)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{typeInfo?.icon}</div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {document.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(document.size)} • {new Date(document.modifiedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleToggleStar(document.id)
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {document.isStarred ? (
                <StarSolidIcon className="w-4 h-4 text-yellow-400" />
              ) : (
                <StarIcon className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                // 分享功能
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <ShareIcon className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteDocument(document.id)
              }}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {document.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
            {document.tags.length > 3 && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                +{document.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {document.aiAnalysis && (
          <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {document.aiAnalysis.summary}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {document.isShared && (
              <div className="flex items-center space-x-1 text-green-600">
                <ShareIcon className="w-3 h-3" />
                <span className="text-xs">已共享</span>
              </div>
            )}
            {document.aiAnalysis && (
              <div className="flex items-center space-x-1 text-purple-600">
                <SparklesIcon className="w-3 h-3" />
                <span className="text-xs">AI分析</span>
              </div>
            )}
          </div>

          <span className="text-xs text-gray-500 dark:text-gray-400">
            v{document.version}
          </span>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            智能文档管理
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            AI驱动的文档管理系统，智能分析、快速搜索、高效协作
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 侧边栏 */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              {/* 快速操作 */}
              <div className="mb-6">
                <button
                  onClick={() => setShowUploader(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CloudArrowUpIcon className="w-4 h-4" />
                  <span>上传文件</span>
                </button>
              </div>

              {/* 文件夹 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                  文件夹
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <PlusIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </h3>

                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedFolder === null
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <FolderIcon className="w-4 h-4" />
                    <span className="text-sm">全部文件</span>
                    <span className="ml-auto text-xs text-gray-500">{documents.length}</span>
                  </button>

                  {folders.map(folder => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedFolder === folder.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <FolderIcon className={`w-4 h-4 text-${folder.color}-500`} />
                      <span className="text-sm">{folder.name}</span>
                      <span className="ml-auto text-xs text-gray-500">{folder.documentCount}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 快速筛选 */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  快速筛选
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSearchFilter({ isStarred: !searchFilter.isStarred })}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      searchFilter.isStarred
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <StarIcon className="w-4 h-4" />
                    <span className="text-sm">收藏的文件</span>
                  </button>

                  <button
                    onClick={() => setSearchFilter({ isShared: !searchFilter.isShared })}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      searchFilter.isShared
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <ShareIcon className="w-4 h-4" />
                    <span className="text-sm">共享文件</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 主内容 */}
          <div className="flex-1">
            {/* 工具栏 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* 搜索 */}
                <div className="flex-1 max-w-md relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="智能搜索文档内容、标签、摘要..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 工具按钮 */}
                <div className="flex items-center space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="date">按日期</option>
                    <option value="name">按名称</option>
                    <option value="size">按大小</option>
                    <option value="type">按类型</option>
                  </select>

                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>

                  <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 transition-colors ${
                        viewMode === 'grid'
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <ViewColumnsIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 transition-colors ${
                        viewMode === 'list'
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <TableCellsIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 文档列表 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {isAnalyzing && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3 text-blue-600">
                    <SparklesIcon className="w-6 h-6 animate-spin" />
                    <span>AI正在分析文档内容...</span>
                  </div>
                </div>
              )}

              {!isAnalyzing && getFilteredDocuments().length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchQuery || Object.keys(searchFilter).length > 0 ? '未找到匹配的文档' : '暂无文档'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchQuery || Object.keys(searchFilter).length > 0
                      ? '尝试调整搜索条件或筛选器'
                      : '上传你的第一个文档开始使用智能管理功能'
                    }
                  </p>
                  {!searchQuery && Object.keys(searchFilter).length === 0 && (
                    <button
                      onClick={() => setShowUploader(true)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      上传文档
                    </button>
                  )}
                </div>
              ) : (
                <div className={`grid gap-4 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                }`}>
                  <AnimatePresence>
                    {getFilteredDocuments().map(document => (
                      <DocumentCard key={document.id} document={document} />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 文件上传器 */}
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
                  上传文档
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
                    支持 PDF, Word, 图片, 视频等格式
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="*/*"
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

        {/* 文档详情 */}
        <AnimatePresence>
          {selectedDocument && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedDocument(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="text-3xl">
                        {documentTypes.find(t => t.type === selectedDocument.type)?.icon}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedDocument.name}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          {formatFileSize(selectedDocument.size)} • 修改于 {new Date(selectedDocument.modifiedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDocument(null)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>

                  {selectedDocument.aiAnalysis && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
                      <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-3 flex items-center space-x-2">
                        <SparklesIcon className="w-5 h-5" />
                        <span>AI智能分析</span>
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">文档摘要</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedDocument.aiAnalysis.summary}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">关键指标</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">语言:</span>
                              <span>{selectedDocument.aiAnalysis.language}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">情感:</span>
                              <span className={`${
                                selectedDocument.aiAnalysis.sentiment === 'positive' ? 'text-green-600' :
                                selectedDocument.aiAnalysis.sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {selectedDocument.aiAnalysis.sentiment}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">阅读时间:</span>
                              <span>{selectedDocument.aiAnalysis.readingTime}分钟</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">复杂度:</span>
                              <span>{selectedDocument.aiAnalysis.complexity}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">关键词</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedDocument.aiAnalysis.keywords.map(keyword => (
                              <span
                                key={keyword}
                                className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">主题标签</h4>
                          <div className="flex flex-wrap gap-1">
                            {selectedDocument.aiAnalysis.topics.map(topic => (
                              <span
                                key={topic}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        文档信息
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">文件大小:</span>
                          <span>{formatFileSize(selectedDocument.size)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">创建时间:</span>
                          <span>{new Date(selectedDocument.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">修改时间:</span>
                          <span>{new Date(selectedDocument.modifiedAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">版本:</span>
                          <span>v{selectedDocument.version}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">状态:</span>
                          <div className="flex items-center space-x-2">
                            {selectedDocument.isStarred && (
                              <span className="text-yellow-500">⭐ 已收藏</span>
                            )}
                            {selectedDocument.isShared && (
                              <span className="text-green-500">🔗 已共享</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        操作
                      </h3>
                      <div className="space-y-2">
                        <button className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          <EyeIcon className="w-4 h-4" />
                          <span>预览文档</span>
                        </button>
                        <button className="w-full flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          <span>下载文档</span>
                        </button>
                        <button className="w-full flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <ShareIcon className="w-4 h-4" />
                          <span>分享文档</span>
                        </button>
                        <button className="w-full flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <PencilIcon className="w-4 h-4" />
                          <span>编辑标签</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedDocument.history.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        版本历史
                      </h3>
                      <div className="space-y-3">
                        {selectedDocument.history.map(version => (
                          <div
                            key={version.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                版本 {version.version}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {version.author} • {new Date(version.createdAt).toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {version.changes}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-500">
                              {formatFileSize(version.size)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default SmartDocumentManager
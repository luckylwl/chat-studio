import React, { useState, useCallback, useRef } from 'react'
import {
  DocumentTextIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  ArrowUpTrayIcon,
  TagIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  TrashIcon,
  ShareIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import { knowledgeBaseService } from '@/services/knowledgeBaseService'
import type {
  Document,
  SearchQuery,
  KnowledgeGraph,
  QAResult
} from '@/services/knowledgeBaseService'

interface KnowledgeBaseServiceUIProps {
  className?: string
}

type ViewMode = 'documents' | 'search' | 'knowledge-graph' | 'qa'

export const KnowledgeBaseServiceUI: React.FC<KnowledgeBaseServiceUIProps> = ({ className }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('documents')
  const [documents, setDocuments] = useState<Document[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Document[]>([])
  const [searchType, setSearchType] = useState<'keyword' | 'semantic' | 'hybrid'>('hybrid')

  // Knowledge Graph
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraph | null>(null)

  // Q&A
  const [qaQuestion, setQaQuestion] = useState('')
  const [qaResult, setQaResult] = useState<QAResult | null>(null)
  const [selectedDocsForQA, setSelectedDocsForQA] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load documents on mount
  React.useEffect(() => {
    setDocuments(knowledgeBaseService.getAllDocuments())
  }, [])

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsProcessing(true)
    try {
      const uploadPromises = Array.from(files).map(file =>
        knowledgeBaseService.importDocument(file, {
          category: 'General',
          tags: [],
          language: 'en'
        })
      )

      const uploadedDocs = await Promise.all(uploadPromises)
      setDocuments(prev => [...uploadedDocs, ...prev])
      toast.success(`Successfully uploaded ${files.length} document(s)`)

      // Auto-tag documents
      for (const doc of uploadedDocs) {
        try {
          await knowledgeBaseService.autoTagDocument(doc.id)
        } catch (error) {
          console.error(`Failed to auto-tag document ${doc.id}:`, error)
        }
      }

      setDocuments(knowledgeBaseService.getAllDocuments())
    } catch (error) {
      toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [])

  // Handle OCR
  const handleOCR = useCallback(async (docId: string) => {
    setIsProcessing(true)
    try {
      const result = await knowledgeBaseService.ocrDocument(docId)
      toast.success(`OCR completed! Extracted ${result.text.length} characters with ${Math.round(result.confidence * 100)}% confidence`)
      setDocuments(knowledgeBaseService.getAllDocuments())
    } catch (error) {
      toast.error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // Handle Search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setIsProcessing(true)
    try {
      const query: SearchQuery = {
        query: searchQuery,
        searchType,
        filters: {},
        limit: 20,
        offset: 0
      }

      const results = await knowledgeBaseService.search(query)
      setSearchResults(results.results)
      toast.success(`Found ${results.total} results`)
    } catch (error) {
      toast.error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [searchQuery, searchType])

  // Build Knowledge Graph
  const handleBuildKnowledgeGraph = useCallback(async () => {
    setIsProcessing(true)
    try {
      const docIds = selectedDocsForQA.length > 0 ? selectedDocsForQA : documents.map(d => d.id)
      const graph = await knowledgeBaseService.buildKnowledgeGraph(docIds)
      setKnowledgeGraph(graph)
      toast.success(`Built knowledge graph with ${graph.entities.length} entities and ${graph.relationships.length} relationships`)
    } catch (error) {
      toast.error(`Knowledge graph failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [documents, selectedDocsForQA])

  // Handle Q&A
  const handleQA = useCallback(async () => {
    if (!qaQuestion.trim()) {
      toast.error('Please enter a question')
      return
    }

    setIsProcessing(true)
    try {
      const docIds = selectedDocsForQA.length > 0 ? selectedDocsForQA : undefined
      const result = await knowledgeBaseService.intelligentQA(qaQuestion, docIds)
      setQaResult(result)
      toast.success('Answer generated!')
    } catch (error) {
      toast.error(`Q&A failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [qaQuestion, selectedDocsForQA])

  // Delete document
  const handleDeleteDocument = useCallback((docId: string) => {
    knowledgeBaseService.deleteDocument(docId)
    setDocuments(prev => prev.filter(d => d.id !== docId))
    toast.success('Document deleted')
  }, [])

  const stats = knowledgeBaseService.getStatistics()

  return (
    <div className={cn('flex flex-col h-full bg-white dark:bg-gray-900 rounded-lg shadow-lg', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg">
            <FolderIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Knowledge Base Management</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {stats.totalDocuments} Documents • {stats.totalPages} Pages
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.html"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
          >
            <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
            Upload Documents
          </Button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'documents' as ViewMode, label: 'Documents', icon: DocumentTextIcon },
          { id: 'search' as ViewMode, label: 'Search', icon: MagnifyingGlassIcon },
          { id: 'knowledge-graph' as ViewMode, label: 'Knowledge Graph', icon: ChartBarIcon },
          { id: 'qa' as ViewMode, label: 'Q&A', icon: ChatBubbleLeftRightIcon },
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
              viewMode === mode.id
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            <mode.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Documents View */}
        {viewMode === 'documents' && (
          <div className="space-y-4">
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-600">
                <FolderIcon className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">No documents yet</p>
                <p className="text-sm">Upload documents to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          {doc.format}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteDocument(doc.id)
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {doc.title}
                    </h3>

                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {doc.metadata.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {doc.metadata.tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                            +{doc.metadata.tags.length - 3}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>{doc.metadata.size ? `${Math.round(doc.metadata.size / 1024)} KB` : 'N/A'}</span>
                        <span>{new Date(doc.metadata.createdAt).toLocaleDateString()}</span>
                      </div>

                      {doc.format === 'pdf' && !doc.ocr && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOCR(doc.id)
                          }}
                          className="w-full mt-2"
                        >
                          <EyeIcon className="w-3 h-3 mr-1" />
                          Run OCR
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Document Detail */}
            {selectedDocument && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedDocument.title}</h3>
                    <button
                      onClick={() => setSelectedDocument(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Content</p>
                        <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                          {selectedDocument.content.substring(0, 1000)}
                          {selectedDocument.content.length > 1000 && '...'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Metadata</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Category:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{selectedDocument.metadata.category}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Language:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{selectedDocument.metadata.language}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Size:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">
                              {selectedDocument.metadata.size ? `${Math.round(selectedDocument.metadata.size / 1024)} KB` : 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Pages:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{selectedDocument.metadata.pageCount || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {selectedDocument.ocr && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">OCR Results</p>
                          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                            <p className="text-sm text-gray-900 dark:text-white mb-2">{selectedDocument.ocr.text.substring(0, 500)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Confidence: {Math.round(selectedDocument.ocr.confidence * 100)}% •
                              Languages: {selectedDocument.ocr.languages.join(', ')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search View */}
        {viewMode === 'search' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search documents..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
              >
                <option value="keyword">Keyword</option>
                <option value="semantic">Semantic</option>
                <option value="hybrid">Hybrid</option>
              </select>
              <Button
                onClick={handleSearch}
                disabled={isProcessing || !searchQuery.trim()}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
              >
                {isProcessing ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <MagnifyingGlassIcon className="w-5 h-5" />
                )}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found {searchResults.length} results
                </p>
                {searchResults.map(doc => (
                  <div
                    key={doc.id}
                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{doc.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {doc.content.substring(0, 200)}...
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {doc.metadata.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <DocumentTextIcon className="w-5 h-5 text-gray-400 ml-3" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Knowledge Graph View */}
        {viewMode === 'knowledge-graph' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Build a knowledge graph from your documents to visualize relationships
              </p>
              <Button
                onClick={handleBuildKnowledgeGraph}
                disabled={isProcessing || documents.length === 0}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              >
                {isProcessing ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    Building...
                  </>
                ) : (
                  <>
                    <ChartBarIcon className="w-4 h-4 mr-2" />
                    Build Graph
                  </>
                )}
              </Button>
            </div>

            {knowledgeGraph && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Entities</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{knowledgeGraph.entities.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Relationships</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{knowledgeGraph.relationships.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Topics</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{knowledgeGraph.topics.length}</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Key Entities</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {knowledgeGraph.entities.slice(0, 10).map(entity => (
                      <div key={entity.id} className="bg-white dark:bg-gray-700 rounded-lg p-3">
                        <p className="font-medium text-gray-900 dark:text-white">{entity.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{entity.type}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {knowledgeGraph.topics.map((topic, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Q&A View */}
        {viewMode === 'qa' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ask a question about your documents
              </label>
              <textarea
                value={qaQuestion}
                onChange={(e) => setQaQuestion(e.target.value)}
                placeholder="What would you like to know?"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedDocsForQA.length > 0
                  ? `Searching in ${selectedDocsForQA.length} selected documents`
                  : 'Searching in all documents'}
              </p>
              <Button
                onClick={handleQA}
                disabled={isProcessing || !qaQuestion.trim() || documents.length === 0}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white"
              >
                {isProcessing ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Get Answer
                  </>
                )}
              </Button>
            </div>

            {qaResult && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Answer</h3>
                <p className="text-gray-900 dark:text-white mb-4 leading-relaxed">{qaResult.answer}</p>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Confidence:</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                      style={{ width: `${qaResult.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {Math.round(qaResult.confidence * 100)}%
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Sources</p>
                  <div className="space-y-2">
                    {qaResult.sources.map((source, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{source.title}</p>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{Math.round(source.relevance * 100)}%</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{source.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
            <span>Documents: {stats.totalDocuments}</span>
            <span>•</span>
            <span>Storage: {Math.round(stats.totalSize / 1024 / 1024)} MB</span>
            <span>•</span>
            <span>Q&A Queries: {stats.qaQueries}</span>
          </div>
          <div className="text-gray-500 dark:text-gray-500 text-xs">
            AI-Powered Knowledge Base
          </div>
        </div>
      </div>
    </div>
  )
}

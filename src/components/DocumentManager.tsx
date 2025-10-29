import React, { useState, useEffect } from 'react'
import { Document, KnowledgeBase } from '../types'
import vectorDatabaseService from '../services/vectorDatabaseService'
import { Upload, File, Trash2, Search, Plus, Folder, Database } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'

export const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [selectedKB, setSelectedKB] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showNewKBModal, setShowNewKBModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [docs, kbs] = await Promise.all([
        vectorDatabaseService.getAllDocuments(),
        vectorDatabaseService.getAllKnowledgeBases()
      ])
      setDocuments(docs)
      setKnowledgeBases(kbs)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load documents')
    }
  }

  const onDrop = async (acceptedFiles: File[]) => {
    const toastId = toast.loading('Uploading and processing documents...')

    try {
      for (const file of acceptedFiles) {
        const { title, content } = await vectorDatabaseService.parseDocument(file)

        const newDoc: Omit<Document, 'chunks' | 'embeddings'> = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title,
          content,
          type: getDocumentType(file.name),
          size: file.size,
          uploadedAt: Date.now(),
          userId: 'current_user', // Replace with actual user ID
          tags: [],
          metadata: {
            language: 'en' // Could be detected
          }
        }

        await vectorDatabaseService.addDocument(newDoc)

        // Add to selected knowledge base if any
        if (selectedKB) {
          await vectorDatabaseService.addDocumentsToKnowledgeBase(selectedKB, [newDoc.id])
        }
      }

      toast.success(`Uploaded ${acceptedFiles.length} document(s)`, { id: toastId })
      loadData()
    } catch (error: any) {
      console.error('Error uploading documents:', error)
      toast.error(error.message || 'Failed to upload documents', { id: toastId })
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  })

  const deleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      await vectorDatabaseService.deleteDocument(docId)
      toast.success('Document deleted')
      loadData()
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const results = await vectorDatabaseService.semanticSearch(searchQuery, {
        topK: 10,
        knowledgeBaseId: selectedKB || undefined
      })
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const createKnowledgeBase = async (name: string, description: string) => {
    try {
      const newKB = await vectorDatabaseService.createKnowledgeBase({
        id: `kb_${Date.now()}`,
        name,
        description,
        documentIds: [],
        isPublic: false,
        ownerId: 'current_user', // Replace with actual user ID
        collaborators: []
      })
      setKnowledgeBases([...knowledgeBases, newKB])
      setShowNewKBModal(false)
      toast.success('Knowledge base created')
    } catch (error) {
      console.error('Error creating knowledge base:', error)
      toast.error('Failed to create knowledge base')
    }
  }

  const filteredDocuments = selectedKB
    ? documents.filter(doc => {
        const kb = knowledgeBases.find(k => k.id === selectedKB)
        return kb?.documentIds.includes(doc.id)
      })
    : documents

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Document & Knowledge Base Manager
        </h2>

        {/* Knowledge Base Selector */}
        <div className="flex gap-2 mb-4">
          <select
            value={selectedKB || ''}
            onChange={(e) => setSelectedKB(e.target.value || null)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Documents</option>
            {knowledgeBases.map(kb => (
              <option key={kb.id} value={kb.id}>
                {kb.name} ({kb.documentIds.length} docs)
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowNewKBModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            New KB
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Semantic search across documents..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Search size={16} />
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Document List */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={`mb-6 p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-2 text-gray-400" size={32} />
            <p className="text-gray-600 dark:text-gray-400">
              {isDragActive
                ? 'Drop files here...'
                : 'Drag & drop documents here, or click to select'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Supports: TXT, MD, PDF, DOCX
            </p>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map(doc => (
              <div
                key={doc.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <File className="flex-shrink-0 text-blue-500" size={20} />
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {doc.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => deleteDocument(doc.id)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Type: {doc.type.toUpperCase()}</p>
                  <p>Size: {formatBytes(doc.size)}</p>
                  <p>Chunks: {doc.chunks?.length || 0}</p>
                  <p>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                </div>

                {doc.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {doc.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No documents uploaded yet
            </div>
          )}
        </div>

        {/* Search Results Panel */}
        {searchResults.length > 0 && (
          <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Search Results ({searchResults.length})
            </h3>
            <div className="space-y-3">
              {searchResults.map((result, i) => (
                <div
                  key={i}
                  className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Relevance: {(result.score * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-4">
                    {result.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Knowledge Base Modal */}
      {showNewKBModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create Knowledge Base
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                createKnowledgeBase(
                  formData.get('name') as string,
                  formData.get('description') as string
                )
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewKBModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function getDocumentType(filename: string): 'pdf' | 'docx' | 'txt' | 'md' | 'url' {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf':
      return 'pdf'
    case 'docx':
      return 'docx'
    case 'md':
      return 'md'
    default:
      return 'txt'
  }
}

export default DocumentManager

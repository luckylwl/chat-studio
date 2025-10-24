import React, { useState, useEffect } from 'react'
import {
  BookOpenIcon,
  PlusIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  FolderIcon,
  ArrowUpTrayIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { Button, Card } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import { vectorDB, type VectorCollection } from '@/services/vectorDatabase'
import { ragService } from '@/services/ragService'
import { embeddingService } from '@/services/embeddingService'

interface KnowledgeBaseManagerProps {
  onSelectCollection?: (collectionId: string) => void
  className?: string
}

const KnowledgeBaseManager: React.FC<KnowledgeBaseManagerProps> = ({
  onSelectCollection,
  className
}) => {
  const [collections, setCollections] = useState<VectorCollection[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDesc, setNewCollectionDesc] = useState('')
  const [uploadingFile, setUploadingFile] = useState(false)
  const [embeddingReady, setEmbeddingReady] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadCollections()
    checkEmbeddingService()
  }, [])

  const checkEmbeddingService = async () => {
    try {
      await embeddingService.initialize()
      setEmbeddingReady(true)
      toast.success('嵌入模型已加载')
    } catch (error) {
      console.error('Failed to initialize embedding service:', error)
      toast.error('嵌入模型加载失败')
    }
  }

  const loadCollections = async () => {
    setIsLoading(true)
    try {
      await vectorDB.initialize()
      const cols = vectorDB.listCollections()
      setCollections(cols)

      const dbStats = vectorDB.getStats()
      setStats(dbStats)
    } catch (error: any) {
      toast.error(`加载失败: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const createCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error('请输入知识库名称')
      return
    }

    try {
      const collection = await vectorDB.createCollection(
        newCollectionName,
        newCollectionDesc
      )
      setCollections([...collections, collection])
      setNewCollectionName('')
      setNewCollectionDesc('')
      setShowCreateModal(false)
      toast.success('知识库创建成功')
    } catch (error: any) {
      toast.error(`创建失败: ${error.message}`)
    }
  }

  const deleteCollection = async (collectionId: string) => {
    if (!confirm('确定要删除这个知识库吗？此操作不可恢复。')) {
      return
    }

    try {
      await vectorDB.deleteCollection(collectionId)
      setCollections(collections.filter(c => c.id !== collectionId))
      if (selectedCollection === collectionId) {
        setSelectedCollection(null)
      }
      toast.success('知识库已删除')
    } catch (error: any) {
      toast.error(`删除失败: ${error.message}`)
    }
  }

  const handleFileUpload = async (
    collectionId: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    if (!embeddingReady) {
      toast.error('嵌入模型未就绪，请稍候')
      return
    }

    setUploadingFile(true)

    try {
      for (const file of Array.from(files)) {
        toast.loading(`正在处理 ${file.name}...`, { id: 'upload' })

        const result = await ragService.addDocument(collectionId, file, {
          chunkSize: 500,
          overlap: 50
        })

        toast.success(
          `${file.name} 已添加 (${result.chunksAdded} 个片段)`,
          { id: 'upload' }
        )
      }

      // Refresh collections
      await loadCollections()
    } catch (error: any) {
      toast.error(`上传失败: ${error.message}`, { id: 'upload' })
    } finally {
      setUploadingFile(false)
      event.target.value = '' // Reset input
    }
  }

  const selectCollection = (collectionId: string) => {
    setSelectedCollection(collectionId)
    if (onSelectCollection) {
      onSelectCollection(collectionId)
    }
  }

  const getCollectionStats = async (collectionId: string) => {
    try {
      const stats = await ragService.getCollectionStats(collectionId)
      alert(`知识库统计:
文档数: ${stats.documentCount}
总片段: ${stats.totalChunks}
平均片段大小: ${stats.averageChunkSize} 字符
来源: ${stats.sources.join(', ') || '无'}`)
    } catch (error: any) {
      toast.error(`获取统计失败: ${error.message}`)
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpenIcon className="w-6 h-6 text-primary-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            知识库管理
          </h2>
        </div>
        <Button onClick={() => setShowCreateModal(true)} size="sm">
          <PlusIcon className="w-4 h-4 mr-1" />
          新建知识库
        </Button>
      </div>

      {/* Embedding Status */}
      {!embeddingReady && (
        <Card className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⏳ 正在加载嵌入模型...
          </p>
        </Card>
      )}

      {/* Statistics */}
      {stats && (
        <Card className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {stats.collectionCount}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">知识库</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.totalDocuments}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">文档</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {embeddingReady ? '✓' : '⏳'}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">模型状态</div>
            </div>
          </div>
        </Card>
      )}

      {/* Collections List */}
      <div className="space-y-2">
        {collections.length === 0 ? (
          <Card className="p-8 text-center">
            <FolderIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 dark:text-gray-400">
              还没有知识库，创建一个开始吧
            </p>
          </Card>
        ) : (
          collections.map((collection) => (
            <Card
              key={collection.id}
              className={cn(
                'p-4 cursor-pointer transition-all',
                selectedCollection === collection.id
                  ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
              onClick={() => selectCollection(collection.id)}
            >
              <div className="flex items-start gap-3">
                <BookOpenIcon className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {collection.name}
                  </h3>
                  {collection.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>📄 {collection.documentCount} 文档</span>
                    <span>📏 {collection.dimensions}维</span>
                    <span>
                      🕒 {new Date(collection.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <input
                    type="file"
                    id={`upload-${collection.id}`}
                    className="hidden"
                    multiple
                    accept=".pdf,.docx,.doc,.txt,.md"
                    onChange={(e) => handleFileUpload(collection.id, e)}
                    disabled={!embeddingReady || uploadingFile}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      document.getElementById(`upload-${collection.id}`)?.click()
                    }}
                    disabled={!embeddingReady || uploadingFile}
                    className="h-8 w-8 p-0"
                    title="上传文档"
                  >
                    <ArrowUpTrayIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      getCollectionStats(collection.id)
                    }}
                    className="h-8 w-8 p-0"
                    title="查看统计"
                  >
                    <ChartBarIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteCollection(collection.id)
                    }}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    title="删除"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              创建新知识库
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  知识库名称 *
                </label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="例如: 产品文档、技术手册"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  描述 (可选)
                </label>
                <textarea
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                  placeholder="简要描述这个知识库的用途"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateModal(false)
                  setNewCollectionName('')
                  setNewCollectionDesc('')
                }}
              >
                取消
              </Button>
              <Button onClick={createCollection}>
                创建
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default KnowledgeBaseManager

import React, { useState, useMemo } from 'react'
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  CodeBracketIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { Button, Badge } from './ui'
import { cn } from '@/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface MessageVersion {
  id: string
  content: string
  timestamp: number
  model?: string
  tokens?: number
  metadata?: Record<string, any>
}

interface MessageBranch {
  id: string
  parentMessageId: string | null
  versions: MessageVersion[]
  currentVersionIndex: number
  childBranches: string[]
  isActive: boolean
}

interface MessageBranchingProps {
  messageId: string
  currentContent: string
  onVersionChange: (content: string, versionId: string) => void
  onCreateBranch: (fromVersionId: string) => void
  className?: string
}

const MessageBranching: React.FC<MessageBranchingProps> = ({
  messageId,
  currentContent,
  onVersionChange,
  onCreateBranch,
  className
}) => {
  const [branches, setBranches] = useState<Record<string, MessageBranch>>({
    main: {
      id: 'main',
      parentMessageId: null,
      versions: [
        {
          id: `v1-${Date.now()}`,
          content: currentContent,
          timestamp: Date.now()
        }
      ],
      currentVersionIndex: 0,
      childBranches: [],
      isActive: true
    }
  })
  const [activeBranchId, setActiveBranchId] = useState('main')
  const [showHistory, setShowHistory] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [compareVersions, setCompareVersions] = useState<[string, string] | null>(null)

  const activeBranch = branches[activeBranchId]
  const currentVersion = activeBranch?.versions[activeBranch.currentVersionIndex]
  const canUndo = activeBranch && activeBranch.currentVersionIndex > 0
  const canRedo = activeBranch && activeBranch.currentVersionIndex < activeBranch.versions.length - 1

  // 创建新版本
  const createVersion = (content: string, metadata?: Record<string, any>) => {
    setBranches(prev => {
      const branch = prev[activeBranchId]
      if (!branch) return prev

      const newVersion: MessageVersion = {
        id: `v${branch.versions.length + 1}-${Date.now()}`,
        content,
        timestamp: Date.now(),
        metadata
      }

      // 如果不在最新版本，则移除后续版本（创建新分支）
      const versions =
        branch.currentVersionIndex === branch.versions.length - 1
          ? [...branch.versions, newVersion]
          : [...branch.versions.slice(0, branch.currentVersionIndex + 1), newVersion]

      return {
        ...prev,
        [activeBranchId]: {
          ...branch,
          versions,
          currentVersionIndex: versions.length - 1
        }
      }
    })

    onVersionChange(content, `v${activeBranch.versions.length + 1}`)
    toast.success('新版本已保存')
  }

  // 撤销到上一个版本
  const undo = () => {
    if (!canUndo) return

    const newIndex = activeBranch.currentVersionIndex - 1
    const version = activeBranch.versions[newIndex]

    setBranches(prev => ({
      ...prev,
      [activeBranchId]: {
        ...prev[activeBranchId],
        currentVersionIndex: newIndex
      }
    }))

    onVersionChange(version.content, version.id)
    toast.success('已撤销')
  }

  // 重做到下一个版本
  const redo = () => {
    if (!canRedo) return

    const newIndex = activeBranch.currentVersionIndex + 1
    const version = activeBranch.versions[newIndex]

    setBranches(prev => ({
      ...prev,
      [activeBranchId]: {
        ...prev[activeBranchId],
        currentVersionIndex: newIndex
      }
    }))

    onVersionChange(version.content, version.id)
    toast.success('已重做')
  }

  // 跳转到特定版本
  const goToVersion = (versionIndex: number) => {
    const version = activeBranch.versions[versionIndex]
    if (!version) return

    setBranches(prev => ({
      ...prev,
      [activeBranchId]: {
        ...prev[activeBranchId],
        currentVersionIndex: versionIndex
      }
    }))

    onVersionChange(version.content, version.id)
    setShowHistory(false)
  }

  // 创建分支
  const createBranch = (fromVersionId: string) => {
    const branchId = `branch-${Date.now()}`
    const versionIndex = activeBranch.versions.findIndex(v => v.id === fromVersionId)
    const sourceVersion = activeBranch.versions[versionIndex]

    if (!sourceVersion) return

    setBranches(prev => ({
      ...prev,
      [branchId]: {
        id: branchId,
        parentMessageId: activeBranchId,
        versions: [{ ...sourceVersion, id: `${branchId}-v1` }],
        currentVersionIndex: 0,
        childBranches: [],
        isActive: false
      },
      [activeBranchId]: {
        ...prev[activeBranchId],
        childBranches: [...prev[activeBranchId].childBranches, branchId]
      }
    }))

    setActiveBranchId(branchId)
    onCreateBranch(fromVersionId)
    toast.success('已创建新分支')
  }

  // 比较两个版本
  const startCompare = (versionId1: string, versionId2: string) => {
    setCompareVersions([versionId1, versionId2])
    setCompareMode(true)
  }

  // 计算版本差异
  const getDiff = (text1: string, text2: string) => {
    const words1 = text1.split(/\s+/)
    const words2 = text2.split(/\s+/)
    const maxLen = Math.max(words1.length, words2.length)

    const diff: Array<{ type: 'added' | 'removed' | 'unchanged'; text: string }> = []

    // 简单的差异算法
    for (let i = 0; i < maxLen; i++) {
      if (i >= words1.length) {
        diff.push({ type: 'added', text: words2[i] })
      } else if (i >= words2.length) {
        diff.push({ type: 'removed', text: words1[i] })
      } else if (words1[i] !== words2[i]) {
        diff.push({ type: 'removed', text: words1[i] })
        diff.push({ type: 'added', text: words2[i] })
      } else {
        diff.push({ type: 'unchanged', text: words1[i] })
      }
    }

    return diff
  }

  // 所有分支列表
  const allBranches = useMemo(() => {
    return Object.values(branches)
  }, [branches])

  return (
    <div className={cn('relative', className)}>
      {/* Control Bar */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={!canUndo}
            className="h-8 w-8 p-0"
            title="撤销 (Ctrl+Z)"
          >
            <ArrowUturnLeftIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={!canRedo}
            className="h-8 w-8 p-0"
            title="重做 (Ctrl+Shift+Z)"
          >
            <ArrowUturnRightIcon className="w-4 h-4" />
          </Button>
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHistory(!showHistory)}
          className="h-8 px-3"
        >
          <ClockIcon className="w-4 h-4 mr-1" />
          历史
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCompareMode(!compareMode)}
          className="h-8 px-3"
        >
          <CodeBracketIcon className="w-4 h-4 mr-1" />
          对比
        </Button>

        <div className="flex-1" />

        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span>
            版本 {activeBranch?.currentVersionIndex + 1}/{activeBranch?.versions.length}
          </span>
          {allBranches.length > 1 && (
            <>
              <span>•</span>
              <span>{allBranches.length} 个分支</span>
            </>
          )}
        </div>
      </div>

      {/* Version History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 max-h-96 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                版本历史
              </h3>

              <div className="space-y-2">
                {activeBranch?.versions.map((version, index) => (
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => goToVersion(index)}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      index === activeBranch.currentVersionIndex
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                        : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          v{index + 1}
                        </Badge>
                        {index === activeBranch.currentVersionIndex && (
                          <CheckCircleIcon className="w-4 h-4 text-primary-500" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(version.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                      {version.content}
                    </p>

                    {version.metadata && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        {version.model && <span>模型: {version.model}</span>}
                        {version.tokens && <span>• {version.tokens} tokens</span>}
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          createBranch(version.id)
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        创建分支
                      </Button>
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            startCompare(
                              activeBranch.versions[index - 1].id,
                              version.id
                            )
                          }}
                          className="h-6 px-2 text-xs"
                        >
                          与上一版本对比
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Branch List */}
              {allBranches.length > 1 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    所有分支
                  </h4>
                  <div className="space-y-1">
                    {allBranches.map(branch => (
                      <button
                        key={branch.id}
                        onClick={() => {
                          setActiveBranchId(branch.id)
                          setShowHistory(false)
                        }}
                        className={cn(
                          'w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors',
                          branch.id === activeBranchId
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        )}
                      >
                        <span>{branch.id === 'main' ? '主分支' : branch.id}</span>
                        <Badge variant="secondary" className="text-xs">
                          {branch.versions.length} 版本
                        </Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare Mode */}
      <AnimatePresence>
        {compareMode && compareVersions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  版本对比
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCompareMode(false)
                    setCompareVersions(null)
                  }}
                >
                  关闭
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {compareVersions.map((versionId, index) => {
                  const version = activeBranch?.versions.find(v => v.id === versionId)
                  if (!version) return null

                  return (
                    <div key={versionId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">版本 {index + 1}</Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(version.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm max-h-64 overflow-y-auto">
                        {version.content}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Diff View */}
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  差异
                </h4>
                <div className="text-sm space-y-1">
                  {(() => {
                    const v1 = activeBranch?.versions.find(v => v.id === compareVersions[0])
                    const v2 = activeBranch?.versions.find(v => v.id === compareVersions[1])
                    if (!v1 || !v2) return null

                    const diff = getDiff(v1.content, v2.content)
                    return diff.map((item, i) => (
                      <span
                        key={i}
                        className={cn(
                          'inline-block px-1 rounded',
                          item.type === 'added' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                          item.type === 'removed' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 line-through'
                        )}
                      >
                        {item.text}{' '}
                      </span>
                    ))
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MessageBranching
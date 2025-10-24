import React, { useState, useMemo } from 'react'
import {
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  Square2StackIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { Button, Modal } from '@/components/ui'
import type { Message } from '@/types'
import { cn } from '@/utils'

export interface MessageBranch {
  id: string
  parentMessageId: string | null
  messages: Message[]
  createdAt: number
  label?: string
}

export interface BranchHistory {
  branches: MessageBranch[]
  currentBranchId: string
  currentStep: number
}

interface ConversationBranchManagerProps {
  isOpen: boolean
  onClose: () => void
  history: BranchHistory
  onBranchSelect: (branchId: string, step: number) => void
  onCreateBranch: (fromMessageId: string) => void
  onDeleteBranch: (branchId: string) => void
  onUpdateLabel: (branchId: string, label: string) => void
}

/**
 * 对话分支管理器
 * 类似Git的分支管理,支持:
 * - 创建分支
 * - 切换分支
 * - 合并分支
 * - 可视化分支树
 */
export const ConversationBranchManager: React.FC<ConversationBranchManagerProps> = ({
  isOpen,
  onClose,
  history,
  onBranchSelect,
  onCreateBranch,
  onDeleteBranch,
  onUpdateLabel
}) => {
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')

  const currentBranch = useMemo(
    () => history.branches.find(b => b.id === history.currentBranchId),
    [history.branches, history.currentBranchId]
  )

  // 构建分支树
  const branchTree = useMemo(() => {
    const tree: Array<{
      branch: MessageBranch
      depth: number
      children: MessageBranch[]
    }> = []

    const buildTree = (parentId: string | null, depth = 0) => {
      const branches = history.branches.filter(
        b => b.parentMessageId === parentId
      )

      branches.forEach(branch => {
        const children = history.branches.filter(
          b => b.parentMessageId === branch.messages[branch.messages.length - 1]?.id
        )

        tree.push({ branch, depth, children })

        if (children.length > 0) {
          buildTree(branch.messages[branch.messages.length - 1]?.id, depth + 1)
        }
      })
    }

    buildTree(null)
    return tree
  }, [history.branches])

  const handleSaveLabel = () => {
    if (editingBranchId && editLabel.trim()) {
      onUpdateLabel(editingBranchId, editLabel.trim())
      setEditingBranchId(null)
      setEditLabel('')
    }
  }

  const getBranchColor = (branchId: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-teal-500'
    ]

    const index = history.branches.findIndex(b => b.id === branchId)
    return colors[index % colors.length]
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="对话分支管理"
      size="lg"
    >
      <div className="flex flex-col h-[600px]">
        {/* 当前分支信息 */}
        <div className="flex-shrink-0 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-3 h-3 rounded-full',
                getBranchColor(history.currentBranchId)
              )} />
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {currentBranch?.label || '主分支'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {currentBranch?.messages.length || 0} 条消息 · 第 {history.currentStep + 1} 步
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (history.currentStep > 0) {
                    onBranchSelect(history.currentBranchId, history.currentStep - 1)
                  }
                }}
                disabled={history.currentStep === 0}
                title="撤销 (Ctrl+Z)"
              >
                <ArrowUturnLeftIcon className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentBranch && history.currentStep < currentBranch.messages.length - 1) {
                    onBranchSelect(history.currentBranchId, history.currentStep + 1)
                  }
                }}
                disabled={
                  !currentBranch ||
                  history.currentStep >= currentBranch.messages.length - 1
                }
                title="重做 (Ctrl+Shift+Z)"
              >
                <ArrowUturnRightIcon className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentBranch) {
                    const lastMessage = currentBranch.messages[history.currentStep]
                    if (lastMessage) {
                      onCreateBranch(lastMessage.id)
                    }
                  }
                }}
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                新建分支
              </Button>
            </div>
          </div>
        </div>

        {/* 分支列表 */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {branchTree.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <Square2StackIcon className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">暂无分支</p>
              <p className="text-sm">开始对话后可以创建分支</p>
            </div>
          ) : (
            <div className="space-y-3">
              {branchTree.map(({ branch, depth, children }) => (
                <div
                  key={branch.id}
                  className={cn(
                    'relative',
                    depth > 0 && 'ml-8'
                  )}
                >
                  {/* 分支线条 */}
                  {depth > 0 && (
                    <div className="absolute left-0 top-1/2 w-6 h-px bg-gray-300 dark:bg-gray-600 -ml-6" />
                  )}

                  {/* 分支卡片 */}
                  <button
                    onClick={() => onBranchSelect(branch.id, branch.messages.length - 1)}
                    className={cn(
                      'w-full text-left p-4 rounded-lg border transition-all duration-200',
                      branch.id === history.currentBranchId
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 shadow-sm'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn(
                          'w-3 h-3 rounded-full flex-shrink-0 mt-1',
                          getBranchColor(branch.id)
                        )} />

                        <div className="flex-1 min-w-0">
                          {editingBranchId === branch.id ? (
                            <input
                              type="text"
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              onBlur={handleSaveLabel}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveLabel()
                                if (e.key === 'Escape') {
                                  setEditingBranchId(null)
                                  setEditLabel('')
                                }
                              }}
                              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div
                              className="font-medium text-gray-900 dark:text-gray-100 truncate cursor-pointer"
                              onDoubleClick={(e) => {
                                e.stopPropagation()
                                setEditingBranchId(branch.id)
                                setEditLabel(branch.label || '')
                              }}
                            >
                              {branch.label || `分支 ${branchTree.findIndex(t => t.branch.id === branch.id) + 1}`}
                            </div>
                          )}

                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                            <span>{branch.messages.length} 条消息</span>
                            <span>·</span>
                            <span>{children.length} 个子分支</span>
                            <span>·</span>
                            <span>
                              {new Date(branch.createdAt).toLocaleString('zh-CN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        {branch.id === history.currentBranchId && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                            当前
                          </span>
                        )}

                        {branch.id !== history.branches[0]?.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('确定要删除此分支吗?')) {
                                onDeleteBranch(branch.id)
                              }
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          >
                            <TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 预览最后一条消息 */}
                    {branch.messages.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {branch.messages[branch.messages.length - 1].content}
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 快捷键提示 */}
        <div className="flex-shrink-0 mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <div className="font-medium mb-1">快捷键:</div>
            <div className="grid grid-cols-2 gap-2">
              <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border">Ctrl+Z</kbd> 撤销</div>
              <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border">Ctrl+Shift+Z</kbd> 重做</div>
              <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border">双击</kbd> 编辑标签</div>
              <div><kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded border">点击</kbd> 切换分支</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ConversationBranchManager

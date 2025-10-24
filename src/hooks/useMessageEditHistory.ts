import { useState, useCallback, useRef } from 'react'

export interface EditHistoryEntry {
  id: string
  content: string
  timestamp: number
}

export interface MessageEditHistory {
  messageId: string
  history: EditHistoryEntry[]
  currentIndex: number
}

/**
 * 消息编辑历史Hook
 * 提供撤销/重做功能
 */
export function useMessageEditHistory(initialContent: string = '') {
  const [history, setHistory] = useState<EditHistoryEntry[]>([
    {
      id: Date.now().toString(),
      content: initialContent,
      timestamp: Date.now()
    }
  ])
  const [currentIndex, setCurrentIndex] = useState(0)
  const lastSaveRef = useRef(Date.now())

  // 获取当前内容
  const currentContent = history[currentIndex]?.content || ''

  // 保存新的编辑状态
  const saveEdit = useCallback((content: string, force: boolean = false) => {
    // 防抖: 1秒内的多次编辑合并为一次
    const now = Date.now()
    if (!force && now - lastSaveRef.current < 1000 && history.length > 0) {
      // 更新最后一个条目而不是创建新条目
      setHistory(prev => {
        const newHistory = [...prev]
        newHistory[currentIndex] = {
          ...newHistory[currentIndex],
          content,
          timestamp: now
        }
        return newHistory
      })
      return
    }

    lastSaveRef.current = now

    // 如果当前不在最新位置,删除后续历史
    const newHistory = history.slice(0, currentIndex + 1)

    // 添加新条目
    newHistory.push({
      id: now.toString(),
      content,
      timestamp: now
    })

    // 限制历史记录数量(最多50条)
    if (newHistory.length > 50) {
      newHistory.shift()
    } else {
      setCurrentIndex(prev => prev + 1)
    }

    setHistory(newHistory)
  }, [history, currentIndex])

  // 撤销
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      return history[currentIndex - 1].content
    }
    return null
  }, [currentIndex, history])

  // 重做
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1)
      return history[currentIndex + 1].content
    }
    return null
  }, [currentIndex, history])

  // 跳转到特定版本
  const goToVersion = useCallback((index: number) => {
    if (index >= 0 && index < history.length) {
      setCurrentIndex(index)
      return history[index].content
    }
    return null
  }, [history])

  // 清空历史
  const clearHistory = useCallback(() => {
    setHistory([{
      id: Date.now().toString(),
      content: currentContent,
      timestamp: Date.now()
    }])
    setCurrentIndex(0)
  }, [currentContent])

  // 获取统计信息
  const getStats = useCallback(() => {
    return {
      totalVersions: history.length,
      currentVersion: currentIndex + 1,
      canUndo: currentIndex > 0,
      canRedo: currentIndex < history.length - 1,
      oldestTimestamp: history[0]?.timestamp,
      newestTimestamp: history[history.length - 1]?.timestamp
    }
  }, [history, currentIndex])

  return {
    currentContent,
    history,
    currentIndex,
    saveEdit,
    undo,
    redo,
    goToVersion,
    clearHistory,
    getStats,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1
  }
}

export default useMessageEditHistory

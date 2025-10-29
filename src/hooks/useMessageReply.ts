import { useState, useCallback } from 'react'
import type { Message } from '@/types'

export interface MessageReply {
  replyToId: string
  replyToContent: string
  replyToRole: 'user' | 'assistant' | 'system'
}

/**
 * 消息引用/回复 Hook
 *
 * 功能:
 * - 引用消息
 * - 显示引用上下文
 * - 取消引用
 * - 引用链追踪
 *
 * @example
 * const { replyingTo, startReply, cancelReply } = useMessageReply()
 *
 * // 开始回复
 * startReply(message)
 *
 * // 取消回复
 * cancelReply()
 */
export const useMessageReply = () => {
  const [replyingTo, setReplyingTo] = useState<MessageReply | null>(null)

  /**
   * 开始回复某条消息
   */
  const startReply = useCallback((message: Message) => {
    setReplyingTo({
      replyToId: message.id,
      replyToContent: message.content,
      replyToRole: message.role
    })
  }, [])

  /**
   * 取消回复
   */
  const cancelReply = useCallback(() => {
    setReplyingTo(null)
  }, [])

  /**
   * 格式化回复消息
   */
  const formatReplyMessage = useCallback((newContent: string): string => {
    if (!replyingTo) return newContent

    const roleLabel = replyingTo.replyToRole === 'user' ? '用户' : 'AI助手'
    const quotedContent = replyingTo.replyToContent
      .split('\n')
      .map(line => `> ${line}`)
      .join('\n')

    return `回复 ${roleLabel}:\n${quotedContent}\n\n${newContent}`
  }, [replyingTo])

  /**
   * 获取引用链
   */
  const getReplyChain = useCallback((messageId: string, allMessages: Message[]): Message[] => {
    const chain: Message[] = []
    let currentMessage = allMessages.find(m => m.id === messageId)

    while (currentMessage) {
      chain.unshift(currentMessage)

      // 查找是否有 replyTo 信息（需要在 Message 类型中添加）
      const replyToId = (currentMessage as any).replyToId
      if (!replyToId) break

      currentMessage = allMessages.find(m => m.id === replyToId)
    }

    return chain
  }, [])

  return {
    replyingTo,
    startReply,
    cancelReply,
    formatReplyMessage,
    getReplyChain
  }
}

export default useMessageReply

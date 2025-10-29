/**
 * 对话分享服务
 *
 * 功能:
 * - 生成分享链接
 * - 生成分享码
 * - 复制到剪贴板
 * - 生成二维码
 * - 导出为图片
 */

import type { Conversation } from '@/types'

export interface ShareOptions {
  includeSystemPrompt?: boolean
  includeMetadata?: boolean
  format?: 'link' | 'code' | 'json' | 'markdown' | 'image'
  expiresIn?: number // 过期时间（毫秒）
  password?: string // 访问密码
}

export interface ShareResult {
  id: string
  url?: string
  code?: string
  qrCode?: string
  expiresAt?: number
  createdAt: number
}

class ConversationShareService {
  private baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  private storageKey = 'shared-conversations'

  /**
   * 分享对话
   */
  async shareConversation(
    conversation: Conversation,
    options: ShareOptions = {}
  ): Promise<ShareResult> {
    const {
      includeSystemPrompt = true,
      includeMetadata = true,
      format = 'link',
      expiresIn,
      password
    } = options

    // 生成分享 ID
    const shareId = this.generateShareId()

    // 准备分享数据
    const shareData = {
      id: shareId,
      conversation: this.prepareConversationData(conversation, {
        includeSystemPrompt,
        includeMetadata
      }),
      createdAt: Date.now(),
      expiresAt: expiresIn ? Date.now() + expiresIn : undefined,
      password: password ? this.hashPassword(password) : undefined
    }

    // 保存到本地存储（实际应用中应该保存到服务器）
    this.saveShare(shareData)

    // 根据格式生成结果
    const result: ShareResult = {
      id: shareId,
      createdAt: shareData.createdAt,
      expiresAt: shareData.expiresAt
    }

    switch (format) {
      case 'link':
        result.url = `${this.baseUrl}/share/${shareId}`
        break
      case 'code':
        result.code = this.generateShareCode(shareId)
        break
      case 'json':
        // 返回 JSON 数据
        break
      case 'markdown':
        // 转换为 Markdown
        break
    }

    return result
  }

  /**
   * 生成分享链接
   */
  generateShareLink(shareId: string): string {
    return `${this.baseUrl}/share/${shareId}`
  }

  /**
   * 生成分享码（6位）
   */
  generateShareCode(shareId: string): string {
    // 简单的哈希算法生成6位码
    const hash = shareId.split('').reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0
    }, 0)
    return Math.abs(hash).toString(36).substring(0, 6).toUpperCase()
  }

  /**
   * 复制到剪贴板
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // 降级方案
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textarea)
      return success
    }
  }

  /**
   * 生成二维码（使用第三方 API）
   */
  generateQRCode(url: string, size: number = 200): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`
  }

  /**
   * 导出为图片
   */
  async exportAsImage(conversation: Conversation): Promise<Blob> {
    // 创建画布
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    canvas.width = 800
    canvas.height = 600

    // 绘制背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制标题
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 24px Arial'
    ctx.fillText(conversation.title, 20, 40)

    // 绘制消息
    let y = 80
    ctx.font = '16px Arial'

    conversation.messages.forEach(msg => {
      ctx.fillStyle = msg.role === 'user' ? '#3b82f6' : '#10b981'
      ctx.fillText(
        `${msg.role === 'user' ? '👤' : '🤖'} ${msg.content.substring(0, 80)}...`,
        20,
        y
      )
      y += 30
    })

    return new Promise(resolve => {
      canvas.toBlob(blob => resolve(blob!), 'image/png')
    })
  }

  /**
   * 获取分享数据
   */
  getSharedConversation(shareId: string): any {
    const stored = localStorage.getItem(this.storageKey)
    if (!stored) return null

    const shares = JSON.parse(stored)
    const share = shares[shareId]

    if (!share) return null

    // 检查是否过期
    if (share.expiresAt && Date.now() > share.expiresAt) {
      delete shares[shareId]
      localStorage.setItem(this.storageKey, JSON.stringify(shares))
      return null
    }

    return share
  }

  /**
   * 验证分享密码
   */
  verifyPassword(shareId: string, password: string): boolean {
    const share = this.getSharedConversation(shareId)
    if (!share || !share.password) return true

    return this.hashPassword(password) === share.password
  }

  /**
   * 私有方法
   */
  private generateShareId(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private prepareConversationData(
    conversation: Conversation,
    options: { includeSystemPrompt: boolean; includeMetadata: boolean }
  ) {
    const data: any = {
      title: conversation.title,
      messages: conversation.messages
    }

    if (options.includeSystemPrompt && conversation.systemPrompt) {
      data.systemPrompt = conversation.systemPrompt
    }

    if (options.includeMetadata) {
      data.model = conversation.model
      data.createdAt = conversation.createdAt
      data.updatedAt = conversation.updatedAt
    }

    return data
  }

  private hashPassword(password: string): string {
    // 简单哈希（实际应用中应使用更安全的方法）
    return btoa(password)
  }

  private saveShare(shareData: any): void {
    const stored = localStorage.getItem(this.storageKey)
    const shares = stored ? JSON.parse(stored) : {}
    shares[shareData.id] = shareData
    localStorage.setItem(this.storageKey, JSON.stringify(shares))
  }
}

export const conversationShareService = new ConversationShareService()
export default conversationShareService

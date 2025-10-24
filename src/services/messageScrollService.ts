/**
 * Message Scroll Service
 *
 * 处理聊天消息的滚动定位和高亮显示
 * 支持从搜索、书签等功能跳转到特定消息
 */

export interface ScrollToMessageOptions {
  messageId: string
  conversationId?: string
  highlight?: boolean
  highlightDuration?: number
  behavior?: ScrollBehavior
  offset?: number
  retryAttempts?: number
  retryDelay?: number
}

export class MessageScrollService {
  private highlightTimeouts: Map<string, NodeJS.Timeout> = new Map()
  private scrollObservers: Map<string, IntersectionObserver> = new Map()
  private pendingScrolls: Map<string, ScrollToMessageOptions> = new Map()

  /**
   * 滚动到指定消息
   */
  async scrollToMessage(options: ScrollToMessageOptions): Promise<boolean> {
    const {
      messageId,
      highlight = true,
      highlightDuration = 2000,
      behavior = 'smooth',
      offset = 80, // 顶部偏移量 (考虑 header 高度)
      retryAttempts = 5,
      retryDelay = 100
    } = options

    // 尝试查找消息元素
    for (let attempt = 0; attempt < retryAttempts; attempt++) {
      const element = this.findMessageElement(messageId)

      if (element) {
        // 找到元素，执行滚动
        this.performScroll(element, behavior, offset)

        // 高亮显示
        if (highlight) {
          this.highlightMessage(messageId, highlightDuration)
        }

        // 通知滚动完成
        this.notifyScrollComplete(messageId)

        return true
      }

      // 如果是最后一次尝试，失败
      if (attempt === retryAttempts - 1) {
        console.warn(`[MessageScroll] Failed to find message element: ${messageId}`)
        return false
      }

      // 等待后重试
      await this.delay(retryDelay)
    }

    return false
  }

  /**
   * 查找消息 DOM 元素
   */
  private findMessageElement(messageId: string): HTMLElement | null {
    // 尝试多种选择器
    const selectors = [
      `[data-message-id="${messageId}"]`,
      `#message-${messageId}`,
      `[id="${messageId}"]`,
      `.message[data-id="${messageId}"]`
    ]

    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement
      if (element) {
        return element
      }
    }

    return null
  }

  /**
   * 执行滚动操作
   */
  private performScroll(
    element: HTMLElement,
    behavior: ScrollBehavior,
    offset: number
  ): void {
    const elementRect = element.getBoundingClientRect()
    const absoluteElementTop = elementRect.top + window.pageYOffset
    const targetScrollTop = absoluteElementTop - offset

    // 查找滚动容器
    const scrollContainer = this.findScrollContainer(element)

    if (scrollContainer) {
      // 如果有特定的滚动容器
      const containerRect = scrollContainer.getBoundingClientRect()
      const relativeScrollTop = elementRect.top - containerRect.top

      scrollContainer.scrollTo({
        top: scrollContainer.scrollTop + relativeScrollTop - offset,
        behavior
      })
    } else {
      // 使用 window 滚动
      window.scrollTo({
        top: targetScrollTop,
        behavior
      })
    }
  }

  /**
   * 查找滚动容器
   */
  private findScrollContainer(element: HTMLElement): HTMLElement | null {
    let parent = element.parentElement

    while (parent) {
      const overflowY = window.getComputedStyle(parent).overflowY
      const isScrollable = overflowY === 'auto' || overflowY === 'scroll'

      if (isScrollable && parent.scrollHeight > parent.clientHeight) {
        return parent
      }

      parent = parent.parentElement
    }

    return null
  }

  /**
   * 高亮显示消息
   */
  private highlightMessage(messageId: string, duration: number): void {
    const element = this.findMessageElement(messageId)
    if (!element) return

    // 清除之前的高亮
    const existingTimeout = this.highlightTimeouts.get(messageId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      this.highlightTimeouts.delete(messageId)
    }

    // 添加高亮样式
    element.classList.add('message-highlight')
    element.setAttribute('data-highlighted', 'true')

    // 创建高亮动画元素
    const highlightOverlay = document.createElement('div')
    highlightOverlay.className = 'message-highlight-overlay'
    highlightOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(59, 130, 246, 0.1);
      border: 2px solid rgba(59, 130, 246, 0.5);
      border-radius: 8px;
      pointer-events: none;
      animation: message-highlight-pulse 0.6s ease-in-out;
      z-index: 1;
    `

    // 确保元素有相对定位
    const originalPosition = element.style.position
    if (!originalPosition || originalPosition === 'static') {
      element.style.position = 'relative'
    }

    element.appendChild(highlightOverlay)

    // 设置移除高亮的定时器
    const timeout = setTimeout(() => {
      element.classList.remove('message-highlight')
      element.removeAttribute('data-highlighted')
      highlightOverlay.remove()

      if (originalPosition === '' || originalPosition === 'static') {
        element.style.position = originalPosition
      }

      this.highlightTimeouts.delete(messageId)
    }, duration)

    this.highlightTimeouts.set(messageId, timeout)
  }

  /**
   * 注册待处理的滚动请求
   * 用于在页面加载完成后执行滚动
   */
  registerPendingScroll(options: ScrollToMessageOptions): void {
    this.pendingScrolls.set(options.messageId, options)
  }

  /**
   * 执行所有待处理的滚动
   */
  async executePendingScrolls(): Promise<void> {
    const scrolls = Array.from(this.pendingScrolls.values())
    this.pendingScrolls.clear()

    for (const options of scrolls) {
      await this.scrollToMessage(options)
    }
  }

  /**
   * 取消待处理的滚动
   */
  cancelPendingScroll(messageId: string): void {
    this.pendingScrolls.delete(messageId)
  }

  /**
   * 清除所有高亮
   */
  clearAllHighlights(): void {
    for (const [messageId, timeout] of this.highlightTimeouts.entries()) {
      clearTimeout(timeout)
      const element = this.findMessageElement(messageId)
      if (element) {
        element.classList.remove('message-highlight')
        element.removeAttribute('data-highlighted')
        const overlay = element.querySelector('.message-highlight-overlay')
        if (overlay) {
          overlay.remove()
        }
      }
    }
    this.highlightTimeouts.clear()
  }

  /**
   * 监听消息元素出现
   * 用于延迟加载场景
   */
  observeMessageElement(
    messageId: string,
    callback: (element: HTMLElement) => void
  ): void {
    // 清除之前的观察器
    const existingObserver = this.scrollObservers.get(messageId)
    if (existingObserver) {
      existingObserver.disconnect()
    }

    // 创建新的观察器
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement
            if (element.dataset.messageId === messageId) {
              callback(element)
              observer.disconnect()
              this.scrollObservers.delete(messageId)
            }
          }
        }
      },
      { threshold: 0.1 }
    )

    // 查找并观察元素
    const element = this.findMessageElement(messageId)
    if (element) {
      observer.observe(element)
      this.scrollObservers.set(messageId, observer)
    } else {
      // 如果元素还不存在，使用 MutationObserver 等待
      this.waitForElement(messageId, (element) => {
        observer.observe(element)
        this.scrollObservers.set(messageId, observer)
        callback(element)
      })
    }
  }

  /**
   * 等待元素出现在 DOM 中
   */
  private waitForElement(
    messageId: string,
    callback: (element: HTMLElement) => void
  ): void {
    const mutationObserver = new MutationObserver((mutations, obs) => {
      const element = this.findMessageElement(messageId)
      if (element) {
        callback(element)
        obs.disconnect()
      }
    })

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })

    // 30 秒后超时
    setTimeout(() => {
      mutationObserver.disconnect()
    }, 30000)
  }

  /**
   * 通知滚动完成
   */
  private notifyScrollComplete(messageId: string): void {
    // 触发自定义事件
    const event = new CustomEvent('message-scroll-complete', {
      detail: { messageId }
    })
    window.dispatchEvent(event)
  }

  /**
   * 延迟工具函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.clearAllHighlights()

    for (const observer of this.scrollObservers.values()) {
      observer.disconnect()
    }
    this.scrollObservers.clear()

    this.pendingScrolls.clear()
  }
}

// 全局单例
export const messageScrollService = new MessageScrollService()

// 添加 CSS 动画样式（需要在全局 CSS 中添加）
export const MESSAGE_SCROLL_STYLES = `
@keyframes message-highlight-pulse {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.message-highlight {
  position: relative;
  z-index: 10;
}

.message-highlight-overlay {
  animation: message-highlight-pulse 0.6s ease-in-out;
}
`

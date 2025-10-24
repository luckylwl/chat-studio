import type { Conversation, Message } from '@/types'
import { marked } from 'marked'

export type ExportFormat = 'markdown' | 'json' | 'txt' | 'csv' | 'html' | 'pdf' | 'docx'

export interface ExportOptions {
  format: ExportFormat
  includeMetadata?: boolean
  includeTimestamps?: boolean
  includeModel?: boolean
  includeTokens?: boolean
  prettyPrint?: boolean
  includeSystemMessages?: boolean
  dateFormat?: 'full' | 'short' | 'iso'
  codeBlockStyle?: 'highlight' | 'plain'
}

export interface ExportResult {
  content: string
  filename: string
  mimeType: string
  size: number
}

/**
 * 高级导出服务
 * 支持多种格式和自定义选项
 */
class AdvancedExportService {
  /**
   * 导出对话
   */
  async exportConversation(
    conversation: Conversation,
    options: ExportOptions
  ): Promise<ExportResult> {
    const { format } = options

    switch (format) {
      case 'markdown':
        return this.exportAsMarkdown(conversation, options)
      case 'json':
        return this.exportAsJSON(conversation, options)
      case 'txt':
        return this.exportAsText(conversation, options)
      case 'csv':
        return this.exportAsCSV(conversation, options)
      case 'html':
        return this.exportAsHTML(conversation, options)
      case 'pdf':
        return this.exportAsPDF(conversation, options)
      case 'docx':
        return this.exportAsDOCX(conversation, options)
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }

  /**
   * 导出为Markdown
   */
  private exportAsMarkdown(
    conversation: Conversation,
    options: ExportOptions
  ): ExportResult {
    let content = `# ${conversation.title}\n\n`

    if (options.includeMetadata) {
      content += `> **创建时间**: ${this.formatDate(conversation.createdAt, options.dateFormat)}\n`
      content += `> **更新时间**: ${this.formatDate(conversation.updatedAt, options.dateFormat)}\n`
      if (options.includeModel) {
        content += `> **模型**: ${conversation.model}\n`
      }
      content += '\n---\n\n'
    }

    const messages = this.filterMessages(conversation.messages, options)

    messages.forEach((message, index) => {
      const role = message.role === 'user' ? '👤 用户' : '🤖 AI助手'
      content += `## ${role}\n\n`

      if (options.includeTimestamps) {
        content += `*${this.formatDate(message.timestamp, options.dateFormat)}*\n\n`
      }

      content += `${message.content}\n\n`

      if (options.includeTokens && message.tokens) {
        content += `> 令牌数: ${message.tokens}\n\n`
      }

      if (index < messages.length - 1) {
        content += '---\n\n'
      }
    })

    const filename = `${this.sanitizeFilename(conversation.title)}.md`
    return {
      content,
      filename,
      mimeType: 'text/markdown',
      size: new Blob([content]).size
    }
  }

  /**
   * 导出为JSON
   */
  private exportAsJSON(
    conversation: Conversation,
    options: ExportOptions
  ): ExportResult {
    const data = {
      title: conversation.title,
      id: conversation.id,
      ...(options.includeMetadata && {
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        model: conversation.model
      }),
      messages: this.filterMessages(conversation.messages, options).map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(options.includeTimestamps && { timestamp: msg.timestamp }),
        ...(options.includeTokens && msg.tokens && { tokens: msg.tokens })
      }))
    }

    const content = options.prettyPrint
      ? JSON.stringify(data, null, 2)
      : JSON.stringify(data)

    const filename = `${this.sanitizeFilename(conversation.title)}.json`
    return {
      content,
      filename,
      mimeType: 'application/json',
      size: new Blob([content]).size
    }
  }

  /**
   * 导出为纯文本
   */
  private exportAsText(
    conversation: Conversation,
    options: ExportOptions
  ): ExportResult {
    let content = `${conversation.title}\n`
    content += '='.repeat(conversation.title.length) + '\n\n'

    if (options.includeMetadata) {
      content += `创建时间: ${this.formatDate(conversation.createdAt, options.dateFormat)}\n`
      content += `更新时间: ${this.formatDate(conversation.updatedAt, options.dateFormat)}\n`
      if (options.includeModel) {
        content += `模型: ${conversation.model}\n`
      }
      content += '\n' + '-'.repeat(50) + '\n\n'
    }

    const messages = this.filterMessages(conversation.messages, options)

    messages.forEach((message, index) => {
      const role = message.role === 'user' ? '用户' : 'AI助手'
      content += `[${role}]`

      if (options.includeTimestamps) {
        content += ` ${this.formatDate(message.timestamp, options.dateFormat)}`
      }

      content += '\n'
      content += message.content + '\n'

      if (options.includeTokens && message.tokens) {
        content += `(令牌数: ${message.tokens})\n`
      }

      if (index < messages.length - 1) {
        content += '\n' + '-'.repeat(50) + '\n\n'
      }
    })

    const filename = `${this.sanitizeFilename(conversation.title)}.txt`
    return {
      content,
      filename,
      mimeType: 'text/plain',
      size: new Blob([content]).size
    }
  }

  /**
   * 导出为CSV
   */
  private exportAsCSV(
    conversation: Conversation,
    options: ExportOptions
  ): ExportResult {
    const headers = ['角色', '内容']
    if (options.includeTimestamps) headers.push('时间')
    if (options.includeTokens) headers.push('令牌数')

    let content = headers.join(',') + '\n'

    const messages = this.filterMessages(conversation.messages, options)

    messages.forEach(message => {
      const row = [
        this.escapeCsv(message.role),
        this.escapeCsv(message.content)
      ]

      if (options.includeTimestamps) {
        row.push(this.escapeCsv(this.formatDate(message.timestamp, options.dateFormat)))
      }

      if (options.includeTokens) {
        row.push(message.tokens?.toString() || '0')
      }

      content += row.join(',') + '\n'
    })

    const filename = `${this.sanitizeFilename(conversation.title)}.csv`
    return {
      content,
      filename,
      mimeType: 'text/csv',
      size: new Blob([content]).size
    }
  }

  /**
   * 导出为HTML
   */
  private exportAsHTML(
    conversation: Conversation,
    options: ExportOptions
  ): ExportResult {
    const messages = this.filterMessages(conversation.messages, options)

    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(conversation.title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
    }
    .metadata {
      font-size: 0.9em;
      opacity: 0.9;
    }
    .message {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #f0f0f0;
    }
    .role {
      font-weight: bold;
      font-size: 1.1em;
    }
    .role.user {
      color: #667eea;
    }
    .role.assistant {
      color: #764ba2;
    }
    .timestamp {
      font-size: 0.85em;
      color: #999;
    }
    .content {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .content pre {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
    .content code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding: 20px;
      color: #999;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${this.escapeHtml(conversation.title)}</h1>
    ${options.includeMetadata ? `
    <div class="metadata">
      <div>创建时间: ${this.formatDate(conversation.createdAt, options.dateFormat)}</div>
      <div>更新时间: ${this.formatDate(conversation.updatedAt, options.dateFormat)}</div>
      ${options.includeModel ? `<div>模型: ${conversation.model}</div>` : ''}
    </div>
    ` : ''}
  </div>

  <div class="messages">
`

    messages.forEach(message => {
      const roleText = message.role === 'user' ? '👤 用户' : '🤖 AI助手'
      const roleClass = message.role === 'user' ? 'user' : 'assistant'

      html += `
    <div class="message">
      <div class="message-header">
        <span class="role ${roleClass}">${roleText}</span>
        ${options.includeTimestamps ? `<span class="timestamp">${this.formatDate(message.timestamp, options.dateFormat)}</span>` : ''}
      </div>
      <div class="content">${this.formatContentForHTML(message.content)}</div>
      ${options.includeTokens && message.tokens ? `<div class="tokens">令牌数: ${message.tokens}</div>` : ''}
    </div>
`
    })

    html += `
  </div>

  <div class="footer">
    <p>由 AI Chat Studio 导出</p>
    <p>导出时间: ${this.formatDate(Date.now(), 'full')}</p>
  </div>
</body>
</html>`

    const filename = `${this.sanitizeFilename(conversation.title)}.html`
    return {
      content: html,
      filename,
      mimeType: 'text/html',
      size: new Blob([html]).size
    }
  }

  /**
   * 导出为PDF (需要浏览器打印功能)
   */
  private async exportAsPDF(
    conversation: Conversation,
    options: ExportOptions
  ): Promise<ExportResult> {
    // 生成HTML
    const htmlResult = this.exportAsHTML(conversation, options)

    // 注意: 实际PDF生成需要使用库如jsPDF或浏览器打印API
    // 这里返回HTML作为占位
    return {
      ...htmlResult,
      filename: htmlResult.filename.replace('.html', '.pdf'),
      mimeType: 'application/pdf'
    }
  }

  /**
   * 导出为DOCX
   */
  private async exportAsDOCX(
    conversation: Conversation,
    options: ExportOptions
  ): Promise<ExportResult> {
    // 注意: 实际DOCX生成需要使用库如docx
    // 这里返回Markdown作为占位
    const mdResult = this.exportAsMarkdown(conversation, options)

    return {
      ...mdResult,
      filename: mdResult.filename.replace('.md', '.docx'),
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
  }

  /**
   * 过滤消息
   */
  private filterMessages(messages: Message[], options: ExportOptions): Message[] {
    if (!options.includeSystemMessages) {
      return messages.filter(msg => msg.role !== 'system')
    }
    return messages
  }

  /**
   * 格式化日期
   */
  private formatDate(timestamp: number, format: ExportOptions['dateFormat'] = 'full'): string {
    const date = new Date(timestamp)

    switch (format) {
      case 'iso':
        return date.toISOString()
      case 'short':
        return date.toLocaleDateString('zh-CN')
      case 'full':
      default:
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
    }
  }

  /**
   * 转义CSV
   */
  private escapeCsv(str: string): string {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  /**
   * 转义HTML
   */
  private escapeHtml(str: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    return str.replace(/[&<>"']/g, m => map[m])
  }

  /**
   * 格式化HTML内容
   */
  private formatContentForHTML(content: string): string {
    // 简单的Markdown到HTML转换
    return this.escapeHtml(content)
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
  }

  /**
   * 清理文件名
   */
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '-')
      .replace(/\s+/g, '_')
      .substring(0, 100)
  }

  /**
   * 下载文件
   */
  downloadFile(result: ExportResult): void {
    const blob = new Blob([result.content], { type: result.mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = result.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export const advancedExportService = new AdvancedExportService()
export default advancedExportService

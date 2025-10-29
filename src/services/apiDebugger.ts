/**
 * API 调试工具
 *
 * 功能:
 * - 请求/响应日志
 * - 性能监控
 * - 错误追踪
 * - 请求重放
 * - 导出调试数据
 */

export interface APILog {
  id: string
  timestamp: number
  method: string
  url: string
  headers: Record<string, string>
  body?: any
  response?: {
    status: number
    statusText: string
    headers: Record<string, string>
    body: any
    time: number // 响应时间（毫秒）
  }
  error?: {
    message: string
    stack?: string
  }
}

class APIDebugger {
  private logs: APILog[] = []
  private maxLogs = 100
  private enabled = false

  /**
   * 启用调试
   */
  enable(): void {
    this.enabled = true
    console.log('🔧 API Debugger enabled')
  }

  /**
   * 禁用调试
   */
  disable(): void {
    this.enabled = false
    console.log('🔧 API Debugger disabled')
  }

  /**
   * 拦截 fetch 请求
   */
  interceptFetch(): void {
    if (!this.enabled) return

    const originalFetch = window.fetch

    window.fetch = async (...args) => {
      const [url, options = {}] = args
      const startTime = Date.now()

      const log: APILog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: startTime,
        method: options.method || 'GET',
        url: url.toString(),
        headers: this.extractHeaders(options.headers),
        body: options.body
      }

      try {
        const response = await originalFetch(...args)
        const endTime = Date.now()

        // 克隆响应以便读取
        const clonedResponse = response.clone()
        const responseBody = await this.parseResponse(clonedResponse)

        log.response = {
          status: response.status,
          statusText: response.statusText,
          headers: this.extractHeaders(response.headers),
          body: responseBody,
          time: endTime - startTime
        }

        this.addLog(log)
        return response
      } catch (error) {
        log.error = {
          message: (error as Error).message,
          stack: (error as Error).stack
        }
        this.addLog(log)
        throw error
      }
    }
  }

  /**
   * 添加日志
   */
  private addLog(log: APILog): void {
    this.logs.unshift(log)

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // 打印到控制台
    this.printLog(log)
  }

  /**
   * 打印日志
   */
  private printLog(log: APILog): void {
    const emoji = log.error ? '❌' : log.response?.status && log.response.status < 400 ? '✅' : '⚠️'

    console.group(`${emoji} ${log.method} ${log.url}`)

    if (log.response) {
      console.log(`Status: ${log.response.status} ${log.response.statusText}`)
      console.log(`Time: ${log.response.time}ms`)
      console.log('Response:', log.response.body)
    }

    if (log.error) {
      console.error('Error:', log.error.message)
    }

    console.groupEnd()
  }

  /**
   * 获取所有日志
   */
  getLogs(): APILog[] {
    return this.logs
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = []
    console.log('🔧 Logs cleared')
  }

  /**
   * 过滤日志
   */
  filterLogs(filters: {
    method?: string
    url?: string
    status?: number
    hasError?: boolean
  }): APILog[] {
    return this.logs.filter(log => {
      if (filters.method && log.method !== filters.method) return false
      if (filters.url && !log.url.includes(filters.url)) return false
      if (filters.status && log.response?.status !== filters.status) return false
      if (filters.hasError !== undefined && !!log.error !== filters.hasError) return false
      return true
    })
  }

  /**
   * 重放请求
   */
  async replayRequest(logId: string): Promise<Response | null> {
    const log = this.logs.find(l => l.id === logId)
    if (!log) return null

    return fetch(log.url, {
      method: log.method,
      headers: log.headers,
      body: log.body
    })
  }

  /**
   * 导出调试数据
   */
  exportLogs(): void {
    const data = {
      exported: new Date().toISOString(),
      totalLogs: this.logs.length,
      logs: this.logs
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api-logs_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log('📥 Logs exported')
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const total = this.logs.length
    const errors = this.logs.filter(l => l.error).length
    const successful = this.logs.filter(l => l.response && l.response.status < 400).length

    const avgResponseTime =
      this.logs
        .filter(l => l.response)
        .reduce((sum, l) => sum + (l.response?.time || 0), 0) / total || 0

    const methodCounts: Record<string, number> = {}
    this.logs.forEach(l => {
      methodCounts[l.method] = (methodCounts[l.method] || 0) + 1
    })

    const statusCounts: Record<number, number> = {}
    this.logs.forEach(l => {
      if (l.response) {
        statusCounts[l.response.status] = (statusCounts[l.response.status] || 0) + 1
      }
    })

    return {
      total,
      successful,
      errors,
      errorRate: total > 0 ? (errors / total) * 100 : 0,
      avgResponseTime,
      methodCounts,
      statusCounts
    }
  }

  /**
   * 私有方法
   */
  private extractHeaders(headers: any): Record<string, string> {
    if (!headers) return {}

    const result: Record<string, string> = {}

    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        result[key] = value
      })
    } else if (typeof headers === 'object') {
      Object.assign(result, headers)
    }

    return result
  }

  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type')

    if (contentType?.includes('application/json')) {
      try {
        return await response.json()
      } catch {
        return await response.text()
      }
    }

    return await response.text()
  }
}

export const apiDebugger = new APIDebugger()
export default apiDebugger

// 全局暴露（用于控制台调试）
if (typeof window !== 'undefined') {
  (window as any).__apiDebugger = apiDebugger
}

import React, { useState, useEffect } from 'react'
import { X, Terminal, Database, Activity, Code, Settings, Zap } from 'lucide-react'

interface DevToolsProps {
  enabled?: boolean
}

const DevTools: React.FC<DevToolsProps> = ({ enabled = process.env.NODE_ENV === 'development' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'console' | 'cache' | 'performance' | 'state' | 'network'>('console')
  const [logs, setLogs] = useState<Array<{ type: string; message: string; timestamp: number }>>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<any>({})
  const [cacheStats, setCacheStats] = useState<any>({})

  // 监听键盘快捷键 (Ctrl+Shift+D)
  useEffect(() => {
    if (!enabled) return

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [enabled])

  // 拦截 console 输出
  useEffect(() => {
    if (!enabled || !isOpen) return

    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args) => {
      setLogs(prev => [...prev.slice(-99), {
        type: 'log',
        message: args.map(String).join(' '),
        timestamp: Date.now()
      }])
      originalLog.apply(console, args)
    }

    console.error = (...args) => {
      setLogs(prev => [...prev.slice(-99), {
        type: 'error',
        message: args.map(String).join(' '),
        timestamp: Date.now()
      }])
      originalError.apply(console, args)
    }

    console.warn = (...args) => {
      setLogs(prev => [...prev.slice(-99), {
        type: 'warn',
        message: args.map(String).join(' '),
        timestamp: Date.now()
      }])
      originalWarn.apply(console, args)
    }

    return () => {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }
  }, [enabled, isOpen])

  // 获取性能指标
  useEffect(() => {
    if (!enabled || !isOpen || activeTab !== 'performance') return

    const updateMetrics = () => {
      if ((window as any).__performanceReport) {
        const report = (window as any).__performanceReport()
        setPerformanceMetrics(report)
      }
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 2000)
    return () => clearInterval(interval)
  }, [enabled, isOpen, activeTab])

  // 获取缓存统计
  useEffect(() => {
    if (!enabled || !isOpen || activeTab !== 'cache') return

    const updateCache = () => {
      if ((window as any).__cacheStats) {
        const stats = (window as any).__cacheStats()
        setCacheStats(stats)
      }
    }

    updateCache()
    const interval = setInterval(updateCache, 2000)
    return () => clearInterval(interval)
  }, [enabled, isOpen, activeTab])

  if (!enabled) return null

  return (
    <>
      {/* 浮动按钮 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
          title="开发者工具 (Ctrl+Shift+D)"
        >
          <Terminal className="w-5 h-5" />
        </button>
      )}

      {/* 开发者面板 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute bottom-0 left-0 right-0 h-96 bg-gray-900 text-gray-100 shadow-2xl pointer-events-auto border-t-4 border-blue-500">
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold">开发者工具</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 标签页 */}
            <div className="flex gap-1 px-2 py-1 bg-gray-800 border-b border-gray-700">
              {[
                { id: 'console' as const, icon: Terminal, label: '控制台' },
                { id: 'cache' as const, icon: Database, label: '缓存' },
                { id: 'performance' as const, icon: Activity, label: '性能' },
                { id: 'state' as const, icon: Code, label: '状态' },
                { id: 'network' as const, icon: Zap, label: '网络' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                  }`}
                >
                  <tab.icon className="w-3 h-3" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 内容区域 */}
            <div className="h-[calc(100%-88px)] overflow-auto p-4 font-mono text-xs">
              {/* 控制台 */}
              {activeTab === 'console' && (
                <div className="space-y-1">
                  {logs.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">控制台为空</div>
                  ) : (
                    logs.map((log, i) => (
                      <div
                        key={i}
                        className={`py-1 px-2 rounded ${
                          log.type === 'error'
                            ? 'bg-red-900/20 text-red-400'
                            : log.type === 'warn'
                            ? 'bg-yellow-900/20 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        <span className="text-gray-500 mr-2">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`mr-2 ${
                          log.type === 'error' ? 'text-red-500' :
                          log.type === 'warn' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`}>
                          [{log.type.toUpperCase()}]
                        </span>
                        {log.message}
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => setLogs([])}
                    className="mt-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
                  >
                    清空日志
                  </button>
                </div>
              )}

              {/* 缓存 */}
              {activeTab === 'cache' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-gray-400 text-xs mb-1">API 缓存</div>
                      <div className="text-lg font-semibold">{cacheStats?.['API Cache']?.itemCount || 0} 项</div>
                      <div className="text-xs text-gray-500">{cacheStats?.['API Cache']?.totalSize || '0 MB'}</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-gray-400 text-xs mb-1">对话缓存</div>
                      <div className="text-lg font-semibold">{cacheStats?.['Conversation Cache']?.itemCount || 0} 项</div>
                      <div className="text-xs text-gray-500">{cacheStats?.['Conversation Cache']?.totalSize || '0 MB'}</div>
                    </div>
                    <div className="bg-gray-800 p-3 rounded">
                      <div className="text-gray-400 text-xs mb-1">用户数据缓存</div>
                      <div className="text-lg font-semibold">{cacheStats?.['User Data Cache']?.itemCount || 0} 项</div>
                      <div className="text-xs text-gray-500">{cacheStats?.['User Data Cache']?.totalSize || '0 MB'}</div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-3 rounded">
                    <h3 className="font-semibold mb-2">缓存详情</h3>
                    <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                      {JSON.stringify(cacheStats, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* 性能 */}
              {activeTab === 'performance' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-2">
                    {performanceMetrics?.metrics && Object.entries(performanceMetrics.metrics).map(([key, value]: [string, any]) => (
                      value && (
                        <div key={key} className="bg-gray-800 p-2 rounded">
                          <div className="text-gray-400 text-[10px] mb-1">{key}</div>
                          <div className="font-semibold">{typeof value === 'number' ? value.toFixed(2) : value}ms</div>
                        </div>
                      )
                    ))}
                  </div>

                  <div className="bg-gray-800 p-3 rounded">
                    <h3 className="font-semibold mb-2">性能评级</h3>
                    {performanceMetrics?.ratings && (
                      <div className="space-y-1">
                        {Object.entries(performanceMetrics.ratings).map(([key, rating]: [string, any]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-gray-400">{key}:</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              rating === 'good' ? 'bg-green-900 text-green-300' :
                              rating === 'needs-improvement' ? 'bg-yellow-900 text-yellow-300' :
                              'bg-red-900 text-red-300'
                            }`}>
                              {rating}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-800 p-3 rounded">
                    <h3 className="font-semibold mb-2">优化建议</h3>
                    {(window as any).__performanceSuggestions && (
                      <ul className="space-y-1 text-xs text-gray-400">
                        {(window as any).__performanceSuggestions().map((suggestion: string, i: number) => (
                          <li key={i}>• {suggestion}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* 状态 */}
              {activeTab === 'state' && (
                <div className="space-y-4">
                  <div className="bg-gray-800 p-3 rounded">
                    <h3 className="font-semibold mb-2">Zustand Stores</h3>
                    <div className="text-xs text-gray-400">
                      <p>使用 React DevTools 查看状态详情</p>
                      <p className="mt-1">或在控制台使用: useConversationStore.getState()</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 网络 */}
              {activeTab === 'network' && (
                <div className="space-y-4">
                  <div className="bg-gray-800 p-3 rounded">
                    <h3 className="font-semibold mb-2">网络请求监控</h3>
                    <div className="text-xs text-gray-400">
                      <p>打开浏览器 DevTools Network 面板查看详细信息</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DevTools

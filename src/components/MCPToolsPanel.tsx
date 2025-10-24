import React, { useState, useEffect } from 'react'
import {
  WrenchScrewdriverIcon,
  PlayIcon,
  StopIcon,
  PlusIcon,
  TrashIcon,
  CogIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'

interface MCPTool {
  id: string
  name: string
  description: string
  schema: any
  status: 'available' | 'running' | 'error' | 'disabled'
  category: string
  lastUsed?: number
  usageCount?: number
}

interface MCPServer {
  id: string
  name: string
  url: string
  status: 'connected' | 'disconnected' | 'error'
  tools: MCPTool[]
}

interface MCPToolsPanelProps {
  onToolExecute?: (toolId: string, params: any) => void
  className?: string
}

const MCPToolsPanel: React.FC<MCPToolsPanelProps> = ({ onToolExecute, className }) => {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [toolParams, setToolParams] = useState<Record<string, any>>({})
  const [isExecuting, setIsExecuting] = useState(false)
  const [showAddServer, setShowAddServer] = useState(false)
  const [newServerUrl, setNewServerUrl] = useState('')

  // Mock MCP servers and tools
  useEffect(() => {
    const mockServers: MCPServer[] = [
      {
        id: 'filesystem',
        name: '文件系统',
        url: 'mcp://filesystem',
        status: 'connected',
        tools: [
          {
            id: 'read_file',
            name: '读取文件',
            description: '读取指定路径的文件内容',
            schema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: '文件路径' },
                encoding: { type: 'string', default: 'utf-8', description: '文件编码' }
              },
              required: ['path']
            },
            status: 'available',
            category: 'file',
            usageCount: 15
          },
          {
            id: 'write_file',
            name: '写入文件',
            description: '向指定路径写入文件内容',
            schema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: '文件路径' },
                content: { type: 'string', description: '文件内容' },
                encoding: { type: 'string', default: 'utf-8', description: '文件编码' }
              },
              required: ['path', 'content']
            },
            status: 'available',
            category: 'file',
            usageCount: 8
          },
          {
            id: 'list_directory',
            name: '列出目录',
            description: '列出指定目录下的文件和子目录',
            schema: {
              type: 'object',
              properties: {
                path: { type: 'string', description: '目录路径' },
                recursive: { type: 'boolean', default: false, description: '是否递归' }
              },
              required: ['path']
            },
            status: 'available',
            category: 'file',
            usageCount: 22
          }
        ]
      },
      {
        id: 'web_search',
        name: '网络搜索',
        url: 'mcp://web-search',
        status: 'connected',
        tools: [
          {
            id: 'google_search',
            name: 'Google搜索',
            description: '使用Google搜索引擎搜索内容',
            schema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: '搜索关键词' },
                limit: { type: 'number', default: 10, description: '结果数量' },
                language: { type: 'string', default: 'zh-cn', description: '搜索语言' }
              },
              required: ['query']
            },
            status: 'available',
            category: 'search',
            usageCount: 45
          },
          {
            id: 'web_scrape',
            name: '网页抓取',
            description: '抓取指定URL的网页内容',
            schema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: '网页URL' },
                selector: { type: 'string', description: 'CSS选择器' },
                extract_text: { type: 'boolean', default: true, description: '是否提取纯文本' }
              },
              required: ['url']
            },
            status: 'available',
            category: 'web',
            usageCount: 12
          }
        ]
      },
      {
        id: 'database',
        name: '数据库',
        url: 'mcp://database',
        status: 'error',
        tools: [
          {
            id: 'sql_query',
            name: 'SQL查询',
            description: '执行SQL查询语句',
            schema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'SQL查询语句' },
                database: { type: 'string', description: '数据库名称' }
              },
              required: ['query']
            },
            status: 'error',
            category: 'database',
            usageCount: 3
          }
        ]
      }
    ]

    setServers(mockServers)
  }, [])

  const getAllTools = (): MCPTool[] => {
    return servers.flatMap(server => server.tools)
  }

  const getToolsByCategory = () => {
    const tools = getAllTools()
    const categories: Record<string, MCPTool[]> = {}

    tools.forEach(tool => {
      if (!categories[tool.category]) {
        categories[tool.category] = []
      }
      categories[tool.category].push(tool)
    })

    return categories
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'available':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />
      case 'running':
        return <ClockIcon className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-red-500" />
      case 'disconnected':
      case 'disabled':
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getCategoryIcon = (category: string) => {
    const iconClass = "h-4 w-4"
    switch (category) {
      case 'file':
        return <div className={cn(iconClass, "text-blue-500")}>📁</div>
      case 'search':
        return <div className={cn(iconClass, "text-green-500")}>🔍</div>
      case 'web':
        return <div className={cn(iconClass, "text-purple-500")}>🌐</div>
      case 'database':
        return <div className={cn(iconClass, "text-orange-500")}>🗄️</div>
      default:
        return <WrenchScrewdriverIcon className={cn(iconClass, "text-gray-500")} />
    }
  }

  const executeTool = async (tool: MCPTool) => {
    if (!onToolExecute) {
      toast.info('工具执行功能需要在聊天中使用')
      return
    }

    if (tool.status !== 'available') {
      toast.error('工具当前不可用')
      return
    }

    setIsExecuting(true)
    try {
      // 模拟工具执行
      await new Promise(resolve => setTimeout(resolve, 2000))

      onToolExecute(tool.id, toolParams)
      toast.success(`工具 ${tool.name} 执行成功`)

      // Update usage count
      setServers(prev => prev.map(server => ({
        ...server,
        tools: server.tools.map(t =>
          t.id === tool.id
            ? { ...t, usageCount: (t.usageCount || 0) + 1, lastUsed: Date.now() }
            : t
        )
      })))

    } catch (error) {
      console.error('Tool execution error:', error)
      toast.error('工具执行失败')
    } finally {
      setIsExecuting(false)
    }
  }

  const connectServer = (serverId: string) => {
    setServers(prev => prev.map(server =>
      server.id === serverId
        ? {
            ...server,
            status: 'connected',
            tools: server.tools.map(tool => ({ ...tool, status: 'available' }))
          }
        : server
    ))
    toast.success('MCP服务器连接成功')
  }

  const disconnectServer = (serverId: string) => {
    setServers(prev => prev.map(server =>
      server.id === serverId
        ? {
            ...server,
            status: 'disconnected',
            tools: server.tools.map(tool => ({ ...tool, status: 'disabled' }))
          }
        : server
    ))
    toast.info('MCP服务器已断开连接')
  }

  const addServer = () => {
    if (!newServerUrl.trim()) {
      toast.error('请输入服务器URL')
      return
    }

    const newServer: MCPServer = {
      id: Date.now().toString(),
      name: '自定义服务器',
      url: newServerUrl,
      status: 'disconnected',
      tools: []
    }

    setServers(prev => [...prev, newServer])
    setNewServerUrl('')
    setShowAddServer(false)
    toast.success('MCP服务器已添加')
  }

  const removeServer = (serverId: string) => {
    setServers(prev => prev.filter(server => server.id !== serverId))
    toast.success('MCP服务器已移除')
  }

  const toolsByCategory = getToolsByCategory()
  const connectedServers = servers.filter(s => s.status === 'connected').length
  const totalTools = getAllTools().length
  const availableTools = getAllTools().filter(t => t.status === 'available').length

  return (
    <div className={cn("space-y-6", className)}>
      {/* 统计信息 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <WrenchScrewdriverIcon className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-gray-900 dark:text-gray-100">MCP工具面板</h3>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {connectedServers}
            </div>
            <div className="text-gray-600 dark:text-gray-400">已连接服务器</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {availableTools}
            </div>
            <div className="text-gray-600 dark:text-gray-400">可用工具</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {totalTools}
            </div>
            <div className="text-gray-600 dark:text-gray-400">总工具数</div>
          </div>
        </div>
      </div>

      {/* 服务器管理 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">MCP服务器</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddServer(!showAddServer)}
            className="gap-2"
          >
            <PlusIcon className="h-4 w-4" />
            添加服务器
          </Button>
        </div>

        {showAddServer && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newServerUrl}
              onChange={(e) => setNewServerUrl(e.target.value)}
              placeholder="输入MCP服务器URL..."
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <Button size="sm" onClick={addServer}>添加</Button>
            <Button variant="outline" size="sm" onClick={() => setShowAddServer(false)}>取消</Button>
          </div>
        )}

        <div className="space-y-2">
          {servers.map(server => (
            <div
              key={server.id}
              className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(server.status)}
                <div>
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {server.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {server.url} • {server.tools.length} 个工具
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {server.status === 'connected' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnectServer(server.id)}
                    className="h-8 px-2 text-red-600 hover:text-red-700"
                  >
                    <StopIcon className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => connectServer(server.id)}
                    className="h-8 px-2 text-green-600 hover:text-green-700"
                  >
                    <PlayIcon className="h-4 w-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeServer(server.id)}
                  className="h-8 px-2 text-gray-500 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 工具分类 */}
      {Object.entries(toolsByCategory).map(([category, tools]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            {getCategoryIcon(category)}
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {category} ({tools.length})
            </h4>
          </div>

          <div className="grid gap-2">
            {tools.map(tool => (
              <div
                key={tool.id}
                className={cn(
                  "p-3 bg-white dark:bg-gray-800 rounded-lg border transition-colors",
                  tool.status === 'available'
                    ? "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                    : "border-gray-200 dark:border-gray-700 opacity-60"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(tool.status)}
                      <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {tool.name}
                      </h5>
                      {tool.usageCount && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                          已用 {tool.usageCount} 次
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {tool.description}
                    </p>

                    {/* 工具参数 */}
                    {tool.schema.properties && (
                      <div className="space-y-2 mb-3">
                        {Object.entries(tool.schema.properties).map(([param, config]: [string, any]) => (
                          <div key={param}>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              {param}
                              {tool.schema.required?.includes(param) && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            <input
                              type="text"
                              value={toolParams[`${tool.id}_${param}`] || config.default || ''}
                              onChange={(e) => setToolParams(prev => ({
                                ...prev,
                                [`${tool.id}_${param}`]: e.target.value
                              }))}
                              placeholder={config.description}
                              className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => executeTool(tool)}
                    disabled={tool.status !== 'available' || isExecuting}
                    className="ml-3"
                  >
                    {isExecuting ? (
                      <>
                        <ClockIcon className="h-4 w-4 animate-spin" />
                        执行中
                      </>
                    ) : (
                      <>
                        <PlayIcon className="h-4 w-4" />
                        执行
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 提示信息 */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
        <div className="flex items-start gap-2">
          <WrenchScrewdriverIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium mb-1">MCP工具说明:</p>
            <ul className="text-xs space-y-1 opacity-90">
              <li>• Model Context Protocol (MCP) 允许AI访问外部工具和服务</li>
              <li>• 连接的工具可以在对话中直接调用</li>
              <li>• 支持文件操作、网络搜索、数据库查询等功能</li>
              <li>• 所有工具执行都会在聊天中显示结果</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MCPToolsPanel
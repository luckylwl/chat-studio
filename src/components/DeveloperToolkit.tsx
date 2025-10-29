/**
 * AI Chat Studio v5.0 - Developer Toolkit
 *
 * Comprehensive development tools including:
 * - API Debugger and testing (Postman-like)
 * - Webhook testing and inspection
 * - Real-time log viewer with filtering
 * - Performance monitoring and profiling
 * - Error tracking and stack traces
 * - Network request inspector
 * - Database query analyzer
 * - Environment variable manager
 */

import React, { useState, useEffect, useRef } from 'react'

interface DeveloperToolkitProps {
  userId: string
}

type TabType = 'api' | 'webhooks' | 'logs' | 'performance' | 'errors' | 'network' | 'database'
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface APIRequest {
  id: string
  method: HttpMethod
  url: string
  headers: Record<string, string>
  body?: string
  timestamp: Date
}

interface APIResponse {
  id: string
  status: number
  statusText: string
  headers: Record<string, string>
  body: string
  duration: number
  size: number
}

interface WebhookTest {
  id: string
  url: string
  method: HttpMethod
  payload: string
  headers: Record<string, string>
  status: 'pending' | 'success' | 'failed'
  response?: string
  timestamp: Date
}

interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  source: string
  message: string
  metadata?: Record<string, any>
  stackTrace?: string
}

interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  timestamp: Date
  category: 'cpu' | 'memory' | 'network' | 'render'
}

interface ErrorLog {
  id: string
  timestamp: Date
  type: string
  message: string
  stackTrace: string
  url: string
  lineNumber: number
  columnNumber: number
  userAgent: string
  resolved: boolean
}

interface NetworkRequest {
  id: string
  method: HttpMethod
  url: string
  status: number
  duration: number
  size: number
  timestamp: Date
  initiator: string
}

interface DatabaseQuery {
  id: string
  query: string
  duration: number
  rowsAffected: number
  timestamp: Date
  database: string
  slow: boolean
}

const DeveloperToolkit: React.FC<DeveloperToolkitProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('api')

  // API Debugger state
  const [apiMethod, setApiMethod] = useState<HttpMethod>('GET')
  const [apiUrl, setApiUrl] = useState('')
  const [apiHeaders, setApiHeaders] = useState<Array<{ key: string; value: string }>>([{ key: '', value: '' }])
  const [apiBody, setApiBody] = useState('')
  const [apiResponse, setApiResponse] = useState<APIResponse | null>(null)
  const [apiHistory, setApiHistory] = useState<APIRequest[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Webhook state
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookMethod, setWebhookMethod] = useState<HttpMethod>('POST')
  const [webhookPayload, setWebhookPayload] = useState('{\n  "event": "test",\n  "data": {}\n}')
  const [webhookTests, setWebhookTests] = useState<WebhookTest[]>([])

  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logFilter, setLogFilter] = useState<LogLevel | 'all'>('all')
  const [logSearch, setLogSearch] = useState('')
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Performance state
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])

  // Errors state
  const [errors, setErrors] = useState<ErrorLog[]>([])

  // Network state
  const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([])

  // Database state
  const [dbQueries, setDbQueries] = useState<DatabaseQuery[]>([])
  const [dbQuery, setDbQuery] = useState('SELECT * FROM users LIMIT 10;')

  useEffect(() => {
    loadDeveloperData()

    // Simulate real-time log updates
    const interval = setInterval(() => {
      addRandomLog()
      addRandomMetric()
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const loadDeveloperData = () => {
    // Mock initial data
    setLogs([
      {
        id: '1',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        level: 'info',
        source: 'API Gateway',
        message: 'Request received for /api/users',
        metadata: { method: 'GET', ip: '192.168.1.100' }
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 3 * 60 * 1000),
        level: 'warn',
        source: 'Database',
        message: 'Slow query detected: 2.3s',
        metadata: { query: 'SELECT * FROM large_table' }
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1 * 60 * 1000),
        level: 'error',
        source: 'Auth Service',
        message: 'Invalid JWT token',
        stackTrace: 'Error: JWT expired\n  at verify (jwt.js:123)\n  at authenticate (auth.js:45)'
      }
    ])

    setPerformanceMetrics([
      { id: '1', name: 'CPU Usage', value: 45, unit: '%', timestamp: new Date(), category: 'cpu' },
      { id: '2', name: 'Memory Usage', value: 512, unit: 'MB', timestamp: new Date(), category: 'memory' },
      { id: '3', name: 'Network Latency', value: 87, unit: 'ms', timestamp: new Date(), category: 'network' },
      { id: '4', name: 'Page Load Time', value: 1.2, unit: 's', timestamp: new Date(), category: 'render' }
    ])

    setErrors([
      {
        id: '1',
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        type: 'TypeError',
        message: 'Cannot read property "id" of undefined',
        stackTrace: 'TypeError: Cannot read property "id" of undefined\n  at processUser (app.js:234)\n  at handleRequest (server.js:89)',
        url: '/dashboard',
        lineNumber: 234,
        columnNumber: 12,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        resolved: false
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        type: 'NetworkError',
        message: 'Failed to fetch data from API',
        stackTrace: 'NetworkError: Failed to fetch\n  at fetchData (api.js:45)\n  at loadUsers (users.js:23)',
        url: '/users',
        lineNumber: 45,
        columnNumber: 8,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        resolved: true
      }
    ])

    setNetworkRequests([
      { id: '1', method: 'GET', url: '/api/users', status: 200, duration: 234, size: 1024, timestamp: new Date(Date.now() - 2 * 60 * 1000), initiator: 'users.tsx' },
      { id: '2', method: 'POST', url: '/api/auth/login', status: 200, duration: 456, size: 512, timestamp: new Date(Date.now() - 5 * 60 * 1000), initiator: 'auth.tsx' },
      { id: '3', method: 'GET', url: '/api/dashboard', status: 500, duration: 1234, size: 0, timestamp: new Date(Date.now() - 10 * 60 * 1000), initiator: 'dashboard.tsx' }
    ])

    setDbQueries([
      { id: '1', query: 'SELECT * FROM users WHERE id = 123', duration: 45, rowsAffected: 1, timestamp: new Date(), database: 'main', slow: false },
      { id: '2', query: 'INSERT INTO logs (message) VALUES (...)', duration: 23, rowsAffected: 1, timestamp: new Date(), database: 'logs', slow: false },
      { id: '3', query: 'SELECT * FROM large_table JOIN ...', duration: 2340, rowsAffected: 10000, timestamp: new Date(), database: 'analytics', slow: true }
    ])
  }

  const addRandomLog = () => {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const sources = ['API Gateway', 'Database', 'Auth Service', 'Cache', 'Queue']
    const messages = [
      'Request processed successfully',
      'Cache hit for key: user_123',
      'Database connection established',
      'Rate limit check passed',
      'Webhook delivered successfully'
    ]

    const newLog: LogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date(),
      level: levels[Math.floor(Math.random() * levels.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      metadata: { userId, requestId: `req_${Date.now()}` }
    }

    setLogs(prev => [...prev, newLog].slice(-50)) // Keep last 50 logs
  }

  const addRandomMetric = () => {
    setPerformanceMetrics(prev => {
      const updated = prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * 10,
        timestamp: new Date()
      }))
      return updated
    })
  }

  const handleSendAPIRequest = async () => {
    setIsLoading(true)

    const request: APIRequest = {
      id: `req_${Date.now()}`,
      method: apiMethod,
      url: apiUrl,
      headers: apiHeaders.reduce((acc, h) => {
        if (h.key) acc[h.key] = h.value
        return acc
      }, {} as Record<string, string>),
      body: apiBody || undefined,
      timestamp: new Date()
    }

    setApiHistory([request, ...apiHistory])

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))

    const mockResponse: APIResponse = {
      id: request.id,
      status: Math.random() > 0.1 ? 200 : 500,
      statusText: Math.random() > 0.1 ? 'OK' : 'Internal Server Error',
      headers: {
        'content-type': 'application/json',
        'x-request-id': request.id
      },
      body: JSON.stringify({
        success: true,
        data: { id: 123, name: 'Test User', email: 'test@example.com' },
        timestamp: new Date().toISOString()
      }, null, 2),
      duration: Math.random() * 500 + 100,
      size: 1024
    }

    setApiResponse(mockResponse)
    setIsLoading(false)
  }

  const handleTestWebhook = async () => {
    const test: WebhookTest = {
      id: `webhook_${Date.now()}`,
      url: webhookUrl,
      method: webhookMethod,
      payload: webhookPayload,
      headers: { 'Content-Type': 'application/json' },
      status: 'pending',
      timestamp: new Date()
    }

    setWebhookTests([test, ...webhookTests])

    // Simulate webhook delivery
    await new Promise(resolve => setTimeout(resolve, 1000))

    const success = Math.random() > 0.2

    setWebhookTests(prev => prev.map(t =>
      t.id === test.id
        ? {
            ...t,
            status: success ? 'success' : 'failed',
            response: success
              ? '{"status": "received", "id": "evt_123"}'
              : '{"error": "Connection timeout"}'
          }
        : t
    ))
  }

  const handleExecuteQuery = () => {
    const newQuery: DatabaseQuery = {
      id: `query_${Date.now()}`,
      query: dbQuery,
      duration: Math.random() * 500 + 50,
      rowsAffected: Math.floor(Math.random() * 100),
      timestamp: new Date(),
      database: 'main',
      slow: Math.random() > 0.8
    }

    setDbQueries([newQuery, ...dbQueries])
  }

  const handleResolveError = (errorId: string) => {
    setErrors(errors.map(e => e.id === errorId ? { ...e, resolved: !e.resolved } : e))
  }

  const getLogLevelColor = (level: LogLevel) => {
    const colors = {
      debug: '#6b7280',
      info: '#3b82f6',
      warn: '#f59e0b',
      error: '#ef4444',
      fatal: '#7c2d12'
    }
    return colors[level]
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return '#10b981'
    if (status >= 300 && status < 400) return '#3b82f6'
    if (status >= 400 && status < 500) return '#f59e0b'
    return '#ef4444'
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const renderAPI = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>API Debugger</h2>

      {/* API Request Builder */}
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Build Request</h3>

        {/* Method and URL */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <select
            value={apiMethod}
            onChange={(e) => setApiMethod(e.target.value as HttpMethod)}
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontWeight: 'bold',
              minWidth: '100px'
            }}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
            <option value="HEAD">HEAD</option>
            <option value="OPTIONS">OPTIONS</option>
          </select>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.example.com/endpoint"
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontFamily: 'monospace'
            }}
          />
          <button
            onClick={handleSendAPIRequest}
            disabled={!apiUrl || isLoading}
            style={{
              padding: '10px 30px',
              backgroundColor: isLoading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? '⏳ Sending...' : '🚀 Send'}
          </button>
        </div>

        {/* Headers */}
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ marginBottom: '10px' }}>Headers</h4>
          {apiHeaders.map((header, index) => (
            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
              <input
                type="text"
                value={header.key}
                onChange={(e) => {
                  const newHeaders = [...apiHeaders]
                  newHeaders[index].key = e.target.value
                  setApiHeaders(newHeaders)
                }}
                placeholder="Header name"
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '13px'
                }}
              />
              <input
                type="text"
                value={header.value}
                onChange={(e) => {
                  const newHeaders = [...apiHeaders]
                  newHeaders[index].value = e.target.value
                  setApiHeaders(newHeaders)
                }}
                placeholder="Header value"
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  fontSize: '13px'
                }}
              />
              <button
                onClick={() => setApiHeaders(apiHeaders.filter((_, i) => i !== index))}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => setApiHeaders([...apiHeaders, { key: '', value: '' }])}
            style={{
              padding: '6px 12px',
              backgroundColor: '#f9fafb',
              color: '#666',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            + Add Header
          </button>
        </div>

        {/* Body */}
        {['POST', 'PUT', 'PATCH'].includes(apiMethod) && (
          <div>
            <h4 style={{ marginBottom: '10px' }}>Request Body</h4>
            <textarea
              value={apiBody}
              onChange={(e) => setApiBody(e.target.value)}
              placeholder='{"key": "value"}'
              rows={6}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontFamily: 'monospace',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>
        )}
      </div>

      {/* Response */}
      {apiResponse && (
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0 }}>Response</h3>

          <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', fontSize: '14px' }}>
            <span>
              Status:{' '}
              <strong style={{ color: getStatusColor(apiResponse.status) }}>
                {apiResponse.status} {apiResponse.statusText}
              </strong>
            </span>
            <span>
              Time: <strong>{apiResponse.duration.toFixed(0)}ms</strong>
            </span>
            <span>
              Size: <strong>{formatBytes(apiResponse.size)}</strong>
            </span>
          </div>

          <h4>Response Body</h4>
          <pre style={{
            padding: '15px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '13px',
            fontFamily: 'monospace',
            maxHeight: '400px'
          }}>
            {apiResponse.body}
          </pre>
        </div>
      )}

      {/* History */}
      {apiHistory.length > 0 && (
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0 }}>Request History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {apiHistory.slice(0, 10).map(req => (
              <div
                key={req.id}
                style={{
                  padding: '10px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  setApiMethod(req.method)
                  setApiUrl(req.url)
                  setApiBody(req.body || '')
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {req.method}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                    {req.url}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {req.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderWebhooks = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Webhook Tester</h2>

      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Test Webhook Delivery</h3>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
            Webhook URL
          </label>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-app.com/webhook"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontFamily: 'monospace'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
            HTTP Method
          </label>
          <select
            value={webhookMethod}
            onChange={(e) => setWebhookMethod(e.target.value as HttpMethod)}
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              width: '150px'
            }}
          >
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
            Payload
          </label>
          <textarea
            value={webhookPayload}
            onChange={(e) => setWebhookPayload(e.target.value)}
            rows={8}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontFamily: 'monospace',
              fontSize: '13px',
              resize: 'vertical'
            }}
          />
        </div>

        <button
          onClick={handleTestWebhook}
          disabled={!webhookUrl}
          style={{
            padding: '10px 20px',
            backgroundColor: webhookUrl ? '#3b82f6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: webhookUrl ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}
        >
          🧪 Test Webhook
        </button>
      </div>

      {/* Webhook Test Results */}
      {webhookTests.length > 0 && (
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0 }}>Test Results</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {webhookTests.map(test => (
              <div
                key={test.id}
                style={{
                  padding: '15px',
                  backgroundColor: test.status === 'success' ? '#f0fdf4' : test.status === 'failed' ? '#fee2e2' : '#f9fafb',
                  border: `1px solid ${test.status === 'success' ? '#86efac' : test.status === 'failed' ? '#fca5a5' : '#e5e7eb'}`,
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                    {test.method} {test.url}
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    backgroundColor: test.status === 'success' ? '#10b981' : test.status === 'failed' ? '#ef4444' : '#f59e0b',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {test.status}
                  </span>
                </div>
                {test.response && (
                  <pre style={{
                    padding: '10px',
                    backgroundColor: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    margin: 0,
                    overflow: 'auto'
                  }}>
                    {test.response}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderLogs = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Real-Time Logs</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value as LogLevel | 'all')}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd'
            }}
          >
            <option value="all">All Levels</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="fatal">Fatal</option>
          </select>
          <input
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="Search logs..."
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              width: '200px'
            }}
          />
        </div>
      </div>

      <div style={{
        padding: '15px',
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '13px',
        maxHeight: '600px',
        overflowY: 'auto'
      }}>
        {logs
          .filter(log => logFilter === 'all' || log.level === logFilter)
          .filter(log => !logSearch || log.message.toLowerCase().includes(logSearch.toLowerCase()))
          .map(log => (
            <div
              key={log.id}
              style={{
                padding: '8px',
                marginBottom: '4px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                borderLeft: `3px solid ${getLogLevelColor(log.level)}`
              }}
            >
              <div style={{ display: 'flex', gap: '12px', color: 'white' }}>
                <span style={{ color: '#6b7280' }}>
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span style={{
                  color: getLogLevelColor(log.level),
                  fontWeight: 'bold',
                  minWidth: '60px'
                }}>
                  [{log.level.toUpperCase()}]
                </span>
                <span style={{ color: '#9ca3af' }}>
                  {log.source}
                </span>
                <span style={{ flex: 1 }}>
                  {log.message}
                </span>
              </div>
              {log.stackTrace && (
                <div style={{
                  marginTop: '8px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ef4444',
                  fontSize: '11px'
                }}>
                  {log.stackTrace}
                </div>
              )}
            </div>
          ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  )

  const renderPerformance = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Performance Metrics</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {performanceMetrics.map(metric => (
          <div
            key={metric.id}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px'
            }}
          >
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              {metric.name}
            </div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '5px' }}>
              {metric.value.toFixed(metric.unit === '%' ? 0 : 1)}
              <span style={{ fontSize: '20px', color: '#666', marginLeft: '5px' }}>
                {metric.unit}
              </span>
            </div>
            <div style={{
              height: '4px',
              backgroundColor: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${metric.unit === '%' ? Math.min(metric.value, 100) : 50}%`,
                backgroundColor: metric.value > 70 && metric.unit === '%' ? '#ef4444' : '#3b82f6',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>Performance Over Time</h3>
        <div style={{
          height: '300px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          padding: '15px'
        }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '4%',
                height: `${Math.random() * 80 + 20}%`,
                backgroundColor: '#3b82f6',
                borderRadius: '2px 2px 0 0'
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )

  const renderErrors = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Error Tracking</h2>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {errors.filter(e => !e.resolved).length} unresolved errors
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {errors.map(error => (
          <div
            key={error.id}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              border: `2px solid ${error.resolved ? '#10b981' : '#ef4444'}`,
              borderRadius: '8px',
              opacity: error.resolved ? 0.6 : 1
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444', marginBottom: '5px' }}>
                  {error.type}: {error.message}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {error.url} at line {error.lineNumber}:{error.columnNumber}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {error.timestamp.toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => handleResolveError(error.id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: error.resolved ? '#10b981' : '#e5e7eb',
                  color: error.resolved ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}
              >
                {error.resolved ? '✓ Resolved' : 'Mark Resolved'}
              </button>
            </div>

            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', color: '#666', fontSize: '14px', fontWeight: 'bold' }}>
                Stack Trace
              </summary>
              <pre style={{
                marginTop: '10px',
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '12px',
                fontFamily: 'monospace',
                overflow: 'auto',
                color: '#ef4444'
              }}>
                {error.stackTrace}
              </pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  )

  const renderNetwork = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Network Inspector</h2>

      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Method</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>URL</th>
              <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Duration</th>
              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Size</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Initiator</th>
            </tr>
          </thead>
          <tbody>
            {networkRequests.map(req => (
              <tr key={req.id}>
                <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{
                    padding: '4px 6px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {req.method}
                  </span>
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', fontFamily: 'monospace' }}>
                  {req.url}
                </td>
                <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: `${getStatusColor(req.status)}20`,
                    color: getStatusColor(req.status),
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    {req.status}
                  </span>
                </td>
                <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                  {req.duration}ms
                </td>
                <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                  {formatBytes(req.size)}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid #e5e7eb', color: '#666', fontSize: '12px' }}>
                  {req.initiator}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderDatabase = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Database Query Analyzer</h2>

      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Execute Query</h3>
        <textarea
          value={dbQuery}
          onChange={(e) => setDbQuery(e.target.value)}
          rows={6}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #ddd',
            fontFamily: 'monospace',
            fontSize: '13px',
            marginBottom: '10px',
            resize: 'vertical'
          }}
        />
        <button
          onClick={handleExecuteQuery}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          ▶ Execute Query
        </button>
      </div>

      {/* Query History */}
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>Query History</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dbQueries.map(query => (
            <div
              key={query.id}
              style={{
                padding: '12px',
                backgroundColor: query.slow ? '#fef3c7' : '#f9fafb',
                border: query.slow ? '1px solid #f59e0b' : '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '13px', flex: 1 }}>
                  {query.query}
                </div>
                {query.slow && (
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    SLOW
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Duration: <strong>{query.duration}ms</strong> |
                Rows: <strong>{query.rowsAffected}</strong> |
                Database: <strong>{query.database}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'api', label: 'API Debugger', icon: '🔌' },
    { id: 'webhooks', label: 'Webhooks', icon: '🪝' },
    { id: 'logs', label: 'Logs', icon: '📝' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'errors', label: 'Errors', icon: '🐛' },
    { id: 'network', label: 'Network', icon: '🌐' },
    { id: 'database', label: 'Database', icon: '🗄️' }
  ]

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1e293b',
        color: 'white',
        borderBottom: '3px solid #10b981'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🛠️ Developer Toolkit</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
          Comprehensive development and debugging tools
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              padding: '15px 20px',
              backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#10b981' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #10b981' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'api' && renderAPI()}
      {activeTab === 'webhooks' && renderWebhooks()}
      {activeTab === 'logs' && renderLogs()}
      {activeTab === 'performance' && renderPerformance()}
      {activeTab === 'errors' && renderErrors()}
      {activeTab === 'network' && renderNetwork()}
      {activeTab === 'database' && renderDatabase()}
    </div>
  )
}

export default DeveloperToolkit

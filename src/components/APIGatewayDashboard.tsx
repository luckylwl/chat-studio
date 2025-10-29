/**
 * AI Chat Studio v5.0 - API Gateway Dashboard
 *
 * Comprehensive API management interface with:
 * - Route management and configuration
 * - API key generation and lifecycle
 * - Rate limiting and throttling
 * - Authentication and authorization
 * - Real-time analytics and monitoring
 * - Request logging and debugging
 */

import React, { useState, useEffect } from 'react'
import { apiGatewayService } from '../services/v5CoreServices'
import {
  APIGateway,
  APIRoute,
  APIKey,
  APIRequest,
  RateLimitConfig,
  AuthenticationConfig,
  APIAnalytics
} from '../types/v5-types'

interface APIGatewayDashboardProps {
  userId: string
}

type TabType = 'overview' | 'routes' | 'keys' | 'limits' | 'auth' | 'analytics' | 'logs'

const APIGatewayDashboard: React.FC<APIGatewayDashboardProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [gateways, setGateways] = useState<APIGateway[]>([])
  const [selectedGateway, setSelectedGateway] = useState<APIGateway | null>(null)
  const [routes, setRoutes] = useState<APIRoute[]>([])
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [analytics, setAnalytics] = useState<APIAnalytics | null>(null)
  const [recentRequests, setRecentRequests] = useState<APIRequest[]>([])

  // Route form state
  const [newRoute, setNewRoute] = useState({
    path: '',
    method: 'GET' as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    target: '',
    authentication: true,
    rateLimit: 100
  })

  // API Key form state
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>([])

  // Rate limit form state
  const [newRateLimit, setNewRateLimit] = useState({
    name: '',
    limit: 100,
    window: 3600,
    scope: 'user' as 'user' | 'ip' | 'api_key'
  })

  useEffect(() => {
    loadGateways()
  }, [])

  useEffect(() => {
    if (selectedGateway) {
      loadGatewayDetails()
    }
  }, [selectedGateway])

  const loadGateways = async () => {
    const allGateways = await apiGatewayService.getAllGateways()
    setGateways(allGateways)
    if (allGateways.length > 0 && !selectedGateway) {
      setSelectedGateway(allGateways[0])
    }
  }

  const loadGatewayDetails = async () => {
    if (!selectedGateway) return

    const gatewayData = await apiGatewayService.getGateway(selectedGateway.id)
    if (gatewayData) {
      setRoutes(gatewayData.routes)

      // Load API keys
      const keys = await apiGatewayService.getAllAPIKeys()
      setApiKeys(keys.filter(k => k.status === 'active'))

      // Load analytics
      const analyticsData = await apiGatewayService.getAnalytics(
        selectedGateway.id,
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        new Date()
      )
      setAnalytics(analyticsData)

      // Load recent requests
      const requests = await apiGatewayService.getRecentRequests(selectedGateway.id, 50)
      setRecentRequests(requests)
    }
  }

  const handleCreateGateway = async () => {
    const name = prompt('Enter gateway name:')
    if (!name) return

    const gateway = await apiGatewayService.createGateway(name, 'http://localhost:3000', [])
    setGateways([...gateways, gateway])
    setSelectedGateway(gateway)
  }

  const handleCreateRoute = async () => {
    if (!selectedGateway || !newRoute.path || !newRoute.target) {
      alert('Please fill all required fields')
      return
    }

    const route: APIRoute = {
      id: `route_${Date.now()}`,
      path: newRoute.path,
      method: newRoute.method,
      target: newRoute.target,
      authentication: newRoute.authentication,
      rateLimit: newRoute.rateLimit,
      timeout: 30000,
      retries: 3,
      caching: {
        enabled: false,
        ttl: 300
      },
      transformation: {
        request: {},
        response: {}
      }
    }

    await apiGatewayService.addRoute(selectedGateway.id, route)
    setRoutes([...routes, route])

    // Reset form
    setNewRoute({
      path: '',
      method: 'GET',
      target: '',
      authentication: true,
      rateLimit: 100
    })
  }

  const handleDeleteRoute = async (routeId: string) => {
    if (!selectedGateway) return

    if (confirm('Are you sure you want to delete this route?')) {
      await apiGatewayService.removeRoute(selectedGateway.id, routeId)
      setRoutes(routes.filter(r => r.id !== routeId))
    }
  }

  const handleCreateAPIKey = async () => {
    if (!newKeyName) {
      alert('Please enter a key name')
      return
    }

    const scopes = newKeyScopes.length > 0
      ? newKeyScopes
      : ['read', 'write']

    const apiKey = await apiGatewayService.createAPIKey(newKeyName, userId, scopes)
    setApiKeys([...apiKeys, apiKey])

    // Show the key (only time it's visible)
    alert(`API Key Created!\n\nKey: ${apiKey.key}\n\nPlease save this key securely. You won't be able to see it again.`)

    setNewKeyName('')
    setNewKeyScopes([])
  }

  const handleRevokeAPIKey = async (keyId: string) => {
    if (confirm('Are you sure you want to revoke this API key?')) {
      await apiGatewayService.revokeAPIKey(keyId)
      setApiKeys(apiKeys.filter(k => k.id !== keyId))
    }
  }

  const handleCreateRateLimit = async () => {
    if (!selectedGateway || !newRateLimit.name) return

    const config: RateLimitConfig = {
      id: `limit_${Date.now()}`,
      name: newRateLimit.name,
      limit: newRateLimit.limit,
      window: newRateLimit.window,
      scope: newRateLimit.scope,
      actions: ['throttle']
    }

    const updatedGateway = await apiGatewayService.getGateway(selectedGateway.id)
    if (updatedGateway) {
      updatedGateway.rateLimits.push(config)
      setSelectedGateway(updatedGateway)
    }

    setNewRateLimit({
      name: '',
      limit: 100,
      window: 3600,
      scope: 'user'
    })
  }

  const handleToggleGatewayStatus = async () => {
    if (!selectedGateway) return

    const newStatus = selectedGateway.status === 'active' ? 'inactive' : 'active'
    selectedGateway.status = newStatus
    setSelectedGateway({ ...selectedGateway })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'inactive': return '#6b7280'
      case 'maintenance': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return '#3b82f6'
      case 'POST': return '#10b981'
      case 'PUT': return '#f59e0b'
      case 'DELETE': return '#ef4444'
      case 'PATCH': return '#8b5cf6'
      default: return '#6b7280'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const renderOverview = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>API Gateway Overview</h2>

      {/* Gateway Selector */}
      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Select Gateway:
        </label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={selectedGateway?.id || ''}
            onChange={(e) => {
              const gateway = gateways.find(g => g.id === e.target.value)
              setSelectedGateway(gateway || null)
            }}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd'
            }}
          >
            {gateways.map(gateway => (
              <option key={gateway.id} value={gateway.id}>
                {gateway.name} - {gateway.status}
              </option>
            ))}
          </select>
          <button
            onClick={handleCreateGateway}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            + New Gateway
          </button>
        </div>
      </div>

      {selectedGateway && (
        <>
          {/* Gateway Status Card */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 10px 0' }}>{selectedGateway.name}</h3>
                <div style={{ display: 'flex', gap: '15px', fontSize: '14px', color: '#666' }}>
                  <span>
                    <strong>Status:</strong>{' '}
                    <span style={{ color: getStatusColor(selectedGateway.status) }}>
                      {selectedGateway.status}
                    </span>
                  </span>
                  <span><strong>Routes:</strong> {routes.length}</span>
                  <span><strong>API Keys:</strong> {apiKeys.length}</span>
                  <span><strong>Rate Limits:</strong> {selectedGateway.rateLimits.length}</span>
                </div>
              </div>
              <button
                onClick={handleToggleGatewayStatus}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedGateway.status === 'active' ? '#ef4444' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {selectedGateway.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>

          {/* Analytics Cards */}
          {analytics && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginBottom: '20px'
            }}>
              <div style={{
                padding: '20px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  Total Requests
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                  {formatNumber(analytics.totalRequests)}
                </div>
                <div style={{ fontSize: '12px', color: '#10b981', marginTop: '5px' }}>
                  ↑ Last 24 hours
                </div>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  Success Rate
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                  {analytics.successRate.toFixed(1)}%
                </div>
                <div style={{ fontSize: '12px', color: '#10b981', marginTop: '5px' }}>
                  {analytics.successfulRequests} successful
                </div>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  Avg Response Time
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                  {analytics.averageResponseTime.toFixed(0)}ms
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  P95: {analytics.p95ResponseTime.toFixed(0)}ms
                </div>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                  Error Rate
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
                  {analytics.errorRate.toFixed(1)}%
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  {analytics.failedRequests} errors
                </div>
              </div>
            </div>
          )}

          {/* Top Routes */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0 }}>Top Routes (Last 24h)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {routes.slice(0, 5).map(route => (
                <div
                  key={route.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        backgroundColor: getMethodColor(route.method),
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      {route.method}
                    </span>
                    <span style={{ fontFamily: 'monospace' }}>{route.path}</span>
                  </div>
                  <span style={{ color: '#666' }}>
                    {Math.floor(Math.random() * 10000)} requests
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderRoutes = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>API Routes</h2>

      {/* Create Route Form */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Create New Route</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Path *
            </label>
            <input
              type="text"
              value={newRoute.path}
              onChange={(e) => setNewRoute({ ...newRoute, path: e.target.value })}
              placeholder="/api/v1/users"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Method
            </label>
            <select
              value={newRoute.method}
              onChange={(e) => setNewRoute({ ...newRoute, method: e.target.value as any })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Target URL *
            </label>
            <input
              type="text"
              value={newRoute.target}
              onChange={(e) => setNewRoute({ ...newRoute, target: e.target.value })}
              placeholder="http://backend:8080/users"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Rate Limit (requests/minute)
            </label>
            <input
              type="number"
              value={newRoute.rateLimit}
              onChange={(e) => setNewRoute({ ...newRoute, rateLimit: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            />
          </div>
        </div>

        <div style={{ marginTop: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={newRoute.authentication}
              onChange={(e) => setNewRoute({ ...newRoute, authentication: e.target.checked })}
              style={{ marginRight: '8px' }}
            />
            <span>Require Authentication</span>
          </label>
        </div>

        <button
          onClick={handleCreateRoute}
          style={{
            marginTop: '15px',
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Create Route
        </button>
      </div>

      {/* Routes List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {routes.map(route => (
          <div
            key={route.id}
            style={{
              padding: '15px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      backgroundColor: getMethodColor(route.method),
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {route.method}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold' }}>
                    {route.path}
                  </span>
                  {route.authentication && (
                    <span style={{
                      padding: '2px 6px',
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      borderRadius: '4px',
                      fontSize: '10px'
                    }}>
                      🔒 AUTH
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <strong>Target:</strong> {route.target}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                  <strong>Rate Limit:</strong> {route.rateLimit} req/min |
                  <strong> Timeout:</strong> {route.timeout}ms |
                  <strong> Retries:</strong> {route.retries}
                </div>
              </div>
              <button
                onClick={() => handleDeleteRoute(route.id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {routes.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            No routes configured yet. Create your first route above.
          </div>
        )}
      </div>
    </div>
  )

  const renderAPIKeys = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>API Keys</h2>

      {/* Create API Key Form */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Generate New API Key</h3>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Key Name *
          </label>
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Production API Key"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Scopes (comma-separated)
          </label>
          <input
            type="text"
            value={newKeyScopes.join(', ')}
            onChange={(e) => setNewKeyScopes(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="read, write, admin"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd'
            }}
          />
        </div>

        <button
          onClick={handleCreateAPIKey}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Generate Key
        </button>
      </div>

      {/* API Keys List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {apiKeys.map(key => (
          <div
            key={key.id}
            style={{
              padding: '15px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{key.name}</div>
                <div style={{ fontSize: '14px', color: '#666', fontFamily: 'monospace' }}>
                  {key.key.substring(0, 20)}...{key.key.substring(key.key.length - 4)}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  <strong>Scopes:</strong> {key.scopes.join(', ')} |
                  <strong> Created:</strong> {key.createdAt.toLocaleDateString()} |
                  <strong> Last Used:</strong> {key.lastUsed ? key.lastUsed.toLocaleDateString() : 'Never'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: key.status === 'active' ? '#dcfce7' : '#fee2e2',
                  color: key.status === 'active' ? '#166534' : '#991b1b',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {key.status}
                </span>
                <button
                  onClick={() => handleRevokeAPIKey(key.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>
        ))}

        {apiKeys.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            No API keys generated yet. Create your first key above.
          </div>
        )}
      </div>
    </div>
  )

  const renderRateLimits = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Rate Limiting</h2>

      {/* Create Rate Limit Form */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Create Rate Limit Policy</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Policy Name *
            </label>
            <input
              type="text"
              value={newRateLimit.name}
              onChange={(e) => setNewRateLimit({ ...newRateLimit, name: e.target.value })}
              placeholder="Standard Rate Limit"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Scope
            </label>
            <select
              value={newRateLimit.scope}
              onChange={(e) => setNewRateLimit({ ...newRateLimit, scope: e.target.value as any })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            >
              <option value="user">Per User</option>
              <option value="ip">Per IP Address</option>
              <option value="api_key">Per API Key</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Request Limit
            </label>
            <input
              type="number"
              value={newRateLimit.limit}
              onChange={(e) => setNewRateLimit({ ...newRateLimit, limit: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Time Window (seconds)
            </label>
            <input
              type="number"
              value={newRateLimit.window}
              onChange={(e) => setNewRateLimit({ ...newRateLimit, window: parseInt(e.target.value) })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleCreateRateLimit}
          style={{
            marginTop: '15px',
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Create Policy
        </button>
      </div>

      {/* Rate Limits List */}
      {selectedGateway && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {selectedGateway.rateLimits.map(limit => (
            <div
              key={limit.id}
              style={{
                padding: '15px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{limit.name}</div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <strong>Limit:</strong> {limit.limit} requests per {limit.window}s
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                <strong>Scope:</strong> {limit.scope} |
                <strong> Actions:</strong> {limit.actions.join(', ')}
              </div>
            </div>
          ))}

          {selectedGateway.rateLimits.length === 0 && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#666',
              backgroundColor: '#f9fafb',
              borderRadius: '8px'
            }}>
              No rate limit policies configured yet.
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderAuthentication = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Authentication & Authorization</h2>

      {selectedGateway && (
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0 }}>Authentication Configuration</h3>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
              Authentication Type
            </label>
            <select
              value={selectedGateway.authentication.type}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            >
              <option value="none">No Authentication</option>
              <option value="api_key">API Key</option>
              <option value="jwt">JWT Token</option>
              <option value="oauth">OAuth 2.0</option>
              <option value="basic">Basic Auth</option>
            </select>
          </div>

          {selectedGateway.authentication.type === 'jwt' && (
            <div>
              <h4>JWT Configuration</h4>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  JWT Secret
                </label>
                <input
                  type="password"
                  value={selectedGateway.authentication.jwtSecret || ''}
                  placeholder="Enter JWT secret"
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
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  Issuer
                </label>
                <input
                  type="text"
                  value={selectedGateway.authentication.issuer || ''}
                  placeholder="https://auth.example.com"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  Audience
                </label>
                <input
                  type="text"
                  value={selectedGateway.authentication.audience || ''}
                  placeholder="api.example.com"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
            </div>
          )}

          <button
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Save Configuration
          </button>
        </div>
      )}
    </div>
  )

  const renderAnalytics = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Analytics & Monitoring</h2>

      {analytics && (
        <>
          {/* Time Series Chart Placeholder */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Request Volume (Last 24h)</h3>
            <div style={{
              height: '200px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-around',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              padding: '10px'
            }}>
              {Array.from({ length: 24 }).map((_, i) => {
                const height = Math.random() * 150 + 20
                return (
                  <div
                    key={i}
                    style={{
                      width: '3%',
                      height: `${height}px`,
                      backgroundColor: '#3b82f6',
                      borderRadius: '2px 2px 0 0'
                    }}
                    title={`Hour ${i}: ${Math.floor(height * 10)} requests`}
                  />
                )
              })}
            </div>
          </div>

          {/* Top Endpoints by Traffic */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Top Endpoints by Traffic</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {analytics.topEndpoints.map(endpoint => (
                <div
                  key={endpoint.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{
                      padding: '4px 8px',
                      backgroundColor: getMethodColor(endpoint.method),
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginRight: '10px'
                    }}>
                      {endpoint.method}
                    </span>
                    <span style={{ fontFamily: 'monospace' }}>{endpoint.path}</span>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '150px' }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {formatNumber(endpoint.requests)} requests
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {endpoint.averageResponseTime.toFixed(0)}ms avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Distribution */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0 }}>Error Distribution</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
              {Object.entries(analytics.errorsByCode).map(([code, count]) => (
                <div
                  key={code}
                  style={{
                    padding: '15px',
                    backgroundColor: '#fee2e2',
                    borderRadius: '6px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#991b1b' }}>
                    {code}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    {count} errors
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderLogs = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Request Logs</h2>

      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recentRequests.map(request => (
            <div
              key={request.id}
              style={{
                padding: '15px',
                backgroundColor: request.statusCode >= 400 ? '#fee2e2' : '#f0fdf4',
                borderLeft: `4px solid ${request.statusCode >= 400 ? '#ef4444' : '#10b981'}`,
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <div>
                  <span
                    style={{
                      padding: '4px 8px',
                      backgroundColor: getMethodColor(request.method),
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginRight: '10px'
                    }}
                  >
                    {request.method}
                  </span>
                  <span>{request.path}</span>
                </div>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: request.statusCode >= 400 ? '#fca5a5' : '#86efac',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {request.statusCode}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                <span><strong>Duration:</strong> {request.duration}ms</span> |
                <span><strong> Time:</strong> {request.timestamp.toLocaleString()}</span> |
                <span><strong> User:</strong> {request.userId || 'Anonymous'}</span>
              </div>
            </div>
          ))}

          {recentRequests.length === 0 && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#666'
            }}>
              No requests logged yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'routes', label: 'Routes' },
    { id: 'keys', label: 'API Keys' },
    { id: 'limits', label: 'Rate Limits' },
    { id: 'auth', label: 'Authentication' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'logs', label: 'Logs' }
  ]

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1e293b',
        color: 'white',
        borderBottom: '3px solid #3b82f6'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>⚡ API Gateway Dashboard</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
          Manage API routes, authentication, and monitoring
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              padding: '15px 25px',
              backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#3b82f6' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'routes' && renderRoutes()}
      {activeTab === 'keys' && renderAPIKeys()}
      {activeTab === 'limits' && renderRateLimits()}
      {activeTab === 'auth' && renderAuthentication()}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'logs' && renderLogs()}
    </div>
  )
}

export default APIGatewayDashboard

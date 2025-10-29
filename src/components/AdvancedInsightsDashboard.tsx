import React, { useState, useEffect } from 'react'

// ==================== Types ====================

type TimeRange = '1h' | '24h' | '7d' | '30d' | '90d' | 'custom'
type MetricType = 'usage' | 'performance' | 'engagement' | 'revenue' | 'errors'
type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter'
type InsightPriority = 'critical' | 'high' | 'medium' | 'low'
type InsightCategory = 'performance' | 'security' | 'usage' | 'revenue' | 'anomaly'

interface Metric {
  id: string
  name: string
  type: MetricType
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  unit: string
  target?: number
  history: Array<{
    timestamp: Date
    value: number
  }>
}

interface AIInsight {
  id: string
  title: string
  description: string
  category: InsightCategory
  priority: InsightPriority
  confidence: number
  impact: string
  recommendations: string[]
  relatedMetrics: string[]
  timestamp: Date
  status: 'active' | 'resolved' | 'dismissed'
}

interface Anomaly {
  id: string
  metric: string
  detectedAt: Date
  severity: 'critical' | 'warning' | 'info'
  expectedValue: number
  actualValue: number
  deviation: number
  description: string
  possibleCauses: string[]
}

interface Forecast {
  metric: string
  predictions: Array<{
    timestamp: Date
    predicted: number
    lowerBound: number
    upperBound: number
    confidence: number
  }>
  accuracy: number
  method: 'linear' | 'exponential' | 'arima' | 'prophet'
}

interface Segment {
  id: string
  name: string
  description: string
  size: number
  growth: number
  avgValue: number
  characteristics: Record<string, string>
  trends: Array<{
    metric: string
    value: number
    change: number
  }>
}

interface Comparison {
  id: string
  name: string
  periods: Array<{
    label: string
    startDate: Date
    endDate: Date
  }>
  metrics: Array<{
    name: string
    values: number[]
    changes: number[]
  }>
}

interface CustomReport {
  id: string
  name: string
  description: string
  schedule: 'daily' | 'weekly' | 'monthly' | 'custom'
  recipients: string[]
  metrics: string[]
  charts: Array<{
    type: ChartType
    metric: string
  }>
  lastRun?: Date
  nextRun?: Date
}

// ==================== Mock Data ====================

const mockMetrics: Metric[] = [
  {
    id: 'metric_1',
    name: 'Total Conversations',
    type: 'usage',
    value: 45678,
    change: 12.5,
    trend: 'up',
    unit: 'count',
    target: 50000,
    history: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000),
      value: 35000 + Math.random() * 15000 + i * 500
    }))
  },
  {
    id: 'metric_2',
    name: 'Average Response Time',
    type: 'performance',
    value: 234,
    change: -8.3,
    trend: 'down',
    unit: 'ms',
    target: 200,
    history: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000),
      value: 250 - i * 2 + Math.random() * 40
    }))
  },
  {
    id: 'metric_3',
    name: 'User Engagement Rate',
    type: 'engagement',
    value: 78.5,
    change: 5.2,
    trend: 'up',
    unit: '%',
    target: 80,
    history: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000),
      value: 70 + Math.random() * 12 + i * 0.3
    }))
  },
  {
    id: 'metric_4',
    name: 'Monthly Revenue',
    type: 'revenue',
    value: 125000,
    change: 18.7,
    trend: 'up',
    unit: '$',
    target: 150000,
    history: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000),
      value: 100000 + Math.random() * 30000 + i * 1000
    }))
  },
  {
    id: 'metric_5',
    name: 'Error Rate',
    type: 'errors',
    value: 0.45,
    change: -15.2,
    trend: 'down',
    unit: '%',
    target: 0.3,
    history: Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000),
      value: 0.6 - i * 0.01 + Math.random() * 0.1
    }))
  }
]

const mockInsights: AIInsight[] = [
  {
    id: 'insight_1',
    title: 'Unusual Traffic Spike Detected',
    description: 'Conversation volume increased by 45% in the last 2 hours, significantly above the normal pattern. This spike correlates with a marketing campaign launch.',
    category: 'usage',
    priority: 'high',
    confidence: 0.92,
    impact: 'Increased server load by 35%, approaching capacity limits',
    recommendations: [
      'Scale up server capacity by 40% to handle increased load',
      'Monitor response times closely for the next 6 hours',
      'Consider implementing rate limiting if growth continues',
      'Review infrastructure costs and optimize resource allocation'
    ],
    relatedMetrics: ['metric_1', 'metric_2'],
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: 'active'
  },
  {
    id: 'insight_2',
    title: 'Response Time Optimization Opportunity',
    description: 'Analysis shows 23% of queries could be cached, reducing average response time by approximately 65ms.',
    category: 'performance',
    priority: 'medium',
    confidence: 0.87,
    impact: 'Potential 28% improvement in response time',
    recommendations: [
      'Implement Redis caching for frequently asked questions',
      'Enable CDN for static content delivery',
      'Optimize database queries with proper indexing',
      'Consider lazy loading for non-critical data'
    ],
    relatedMetrics: ['metric_2'],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: 'active'
  },
  {
    id: 'insight_3',
    title: 'High-Value User Segment Identified',
    description: 'AI analysis identified a user segment (8% of users) contributing 42% of total revenue. These users share common usage patterns.',
    category: 'revenue',
    priority: 'high',
    confidence: 0.94,
    impact: 'Opportunity to increase revenue by 25-30% through targeted features',
    recommendations: [
      'Create personalized onboarding for similar user profiles',
      'Develop premium features targeting this segment',
      'Implement retention campaigns to reduce churn in this group',
      'Analyze feature usage to replicate success patterns'
    ],
    relatedMetrics: ['metric_4'],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    status: 'active'
  },
  {
    id: 'insight_4',
    title: 'Security Anomaly Resolved',
    description: 'Detected unusual API access patterns from 3 IP addresses. Investigation revealed a misconfigured client application, now resolved.',
    category: 'security',
    priority: 'critical',
    confidence: 0.96,
    impact: 'Prevented potential security breach',
    recommendations: [
      'Implement stricter API rate limiting per IP',
      'Add anomaly detection alerts for unusual patterns',
      'Review and update API authentication requirements',
      'Conduct security audit of client applications'
    ],
    relatedMetrics: ['metric_5'],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
    status: 'resolved'
  }
]

const mockAnomalies: Anomaly[] = [
  {
    id: 'anomaly_1',
    metric: 'Response Time',
    detectedAt: new Date(Date.now() - 1000 * 60 * 45),
    severity: 'warning',
    expectedValue: 230,
    actualValue: 387,
    deviation: 68.3,
    description: 'Response time exceeded expected range by 68%',
    possibleCauses: [
      'Database query optimization needed',
      'Increased concurrent users',
      'External API slowdown',
      'Memory leak in application'
    ]
  },
  {
    id: 'anomaly_2',
    metric: 'Error Rate',
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    severity: 'critical',
    expectedValue: 0.4,
    actualValue: 2.3,
    deviation: 475,
    description: 'Error rate spiked 5.75x above normal levels',
    possibleCauses: [
      'Recent deployment issue',
      'Third-party API outage',
      'Configuration error',
      'Database connection pool exhausted'
    ]
  }
]

const mockSegments: Segment[] = [
  {
    id: 'seg_1',
    name: 'Power Users',
    description: 'High-frequency users with daily engagement',
    size: 2340,
    growth: 15.3,
    avgValue: 250,
    characteristics: {
      'Avg Sessions/Day': '12.5',
      'Avg Duration': '45 min',
      'Feature Adoption': '87%',
      'Retention Rate': '94%'
    },
    trends: [
      { metric: 'Usage', value: 12.5, change: 8.3 },
      { metric: 'Revenue', value: 250, change: 12.1 },
      { metric: 'Engagement', value: 87, change: 5.7 }
    ]
  },
  {
    id: 'seg_2',
    name: 'New Adopters',
    description: 'Users in their first 30 days',
    size: 5670,
    growth: 25.7,
    avgValue: 45,
    characteristics: {
      'Avg Sessions/Day': '2.3',
      'Avg Duration': '12 min',
      'Feature Adoption': '34%',
      'Retention Rate': '67%'
    },
    trends: [
      { metric: 'Usage', value: 2.3, change: 18.5 },
      { metric: 'Revenue', value: 45, change: 22.4 },
      { metric: 'Engagement', value: 34, change: 15.2 }
    ]
  },
  {
    id: 'seg_3',
    name: 'Enterprise Clients',
    description: 'Large organization accounts',
    size: 156,
    growth: 8.9,
    avgValue: 2500,
    characteristics: {
      'Avg Users/Account': '125',
      'Avg Duration': '8 hrs',
      'Feature Adoption': '95%',
      'Retention Rate': '98%'
    },
    trends: [
      { metric: 'Usage', value: 125, change: 6.2 },
      { metric: 'Revenue', value: 2500, change: 9.8 },
      { metric: 'Engagement', value: 95, change: 2.3 }
    ]
  }
]

// ==================== Component ====================

const AdvancedInsightsDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'anomalies' | 'forecasting' | 'segments' | 'comparison' | 'reports'>('overview')
  const [metrics] = useState<Metric[]>(mockMetrics)
  const [insights, setInsights] = useState<AIInsight[]>(mockInsights)
  const [anomalies] = useState<Anomaly[]>(mockAnomalies)
  const [segments] = useState<Segment[]>(mockSegments)
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['metric_1', 'metric_2'])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Computed values
  const activeInsights = insights.filter(i => i.status === 'active')
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical')
  const totalUsers = segments.reduce((sum, seg) => sum + seg.size, 0)

  // Handlers
  const handleDismissInsight = (id: string) => {
    setInsights(prev => prev.map(insight =>
      insight.id === id ? { ...insight, status: 'dismissed' as const } : insight
    ))
  }

  const handleResolveInsight = (id: string) => {
    setInsights(prev => prev.map(insight =>
      insight.id === id ? { ...insight, status: 'resolved' as const } : insight
    ))
  }

  const getMetricIcon = (type: MetricType): string => {
    const icons = {
      usage: '📊',
      performance: '⚡',
      engagement: '👥',
      revenue: '💰',
      errors: '⚠️'
    }
    return icons[type]
  }

  const getPriorityColor = (priority: InsightPriority): string => {
    const colors = {
      critical: '#ef4444',
      high: '#f59e0b',
      medium: '#3b82f6',
      low: '#10b981'
    }
    return colors[priority]
  }

  const getSeverityColor = (severity: 'critical' | 'warning' | 'info'): string => {
    const colors = {
      critical: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    }
    return colors[severity]
  }

  const formatNumber = (num: number, unit: string): string => {
    if (unit === '$') {
      return `$${num.toLocaleString()}`
    }
    if (unit === '%') {
      return `${num.toFixed(1)}%`
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toLocaleString()
  }

  const formatChange = (change: number): string => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  // ==================== Render ====================

  return (
    <div style={{ padding: '24px', maxWidth: '1800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>🔮</span>
          Advanced Insights Dashboard
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          AI-powered analytics, anomaly detection, and predictive insights
        </p>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginTop: '24px'
        }}>
          <div style={{
            padding: '20px',
            backgroundColor: '#eff6ff',
            borderRadius: '12px',
            border: '2px solid #3b82f6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#1e40af', marginBottom: '8px', fontWeight: '500' }}>
                  Active Insights
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e40af' }}>
                  {activeInsights.length}
                </div>
              </div>
              <div style={{ fontSize: '36px' }}>💡</div>
            </div>
            <div style={{ fontSize: '13px', color: '#1e40af', marginTop: '8px' }}>
              {activeInsights.filter(i => i.priority === 'critical').length} critical
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#fee2e2',
            borderRadius: '12px',
            border: '2px solid #ef4444'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#991b1b', marginBottom: '8px', fontWeight: '500' }}>
                  Anomalies Detected
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#991b1b' }}>
                  {anomalies.length}
                </div>
              </div>
              <div style={{ fontSize: '36px' }}>🚨</div>
            </div>
            <div style={{ fontSize: '13px', color: '#991b1b', marginTop: '8px' }}>
              {criticalAnomalies.length} require immediate attention
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#dcfce7',
            borderRadius: '12px',
            border: '2px solid #10b981'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#14532d', marginBottom: '8px', fontWeight: '500' }}>
                  User Segments
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#14532d' }}>
                  {segments.length}
                </div>
              </div>
              <div style={{ fontSize: '36px' }}>🎯</div>
            </div>
            <div style={{ fontSize: '13px', color: '#14532d', marginTop: '8px' }}>
              {totalUsers.toLocaleString()} total users
            </div>
          </div>

          <div style={{
            padding: '20px',
            backgroundColor: '#fef3c7',
            borderRadius: '12px',
            border: '2px solid #f59e0b'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '8px', fontWeight: '500' }}>
                  Avg Confidence
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#92400e' }}>
                  {(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length * 100).toFixed(0)}%
                </div>
              </div>
              <div style={{ fontSize: '36px' }}>🎲</div>
            </div>
            <div style={{ fontSize: '13px', color: '#92400e', marginTop: '8px' }}>
              AI prediction accuracy
            </div>
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        border: '2px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['1h', '24h', '7d', '30d', '90d'] as TimeRange[]).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '8px 16px',
                backgroundColor: timeRange === range ? '#3b82f6' : 'white',
                color: timeRange === range ? 'white' : '#6b7280',
                border: '2px solid',
                borderColor: timeRange === range ? '#3b82f6' : '#e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: timeRange === range ? '600' : '400'
              }}
            >
              {range === '1h' && 'Last Hour'}
              {range === '24h' && 'Last 24 Hours'}
              {range === '7d' && 'Last 7 Days'}
              {range === '30d' && 'Last 30 Days'}
              {range === '90d' && 'Last 90 Days'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          style={{
            padding: '8px 16px',
            backgroundColor: 'white',
            border: '2px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          🔧 Advanced Filters
        </button>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: '📊 Overview', count: metrics.length },
            { id: 'insights', label: '💡 AI Insights', count: activeInsights.length },
            { id: 'anomalies', label: '🚨 Anomalies', count: anomalies.length },
            { id: 'forecasting', label: '🔮 Forecasting' },
            { id: 'segments', label: '🎯 Segments', count: segments.length },
            { id: 'comparison', label: '📈 Comparison' },
            { id: 'reports', label: '📄 Reports' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: `3px solid ${activeTab === tab.id ? '#3b82f6' : 'transparent'}`,
                backgroundColor: activeTab === tab.id ? '#eff6ff' : 'transparent',
                color: activeTab === tab.id ? '#1e40af' : '#6b7280',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  backgroundColor: activeTab === tab.id ? '#3b82f6' : '#e5e7eb',
                  color: activeTab === tab.id ? 'white' : '#6b7280',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' }}>
            Key Metrics Overview
          </h2>

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {metrics.map(metric => (
              <div
                key={metric.id}
                style={{
                  padding: '24px',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '24px' }}>{getMetricIcon(metric.type)}</span>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                        {metric.name}
                      </h3>
                    </div>

                    <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
                      {formatNumber(metric.value, metric.unit)}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        padding: '4px 8px',
                        backgroundColor: metric.trend === 'up' ? '#dcfce7' : metric.trend === 'down' ? '#fee2e2' : '#f3f4f6',
                        color: metric.trend === 'up' ? '#166534' : metric.trend === 'down' ? '#991b1b' : '#6b7280',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {metric.trend === 'up' && '↗️'}
                        {metric.trend === 'down' && '↘️'}
                        {metric.trend === 'stable' && '→'}
                        {' '}{formatChange(metric.change)}
                      </span>

                      {metric.target && (
                        <span style={{ fontSize: '13px', color: '#6b7280' }}>
                          Target: {formatNumber(metric.target, metric.unit)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mini Chart */}
                <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                  {metric.history.slice(-20).map((point, index) => {
                    const maxValue = Math.max(...metric.history.map(h => h.value))
                    const minValue = Math.min(...metric.history.map(h => h.value))
                    const heightPercent = ((point.value - minValue) / (maxValue - minValue)) * 100

                    return (
                      <div
                        key={index}
                        style={{
                          flex: 1,
                          height: `${heightPercent}%`,
                          backgroundColor: metric.trend === 'up' ? '#10b981' : metric.trend === 'down' ? '#ef4444' : '#6b7280',
                          borderRadius: '2px 2px 0 0',
                          opacity: 0.7 + (index / 20) * 0.3
                        }}
                        title={`${point.value.toFixed(0)} ${metric.unit}`}
                      />
                    )
                  })}
                </div>

                {/* Progress to Target */}
                {metric.target && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Progress to Target</span>
                      <span style={{ fontSize: '12px', fontWeight: '600' }}>
                        {((metric.value / metric.target) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div style={{
                      height: '8px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min((metric.value / metric.target) * 100, 100)}%`,
                        height: '100%',
                        backgroundColor: metric.value >= metric.target ? '#10b981' : '#3b82f6',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights Tab */}
      {activeTab === 'insights' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>
              AI-Powered Insights
            </h2>

            <div style={{ display: 'flex', gap: '12px' }}>
              <select
                style={{
                  padding: '8px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option>All Categories</option>
                <option>Performance</option>
                <option>Security</option>
                <option>Usage</option>
                <option>Revenue</option>
                <option>Anomaly</option>
              </select>

              <select
                style={{
                  padding: '8px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option>All Priorities</option>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {insights.map(insight => (
              <div
                key={insight.id}
                style={{
                  padding: '24px',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderLeft: `6px solid ${getPriorityColor(insight.priority)}`,
                  borderRadius: '12px',
                  opacity: insight.status !== 'active' ? 0.6 : 1
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {insight.title}
                      </h3>

                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: `${getPriorityColor(insight.priority)}20`,
                        color: getPriorityColor(insight.priority),
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {insight.priority}
                      </span>

                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {insight.category}
                      </span>

                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {(insight.confidence * 100).toFixed(0)}% confidence
                      </span>

                      {insight.status !== 'active' && (
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: insight.status === 'resolved' ? '#dcfce7' : '#fee2e2',
                          color: insight.status === 'resolved' ? '#166534' : '#991b1b',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {insight.status}
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: '14px', color: '#374151', marginBottom: '12px', lineHeight: '1.6' }}>
                      {insight.description}
                    </p>

                    <div style={{
                      padding: '12px',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fde047',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#92400e', marginBottom: '6px' }}>
                        💥 Impact
                      </div>
                      <div style={{ fontSize: '14px', color: '#92400e' }}>
                        {insight.impact}
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      backgroundColor: '#dbeafe',
                      border: '1px solid #93c5fd',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
                        💡 Recommendations
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {insight.recommendations.map((rec, index) => (
                          <li key={index} style={{ fontSize: '14px', color: '#1e40af', marginBottom: '4px' }}>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#9ca3af' }}>
                      <span>⏰ {new Date(insight.timestamp).toLocaleString()}</span>
                      <span>•</span>
                      <span>📊 {insight.relatedMetrics.length} related metrics</span>
                    </div>
                  </div>

                  {insight.status === 'active' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                      <button
                        onClick={() => handleResolveInsight(insight.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ✅ Mark Resolved
                      </button>

                      <button
                        onClick={() => handleDismissInsight(insight.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#f3f4f6',
                          color: '#6b7280',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ❌ Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies Tab */}
      {activeTab === 'anomalies' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>
              Anomaly Detection
            </h2>

            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🔍 Configure Detection Rules
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {anomalies.map(anomaly => (
              <div
                key={anomaly.id}
                style={{
                  padding: '24px',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderLeft: `6px solid ${getSeverityColor(anomaly.severity)}`,
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>
                        {anomaly.metric} Anomaly Detected
                      </h3>

                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: `${getSeverityColor(anomaly.severity)}20`,
                        color: getSeverityColor(anomaly.severity),
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {anomaly.severity}
                      </span>

                      <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                        ⏰ {new Date(anomaly.detectedAt).toLocaleString()}
                      </span>
                    </div>

                    <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>
                      {anomaly.description}
                    </p>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '16px',
                      marginBottom: '16px',
                      padding: '16px',
                      backgroundColor: '#f9fafb',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          Expected Value
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                          {anomaly.expectedValue.toFixed(1)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          Actual Value
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>
                          {anomaly.actualValue.toFixed(1)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                          Deviation
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>
                          +{anomaly.deviation.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                        🔍 Possible Causes:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        {anomaly.possibleCauses.map((cause, index) => (
                          <li key={index} style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                    <button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      🔧 Investigate
                    </button>

                    <button
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      📊 View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Segments Tab */}
      {activeTab === 'segments' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>
              User Segments Analysis
            </h2>

            <button
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              ➕ Create New Segment
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '20px' }}>
            {segments.map(segment => (
              <div
                key={segment.id}
                style={{
                  padding: '24px',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px'
                }}
              >
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                    {segment.name}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#6b7280' }}>
                    {segment.description}
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '16px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Size
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      {segment.size.toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Growth
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
                      +{segment.growth.toFixed(1)}%
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                      Avg Value
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
                      ${segment.avgValue}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                    Key Characteristics:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {Object.entries(segment.characteristics).map(([key, value]) => (
                      <div key={key} style={{ fontSize: '13px' }}>
                        <span style={{ color: '#6b7280' }}>{key}:</span>
                        <span style={{ fontWeight: '600', marginLeft: '6px' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>
                    Trends:
                  </div>
                  {segment.trends.map(trend => (
                    <div
                      key={trend.metric}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px',
                        marginBottom: '6px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '6px'
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>
                        {trend.metric}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>
                          {trend.value}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: trend.change > 0 ? '#10b981' : '#ef4444'
                        }}>
                          {trend.change > 0 ? '↗️' : '↘️'} {Math.abs(trend.change).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other tabs placeholder */}
      {(activeTab === 'forecasting' || activeTab === 'comparison' || activeTab === 'reports') && (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #d1d5db'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
            {activeTab === 'forecasting' && 'Forecasting & Predictions'}
            {activeTab === 'comparison' && 'Period Comparison'}
            {activeTab === 'reports' && 'Custom Reports'}
          </div>
          <div style={{ color: '#6b7280' }}>
            Advanced {activeTab} features coming soon
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedInsightsDashboard

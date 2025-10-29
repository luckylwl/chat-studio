/**
 * AI Chat Studio v5.0 - Advanced Analytics Dashboard
 *
 * Comprehensive analytics and insights platform with:
 * - Real-time monitoring and metrics
 * - User behavior tracking and segmentation
 * - Conversion funnel analysis
 * - Cohort and retention analysis
 * - A/B testing results and experiments
 * - Custom report builder
 * - Export and data visualization
 */

import React, { useState, useEffect } from 'react'

interface AdvancedAnalyticsDashboardProps {
  userId: string
}

type TabType = 'overview' | 'users' | 'funnels' | 'retention' | 'experiments' | 'reports'

interface Metric {
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
}

interface UserSegment {
  id: string
  name: string
  userCount: number
  percentage: number
  avgSessionTime: number
  conversionRate: number
}

interface FunnelStep {
  name: string
  users: number
  conversionRate: number
}

interface CohortData {
  cohort: string
  size: number
  retention: number[]
}

interface Experiment {
  id: string
  name: string
  status: 'running' | 'completed' | 'paused'
  variants: string[]
  metrics: Record<string, number>
  startDate: Date
  traffic: number
}

const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [dateRange, setDateRange] = useState('7d')
  const [realTimeUsers, setRealTimeUsers] = useState(0)

  // Mock data
  const [metrics] = useState<Metric[]>([
    { name: 'Total Users', value: 45231, change: 12.5, trend: 'up' },
    { name: 'Active Sessions', value: 1247, change: -3.2, trend: 'down' },
    { name: 'Avg Session Duration', value: 324, change: 8.1, trend: 'up' },
    { name: 'Conversion Rate', value: 3.8, change: 0.6, trend: 'up' }
  ])

  const [userSegments] = useState<UserSegment[]>([
    { id: '1', name: 'New Users', userCount: 12450, percentage: 27.5, avgSessionTime: 180, conversionRate: 2.1 },
    { id: '2', name: 'Active Users', userCount: 28930, percentage: 64.0, avgSessionTime: 420, conversionRate: 4.5 },
    { id: '3', name: 'Power Users', userCount: 3851, percentage: 8.5, avgSessionTime: 840, conversionRate: 12.3 }
  ])

  const [funnelSteps] = useState<FunnelStep[]>([
    { name: 'Landing Page', users: 10000, conversionRate: 100 },
    { name: 'Sign Up Started', users: 4200, conversionRate: 42 },
    { name: 'Form Completed', users: 2800, conversionRate: 66.7 },
    { name: 'Email Verified', users: 2450, conversionRate: 87.5 },
    { name: 'First Purchase', users: 980, conversionRate: 40 }
  ])

  const [cohorts] = useState<CohortData[]>([
    { cohort: 'Week 1', size: 1200, retention: [100, 45, 32, 28, 25, 23, 22] },
    { cohort: 'Week 2', size: 1450, retention: [100, 48, 35, 30, 27, 25, 0] },
    { cohort: 'Week 3', size: 1380, retention: [100, 52, 38, 32, 29, 0, 0] },
    { cohort: 'Week 4', size: 1620, retention: [100, 55, 41, 34, 0, 0, 0] },
    { cohort: 'Week 5', size: 1580, retention: [100, 58, 43, 0, 0, 0, 0] },
    { cohort: 'Week 6', size: 1720, retention: [100, 60, 0, 0, 0, 0, 0] },
    { cohort: 'Week 7', size: 1890, retention: [100, 0, 0, 0, 0, 0, 0] }
  ])

  const [experiments] = useState<Experiment[]>([
    {
      id: '1',
      name: 'Checkout Button Color Test',
      status: 'running',
      variants: ['Control (Blue)', 'Variant A (Green)', 'Variant B (Red)'],
      metrics: { control: 3.2, variantA: 4.1, variantB: 2.9 },
      startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      traffic: 33
    },
    {
      id: '2',
      name: 'Onboarding Flow Optimization',
      status: 'completed',
      variants: ['Control', 'Simplified Flow'],
      metrics: { control: 42, simplified: 58 },
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      traffic: 50
    }
  ])

  useEffect(() => {
    // Simulate real-time user count updates
    const interval = setInterval(() => {
      setRealTimeUsers(Math.floor(Math.random() * 200) + 1000)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280'
  }

  const getRetentionColor = (rate: number) => {
    if (rate >= 40) return '#10b981'
    if (rate >= 20) return '#f59e0b'
    return '#ef4444'
  }

  const renderOverview = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Analytics Overview</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {['24h', '7d', '30d', '90d'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              style={{
                padding: '8px 16px',
                backgroundColor: dateRange === range ? '#3b82f6' : 'white',
                color: dateRange === range ? 'white' : '#666',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Real-time Indicator */}
      <div style={{
        padding: '15px 20px',
        backgroundColor: '#f0fdf4',
        border: '1px solid #86efac',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '10px',
          height: '10px',
          backgroundColor: '#10b981',
          borderRadius: '50%',
          animation: 'pulse 2s infinite'
        }} />
        <span style={{ fontWeight: 'bold' }}>Real-time:</span>
        <span>{realTimeUsers} active users right now</span>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {metrics.map(metric => (
          <div
            key={metric.name}
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
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {metric.name.includes('Rate') || metric.name.includes('Duration')
                  ? metric.name.includes('Duration')
                    ? formatDuration(metric.value)
                    : `${metric.value}%`
                  : formatNumber(metric.value)}
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: getTrendColor(metric.trend)
              }}>
                {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                {Math.abs(metric.change)}%
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              vs previous period
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Traffic Chart */}
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0 }}>Traffic Overview</h3>
          <div style={{
            height: '250px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            backgroundColor: '#f9fafb',
            borderRadius: '6px',
            padding: '15px'
          }}>
            {Array.from({ length: 24 }).map((_, i) => {
              const height = Math.random() * 80 + 20
              return (
                <div
                  key={i}
                  style={{
                    width: '3%',
                    height: `${height}%`,
                    backgroundColor: '#3b82f6',
                    borderRadius: '2px 2px 0 0',
                    position: 'relative'
                  }}
                  title={`Hour ${i}: ${Math.floor(height * 50)} users`}
                />
              )
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#666' }}>
            Last 24 Hours
          </div>
        </div>

        {/* Top Sources */}
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0 }}>Top Traffic Sources</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { source: 'Direct', percentage: 42, color: '#3b82f6' },
              { source: 'Google Search', percentage: 28, color: '#10b981' },
              { source: 'Social Media', percentage: 18, color: '#8b5cf6' },
              { source: 'Referral', percentage: 12, color: '#f59e0b' }
            ].map(item => (
              <div key={item.source}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '14px' }}>
                  <span>{item.source}</span>
                  <span style={{ fontWeight: 'bold' }}>{item.percentage}%</span>
                </div>
                <div style={{
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>Geographic Distribution</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
          {[
            { country: 'United States', users: 18920, percentage: 41.8 },
            { country: 'United Kingdom', users: 6785, percentage: 15.0 },
            { country: 'Germany', users: 4532, percentage: 10.0 },
            { country: 'Canada', users: 3891, percentage: 8.6 },
            { country: 'France', users: 3215, percentage: 7.1 },
            { country: 'Others', users: 7888, percentage: 17.5 }
          ].map(item => (
            <div
              key={item.country}
              style={{
                padding: '15px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{item.country}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '5px' }}>
                {formatNumber(item.users)}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {item.percentage}% of total
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderUsers = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>User Behavior Analysis</h2>

      {/* User Segments */}
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>User Segments</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Segment</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Users</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Percentage</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Avg Session</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Conversion</th>
            </tr>
          </thead>
          <tbody>
            {userSegments.map(segment => (
              <tr key={segment.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', fontWeight: 'bold' }}>
                  {segment.name}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                  {formatNumber(segment.userCount)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                  {segment.percentage}%
                </td>
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                  {formatDuration(segment.avgSessionTime)}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: segment.conversionRate > 5 ? '#dcfce7' : '#fef3c7',
                    color: segment.conversionRate > 5 ? '#166534' : '#92400e',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}>
                    {segment.conversionRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Activity Heatmap */}
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Activity Heatmap (Hour of Day)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(24, 1fr)', gap: '4px' }}>
          {Array.from({ length: 24 }).map((_, hour) => {
            const intensity = Math.random()
            return (
              <div
                key={hour}
                style={{
                  aspectRatio: '1',
                  backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: intensity > 0.5 ? 'white' : '#666'
                }}
                title={`Hour ${hour}: ${Math.floor(intensity * 100)}% activity`}
              >
                {hour}
              </div>
            )
          })}
        </div>
      </div>

      {/* Device & Browser Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0 }}>Device Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { device: 'Desktop', percentage: 58, color: '#3b82f6' },
              { device: 'Mobile', percentage: 35, color: '#10b981' },
              { device: 'Tablet', percentage: 7, color: '#8b5cf6' }
            ].map(item => (
              <div key={item.device}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>{item.device}</span>
                  <span style={{ fontWeight: 'bold' }}>{item.percentage}%</span>
                </div>
                <div style={{
                  height: '12px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${item.percentage}%`,
                    backgroundColor: item.color
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginTop: 0 }}>Browser Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { browser: 'Chrome', percentage: 64, color: '#3b82f6' },
              { browser: 'Safari', percentage: 21, color: '#10b981' },
              { browser: 'Firefox', percentage: 9, color: '#f59e0b' },
              { browser: 'Edge', percentage: 6, color: '#8b5cf6' }
            ].map(item => (
              <div key={item.browser}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span>{item.browser}</span>
                  <span style={{ fontWeight: 'bold' }}>{item.percentage}%</span>
                </div>
                <div style={{
                  height: '12px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${item.percentage}%`,
                    backgroundColor: item.color
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderFunnels = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Conversion Funnel Analysis</h2>

      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Purchase Funnel</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {funnelSteps.map((step, index) => {
            const dropoff = index > 0 ? funnelSteps[index - 1].users - step.users : 0
            const dropoffRate = index > 0 ? ((dropoff / funnelSteps[index - 1].users) * 100).toFixed(1) : 0

            return (
              <div key={step.name}>
                <div style={{
                  padding: '20px',
                  backgroundColor: '#f9fafb',
                  border: '2px solid #e5e7eb',
                  borderRadius: index === 0 ? '8px 8px 0 0' : index === funnelSteps.length - 1 ? '0 0 8px 8px' : '0',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        {index + 1}. {step.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {formatNumber(step.users)} users ({step.conversionRate.toFixed(1)}% of total)
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>
                        {formatNumber(step.users)}
                      </div>
                      {index > 0 && (
                        <div style={{ fontSize: '12px', color: '#ef4444' }}>
                          -{dropoffRate}% drop-off
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    marginTop: '15px',
                    height: '8px',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${step.conversionRate}%`,
                      backgroundColor: step.conversionRate > 50 ? '#10b981' : step.conversionRate > 30 ? '#f59e0b' : '#ef4444',
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>

                {index < funnelSteps.length - 1 && (
                  <div style={{
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: '24px'
                  }}>
                    ↓
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#fef3c7',
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          <strong>Overall Conversion Rate:</strong> {((funnelSteps[funnelSteps.length - 1].users / funnelSteps[0].users) * 100).toFixed(2)}%
          ({formatNumber(funnelSteps[funnelSteps.length - 1].users)} out of {formatNumber(funnelSteps[0].users)} converted)
        </div>
      </div>
    </div>
  )

  const renderRetention = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Cohort Retention Analysis</h2>

      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflowX: 'auto'
      }}>
        <h3 style={{ marginTop: 0 }}>Weekly Cohort Retention</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e7eb', position: 'sticky', left: 0, backgroundColor: '#f9fafb' }}>
                Cohort
              </th>
              <th style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #e5e7eb' }}>Size</th>
              <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Week 0</th>
              <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Week 1</th>
              <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Week 2</th>
              <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Week 3</th>
              <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Week 4</th>
              <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Week 5</th>
              <th style={{ padding: '10px', textAlign: 'center', borderBottom: '2px solid #e5e7eb' }}>Week 6</th>
            </tr>
          </thead>
          <tbody>
            {cohorts.map(cohort => (
              <tr key={cohort.cohort}>
                <td style={{
                  padding: '10px',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #e5e7eb',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: 'white'
                }}>
                  {cohort.cohort}
                </td>
                <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                  {cohort.size}
                </td>
                {cohort.retention.map((rate, index) => (
                  <td
                    key={index}
                    style={{
                      padding: '10px',
                      textAlign: 'center',
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: rate > 0 ? `rgba(16, 185, 129, ${rate / 100})` : 'transparent',
                      color: rate > 50 ? 'white' : rate > 0 ? '#166534' : '#ccc',
                      fontWeight: 'bold'
                    }}
                  >
                    {rate > 0 ? `${rate}%` : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#dbeafe',
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          💡 <strong>Insight:</strong> Average 7-day retention rate is{' '}
          <strong>{(cohorts.reduce((sum, c) => sum + (c.retention[6] || 0), 0) / cohorts.filter(c => c.retention[6] > 0).length).toFixed(1)}%</strong>.
          Consider implementing re-engagement campaigns for users who drop off after Week 1.
        </div>
      </div>
    </div>
  )

  const renderExperiments = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>A/B Testing & Experiments</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {experiments.map(exp => (
          <div
            key={exp.id}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>{exp.name}</h3>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Started: {exp.startDate.toLocaleDateString()} | Traffic Split: {exp.traffic}%
                </div>
              </div>
              <span style={{
                padding: '6px 12px',
                backgroundColor: exp.status === 'running' ? '#dcfce7' : exp.status === 'completed' ? '#dbeafe' : '#fef3c7',
                color: exp.status === 'running' ? '#166534' : exp.status === 'completed' ? '#1e40af' : '#92400e',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {exp.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${exp.variants.length}, 1fr)`, gap: '15px' }}>
              {exp.variants.map((variant, index) => {
                const metricKey = Object.keys(exp.metrics)[index]
                const metricValue = exp.metrics[metricKey]
                const isWinner = metricValue === Math.max(...Object.values(exp.metrics))

                return (
                  <div
                    key={variant}
                    style={{
                      padding: '15px',
                      backgroundColor: isWinner ? '#f0fdf4' : '#f9fafb',
                      border: isWinner ? '2px solid #10b981' : '1px solid #e5e7eb',
                      borderRadius: '6px',
                      position: 'relative'
                    }}
                  >
                    {isWinner && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '10px',
                        padding: '4px 8px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        🏆 WINNER
                      </div>
                    )}
                    <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>{variant}</div>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '5px' }}>
                      {metricValue}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Conversion Rate
                    </div>
                  </div>
                )
              })}
            </div>

            {exp.status === 'completed' && (
              <div style={{
                marginTop: '15px',
                padding: '12px',
                backgroundColor: '#dbeafe',
                borderRadius: '6px',
                fontSize: '14px'
              }}>
                <strong>Result:</strong> {exp.variants[Object.values(exp.metrics).indexOf(Math.max(...Object.values(exp.metrics)))]} won with{' '}
                {((Math.max(...Object.values(exp.metrics)) / Math.min(...Object.values(exp.metrics)) - 1) * 100).toFixed(1)}% improvement
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        + Create New Experiment
      </button>
    </div>
  )

  const renderReports = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Custom Reports</h2>

      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Report Builder</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Report Name
            </label>
            <input
              type="text"
              placeholder="Monthly Performance Report"
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
              Report Type
            </label>
            <select style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #ddd'
            }}>
              <option>User Behavior</option>
              <option>Conversion Analysis</option>
              <option>Revenue Report</option>
              <option>Custom Metrics</option>
            </select>
          </div>
        </div>

        <button style={{
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          Generate Report
        </button>
      </div>

      {/* Saved Reports */}
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>Saved Reports</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { name: 'Weekly Performance Summary', date: '2025-10-21', format: 'PDF' },
            { name: 'User Retention Analysis', date: '2025-10-15', format: 'Excel' },
            { name: 'Revenue Attribution Report', date: '2025-10-10', format: 'PDF' }
          ].map((report, index) => (
            <div
              key={index}
              style={{
                padding: '15px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>{report.name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Generated: {report.date} | Format: {report.format}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button style={{
                  padding: '6px 12px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}>
                  View
                </button>
                <button style={{
                  padding: '6px 12px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}>
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'User Behavior' },
    { id: 'funnels', label: 'Funnels' },
    { id: 'retention', label: 'Retention' },
    { id: 'experiments', label: 'A/B Tests' },
    { id: 'reports', label: 'Reports' }
  ]

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1e293b',
        color: 'white',
        borderBottom: '3px solid #ef4444'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>📈 Advanced Analytics Dashboard</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
          Comprehensive analytics, insights, and reporting platform
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
              color: activeTab === tab.id ? '#ef4444' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #ef4444' : 'none',
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
      {activeTab === 'users' && renderUsers()}
      {activeTab === 'funnels' && renderFunnels()}
      {activeTab === 'retention' && renderRetention()}
      {activeTab === 'experiments' && renderExperiments()}
      {activeTab === 'reports' && renderReports()}
    </div>
  )
}

export default AdvancedAnalyticsDashboard

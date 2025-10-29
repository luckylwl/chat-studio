/**
 * Monitoring Dashboard Component
 *
 * Real-time monitoring and analytics dashboard
 */

import React, { useState, useEffect } from 'react'
import { realTimeMonitoringService, predictiveAnalyticsService } from '../services/analyticsMonitoringServices'
import type { MonitoringMetrics, Alert } from '../types/v4-types'

export const MonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<Record<string, number>>({
    responseTime: 0,
    errorRate: 0,
    activeUsers: 0,
    throughput: 0
  })
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      // Simulate real-time metrics
      setMetrics({
        responseTime: 50 + Math.random() * 150,
        errorRate: Math.random() * 0.05,
        activeUsers: Math.floor(100 + Math.random() * 50),
        throughput: Math.floor(500 + Math.random() * 200)
      })

      const activeAlerts = await realTimeMonitoringService.getActiveAlerts()
      setAlerts(activeAlerts)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load monitoring data:', error)
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    const colors = {
      info: '#3B82F6',
      warning: '#F59E0B',
      error: '#EF4444',
      critical: '#DC2626'
    }
    return colors[severity as keyof typeof colors] || '#6B7280'
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Monitoring Dashboard</h2>
        <div style={styles.liveIndicator}>
          <div style={styles.liveDot}></div>
          <span>Live</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>⚡</div>
          <div>
            <p style={styles.metricLabel}>Response Time</p>
            <p style={styles.metricValue}>{metrics.responseTime.toFixed(0)}ms</p>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>⚠️</div>
          <div>
            <p style={styles.metricLabel}>Error Rate</p>
            <p style={styles.metricValue}>{(metrics.errorRate * 100).toFixed(2)}%</p>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>👥</div>
          <div>
            <p style={styles.metricLabel}>Active Users</p>
            <p style={styles.metricValue}>{metrics.activeUsers}</p>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>📊</div>
          <div>
            <p style={styles.metricLabel}>Throughput</p>
            <p style={styles.metricValue}>{metrics.throughput}/min</p>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div style={styles.alertsSection}>
        <h3 style={styles.sectionTitle}>Active Alerts ({alerts.length})</h3>
        {alerts.length === 0 ? (
          <div style={styles.noAlerts}>
            ✅ All systems operational
          </div>
        ) : (
          <div style={styles.alertsList}>
            {alerts.map(alert => (
              <div
                key={alert.id}
                style={{
                  ...styles.alertCard,
                  borderLeftColor: getSeverityColor(alert.severity)
                }}
              >
                <div style={styles.alertHeader}>
                  <span style={styles.alertTitle}>{alert.title}</span>
                  <span
                    style={{
                      ...styles.severityBadge,
                      backgroundColor: getSeverityColor(alert.severity)
                    }}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p style={styles.alertMessage}>{alert.message}</p>
                <span style={styles.alertTime}>
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: 0
  },
  liveIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    background: '#DEF7EC',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#03543F'
  },
  liveDot: {
    width: '8px',
    height: '8px',
    background: '#10B981',
    borderRadius: '50%',
    animation: 'pulse 2s infinite'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  metricCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  metricIcon: {
    fontSize: '32px'
  },
  metricLabel: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 8px 0'
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
    color: '#1F2937'
  },
  alertsSection: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#1F2937'
  },
  noAlerts: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '16px',
    color: '#10B981'
  },
  alertsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  alertCard: {
    padding: '16px',
    background: '#F9FAFB',
    borderRadius: '8px',
    borderLeft: '4px solid',
    borderLeftColor: '#EF4444'
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  alertTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1F2937'
  },
  severityBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'white',
    textTransform: 'uppercase'
  },
  alertMessage: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '8px'
  },
  alertTime: {
    fontSize: '12px',
    color: '#9CA3AF'
  }
}

export default MonitoringDashboard

import React, { useState } from 'react'

// ==================== Types ====================

type SecurityLevel = 'critical' | 'high' | 'medium' | 'low'
type ComplianceStandard = 'GDPR' | 'SOC2' | 'HIPAA' | 'ISO27001' | 'PCI-DSS'
type VulnerabilityStatus = 'open' | 'investigating' | 'fixed' | 'wont-fix'
type AuditEventType = 'auth' | 'data-access' | 'config-change' | 'api-call' | 'export' | 'delete'

interface SecurityMetric {
  id: string
  name: string
  value: number
  status: 'good' | 'warning' | 'critical'
  threshold: number
  unit: string
  trend: 'improving' | 'stable' | 'degrading'
}

interface Vulnerability {
  id: string
  title: string
  description: string
  severity: SecurityLevel
  cve?: string
  affectedComponent: string
  discoveredAt: Date
  status: VulnerabilityStatus
  exploitability: number
  impact: string
  remediation: string[]
  assignedTo?: string
}

interface ComplianceCheck {
  id: string
  standard: ComplianceStandard
  requirement: string
  description: string
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-applicable'
  lastChecked: Date
  evidence: string[]
  gaps?: string[]
  remediationSteps?: string[]
}

interface AuditLog {
  id: string
  timestamp: Date
  userId: string
  userName: string
  userRole: string
  eventType: AuditEventType
  action: string
  resource: string
  ipAddress: string
  location: string
  success: boolean
  details?: Record<string, any>
}

interface AccessControl {
  id: string
  resourceType: string
  resourceName: string
  permissions: Array<{
    role: string
    actions: string[]
    granted: boolean
  }>
  inheritedFrom?: string
  lastModified: Date
  modifiedBy: string
}

interface SecurityPolicy {
  id: string
  name: string
  category: 'authentication' | 'authorization' | 'encryption' | 'data-protection' | 'network'
  description: string
  enabled: boolean
  config: Record<string, any>
  lastUpdated: Date
  enforcedSince?: Date
}

interface ThreatIntel {
  id: string
  type: 'malware' | 'phishing' | 'ddos' | 'brute-force' | 'data-breach'
  severity: SecurityLevel
  source: string
  description: string
  indicators: string[]
  detectedAt: Date
  blocked: boolean
  affectedSystems: number
}

// ==================== Mock Data ====================

const mockMetrics: SecurityMetric[] = [
  { id: 'm1', name: 'Security Score', value: 87, status: 'good', threshold: 80, unit: '/100', trend: 'improving' },
  { id: 'm2', name: 'Open Vulnerabilities', value: 3, status: 'warning', threshold: 5, unit: '', trend: 'stable' },
  { id: 'm3', name: 'Failed Login Attempts', value: 12, status: 'good', threshold: 50, unit: '/hour', trend: 'improving' },
  { id: 'm4', name: 'Compliance Rate', value: 94, status: 'good', threshold: 90, unit: '%', trend: 'stable' },
  { id: 'm5', name: 'Active Threats', value: 2, status: 'warning', threshold: 0, unit: '', trend: 'degrading' }
]

const mockVulnerabilities: Vulnerability[] = [
  {
    id: 'vuln_1',
    title: 'SQL Injection in Search Query',
    description: 'User input in search functionality is not properly sanitized, allowing potential SQL injection attacks.',
    severity: 'high',
    cve: 'CVE-2024-12345',
    affectedComponent: 'Search API v2.3',
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    status: 'investigating',
    exploitability: 75,
    impact: 'Could allow unauthorized database access and data exfiltration',
    remediation: [
      'Implement parameterized queries',
      'Add input validation and sanitization',
      'Deploy WAF rules to detect injection attempts',
      'Conduct security code review of search module'
    ],
    assignedTo: 'Security Team'
  },
  {
    id: 'vuln_2',
    title: 'Outdated Cryptographic Algorithm',
    description: 'System uses SHA-1 for password hashing instead of bcrypt or Argon2.',
    severity: 'medium',
    affectedComponent: 'Authentication Service',
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    status: 'open',
    exploitability: 45,
    impact: 'Weak password hashing increases risk of credential compromise',
    remediation: [
      'Migrate to bcrypt or Argon2 for password hashing',
      'Force password reset for all users after migration',
      'Update security documentation',
      'Implement password complexity requirements'
    ]
  },
  {
    id: 'vuln_3',
    title: 'Missing Rate Limiting on API Endpoints',
    description: 'Several API endpoints lack rate limiting, allowing potential brute force and DoS attacks.',
    severity: 'critical',
    affectedComponent: 'API Gateway',
    discoveredAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    status: 'open',
    exploitability: 90,
    impact: 'Enables brute force attacks and service disruption',
    remediation: [
      'Implement rate limiting on all public endpoints',
      'Add IP-based throttling',
      'Deploy DDoS protection',
      'Monitor for unusual traffic patterns'
    ],
    assignedTo: 'DevOps Team'
  }
]

const mockComplianceChecks: ComplianceCheck[] = [
  {
    id: 'comp_1',
    standard: 'GDPR',
    requirement: 'Article 32 - Security of Processing',
    description: 'Implement appropriate technical and organizational measures to ensure data security',
    status: 'compliant',
    lastChecked: new Date(Date.now() - 1000 * 60 * 60 * 24),
    evidence: [
      'Encryption at rest and in transit implemented',
      'Access controls and authentication enforced',
      'Regular security audits conducted',
      'Incident response plan in place'
    ]
  },
  {
    id: 'comp_2',
    standard: 'SOC2',
    requirement: 'CC6.1 - Logical and Physical Access Controls',
    description: 'Implement controls to restrict logical and physical access',
    status: 'partial',
    lastChecked: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    evidence: [
      'Role-based access control (RBAC) implemented',
      'Multi-factor authentication enabled for admins'
    ],
    gaps: [
      'MFA not enforced for all users',
      'Physical access logs need automation'
    ],
    remediationSteps: [
      'Roll out MFA to all user accounts',
      'Implement automated physical access logging',
      'Conduct quarterly access reviews'
    ]
  },
  {
    id: 'comp_3',
    standard: 'ISO27001',
    requirement: 'A.12.6.1 - Management of Technical Vulnerabilities',
    description: 'Establish a process for managing technical vulnerabilities',
    status: 'compliant',
    lastChecked: new Date(Date.now() - 1000 * 60 * 60 * 48),
    evidence: [
      'Automated vulnerability scanning in place',
      'Patch management process documented',
      'Regular penetration testing conducted',
      'Vulnerability disclosure program active'
    ]
  },
  {
    id: 'comp_4',
    standard: 'HIPAA',
    requirement: '§164.312(a)(1) - Access Control',
    description: 'Implement technical policies and procedures for electronic information systems',
    status: 'non-compliant',
    lastChecked: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    gaps: [
      'Automatic logoff after inactivity not configured',
      'Encryption not enforced on all devices',
      'Access audit trail incomplete'
    ],
    remediationSteps: [
      'Configure 15-minute auto-logoff timeout',
      'Deploy full-disk encryption on all devices',
      'Implement comprehensive audit logging',
      'Conduct HIPAA compliance training'
    ]
  }
]

const mockAuditLogs: AuditLog[] = [
  {
    id: 'audit_1',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    userId: 'user_123',
    userName: 'Alex Johnson',
    userRole: 'Admin',
    eventType: 'config-change',
    action: 'Updated security policy',
    resource: 'Authentication Settings',
    ipAddress: '192.168.1.100',
    location: 'San Francisco, US',
    success: true,
    details: { policy: 'MFA Enforcement', enabled: true }
  },
  {
    id: 'audit_2',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    userId: 'user_456',
    userName: 'Sarah Chen',
    userRole: 'User',
    eventType: 'data-access',
    action: 'Viewed sensitive data',
    resource: 'Customer Records',
    ipAddress: '10.0.0.50',
    location: 'New York, US',
    success: true
  },
  {
    id: 'audit_3',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    userId: 'unknown',
    userName: 'Unknown User',
    userRole: 'None',
    eventType: 'auth',
    action: 'Failed login attempt',
    resource: 'Login Page',
    ipAddress: '203.45.67.89',
    location: 'Unknown',
    success: false,
    details: { reason: 'Invalid credentials', attempts: 5 }
  },
  {
    id: 'audit_4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    userId: 'user_789',
    userName: 'Michael Park',
    userRole: 'Developer',
    eventType: 'export',
    action: 'Exported user data',
    resource: 'User Database',
    ipAddress: '192.168.1.150',
    location: 'Seattle, US',
    success: true,
    details: { records: 1500, format: 'CSV' }
  }
]

const mockThreats: ThreatIntel[] = [
  {
    id: 'threat_1',
    type: 'brute-force',
    severity: 'high',
    source: 'IDS Alert',
    description: 'Coordinated brute-force attack targeting admin accounts from multiple IPs',
    indicators: ['203.45.67.89', '198.51.100.42', '192.0.2.15'],
    detectedAt: new Date(Date.now() - 1000 * 60 * 30),
    blocked: true,
    affectedSystems: 0
  },
  {
    id: 'threat_2',
    type: 'phishing',
    severity: 'medium',
    source: 'Email Security Gateway',
    description: 'Phishing campaign detected targeting employee credentials',
    indicators: ['malicious-domain.com', 'spoofed sender addresses'],
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    blocked: true,
    affectedSystems: 3
  }
]

// ==================== Component ====================

const SecurityComplianceCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'vulnerabilities' | 'compliance' | 'audit' | 'access' | 'policies' | 'threats'>('dashboard')
  const [metrics] = useState<SecurityMetric[]>(mockMetrics)
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>(mockVulnerabilities)
  const [compliance] = useState<ComplianceCheck[]>(mockComplianceChecks)
  const [auditLogs] = useState<AuditLog[]>(mockAuditLogs)
  const [threats] = useState<ThreatIntel[]>(mockThreats)

  // Filter states
  const [severityFilter, setSeverityFilter] = useState<SecurityLevel | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<VulnerabilityStatus | 'all'>('all')
  const [eventTypeFilter, setEventTypeFilter] = useState<AuditEventType | 'all'>('all')

  const getSeverityColor = (severity: SecurityLevel): string => {
    const colors = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981' }
    return colors[severity]
  }

  const getStatusColor = (status: string): string => {
    const colors = {
      good: '#10b981',
      warning: '#f59e0b',
      critical: '#ef4444',
      compliant: '#10b981',
      partial: '#f59e0b',
      'non-compliant': '#ef4444',
      'not-applicable': '#6b7280'
    }
    return colors[status] || '#6b7280'
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>🔒</span>
          Security & Compliance Center
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Comprehensive security monitoring, vulnerability management, and compliance tracking
        </p>

        {/* Security Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
          {metrics.map(metric => (
            <div
              key={metric.id}
              style={{
                padding: '16px',
                backgroundColor: metric.status === 'good' ? '#dcfce7' : metric.status === 'warning' ? '#fef3c7' : '#fee2e2',
                border: `2px solid ${getStatusColor(metric.status)}`,
                borderRadius: '12px'
              }}
            >
              <div style={{ fontSize: '14px', color: '#374151', marginBottom: '8px', fontWeight: '500' }}>
                {metric.name}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>
                {metric.value}{metric.unit}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {metric.trend === 'improving' && '📈 Improving'}
                {metric.trend === 'stable' && '➡️ Stable'}
                {metric.trend === 'degrading' && '📉 Degrading'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'dashboard', label: '🎯 Dashboard' },
            { id: 'vulnerabilities', label: '🐛 Vulnerabilities', count: vulnerabilities.filter(v => v.status !== 'fixed').length },
            { id: 'compliance', label: '✅ Compliance', count: compliance.length },
            { id: 'audit', label: '📋 Audit Logs', count: auditLogs.length },
            { id: 'access', label: '🔐 Access Control' },
            { id: 'policies', label: '📜 Policies' },
            { id: 'threats', label: '🚨 Threat Intel', count: threats.length }
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
                fontWeight: activeTab === tab.id ? '600' : '400'
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

      {/* Vulnerabilities Tab */}
      {activeTab === 'vulnerabilities' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Vulnerability Management</h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                style={{ padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{ padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="fixed">Fixed</option>
                <option value="wont-fix">Won't Fix</option>
              </select>
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
                🔍 Scan Now
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {vulnerabilities
              .filter(v => (severityFilter === 'all' || v.severity === severityFilter) && (statusFilter === 'all' || v.status === statusFilter))
              .map(vuln => (
                <div
                  key={vuln.id}
                  style={{
                    padding: '24px',
                    backgroundColor: 'white',
                    border: '2px solid #e5e7eb',
                    borderLeft: `6px solid ${getSeverityColor(vuln.severity)}`,
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{vuln.title}</h3>
                        <span style={{
                          padding: '4px 12px',
                          backgroundColor: `${getSeverityColor(vuln.severity)}20`,
                          color: getSeverityColor(vuln.severity),
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textTransform: 'uppercase'
                        }}>
                          {vuln.severity}
                        </span>
                        {vuln.cve && (
                          <span style={{
                            padding: '4px 12px',
                            backgroundColor: '#f3f4f6',
                            color: '#6b7280',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            fontWeight: '500'
                          }}>
                            {vuln.cve}
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: '14px', color: '#374151', marginBottom: '12px' }}>{vuln.description}</p>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '16px',
                        marginBottom: '12px',
                        padding: '12px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px'
                      }}>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Component</div>
                          <div style={{ fontSize: '14px', fontWeight: '600' }}>{vuln.affectedComponent}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Exploitability</div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>{vuln.exploitability}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Status</div>
                          <div style={{ fontSize: '14px', fontWeight: '600', textTransform: 'capitalize' }}>{vuln.status}</div>
                        </div>
                      </div>

                      <div style={{ marginBottom: '12px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#991b1b', marginBottom: '4px' }}>💥 Impact</div>
                        <div style={{ fontSize: '14px', color: '#991b1b' }}>{vuln.impact}</div>
                      </div>

                      <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>🔧 Remediation Steps</div>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          {vuln.remediation.map((step, i) => (
                            <li key={i} style={{ fontSize: '14px', color: '#1e40af', marginBottom: '4px' }}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Compliance Status</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {compliance.map(check => (
              <div
                key={check.id}
                style={{
                  padding: '24px',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderLeft: `6px solid ${getStatusColor(check.status)}`,
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    {check.standard}
                  </span>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', flex: 1 }}>{check.requirement}</h3>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: `${getStatusColor(check.status)}20`,
                    color: getStatusColor(check.status),
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {check.status}
                  </span>
                </div>

                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>{check.description}</p>

                {check.evidence.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>✅ Evidence</div>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {check.evidence.map((item, i) => (
                        <li key={i} style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {check.gaps && check.gaps.length > 0 && (
                  <div style={{ padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#991b1b', marginBottom: '8px' }}>⚠️ Gaps Identified</div>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {check.gaps.map((gap, i) => (
                        <li key={i} style={{ fontSize: '14px', color: '#991b1b', marginBottom: '4px' }}>{gap}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {check.remediationSteps && (
                  <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>🔧 Remediation Plan</div>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      {check.remediationSteps.map((step, i) => (
                        <li key={i} style={{ fontSize: '14px', color: '#1e40af', marginBottom: '4px' }}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>
                  Last checked: {check.lastChecked.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>Audit Trail</h2>
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value as any)}
              style={{ padding: '8px 16px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}
            >
              <option value="all">All Events</option>
              <option value="auth">Authentication</option>
              <option value="data-access">Data Access</option>
              <option value="config-change">Config Changes</option>
              <option value="api-call">API Calls</option>
              <option value="export">Data Export</option>
              <option value="delete">Deletions</option>
            </select>
          </div>

          <div style={{ backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Timestamp</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Action</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Resource</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Location</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs
                  .filter(log => eventTypeFilter === 'all' || log.eventType === eventTypeFilter)
                  .map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{log.timestamp.toLocaleString()}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        <div>{log.userName}</div>
                        <div style={{ color: '#9ca3af', fontSize: '12px' }}>{log.userRole}</div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>{log.action}</td>
                      <td style={{ padding: '12px', fontSize: '13px', fontWeight: '500' }}>{log.resource}</td>
                      <td style={{ padding: '12px', fontSize: '13px' }}>
                        <div>{log.ipAddress}</div>
                        <div style={{ color: '#9ca3af', fontSize: '12px' }}>{log.location}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          backgroundColor: log.success ? '#dcfce7' : '#fee2e2',
                          color: log.success ? '#166534' : '#991b1b',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {log.success ? '✓ Success' : '✗ Failed'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Threat Intelligence Tab */}
      {activeTab === 'threats' && (
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Threat Intelligence</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {threats.map(threat => (
              <div
                key={threat.id}
                style={{
                  padding: '24px',
                  backgroundColor: 'white',
                  border: '2px solid #e5e7eb',
                  borderLeft: `6px solid ${getSeverityColor(threat.severity)}`,
                  borderRadius: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', textTransform: 'capitalize' }}>{threat.type.replace('-', ' ')}</h3>
                      <span style={{
                        padding: '4px 12px',
                        backgroundColor: threat.blocked ? '#dcfce7' : '#fee2e2',
                        color: threat.blocked ? '#166534' : '#991b1b',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                        {threat.blocked ? '🛡️ BLOCKED' : '⚠️ ACTIVE'}
                      </span>
                    </div>

                    <p style={{ fontSize: '14px', color: '#374151', marginBottom: '16px' }}>{threat.description}</p>

                    <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>🔍 Indicators</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {threat.indicators.map((indicator, i) => (
                          <span
                            key={i}
                            style={{
                              padding: '4px 8px',
                              backgroundColor: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontFamily: 'monospace'
                            }}
                          >
                            {indicator}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      Detected: {threat.detectedAt.toLocaleString()} • Affected systems: {threat.affectedSystems} • Source: {threat.source}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other tabs placeholder */}
      {(activeTab === 'dashboard' || activeTab === 'access' || activeTab === 'policies') && (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '12px',
          border: '2px dashed #d1d5db'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚧</div>
          <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '8px' }}>
            {activeTab === 'dashboard' && 'Security Dashboard'}
            {activeTab === 'access' && 'Access Control Management'}
            {activeTab === 'policies' && 'Security Policies'}
          </div>
          <div style={{ color: '#6b7280' }}>
            Advanced {activeTab} features coming soon
          </div>
        </div>
      )}
    </div>
  )
}

export default SecurityComplianceCenter

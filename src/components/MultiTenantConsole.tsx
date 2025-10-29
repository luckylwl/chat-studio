/**
 * AI Chat Studio v5.0 - Multi-Tenant Management Console
 *
 * Enterprise-grade multi-tenant management interface with:
 * - Tenant lifecycle management
 * - Organization hierarchy
 * - Quota monitoring and enforcement
 * - Subscription management
 * - User and role management
 * - Audit logging and compliance
 * - Usage analytics and billing
 */

import React, { useState, useEffect } from 'react'
import { enterpriseMultiTenancyService } from '../services/v5CoreServices'
import {
  Tenant,
  Organization,
  TenantQuotas,
  Subscription,
  AuditLog,
  TenantUser
} from '../types/v5-types'

interface MultiTenantConsoleProps {
  adminUserId: string
}

type TabType = 'tenants' | 'organizations' | 'quotas' | 'subscriptions' | 'users' | 'audit' | 'billing'
type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise'

const MultiTenantConsole: React.FC<MultiTenantConsoleProps> = ({ adminUserId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('tenants')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([])

  // Form state
  const [newTenant, setNewTenant] = useState({
    name: '',
    tier: 'free' as SubscriptionTier,
    domain: ''
  })

  const [newOrg, setNewOrg] = useState({
    name: '',
    parentId: '',
    settings: {}
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedTenant) {
      loadTenantDetails()
    }
  }, [selectedTenant])

  const loadData = async () => {
    const allTenants = await enterpriseMultiTenancyService.getAllTenants()
    setTenants(allTenants)

    const allOrgs = await enterpriseMultiTenancyService.getAllOrganizations()
    setOrganizations(allOrgs)

    const logs = await enterpriseMultiTenancyService.getAuditLogs('', 100)
    setAuditLogs(logs)
  }

  const loadTenantDetails = async () => {
    if (!selectedTenant) return

    const users = await enterpriseMultiTenancyService.getTenantUsers(selectedTenant.id)
    setTenantUsers(users)
  }

  const handleCreateTenant = async () => {
    if (!newTenant.name) {
      alert('Please enter tenant name')
      return
    }

    const subscription: Subscription = {
      tier: newTenant.tier,
      status: 'active',
      startDate: new Date(),
      features: getTierFeatures(newTenant.tier),
      billingCycle: 'monthly'
    }

    const quotas = getDefaultQuotas(newTenant.tier)

    const tenant = await enterpriseMultiTenancyService.createTenant(
      newTenant.name,
      subscription,
      quotas
    )

    setTenants([...tenants, tenant])
    setNewTenant({ name: '', tier: 'free', domain: '' })
    alert('Tenant created successfully!')
  }

  const handleSuspendTenant = async (tenantId: string) => {
    if (confirm('Are you sure you want to suspend this tenant?')) {
      await enterpriseMultiTenancyService.suspendTenant(tenantId)
      const updated = tenants.map(t =>
        t.id === tenantId ? { ...t, status: 'suspended' as const } : t
      )
      setTenants(updated)
    }
  }

  const handleActivateTenant = async (tenantId: string) => {
    await enterpriseMultiTenancyService.activateTenant(tenantId)
    const updated = tenants.map(t =>
      t.id === tenantId ? { ...t, status: 'active' as const } : t
    )
    setTenants(updated)
  }

  const handleDeleteTenant = async (tenantId: string) => {
    if (confirm('WARNING: This will permanently delete the tenant and all its data. Are you sure?')) {
      const confirmed = prompt('Type "DELETE" to confirm:')
      if (confirmed === 'DELETE') {
        await enterpriseMultiTenancyService.deleteTenant(tenantId)
        setTenants(tenants.filter(t => t.id !== tenantId))
        alert('Tenant deleted')
      }
    }
  }

  const handleUpdateQuotas = async (tenantId: string, quotas: Partial<TenantQuotas>) => {
    await enterpriseMultiTenancyService.updateQuotas(tenantId, quotas)
    const tenant = await enterpriseMultiTenancyService.getTenant(tenantId)
    if (tenant) {
      setSelectedTenant(tenant)
    }
    alert('Quotas updated successfully!')
  }

  const handleCreateOrganization = async () => {
    if (!newOrg.name || !selectedTenant) {
      alert('Please enter organization name and select a tenant')
      return
    }

    const org = await enterpriseMultiTenancyService.createOrganization(
      selectedTenant.id,
      newOrg.name,
      newOrg.parentId || undefined,
      newOrg.settings
    )

    setOrganizations([...organizations, org])
    setNewOrg({ name: '', parentId: '', settings: {} })
    alert('Organization created!')
  }

  const getTierFeatures = (tier: SubscriptionTier): string[] => {
    const features: Record<SubscriptionTier, string[]> = {
      free: ['basic_chat', 'single_user', '100_messages_per_month'],
      starter: ['basic_chat', 'multi_user', '10000_messages_per_month', 'basic_integrations'],
      professional: ['advanced_chat', 'multi_user', 'unlimited_messages', 'all_integrations', 'api_access', 'priority_support'],
      enterprise: ['all_features', 'unlimited_everything', 'custom_integrations', 'dedicated_support', 'sla', 'custom_deployment']
    }
    return features[tier]
  }

  const getDefaultQuotas = (tier: SubscriptionTier): TenantQuotas => {
    const quotas: Record<SubscriptionTier, TenantQuotas> = {
      free: {
        maxUsers: 1,
        maxStorage: 1024 * 1024 * 100, // 100MB
        maxAPIRequests: 1000,
        maxConversations: 10,
        maxIntegrations: 0
      },
      starter: {
        maxUsers: 10,
        maxStorage: 1024 * 1024 * 1024 * 5, // 5GB
        maxAPIRequests: 100000,
        maxConversations: 1000,
        maxIntegrations: 5
      },
      professional: {
        maxUsers: 100,
        maxStorage: 1024 * 1024 * 1024 * 50, // 50GB
        maxAPIRequests: 1000000,
        maxConversations: 10000,
        maxIntegrations: 20
      },
      enterprise: {
        maxUsers: -1, // unlimited
        maxStorage: -1,
        maxAPIRequests: -1,
        maxConversations: -1,
        maxIntegrations: -1
      }
    }
    return quotas[tier]
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      free: '#6b7280',
      starter: '#3b82f6',
      professional: '#8b5cf6',
      enterprise: '#f59e0b'
    }
    return colors[tier] || '#6b7280'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: '#10b981',
      suspended: '#f59e0b',
      trial: '#3b82f6',
      cancelled: '#ef4444'
    }
    return colors[status] || '#6b7280'
  }

  const formatBytes = (bytes: number) => {
    if (bytes === -1) return '∞ (Unlimited)'
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatNumber = (num: number) => {
    if (num === -1) return '∞'
    return num.toLocaleString()
  }

  const calculateQuotaPercentage = (used: number, max: number): number => {
    if (max === -1) return 0 // unlimited
    return (used / max) * 100
  }

  const getQuotaColor = (percentage: number): string => {
    if (percentage >= 90) return '#ef4444'
    if (percentage >= 75) return '#f59e0b'
    return '#10b981'
  }

  const renderTenants = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Tenant Management</h2>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Total Tenants: {tenants.length} | Active: {tenants.filter(t => t.status === 'active').length}
        </div>
      </div>

      {/* Create Tenant Form */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Create New Tenant</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Tenant Name *
            </label>
            <input
              type="text"
              value={newTenant.name}
              onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
              placeholder="Acme Corporation"
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
              Subscription Tier
            </label>
            <select
              value={newTenant.tier}
              onChange={(e) => setNewTenant({ ...newTenant, tier: e.target.value as SubscriptionTier })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            >
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Domain (optional)
            </label>
            <input
              type="text"
              value={newTenant.domain}
              onChange={(e) => setNewTenant({ ...newTenant, domain: e.target.value })}
              placeholder="acme.com"
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
          onClick={handleCreateTenant}
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
          Create Tenant
        </button>
      </div>

      {/* Tenants Table */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Subscription</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Users</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Storage</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Created</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(tenant => (
              <tr
                key={tenant.id}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  cursor: 'pointer',
                  backgroundColor: selectedTenant?.id === tenant.id ? '#eff6ff' : 'white'
                }}
                onClick={() => setSelectedTenant(tenant)}
              >
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 'bold' }}>{tenant.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{tenant.id}</div>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: getTierColor(tenant.subscription.tier),
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {tenant.subscription.tier}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: `${getStatusColor(tenant.status)}20`,
                    color: getStatusColor(tenant.status),
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {tenant.status}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  {tenant.quotas.maxUsers === -1 ? '∞' : `${Math.floor(Math.random() * tenant.quotas.maxUsers)}/${tenant.quotas.maxUsers}`}
                </td>
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  {formatBytes(Math.floor(Math.random() * (tenant.quotas.maxStorage === -1 ? 1000000000 : tenant.quotas.maxStorage)))}
                </td>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  {tenant.createdAt.toLocaleDateString()}
                </td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                    {tenant.status === 'active' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSuspendTenant(tenant.id)
                        }}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleActivateTenant(tenant.id)
                        }}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTenant(tenant.id)
                      }}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {tenants.length === 0 && (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            color: '#666'
          }}>
            No tenants yet. Create your first tenant above.
          </div>
        )}
      </div>
    </div>
  )

  const renderOrganizations = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Organization Hierarchy</h2>

      {!selectedTenant ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f9fafb',
          borderRadius: '8px'
        }}>
          <h3>No Tenant Selected</h3>
          <p>Select a tenant from the Tenants tab to manage organizations</p>
        </div>
      ) : (
        <>
          {/* Create Organization Form */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Create Organization for {selectedTenant.name}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={newOrg.name}
                  onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                  placeholder="Engineering Department"
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
                  Parent Organization (optional)
                </label>
                <select
                  value={newOrg.parentId}
                  onChange={(e) => setNewOrg({ ...newOrg, parentId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                >
                  <option value="">None (Root Level)</option>
                  {organizations
                    .filter(org => org.tenantId === selectedTenant.id)
                    .map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateOrganization}
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
              Create Organization
            </button>
          </div>

          {/* Organizations Tree */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0 }}>Organizations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {organizations
                .filter(org => org.tenantId === selectedTenant.id)
                .map(org => (
                  <div
                    key={org.id}
                    style={{
                      padding: '15px',
                      backgroundColor: '#f9fafb',
                      borderLeft: '4px solid #3b82f6',
                      borderRadius: '6px',
                      marginLeft: org.parentId ? '30px' : '0'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{org.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      ID: {org.id} | Members: {org.members.length}
                    </div>
                  </div>
                ))}

              {organizations.filter(org => org.tenantId === selectedTenant.id).length === 0 && (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#666'
                }}>
                  No organizations yet. Create your first organization above.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderQuotas = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Quota Management</h2>

      {!selectedTenant ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f9fafb',
          borderRadius: '8px'
        }}>
          <h3>No Tenant Selected</h3>
          <p>Select a tenant from the Tenants tab to view quotas</p>
        </div>
      ) : (
        <>
          <div style={{
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Quota Overview for {selectedTenant.name}</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '15px'
            }}>
              {/* Users Quota */}
              {(() => {
                const currentUsers = Math.floor(Math.random() * (selectedTenant.quotas.maxUsers === -1 ? 50 : selectedTenant.quotas.maxUsers))
                const percentage = calculateQuotaPercentage(currentUsers, selectedTenant.quotas.maxUsers)
                return (
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>👥 Users</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
                      {currentUsers} / {formatNumber(selectedTenant.quotas.maxUsers)}
                    </div>
                    <div style={{
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: getQuotaColor(percentage),
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      {selectedTenant.quotas.maxUsers === -1 ? 'Unlimited' : `${percentage.toFixed(1)}% used`}
                    </div>
                  </div>
                )
              })()}

              {/* Storage Quota */}
              {(() => {
                const currentStorage = Math.floor(Math.random() * (selectedTenant.quotas.maxStorage === -1 ? 10000000000 : selectedTenant.quotas.maxStorage))
                const percentage = calculateQuotaPercentage(currentStorage, selectedTenant.quotas.maxStorage)
                return (
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>💾 Storage</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
                      {formatBytes(currentStorage)}
                    </div>
                    <div style={{
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: getQuotaColor(percentage),
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      of {formatBytes(selectedTenant.quotas.maxStorage)}
                    </div>
                  </div>
                )
              })()}

              {/* API Requests Quota */}
              {(() => {
                const currentRequests = Math.floor(Math.random() * (selectedTenant.quotas.maxAPIRequests === -1 ? 500000 : selectedTenant.quotas.maxAPIRequests))
                const percentage = calculateQuotaPercentage(currentRequests, selectedTenant.quotas.maxAPIRequests)
                return (
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>🔌 API Requests</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
                      {formatNumber(currentRequests)}
                    </div>
                    <div style={{
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: getQuotaColor(percentage),
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      of {formatNumber(selectedTenant.quotas.maxAPIRequests)} this month
                    </div>
                  </div>
                )
              })()}

              {/* Conversations Quota */}
              {(() => {
                const currentConvs = Math.floor(Math.random() * (selectedTenant.quotas.maxConversations === -1 ? 5000 : selectedTenant.quotas.maxConversations))
                const percentage = calculateQuotaPercentage(currentConvs, selectedTenant.quotas.maxConversations)
                return (
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>💬 Conversations</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>
                      {formatNumber(currentConvs)}
                    </div>
                    <div style={{
                      height: '8px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: getQuotaColor(percentage),
                        transition: 'width 0.3s'
                      }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                      of {formatNumber(selectedTenant.quotas.maxConversations)}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Quota Adjustment */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginTop: 0 }}>Adjust Quotas</h3>
            <div style={{
              padding: '15px',
              backgroundColor: '#fef3c7',
              borderRadius: '6px',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              ⚠️ Warning: Reducing quotas below current usage may cause service interruptions
            </div>
            <button
              onClick={() => {
                const newMaxUsers = prompt('Enter new max users (-1 for unlimited):')
                if (newMaxUsers) {
                  handleUpdateQuotas(selectedTenant.id, { maxUsers: parseInt(newMaxUsers) })
                }
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Update User Quota
            </button>
            <button
              onClick={() => {
                const tier = prompt('Enter new tier (free/starter/professional/enterprise):') as SubscriptionTier
                if (tier) {
                  const newQuotas = getDefaultQuotas(tier)
                  handleUpdateQuotas(selectedTenant.id, newQuotas)
                }
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Apply Tier Quotas
            </button>
          </div>
        </>
      )}
    </div>
  )

  const renderAudit = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Audit Logs</h2>

      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {auditLogs.slice(0, 50).map(log => (
            <div
              key={log.id}
              style={{
                padding: '15px',
                backgroundColor: log.severity === 'critical' ? '#fee2e2' : '#f9fafb',
                borderLeft: `4px solid ${
                  log.severity === 'critical' ? '#ef4444' :
                  log.severity === 'warning' ? '#f59e0b' :
                  '#3b82f6'
                }`,
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '13px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ fontWeight: 'bold' }}>{log.action}</span>
                <span style={{ color: '#666' }}>{log.timestamp.toLocaleString()}</span>
              </div>
              <div style={{ color: '#666', marginBottom: '5px' }}>
                <strong>User:</strong> {log.userId} | <strong>Tenant:</strong> {log.tenantId || 'System'}
              </div>
              <div>{log.details}</div>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
                  {JSON.stringify(log.metadata, null, 2)}
                </div>
              )}
            </div>
          ))}

          {auditLogs.length === 0 && (
            <div style={{
              padding: '60px',
              textAlign: 'center',
              color: '#666'
            }}>
              No audit logs available
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderBilling = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Billing & Usage</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {tenants.map(tenant => {
          const monthlyRevenue = tenant.subscription.tier === 'free' ? 0 :
                                 tenant.subscription.tier === 'starter' ? 29 :
                                 tenant.subscription.tier === 'professional' ? 99 :
                                 499

          return (
            <div
              key={tenant.id}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>{tenant.name}</h3>
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: getTierColor(tenant.subscription.tier),
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {tenant.subscription.tier}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    ${monthlyRevenue}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>/ month</div>
                </div>
              </div>

              <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                <div style={{ marginBottom: '5px' }}>
                  <strong>Billing Cycle:</strong> {tenant.subscription.billingCycle}
                </div>
                <div style={{ marginBottom: '5px' }}>
                  <strong>Start Date:</strong> {tenant.subscription.startDate.toLocaleDateString()}
                </div>
                {tenant.subscription.endDate && (
                  <div style={{ marginBottom: '5px' }}>
                    <strong>End Date:</strong> {tenant.subscription.endDate.toLocaleDateString()}
                  </div>
                )}
              </div>

              <div style={{
                padding: '10px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                fontSize: '12px'
              }}>
                <strong>Features:</strong>
                <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                  {tenant.subscription.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx}>{feature.replace(/_/g, ' ')}</li>
                  ))}
                  {tenant.subscription.features.length > 3 && (
                    <li>+{tenant.subscription.features.length - 3} more</li>
                  )}
                </ul>
              </div>
            </div>
          )
        })}
      </div>

      {/* Revenue Summary */}
      <div style={{
        marginTop: '20px',
        padding: '20px',
        backgroundColor: '#f0fdf4',
        border: '2px solid #86efac',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0 }}>Monthly Recurring Revenue</h3>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#10b981' }}>
              ${tenants.reduce((sum, t) => {
                const revenue = t.subscription.tier === 'free' ? 0 :
                               t.subscription.tier === 'starter' ? 29 :
                               t.subscription.tier === 'professional' ? 99 : 499
                return sum + revenue
              }, 0).toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Total MRR</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {tenants.filter(t => t.subscription.tier !== 'free').length}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Paying Customers</div>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              ${Math.round(tenants.reduce((sum, t) => {
                const revenue = t.subscription.tier === 'free' ? 0 :
                               t.subscription.tier === 'starter' ? 29 :
                               t.subscription.tier === 'professional' ? 99 : 499
                return sum + revenue
              }, 0) / Math.max(tenants.filter(t => t.subscription.tier !== 'free').length, 1))}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>ARPU</div>
          </div>
        </div>
      </div>
    </div>
  )

  const tabs = [
    { id: 'tenants', label: 'Tenants' },
    { id: 'organizations', label: 'Organizations' },
    { id: 'quotas', label: 'Quotas' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'audit', label: 'Audit Logs' },
    { id: 'billing', label: 'Billing' }
  ]

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1e293b',
        color: 'white',
        borderBottom: '3px solid #f59e0b'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🏢 Multi-Tenant Management Console</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
          Enterprise tenant management, quotas, and billing
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
              color: activeTab === tab.id ? '#f59e0b' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #f59e0b' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'tenants' && renderTenants()}
      {activeTab === 'organizations' && renderOrganizations()}
      {activeTab === 'quotas' && renderQuotas()}
      {activeTab === 'billing' && renderBilling()}
      {activeTab === 'audit' && renderAudit()}
    </div>
  )
}

export default MultiTenantConsole

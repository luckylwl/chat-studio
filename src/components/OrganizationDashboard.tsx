import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Modal,
  Input,
  Select,
  Switch,
  Textarea
} from '@/components/ui'
import organizationService, {
  Organization,
  OrganizationUser,
  OrganizationRole,
  Invitation,
  OrganizationAuditLog,
  UsageReport
} from '@/services/organizationService'
import {
  BuildingOfficeIcon,
  UsersIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  ChartBarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XMarkIcon,
  EnvelopeIcon,
  CogIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  BanknotesIcon,
  KeyIcon,
  GlobeAltIcon,
  UserGroupIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

const OrganizationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null)
  const [orgUsers, setOrgUsers] = useState<OrganizationUser[]>([])
  const [roles, setRoles] = useState<OrganizationRole[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [auditLogs, setAuditLogs] = useState<OrganizationAuditLog[]>([])
  const [usageReport, setUsageReport] = useState<UsageReport | null>(null)
  const [loading, setLoading] = useState(false)

  // Modal states
  const [showCreateOrgModal, setShowCreateOrgModal] = useState(false)
  const [showEditOrgModal, setShowEditOrgModal] = useState(false)
  const [showInviteUserModal, setShowInviteUserModal] = useState(false)
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false)
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false)
  const [showBillingModal, setShowBillingModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<OrganizationUser | null>(null)

  // Form states
  const [orgForm, setOrgForm] = useState<Partial<Organization>>({
    name: '',
    displayName: '',
    description: '',
    industry: '',
    size: 'small',
    type: 'root',
    status: 'active'
  })
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'user'
  })
  const [roleForm, setRoleForm] = useState({
    name: '',
    displayName: '',
    description: '',
    permissions: [] as string[]
  })

  const tabs = [
    { id: 'overview', name: '概览', icon: <BuildingOfficeIcon className="h-5 w-5" /> },
    { id: 'users', name: '用户管理', icon: <UsersIcon className="h-5 w-5" /> },
    { id: 'roles', name: '角色权限', icon: <ShieldCheckIcon className="h-5 w-5" /> },
    { id: 'billing', name: '账单管理', icon: <CreditCardIcon className="h-5 w-5" /> },
    { id: 'usage', name: '使用分析', icon: <ChartBarIcon className="h-5 w-5" /> },
    { id: 'audit', name: '审计日志', icon: <DocumentTextIcon className="h-5 w-5" /> }
  ]

  const industryOptions = [
    { value: 'technology', label: '科技' },
    { value: 'finance', label: '金融' },
    { value: 'healthcare', label: '医疗' },
    { value: 'education', label: '教育' },
    { value: 'retail', label: '零售' },
    { value: 'manufacturing', label: '制造业' },
    { value: 'consulting', label: '咨询' },
    { value: 'other', label: '其他' }
  ]

  const sizeOptions = [
    { value: 'startup', label: '初创公司 (1-10人)' },
    { value: 'small', label: '小型企业 (11-50人)' },
    { value: 'medium', label: '中型企业 (51-200人)' },
    { value: 'large', label: '大型企业 (201-1000人)' },
    { value: 'enterprise', label: '超大企业 (1000+人)' }
  ]

  useEffect(() => {
    loadData()

    // Listen for service events
    const handleOrgCreated = (org: Organization) => {
      setOrganizations(prev => [org, ...prev])
      toast.success('组织创建成功')
    }

    const handleOrgUpdated = (org: Organization) => {
      setOrganizations(prev => prev.map(o => o.id === org.id ? org : o))
      if (currentOrg?.id === org.id) {
        setCurrentOrg(org)
      }
      toast.success('组织更新成功')
    }

    const handleUserAdded = ({ organizationId, user }: { organizationId: string; user: OrganizationUser }) => {
      if (currentOrg?.id === organizationId) {
        setOrgUsers(prev => [user, ...prev])
      }
      toast.success('用户添加成功')
    }

    organizationService.on('organizationCreated', handleOrgCreated)
    organizationService.on('organizationUpdated', handleOrgUpdated)
    organizationService.on('userAddedToOrganization', handleUserAdded)

    return () => {
      organizationService.off('organizationCreated', handleOrgCreated)
      organizationService.off('organizationUpdated', handleOrgUpdated)
      organizationService.off('userAddedToOrganization', handleUserAdded)
    }
  }, [currentOrg])

  const loadData = async () => {
    setLoading(true)
    try {
      const orgsData = await organizationService.getOrganizations()
      setOrganizations(orgsData)

      if (orgsData.length > 0 && !currentOrg) {
        const firstOrg = orgsData[0]
        setCurrentOrg(firstOrg)
        organizationService.setCurrentOrganization(firstOrg.id)
        await loadOrganizationData(firstOrg.id)
      } else if (currentOrg) {
        await loadOrganizationData(currentOrg.id)
      }
    } catch (error) {
      console.error('Failed to load organization data:', error)
      toast.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const loadOrganizationData = async (orgId: string) => {
    try {
      const [usersData, rolesData, invitationsData, auditData] = await Promise.all([
        organizationService.getOrganizationUsers(orgId),
        organizationService.getRoles(orgId),
        organizationService.getInvitations(orgId),
        organizationService.getAuditLogs(orgId, 50)
      ])

      setOrgUsers(usersData)
      setRoles(rolesData)
      setInvitations(invitationsData)
      setAuditLogs(auditData)

      // Generate usage report for last 30 days
      const endDate = Date.now()
      const startDate = endDate - 30 * 24 * 60 * 60 * 1000
      const report = await organizationService.generateUsageReport(orgId, startDate, endDate)
      setUsageReport(report)
    } catch (error) {
      console.error('Failed to load organization data:', error)
    }
  }

  const handleCreateOrganization = async () => {
    if (!orgForm.name || !orgForm.displayName) {
      toast.error('请填写组织名称')
      return
    }

    setLoading(true)
    try {
      await organizationService.createOrganization({
        name: orgForm.name!,
        displayName: orgForm.displayName!,
        description: orgForm.description || '',
        industry: orgForm.industry || 'other',
        size: orgForm.size as any || 'small',
        type: orgForm.type as any || 'root',
        status: 'active',
        settings: {
          branding: {
            primaryColor: '#3B82F6',
            secondaryColor: '#10B981'
          },
          security: {
            passwordPolicy: {
              minLength: 8,
              requireUppercase: true,
              requireLowercase: true,
              requireNumbers: true,
              requireSymbols: false,
              preventReuse: 5,
              maxAge: 90
            },
            twoFactorRequired: false,
            sessionTimeout: 3600,
            ipWhitelist: [],
            allowedDomains: [],
            dataRetention: 365
          },
          features: {
            enabledFeatures: ['conversations', 'templates', 'search'],
            modelAccess: ['gpt-4', 'gpt-3.5-turbo'],
            maxUsers: 50,
            maxConversations: 1000,
            maxTokensPerMonth: 100000,
            storageLimit: 10 * 1024 * 1024 * 1024 // 10GB
          },
          integrations: {
            ssoEnabled: false,
            webhookUrl: '',
            slackIntegration: false,
            teamsIntegration: false
          }
        },
        subscription: {
          plan: 'starter',
          status: 'active',
          billingCycle: 'monthly',
          currentPeriodStart: Date.now(),
          currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
          cancelAtPeriodEnd: false,
          pricePerUser: 10,
          includedTokens: 100000,
          includedUsers: 10,
          overage: {
            tokensUsed: 0,
            usersActive: 0,
            additionalCost: 0
          }
        },
        billing: {
          customerId: `cus_${Date.now()}`,
          paymentMethod: {
            id: 'pm_default',
            type: 'card',
            isDefault: true
          },
          address: {
            line1: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'CN'
          },
          invoices: [],
          totalSpent: 0,
          nextBillingDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
          autoPayEnabled: true
        }
      })

      setShowCreateOrgModal(false)
      resetOrgForm()
      await loadData()
    } catch (error) {
      console.error('Failed to create organization:', error)
      toast.error('创建组织失败')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteForm.email || !currentOrg) {
      toast.error('请填写邮箱地址')
      return
    }

    setLoading(true)
    try {
      await organizationService.inviteUser(currentOrg.id, inviteForm.email, inviteForm.role)
      setShowInviteUserModal(false)
      setInviteForm({ email: '', role: 'user' })
      await loadOrganizationData(currentOrg.id)
    } catch (error) {
      console.error('Failed to invite user:', error)
      toast.error('邀请用户失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    if (!currentOrg) return

    setLoading(true)
    try {
      await organizationService.updateUserRole(currentOrg.id, userId, newRole)
      await loadOrganizationData(currentOrg.id)
    } catch (error) {
      console.error('Failed to update user role:', error)
      toast.error('更新用户角色失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (!currentOrg || !confirm('确定要移除此用户吗？')) return

    setLoading(true)
    try {
      await organizationService.removeUserFromOrganization(currentOrg.id, userId)
      await loadOrganizationData(currentOrg.id)
    } catch (error) {
      console.error('Failed to remove user:', error)
      toast.error('移除用户失败')
    } finally {
      setLoading(false)
    }
  }

  const resetOrgForm = () => {
    setOrgForm({
      name: '',
      displayName: '',
      description: '',
      industry: '',
      size: 'small',
      type: 'root',
      status: 'active'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'owner':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'user':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading && !organizations.length) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
          <p className="text-gray-500 dark:text-gray-400">加载组织数据...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            组织管理
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            管理多租户组织架构、用户权限和资源配置
          </p>
        </div>
        <div className="flex gap-2">
          {currentOrg && (
            <Select
              options={organizations.map(org => ({ value: org.id, label: org.displayName }))}
              value={currentOrg.id}
              onChange={(value) => {
                const org = organizations.find(o => o.id === value)
                if (org) {
                  setCurrentOrg(org)
                  organizationService.setCurrentOrganization(org.id)
                  loadOrganizationData(org.id)
                }
              }}
              placeholder="选择组织"
            />
          )}
          <Button
            onClick={() => setShowCreateOrgModal(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            新建组织
          </Button>
        </div>
      </div>

      {/* Current Organization Info */}
      {currentOrg && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <BuildingOfficeIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {currentOrg.displayName}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{currentOrg.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(currentOrg.status)}>
                  {currentOrg.status === 'active' ? '活跃' :
                   currentOrg.status === 'inactive' ? '非活跃' :
                   currentOrg.status === 'suspended' ? '已暂停' : '待审核'}
                </Badge>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentOrg.metadata.userCount} 用户
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentOrg.subscription.plan} 套餐
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!currentOrg && organizations.length === 0 && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            暂无组织
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            创建您的第一个组织来开始使用
          </p>
          <Button onClick={() => setShowCreateOrgModal(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            创建组织
          </Button>
        </div>
      )}

      {currentOrg && (
        <>
          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">总用户数</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {currentOrg.metadata.userCount}
                      </p>
                    </div>
                    <UsersIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    活跃用户: {currentOrg.metadata.activeUsers}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">对话总数</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {currentOrg.metadata.conversationCount.toLocaleString()}
                      </p>
                    </div>
                    <ChartBarIcon className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Token使用</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {(currentOrg.metadata.tokensUsed / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <BanknotesIcon className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    本月限额: {(currentOrg.subscription.includedTokens / 1000).toFixed(0)}K
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">存储使用</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {(currentOrg.metadata.storageUsed / (1024 * 1024)).toFixed(1)}MB
                      </p>
                    </div>
                    <GlobeAltIcon className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  用户管理 ({orgUsers.length})
                </h3>
                <Button
                  onClick={() => setShowInviteUserModal(true)}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                >
                  <UserPlusIcon className="h-4 w-4 mr-2" />
                  邀请用户
                </Button>
              </div>

              {/* Active Users */}
              <Card>
                <CardHeader>
                  <CardTitle>活跃用户</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orgUsers.filter(u => u.status === 'active').map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getRoleColor(user.role.name)}>
                            {user.role.displayName}
                          </Badge>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              对话: {user.metadata.conversationsCount}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Tokens: {user.metadata.tokensUsed.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowUserDetailsModal(true)
                              }}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Select
                              options={roles.map(role => ({ value: role.name, label: role.displayName }))}
                              value={user.role.name}
                              onChange={(value) => handleUpdateUserRole(user.userId, value)}
                              className="w-32"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveUser(user.userId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Pending Invitations */}
              {invitations.filter(i => i.status === 'pending').length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>待接受邀请</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {invitations.filter(i => i.status === 'pending').map((invitation) => (
                        <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                          <div className="flex items-center gap-3">
                            <EnvelopeIcon className="h-5 w-5 text-yellow-500" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{invitation.email}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                邀请角色: {roles.find(r => r.name === invitation.role)?.displayName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(invitation.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              过期: {new Date(invitation.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  角色权限管理
                </h3>
                <Button
                  onClick={() => setShowCreateRoleModal(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  创建角色
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {roles.map((role) => (
                  <Card key={role.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <ShieldCheckIcon className="h-5 w-5" />
                            {role.displayName}
                          </CardTitle>
                          <CardDescription>{role.description}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={role.type === 'system' ? 'default' : 'secondary'}>
                            {role.type === 'system' ? '系统' : '自定义'}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            等级 {role.level}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            权限 ({role.permissions.length})
                          </p>
                          <div className="grid grid-cols-2 gap-1">
                            {role.permissions.slice(0, 6).map((permission) => (
                              <div key={permission.id} className="text-xs text-gray-600 dark:text-gray-400">
                                • {permission.displayName}
                              </div>
                            ))}
                            {role.permissions.length > 6 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                +{role.permissions.length - 6} 更多...
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            用户数: {orgUsers.filter(u => u.role.id === role.id).length}
                          </span>
                          {role.type === 'custom' && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline">
                                <PencilIcon className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600">
                                <TrashIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Billing Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">当前套餐</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">
                          {currentOrg.subscription.plan}
                        </p>
                      </div>
                      <CreditCardIcon className="h-8 w-8 text-blue-500" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      ¥{currentOrg.subscription.pricePerUser}/用户/月
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">本月费用</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          ¥{(currentOrg.subscription.pricePerUser * currentOrg.metadata.userCount + currentOrg.subscription.overage.additionalCost).toFixed(2)}
                        </p>
                      </div>
                      <BanknotesIcon className="h-8 w-8 text-green-500" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      超额费用: ¥{currentOrg.subscription.overage.additionalCost.toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">下次账单</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {new Date(currentOrg.billing.nextBillingDate).getDate()}日
                        </p>
                      </div>
                      <CalendarIcon className="h-8 w-8 text-purple-500" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(currentOrg.billing.nextBillingDate).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>使用情况</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>用户数量</span>
                          <span>{currentOrg.metadata.userCount} / {currentOrg.subscription.includedUsers}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (currentOrg.metadata.userCount / currentOrg.subscription.includedUsers) * 100)}%`
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Token使用</span>
                          <span>{currentOrg.metadata.tokensUsed.toLocaleString()} / {currentOrg.subscription.includedTokens.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (currentOrg.metadata.tokensUsed / currentOrg.subscription.includedTokens) * 100)}%`
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>存储空间</span>
                          <span>{(currentOrg.metadata.storageUsed / (1024 * 1024)).toFixed(1)}MB / {(currentOrg.settings.features.storageLimit / (1024 * 1024 * 1024)).toFixed(0)}GB</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, (currentOrg.metadata.storageUsed / currentOrg.settings.features.storageLimit) * 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>最近账单</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentOrg.billing.invoices.slice(0, 5).map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">#{invoice.number}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-gray-100">¥{invoice.amount.toFixed(2)}</p>
                            <Badge className={
                              invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                              invoice.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {invoice.status === 'paid' ? '已支付' :
                               invoice.status === 'open' ? '待支付' : '其他'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {currentOrg.billing.invoices.length === 0 && (
                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                          暂无账单记录
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && usageReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">用户增长</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          +{usageReport.metrics.users.new}
                        </p>
                      </div>
                      <div className="flex items-center text-green-600">
                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">
                          +{(usageReport.trends.userGrowth * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">使用增长</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          +{usageReport.metrics.conversations.new}
                        </p>
                      </div>
                      <div className="flex items-center text-green-600">
                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">
                          +{(usageReport.trends.usageGrowth * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">参与度</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {(usageReport.trends.engagement * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="flex items-center text-blue-600">
                        <StarIcon className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">优秀</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>功能使用统计</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(usageReport.metrics.features).map(([feature, stats]) => (
                        <div key={feature} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 capitalize">{feature}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{stats.users} 用户使用</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{stats.usage}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">次使用</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Token使用分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(usageReport.metrics.tokens.byModel).map(([model, tokens]) => (
                        <div key={model} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{model}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {((tokens / usageReport.metrics.tokens.total) * 100).toFixed(1)}% 占比
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {tokens.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">tokens</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Audit Tab */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>审计日志</CardTitle>
                  <CardDescription>组织内的所有重要操作记录</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-shrink-0">
                          <Badge className={getSeverityColor(log.severity)}>
                            {log.severity === 'critical' ? '严重' :
                             log.severity === 'high' ? '高' :
                             log.severity === 'medium' ? '中' : '低'}
                          </Badge>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {log.action.replace('_', ' ')}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            资源: {log.resource}
                            {log.resourceId && ` (${log.resourceId.slice(-8)})`}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            用户: {log.userId} • IP: {log.ip}
                          </p>
                        </div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        暂无审计日志
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Create Organization Modal */}
      <Modal
        open={showCreateOrgModal}
        onClose={() => setShowCreateOrgModal(false)}
        title="创建新组织"
        description="设置组织基本信息和配置"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                组织标识 *
              </label>
              <Input
                value={orgForm.name || ''}
                onChange={(e) => setOrgForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如: my-company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                显示名称 *
              </label>
              <Input
                value={orgForm.displayName || ''}
                onChange={(e) => setOrgForm(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="例如: 我的公司"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              描述
            </label>
            <Textarea
              value={orgForm.description || ''}
              onChange={(e) => setOrgForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="简要描述组织"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                行业
              </label>
              <Select
                options={industryOptions}
                value={orgForm.industry || ''}
                onChange={(value) => setOrgForm(prev => ({ ...prev, industry: value }))}
                placeholder="选择行业"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                组织规模
              </label>
              <Select
                options={sizeOptions}
                value={orgForm.size || ''}
                onChange={(value) => setOrgForm(prev => ({ ...prev, size: value as any }))}
                placeholder="选择规模"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCreateOrgModal(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateOrganization}
              disabled={!orgForm.name || !orgForm.displayName || loading}
            >
              {loading ? '创建中...' : '创建组织'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        open={showInviteUserModal}
        onClose={() => setShowInviteUserModal(false)}
        title="邀请用户"
        description="邀请新用户加入组织"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              邮箱地址 *
            </label>
            <Input
              type="email"
              value={inviteForm.email}
              onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              分配角色
            </label>
            <Select
              options={roles.map(role => ({ value: role.name, label: role.displayName }))}
              value={inviteForm.role}
              onChange={(value) => setInviteForm(prev => ({ ...prev, role: value }))}
              placeholder="选择角色"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowInviteUserModal(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleInviteUser}
              disabled={!inviteForm.email || loading}
            >
              {loading ? '发送中...' : '发送邀请'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* User Details Modal */}
      <Modal
        open={showUserDetailsModal}
        onClose={() => setShowUserDetailsModal(false)}
        title="用户详情"
        description={selectedUser?.name || ''}
      >
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">
                  {selectedUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {selectedUser.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                <Badge className={getRoleColor(selectedUser.role.name)}>
                  {selectedUser.role.displayName}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">加入时间</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {new Date(selectedUser.joinedAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">最后活跃</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {new Date(selectedUser.lastActive).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">对话数量</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedUser.metadata.conversationsCount}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Token使用</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {selectedUser.metadata.tokensUsed.toLocaleString()}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">权限列表</p>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {selectedUser.permissions.map((permission) => (
                  <div key={permission.id} className="text-sm text-gray-600 dark:text-gray-400">
                    • {permission.displayName}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default OrganizationDashboard
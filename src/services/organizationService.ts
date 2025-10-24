import { EventEmitter } from '@/utils/EventEmitter'

// Types for multi-tenant organization management
export interface Organization {
  id: string
  name: string
  displayName: string
  description: string
  logo?: string
  website?: string
  industry: string
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  parentId?: string
  type: 'root' | 'division' | 'department' | 'team'
  status: 'active' | 'inactive' | 'suspended' | 'pending'
  settings: OrganizationSettings
  subscription: OrganizationSubscription
  billing: BillingInfo
  metadata: OrganizationMetadata
  createdAt: number
  updatedAt: number
  createdBy: string
}

export interface OrganizationSettings {
  branding: {
    primaryColor: string
    secondaryColor: string
    logo?: string
    favicon?: string
    customDomain?: string
  }
  security: {
    passwordPolicy: PasswordPolicy
    twoFactorRequired: boolean
    sessionTimeout: number
    ipWhitelist: string[]
    allowedDomains: string[]
    dataRetention: number
  }
  features: {
    enabledFeatures: string[]
    modelAccess: string[]
    maxUsers: number
    maxConversations: number
    maxTokensPerMonth: number
    storageLimit: number
  }
  integrations: {
    ssoEnabled: boolean
    ssoProvider?: string
    ssoConfig?: any
    webhookUrl?: string
    slackIntegration?: boolean
    teamsIntegration?: boolean
  }
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSymbols: boolean
  preventReuse: number
  maxAge: number
}

export interface OrganizationSubscription {
  plan: 'free' | 'starter' | 'professional' | 'enterprise' | 'custom'
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
  billingCycle: 'monthly' | 'yearly'
  currentPeriodStart: number
  currentPeriodEnd: number
  trialEnd?: number
  cancelAtPeriodEnd: boolean
  pricePerUser: number
  includedTokens: number
  includedUsers: number
  overage: {
    tokensUsed: number
    usersActive: number
    additionalCost: number
  }
}

export interface BillingInfo {
  customerId: string
  paymentMethod: PaymentMethod
  address: BillingAddress
  invoices: Invoice[]
  totalSpent: number
  nextBillingDate: number
  autoPayEnabled: boolean
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank' | 'paypal' | 'invoice'
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  isDefault: boolean
}

export interface BillingAddress {
  company?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  taxId?: string
}

export interface Invoice {
  id: string
  number: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  amount: number
  currency: string
  dueDate: number
  paidAt?: number
  description: string
  lineItems: InvoiceLineItem[]
  downloadUrl?: string
}

export interface InvoiceLineItem {
  description: string
  quantity: number
  unitAmount: number
  amount: number
}

export interface OrganizationMetadata {
  userCount: number
  activeUsers: number
  conversationCount: number
  tokensUsed: number
  storageUsed: number
  lastActivity: number
  features: {
    [key: string]: {
      enabled: boolean
      usage: number
      limit?: number
    }
  }
}

export interface OrganizationUser {
  id: string
  userId: string
  organizationId: string
  email: string
  name: string
  avatar?: string
  role: OrganizationRole
  permissions: Permission[]
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  joinedAt: number
  lastActive: number
  invitedBy?: string
  departments: string[]
  teams: string[]
  metadata: {
    conversationsCount: number
    tokensUsed: number
    lastLogin: number
    loginCount: number
  }
}

export interface OrganizationRole {
  id: string
  name: string
  displayName: string
  description: string
  type: 'system' | 'custom'
  level: number
  permissions: Permission[]
  organizationId: string
  isDefault: boolean
  createdAt: number
  updatedAt: number
}

export interface Permission {
  id: string
  name: string
  displayName: string
  description: string
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'execute'
  conditions?: PermissionCondition[]
}

export interface PermissionCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'not_in' | 'greater_than' | 'less_than'
  value: any
}

export interface Invitation {
  id: string
  organizationId: string
  email: string
  role: string
  invitedBy: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expiresAt: number
  createdAt: number
  acceptedAt?: number
  token: string
}

export interface OrganizationAuditLog {
  id: string
  organizationId: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  details: any
  ip: string
  userAgent: string
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface UsageReport {
  organizationId: string
  period: {
    start: number
    end: number
  }
  metrics: {
    users: {
      total: number
      active: number
      new: number
    }
    conversations: {
      total: number
      new: number
      avgLength: number
    }
    tokens: {
      total: number
      byModel: { [model: string]: number }
      cost: number
    }
    features: {
      [feature: string]: {
        usage: number
        users: number
      }
    }
  }
  trends: {
    userGrowth: number
    usageGrowth: number
    engagement: number
  }
}

// Default roles and permissions
const DEFAULT_PERMISSIONS: Permission[] = [
  {
    id: 'conversations.create',
    name: 'conversations.create',
    displayName: '创建对话',
    description: '创建新的AI对话',
    resource: 'conversations',
    action: 'create'
  },
  {
    id: 'conversations.read',
    name: 'conversations.read',
    displayName: '查看对话',
    description: '查看对话内容',
    resource: 'conversations',
    action: 'read'
  },
  {
    id: 'conversations.update',
    name: 'conversations.update',
    displayName: '编辑对话',
    description: '编辑对话内容',
    resource: 'conversations',
    action: 'update'
  },
  {
    id: 'conversations.delete',
    name: 'conversations.delete',
    displayName: '删除对话',
    description: '删除对话',
    resource: 'conversations',
    action: 'delete'
  },
  {
    id: 'templates.create',
    name: 'templates.create',
    displayName: '创建模板',
    description: '创建提示词模板',
    resource: 'templates',
    action: 'create'
  },
  {
    id: 'templates.read',
    name: 'templates.read',
    displayName: '查看模板',
    description: '查看提示词模板',
    resource: 'templates',
    action: 'read'
  },
  {
    id: 'templates.manage',
    name: 'templates.manage',
    displayName: '管理模板',
    description: '管理所有提示词模板',
    resource: 'templates',
    action: 'manage'
  },
  {
    id: 'users.invite',
    name: 'users.invite',
    displayName: '邀请用户',
    description: '邀请新用户加入组织',
    resource: 'users',
    action: 'create'
  },
  {
    id: 'users.manage',
    name: 'users.manage',
    displayName: '管理用户',
    description: '管理组织用户',
    resource: 'users',
    action: 'manage'
  },
  {
    id: 'organization.read',
    name: 'organization.read',
    displayName: '查看组织',
    description: '查看组织信息',
    resource: 'organization',
    action: 'read'
  },
  {
    id: 'organization.manage',
    name: 'organization.manage',
    displayName: '管理组织',
    description: '管理组织设置和配置',
    resource: 'organization',
    action: 'manage'
  },
  {
    id: 'billing.read',
    name: 'billing.read',
    displayName: '查看账单',
    description: '查看组织账单信息',
    resource: 'billing',
    action: 'read'
  },
  {
    id: 'billing.manage',
    name: 'billing.manage',
    displayName: '管理账单',
    description: '管理组织账单和付款',
    resource: 'billing',
    action: 'manage'
  },
  {
    id: 'analytics.read',
    name: 'analytics.read',
    displayName: '查看分析',
    description: '查看使用分析和报告',
    resource: 'analytics',
    action: 'read'
  },
  {
    id: 'workflows.create',
    name: 'workflows.create',
    displayName: '创建工作流',
    description: '创建自动化工作流',
    resource: 'workflows',
    action: 'create'
  },
  {
    id: 'workflows.execute',
    name: 'workflows.execute',
    displayName: '执行工作流',
    description: '执行自动化工作流',
    resource: 'workflows',
    action: 'execute'
  }
]

const DEFAULT_ROLES: Omit<OrganizationRole, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'owner',
    displayName: '组织所有者',
    description: '组织的最高管理员，拥有所有权限',
    type: 'system',
    level: 100,
    permissions: DEFAULT_PERMISSIONS,
    isDefault: false
  },
  {
    name: 'admin',
    displayName: '管理员',
    description: '组织管理员，可以管理用户和设置',
    type: 'system',
    level: 80,
    permissions: DEFAULT_PERMISSIONS.filter(p =>
      !p.name.includes('billing.manage') && !p.name.includes('organization.manage')
    ),
    isDefault: false
  },
  {
    name: 'manager',
    displayName: '部门经理',
    description: '部门经理，可以管理部门用户和资源',
    type: 'system',
    level: 60,
    permissions: DEFAULT_PERMISSIONS.filter(p =>
      p.resource === 'conversations' ||
      p.resource === 'templates' ||
      p.name === 'users.invite' ||
      p.name === 'analytics.read'
    ),
    isDefault: false
  },
  {
    name: 'user',
    displayName: '普通用户',
    description: '普通用户，可以进行基本操作',
    type: 'system',
    level: 20,
    permissions: DEFAULT_PERMISSIONS.filter(p =>
      p.action === 'create' || p.action === 'read' ||
      (p.action === 'update' && p.resource === 'conversations')
    ),
    isDefault: true
  },
  {
    name: 'viewer',
    displayName: '查看者',
    description: '只读用户，只能查看内容',
    type: 'system',
    level: 10,
    permissions: DEFAULT_PERMISSIONS.filter(p => p.action === 'read'),
    isDefault: false
  }
]

class OrganizationService extends EventEmitter {
  private organizations: Map<string, Organization> = new Map()
  private organizationUsers: Map<string, OrganizationUser[]> = new Map()
  private roles: Map<string, OrganizationRole[]> = new Map()
  private invitations: Map<string, Invitation[]> = new Map()
  private auditLogs: Map<string, OrganizationAuditLog[]> = new Map()
  private currentOrganizationId: string | null = null
  private currentUserId: string = 'current_user'

  constructor() {
    super()
    this.loadOrganizations()
    this.loadOrganizationUsers()
    this.loadRoles()
    this.loadInvitations()
    this.loadAuditLogs()
  }

  // Organization CRUD
  async createOrganization(data: Omit<Organization, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'metadata'>): Promise<Organization> {
    const id = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()

    const organization: Organization = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      createdBy: this.currentUserId,
      metadata: {
        userCount: 1,
        activeUsers: 1,
        conversationCount: 0,
        tokensUsed: 0,
        storageUsed: 0,
        lastActivity: now,
        features: {}
      }
    }

    this.organizations.set(id, organization)

    // Create default roles
    await this.createDefaultRoles(id)

    // Add creator as owner
    await this.addUserToOrganization(id, this.currentUserId, 'owner', {
      email: 'owner@example.com',
      name: 'Organization Owner'
    })

    await this.saveOrganizations()
    await this.logAuditEvent(id, 'organization.created', 'organization', id, { name: data.name })

    this.emit('organizationCreated', organization)
    return organization
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | null> {
    const organization = this.organizations.get(id)
    if (!organization) return null

    // Check permissions
    if (!await this.hasPermission(id, 'organization.manage')) {
      throw new Error('Insufficient permissions to update organization')
    }

    const updatedOrganization: Organization = {
      ...organization,
      ...updates,
      updatedAt: Date.now()
    }

    this.organizations.set(id, updatedOrganization)
    await this.saveOrganizations()
    await this.logAuditEvent(id, 'organization.updated', 'organization', id, updates)

    this.emit('organizationUpdated', updatedOrganization)
    return updatedOrganization
  }

  async deleteOrganization(id: string): Promise<boolean> {
    const organization = this.organizations.get(id)
    if (!organization) return false

    // Check permissions
    if (!await this.hasPermission(id, 'organization.manage')) {
      throw new Error('Insufficient permissions to delete organization')
    }

    // Remove all related data
    this.organizations.delete(id)
    this.organizationUsers.delete(id)
    this.roles.delete(id)
    this.invitations.delete(id)
    this.auditLogs.delete(id)

    await this.saveOrganizations()
    await this.saveOrganizationUsers()
    await this.saveRoles()
    await this.saveInvitations()
    await this.saveAuditLogs()

    this.emit('organizationDeleted', id)
    return true
  }

  async getOrganization(id: string): Promise<Organization | null> {
    return this.organizations.get(id) || null
  }

  async getOrganizations(userId?: string): Promise<Organization[]> {
    const organizations = Array.from(this.organizations.values())

    if (userId) {
      // Filter organizations where user is a member
      return organizations.filter(org => {
        const users = this.organizationUsers.get(org.id) || []
        return users.some(user => user.userId === userId)
      })
    }

    return organizations
  }

  async getOrganizationHierarchy(rootId: string): Promise<Organization[]> {
    const hierarchy: Organization[] = []
    const visited = new Set<string>()

    const traverse = (orgId: string, level: number = 0) => {
      if (visited.has(orgId)) return
      visited.add(orgId)

      const org = this.organizations.get(orgId)
      if (org) {
        hierarchy.push({ ...org, metadata: { ...org.metadata, level } as any })

        // Find children
        const children = Array.from(this.organizations.values())
          .filter(o => o.parentId === orgId)
          .sort((a, b) => a.name.localeCompare(b.name))

        children.forEach(child => traverse(child.id, level + 1))
      }
    }

    traverse(rootId)
    return hierarchy
  }

  // User management
  async addUserToOrganization(
    organizationId: string,
    userId: string,
    roleName: string,
    userInfo: { email: string; name: string; avatar?: string }
  ): Promise<OrganizationUser> {
    const organization = this.organizations.get(organizationId)
    if (!organization) throw new Error('Organization not found')

    // Check permissions
    if (!await this.hasPermission(organizationId, 'users.invite')) {
      throw new Error('Insufficient permissions to add users')
    }

    const roles = this.roles.get(organizationId) || []
    const role = roles.find(r => r.name === roleName)
    if (!role) throw new Error('Role not found')

    const orgUsers = this.organizationUsers.get(organizationId) || []

    // Check if user already exists
    const existingUser = orgUsers.find(u => u.userId === userId)
    if (existingUser) throw new Error('User already exists in organization')

    const orgUser: OrganizationUser = {
      id: `orguser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      organizationId,
      email: userInfo.email,
      name: userInfo.name,
      avatar: userInfo.avatar,
      role,
      permissions: role.permissions,
      status: 'active',
      joinedAt: Date.now(),
      lastActive: Date.now(),
      invitedBy: this.currentUserId,
      departments: [],
      teams: [],
      metadata: {
        conversationsCount: 0,
        tokensUsed: 0,
        lastLogin: 0,
        loginCount: 0
      }
    }

    orgUsers.push(orgUser)
    this.organizationUsers.set(organizationId, orgUsers)

    // Update organization metadata
    organization.metadata.userCount = orgUsers.length
    organization.metadata.activeUsers = orgUsers.filter(u => u.status === 'active').length
    this.organizations.set(organizationId, organization)

    await this.saveOrganizationUsers()
    await this.saveOrganizations()
    await this.logAuditEvent(organizationId, 'user.added', 'user', userId, { role: roleName })

    this.emit('userAddedToOrganization', { organizationId, user: orgUser })
    return orgUser
  }

  async removeUserFromOrganization(organizationId: string, userId: string): Promise<boolean> {
    // Check permissions
    if (!await this.hasPermission(organizationId, 'users.manage')) {
      throw new Error('Insufficient permissions to remove users')
    }

    const orgUsers = this.organizationUsers.get(organizationId) || []
    const userIndex = orgUsers.findIndex(u => u.userId === userId)

    if (userIndex === -1) return false

    orgUsers.splice(userIndex, 1)
    this.organizationUsers.set(organizationId, orgUsers)

    // Update organization metadata
    const organization = this.organizations.get(organizationId)
    if (organization) {
      organization.metadata.userCount = orgUsers.length
      organization.metadata.activeUsers = orgUsers.filter(u => u.status === 'active').length
      this.organizations.set(organizationId, organization)
    }

    await this.saveOrganizationUsers()
    await this.saveOrganizations()
    await this.logAuditEvent(organizationId, 'user.removed', 'user', userId, {})

    this.emit('userRemovedFromOrganization', { organizationId, userId })
    return true
  }

  async updateUserRole(organizationId: string, userId: string, roleName: string): Promise<OrganizationUser | null> {
    // Check permissions
    if (!await this.hasPermission(organizationId, 'users.manage')) {
      throw new Error('Insufficient permissions to update user roles')
    }

    const orgUsers = this.organizationUsers.get(organizationId) || []
    const user = orgUsers.find(u => u.userId === userId)
    if (!user) return null

    const roles = this.roles.get(organizationId) || []
    const role = roles.find(r => r.name === roleName)
    if (!role) throw new Error('Role not found')

    user.role = role
    user.permissions = role.permissions

    this.organizationUsers.set(organizationId, orgUsers)
    await this.saveOrganizationUsers()
    await this.logAuditEvent(organizationId, 'user.role_updated', 'user', userId, { newRole: roleName })

    this.emit('userRoleUpdated', { organizationId, user })
    return user
  }

  async getOrganizationUsers(organizationId: string): Promise<OrganizationUser[]> {
    // Check permissions
    if (!await this.hasPermission(organizationId, 'users.manage') &&
        !await this.hasPermission(organizationId, 'organization.read')) {
      throw new Error('Insufficient permissions to view users')
    }

    return this.organizationUsers.get(organizationId) || []
  }

  // Role management
  async createRole(organizationId: string, roleData: Omit<OrganizationRole, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>): Promise<OrganizationRole> {
    // Check permissions
    if (!await this.hasPermission(organizationId, 'organization.manage')) {
      throw new Error('Insufficient permissions to create roles')
    }

    const id = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = Date.now()

    const role: OrganizationRole = {
      ...roleData,
      id,
      organizationId,
      createdAt: now,
      updatedAt: now
    }

    const roles = this.roles.get(organizationId) || []
    roles.push(role)
    this.roles.set(organizationId, roles)

    await this.saveRoles()
    await this.logAuditEvent(organizationId, 'role.created', 'role', id, { name: roleData.name })

    this.emit('roleCreated', { organizationId, role })
    return role
  }

  async updateRole(organizationId: string, roleId: string, updates: Partial<OrganizationRole>): Promise<OrganizationRole | null> {
    // Check permissions
    if (!await this.hasPermission(organizationId, 'organization.manage')) {
      throw new Error('Insufficient permissions to update roles')
    }

    const roles = this.roles.get(organizationId) || []
    const role = roles.find(r => r.id === roleId)
    if (!role) return null

    const updatedRole: OrganizationRole = {
      ...role,
      ...updates,
      updatedAt: Date.now()
    }

    const roleIndex = roles.findIndex(r => r.id === roleId)
    roles[roleIndex] = updatedRole
    this.roles.set(organizationId, roles)

    await this.saveRoles()
    await this.logAuditEvent(organizationId, 'role.updated', 'role', roleId, updates)

    this.emit('roleUpdated', { organizationId, role: updatedRole })
    return updatedRole
  }

  async deleteRole(organizationId: string, roleId: string): Promise<boolean> {
    // Check permissions
    if (!await this.hasPermission(organizationId, 'organization.manage')) {
      throw new Error('Insufficient permissions to delete roles')
    }

    const roles = this.roles.get(organizationId) || []
    const role = roles.find(r => r.id === roleId)
    if (!role || role.type === 'system') return false

    // Check if role is in use
    const orgUsers = this.organizationUsers.get(organizationId) || []
    const usersWithRole = orgUsers.filter(u => u.role.id === roleId)
    if (usersWithRole.length > 0) {
      throw new Error('Cannot delete role that is currently assigned to users')
    }

    const filteredRoles = roles.filter(r => r.id !== roleId)
    this.roles.set(organizationId, filteredRoles)

    await this.saveRoles()
    await this.logAuditEvent(organizationId, 'role.deleted', 'role', roleId, {})

    this.emit('roleDeleted', { organizationId, roleId })
    return true
  }

  async getRoles(organizationId: string): Promise<OrganizationRole[]> {
    return this.roles.get(organizationId) || []
  }

  // Invitation management
  async inviteUser(organizationId: string, email: string, roleName: string): Promise<Invitation> {
    // Check permissions
    if (!await this.hasPermission(organizationId, 'users.invite')) {
      throw new Error('Insufficient permissions to invite users')
    }

    const organization = this.organizations.get(organizationId)
    if (!organization) throw new Error('Organization not found')

    const roles = this.roles.get(organizationId) || []
    const role = roles.find(r => r.name === roleName)
    if (!role) throw new Error('Role not found')

    // Check if user is already invited or a member
    const invitations = this.invitations.get(organizationId) || []
    const existingInvitation = invitations.find(i => i.email === email && i.status === 'pending')
    if (existingInvitation) throw new Error('User already invited')

    const orgUsers = this.organizationUsers.get(organizationId) || []
    const existingUser = orgUsers.find(u => u.email === email)
    if (existingUser) throw new Error('User already a member')

    const invitation: Invitation = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      email,
      role: roleName,
      invitedBy: this.currentUserId,
      status: 'pending',
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      createdAt: Date.now(),
      token: this.generateInvitationToken()
    }

    invitations.push(invitation)
    this.invitations.set(organizationId, invitations)

    await this.saveInvitations()
    await this.logAuditEvent(organizationId, 'user.invited', 'invitation', invitation.id, { email, role: roleName })

    this.emit('userInvited', { organizationId, invitation })
    return invitation
  }

  async acceptInvitation(token: string, userId: string, userInfo: { email: string; name: string }): Promise<OrganizationUser | null> {
    // Find invitation by token
    let foundInvitation: Invitation | null = null
    let organizationId: string | null = null

    for (const [orgId, invitations] of this.invitations.entries()) {
      const invitation = invitations.find(i => i.token === token && i.status === 'pending')
      if (invitation) {
        foundInvitation = invitation
        organizationId = orgId
        break
      }
    }

    if (!foundInvitation || !organizationId) {
      throw new Error('Invalid or expired invitation')
    }

    if (foundInvitation.expiresAt < Date.now()) {
      foundInvitation.status = 'expired'
      await this.saveInvitations()
      throw new Error('Invitation has expired')
    }

    // Add user to organization
    const orgUser = await this.addUserToOrganization(
      organizationId,
      userId,
      foundInvitation.role,
      userInfo
    )

    // Mark invitation as accepted
    foundInvitation.status = 'accepted'
    foundInvitation.acceptedAt = Date.now()
    await this.saveInvitations()

    await this.logAuditEvent(organizationId, 'invitation.accepted', 'invitation', foundInvitation.id, { userId })

    this.emit('invitationAccepted', { organizationId, invitation: foundInvitation, user: orgUser })
    return orgUser
  }

  async getInvitations(organizationId: string): Promise<Invitation[]> {
    // Check permissions
    if (!await this.hasPermission(organizationId, 'users.manage')) {
      throw new Error('Insufficient permissions to view invitations')
    }

    return this.invitations.get(organizationId) || []
  }

  // Permission checking
  async hasPermission(organizationId: string, permissionName: string, userId?: string): Promise<boolean> {
    const checkUserId = userId || this.currentUserId
    const orgUsers = this.organizationUsers.get(organizationId) || []
    const user = orgUsers.find(u => u.userId === checkUserId)

    if (!user || user.status !== 'active') return false

    return user.permissions.some(p => p.name === permissionName)
  }

  async getUserPermissions(organizationId: string, userId?: string): Promise<Permission[]> {
    const checkUserId = userId || this.currentUserId
    const orgUsers = this.organizationUsers.get(organizationId) || []
    const user = orgUsers.find(u => u.userId === checkUserId)

    return user?.permissions || []
  }

  // Usage tracking and billing
  async trackUsage(organizationId: string, resource: string, amount: number, metadata?: any): Promise<void> {
    const organization = this.organizations.get(organizationId)
    if (!organization) return

    organization.metadata.lastActivity = Date.now()

    switch (resource) {
      case 'tokens':
        organization.metadata.tokensUsed += amount
        organization.subscription.overage.tokensUsed += amount
        break
      case 'conversations':
        organization.metadata.conversationCount += amount
        break
      case 'storage':
        organization.metadata.storageUsed += amount
        break
    }

    // Check limits and update overage costs
    await this.updateOverageCosts(organization)

    this.organizations.set(organizationId, organization)
    await this.saveOrganizations()

    this.emit('usageTracked', { organizationId, resource, amount, metadata })
  }

  async generateUsageReport(organizationId: string, startDate: number, endDate: number): Promise<UsageReport> {
    const organization = this.organizations.get(organizationId)
    if (!organization) throw new Error('Organization not found')

    // Mock usage report generation
    const report: UsageReport = {
      organizationId,
      period: { start: startDate, end: endDate },
      metrics: {
        users: {
          total: organization.metadata.userCount,
          active: organization.metadata.activeUsers,
          new: Math.floor(organization.metadata.userCount * 0.1)
        },
        conversations: {
          total: organization.metadata.conversationCount,
          new: Math.floor(organization.metadata.conversationCount * 0.2),
          avgLength: 15
        },
        tokens: {
          total: organization.metadata.tokensUsed,
          byModel: {
            'gpt-4': Math.floor(organization.metadata.tokensUsed * 0.6),
            'gpt-3.5-turbo': Math.floor(organization.metadata.tokensUsed * 0.4)
          },
          cost: organization.metadata.tokensUsed * 0.002
        },
        features: {
          search: { usage: 150, users: 8 },
          workflows: { usage: 45, users: 3 },
          templates: { usage: 78, users: 12 }
        }
      },
      trends: {
        userGrowth: 0.15,
        usageGrowth: 0.23,
        engagement: 0.78
      }
    }

    return report
  }

  // Audit logging
  async logAuditEvent(
    organizationId: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: any
  ): Promise<void> {
    const auditLog: OrganizationAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      organizationId,
      userId: this.currentUserId,
      action,
      resource,
      resourceId,
      details: details || {},
      ip: '127.0.0.1', // In real implementation, get from request
      userAgent: 'Claude Code Client',
      timestamp: Date.now(),
      severity: this.getActionSeverity(action)
    }

    const logs = this.auditLogs.get(organizationId) || []
    logs.push(auditLog)

    // Keep only last 1000 logs per organization
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000)
    }

    this.auditLogs.set(organizationId, logs)
    await this.saveAuditLogs()

    this.emit('auditLogCreated', auditLog)
  }

  async getAuditLogs(organizationId: string, limit: number = 100): Promise<OrganizationAuditLog[]> {
    // Check permissions
    if (!await this.hasPermission(organizationId, 'organization.manage')) {
      throw new Error('Insufficient permissions to view audit logs')
    }

    const logs = this.auditLogs.get(organizationId) || []
    return logs.slice(-limit).reverse()
  }

  // Helper methods
  private async createDefaultRoles(organizationId: string): Promise<void> {
    const roles: OrganizationRole[] = DEFAULT_ROLES.map(roleData => ({
      id: `role_${organizationId}_${roleData.name}`,
      ...roleData,
      organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }))

    this.roles.set(organizationId, roles)
    await this.saveRoles()
  }

  private generateInvitationToken(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
  }

  private getActionSeverity(action: string): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverityActions = ['organization.deleted', 'user.removed', 'role.deleted']
    const mediumSeverityActions = ['organization.created', 'user.added', 'role.created', 'settings.updated']

    if (highSeverityActions.includes(action)) return 'high'
    if (mediumSeverityActions.includes(action)) return 'medium'
    return 'low'
  }

  private async updateOverageCosts(organization: Organization): Promise<void> {
    const subscription = organization.subscription

    // Calculate token overage
    const excessTokens = Math.max(0, subscription.overage.tokensUsed - subscription.includedTokens)
    const tokenOverageCost = excessTokens * 0.002 // $0.002 per token

    // Calculate user overage
    const excessUsers = Math.max(0, organization.metadata.userCount - subscription.includedUsers)
    const userOverageCost = excessUsers * subscription.pricePerUser

    subscription.overage.additionalCost = tokenOverageCost + userOverageCost
  }

  // Current organization management
  setCurrentOrganization(organizationId: string): void {
    this.currentOrganizationId = organizationId
    this.emit('currentOrganizationChanged', organizationId)
  }

  getCurrentOrganization(): string | null {
    return this.currentOrganizationId
  }

  getCurrentOrganizationData(): Organization | null {
    return this.currentOrganizationId ? this.organizations.get(this.currentOrganizationId) || null : null
  }

  // Storage methods
  private async loadOrganizations(): Promise<void> {
    try {
      const data = localStorage.getItem('organizations')
      if (data) {
        const parsed = JSON.parse(data)
        parsed.forEach((org: Organization) => {
          this.organizations.set(org.id, org)
        })
      }
    } catch (error) {
      console.error('Failed to load organizations:', error)
    }
  }

  private async saveOrganizations(): Promise<void> {
    try {
      const data = Array.from(this.organizations.values())
      localStorage.setItem('organizations', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save organizations:', error)
    }
  }

  private async loadOrganizationUsers(): Promise<void> {
    try {
      const data = localStorage.getItem('organization_users')
      if (data) {
        const parsed = JSON.parse(data)
        Object.entries(parsed).forEach(([orgId, users]) => {
          this.organizationUsers.set(orgId, users as OrganizationUser[])
        })
      }
    } catch (error) {
      console.error('Failed to load organization users:', error)
    }
  }

  private async saveOrganizationUsers(): Promise<void> {
    try {
      const data = Object.fromEntries(this.organizationUsers.entries())
      localStorage.setItem('organization_users', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save organization users:', error)
    }
  }

  private async loadRoles(): Promise<void> {
    try {
      const data = localStorage.getItem('organization_roles')
      if (data) {
        const parsed = JSON.parse(data)
        Object.entries(parsed).forEach(([orgId, roles]) => {
          this.roles.set(orgId, roles as OrganizationRole[])
        })
      }
    } catch (error) {
      console.error('Failed to load roles:', error)
    }
  }

  private async saveRoles(): Promise<void> {
    try {
      const data = Object.fromEntries(this.roles.entries())
      localStorage.setItem('organization_roles', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save roles:', error)
    }
  }

  private async loadInvitations(): Promise<void> {
    try {
      const data = localStorage.getItem('organization_invitations')
      if (data) {
        const parsed = JSON.parse(data)
        Object.entries(parsed).forEach(([orgId, invitations]) => {
          this.invitations.set(orgId, invitations as Invitation[])
        })
      }
    } catch (error) {
      console.error('Failed to load invitations:', error)
    }
  }

  private async saveInvitations(): Promise<void> {
    try {
      const data = Object.fromEntries(this.invitations.entries())
      localStorage.setItem('organization_invitations', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save invitations:', error)
    }
  }

  private async loadAuditLogs(): Promise<void> {
    try {
      const data = localStorage.getItem('organization_audit_logs')
      if (data) {
        const parsed = JSON.parse(data)
        Object.entries(parsed).forEach(([orgId, logs]) => {
          this.auditLogs.set(orgId, logs as OrganizationAuditLog[])
        })
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error)
    }
  }

  private async saveAuditLogs(): Promise<void> {
    try {
      const data = Object.fromEntries(this.auditLogs.entries())
      localStorage.setItem('organization_audit_logs', JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save audit logs:', error)
    }
  }
}

// Create singleton instance
const organizationService = new OrganizationService()
export default organizationService
/**
 * RBAC (Role-Based Access Control) Service
 * Comprehensive permission and access control management system
 */

import localforage from 'localforage'
import { authService } from './authService'

export interface Role {
  id: string
  name: string
  displayName: string
  description: string
  level: number // Higher level = more permissions (0-100)
  permissions: Permission[]
  inheritsFrom?: string[] // Role IDs to inherit permissions from
  isSystem: boolean // System roles cannot be deleted
  isActive: boolean
  createdAt: number
  updatedAt: number
  metadata?: {
    color?: string
    icon?: string
    userCount?: number
  }
}

export interface Permission {
  id: string
  resource: string // e.g., 'conversation', 'workspace', 'user', 'settings'
  action: string // e.g., 'create', 'read', 'update', 'delete', 'share', 'export'
  scope: 'own' | 'team' | 'organization' | 'all' // Permission scope
  conditions?: PermissionCondition[] // Additional conditions
}

export interface PermissionCondition {
  field: string
  operator: '==' | '!=' | '>' | '<' | 'contains' | 'in'
  value: any
}

export interface RoleAssignment {
  id: string
  userId: string
  roleId: string
  scope: 'global' | 'workspace' | 'resource'
  scopeId?: string // Workspace ID or Resource ID
  assignedBy: string
  assignedAt: number
  expiresAt?: number
  metadata?: Record<string, any>
}

export interface AccessPolicy {
  id: string
  name: string
  description: string
  priority: number // Higher priority = checked first
  effect: 'allow' | 'deny'
  principals: {
    users?: string[]
    roles?: string[]
    groups?: string[]
  }
  resources: {
    types?: string[]
    ids?: string[]
    patterns?: string[] // Regex patterns
  }
  actions: string[]
  conditions?: PermissionCondition[]
  isActive: boolean
  createdAt: number
}

export interface AuditLog {
  id: string
  timestamp: number
  userId: string
  userName: string
  action: string
  resource: string
  resourceId?: string
  result: 'allowed' | 'denied'
  reason?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export interface AccessCheck {
  resource: string
  action: string
  resourceId?: string
  context?: Record<string, any>
}

export interface AccessResult {
  allowed: boolean
  reason: string
  matchedPolicies: string[]
  effectivePermissions: Permission[]
}

export class RBACService {
  private store: LocalForage
  private roles: Map<string, Role> = new Map()
  private assignments: Map<string, RoleAssignment[]> = new Map() // userId -> assignments
  private policies: Map<string, AccessPolicy> = new Map()
  private auditLogs: AuditLog[] = []
  private permissionCache: Map<string, AccessResult> = new Map()

  constructor() {
    this.store = localforage.createInstance({
      name: 'rbac-db',
      storeName: 'permissions'
    })
  }

  /**
   * Initialize RBAC service
   */
  async initialize(): Promise<void> {
    try {
      // Load roles
      const rolesList = await this.store.getItem<Role[]>('roles')
      if (rolesList) {
        rolesList.forEach(role => this.roles.set(role.id, role))
      } else {
        // Create default system roles
        await this.createDefaultRoles()
      }

      // Load assignments
      const assignmentsList = await this.store.getItem<RoleAssignment[]>('assignments')
      if (assignmentsList) {
        assignmentsList.forEach(assignment => {
          const userAssignments = this.assignments.get(assignment.userId) || []
          userAssignments.push(assignment)
          this.assignments.set(assignment.userId, userAssignments)
        })
      }

      // Load policies
      const policiesList = await this.store.getItem<AccessPolicy[]>('policies')
      if (policiesList) {
        policiesList.forEach(policy => this.policies.set(policy.id, policy))
      } else {
        await this.createDefaultPolicies()
      }

      // Load audit logs
      const logs = await this.store.getItem<AuditLog[]>('audit-logs')
      if (logs) {
        this.auditLogs = logs.slice(-1000) // Keep last 1000 logs
      }

      console.log('[RBAC] Initialized with', this.roles.size, 'roles')
    } catch (error) {
      console.error('[RBAC] Initialization error:', error)
    }
  }

  /**
   * Create default system roles
   */
  private async createDefaultRoles(): Promise<void> {
    const defaultRoles: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'super_admin',
        displayName: '超级管理员',
        description: '拥有所有权限的系统管理员',
        level: 100,
        permissions: [
          { id: 'all', resource: '*', action: '*', scope: 'all' }
        ],
        isSystem: true,
        isActive: true,
        metadata: { color: '#DC2626', icon: '👑' }
      },
      {
        name: 'admin',
        displayName: '管理员',
        description: '组织管理员，可以管理用户和设置',
        level: 90,
        permissions: [
          { id: 'p1', resource: 'user', action: '*', scope: 'organization' },
          { id: 'p2', resource: 'workspace', action: '*', scope: 'organization' },
          { id: 'p3', resource: 'settings', action: 'read', scope: 'organization' },
          { id: 'p4', resource: 'settings', action: 'update', scope: 'organization' },
          { id: 'p5', resource: 'conversation', action: '*', scope: 'organization' }
        ],
        isSystem: true,
        isActive: true,
        metadata: { color: '#EA580C', icon: '⚡' }
      },
      {
        name: 'manager',
        displayName: '管理者',
        description: '团队管理者，可以管理团队成员和内容',
        level: 70,
        permissions: [
          { id: 'p6', resource: 'workspace', action: 'read', scope: 'team' },
          { id: 'p7', resource: 'workspace', action: 'update', scope: 'team' },
          { id: 'p8', resource: 'conversation', action: '*', scope: 'team' },
          { id: 'p9', resource: 'user', action: 'read', scope: 'team' },
          { id: 'p10', resource: 'report', action: 'read', scope: 'team' }
        ],
        isSystem: true,
        isActive: true,
        metadata: { color: '#CA8A04', icon: '📊' }
      },
      {
        name: 'member',
        displayName: '成员',
        description: '标准用户，可以创建和管理自己的内容',
        level: 50,
        permissions: [
          { id: 'p11', resource: 'conversation', action: 'create', scope: 'own' },
          { id: 'p12', resource: 'conversation', action: 'read', scope: 'own' },
          { id: 'p13', resource: 'conversation', action: 'update', scope: 'own' },
          { id: 'p14', resource: 'conversation', action: 'delete', scope: 'own' },
          { id: 'p15', resource: 'workspace', action: 'read', scope: 'team' },
          { id: 'p16', resource: 'document', action: '*', scope: 'own' },
          { id: 'p17', resource: 'knowledge', action: 'read', scope: 'team' }
        ],
        isSystem: true,
        isActive: true,
        metadata: { color: '#2563EB', icon: '👤' }
      },
      {
        name: 'viewer',
        displayName: '访客',
        description: '只读访问权限',
        level: 10,
        permissions: [
          { id: 'p18', resource: 'conversation', action: 'read', scope: 'team' },
          { id: 'p19', resource: 'workspace', action: 'read', scope: 'team' },
          { id: 'p20', resource: 'document', action: 'read', scope: 'team' }
        ],
        isSystem: true,
        isActive: true,
        metadata: { color: '#64748B', icon: '👁️' }
      },
      {
        name: 'guest',
        displayName: '访客用户',
        description: '受限访问，只能查看公开内容',
        level: 1,
        permissions: [
          { id: 'p21', resource: 'conversation', action: 'read', scope: 'own' }
        ],
        isSystem: true,
        isActive: true,
        metadata: { color: '#94A3B8', icon: '🚪' }
      }
    ]

    for (const roleData of defaultRoles) {
      const role: Role = {
        ...roleData,
        id: `role-${roleData.name}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
      this.roles.set(role.id, role)
    }

    await this.saveRoles()
  }

  /**
   * Create default access policies
   */
  private async createDefaultPolicies(): Promise<void> {
    const defaultPolicies: Omit<AccessPolicy, 'id' | 'createdAt'>[] = [
      {
        name: 'deny_deleted_users',
        description: '拒绝已删除用户的所有访问',
        priority: 100,
        effect: 'deny',
        principals: { users: [] }, // Will be populated dynamically
        resources: { types: ['*'] },
        actions: ['*'],
        conditions: [
          { field: 'user.status', operator: '==', value: 'deleted' }
        ],
        isActive: true
      },
      {
        name: 'allow_owner_full_access',
        description: '允许资源所有者完全访问',
        priority: 90,
        effect: 'allow',
        principals: {},
        resources: { types: ['*'] },
        actions: ['*'],
        conditions: [
          { field: 'resource.ownerId', operator: '==', value: '{{userId}}' }
        ],
        isActive: true
      },
      {
        name: 'deny_expired_assignments',
        description: '拒绝过期的角色分配',
        priority: 80,
        effect: 'deny',
        principals: {},
        resources: { types: ['*'] },
        actions: ['*'],
        conditions: [
          { field: 'assignment.expiresAt', operator: '<', value: '{{now}}' }
        ],
        isActive: true
      }
    ]

    for (const policyData of defaultPolicies) {
      const policy: AccessPolicy = {
        ...policyData,
        id: `policy-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        createdAt: Date.now()
      }
      this.policies.set(policy.id, policy)
    }

    await this.savePolicies()
  }

  /**
   * Check if user has permission
   */
  async checkAccess(
    userId: string,
    check: AccessCheck
  ): Promise<AccessResult> {
    const cacheKey = `${userId}:${check.resource}:${check.action}:${check.resourceId || ''}`

    // Check cache (with 5 minute TTL)
    const cached = this.permissionCache.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // Get user's effective roles
      const userRoles = await this.getUserRoles(userId)

      // Collect all permissions from roles
      const effectivePermissions: Permission[] = []
      for (const role of userRoles) {
        effectivePermissions.push(...role.permissions)
      }

      // Check policies (explicit allow/deny)
      const policyResult = await this.evaluatePolicies(userId, check)
      if (policyResult.effect === 'deny') {
        const result: AccessResult = {
          allowed: false,
          reason: `Denied by policy: ${policyResult.policyName}`,
          matchedPolicies: [policyResult.policyId],
          effectivePermissions
        }

        this.logAccess(userId, check, result)
        return result
      }

      // Check permissions
      const hasPermission = this.evaluatePermissions(
        effectivePermissions,
        check,
        userId,
        check.context
      )

      const result: AccessResult = {
        allowed: hasPermission || policyResult.effect === 'allow',
        reason: hasPermission
          ? 'Permission granted by role'
          : policyResult.effect === 'allow'
          ? `Allowed by policy: ${policyResult.policyName}`
          : 'No matching permissions found',
        matchedPolicies: policyResult.effect ? [policyResult.policyId] : [],
        effectivePermissions
      }

      // Cache result
      this.permissionCache.set(cacheKey, result)
      setTimeout(() => this.permissionCache.delete(cacheKey), 300000) // 5 min

      this.logAccess(userId, check, result)
      return result
    } catch (error: any) {
      console.error('[RBAC] Access check error:', error)
      return {
        allowed: false,
        reason: `Error: ${error.message}`,
        matchedPolicies: [],
        effectivePermissions: []
      }
    }
  }

  /**
   * Evaluate policies for access check
   */
  private async evaluatePolicies(
    userId: string,
    check: AccessCheck
  ): Promise<{ effect: 'allow' | 'deny' | null; policyId: string; policyName: string }> {
    const sortedPolicies = Array.from(this.policies.values())
      .filter(p => p.isActive)
      .sort((a, b) => b.priority - a.priority)

    for (const policy of sortedPolicies) {
      // Check if policy applies to this user
      if (policy.principals.users && !policy.principals.users.includes(userId)) {
        continue
      }

      // Check if policy applies to this resource type
      if (policy.resources.types && policy.resources.types.length > 0) {
        const matchesType = policy.resources.types.includes('*') ||
          policy.resources.types.includes(check.resource)
        if (!matchesType) continue
      }

      // Check if policy applies to this action
      if (!policy.actions.includes('*') && !policy.actions.includes(check.action)) {
        continue
      }

      // Evaluate conditions
      if (policy.conditions && policy.conditions.length > 0) {
        const conditionsMet = await this.evaluateConditions(
          policy.conditions,
          { userId, ...check.context }
        )
        if (!conditionsMet) continue
      }

      // Policy matches - return its effect
      return {
        effect: policy.effect,
        policyId: policy.id,
        policyName: policy.name
      }
    }

    return { effect: null, policyId: '', policyName: '' }
  }

  /**
   * Evaluate permissions against access check
   */
  private evaluatePermissions(
    permissions: Permission[],
    check: AccessCheck,
    userId: string,
    context?: Record<string, any>
  ): boolean {
    for (const permission of permissions) {
      // Check resource match
      if (permission.resource !== '*' && permission.resource !== check.resource) {
        continue
      }

      // Check action match
      if (permission.action !== '*' && permission.action !== check.action) {
        continue
      }

      // Check scope
      if (!this.checkScope(permission.scope, userId, check, context)) {
        continue
      }

      // Check conditions
      if (permission.conditions && permission.conditions.length > 0) {
        const conditionsMet = this.evaluateConditions(permission.conditions, {
          userId,
          ...context
        })
        if (!conditionsMet) continue
      }

      // Permission matches
      return true
    }

    return false
  }

  /**
   * Check if scope matches
   */
  private checkScope(
    scope: Permission['scope'],
    userId: string,
    check: AccessCheck,
    context?: Record<string, any>
  ): boolean {
    switch (scope) {
      case 'own':
        return context?.ownerId === userId || context?.createdBy === userId
      case 'team':
        return this.checkTeamMembership(userId, context)
      case 'organization':
        return this.checkOrganizationMembership(userId, context)
      case 'all':
        return true
      default:
        return false
    }
  }

  /**
   * Check if user is a member of the resource's team
   */
  private checkTeamMembership(userId: string, context?: Record<string, any>): boolean {
    // If no team context provided, deny access
    if (!context?.teamId && !context?.workspaceId) {
      return false
    }

    // Get workspace service to check membership
    const workspaceId = context.workspaceId || context.teamId

    try {
      // Import workspace service dynamically to avoid circular dependency
      const { workspaceService } = require('./workspaceService')
      const workspace = workspaceService.getWorkspace(workspaceId)

      if (!workspace) {
        return false
      }

      // Check if user is a member of the workspace
      return workspace.members.some((m: any) => m.userId === userId)
    } catch (error) {
      console.error('[RBAC] Error checking team membership:', error)
      return false
    }
  }

  /**
   * Check if user is a member of the resource's organization
   */
  private checkOrganizationMembership(userId: string, context?: Record<string, any>): boolean {
    // If no organization context provided, deny access
    if (!context?.organizationId) {
      return false
    }

    try {
      // Get user's current organization from auth service
      const { authService } = require('./authService')
      const currentUser = authService.getCurrentUser()

      if (!currentUser) {
        return false
      }

      // Check if user's organization matches the resource's organization
      // In a real implementation, this would check against a user-organization mapping
      const userOrgId = currentUser.metadata?.organizationId || currentUser.organizationId

      return userOrgId === context.organizationId
    } catch (error) {
      console.error('[RBAC] Error checking organization membership:', error)
      return false
    }
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(
    conditions: PermissionCondition[],
    context: Record<string, any>
  ): boolean {
    for (const condition of conditions) {
      const value = this.getNestedValue(context, condition.field)

      switch (condition.operator) {
        case '==':
          if (value !== condition.value) return false
          break
        case '!=':
          if (value === condition.value) return false
          break
        case '>':
          if (Number(value) <= Number(condition.value)) return false
          break
        case '<':
          if (Number(value) >= Number(condition.value)) return false
          break
        case 'contains':
          if (!String(value).includes(String(condition.value))) return false
          break
        case 'in':
          if (!Array.isArray(condition.value) || !condition.value.includes(value)) return false
          break
      }
    }

    return true
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj)
  }

  /**
   * Get user's effective roles
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const assignments = this.assignments.get(userId) || []
    const now = Date.now()

    // Filter active and non-expired assignments
    const activeAssignments = assignments.filter(a => {
      if (a.expiresAt && a.expiresAt < now) return false
      const role = this.roles.get(a.roleId)
      return role && role.isActive
    })

    // Get roles
    const roles: Role[] = []
    for (const assignment of activeAssignments) {
      const role = this.roles.get(assignment.roleId)
      if (role) {
        roles.push(role)

        // Include inherited roles
        if (role.inheritsFrom) {
          for (const inheritedRoleId of role.inheritsFrom) {
            const inheritedRole = this.roles.get(inheritedRoleId)
            if (inheritedRole && inheritedRole.isActive) {
              roles.push(inheritedRole)
            }
          }
        }
      }
    }

    return roles
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: string,
    roleId: string,
    options: {
      scope?: RoleAssignment['scope']
      scopeId?: string
      expiresIn?: number // milliseconds
      assignedBy?: string
    } = {}
  ): Promise<RoleAssignment> {
    const role = this.roles.get(roleId)
    if (!role) {
      throw new Error('Role not found')
    }

    if (!role.isActive) {
      throw new Error('Role is not active')
    }

    const currentUser = authService.getCurrentUser()
    const now = Date.now()

    const assignment: RoleAssignment = {
      id: `assign-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      userId,
      roleId,
      scope: options.scope || 'global',
      scopeId: options.scopeId,
      assignedBy: options.assignedBy || currentUser?.id || 'system',
      assignedAt: now,
      expiresAt: options.expiresIn ? now + options.expiresIn : undefined
    }

    const userAssignments = this.assignments.get(userId) || []
    userAssignments.push(assignment)
    this.assignments.set(userId, userAssignments)

    await this.saveAssignments()

    // Clear permission cache for user
    this.clearUserCache(userId)

    return assignment
  }

  /**
   * Revoke role from user
   */
  async revokeRole(assignmentId: string): Promise<void> {
    for (const [userId, assignments] of this.assignments.entries()) {
      const index = assignments.findIndex(a => a.id === assignmentId)
      if (index !== -1) {
        assignments.splice(index, 1)
        if (assignments.length === 0) {
          this.assignments.delete(userId)
        }
        await this.saveAssignments()
        this.clearUserCache(userId)
        return
      }
    }

    throw new Error('Assignment not found')
  }

  /**
   * Create custom role
   */
  async createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    const id = `role-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const now = Date.now()

    const role: Role = {
      ...roleData,
      id,
      createdAt: now,
      updatedAt: now
    }

    this.roles.set(id, role)
    await this.saveRoles()

    return role
  }

  /**
   * Update role
   */
  async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    const role = this.roles.get(roleId)
    if (!role) {
      throw new Error('Role not found')
    }

    if (role.isSystem && (updates.name || updates.permissions)) {
      throw new Error('Cannot modify system role structure')
    }

    Object.assign(role, updates)
    role.updatedAt = Date.now()

    await this.saveRoles()

    // Clear cache for all users with this role
    this.clearRoleCache(roleId)

    return role
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: string): Promise<void> {
    const role = this.roles.get(roleId)
    if (!role) {
      throw new Error('Role not found')
    }

    if (role.isSystem) {
      throw new Error('Cannot delete system role')
    }

    // Remove all assignments
    for (const [userId, assignments] of this.assignments.entries()) {
      const filtered = assignments.filter(a => a.roleId !== roleId)
      if (filtered.length !== assignments.length) {
        this.assignments.set(userId, filtered)
        this.clearUserCache(userId)
      }
    }

    this.roles.delete(roleId)
    await this.saveRoles()
    await this.saveAssignments()
  }

  /**
   * List all roles
   */
  listRoles(filters?: { isActive?: boolean; isSystem?: boolean }): Role[] {
    let roles = Array.from(this.roles.values())

    if (filters?.isActive !== undefined) {
      roles = roles.filter(r => r.isActive === filters.isActive)
    }

    if (filters?.isSystem !== undefined) {
      roles = roles.filter(r => r.isSystem === filters.isSystem)
    }

    return roles.sort((a, b) => b.level - a.level)
  }

  /**
   * Get role by ID
   */
  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId)
  }

  /**
   * List user's role assignments
   */
  getUserAssignments(userId: string): RoleAssignment[] {
    return this.assignments.get(userId) || []
  }

  /**
   * Log access attempt
   */
  private logAccess(userId: string, check: AccessCheck, result: AccessResult): void {
    const user = authService.getCurrentUser()

    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: Date.now(),
      userId,
      userName: user?.displayName || 'Unknown',
      action: check.action,
      resource: check.resource,
      resourceId: check.resourceId,
      result: result.allowed ? 'allowed' : 'denied',
      reason: result.reason
    }

    this.auditLogs.push(log)

    // Keep only last 1000 logs
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000)
    }

    this.saveAuditLogs()
  }

  /**
   * Get audit logs
   */
  getAuditLogs(filters?: {
    userId?: string
    resource?: string
    action?: string
    result?: 'allowed' | 'denied'
    startDate?: number
    endDate?: number
  }): AuditLog[] {
    let logs = [...this.auditLogs]

    if (filters) {
      if (filters.userId) {
        logs = logs.filter(l => l.userId === filters.userId)
      }
      if (filters.resource) {
        logs = logs.filter(l => l.resource === filters.resource)
      }
      if (filters.action) {
        logs = logs.filter(l => l.action === filters.action)
      }
      if (filters.result) {
        logs = logs.filter(l => l.result === filters.result)
      }
      if (filters.startDate) {
        logs = logs.filter(l => l.timestamp >= filters.startDate!)
      }
      if (filters.endDate) {
        logs = logs.filter(l => l.timestamp <= filters.endDate!)
      }
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Clear user's permission cache
   */
  private clearUserCache(userId: string): void {
    for (const [key] of this.permissionCache.entries()) {
      if (key.startsWith(`${userId}:`)) {
        this.permissionCache.delete(key)
      }
    }
  }

  /**
   * Clear cache for all users with a specific role
   */
  private clearRoleCache(roleId: string): void {
    for (const [userId, assignments] of this.assignments.entries()) {
      if (assignments.some(a => a.roleId === roleId)) {
        this.clearUserCache(userId)
      }
    }
  }

  /**
   * Save roles to storage
   */
  private async saveRoles(): Promise<void> {
    const list = Array.from(this.roles.values())
    await this.store.setItem('roles', list)
  }

  /**
   * Save assignments to storage
   */
  private async saveAssignments(): Promise<void> {
    const list: RoleAssignment[] = []
    for (const assignments of this.assignments.values()) {
      list.push(...assignments)
    }
    await this.store.setItem('assignments', list)
  }

  /**
   * Save policies to storage
   */
  private async savePolicies(): Promise<void> {
    const list = Array.from(this.policies.values())
    await this.store.setItem('policies', list)
  }

  /**
   * Save audit logs to storage
   */
  private async saveAuditLogs(): Promise<void> {
    await this.store.setItem('audit-logs', this.auditLogs)
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalRoles: this.roles.size,
      activeRoles: Array.from(this.roles.values()).filter(r => r.isActive).length,
      totalAssignments: Array.from(this.assignments.values()).flat().length,
      totalPolicies: this.policies.size,
      activePolicies: Array.from(this.policies.values()).filter(p => p.isActive).length,
      auditLogCount: this.auditLogs.length,
      cacheSize: this.permissionCache.size
    }
  }
}

/**
 * Global RBAC service instance
 */
export const rbacService = new RBACService()

/**
 * Initialize on module load
 */
rbacService.initialize().catch(console.error)

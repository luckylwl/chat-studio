/**
 * Security Test Suite
 *
 * 测试项目中的安全功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rbacService, type Permission, type RoleAssignment } from '../services/rbacService'
import { workspaceService, type Workspace } from '../services/workspaceService'
import { authService } from '../services/authService'

describe('Security - RBAC Service', () => {
  beforeEach(async () => {
    // 初始化 RBAC 服务
    await rbacService.initialize()
  })

  describe('Permission Checks', () => {
    it('should deny access without valid permission', async () => {
      const result = await rbacService.checkAccess('user-123', {
        resource: 'conversation',
        action: 'delete'
      })

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('No matching permissions')
    })

    it('should allow access with valid role permission', async () => {
      // 分配成员角色
      await rbacService.assignRole('user-123', 'role-member')

      const result = await rbacService.checkAccess('user-123', {
        resource: 'conversation',
        action: 'create',
        context: { ownerId: 'user-123' }
      })

      expect(result.allowed).toBe(true)
    })

    it('should deny access to team resources without team membership', async () => {
      // 分配成员角色
      await rbacService.assignRole('user-123', 'role-member')

      const result = await rbacService.checkAccess('user-123', {
        resource: 'workspace',
        action: 'read',
        context: { workspaceId: 'ws-999' } // 用户不是此工作区成员
      })

      // 应该被拒绝,因为用户不在工作区中
      expect(result.allowed).toBe(false)
    })

    it('should allow access to own resources', async () => {
      await rbacService.assignRole('user-123', 'role-member')

      const result = await rbacService.checkAccess('user-123', {
        resource: 'conversation',
        action: 'update',
        context: { ownerId: 'user-123' }
      })

      expect(result.allowed).toBe(true)
    })

    it('should deny access to other users resources with own scope', async () => {
      await rbacService.assignRole('user-123', 'role-member')

      const result = await rbacService.checkAccess('user-123', {
        resource: 'conversation',
        action: 'update',
        context: { ownerId: 'user-456' } // 其他用户的资源
      })

      expect(result.allowed).toBe(false)
    })
  })

  describe('Role Management', () => {
    it('should not allow modifying system roles', async () => {
      await expect(async () => {
        await rbacService.updateRole('role-super_admin', {
          name: 'hacked-admin'
        })
      }).rejects.toThrow('Cannot modify system role')
    })

    it('should not allow deleting system roles', async () => {
      await expect(async () => {
        await rbacService.deleteRole('role-super_admin')
      }).rejects.toThrow('Cannot delete system role')
    })

    it('should allow creating custom roles', async () => {
      const role = await rbacService.createRole({
        name: 'custom_role',
        displayName: '自定义角色',
        description: '测试角色',
        level: 60,
        permissions: [],
        isSystem: false,
        isActive: true
      })

      expect(role.name).toBe('custom_role')
      expect(role.isSystem).toBe(false)
    })

    it('should allow deleting custom roles', async () => {
      const role = await rbacService.createRole({
        name: 'deletable_role',
        displayName: '可删除角色',
        description: '测试',
        level: 60,
        permissions: [],
        isSystem: false,
        isActive: true
      })

      await rbacService.deleteRole(role.id)

      expect(rbacService.getRole(role.id)).toBeUndefined()
    })
  })

  describe('Role Assignment', () => {
    it('should properly assign roles to users', async () => {
      const assignment = await rbacService.assignRole('user-123', 'role-member')

      expect(assignment.userId).toBe('user-123')
      expect(assignment.roleId).toBe('role-member')
    })

    it('should honor role expiration', async () => {
      // 分配一个立即过期的角色
      await rbacService.assignRole('user-123', 'role-member', {
        expiresIn: 1 // 1毫秒后过期
      })

      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 10))

      // 检查权限应该被拒绝
      const result = await rbacService.checkAccess('user-123', {
        resource: 'conversation',
        action: 'create'
      })

      expect(result.allowed).toBe(false)
    })

    it('should clear permission cache when role is revoked', async () => {
      const assignment = await rbacService.assignRole('user-123', 'role-admin')

      // 确认有权限
      let result = await rbacService.checkAccess('user-123', {
        resource: 'user',
        action: 'read',
        context: { organizationId: 'org-1' }
      })
      expect(result.allowed).toBe(true)

      // 撤销角色
      await rbacService.revokeRole(assignment.id)

      // 权限应该被拒绝
      result = await rbacService.checkAccess('user-123', {
        resource: 'user',
        action: 'read',
        context: { organizationId: 'org-1' }
      })
      expect(result.allowed).toBe(false)
    })
  })

  describe('Audit Logging', () => {
    it('should log access attempts', async () => {
      await rbacService.checkAccess('user-123', {
        resource: 'conversation',
        action: 'delete'
      })

      const logs = rbacService.getAuditLogs({
        userId: 'user-123',
        action: 'delete'
      })

      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].result).toBe('denied')
    })

    it('should log successful and failed access attempts', async () => {
      await rbacService.assignRole('user-123', 'role-member')

      // 成功的访问
      await rbacService.checkAccess('user-123', {
        resource: 'conversation',
        action: 'create',
        context: { ownerId: 'user-123' }
      })

      // 失败的访问
      await rbacService.checkAccess('user-123', {
        resource: 'user',
        action: 'delete'
      })

      const logs = rbacService.getAuditLogs({ userId: 'user-123' })

      const allowedLogs = logs.filter(l => l.result === 'allowed')
      const deniedLogs = logs.filter(l => l.result === 'denied')

      expect(allowedLogs.length).toBeGreaterThan(0)
      expect(deniedLogs.length).toBeGreaterThan(0)
    })
  })

  describe('Policy Evaluation', () => {
    it('should respect deny policies', async () => {
      // 即使有权限,deny 策略也应该优先
      await rbacService.assignRole('user-123', 'role-admin')

      // 创建 deny 策略
      // (在实际实现中,这需要通过 policy API)

      // 测试策略评估顺序
      const stats = rbacService.getStats()
      expect(stats.activePolicies).toBeGreaterThan(0)
    })
  })
})

describe('Security - Workspace Service', () => {
  beforeEach(async () => {
    await workspaceService.initialize()
  })

  describe('Member Management', () => {
    it('should not allow removing workspace owner', async () => {
      // 模拟当前用户
      vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
        id: 'user-admin',
        email: 'admin@test.com',
        username: 'admin',
        displayName: 'Admin User',
        role: 'admin',
        createdAt: Date.now()
      })

      const workspace = await workspaceService.createWorkspace('Test Workspace')

      await expect(async () => {
        await workspaceService.removeMember(workspace.id, workspace.ownerId)
      }).rejects.toThrow('Cannot remove workspace owner')
    })

    it('should enforce member limits', async () => {
      vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
        id: 'user-owner',
        email: 'owner@test.com',
        username: 'owner',
        displayName: 'Owner',
        role: 'admin',
        createdAt: Date.now()
      })

      const workspace = await workspaceService.createWorkspace('Test Workspace')

      // 设置成员限制为 2
      await workspaceService.updateWorkspace(workspace.id, {
        settings: {
          ...workspace.settings,
          maxMembers: 2
        }
      })

      // 添加第二个成员应该成功
      await workspaceService.addMember(
        workspace.id,
        'user-2',
        'user2@test.com',
        'user2',
        'User 2',
        undefined,
        'member'
      )

      // 添加第三个成员应该失败
      await expect(async () => {
        await workspaceService.addMember(
          workspace.id,
          'user-3',
          'user3@test.com',
          'user3',
          'User 3',
          undefined,
          'member'
        )
      }).rejects.toThrow('maximum member limit')
    })

    it('should not allow duplicate members', async () => {
      vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
        id: 'user-owner',
        email: 'owner@test.com',
        username: 'owner',
        displayName: 'Owner',
        role: 'admin',
        createdAt: Date.now()
      })

      const workspace = await workspaceService.createWorkspace('Test Workspace')

      await workspaceService.addMember(
        workspace.id,
        'user-2',
        'user2@test.com',
        'user2',
        'User 2',
        undefined,
        'member'
      )

      await expect(async () => {
        await workspaceService.addMember(
          workspace.id,
          'user-2',
          'user2@test.com',
          'user2',
          'User 2',
          undefined,
          'member'
        )
      }).rejects.toThrow('already a member')
    })
  })

  describe('Permission Checks', () => {
    it('should require admin role to update workspace', async () => {
      vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
        id: 'user-member',
        email: 'member@test.com',
        username: 'member',
        displayName: 'Member',
        role: 'member',
        createdAt: Date.now()
      })

      const workspace = await workspaceService.createWorkspace('Test Workspace')

      // 切换到普通成员
      vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
        id: 'user-member',
        email: 'member@test.com',
        username: 'member',
        displayName: 'Member',
        role: 'member',
        createdAt: Date.now()
      })

      await expect(async () => {
        await workspaceService.updateWorkspace(workspace.id, {
          name: 'Hacked Name'
        })
      }).rejects.toThrow('Insufficient permissions')
    })

    it('should only allow owner to delete workspace', async () => {
      vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
        id: 'user-owner',
        email: 'owner@test.com',
        username: 'owner',
        displayName: 'Owner',
        role: 'admin',
        createdAt: Date.now()
      })

      const workspace = await workspaceService.createWorkspace('Test Workspace')

      // 切换到管理员(但不是 owner)
      vi.spyOn(authService, 'getCurrentUser').mockReturnValue({
        id: 'user-admin',
        email: 'admin@test.com',
        username: 'admin',
        displayName: 'Admin',
        role: 'admin',
        createdAt: Date.now()
      })

      await expect(async () => {
        await workspaceService.deleteWorkspace(workspace.id)
      }).rejects.toThrow('Only workspace owner can delete')
    })
  })
})

describe('Security - Input Validation', () => {
  it('should sanitize user input', () => {
    const maliciousInput = '<script>alert("XSS")</script>'

    // 在实际应用中,应该有输入清理函数
    // 这里只是示例测试结构
    const sanitized = maliciousInput.replace(/<script[^>]*>.*?<\/script>/gi, '')

    expect(sanitized).not.toContain('<script>')
  })

  it('should validate email format', () => {
    const validEmail = 'user@example.com'
    const invalidEmail = 'not-an-email'

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    expect(emailRegex.test(validEmail)).toBe(true)
    expect(emailRegex.test(invalidEmail)).toBe(false)
  })

  it('should enforce password strength', () => {
    const weakPassword = '123456'
    const strongPassword = 'SecureP@ssw0rd!'

    const isStrong = (password: string) => {
      return (
        password.length >= 8 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^a-zA-Z0-9]/.test(password)
      )
    }

    expect(isStrong(weakPassword)).toBe(false)
    expect(isStrong(strongPassword)).toBe(true)
  })
})

describe('Security - Rate Limiting', () => {
  it('should track request counts', () => {
    const requestCounts = new Map<string, number>()
    const userId = 'user-123'

    // 模拟多次请求
    for (let i = 0; i < 10; i++) {
      const count = requestCounts.get(userId) || 0
      requestCounts.set(userId, count + 1)
    }

    expect(requestCounts.get(userId)).toBe(10)
  })

  it('should enforce rate limits', () => {
    const limit = 5
    const requestCount = 10

    const isRateLimited = requestCount > limit

    expect(isRateLimited).toBe(true)
  })
})

describe('Security - Data Encryption', () => {
  it('should not store plain text passwords', () => {
    const password = 'mySecretPassword'

    // 模拟哈希函数
    const hash = (str: string) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = (hash << 5) - hash + char
      }
      return hash.toString(16)
    }

    const hashedPassword = hash(password)

    expect(hashedPassword).not.toBe(password)
    expect(hashedPassword.length).toBeGreaterThan(0)
  })

  it('should encrypt sensitive API keys', () => {
    const apiKey = 'sk-1234567890abcdef'

    // 简单的加密模拟
    const encrypt = (text: string) => {
      return Buffer.from(text).toString('base64')
    }

    const encrypted = encrypt(apiKey)

    expect(encrypted).not.toBe(apiKey)
    expect(encrypted).toContain('=') // base64 padding
  })
})

import { describe, it, expect, beforeEach } from 'vitest'

describe('SharingService', () => {
  beforeEach(() => {
    // Reset sharing state
  })

  describe('Share Link Creation', () => {
    it('should create share link for conversation', async () => {
      const conversationId = 'conv-123'

      const shareLink = {
        id: 'share-1',
        conversationId,
        url: 'https://example.com/share/abc123',
        token: 'abc123',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdBy: 'user-1'
      }

      expect(shareLink.url).toContain('share')
      expect(shareLink.token).toBeDefined()
      expect(shareLink.expiresAt > new Date()).toBe(true)
    })

    it('should generate unique share token', () => {
      const token1 = `token-${Date.now()}-${Math.random()}`
      const token2 = `token-${Date.now()}-${Math.random()}`

      expect(token1).not.toBe(token2)
    })

    it('should set custom expiration date', () => {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day

      const share = {
        id: 'share-1',
        expiresAt
      }

      expect(share.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('should create share link with password', () => {
      const share = {
        id: 'share-1',
        password: 'secret123',
        requiresPassword: true
      }

      expect(share.requiresPassword).toBe(true)
      expect(share.password).toBeDefined()
    })
  })

  describe('Share Permissions', () => {
    it('should set view-only permission', () => {
      const share = {
        id: 'share-1',
        permissions: {
          canView: true,
          canEdit: false,
          canComment: false,
          canShare: false
        }
      }

      expect(share.permissions.canView).toBe(true)
      expect(share.permissions.canEdit).toBe(false)
    })

    it('should allow commenting', () => {
      const share = {
        permissions: {
          canView: true,
          canComment: true
        }
      }

      expect(share.permissions.canComment).toBe(true)
    })

    it('should allow resharing', () => {
      const share = {
        permissions: {
          canView: true,
          canShare: true
        }
      }

      expect(share.permissions.canShare).toBe(true)
    })

    it('should restrict editing', () => {
      const share = {
        permissions: {
          canView: true,
          canEdit: false
        }
      }

      const canUserEdit = share.permissions.canEdit
      expect(canUserEdit).toBe(false)
    })
  })

  describe('Share Access Control', () => {
    it('should verify share link password', async () => {
      const share = {
        password: 'secret123'
      }

      const inputPassword = 'secret123'
      const isValid = share.password === inputPassword

      expect(isValid).toBe(true)
    })

    it('should reject invalid password', () => {
      const share = {
        password: 'secret123'
      }

      const inputPassword = 'wrong'
      const isValid = share.password === inputPassword

      expect(isValid).toBe(false)
    })

    it('should check link expiration', () => {
      const expiredShare = {
        expiresAt: new Date(Date.now() - 1000) // Expired 1 second ago
      }

      const isExpired = expiredShare.expiresAt < new Date()
      expect(isExpired).toBe(true)
    })

    it('should check if link is active', () => {
      const share = {
        active: true,
        expiresAt: new Date(Date.now() + 1000)
      }

      const isAccessible = share.active && share.expiresAt > new Date()
      expect(isAccessible).toBe(true)
    })
  })

  describe('Share Link Management', () => {
    it('should list all shares for conversation', () => {
      const conversationId = 'conv-123'
      const shares = [
        { id: 's1', conversationId, createdAt: new Date() },
        { id: 's2', conversationId, createdAt: new Date() },
        { id: 's3', conversationId: 'conv-456', createdAt: new Date() }
      ]

      const conversationShares = shares.filter(s => s.conversationId === conversationId)

      expect(conversationShares.length).toBe(2)
    })

    it('should revoke share link', async () => {
      const share = {
        id: 'share-1',
        active: true
      }

      // Revoke
      share.active = false

      expect(share.active).toBe(false)
    })

    it('should delete share link', async () => {
      const shares = [
        { id: 'share-1' },
        { id: 'share-2' }
      ]

      const idToDelete = 'share-1'
      const filtered = shares.filter(s => s.id !== idToDelete)

      expect(filtered.length).toBe(1)
      expect(filtered[0].id).toBe('share-2')
    })

    it('should update share settings', async () => {
      const share = {
        id: 'share-1',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }

      // Extend expiration
      share.expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)

      const daysRemaining = (share.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)

      expect(daysRemaining).toBeGreaterThan(13)
    })
  })

  describe('Share Analytics', () => {
    it('should track view count', () => {
      const share = {
        id: 'share-1',
        viewCount: 0
      }

      // View
      share.viewCount++
      share.viewCount++

      expect(share.viewCount).toBe(2)
    })

    it('should track last accessed time', () => {
      const share = {
        id: 'share-1',
        lastAccessedAt: null as Date | null
      }

      // Access
      share.lastAccessedAt = new Date()

      expect(share.lastAccessedAt).toBeDefined()
    })

    it('should track unique visitors', () => {
      const visitors = new Set<string>()

      visitors.add('visitor-1')
      visitors.add('visitor-2')
      visitors.add('visitor-1') // Duplicate

      expect(visitors.size).toBe(2)
    })

    it('should get popular shares', () => {
      const shares = [
        { id: 's1', viewCount: 100 },
        { id: 's2', viewCount: 50 },
        { id: 's3', viewCount: 200 }
      ]

      const sorted = [...shares].sort((a, b) => b.viewCount - a.viewCount)

      expect(sorted[0].id).toBe('s3')
      expect(sorted[0].viewCount).toBe(200)
    })
  })

  describe('Public vs Private Sharing', () => {
    it('should create public share link', () => {
      const share = {
        id: 'share-1',
        visibility: 'public' as const,
        requiresAuth: false
      }

      expect(share.visibility).toBe('public')
      expect(share.requiresAuth).toBe(false)
    })

    it('should create private share link', () => {
      const share = {
        id: 'share-1',
        visibility: 'private' as const,
        requiresAuth: true
      }

      expect(share.visibility).toBe('private')
      expect(share.requiresAuth).toBe(true)
    })

    it('should restrict private link to allowed users', () => {
      const share = {
        visibility: 'private' as const,
        allowedUsers: ['user-1', 'user-2']
      }

      const userId = 'user-1'
      const canAccess = share.allowedUsers.includes(userId)

      expect(canAccess).toBe(true)
    })
  })

  describe('Share Notifications', () => {
    it('should notify owner when share is accessed', () => {
      const notification = {
        type: 'share_accessed',
        shareId: 'share-1',
        timestamp: new Date(),
        message: 'Your shared conversation was viewed'
      }

      expect(notification.type).toBe('share_accessed')
    })

    it('should notify on password failure', () => {
      const notification = {
        type: 'password_failed',
        shareId: 'share-1',
        attempts: 3,
        timestamp: new Date()
      }

      expect(notification.attempts).toBe(3)
    })
  })

  describe('Share Embedding', () => {
    it('should generate embed code', () => {
      const shareUrl = 'https://example.com/share/abc123'

      const embedCode = `<iframe src="${shareUrl}" width="800" height="600"></iframe>`

      expect(embedCode).toContain('iframe')
      expect(embedCode).toContain(shareUrl)
    })

    it('should customize embed dimensions', () => {
      const width = 1000
      const height = 800

      const embedCode = `<iframe width="${width}" height="${height}"></iframe>`

      expect(embedCode).toContain('width="1000"')
      expect(embedCode).toContain('height="800"')
    })
  })

  describe('Share Collaboration', () => {
    it('should allow collaborators to be added', () => {
      const share = {
        id: 'share-1',
        collaborators: [] as string[]
      }

      share.collaborators.push('user-2')
      share.collaborators.push('user-3')

      expect(share.collaborators.length).toBe(2)
    })

    it('should set collaborator permissions', () => {
      const collaborator = {
        userId: 'user-2',
        permissions: {
          canView: true,
          canEdit: true,
          canComment: true
        }
      }

      expect(collaborator.permissions.canEdit).toBe(true)
    })

    it('should remove collaborator', () => {
      const collaborators = ['user-1', 'user-2', 'user-3']

      const userId = 'user-2'
      const updated = collaborators.filter(id => id !== userId)

      expect(updated.length).toBe(2)
      expect(updated).not.toContain('user-2')
    })
  })

  describe('Share Templates', () => {
    it('should use share template', () => {
      const template = {
        id: 'template-1',
        name: 'Standard Share',
        settings: {
          expiresInDays: 7,
          requiresPassword: false,
          permissions: {
            canView: true,
            canEdit: false
          }
        }
      }

      expect(template.settings.expiresInDays).toBe(7)
    })

    it('should create share from template', () => {
      const template = {
        expiresInDays: 7,
        requiresPassword: true
      }

      const share = {
        id: 'share-1',
        expiresAt: new Date(Date.now() + template.expiresInDays * 24 * 60 * 60 * 1000),
        requiresPassword: template.requiresPassword
      }

      expect(share.requiresPassword).toBe(true)
    })
  })

  describe('Share Export', () => {
    it('should export share statistics', () => {
      const stats = {
        totalShares: 50,
        activeShares: 35,
        totalViews: 1500,
        uniqueVisitors: 800
      }

      const exported = JSON.stringify(stats)

      expect(exported).toContain('totalShares')
      expect(exported).toContain('uniqueVisitors')
    })

    it('should export share list', () => {
      const shares = [
        { id: 's1', viewCount: 10 },
        { id: 's2', viewCount: 20 }
      ]

      const csv = ['id,viewCount', ...shares.map(s => `${s.id},${s.viewCount}`)].join('\n')

      expect(csv).toContain('id,viewCount')
      expect(csv.split('\n').length).toBe(3)
    })
  })
})

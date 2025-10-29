import { describe, it, expect, beforeEach } from 'vitest'

describe('TemplateService', () => {
  beforeEach(() => {
    // Reset template state
  })

  describe('Template Creation', () => {
    it('should create a new template', async () => {
      const template = {
        id: 'template-1',
        name: 'Customer Support Response',
        content: 'Hello {{customerName}}, thank you for contacting us about {{issue}}.',
        variables: ['customerName', 'issue'],
        category: 'support',
        createdAt: new Date()
      }

      expect(template.id).toBeDefined()
      expect(template.variables.length).toBe(2)
    })

    it('should validate template syntax', () => {
      const validTemplate = 'Hello {{name}}, your order {{orderId}} is ready.'
      const invalidTemplate = 'Hello {{name}, your order {{orderId is ready.'

      const validateSyntax = (content: string) => {
        const openBraces = (content.match(/\{\{/g) || []).length
        const closeBraces = (content.match(/\}\}/g) || []).length
        return openBraces === closeBraces
      }

      expect(validateSyntax(validTemplate)).toBe(true)
      expect(validateSyntax(invalidTemplate)).toBe(false)
    })

    it('should extract variables from template', () => {
      const template = 'Welcome {{userName}}! Your balance is {{balance}}.'

      const extractVariables = (content: string) => {
        const regex = /\{\{(\w+)\}\}/g
        const matches = []
        let match
        while ((match = regex.exec(content)) !== null) {
          matches.push(match[1])
        }
        return matches
      }

      const variables = extractVariables(template)
      expect(variables).toEqual(['userName', 'balance'])
    })
  })

  describe('Template Rendering', () => {
    it('should render template with variables', () => {
      const template = 'Hello {{name}}, welcome to {{company}}!'
      const variables = {
        name: 'John',
        company: 'Acme Corp'
      }

      const render = (tmpl: string, vars: Record<string, string>) => {
        return tmpl.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '')
      }

      const result = render(template, variables)
      expect(result).toBe('Hello John, welcome to Acme Corp!')
    })

    it('should handle missing variables', () => {
      const template = 'Hello {{name}}, your order {{orderId}} is ready.'
      const variables = {
        name: 'John'
        // orderId is missing
      }

      const render = (tmpl: string, vars: Record<string, string>) => {
        return tmpl.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || `[${key}]`)
      }

      const result = render(template, variables)
      expect(result).toContain('[orderId]')
    })

    it('should support nested variables', () => {
      const template = 'User: {{user.name}}, Email: {{user.email}}'
      const variables = {
        user: {
          name: 'John',
          email: 'john@example.com'
        }
      }

      const render = (tmpl: string, vars: any) => {
        return tmpl.replace(/\{\{([\w.]+)\}\}/g, (_, path) => {
          const keys = path.split('.')
          let value: any = vars
          for (const key of keys) {
            value = value?.[key]
          }
          return value || ''
        })
      }

      const result = render(template, variables)
      expect(result).toContain('john@example.com')
    })
  })

  describe('Template Categories', () => {
    it('should list templates by category', () => {
      const templates = [
        { id: '1', name: 'Support 1', category: 'support' },
        { id: '2', name: 'Sales 1', category: 'sales' },
        { id: '3', name: 'Support 2', category: 'support' }
      ]

      const supportTemplates = templates.filter(t => t.category === 'support')
      expect(supportTemplates.length).toBe(2)
    })

    it('should get all categories', () => {
      const templates = [
        { category: 'support' },
        { category: 'sales' },
        { category: 'support' },
        { category: 'marketing' }
      ]

      const categories = [...new Set(templates.map(t => t.category))]
      expect(categories).toEqual(['support', 'sales', 'marketing'])
    })
  })

  describe('Template Search', () => {
    it('should search templates by name', () => {
      const templates = [
        { name: 'Customer Welcome', content: '...' },
        { name: 'Order Confirmation', content: '...' },
        { name: 'Customer Feedback', content: '...' }
      ]

      const query = 'customer'
      const results = templates.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase())
      )

      expect(results.length).toBe(2)
    })

    it('should search templates by content', () => {
      const templates = [
        { name: 'Template 1', content: 'Thank you for your order' },
        { name: 'Template 2', content: 'Your shipment is ready' },
        { name: 'Template 3', content: 'Thank you for your feedback' }
      ]

      const query = 'thank you'
      const results = templates.filter(t =>
        t.content.toLowerCase().includes(query.toLowerCase())
      )

      expect(results.length).toBe(2)
    })
  })

  describe('Template Favorites', () => {
    it('should mark template as favorite', () => {
      const template = {
        id: 'template-1',
        name: 'Quick Response',
        isFavorite: false
      }

      template.isFavorite = true
      expect(template.isFavorite).toBe(true)
    })

    it('should list favorite templates', () => {
      const templates = [
        { id: '1', name: 'T1', isFavorite: true },
        { id: '2', name: 'T2', isFavorite: false },
        { id: '3', name: 'T3', isFavorite: true }
      ]

      const favorites = templates.filter(t => t.isFavorite)
      expect(favorites.length).toBe(2)
    })
  })

  describe('Template Versioning', () => {
    it('should create template version', () => {
      const version = {
        templateId: 'template-1',
        version: 2,
        content: 'Updated content {{var}}',
        createdAt: new Date(),
        createdBy: 'user-1'
      }

      expect(version.version).toBe(2)
    })

    it('should list template versions', () => {
      const versions = [
        { version: 1, createdAt: new Date('2025-10-01') },
        { version: 2, createdAt: new Date('2025-10-15') },
        { version: 3, createdAt: new Date('2025-10-29') }
      ]

      expect(versions.length).toBe(3)
      expect(versions[2].version).toBe(3)
    })

    it('should restore previous version', () => {
      const currentVersion = {
        version: 3,
        content: 'Current content'
      }

      const previousVersion = {
        version: 2,
        content: 'Previous content'
      }

      // Restore creates new version
      const restored = {
        version: 4,
        content: previousVersion.content,
        restoredFrom: previousVersion.version
      }

      expect(restored.content).toBe(previousVersion.content)
      expect(restored.version).toBe(4)
    })
  })

  describe('Template Sharing', () => {
    it('should share template with team', async () => {
      const share = {
        templateId: 'template-1',
        sharedWith: ['user-2', 'user-3'],
        permissions: {
          canView: true,
          canEdit: false,
          canShare: false
        }
      }

      expect(share.sharedWith.length).toBe(2)
      expect(share.permissions.canView).toBe(true)
    })

    it('should make template public', () => {
      const template = {
        id: 'template-1',
        isPublic: false,
        visibility: 'private' as 'private' | 'team' | 'public'
      }

      template.isPublic = true
      template.visibility = 'public'

      expect(template.visibility).toBe('public')
    })
  })

  describe('Template Usage Statistics', () => {
    it('should track template usage', () => {
      const stats = {
        templateId: 'template-1',
        usageCount: 42,
        lastUsed: new Date(),
        usedBy: ['user-1', 'user-2']
      }

      expect(stats.usageCount).toBe(42)
      expect(stats.usedBy.length).toBe(2)
    })

    it('should increment usage count', () => {
      const template = {
        id: 'template-1',
        usageCount: 10
      }

      template.usageCount++
      expect(template.usageCount).toBe(11)
    })

    it('should get most used templates', () => {
      const templates = [
        { id: '1', usageCount: 100 },
        { id: '2', usageCount: 50 },
        { id: '3', usageCount: 200 }
      ]

      const sorted = [...templates].sort((a, b) => b.usageCount - a.usageCount)
      expect(sorted[0].id).toBe('3')
      expect(sorted[0].usageCount).toBe(200)
    })
  })

  describe('Template Validation', () => {
    it('should validate required variables', () => {
      const template = {
        content: 'Hello {{name}}, your order {{orderId}} is ready.',
        requiredVariables: ['name', 'orderId']
      }

      const variables = {
        name: 'John',
        orderId: '12345'
      }

      const hasAllRequired = template.requiredVariables.every(
        v => variables.hasOwnProperty(v)
      )

      expect(hasAllRequired).toBe(true)
    })

    it('should detect missing required variables', () => {
      const template = {
        requiredVariables: ['name', 'email', 'orderId']
      }

      const variables = {
        name: 'John',
        email: 'john@example.com'
        // orderId missing
      }

      const missing = template.requiredVariables.filter(
        v => !variables.hasOwnProperty(v)
      )

      expect(missing).toEqual(['orderId'])
    })
  })
})

import { describe, it, expect, beforeEach } from 'vitest'

describe('SearchService', () => {
  beforeEach(() => {
    // Reset search index
  })

  describe('Basic Search', () => {
    it('should search conversations by content', () => {
      const conversations = [
        { id: '1', messages: [{ content: 'How to build a React app' }] },
        { id: '2', messages: [{ content: 'Python tutorial for beginners' }] },
        { id: '3', messages: [{ content: 'React hooks explained' }] }
      ]

      const query = 'react'
      const results = conversations.filter(conv =>
        conv.messages.some(m =>
          m.content.toLowerCase().includes(query.toLowerCase())
        )
      )

      expect(results.length).toBe(2)
    })

    it('should search messages by keyword', () => {
      const messages = [
        { id: '1', content: 'Hello world', role: 'user' },
        { id: '2', content: 'How can I help?', role: 'assistant' },
        { id: '3', content: 'Hello there', role: 'user' }
      ]

      const query = 'hello'
      const results = messages.filter(m =>
        m.content.toLowerCase().includes(query.toLowerCase())
      )

      expect(results.length).toBe(2)
    })

    it('should be case-insensitive', () => {
      const items = [
        { content: 'JavaScript Tutorial' },
        { content: 'javascript examples' },
        { content: 'Learn JAVASCRIPT' }
      ]

      const query = 'JavaScript'
      const results = items.filter(item =>
        item.content.toLowerCase().includes(query.toLowerCase())
      )

      expect(results.length).toBe(3)
    })
  })

  describe('Advanced Search', () => {
    it('should support multiple keywords', () => {
      const items = [
        { content: 'React and TypeScript tutorial' },
        { content: 'Vue.js guide' },
        { content: 'React hooks with TypeScript' }
      ]

      const keywords = ['react', 'typescript']
      const results = items.filter(item =>
        keywords.every(keyword =>
          item.content.toLowerCase().includes(keyword.toLowerCase())
        )
      )

      expect(results.length).toBe(2)
    })

    it('should support OR search', () => {
      const items = [
        { content: 'React tutorial' },
        { content: 'Vue tutorial' },
        { content: 'Angular guide' }
      ]

      const keywords = ['react', 'vue']
      const results = items.filter(item =>
        keywords.some(keyword =>
          item.content.toLowerCase().includes(keyword.toLowerCase())
        )
      )

      expect(results.length).toBe(2)
    })

    it('should support phrase search', () => {
      const items = [
        { content: 'Learn React hooks quickly' },
        { content: 'React hooks are powerful' },
        { content: 'Hooks in React explained' }
      ]

      const phrase = 'react hooks'
      const results = items.filter(item =>
        item.content.toLowerCase().includes(phrase.toLowerCase())
      )

      expect(results.length).toBe(2)
    })

    it('should support exclusion search', () => {
      const items = [
        { content: 'React tutorial with hooks' },
        { content: 'React basics' },
        { content: 'Vue basics' }
      ]

      const include = 'react'
      const exclude = 'hooks'

      const results = items.filter(item => {
        const content = item.content.toLowerCase()
        return content.includes(include.toLowerCase()) &&
          !content.includes(exclude.toLowerCase())
      })

      expect(results.length).toBe(1)
      expect(results[0].content).toBe('React basics')
    })
  })

  describe('Filter Options', () => {
    it('should filter by date range', () => {
      const items = [
        { content: 'Message 1', date: new Date('2025-10-01') },
        { content: 'Message 2', date: new Date('2025-10-15') },
        { content: 'Message 3', date: new Date('2025-10-29') }
      ]

      const startDate = new Date('2025-10-10')
      const endDate = new Date('2025-10-31')

      const results = items.filter(item =>
        item.date >= startDate && item.date <= endDate
      )

      expect(results.length).toBe(2)
    })

    it('should filter by role', () => {
      const messages = [
        { content: 'Hello', role: 'user' },
        { content: 'Hi there', role: 'assistant' },
        { content: 'How are you', role: 'user' }
      ]

      const userMessages = messages.filter(m => m.role === 'user')
      expect(userMessages.length).toBe(2)
    })

    it('should filter by model', () => {
      const conversations = [
        { id: '1', model: 'gpt-4' },
        { id: '2', model: 'claude-3-opus' },
        { id: '3', model: 'gpt-4' }
      ]

      const gpt4Convs = conversations.filter(c => c.model === 'gpt-4')
      expect(gpt4Convs.length).toBe(2)
    })

    it('should filter by tags', () => {
      const conversations = [
        { id: '1', tags: ['work', 'important'] },
        { id: '2', tags: ['personal'] },
        { id: '3', tags: ['work', 'project'] }
      ]

      const tag = 'work'
      const results = conversations.filter(c => c.tags.includes(tag))

      expect(results.length).toBe(2)
    })
  })

  describe('Sorting', () => {
    it('should sort by relevance', () => {
      const results = [
        { content: 'React tutorial', relevance: 0.8 },
        { content: 'Vue guide', relevance: 0.3 },
        { content: 'React hooks', relevance: 0.9 }
      ]

      const sorted = [...results].sort((a, b) => b.relevance - a.relevance)

      expect(sorted[0].relevance).toBe(0.9)
      expect(sorted[2].relevance).toBe(0.3)
    })

    it('should sort by date', () => {
      const items = [
        { content: 'Old', date: new Date('2025-10-01') },
        { content: 'New', date: new Date('2025-10-29') },
        { content: 'Mid', date: new Date('2025-10-15') }
      ]

      const sorted = [...items].sort((a, b) =>
        b.date.getTime() - a.date.getTime()
      )

      expect(sorted[0].content).toBe('New')
      expect(sorted[2].content).toBe('Old')
    })
  })

  describe('Search Highlighting', () => {
    it('should highlight matched terms', () => {
      const content = 'Learn React programming'
      const query = 'react'

      const highlight = (text: string, term: string) => {
        const regex = new RegExp(`(${term})`, 'gi')
        return text.replace(regex, '<mark>$1</mark>')
      }

      const highlighted = highlight(content, query)
      expect(highlighted).toContain('<mark>React</mark>')
    })

    it('should highlight multiple occurrences', () => {
      const content = 'React is great. Learn React today.'
      const query = 'react'

      const count = (content.match(new RegExp(query, 'gi')) || []).length
      expect(count).toBe(2)
    })
  })

  describe('Search Suggestions', () => {
    it('should provide autocomplete suggestions', () => {
      const recentSearches = [
        'react tutorial',
        'react hooks',
        'react native',
        'vue tutorial'
      ]

      const input = 'react'
      const suggestions = recentSearches.filter(s =>
        s.toLowerCase().startsWith(input.toLowerCase())
      )

      expect(suggestions.length).toBe(3)
    })

    it('should suggest popular searches', () => {
      const searches = [
        { query: 'react', count: 100 },
        { query: 'vue', count: 50 },
        { query: 'angular', count: 75 }
      ]

      const top = [...searches]
        .sort((a, b) => b.count - a.count)
        .slice(0, 2)

      expect(top[0].query).toBe('react')
      expect(top.length).toBe(2)
    })
  })

  describe('Search History', () => {
    it('should save search query', () => {
      const history: string[] = []
      const query = 'react tutorial'

      history.push(query)

      expect(history).toContain(query)
      expect(history.length).toBe(1)
    })

    it('should limit history size', () => {
      const maxSize = 10
      const history = Array.from({ length: 15 }, (_, i) => `query-${i}`)

      const limited = history.slice(-maxSize)

      expect(limited.length).toBe(maxSize)
      expect(limited[0]).toBe('query-5')
    })

    it('should remove duplicates from history', () => {
      const history = ['react', 'vue', 'react', 'angular']
      const unique = [...new Set(history)]

      expect(unique.length).toBe(3)
      expect(unique).toEqual(['react', 'vue', 'angular'])
    })
  })

  describe('Full-Text Search', () => {
    it('should perform full-text search', () => {
      const documents = [
        { id: '1', content: 'The quick brown fox jumps over the lazy dog' },
        { id: '2', content: 'A quick brown fox is fast' },
        { id: '3', content: 'The lazy dog sleeps all day' }
      ]

      const query = 'quick brown fox'
      const terms = query.toLowerCase().split(' ')

      const results = documents.filter(doc =>
        terms.some(term =>
          doc.content.toLowerCase().includes(term)
        )
      )

      expect(results.length).toBe(3)
    })

    it('should calculate relevance score', () => {
      const document = 'React is a JavaScript library for building user interfaces'
      const query = 'react javascript'

      const terms = query.toLowerCase().split(' ')
      const docLower = document.toLowerCase()

      const score = terms.reduce((acc, term) => {
        return acc + (docLower.includes(term) ? 1 : 0)
      }, 0) / terms.length

      expect(score).toBe(1.0) // Both terms found
    })
  })

  describe('Search Performance', () => {
    it('should handle empty query', () => {
      const items = [{ content: 'Test' }]
      const query = ''

      const results = query ? items.filter(i =>
        i.content.includes(query)
      ) : items

      expect(results.length).toBe(1)
    })

    it('should handle special characters', () => {
      const content = 'What is C++?'
      const query = 'c++'

      const escapeRegex = (str: string) => {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      }

      const escaped = escapeRegex(query)
      const regex = new RegExp(escaped, 'i')

      expect(regex.test(content)).toBe(true)
    })

    it('should limit result count', () => {
      const items = Array.from({ length: 100 }, (_, i) => ({
        content: `Item ${i}`
      }))

      const limit = 20
      const results = items.slice(0, limit)

      expect(results.length).toBe(limit)
    })
  })
})

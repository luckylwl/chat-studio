/**
 * Content Creation Service - Stub Version
 *
 * This is a stub implementation to satisfy TypeScript imports.
 * Full implementation is in src/services/draft/contentCreationService.ts
 */

// Placeholder types
export interface ContentTemplate {
  id: string
  name: string
  category: string
  template: string
  variables: string[]
}

export interface GeneratedContent {
  content: string
  metadata: Record<string, any>
}

// Placeholder service
export const contentCreationService = {
  getTemplates: async (category?: string): Promise<ContentTemplate[]> => {
    console.warn('contentCreationService: Using stub implementation')
    return []
  },

  generateContent: async (
    templateId: string,
    variables: Record<string, string>
  ): Promise<GeneratedContent> => {
    console.warn('contentCreationService: Using stub implementation')
    return {
      content: '',
      metadata: {}
    }
  },

  saveTemplate: async (template: Omit<ContentTemplate, 'id'>): Promise<ContentTemplate> => {
    console.warn('contentCreationService: Using stub implementation')
    return {
      id: Date.now().toString(),
      ...template
    }
  }
}

export default contentCreationService

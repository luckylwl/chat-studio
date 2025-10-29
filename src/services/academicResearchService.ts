/**
 * Academic Research Service - Stub Version
 *
 * This is a stub implementation to satisfy TypeScript imports.
 * Full implementation is in src/services/draft/academicResearchService.ts
 */

// Placeholder types
export interface ResearchPaper {
  id: string
  title: string
  authors: string[]
  abstract: string
  url: string
  citationCount: number
  publishedDate: string
}

export interface ResearchQuery {
  query: string
  maxResults?: number
  sortBy?: 'relevance' | 'date' | 'citations'
}

// Placeholder service
export const academicResearchService = {
  searchPapers: async (query: ResearchQuery): Promise<ResearchPaper[]> => {
    console.warn('academicResearchService: Using stub implementation')
    return []
  },

  getPaperDetails: async (paperId: string): Promise<ResearchPaper | null> => {
    console.warn('academicResearchService: Using stub implementation')
    return null
  }
}

export default academicResearchService

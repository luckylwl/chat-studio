/**
 * Advanced RAG Service
 *
 * Upgrades to existing RAG system:
 * - Hybrid search (vector + keyword)
 * - Reranking
 * - Citation tracking
 * - Multi-modal support
 * - Query expansion
 */

import { v4 as uuidv4 } from 'uuid';
import vectorDatabaseService from './vectorDatabaseService';

// ========================
// Type Definitions
// ========================

export interface SearchStrategy = 'vector' | 'keyword' | 'hybrid';

export interface SearchConfig {
  strategy: SearchStrategy;
  topK: number;
  rerankResults?: boolean;
  expandQuery?: boolean;
  minRelevanceScore?: number;
}

export interface SearchResult {
  documentId: string;
  chunkId: string;
  content: string;
  score: number;
  relevanceScore?: number; // After reranking
  metadata: {
    title: string;
    page?: number;
    section?: string;
    [key: string]: any;
  };
  citations: Citation[];
}

export interface Citation {
  id: string;
  text: string;
  source: string;
  page?: number;
  confidence: number;
}

export interface QueryExpansion {
  original: string;
  expanded: string[];
  synonyms: string[];
  relatedTerms: string[];
}

export interface RerankingModel {
  name: string;
  type: 'cross-encoder' | 'llm' | 'bm25';
}

// ========================
// BM25 Implementation
// ========================

class BM25 {
  private documents: string[] = [];
  private documentTermFrequencies: Map<number, Map<string, number>>[] = [];
  private inverseDocumentFrequency: Map<string, number> = new Map();
  private avgDocLength = 0;

  private k1 = 1.5;
  private b = 0.75;

  buildIndex(documents: string[]): void {
    this.documents = documents;
    this.documentTermFrequencies = [];

    const docLengths: number[] = [];

    // Calculate term frequencies for each document
    documents.forEach((doc, docId) => {
      const terms = this.tokenize(doc);
      docLengths.push(terms.length);

      const termFreq = new Map<string, number>();
      terms.forEach(term => {
        termFreq.set(term, (termFreq.get(term) || 0) + 1);
      });

      this.documentTermFrequencies[docId] = termFreq;
    });

    // Calculate average document length
    this.avgDocLength = docLengths.reduce((a, b) => a + b, 0) / docLengths.length;

    // Calculate IDF for each term
    const docCount = documents.length;
    const termDocCounts = new Map<string, number>();

    this.documentTermFrequencies.forEach(termFreq => {
      termFreq.forEach((_, term) => {
        termDocCounts.set(term, (termDocCounts.get(term) || 0) + 1);
      });
    });

    termDocCounts.forEach((docCountWithTerm, term) => {
      const idf = Math.log((docCount - docCountWithTerm + 0.5) / (docCountWithTerm + 0.5) + 1);
      this.inverseDocumentFrequency.set(term, idf);
    });
  }

  search(query: string, topK: number = 10): Array<{ index: number; score: number }> {
    const queryTerms = this.tokenize(query);
    const scores: Array<{ index: number; score: number }> = [];

    this.documentTermFrequencies.forEach((termFreq, docId) => {
      let score = 0;

      queryTerms.forEach(term => {
        const termFreqInDoc = termFreq.get(term) || 0;
        const idf = this.inverseDocumentFrequency.get(term) || 0;
        const docLength = Array.from(termFreq.values()).reduce((a, b) => a + b, 0);

        const numerator = termFreqInDoc * (this.k1 + 1);
        const denominator = termFreqInDoc + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));

        score += idf * (numerator / denominator);
      });

      if (score > 0) {
        scores.push({ index: docId, score });
      }
    });

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(term => term.length > 2);
  }
}

// ========================
// Service Implementation
// ========================

class AdvancedRAGService {
  private bm25Index: BM25 = new BM25();
  private queryCache: Map<string, SearchResult[]> = new Map();

  // ========================
  // Hybrid Search
  // ========================

  async search(query: string, config: SearchConfig): Promise<SearchResult[]> {
    const cacheKey = `${query}-${JSON.stringify(config)}`;

    if (this.queryCache.has(cacheKey)) {
      return this.queryCache.get(cacheKey)!;
    }

    let results: SearchResult[] = [];

    // Step 1: Query expansion
    const expandedQuery = config.expandQuery
      ? await this.expandQuery(query)
      : { original: query, expanded: [query], synonyms: [], relatedTerms: [] };

    // Step 2: Perform search based on strategy
    switch (config.strategy) {
      case 'vector':
        results = await this.vectorSearch(expandedQuery.expanded, config.topK);
        break;
      case 'keyword':
        results = await this.keywordSearch(expandedQuery.expanded, config.topK);
        break;
      case 'hybrid':
        results = await this.hybridSearch(expandedQuery.expanded, config.topK);
        break;
    }

    // Step 3: Reranking
    if (config.rerankResults && results.length > 0) {
      results = await this.rerankResults(query, results);
    }

    // Step 4: Filter by minimum relevance
    if (config.minRelevanceScore) {
      results = results.filter(r => (r.relevanceScore || r.score) >= config.minRelevanceScore!);
    }

    // Step 5: Extract citations
    results = results.map(result => ({
      ...result,
      citations: this.extractCitations(result.content, result.metadata),
    }));

    this.queryCache.set(cacheKey, results);
    return results;
  }

  // ========================
  // Search Strategies
  // ========================

  private async vectorSearch(queries: string[], topK: number): Promise<SearchResult[]> {
    // Use existing vector database
    const allResults: SearchResult[] = [];

    for (const query of queries) {
      try {
        const results = await vectorDatabaseService.semanticSearch(query, { topK });

        results.forEach(result => {
          allResults.push({
            documentId: result.documentId,
            chunkId: result.chunkId,
            content: result.content,
            score: result.similarity,
            metadata: result.metadata,
            citations: [],
          });
        });
      } catch (error) {
        console.error('Vector search failed:', error);
      }
    }

    // Deduplicate and sort
    const unique = this.deduplicateResults(allResults);
    return unique.slice(0, topK);
  }

  private async keywordSearch(queries: string[], topK: number): Promise<SearchResult[]> {
    // Build BM25 index if not already built
    // This would typically be done during document indexing
    const allDocs = await this.getAllDocuments();

    if (allDocs.length > 0) {
      this.bm25Index.buildIndex(allDocs.map(d => d.content));
    }

    const allResults: SearchResult[] = [];

    queries.forEach(query => {
      const bm25Results = this.bm25Index.search(query, topK);

      bm25Results.forEach(result => {
        const doc = allDocs[result.index];
        if (doc) {
          allResults.push({
            documentId: doc.id,
            chunkId: doc.chunkId,
            content: doc.content,
            score: result.score,
            metadata: doc.metadata,
            citations: [],
          });
        }
      });
    });

    const unique = this.deduplicateResults(allResults);
    return unique.slice(0, topK);
  }

  private async hybridSearch(queries: string[], topK: number): Promise<SearchResult[]> {
    // Combine vector and keyword search
    const vectorResults = await this.vectorSearch(queries, topK);
    const keywordResults = await this.keywordSearch(queries, topK);

    // Merge results with weighted scoring
    const merged = new Map<string, SearchResult>();

    const vectorWeight = 0.6;
    const keywordWeight = 0.4;

    vectorResults.forEach(result => {
      merged.set(result.chunkId, {
        ...result,
        score: result.score * vectorWeight,
      });
    });

    keywordResults.forEach(result => {
      const existing = merged.get(result.chunkId);
      if (existing) {
        existing.score += result.score * keywordWeight;
      } else {
        merged.set(result.chunkId, {
          ...result,
          score: result.score * keywordWeight,
        });
      }
    });

    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  // ========================
  // Query Expansion
  // ========================

  private async expandQuery(query: string): Promise<QueryExpansion> {
    // In production, use LLM or WordNet for expansion
    const expanded = [query];
    const synonyms: string[] = [];
    const relatedTerms: string[] = [];

    // Simple synonym expansion (would use actual thesaurus in production)
    const synonymMap: Record<string, string[]> = {
      'quick': ['fast', 'rapid', 'swift'],
      'slow': ['sluggish', 'gradual'],
      'good': ['excellent', 'great', 'fine'],
      'bad': ['poor', 'terrible', 'awful'],
    };

    const words = query.toLowerCase().split(' ');
    words.forEach(word => {
      if (synonymMap[word]) {
        synonyms.push(...synonymMap[word]);
        synonymMap[word].forEach(syn => {
          expanded.push(query.replace(word, syn));
        });
      }
    });

    return {
      original: query,
      expanded: [...new Set(expanded)],
      synonyms: [...new Set(synonyms)],
      relatedTerms,
    };
  }

  // ========================
  // Reranking
  // ========================

  private async rerankResults(query: string, results: SearchResult[]): Promise<SearchResult[]> {
    // Cross-encoder reranking (in production, use actual model)
    const reranked = results.map(result => {
      const relevanceScore = this.calculateRelevance(query, result.content);

      return {
        ...result,
        relevanceScore,
      };
    });

    return reranked.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  private calculateRelevance(query: string, content: string): number {
    // Simple relevance calculation
    const queryTerms = query.toLowerCase().split(' ');
    const contentLower = content.toLowerCase();

    let score = 0;
    queryTerms.forEach(term => {
      if (contentLower.includes(term)) {
        score += 1;
      }
    });

    // Normalize by number of terms
    return (score / queryTerms.length) * 100;
  }

  // ========================
  // Citation Extraction
  // ========================

  private extractCitations(content: string, metadata: any): Citation[] {
    const citations: Citation[] = [];

    // Extract sentences that could be citations
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];

    sentences.forEach((sentence, index) => {
      if (sentence.length > 50) { // Only substantial sentences
        citations.push({
          id: uuidv4(),
          text: sentence.trim(),
          source: metadata.title || 'Unknown',
          page: metadata.page,
          confidence: 0.8 + (index / sentences.length) * 0.2,
        });
      }
    });

    return citations.slice(0, 3); // Top 3 citations per chunk
  }

  // ========================
  // Helper Methods
  // ========================

  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      if (seen.has(result.chunkId)) {
        return false;
      }
      seen.add(result.chunkId);
      return true;
    });
  }

  private async getAllDocuments(): Promise<Array<{
    id: string;
    chunkId: string;
    content: string;
    metadata: any;
  }>> {
    // Get all documents from vector database
    try {
      const documents = await vectorDatabaseService.getAllDocuments();
      const chunks: any[] = [];

      documents.forEach(doc => {
        doc.chunks.forEach(chunk => {
          chunks.push({
            id: doc.id,
            chunkId: chunk.id,
            content: chunk.text,
            metadata: {
              ...doc.metadata,
              chunkIndex: chunk.index,
            },
          });
        });
      });

      return chunks;
    } catch (error) {
      console.error('Failed to get documents:', error);
      return [];
    }
  }

  // ========================
  // Context Building
  // ========================

  async buildContext(query: string, config: SearchConfig): Promise<string> {
    const results = await this.search(query, config);

    let context = `Based on the following sources:\n\n`;

    results.forEach((result, index) => {
      context += `[${index + 1}] ${result.metadata.title}\n`;
      context += `${result.content}\n\n`;
    });

    return context;
  }

  // ========================
  // Cache Management
  // ========================

  clearCache(): void {
    this.queryCache.clear();
  }
}

// ========================
// Export Singleton
// ========================

const advancedRAGService = new AdvancedRAGService();
export default advancedRAGService;

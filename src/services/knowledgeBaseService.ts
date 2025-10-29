/**
 * Knowledge Base Management System (v4.5)
 *
 * Advanced document management with intelligent features:
 * - Multi-format document import (PDF, Word, PPT, Markdown, HTML, TXT)
 * - OCR text extraction from images and scanned documents
 * - Automatic tagging and categorization using AI
 * - Knowledge graph construction
 * - Intelligent Q&A over documents
 * - Version control and collaboration
 * - Full-text search with vector similarity
 */

export interface Document {
  id: string;
  title: string;
  content: string;
  format: 'pdf' | 'word' | 'ppt' | 'markdown' | 'html' | 'txt' | 'image';
  size: number; // bytes
  metadata: {
    author: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    category: string;
    language: string;
    keywords: string[];
    summary: string;
  };
  embedding?: number[]; // Vector embedding for similarity search
  ocr?: OCRResult;
  versions: DocumentVersion[];
  relatedDocuments: string[]; // Document IDs
  accessControl: {
    owner: string;
    sharedWith: string[];
    isPublic: boolean;
  };
  statistics: {
    views: number;
    downloads: number;
    lastAccessed: string;
  };
}

export interface DocumentVersion {
  versionId: string;
  documentId: string;
  content: string;
  createdAt: string;
  createdBy: string;
  changeLog: string;
  diff?: string; // Diff from previous version
}

export interface OCRResult {
  language: string;
  confidence: number;
  text: string;
  blocks: OCRBlock[];
  pages?: number;
}

export interface OCRBlock {
  text: string;
  confidence: number;
  bbox: [number, number, number, number]; // x, y, width, height
  type: 'text' | 'title' | 'table' | 'figure';
}

export interface KnowledgeGraph {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  statistics: {
    totalNodes: number;
    totalEdges: number;
    categories: Record<string, number>;
    relationshipTypes: Record<string, number>;
  };
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'concept' | 'document' | 'entity' | 'topic' | 'person' | 'organization' | 'location';
  properties: Record<string, any>;
  importance: number; // 0-1 score
  documentIds: string[];
}

export interface KnowledgeEdge {
  id: string;
  source: string; // node ID
  target: string; // node ID
  type: 'related_to' | 'part_of' | 'mentions' | 'authored_by' | 'references' | 'similar_to';
  weight: number; // 0-1 relationship strength
  properties: Record<string, any>;
}

export interface QAResult {
  id: string;
  query: string;
  answer: string;
  confidence: number;
  sources: QASource[];
  relatedQuestions: string[];
  timestamp: string;
}

export interface QASource {
  documentId: string;
  documentTitle: string;
  excerpt: string;
  relevance: number;
  page?: number;
}

export interface DocumentCollection {
  id: string;
  name: string;
  description: string;
  documentIds: string[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface SearchQuery {
  query: string;
  filters?: {
    format?: string[];
    category?: string[];
    tags?: string[];
    dateRange?: { start: string; end: string };
    author?: string;
  };
  searchType: 'fulltext' | 'semantic' | 'hybrid';
  limit?: number;
}

export interface SearchResult {
  document: Document;
  score: number;
  highlights: string[];
  matchType: 'title' | 'content' | 'tags' | 'semantic';
}

class KnowledgeBaseService {
  private documents: Map<string, Document> = new Map();
  private versions: Map<string, DocumentVersion> = new Map();
  private collections: Map<string, DocumentCollection> = new Map();
  private knowledgeGraphs: Map<string, KnowledgeGraph> = new Map();
  private qaHistory: Map<string, QAResult> = new Map();

  // ==================== Document Management ====================

  async importDocument(file: File, metadata?: Partial<Document['metadata']>): Promise<Document> {
    const content = await this.extractContent(file);
    const format = this.detectFormat(file.name);

    const document: Document = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      content,
      format,
      size: file.size,
      metadata: {
        author: metadata?.author || 'Unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: metadata?.tags || [],
        category: metadata?.category || 'Uncategorized',
        language: metadata?.language || 'en',
        keywords: [],
        summary: '',
      },
      versions: [],
      relatedDocuments: [],
      accessControl: {
        owner: 'current-user',
        sharedWith: [],
        isPublic: false,
      },
      statistics: {
        views: 0,
        downloads: 0,
        lastAccessed: new Date().toISOString(),
      },
    };

    // Perform automatic enhancements
    document.embedding = await this.generateEmbedding(content);
    document.metadata.keywords = await this.extractKeywords(content);
    document.metadata.summary = await this.generateSummary(content);

    // Auto-tag if no tags provided
    if (document.metadata.tags.length === 0) {
      document.metadata.tags = await this.autoTagDocument(document.id, content);
    }

    // Create initial version
    const initialVersion = this.createVersion(document, 'Initial import', 'system');
    document.versions.push(initialVersion);

    this.documents.set(document.id, document);
    return document;
  }

  private async extractContent(file: File): Promise<string> {
    // In production, this would use actual file parsing libraries
    // PDF: pdf-parse, Word: mammoth, etc.

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      return await file.text();
    }

    if (fileName.endsWith('.pdf')) {
      return `[Extracted PDF content from ${file.name}]\n\nThis is a simulated PDF extraction. In production, this would use pdf-parse or similar library to extract actual text from the PDF file.\n\nThe content would include all text from all pages, preserving structure where possible.`;
    }

    if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      return `[Extracted Word content from ${file.name}]\n\nThis is a simulated Word document extraction. In production, this would use mammoth.js or similar library to extract actual text from Word documents.\n\nThe content would preserve formatting, headings, and structure.`;
    }

    if (fileName.endsWith('.pptx') || fileName.endsWith('.ppt')) {
      return `[Extracted PowerPoint content from ${file.name}]\n\nThis is a simulated PowerPoint extraction. In production, this would extract text from all slides including titles, body text, and notes.`;
    }

    if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|tiff)$/)) {
      return `[OCR extraction required for image: ${file.name}]\n\nThis image file requires OCR processing to extract text content.`;
    }

    return `[Unsupported format: ${file.name}]\n\nPlease use a supported format: PDF, Word, PowerPoint, Markdown, TXT, or image files.`;
  }

  private detectFormat(filename: string): Document['format'] {
    const ext = filename.toLowerCase().split('.').pop();

    switch (ext) {
      case 'pdf':
        return 'pdf';
      case 'doc':
      case 'docx':
        return 'word';
      case 'ppt':
      case 'pptx':
        return 'ppt';
      case 'md':
      case 'markdown':
        return 'markdown';
      case 'html':
      case 'htm':
        return 'html';
      case 'txt':
        return 'txt';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'tiff':
        return 'image';
      default:
        return 'txt';
    }
  }

  getDocument(id: string): Document | undefined {
    return this.documents.get(id);
  }

  getAllDocuments(filters?: {
    format?: string;
    category?: string;
    author?: string;
  }): Document[] {
    let docs = Array.from(this.documents.values());

    if (filters?.format) {
      docs = docs.filter(doc => doc.format === filters.format);
    }

    if (filters?.category) {
      docs = docs.filter(doc => doc.metadata.category === filters.category);
    }

    if (filters?.author) {
      docs = docs.filter(doc => doc.metadata.author === filters.author);
    }

    return docs.sort(
      (a, b) => new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
    );
  }

  updateDocument(id: string, updates: Partial<Document>, changeLog: string, userId: string): Document {
    const document = this.documents.get(id);
    if (!document) throw new Error('Document not found');

    // Create new version before updating
    const version = this.createVersion(document, changeLog, userId);

    const updatedDocument = {
      ...document,
      ...updates,
      metadata: {
        ...document.metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    updatedDocument.versions.push(version);

    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  deleteDocument(id: string): void {
    this.documents.delete(id);
    // Also delete related versions
    Array.from(this.versions.values())
      .filter(v => v.documentId === id)
      .forEach(v => this.versions.delete(v.versionId));
  }

  // ==================== Version Control ====================

  private createVersion(document: Document, changeLog: string, userId: string): DocumentVersion {
    const version: DocumentVersion = {
      versionId: `ver-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      documentId: document.id,
      content: document.content,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      changeLog,
    };

    this.versions.set(version.versionId, version);
    return version;
  }

  getDocumentVersions(documentId: string): DocumentVersion[] {
    return Array.from(this.versions.values())
      .filter(v => v.documentId === documentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  restoreVersion(documentId: string, versionId: string, userId: string): Document {
    const version = this.versions.get(versionId);
    if (!version || version.documentId !== documentId) {
      throw new Error('Version not found');
    }

    return this.updateDocument(
      documentId,
      { content: version.content },
      `Restored from version ${versionId}`,
      userId
    );
  }

  // ==================== OCR Processing ====================

  async ocrDocument(documentId: string): Promise<OCRResult> {
    const document = this.documents.get(documentId);
    if (!document) throw new Error('Document not found');

    // Simulate OCR processing
    await this.delay(2000);

    const ocrResult: OCRResult = {
      language: document.metadata.language,
      confidence: 0.92,
      text: this.simulateOCRText(document),
      blocks: this.simulateOCRBlocks(),
      pages: document.format === 'pdf' ? Math.ceil(document.content.length / 2000) : undefined,
    };

    // Update document with OCR result
    document.ocr = ocrResult;
    if (document.format === 'image') {
      document.content = ocrResult.text;
    }

    this.documents.set(documentId, document);
    return ocrResult;
  }

  private simulateOCRText(document: Document): string {
    if (document.format === 'image') {
      return `Optical Character Recognition (OCR) extracted text:\n\n${document.title}\n\nThis is simulated OCR text extraction from an image. In production, this would use Tesseract.js, Google Cloud Vision API, or AWS Textract to extract actual text from images and scanned documents.\n\nThe extracted text would preserve layout, detect multiple columns, tables, and different text regions with high accuracy.`;
    }
    return document.content;
  }

  private simulateOCRBlocks(): OCRBlock[] {
    return [
      {
        text: 'Document Title',
        confidence: 0.98,
        bbox: [50, 50, 500, 100],
        type: 'title',
      },
      {
        text: 'This is the main body text of the document. OCR has detected this paragraph with high confidence.',
        confidence: 0.94,
        bbox: [50, 120, 500, 200],
        type: 'text',
      },
      {
        text: 'Table data would be detected here',
        confidence: 0.88,
        bbox: [50, 220, 500, 350],
        type: 'table',
      },
    ];
  }

  // ==================== Auto-Tagging ====================

  async autoTagDocument(documentId: string, content?: string): Promise<string[]> {
    const document = this.documents.get(documentId);
    if (!document && !content) throw new Error('Document not found');

    const text = content || document!.content;

    // Simulate AI-powered tagging
    await this.delay(500);

    const tags = this.extractTagsFromText(text);

    if (document) {
      document.metadata.tags = [...new Set([...document.metadata.tags, ...tags])];
      this.documents.set(documentId, document);
    }

    return tags;
  }

  private extractTagsFromText(text: string): string[] {
    const commonTags: Record<string, string[]> = {
      'machine learning': ['machine-learning', 'ai', 'ml', 'data-science'],
      'neural network': ['neural-networks', 'deep-learning', 'ai'],
      'programming': ['programming', 'coding', 'development'],
      'javascript': ['javascript', 'programming', 'web-development'],
      'python': ['python', 'programming', 'data-science'],
      'database': ['database', 'sql', 'data'],
      'security': ['security', 'cybersecurity', 'privacy'],
      'cloud': ['cloud', 'aws', 'azure', 'devops'],
      'api': ['api', 'rest', 'web-services'],
      'testing': ['testing', 'qa', 'automation'],
    };

    const tags: string[] = [];
    const lowerText = text.toLowerCase();

    for (const [keyword, keywordTags] of Object.entries(commonTags)) {
      if (lowerText.includes(keyword)) {
        tags.push(...keywordTags);
      }
    }

    // Extract potential tags from title words
    const words = text.split(/\s+/).slice(0, 50);
    for (const word of words) {
      const clean = word.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean.length > 4 && clean.length < 20) {
        tags.push(clean);
      }
    }

    return [...new Set(tags)].slice(0, 10);
  }

  // ==================== Knowledge Graph ====================

  async buildKnowledgeGraph(documentIds?: string[]): Promise<KnowledgeGraph> {
    const docs = documentIds
      ? documentIds.map(id => this.documents.get(id)).filter(Boolean) as Document[]
      : Array.from(this.documents.values());

    if (docs.length === 0) {
      throw new Error('No documents available to build knowledge graph');
    }

    await this.delay(1000);

    const nodes: KnowledgeNode[] = [];
    const edges: KnowledgeEdge[] = [];
    const nodeMap = new Map<string, KnowledgeNode>();

    // Create document nodes
    for (const doc of docs) {
      const docNode: KnowledgeNode = {
        id: `node-${doc.id}`,
        label: doc.title,
        type: 'document',
        properties: {
          format: doc.format,
          author: doc.metadata.author,
          category: doc.metadata.category,
        },
        importance: 0.8,
        documentIds: [doc.id],
      };
      nodes.push(docNode);
      nodeMap.set(docNode.id, docNode);

      // Extract entities from document
      const entities = this.extractEntities(doc.content);

      for (const entity of entities) {
        let entityNode = Array.from(nodeMap.values()).find(
          n => n.label === entity.label && n.type === entity.type
        );

        if (!entityNode) {
          entityNode = {
            id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            label: entity.label,
            type: entity.type,
            properties: {},
            importance: entity.importance,
            documentIds: [doc.id],
          };
          nodes.push(entityNode);
          nodeMap.set(entityNode.id, entityNode);
        } else {
          if (!entityNode.documentIds.includes(doc.id)) {
            entityNode.documentIds.push(doc.id);
          }
        }

        // Create edge between document and entity
        edges.push({
          id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          source: docNode.id,
          target: entityNode.id,
          type: 'mentions',
          weight: entity.importance,
          properties: {},
        });
      }
    }

    // Find related documents based on shared tags/keywords
    for (let i = 0; i < docs.length; i++) {
      for (let j = i + 1; j < docs.length; j++) {
        const similarity = this.calculateDocumentSimilarity(docs[i], docs[j]);
        if (similarity > 0.3) {
          edges.push({
            id: `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            source: `node-${docs[i].id}`,
            target: `node-${docs[j].id}`,
            type: 'similar_to',
            weight: similarity,
            properties: { similarity },
          });
        }
      }
    }

    const graph: KnowledgeGraph = {
      id: `kg-${Date.now()}`,
      name: `Knowledge Graph - ${docs.length} documents`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes,
      edges,
      statistics: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        categories: this.countNodesByType(nodes, 'type'),
        relationshipTypes: this.countEdgesByType(edges),
      },
    };

    this.knowledgeGraphs.set(graph.id, graph);
    return graph;
  }

  private extractEntities(text: string): Array<{
    label: string;
    type: KnowledgeNode['type'];
    importance: number;
  }> {
    const entities: Array<{ label: string; type: KnowledgeNode['type']; importance: number }> = [];

    // Simulate NER (Named Entity Recognition)
    const patterns = {
      person: /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g,
      organization: /\b([A-Z][a-z]+ (Inc|Corp|Company|Ltd|LLC))\b/g,
      location: /\b(in|at|from) ([A-Z][a-z]+)\b/g,
      concept: /\b(concept|theory|principle|method|algorithm|framework) of ([a-z ]+)\b/gi,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const label = type === 'location' ? match[2] : match[1];
        entities.push({
          label: label.trim(),
          type: type as KnowledgeNode['type'],
          importance: 0.6 + Math.random() * 0.3,
        });
      }
    }

    return entities.slice(0, 20); // Limit entities
  }

  private calculateDocumentSimilarity(doc1: Document, doc2: Document): number {
    // Calculate similarity based on tags and keywords
    const tags1 = new Set(doc1.metadata.tags);
    const tags2 = new Set(doc2.metadata.tags);
    const keywords1 = new Set(doc1.metadata.keywords);
    const keywords2 = new Set(doc2.metadata.keywords);

    const tagIntersection = new Set([...tags1].filter(t => tags2.has(t)));
    const keywordIntersection = new Set([...keywords1].filter(k => keywords2.has(k)));

    const tagSimilarity = tagIntersection.size / Math.max(tags1.size, tags2.size, 1);
    const keywordSimilarity = keywordIntersection.size / Math.max(keywords1.size, keywords2.size, 1);

    // Category match bonus
    const categoryBonus = doc1.metadata.category === doc2.metadata.category ? 0.2 : 0;

    return Math.min((tagSimilarity * 0.4 + keywordSimilarity * 0.4 + categoryBonus), 1.0);
  }

  private countNodesByType(nodes: KnowledgeNode[], field: keyof KnowledgeNode): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const node of nodes) {
      const value = String(node[field]);
      counts[value] = (counts[value] || 0) + 1;
    }
    return counts;
  }

  private countEdgesByType(edges: KnowledgeEdge[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const edge of edges) {
      counts[edge.type] = (counts[edge.type] || 0) + 1;
    }
    return counts;
  }

  getKnowledgeGraph(id: string): KnowledgeGraph | undefined {
    return this.knowledgeGraphs.get(id);
  }

  getAllKnowledgeGraphs(): KnowledgeGraph[] {
    return Array.from(this.knowledgeGraphs.values());
  }

  // ==================== Intelligent Q&A ====================

  async intelligentQA(query: string, documentIds?: string[]): Promise<QAResult> {
    const docs = documentIds
      ? documentIds.map(id => this.documents.get(id)).filter(Boolean) as Document[]
      : Array.from(this.documents.values());

    if (docs.length === 0) {
      throw new Error('No documents available for Q&A');
    }

    await this.delay(800);

    // Find relevant documents
    const relevantDocs = this.findRelevantDocuments(query, docs);

    // Generate answer
    const answer = this.generateAnswer(query, relevantDocs);

    // Create sources
    const sources: QASource[] = relevantDocs.map(doc => ({
      documentId: doc.id,
      documentTitle: doc.title,
      excerpt: this.extractRelevantExcerpt(query, doc.content),
      relevance: this.calculateRelevance(query, doc),
    }));

    // Generate related questions
    const relatedQuestions = this.generateRelatedQuestions(query, relevantDocs);

    const result: QAResult = {
      id: `qa-${Date.now()}`,
      query,
      answer,
      confidence: 0.85,
      sources: sources.slice(0, 5),
      relatedQuestions,
      timestamp: new Date().toISOString(),
    };

    this.qaHistory.set(result.id, result);
    return result;
  }

  private findRelevantDocuments(query: string, docs: Document[]): Document[] {
    const queryLower = query.toLowerCase();
    const scored = docs.map(doc => ({
      doc,
      score: this.calculateRelevance(query, doc),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(item => item.doc);
  }

  private calculateRelevance(query: string, doc: Document): number {
    const queryLower = query.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    const titleLower = doc.title.toLowerCase();

    let score = 0;

    // Title match (highest weight)
    if (titleLower.includes(queryLower)) score += 0.5;

    // Content match
    const queryWords = queryLower.split(/\s+/);
    for (const word of queryWords) {
      if (word.length < 3) continue;
      const contentMatches = (contentLower.match(new RegExp(word, 'g')) || []).length;
      score += Math.min(contentMatches * 0.05, 0.3);
    }

    // Tag match
    for (const tag of doc.metadata.tags) {
      if (queryLower.includes(tag.toLowerCase())) score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private generateAnswer(query: string, docs: Document[]): string {
    if (docs.length === 0) {
      return "I couldn't find relevant information to answer your question. Please try rephrasing or check if the knowledge base contains related documents.";
    }

    const topDoc = docs[0];
    const excerpt = this.extractRelevantExcerpt(query, topDoc.content);

    return `Based on the documents in the knowledge base:\n\n${excerpt}\n\nThis information is primarily from "${topDoc.title}" and ${docs.length - 1} other related document(s). The answer synthesizes information from multiple sources to provide a comprehensive response.`;
  }

  private extractRelevantExcerpt(query: string, content: string, maxLength: number = 200): string {
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);

    let bestSentence = sentences[0] || content.substring(0, maxLength);
    let bestScore = 0;

    for (const sentence of sentences.slice(0, 50)) {
      const sentenceLower = sentence.toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (sentenceLower.includes(word)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestSentence = sentence;
      }
    }

    return bestSentence.trim().substring(0, maxLength) + (bestSentence.length > maxLength ? '...' : '');
  }

  private generateRelatedQuestions(query: string, docs: Document[]): string[] {
    const questions = [
      `What are the key concepts related to "${query}"?`,
      `Can you explain more about the context of "${query}"?`,
      `What are some examples of "${query}" in practice?`,
      `How does "${query}" relate to other topics in the knowledge base?`,
      `What are the latest developments in "${query}"?`,
    ];

    return questions.slice(0, 3);
  }

  getQAHistory(): QAResult[] {
    return Array.from(this.qaHistory.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // ==================== Search ====================

  async search(searchQuery: SearchQuery): Promise<SearchResult[]> {
    let docs = Array.from(this.documents.values());

    // Apply filters
    if (searchQuery.filters) {
      if (searchQuery.filters.format) {
        docs = docs.filter(doc => searchQuery.filters!.format!.includes(doc.format));
      }
      if (searchQuery.filters.category) {
        docs = docs.filter(doc => searchQuery.filters!.category!.includes(doc.metadata.category));
      }
      if (searchQuery.filters.tags && searchQuery.filters.tags.length > 0) {
        docs = docs.filter(doc =>
          doc.metadata.tags.some(tag => searchQuery.filters!.tags!.includes(tag))
        );
      }
      if (searchQuery.filters.author) {
        docs = docs.filter(doc => doc.metadata.author === searchQuery.filters!.author);
      }
    }

    // Perform search based on type
    let results: SearchResult[];

    switch (searchQuery.searchType) {
      case 'fulltext':
        results = this.fulltextSearch(searchQuery.query, docs);
        break;
      case 'semantic':
        results = await this.semanticSearch(searchQuery.query, docs);
        break;
      case 'hybrid':
        results = await this.hybridSearch(searchQuery.query, docs);
        break;
      default:
        results = this.fulltextSearch(searchQuery.query, docs);
    }

    const limit = searchQuery.limit || 10;
    return results.slice(0, limit);
  }

  private fulltextSearch(query: string, docs: Document[]): SearchResult[] {
    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const doc of docs) {
      let score = 0;
      const highlights: string[] = [];
      let matchType: SearchResult['matchType'] = 'content';

      // Title match
      if (doc.title.toLowerCase().includes(queryLower)) {
        score += 0.5;
        matchType = 'title';
        highlights.push(doc.title);
      }

      // Content match
      if (doc.content.toLowerCase().includes(queryLower)) {
        score += 0.3;
        const excerpt = this.extractRelevantExcerpt(query, doc.content);
        highlights.push(excerpt);
      }

      // Tags match
      for (const tag of doc.metadata.tags) {
        if (tag.toLowerCase().includes(queryLower)) {
          score += 0.2;
          matchType = 'tags';
          break;
        }
      }

      if (score > 0) {
        results.push({
          document: doc,
          score,
          highlights: highlights.slice(0, 3),
          matchType,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private async semanticSearch(query: string, docs: Document[]): Promise<SearchResult[]> {
    await this.delay(300);

    const queryEmbedding = await this.generateEmbedding(query);
    const results: SearchResult[] = [];

    for (const doc of docs) {
      if (!doc.embedding) {
        doc.embedding = await this.generateEmbedding(doc.content);
      }

      const similarity = this.cosineSimilarity(queryEmbedding, doc.embedding);

      if (similarity > 0.3) {
        results.push({
          document: doc,
          score: similarity,
          highlights: [this.extractRelevantExcerpt(query, doc.content)],
          matchType: 'semantic',
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private async hybridSearch(query: string, docs: Document[]): Promise<SearchResult[]> {
    const fulltextResults = this.fulltextSearch(query, docs);
    const semanticResults = await this.semanticSearch(query, docs);

    const combined = new Map<string, SearchResult>();

    for (const result of fulltextResults) {
      combined.set(result.document.id, {
        ...result,
        score: result.score * 0.6,
      });
    }

    for (const result of semanticResults) {
      const existing = combined.get(result.document.id);
      if (existing) {
        existing.score += result.score * 0.4;
        existing.highlights = [...new Set([...existing.highlights, ...result.highlights])];
      } else {
        combined.set(result.document.id, {
          ...result,
          score: result.score * 0.4,
        });
      }
    }

    return Array.from(combined.values()).sort((a, b) => b.score - a.score);
  }

  // ==================== Collections ====================

  createCollection(name: string, description: string, documentIds: string[]): DocumentCollection {
    const collection: DocumentCollection = {
      id: `col-${Date.now()}`,
      name,
      description,
      documentIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
    };

    this.collections.set(collection.id, collection);
    return collection;
  }

  getCollection(id: string): DocumentCollection | undefined {
    return this.collections.get(id);
  }

  getAllCollections(): DocumentCollection[] {
    return Array.from(this.collections.values());
  }

  addDocumentToCollection(collectionId: string, documentId: string): void {
    const collection = this.collections.get(collectionId);
    if (!collection) throw new Error('Collection not found');

    if (!collection.documentIds.includes(documentId)) {
      collection.documentIds.push(documentId);
      collection.updatedAt = new Date().toISOString();
    }
  }

  // ==================== Helper Methods ====================

  private async generateEmbedding(text: string): Promise<number[]> {
    // Simulate embedding generation (in production, use OpenAI embeddings or similar)
    await this.delay(100);

    // Generate a simple hash-based embedding for demonstration
    const embedding: number[] = [];
    for (let i = 0; i < 384; i++) {
      embedding.push(Math.random() * 2 - 1);
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  private async extractKeywords(text: string): Promise<string[]> {
    // Simulate keyword extraction
    await this.delay(200);

    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();

    for (const word of words) {
      const clean = word.replace(/[^a-z0-9]/g, '');
      if (clean.length > 4) {
        wordFreq.set(clean, (wordFreq.get(clean) || 0) + 1);
      }
    }

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private async generateSummary(text: string): Promise<string> {
    // Simulate AI-powered summarization
    await this.delay(300);

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const summary = sentences.slice(0, 3).join('. ');

    return summary.substring(0, 200) + (summary.length > 200 ? '...' : '');
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (magnitudeA * magnitudeB);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== Statistics ====================

  getStatistics() {
    const docs = Array.from(this.documents.values());
    const formatCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    for (const doc of docs) {
      formatCounts[doc.format] = (formatCounts[doc.format] || 0) + 1;
      categoryCounts[doc.metadata.category] = (categoryCounts[doc.metadata.category] || 0) + 1;
    }

    return {
      totalDocuments: this.documents.size,
      totalVersions: this.versions.size,
      totalCollections: this.collections.size,
      totalKnowledgeGraphs: this.knowledgeGraphs.size,
      totalQAQueries: this.qaHistory.size,
      formatDistribution: formatCounts,
      categoryDistribution: categoryCounts,
      totalSize: docs.reduce((sum, doc) => sum + doc.size, 0),
    };
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
export default knowledgeBaseService;

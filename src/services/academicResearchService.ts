/**
 * Academic Research Assistant Service
 *
 * Features:
 * - Paper management
 * - Citation generation
 * - Literature review
 * - Research summarization
 */

import { v4 as uuidv4 } from 'uuid';

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  journal?: string;
  conference?: string;
  doi?: string;
  arxivId?: string;
  pdfUrl?: string;
  citationCount: number;
  tags: string[];
  notes: string[];
  addedAt: Date;
}

export interface Citation {
  id: string;
  paperId: string;
  format: 'apa' | 'mla' | 'chicago' | 'ieee' | 'bibtex';
  text: string;
}

export interface LiteratureReview {
  id: string;
  topic: string;
  papers: ResearchPaper[];
  themes: string[];
  gaps: string[];
  summary: string;
  createdAt: Date;
}

export interface ResearchQuery {
  keywords: string[];
  yearRange?: { start: number; end: number };
  sources?: Array<'arxiv' | 'pubmed' | 'semantic-scholar'>;
  limit?: number;
}

class AcademicResearchService {
  private papers: Map<string, ResearchPaper> = new Map();
  private reviews: Map<string, LiteratureReview> = new Map();

  // ========================
  // Paper Management
  // ========================

  async searchPapers(query: ResearchQuery): Promise<ResearchPaper[]> {
    // In production, call actual APIs (ArXiv, Semantic Scholar, etc.)
    const mockPapers: ResearchPaper[] = [
      {
        id: uuidv4(),
        title: `Research on ${query.keywords.join(', ')}`,
        authors: ['John Doe', 'Jane Smith'],
        abstract: 'This paper explores...',
        year: 2024,
        journal: 'Nature',
        citationCount: 150,
        tags: query.keywords,
        notes: [],
        addedAt: new Date(),
      },
    ];

    return mockPapers;
  }

  addPaper(paper: Omit<ResearchPaper, 'id' | 'addedAt'>): ResearchPaper {
    const newPaper: ResearchPaper = {
      ...paper,
      id: uuidv4(),
      addedAt: new Date(),
    };

    this.papers.set(newPaper.id, newPaper);
    return newPaper;
  }

  getPaper(id: string): ResearchPaper | undefined {
    return this.papers.get(id);
  }

  listPapers(): ResearchPaper[] {
    return Array.from(this.papers.values());
  }

  addNote(paperId: string, note: string): void {
    const paper = this.papers.get(paperId);
    if (paper) {
      paper.notes.push(note);
    }
  }

  // ========================
  // Citation Generation
  // ========================

  generateCitation(paperId: string, format: Citation['format']): Citation {
    const paper = this.papers.get(paperId);
    if (!paper) throw new Error('Paper not found');

    let text = '';

    switch (format) {
      case 'apa':
        text = this.generateAPA(paper);
        break;
      case 'mla':
        text = this.generateMLA(paper);
        break;
      case 'chicago':
        text = this.generateChicago(paper);
        break;
      case 'ieee':
        text = this.generateIEEE(paper);
        break;
      case 'bibtex':
        text = this.generateBibTeX(paper);
        break;
    }

    return {
      id: uuidv4(),
      paperId,
      format,
      text,
    };
  }

  private generateAPA(paper: ResearchPaper): string {
    const authors = paper.authors.join(', ');
    return `${authors} (${paper.year}). ${paper.title}. ${paper.journal || paper.conference}.`;
  }

  private generateMLA(paper: ResearchPaper): string {
    const authors = paper.authors.join(', ');
    return `${authors}. "${paper.title}." ${paper.journal || paper.conference}, ${paper.year}.`;
  }

  private generateChicago(paper: ResearchPaper): string {
    const authors = paper.authors.join(', ');
    return `${authors}. "${paper.title}." ${paper.journal || paper.conference} (${paper.year}).`;
  }

  private generateIEEE(paper: ResearchPaper): string {
    const authors = paper.authors.join(', ');
    return `${authors}, "${paper.title}," ${paper.journal || paper.conference}, ${paper.year}.`;
  }

  private generateBibTeX(paper: ResearchPaper): string {
    const key = `${paper.authors[0]?.split(' ').pop()}${paper.year}`;
    return `@article{${key},\n` +
      `  title={${paper.title}},\n` +
      `  author={${paper.authors.join(' and ')}},\n` +
      `  journal={${paper.journal || paper.conference}},\n` +
      `  year={${paper.year}}\n` +
      `}`;
  }

  // ========================
  // Literature Review
  // ========================

  async createLiteratureReview(
    topic: string,
    paperIds: string[]
  ): Promise<LiteratureReview> {
    const papers = paperIds
      .map(id => this.papers.get(id))
      .filter(p => p !== undefined) as ResearchPaper[];

    // Analyze papers
    const themes = this.extractThemes(papers);
    const gaps = this.identifyGaps(papers);
    const summary = await this.generateSummary(papers, topic);

    const review: LiteratureReview = {
      id: uuidv4(),
      topic,
      papers,
      themes,
      gaps,
      summary,
      createdAt: new Date(),
    };

    this.reviews.set(review.id, review);
    return review;
  }

  private extractThemes(papers: ResearchPaper[]): string[] {
    const allTags = papers.flatMap(p => p.tags);
    const tagCounts = new Map<string, number>();

    allTags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });

    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }

  private identifyGaps(papers: ResearchPaper[]): string[] {
    // Simplified gap analysis
    return [
      'Limited research on practical applications',
      'Need for larger-scale studies',
      'Further investigation of edge cases required',
    ];
  }

  private async generateSummary(papers: ResearchPaper[], topic: string): Promise<string> {
    // In production, use LLM for summarization
    return `This literature review covers ${papers.length} papers on ${topic}. ` +
      `Key findings include... [AI-generated summary would go here]`;
  }

  // ========================
  // Paper Analysis
  // ========================

  async summarizePaper(paperId: string): Promise<string> {
    const paper = this.papers.get(paperId);
    if (!paper) throw new Error('Paper not found');

    // In production, use LLM for summarization
    return `Summary of "${paper.title}":\n\n` +
      `${paper.abstract}\n\n` +
      `Key contributions: [AI analysis would go here]`;
  }

  async extractKeyPoints(paperId: string): Promise<string[]> {
    const paper = this.papers.get(paperId);
    if (!paper) throw new Error('Paper not found');

    // Simple key point extraction
    return [
      'Main research question',
      'Methodology used',
      'Key findings',
      'Limitations',
      'Future work',
    ];
  }

  async compareP apers(paperIds: string[]): Promise<any> {
    const papers = paperIds
      .map(id => this.papers.get(id))
      .filter(p => p !== undefined) as ResearchPaper[];

    return {
      commonThemes: this.findCommonThemes(papers),
      differences: this.findDifferences(papers),
      citationComparison: papers.map(p => ({
        title: p.title,
        citations: p.citationCount,
      })),
    };
  }

  private findCommonThemes(papers: ResearchPaper[]): string[] {
    const allTags = papers.map(p => new Set(p.tags));
    if (allTags.length === 0) return [];

    // Find intersection
    const common = allTags.reduce((acc, tags) => {
      return new Set([...acc].filter(tag => tags.has(tag)));
    });

    return Array.from(common);
  }

  private findDifferences(papers: ResearchPaper[]): string[] {
    return [
      'Different methodologies',
      'Varying sample sizes',
      'Diverse geographic contexts',
    ];
  }

  // ========================
  // Research Organization
  // ========================

  organizePapersByYear(): Map<number, ResearchPaper[]> {
    const byYear = new Map<number, ResearchPaper[]>();

    this.papers.forEach(paper => {
      const papers = byYear.get(paper.year) || [];
      papers.push(paper);
      byYear.set(paper.year, papers);
    });

    return byYear;
  }

  organizePapersByAuthor(): Map<string, ResearchPaper[]> {
    const byAuthor = new Map<string, ResearchPaper[]>();

    this.papers.forEach(paper => {
      paper.authors.forEach(author => {
        const papers = byAuthor.get(author) || [];
        papers.push(paper);
        byAuthor.set(author, papers);
      });
    });

    return byAuthor;
  }

  // ========================
  // Export
  // ========================

  exportBibliography(paperIds: string[], format: Citation['format']): string {
    const citations = paperIds.map(id => this.generateCitation(id, format));
    return citations.map(c => c.text).join('\n\n');
  }
}

const academicResearchService = new AcademicResearchService();
export default academicResearchService;

/**
 * Prompt Optimizer Service - v4.0 Core
 *
 * Features:
 * - Prompt scoring and analysis
 * - Automatic optimization suggestions
 * - Template management
 * - A/B testing
 * - Best practices checking
 */

import { v4 as uuidv4 } from 'uuid';

export interface PromptAnalysis {
  id: string;
  prompt: string;
  score: number; // 0-100
  metrics: PromptMetrics;
  suggestions: OptimizationSuggestion[];
  bestPractices: BestPracticeCheck[];
  estimatedTokens: number;
  complexity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface PromptMetrics {
  clarity: number; // 0-100
  specificity: number;
  conciseness: number;
  structure: number;
  contextProvided: boolean;
  examplesIncluded: boolean;
  constraintsSpecified: boolean;
  outputFormatDefined: boolean;
}

export interface OptimizationSuggestion {
  id: string;
  type: 'clarity' | 'structure' | 'context' | 'examples' | 'constraints' | 'format';
  severity: 'low' | 'medium' | 'high';
  message: string;
  example: string;
  improvement: string;
  impact: number; // Expected score improvement
}

export interface BestPracticeCheck {
  practice: string;
  passed: boolean;
  description: string;
  recommendation?: string;
}

export interface OptimizedPrompt {
  original: string;
  optimized: string;
  changes: string[];
  scoreImprovement: number;
  reasoning: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  template: string;
  variables: TemplateVariable[];
  examples: string[];
  avgScore: number;
  usageCount: number;
  createdAt: Date;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required: boolean;
  default?: any;
  examples?: any[];
}

export interface ABTest {
  id: string;
  name: string;
  variants: PromptVariant[];
  metrics: Map<string, VariantMetrics>;
  winner?: string;
  status: 'running' | 'completed' | 'paused';
  createdAt: Date;
  completedAt?: Date;
}

export interface PromptVariant {
  id: string;
  name: string;
  prompt: string;
  weight: number; // Distribution weight
}

export interface VariantMetrics {
  trials: number;
  avgResponseTime: number;
  avgTokensUsed: number;
  avgQualityScore: number;
  successRate: number;
}

class PromptOptimizerService {
  private analyses: Map<string, PromptAnalysis> = new Map();
  private templates: Map<string, PromptTemplate> = new Map();
  private abTests: Map<string, ABTest> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  // ========================
  // Prompt Analysis
  // ========================

  async analyzePrompt(prompt: string): Promise<PromptAnalysis> {
    const metrics = this.calculateMetrics(prompt);
    const score = this.calculateOverallScore(metrics);
    const suggestions = this.generateSuggestions(prompt, metrics);
    const bestPractices = this.checkBestPractices(prompt);
    const estimatedTokens = this.estimateTokenCount(prompt);
    const complexity = this.assessComplexity(prompt);

    const analysis: PromptAnalysis = {
      id: uuidv4(),
      prompt,
      score,
      metrics,
      suggestions,
      bestPractices,
      estimatedTokens,
      complexity,
      timestamp: new Date(),
    };

    this.analyses.set(analysis.id, analysis);
    return analysis;
  }

  private calculateMetrics(prompt: string): PromptMetrics {
    return {
      clarity: this.scoreClarity(prompt),
      specificity: this.scoreSpecificity(prompt),
      conciseness: this.scoreConciseness(prompt),
      structure: this.scoreStructure(prompt),
      contextProvided: this.hasContext(prompt),
      examplesIncluded: this.hasExamples(prompt),
      constraintsSpecified: this.hasConstraints(prompt),
      outputFormatDefined: this.hasOutputFormat(prompt),
    };
  }

  private scoreClarity(prompt: string): number {
    let score = 50;

    // Check for clear instructions
    if (prompt.match(/(please|could you|can you|I need|I want)/i)) {
      score += 15;
    }

    // Check for ambiguous words
    const ambiguous = ['maybe', 'possibly', 'might', 'somewhat', 'kind of'];
    const hasAmbiguous = ambiguous.some(word => prompt.toLowerCase().includes(word));
    if (hasAmbiguous) {
      score -= 20;
    }

    // Check sentence structure
    const sentences = prompt.split(/[.!?]+/);
    const avgLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    if (avgLength < 20 && avgLength > 5) {
      score += 15;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreSpecificity(prompt: string): number {
    let score = 50;

    // Check for specific details
    const specificIndicators = [
      /\d+/,  // Numbers
      /[A-Z][a-z]+ [A-Z][a-z]+/,  // Proper nouns
      /"[^"]+"/,  // Quoted text
      /for example|such as|specifically/i,
    ];

    specificIndicators.forEach(pattern => {
      if (pattern.test(prompt)) {
        score += 12;
      }
    });

    // Penalize vague terms
    const vague = ['something', 'anything', 'whatever', 'stuff', 'things'];
    vague.forEach(word => {
      if (prompt.toLowerCase().includes(word)) {
        score -= 15;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  private scoreConciseness(prompt: string): number {
    const wordCount = prompt.split(/\s+/).length;

    // Optimal range: 20-200 words
    if (wordCount < 10) {
      return 30; // Too short, probably lacks detail
    } else if (wordCount >= 10 && wordCount <= 50) {
      return 90;
    } else if (wordCount <= 150) {
      return 80;
    } else if (wordCount <= 300) {
      return 60;
    } else {
      return 40; // Too long, might be unfocused
    }
  }

  private scoreStructure(prompt: string): number {
    let score = 50;

    // Check for structured elements
    if (prompt.match(/^(Step \d+|1\.|2\.|3\.)/m)) {
      score += 20; // Numbered steps
    }

    if (prompt.match(/^[-*•]/m)) {
      score += 15; // Bullet points
    }

    if (prompt.split('\n').length > 2) {
      score += 15; // Multiple paragraphs/lines
    }

    // Check for sections
    const sections = ['context:', 'task:', 'format:', 'example:', 'constraints:'];
    sections.forEach(section => {
      if (prompt.toLowerCase().includes(section)) {
        score += 5;
      }
    });

    return Math.min(100, score);
  }

  private hasContext(prompt: string): boolean {
    const contextMarkers = [
      'context:', 'background:', 'given that', 'assuming', 'scenario:'
    ];

    return contextMarkers.some(marker => prompt.toLowerCase().includes(marker));
  }

  private hasExamples(prompt: string): boolean {
    const exampleMarkers = [
      'example:', 'for instance', 'such as', 'like:', 'e.g.'
    ];

    return exampleMarkers.some(marker => prompt.toLowerCase().includes(marker));
  }

  private hasConstraints(prompt: string): boolean {
    const constraintMarkers = [
      'must', 'should', 'don\'t', 'avoid', 'limit', 'maximum', 'minimum',
      'requirements:', 'constraints:'
    ];

    return constraintMarkers.some(marker => prompt.toLowerCase().includes(marker));
  }

  private hasOutputFormat(prompt: string): boolean {
    const formatMarkers = [
      'format:', 'output:', 'respond with', 'structure:', 'in the format',
      'as json', 'as markdown', 'as a list'
    ];

    return formatMarkers.some(marker => prompt.toLowerCase().includes(marker));
  }

  private calculateOverallScore(metrics: PromptMetrics): number {
    const weights = {
      clarity: 0.25,
      specificity: 0.20,
      conciseness: 0.15,
      structure: 0.15,
    };

    let score = metrics.clarity * weights.clarity +
                metrics.specificity * weights.specificity +
                metrics.conciseness * weights.conciseness +
                metrics.structure * weights.structure;

    // Bonuses for best practices
    if (metrics.contextProvided) score += 5;
    if (metrics.examplesIncluded) score += 5;
    if (metrics.constraintsSpecified) score += 5;
    if (metrics.outputFormatDefined) score += 5;

    return Math.min(100, Math.round(score));
  }

  // ========================
  // Optimization Suggestions
  // ========================

  private generateSuggestions(prompt: string, metrics: PromptMetrics): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Clarity suggestions
    if (metrics.clarity < 70) {
      suggestions.push({
        id: uuidv4(),
        type: 'clarity',
        severity: 'high',
        message: 'Prompt could be clearer',
        example: 'Vague: "Do something with the data"',
        improvement: 'Clear: "Analyze the sales data and create a summary report"',
        impact: 15,
      });
    }

    // Context suggestions
    if (!metrics.contextProvided) {
      suggestions.push({
        id: uuidv4(),
        type: 'context',
        severity: 'medium',
        message: 'Add context to improve responses',
        example: 'Context: I\'m a marketing manager analyzing Q4 performance',
        improvement: 'Providing background helps AI tailor its response',
        impact: 10,
      });
    }

    // Examples suggestions
    if (!metrics.examplesIncluded && metrics.specificity < 70) {
      suggestions.push({
        id: uuidv4(),
        type: 'examples',
        severity: 'medium',
        message: 'Include examples for better results',
        example: 'Example: "Revenue: $50K, Profit: $10K"',
        improvement: 'Examples clarify expectations',
        impact: 10,
      });
    }

    // Format suggestions
    if (!metrics.outputFormatDefined) {
      suggestions.push({
        id: uuidv4(),
        type: 'format',
        severity: 'low',
        message: 'Specify desired output format',
        example: 'Format: Provide response as a bulleted list',
        improvement: 'Format specifications ensure consistent output',
        impact: 8,
      });
    }

    // Structure suggestions
    if (metrics.structure < 60) {
      suggestions.push({
        id: uuidv4(),
        type: 'structure',
        severity: 'medium',
        message: 'Improve prompt structure',
        example: 'Use sections: Context, Task, Format, Constraints',
        improvement: 'Well-structured prompts are easier to follow',
        impact: 12,
      });
    }

    return suggestions.sort((a, b) => b.impact - a.impact);
  }

  // ========================
  // Best Practices
  // ========================

  private checkBestPractices(prompt: string): BestPracticeCheck[] {
    return [
      {
        practice: 'Clear Instruction',
        passed: prompt.length > 20 && /\b(create|generate|write|analyze|explain)\b/i.test(prompt),
        description: 'Prompt contains clear action verb',
        recommendation: prompt.length <= 20 ? 'Add more specific instructions' : undefined,
      },
      {
        practice: 'Appropriate Length',
        passed: prompt.split(/\s+/).length >= 10 && prompt.split(/\s+/).length <= 300,
        description: 'Prompt is neither too short nor too long',
        recommendation: prompt.split(/\s+/).length < 10 ? 'Add more details' :
                        'Consider breaking into multiple prompts',
      },
      {
        practice: 'Specific Requirements',
        passed: /\b(must|should|need to|required)\b/i.test(prompt),
        description: 'Specific requirements are stated',
        recommendation: 'Add explicit requirements or constraints',
      },
      {
        practice: 'Role Definition',
        passed: /\b(as a|you are|act as|role:)\b/i.test(prompt),
        description: 'AI role is defined',
        recommendation: 'Define the AI\'s role for better context',
      },
      {
        practice: 'Output Format',
        passed: this.hasOutputFormat(prompt),
        description: 'Desired output format is specified',
        recommendation: 'Specify how you want the response formatted',
      },
    ];
  }

  // ========================
  // Automatic Optimization
  // ========================

  async optimizePrompt(prompt: string): Promise<OptimizedPrompt> {
    const analysis = await this.analyzePrompt(prompt);
    let optimized = prompt;
    const changes: string[] = [];

    // Apply optimizations based on suggestions
    for (const suggestion of analysis.suggestions) {
      if (suggestion.type === 'context' && !this.hasContext(optimized)) {
        optimized = `Context: [Add your context here]\n\n${optimized}`;
        changes.push('Added context section');
      }

      if (suggestion.type === 'format' && !this.hasOutputFormat(optimized)) {
        optimized += '\n\nFormat: Please provide your response as...';
        changes.push('Added format specification');
      }

      if (suggestion.type === 'examples' && !this.hasExamples(optimized)) {
        optimized += '\n\nExample: [Add example here]';
        changes.push('Added example section');
      }
    }

    // Calculate improvement
    const optimizedAnalysis = await this.analyzePrompt(optimized);
    const scoreImprovement = optimizedAnalysis.score - analysis.score;

    return {
      original: prompt,
      optimized,
      changes,
      scoreImprovement,
      reasoning: `Applied ${changes.length} optimizations to improve clarity and structure`,
    };
  }

  // ========================
  // Template Management
  // ========================

  private initializeTemplates(): void {
    const templates: Omit<PromptTemplate, 'id' | 'avgScore' | 'usageCount' | 'createdAt'>[] = [
      {
        name: 'Code Review',
        description: 'Template for code review requests',
        category: 'Development',
        template: 'Review the following {{language}} code:\n\n{{code}}\n\nFocus on:\n- Code quality\n- Best practices\n- Potential bugs\n- Performance',
        variables: [
          { name: 'language', description: 'Programming language', type: 'string', required: true },
          { name: 'code', description: 'Code to review', type: 'string', required: true },
        ],
        examples: ['Review the following Python code:\n\ndef add(a, b): return a + b'],
      },
      {
        name: 'Content Summary',
        description: 'Summarize content',
        category: 'Content',
        template: 'Summarize the following {{content_type}} in {{length}}:\n\n{{content}}\n\nFormat: {{format}}',
        variables: [
          { name: 'content_type', description: 'Type of content', type: 'string', required: true, examples: ['article', 'document', 'email'] },
          { name: 'length', description: 'Summary length', type: 'string', required: true, examples: ['one paragraph', '3 bullet points', '100 words'] },
          { name: 'content', description: 'Content to summarize', type: 'string', required: true },
          { name: 'format', description: 'Output format', type: 'string', required: false, default: 'paragraph' },
        ],
        examples: [],
      },
    ];

    templates.forEach(t => {
      const template: PromptTemplate = {
        ...t,
        id: uuidv4(),
        avgScore: 80,
        usageCount: 0,
        createdAt: new Date(),
      };
      this.templates.set(template.id, template);
    });
  }

  getTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  applyTemplate(templateId: string, variables: Record<string, any>): string {
    const template = this.templates.get(templateId);
    if (!template) throw new Error('Template not found');

    let result = template.template;

    // Replace variables
    template.variables.forEach(variable => {
      const value = variables[variable.name] ?? variable.default ?? `[${variable.name}]`;
      result = result.replace(new RegExp(`{{${variable.name}}}`, 'g'), String(value));
    });

    template.usageCount++;
    return result;
  }

  // ========================
  // A/B Testing
  // ========================

  createABTest(name: string, variants: Omit<PromptVariant, 'id'>[]): ABTest {
    const test: ABTest = {
      id: uuidv4(),
      name,
      variants: variants.map(v => ({ ...v, id: uuidv4() })),
      metrics: new Map(),
      status: 'running',
      createdAt: new Date(),
    };

    // Initialize metrics
    test.variants.forEach(v => {
      test.metrics.set(v.id, {
        trials: 0,
        avgResponseTime: 0,
        avgTokensUsed: 0,
        avgQualityScore: 0,
        successRate: 0,
      });
    });

    this.abTests.set(test.id, test);
    return test;
  }

  recordTestResult(
    testId: string,
    variantId: string,
    metrics: Partial<VariantMetrics>
  ): void {
    const test = this.abTests.get(testId);
    if (!test) return;

    const variantMetrics = test.metrics.get(variantId);
    if (!variantMetrics) return;

    // Update metrics (running average)
    const n = variantMetrics.trials;
    if (metrics.avgResponseTime !== undefined) {
      variantMetrics.avgResponseTime = (variantMetrics.avgResponseTime * n + metrics.avgResponseTime) / (n + 1);
    }
    if (metrics.avgTokensUsed !== undefined) {
      variantMetrics.avgTokensUsed = (variantMetrics.avgTokensUsed * n + metrics.avgTokensUsed) / (n + 1);
    }
    if (metrics.avgQualityScore !== undefined) {
      variantMetrics.avgQualityScore = (variantMetrics.avgQualityScore * n + metrics.avgQualityScore) / (n + 1);
    }

    variantMetrics.trials++;
  }

  getABTestResults(testId: string): ABTest | undefined {
    return this.abTests.get(testId);
  }

  determineWinner(testId: string): string | null {
    const test = this.abTests.get(testId);
    if (!test) return null;

    let bestVariant: string | null = null;
    let bestScore = -1;

    test.variants.forEach(variant => {
      const metrics = test.metrics.get(variant.id)!;
      if (metrics.trials < 10) return; // Need minimum trials

      // Combined score: quality (70%) + speed (30%)
      const score = metrics.avgQualityScore * 0.7 + (1 / metrics.avgResponseTime) * 1000 * 0.3;

      if (score > bestScore) {
        bestScore = score;
        bestVariant = variant.id;
      }
    });

    if (bestVariant) {
      test.winner = bestVariant;
      test.status = 'completed';
      test.completedAt = new Date();
    }

    return bestVariant;
  }

  // ========================
  // Utilities
  // ========================

  private estimateTokenCount(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private assessComplexity(prompt: string): 'low' | 'medium' | 'high' {
    const wordCount = prompt.split(/\s+/).length;
    const sentenceCount = prompt.split(/[.!?]+/).length;
    const avgSentenceLength = wordCount / sentenceCount;

    if (wordCount < 50 && avgSentenceLength < 15) return 'low';
    if (wordCount < 150 && avgSentenceLength < 20) return 'medium';
    return 'high';
  }
}

const promptOptimizerService = new PromptOptimizerService();
export default promptOptimizerService;

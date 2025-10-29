/**
 * AI Content Creation Studio Service
 *
 * Features:
 * - Social media content generation
 * - Marketing copy
 * - SEO optimization
 * - Video scripts
 * - Brand voice consistency
 */

import { v4 as uuidv4 } from 'uuid';

export type ContentType =
  | 'social_media' | 'blog' | 'email' | 'ad_copy'
  | 'product_description' | 'video_script' | 'seo_article';

export type Platform =
  | 'twitter' | 'linkedin' | 'facebook' | 'instagram'
  | 'tiktok' | 'youtube' | 'reddit';

export type Tone =
  | 'professional' | 'casual' | 'friendly' | 'authoritative'
  | 'humorous' | 'inspirational' | 'urgent' | 'empathetic';

export interface ContentRequest {
  type: ContentType;
  platform?: Platform;
  topic: string;
  keywords?: string[];
  tone: Tone;
  length?: 'short' | 'medium' | 'long';
  targetAudience?: string;
  callToAction?: string;
  brandVoice?: BrandVoice;
}

export interface BrandVoice {
  name: string;
  description: string;
  tone: Tone[];
  vocabulary: string[];
  avoidWords: string[];
  examples: string[];
}

export interface GeneratedContent {
  id: string;
  type: ContentType;
  content: string;
  variations: string[];
  metadata: {
    wordCount: number;
    characterCount: number;
    readingTime: number;
    seoScore?: number;
    hashtags?: string[];
    estimatedReach?: number;
  };
  timestamp: Date;
}

export interface SEOAnalysis {
  score: number; // 0-100
  keyword Density: Map<string, number>;
  readabilityScore: number;
  suggestions: string[];
  metaTags: {
    title: string;
    description: string;
    keywords: string[];
  };
}

class ContentCreationService {
  private brandVoices: Map<string, BrandVoice> = new Map();
  private templates: Map<ContentType, string[]> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Social Media Templates
    this.templates.set('social_media', [
      '{hook} {main_content} {cta} {hashtags}',
      'Did you know? {fact} {elaboration} {cta}',
      '{question} {answer} Learn more: {link}',
    ]);

    // Blog Templates
    this.templates.set('blog', [
      'Introduction\n\n{intro}\n\nMain Content\n\n{body}\n\nConclusion\n\n{conclusion}',
    ]);

    // Ad Copy Templates
    this.templates.set('ad_copy', [
      '{headline}\n\n{benefit_1}\n{benefit_2}\n{benefit_3}\n\n{cta}',
      'Attention! {pain_point}\n\nIntroducing {solution}\n\n{cta}',
    ]);
  }

  // ========================
  // Content Generation
  // ========================

  async generateContent(request: ContentRequest): Promise<GeneratedContent> {
    const content = await this.createContent(request);
    const variations = await this.generateVariations(content, 3);
    const metadata = this.analyzeContent(content, request);

    return {
      id: uuidv4(),
      type: request.type,
      content,
      variations,
      metadata,
      timestamp: new Date(),
    };
  }

  private async createContent(request: ContentRequest): Promise<string> {
    const { type, topic, tone, platform } = request;

    // In production, call LLM API
    let content = `${topic}\n\n`;

    if (type === 'social_media') {
      content = this.generateSocialMedia(request);
    } else if (type === 'blog') {
      content = this.generateBlogPost(request);
    } else if (type === 'email') {
      content = this.generateEmail(request);
    } else if (type === 'ad_copy') {
      content = this.generateAdCopy(request);
    } else if (type === 'product_description') {
      content = this.generateProductDescription(request);
    } else if (type === 'video_script') {
      content = this.generateVideoScript(request);
    }

    // Apply brand voice if provided
    if (request.brandVoice) {
      content = this.applyBrandVoice(content, request.brandVoice);
    }

    return content;
  }

  private generateSocialMedia(request: ContentRequest): string {
    const { platform, topic, callToAction } = request;
    const charLimit = this.getCharacterLimit(platform);

    let content = `Exciting news about ${topic}! `;

    if (platform === 'twitter') {
      content += `Learn more in our latest update. ${callToAction || ''}`;
      content = content.slice(0, charLimit);
      content += '\n\n' + this.generateHashtags(topic, 3).join(' ');
    } else if (platform === 'linkedin') {
      content = `I'm excited to share insights about ${topic}.\n\n`;
      content += `Key takeaways:\n`;
      content += `• Point 1\n• Point 2\n• Point 3\n\n`;
      content += callToAction || 'What are your thoughts?';
    } else if (platform === 'instagram') {
      content = `${topic} ✨\n\n`;
      content += `Swipe to learn more! 👉\n\n`;
      content += this.generateHashtags(topic, 10).join(' ');
    }

    return content;
  }

  private generateBlogPost(request: ContentRequest): string {
    const { topic, keywords = [] } = request;

    return `# ${topic}\n\n## Introduction\n\n` +
      `Welcome to our comprehensive guide on ${topic}. ` +
      `In this article, we'll explore ${keywords.join(', ')}.\n\n` +
      `## Main Content\n\n` +
      `[AI would generate detailed content here based on topic and keywords]\n\n` +
      `## Conclusion\n\n` +
      `We've covered the essentials of ${topic}. ` +
      `${request.callToAction || 'Stay tuned for more insights!'}`;
  }

  private generateEmail(request: ContentRequest): string {
    const { topic, tone, callToAction } = request;

    return `Subject: ${topic}\n\n` +
      `Hi there,\n\n` +
      `I wanted to reach out about ${topic}.\n\n` +
      `[Personalized content based on tone: ${tone}]\n\n` +
      `${callToAction || 'Looking forward to hearing from you.'}\n\n` +
      `Best regards`;
  }

  private generateAdCopy(request: ContentRequest): string {
    const { topic, callToAction } = request;

    return `🎯 ${topic}\n\n` +
      `✅ Benefit 1\n` +
      `✅ Benefit 2\n` +
      `✅ Benefit 3\n\n` +
      `${callToAction || 'Get Started Today!'} 👉`;
  }

  private generateProductDescription(request: ContentRequest): string {
    const { topic, keywords = [] } = request;

    return `${topic}\n\n` +
      `Features:\n` +
      keywords.map(k => `• ${k}`).join('\n') +
      `\n\nPerfect for those looking for quality and value.`;
  }

  private generateVideoScript(request: ContentRequest): string {
    const { topic } = request;

    return `[INTRO]\n` +
      `Hook: "Did you know..."\n\n` +
      `[MAIN CONTENT]\n` +
      `Today we're talking about ${topic}\n\n` +
      `Point 1: ...\n` +
      `Point 2: ...\n` +
      `Point 3: ...\n\n` +
      `[OUTRO]\n` +
      `Thanks for watching! Subscribe for more.`;
  }

  // ========================
  // Content Variations
  // ========================

  private async generateVariations(content: string, count: number): Promise<string[]> {
    const variations: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate variations by rephrasing
      variations.push(this.rephrase(content, i));
    }

    return variations;
  }

  private rephrase(content: string, seed: number): string {
    // Simple variation generation
    // In production, use LLM for better rephrasing
    return `Variation ${seed + 1}: ${content}`;
  }

  // ========================
  // Content Analysis
  // ========================

  private analyzeContent(content: string, request: ContentRequest): any {
    const wordCount = content.split(/\s+/).length;
    const characterCount = content.length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed

    const metadata: any = {
      wordCount,
      characterCount,
      readingTime,
    };

    if (request.type === 'social_media') {
      metadata.hashtags = this.extractHashtags(content);
      metadata.estimatedReach = this.estimateReach(request.platform!);
    }

    if (request.type === 'blog' || request.type === 'seo_article') {
      metadata.seoScore = this.calculateSEOScore(content, request.keywords || []);
    }

    return metadata;
  }

  private extractHashtags(content: string): string[] {
    const regex = /#\w+/g;
    return content.match(regex) || [];
  }

  private estimateReach(platform: Platform): number {
    // Estimated reach based on platform
    const reaches: Record<Platform, number> = {
      twitter: 1000,
      linkedin: 500,
      facebook: 800,
      instagram: 1200,
      tiktok: 2000,
      youtube: 1500,
      reddit: 600,
    };

    return reaches[platform] || 500;
  }

  private calculateSEOScore(content: string, keywords: string[]): number {
    let score = 50;

    // Check keyword presence
    const contentLower = content.toLowerCase();
    keywords.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase())) {
        score += 10;
      }
    });

    // Check content length
    const wordCount = content.split(/\s+/).length;
    if (wordCount >= 300 && wordCount <= 2000) {
      score += 20;
    }

    return Math.min(100, score);
  }

  // ========================
  // SEO Optimization
  // ========================

  async optimizeForSEO(content: string, keywords: string[]): Promise<SEOAnalysis> {
    const score = this.calculateSEOScore(content, keywords);
    const keywordDensity = this.calculateKeywordDensity(content, keywords);
    const readabilityScore = this.calculateReadability(content);

    const suggestions: string[] = [];

    if (score < 70) {
      suggestions.push('Include more target keywords naturally');
    }
    if (readabilityScore < 60) {
      suggestions.push('Simplify sentence structure');
    }
    if (content.length < 300) {
      suggestions.push('Increase content length to at least 300 words');
    }

    return {
      score,
      keywordDensity,
      readabilityScore,
      suggestions,
      metaTags: this.generateMetaTags(content, keywords),
    };
  }

  private calculateKeywordDensity(content: string, keywords: string[]): Map<string, number> {
    const density = new Map<string, number>();
    const words = content.toLowerCase().split(/\s+/);
    const totalWords = words.length;

    keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const count = words.filter(word => word.includes(keywordLower)).length;
      density.set(keyword, (count / totalWords) * 100);
    });

    return density;
  }

  private calculateReadability(content: string): number {
    // Simplified Flesch Reading Ease
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const syllables = this.countSyllables(content);

    if (sentences === 0 || words === 0) return 0;

    const score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
    return Math.max(0, Math.min(100, score));
  }

  private countSyllables(text: string): number {
    // Simple syllable counter
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    return words.reduce((count, word) => {
      return count + (word.match(/[aeiouy]+/g) || []).length;
    }, 0);
  }

  private generateMetaTags(content: string, keywords: string[]): any {
    const title = content.split('\n')[0].slice(0, 60);
    const description = content.slice(0, 160);

    return {
      title,
      description,
      keywords,
    };
  }

  // ========================
  // Brand Voice
  // ========================

  saveBrandVoice(brandVoice: BrandVoice): void {
    this.brandVoices.set(brandVoice.name, brandVoice);
  }

  getBrandVoice(name: string): BrandVoice | undefined {
    return this.brandVoices.get(name);
  }

  private applyBrandVoice(content: string, brandVoice: BrandVoice): string {
    let adjusted = content;

    // Remove avoid words
    brandVoice.avoidWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      adjusted = adjusted.replace(regex, '');
    });

    // Add brand vocabulary where appropriate
    // (simplified - in production would use NLP)

    return adjusted;
  }

  // ========================
  // Hashtag Generation
  // ========================

  private generateHashtags(topic: string, count: number): string[] {
    const words = topic.split(' ');
    const hashtags: string[] = [];

    // Generate from topic words
    words.forEach(word => {
      if (word.length > 3) {
        hashtags.push('#' + word.replace(/[^a-zA-Z0-9]/g, ''));
      }
    });

    // Add trending/related hashtags (would use API in production)
    const trending = ['#AI', '#Tech', '#Innovation', '#Digital', '#Future'];
    hashtags.push(...trending.slice(0, count - hashtags.length));

    return hashtags.slice(0, count);
  }

  private getCharacterLimit(platform?: Platform): number {
    const limits: Record<Platform, number> = {
      twitter: 280,
      linkedin: 3000,
      facebook: 63206,
      instagram: 2200,
      tiktok: 150,
      youtube: 5000,
      reddit: 40000,
    };

    return platform ? limits[platform] : 280;
  }

  // ========================
  // Batch Generation
  // ========================

  async batchGenerate(requests: ContentRequest[]): Promise<GeneratedContent[]> {
    return Promise.all(requests.map(req => this.generateContent(req)));
  }
}

const contentCreationService = new ContentCreationService();
export default contentCreationService;

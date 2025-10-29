/**
 * Dialogue Context Service - v4.0 Core
 *
 * Features:
 * - Reference resolution (pronouns, entities)
 * - Topic tracking
 * - Intent detection
 * - Context window management
 * - Entity linking
 */

import { v4 as uuidv4 } from 'uuid';

export interface DialogueContext {
  conversationId: string;
  messages: ContextMessage[];
  entities: Map<string, Entity>;
  topics: Topic[];
  currentTopic?: string;
  intentHistory: Intent[];
  references: Reference[];
  createdAt: Date;
  lastUpdated: Date;
}

export interface ContextMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  entities: string[]; // Entity IDs
  intent?: Intent;
  topicId?: string;
}

export interface Entity {
  id: string;
  type: 'person' | 'place' | 'organization' | 'product' | 'concept' | 'other';
  name: string;
  aliases: string[];
  firstMention: number; // Message index
  lastMention: number;
  mentionCount: number;
  attributes: Map<string, any>;
}

export interface Topic {
  id: string;
  name: string;
  keywords: string[];
  startMessage: number;
  endMessage?: number;
  confidence: number;
  relatedTopics: string[];
}

export interface Intent {
  type: 'question' | 'command' | 'statement' | 'feedback' | 'clarification' | 'greeting' | 'farewell';
  confidence: number;
  entities: string[];
  action?: string;
  parameters?: Record<string, any>;
}

export interface Reference {
  id: string;
  messageId: string;
  text: string; // The referential expression (e.g., "it", "that", "he")
  resolvedEntityId?: string;
  confidence: number;
}

class DialogueContextService {
  private contexts: Map<string, DialogueContext> = new Map();

  private readonly MAX_CONTEXT_MESSAGES = 50;
  private readonly TOPIC_CHANGE_THRESHOLD = 0.4;

  // ========================
  // Context Management
  // ========================

  createContext(conversationId: string): DialogueContext {
    const context: DialogueContext = {
      conversationId,
      messages: [],
      entities: new Map(),
      topics: [],
      intentHistory: [],
      references: [],
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    this.contexts.set(conversationId, context);
    return context;
  }

  getContext(conversationId: string): DialogueContext | undefined {
    return this.contexts.get(conversationId);
  }

  getOrCreateContext(conversationId: string): DialogueContext {
    return this.getContext(conversationId) || this.createContext(conversationId);
  }

  // ========================
  // Message Processing
  // ========================

  async addMessage(
    conversationId: string,
    role: ContextMessage['role'],
    content: string
  ): Promise<ContextMessage> {
    const context = this.getOrCreateContext(conversationId);

    // Extract entities
    const entities = await this.extractEntities(content, context);

    // Detect intent
    const intent = await this.detectIntent(content, context);

    // Detect topic
    const topicId = await this.detectTopic(content, context);

    // Resolve references
    await this.resolveReferences(content, context);

    const message: ContextMessage = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date(),
      entities: Array.from(entities.keys()),
      intent,
      topicId,
    };

    context.messages.push(message);
    context.intentHistory.push(intent);
    context.lastUpdated = new Date();

    // Prune old messages if needed
    if (context.messages.length > this.MAX_CONTEXT_MESSAGES) {
      context.messages = context.messages.slice(-this.MAX_CONTEXT_MESSAGES);
    }

    return message;
  }

  // ========================
  // Entity Extraction
  // ========================

  private async extractEntities(
    content: string,
    context: DialogueContext
  ): Promise<Map<string, Entity>> {
    const extracted = new Map<string, Entity>();

    // Simple NER (in production, use proper NER model)
    const patterns = {
      person: /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g, // John Doe
      place: /\b(in|at|to) ([A-Z][a-z]+)\b/g,
      organization: /\b([A-Z][a-z]+ Inc\.|Corp\.|Ltd\.)\b/g,
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[match.length - 1];

        // Check if entity already exists
        let entity = this.findEntityByName(context, name);

        if (!entity) {
          entity = {
            id: uuidv4(),
            type: type as Entity['type'],
            name,
            aliases: [],
            firstMention: context.messages.length,
            lastMention: context.messages.length,
            mentionCount: 1,
            attributes: new Map(),
          };

          context.entities.set(entity.id, entity);
        } else {
          entity.lastMention = context.messages.length;
          entity.mentionCount++;
        }

        extracted.set(entity.id, entity);
      }
    }

    return extracted;
  }

  private findEntityByName(context: DialogueContext, name: string): Entity | undefined {
    return Array.from(context.entities.values()).find(
      e => e.name.toLowerCase() === name.toLowerCase() ||
           e.aliases.some(a => a.toLowerCase() === name.toLowerCase())
    );
  }

  // ========================
  // Intent Detection
  // ========================

  private async detectIntent(content: string, context: DialogueContext): Promise<Intent> {
    const lower = content.toLowerCase();

    // Question detection
    if (lower.includes('?') || lower.startsWith('what') || lower.startsWith('how') ||
        lower.startsWith('why') || lower.startsWith('when') || lower.startsWith('where')) {
      return {
        type: 'question',
        confidence: 0.9,
        entities: [],
      };
    }

    // Command detection
    if (lower.startsWith('please') || lower.startsWith('can you') ||
        lower.startsWith('could you') || lower.match(/^(create|delete|update|show|list)/)) {
      return {
        type: 'command',
        confidence: 0.85,
        entities: [],
        action: this.extractAction(lower),
      };
    }

    // Greeting detection
    if (lower.match(/^(hi|hello|hey|good morning|good afternoon)/)) {
      return { type: 'greeting', confidence: 0.95, entities: [] };
    }

    // Farewell detection
    if (lower.match(/(bye|goodbye|see you|farewell)/)) {
      return { type: 'farewell', confidence: 0.95, entities: [] };
    }

    // Feedback detection
    if (lower.includes('thank') || lower.includes('great') || lower.includes('perfect') ||
        lower.includes('wrong') || lower.includes('incorrect')) {
      return { type: 'feedback', confidence: 0.8, entities: [] };
    }

    // Default to statement
    return { type: 'statement', confidence: 0.6, entities: [] };
  }

  private extractAction(content: string): string {
    const actionWords = ['create', 'delete', 'update', 'show', 'list', 'find', 'search', 'add', 'remove'];
    for (const action of actionWords) {
      if (content.includes(action)) {
        return action;
      }
    }
    return 'unknown';
  }

  // ========================
  // Topic Tracking
  // ========================

  private async detectTopic(content: string, context: DialogueContext): Promise<string | undefined> {
    const keywords = this.extractKeywords(content);

    // Check if current topic still applies
    if (context.currentTopic) {
      const currentTopic = context.topics.find(t => t.id === context.currentTopic);
      if (currentTopic && this.topicMatches(keywords, currentTopic.keywords)) {
        return context.currentTopic;
      }
    }

    // Check existing topics
    for (const topic of context.topics) {
      if (this.topicMatches(keywords, topic.keywords)) {
        context.currentTopic = topic.id;
        topic.endMessage = context.messages.length;
        return topic.id;
      }
    }

    // Create new topic
    if (keywords.length >= 2) {
      const newTopic: Topic = {
        id: uuidv4(),
        name: keywords.slice(0, 3).join(' '),
        keywords,
        startMessage: context.messages.length,
        confidence: 0.7,
        relatedTopics: [],
      };

      context.topics.push(newTopic);
      context.currentTopic = newTopic.id;
      return newTopic.id;
    }

    return undefined;
  }

  private extractKeywords(content: string): string[] {
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'this', 'that'
    ]);

    const words = content.toLowerCase().match(/\b\w+\b/g) || [];

    return words
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 10);
  }

  private topicMatches(keywords1: string[], keywords2: string[]): boolean {
    const intersection = keywords1.filter(k => keywords2.includes(k));
    const similarity = intersection.length / Math.max(keywords1.length, keywords2.length);

    return similarity >= this.TOPIC_CHANGE_THRESHOLD;
  }

  // ========================
  // Reference Resolution
  // ========================

  private async resolveReferences(content: string, context: DialogueContext): Promise<void> {
    const pronouns = ['it', 'that', 'this', 'they', 'them', 'he', 'she', 'him', 'her'];
    const lower = content.toLowerCase();

    for (const pronoun of pronouns) {
      if (lower.includes(pronoun)) {
        const reference = await this.resolveReference(pronoun, context);
        if (reference) {
          context.references.push(reference);
        }
      }
    }
  }

  private async resolveReference(
    pronoun: string,
    context: DialogueContext
  ): Promise<Reference | null> {
    // Find most recently mentioned entity
    const recentEntities = Array.from(context.entities.values())
      .filter(e => e.lastMention >= context.messages.length - 5)
      .sort((a, b) => b.lastMention - a.lastMention);

    if (recentEntities.length > 0) {
      const entity = recentEntities[0];

      return {
        id: uuidv4(),
        messageId: context.messages[context.messages.length - 1]?.id || '',
        text: pronoun,
        resolvedEntityId: entity.id,
        confidence: 0.7,
      };
    }

    return null;
  }

  // ========================
  // Context Retrieval
  // ========================

  getRecentContext(conversationId: string, messageCount: number = 10): string {
    const context = this.contexts.get(conversationId);
    if (!context) return '';

    const recent = context.messages.slice(-messageCount);

    return recent.map(m => `${m.role}: ${m.content}`).join('\n');
  }

  getSummary(conversationId: string): string {
    const context = this.contexts.get(conversationId);
    if (!context) return '';

    const topics = context.topics.map(t => t.name).join(', ');
    const entityCount = context.entities.size;
    const messageCount = context.messages.length;

    return `Conversation with ${messageCount} messages covering topics: ${topics}. ` +
           `${entityCount} entities mentioned.`;
  }

  getEntitiesByType(conversationId: string, type: Entity['type']): Entity[] {
    const context = this.contexts.get(conversationId);
    if (!context) return [];

    return Array.from(context.entities.values())
      .filter(e => e.type === type);
  }

  // ========================
  // Analytics
  // ========================

  analyzeContext(conversationId: string): any {
    const context = this.contexts.get(conversationId);
    if (!context) return null;

    const intentCounts = new Map<string, number>();
    context.intentHistory.forEach(intent => {
      intentCounts.set(intent.type, (intentCounts.get(intent.type) || 0) + 1);
    });

    return {
      totalMessages: context.messages.length,
      entityCount: context.entities.size,
      topicCount: context.topics.length,
      currentTopic: context.currentTopic,
      intentDistribution: Object.fromEntries(intentCounts),
      mostMentionedEntities: this.getMostMentionedEntities(context, 5),
      topicProgression: context.topics.map(t => ({
        name: t.name,
        duration: (t.endMessage || context.messages.length) - t.startMessage,
      })),
    };
  }

  private getMostMentionedEntities(context: DialogueContext, limit: number): any[] {
    return Array.from(context.entities.values())
      .sort((a, b) => b.mentionCount - a.mentionCount)
      .slice(0, limit)
      .map(e => ({
        name: e.name,
        type: e.type,
        mentions: e.mentionCount,
      }));
  }

  // ========================
  // Context Cleanup
  // ========================

  clearContext(conversationId: string): boolean {
    return this.contexts.delete(conversationId);
  }

  pruneOldContexts(maxAge: number = 24 * 60 * 60 * 1000): number {
    let pruned = 0;
    const now = Date.now();

    for (const [id, context] of this.contexts.entries()) {
      const age = now - context.lastUpdated.getTime();
      if (age > maxAge) {
        this.contexts.delete(id);
        pruned++;
      }
    }

    return pruned;
  }
}

const dialogueContextService = new DialogueContextService();
export default dialogueContextService;

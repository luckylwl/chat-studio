/**
 * AI Personalization Service - v4.0 Core
 *
 * Features:
 * - User preference learning
 * - Response style adaptation
 * - Personality configuration
 * - Behavioral analysis
 * - Context-aware responses
 */

import { v4 as uuidv4 } from 'uuid';

export interface UserProfile {
  userId: string;
  preferences: UserPreferences;
  personality: PersonalityConfig;
  learningProfile: LearningProfile;
  interactionHistory: InteractionRecord[];
  createdAt: Date;
  lastUpdated: Date;
}

export interface UserPreferences {
  responseStyle: 'concise' | 'detailed' | 'balanced';
  formality: 'formal' | 'casual' | 'neutral';
  technicality: 'beginner' | 'intermediate' | 'expert';
  preferredLanguage: string;
  topicInterests: string[];
  avoidTopics: string[];
  customInstructions: string;
}

export interface PersonalityConfig {
  traits: {
    friendliness: number; // 0-100
    humor: number;
    empathy: number;
    assertiveness: number;
    creativity: number;
  };
  communicationStyle: {
    usesEmojis: boolean;
    usesMarkdown: boolean;
    providesExamples: boolean;
    asksFollowUpQuestions: boolean;
  };
}

export interface LearningProfile {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  comprehensionLevel: number; // 0-100
  preferredExampleTypes: Array<'code' | 'analogy' | 'diagram' | 'real-world'>;
  feedbackHistory: FeedbackRecord[];
  skillLevel: Map<string, number>; // topic -> proficiency (0-100)
}

export interface InteractionRecord {
  id: string;
  timestamp: Date;
  messageType: 'question' | 'command' | 'feedback' | 'casual';
  topic: string;
  satisfaction?: number; // 1-5 stars
  wasHelpful?: boolean;
  duration: number; // seconds
}

export interface FeedbackRecord {
  id: string;
  timestamp: Date;
  type: 'positive' | 'negative' | 'neutral';
  aspect: 'accuracy' | 'clarity' | 'relevance' | 'style' | 'speed';
  comment?: string;
  responseId?: string;
}

export interface AdaptiveResponse {
  content: string;
  style: string;
  confidence: number;
  adaptations: string[];
  reasoning: string;
}

class PersonalizationService {
  private profiles: Map<string, UserProfile> = new Map();
  private readonly ADAPTATION_THRESHOLD = 0.6;

  // ========================
  // Profile Management
  // ========================

  createProfile(userId: string): UserProfile {
    const profile: UserProfile = {
      userId,
      preferences: this.getDefaultPreferences(),
      personality: this.getDefaultPersonality(),
      learningProfile: this.getDefaultLearningProfile(),
      interactionHistory: [],
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    this.profiles.set(userId, profile);
    return profile;
  }

  getProfile(userId: string): UserProfile | undefined {
    return this.profiles.get(userId);
  }

  getOrCreateProfile(userId: string): UserProfile {
    return this.getProfile(userId) || this.createProfile(userId);
  }

  updateProfile(userId: string, updates: Partial<UserProfile>): boolean {
    const profile = this.profiles.get(userId);
    if (!profile) return false;

    Object.assign(profile, updates, { lastUpdated: new Date() });
    return true;
  }

  // ========================
  // Preference Learning
  // ========================

  async learnFromInteraction(
    userId: string,
    interaction: Omit<InteractionRecord, 'id'>
  ): Promise<void> {
    const profile = this.getOrCreateProfile(userId);

    const record: InteractionRecord = {
      ...interaction,
      id: uuidv4(),
    };

    profile.interactionHistory.push(record);

    // Update preferences based on interaction patterns
    await this.updatePreferencesFromHistory(profile);

    // Update skill levels
    if (interaction.topic) {
      this.updateSkillLevel(profile, interaction.topic, interaction.wasHelpful);
    }

    profile.lastUpdated = new Date();
  }

  private async updatePreferencesFromHistory(profile: UserProfile): Promise<void> {
    const recent = profile.interactionHistory.slice(-20);

    // Analyze response style preference
    const avgDuration = recent.reduce((sum, r) => sum + r.duration, 0) / recent.length;
    if (avgDuration < 30) {
      profile.preferences.responseStyle = 'concise';
    } else if (avgDuration > 120) {
      profile.preferences.responseStyle = 'detailed';
    }

    // Analyze topic interests
    const topicCounts = new Map<string, number>();
    recent.forEach(r => {
      topicCounts.set(r.topic, (topicCounts.get(r.topic) || 0) + 1);
    });

    profile.preferences.topicInterests = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private updateSkillLevel(
    profile: UserProfile,
    topic: string,
    wasHelpful?: boolean
  ): void {
    const current = profile.learningProfile.skillLevel.get(topic) || 50;

    if (wasHelpful === true) {
      // Increase skill level
      profile.learningProfile.skillLevel.set(topic, Math.min(100, current + 5));
    } else if (wasHelpful === false) {
      // Might need more help with this topic
      profile.learningProfile.skillLevel.set(topic, Math.max(0, current - 2));
    }
  }

  // ========================
  // Response Adaptation
  // ========================

  async adaptResponse(
    userId: string,
    baseResponse: string,
    context: { topic?: string; urgency?: 'low' | 'medium' | 'high' }
  ): Promise<AdaptiveResponse> {
    const profile = this.getOrCreateProfile(userId);
    const adaptations: string[] = [];
    let content = baseResponse;

    // Apply style adaptations
    content = this.applyStyleAdaptation(content, profile, adaptations);

    // Apply personality adaptations
    content = this.applyPersonalityAdaptation(content, profile, adaptations);

    // Apply technical level adaptation
    content = this.applyTechnicalAdaptation(content, profile, context.topic, adaptations);

    // Calculate adaptation confidence
    const confidence = this.calculateAdaptationConfidence(profile);

    return {
      content,
      style: profile.preferences.responseStyle,
      confidence,
      adaptations,
      reasoning: this.explainAdaptations(adaptations),
    };
  }

  private applyStyleAdaptation(
    content: string,
    profile: UserProfile,
    adaptations: string[]
  ): string {
    let adapted = content;

    // Response length adaptation
    if (profile.preferences.responseStyle === 'concise') {
      // Shorten response (keep first 2-3 sentences)
      const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
      if (sentences.length > 3) {
        adapted = sentences.slice(0, 3).join(' ');
        adaptations.push('Shortened response for concise style');
      }
    } else if (profile.preferences.responseStyle === 'detailed') {
      // Add more context (placeholder - in production, expand with LLM)
      adaptations.push('Maintained detailed response');
    }

    // Formality adaptation
    if (profile.preferences.formality === 'casual') {
      adapted = adapted.replace(/However,/g, 'But');
      adapted = adapted.replace(/Additionally,/g, 'Also');
      adaptations.push('Applied casual language');
    } else if (profile.preferences.formality === 'formal') {
      adapted = adapted.replace(/But /g, 'However, ');
      adapted = adapted.replace(/Also /g, 'Additionally, ');
      adaptations.push('Applied formal language');
    }

    return adapted;
  }

  private applyPersonalityAdaptation(
    content: string,
    profile: UserProfile,
    adaptations: string[]
  ): string {
    let adapted = content;

    // Add emojis if enabled and friendliness is high
    if (profile.personality.communicationStyle.usesEmojis &&
        profile.personality.traits.friendliness > 70) {
      // Simple emoji addition (in production, use smarter placement)
      if (!content.includes('😊') && !content.includes('👍')) {
        adapted += ' 😊';
        adaptations.push('Added friendly emoji');
      }
    }

    // Add follow-up question if enabled
    if (profile.personality.communicationStyle.asksFollowUpQuestions) {
      adapted += '\n\nWould you like me to elaborate on any specific part?';
      adaptations.push('Added follow-up question');
    }

    return adapted;
  }

  private applyTechnicalAdaptation(
    content: string,
    profile: UserProfile,
    topic: string | undefined,
    adaptations: string[]
  ): string {
    if (!topic) return content;

    const skillLevel = profile.learningProfile.skillLevel.get(topic) || 50;
    let adapted = content;

    if (skillLevel < 30) {
      // Beginner level - simplify
      adaptations.push('Simplified for beginner level');
    } else if (skillLevel > 70) {
      // Expert level - can use advanced terms
      adaptations.push('Maintained advanced terminology for expert level');
    }

    return adapted;
  }

  private calculateAdaptationConfidence(profile: UserProfile): number {
    const historySize = profile.interactionHistory.length;
    const feedbackSize = profile.learningProfile.feedbackHistory.length;

    // More interactions = higher confidence
    const historyConfidence = Math.min(100, (historySize / 20) * 100);
    const feedbackConfidence = Math.min(100, (feedbackSize / 10) * 100);

    return (historyConfidence * 0.6 + feedbackConfidence * 0.4);
  }

  private explainAdaptations(adaptations: string[]): string {
    if (adaptations.length === 0) {
      return 'No adaptations applied (using default style)';
    }

    return `Applied ${adaptations.length} adaptations: ${adaptations.join(', ')}`;
  }

  // ========================
  // Feedback Processing
  // ========================

  async processFeedback(
    userId: string,
    feedback: Omit<FeedbackRecord, 'id' | 'timestamp'>
  ): Promise<void> {
    const profile = this.getOrCreateProfile(userId);

    const record: FeedbackRecord = {
      ...feedback,
      id: uuidv4(),
      timestamp: new Date(),
    };

    profile.learningProfile.feedbackHistory.push(record);

    // Adjust preferences based on feedback
    await this.adjustFromFeedback(profile, record);

    profile.lastUpdated = new Date();
  }

  private async adjustFromFeedback(
    profile: UserProfile,
    feedback: FeedbackRecord
  ): Promise<void> {
    if (feedback.type === 'negative') {
      // Adjust based on negative feedback
      switch (feedback.aspect) {
        case 'clarity':
          // User wants clearer responses
          if (profile.preferences.responseStyle === 'concise') {
            profile.preferences.responseStyle = 'balanced';
          }
          break;
        case 'style':
          // Adjust personality traits
          if (profile.personality.traits.friendliness > 50) {
            profile.personality.traits.friendliness -= 10;
          }
          break;
        case 'relevance':
          // Focus more on user's topic interests
          break;
      }
    } else if (feedback.type === 'positive') {
      // Reinforce current settings
      profile.learningProfile.comprehensionLevel = Math.min(100,
        profile.learningProfile.comprehensionLevel + 2
      );
    }
  }

  // ========================
  // Behavioral Analysis
  // ========================

  analyzeBehaviorPatterns(userId: string): any {
    const profile = this.profiles.get(userId);
    if (!profile) return null;

    const history = profile.interactionHistory;

    return {
      totalInteractions: history.length,
      avgSessionDuration: this.calculateAvgDuration(history),
      preferredTimeOfDay: this.getPreferredTimeOfDay(history),
      mostActiveTopics: this.getMostActiveTopics(history),
      satisfactionTrend: this.getSatisfactionTrend(history),
      responseStyleMatch: this.calculateStyleMatch(profile),
    };
  }

  private calculateAvgDuration(history: InteractionRecord[]): number {
    if (history.length === 0) return 0;
    return history.reduce((sum, r) => sum + r.duration, 0) / history.length;
  }

  private getPreferredTimeOfDay(history: InteractionRecord[]): string {
    const hourCounts = new Array(24).fill(0);

    history.forEach(r => {
      const hour = r.timestamp.getHours();
      hourCounts[hour]++;
    });

    const maxHour = hourCounts.indexOf(Math.max(...hourCounts));

    if (maxHour < 12) return 'morning';
    if (maxHour < 18) return 'afternoon';
    return 'evening';
  }

  private getMostActiveTopics(history: InteractionRecord[]): string[] {
    const topicCounts = new Map<string, number>();

    history.forEach(r => {
      topicCounts.set(r.topic, (topicCounts.get(r.topic) || 0) + 1);
    });

    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private getSatisfactionTrend(history: InteractionRecord[]): number[] {
    // Get satisfaction scores over time
    return history
      .filter(r => r.satisfaction !== undefined)
      .map(r => r.satisfaction!);
  }

  private calculateStyleMatch(profile: UserProfile): number {
    // Calculate how well responses match user preferences
    const feedbackScore = profile.learningProfile.feedbackHistory.filter(
      f => f.type === 'positive'
    ).length / Math.max(1, profile.learningProfile.feedbackHistory.length);

    return feedbackScore * 100;
  }

  // ========================
  // Default Configurations
  // ========================

  private getDefaultPreferences(): UserPreferences {
    return {
      responseStyle: 'balanced',
      formality: 'neutral',
      technicality: 'intermediate',
      preferredLanguage: 'en',
      topicInterests: [],
      avoidTopics: [],
      customInstructions: '',
    };
  }

  private getDefaultPersonality(): PersonalityConfig {
    return {
      traits: {
        friendliness: 70,
        humor: 50,
        empathy: 70,
        assertiveness: 60,
        creativity: 60,
      },
      communicationStyle: {
        usesEmojis: false,
        usesMarkdown: true,
        providesExamples: true,
        asksFollowUpQuestions: false,
      },
    };
  }

  private getDefaultLearningProfile(): LearningProfile {
    return {
      learningStyle: 'reading',
      comprehensionLevel: 50,
      preferredExampleTypes: ['code', 'real-world'],
      feedbackHistory: [],
      skillLevel: new Map(),
    };
  }

  // ========================
  // Export/Import
  // ========================

  exportProfile(userId: string): UserProfile | null {
    const profile = this.profiles.get(userId);
    return profile ? JSON.parse(JSON.stringify(profile)) : null;
  }

  importProfile(profile: UserProfile): void {
    this.profiles.set(profile.userId, profile);
  }
}

const personalizationService = new PersonalizationService();
export default personalizationService;

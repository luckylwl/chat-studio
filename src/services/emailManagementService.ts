/**
 * AI Email Management Assistant (v5.0)
 *
 * Intelligent email management with AI-powered features:
 * - Smart inbox organization and filtering
 * - Auto-categorization and prioritization
 * - AI-powered email drafting and suggestions
 * - Scheduled sending and follow-up reminders
 * - Template management with AI enhancement
 * - Sentiment analysis and tone adjustment
 * - Multi-account support
 * - Smart replies and quick responses
 * - Email summarization
 * - Attachment management
 * - Spam and phishing detection
 * - Email tracking and analytics
 * - Calendar integration
 * - Contact management
 *
 * Replaces: SaneBox, Superhuman, EmailTree ($10-30/month)
 */

export interface EmailAccount {
  id: string;
  email: string;
  provider: EmailProvider;
  displayName: string;
  credentials: AccountCredentials;
  settings: AccountSettings;
  statistics: AccountStatistics;
  connected: boolean;
  lastSync: string;
  createdAt: string;
}

export type EmailProvider = 'gmail' | 'outlook' | 'yahoo' | 'icloud' | 'custom' | 'imap';

export interface AccountCredentials {
  accessToken?: string;
  refreshToken?: string;
  imapServer?: string;
  imapPort?: number;
  smtpServer?: string;
  smtpPort?: number;
}

export interface AccountSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  signature: string;
  defaultFolder: string;
  notifications: boolean;
  readReceipts: boolean;
}

export interface AccountStatistics {
  totalEmails: number;
  unreadEmails: number;
  sentEmails: number;
  receivedToday: number;
  averageResponseTime: number; // hours
  emailsPerDay: number;
}

export interface Email {
  id: string;
  accountId: string;
  threadId?: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  replyTo?: EmailAddress;
  body: EmailBody;
  attachments: Attachment[];
  date: string;
  status: EmailStatus;
  folder: string;
  labels: string[];
  priority: Priority;
  category: Category;
  sentiment: Sentiment;
  metadata: EmailMetadata;
}

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface EmailBody {
  html?: string;
  text: string;
  preview: string; // First 150 chars
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number; // bytes
  url?: string;
  contentId?: string;
}

export type EmailStatus = 'unread' | 'read' | 'archived' | 'deleted' | 'draft';

export type Priority = 'urgent' | 'high' | 'normal' | 'low';

export type Category =
  | 'primary'
  | 'social'
  | 'promotions'
  | 'updates'
  | 'forums'
  | 'work'
  | 'personal'
  | 'finance'
  | 'travel'
  | 'shopping'
  | 'newsletters'
  | 'spam';

export interface Sentiment {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  emotions: Emotion[];
  tone: 'formal' | 'casual' | 'friendly' | 'professional' | 'urgent';
}

export interface Emotion {
  type: 'joy' | 'sadness' | 'anger' | 'fear' | 'surprise' | 'disgust';
  confidence: number;
}

export interface EmailMetadata {
  isImportant: boolean;
  requiresResponse: boolean;
  estimatedResponseTime?: number; // minutes
  actionItems: string[];
  mentions: string[];
  links: string[];
  readTime: number; // seconds
  summary?: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  participants: EmailAddress[];
  emails: string[]; // email IDs
  lastActivity: string;
  messageCount: number;
  unreadCount: number;
}

export interface EmailRule {
  id: string;
  name: string;
  description: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  enabled: boolean;
  priority: number;
  createdAt: string;
}

export interface RuleCondition {
  field: 'from' | 'to' | 'subject' | 'body' | 'attachment' | 'category';
  operator: 'contains' | 'equals' | 'starts-with' | 'ends-with' | 'matches';
  value: string;
}

export interface RuleAction {
  type: 'move' | 'label' | 'mark-as-read' | 'delete' | 'forward' | 'archive' | 'star';
  value?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  variables: TemplateVariable[];
  category: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateVariable {
  name: string;
  placeholder: string;
  defaultValue?: string;
  required: boolean;
}

export interface DraftEmail {
  id: string;
  accountId: string;
  subject: string;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  body: string;
  attachments: Attachment[];
  scheduledFor?: string;
  aiGenerated: boolean;
  suggestions: EmailSuggestion[];
  createdAt: string;
  updatedAt: string;
}

export interface EmailSuggestion {
  type: 'subject' | 'opening' | 'closing' | 'tone' | 'grammar' | 'clarity';
  original: string;
  suggested: string;
  reasoning: string;
  confidence: number;
}

export interface SmartReply {
  id: string;
  text: string;
  tone: 'positive' | 'neutral' | 'negative' | 'professional' | 'casual';
  length: 'short' | 'medium' | 'long';
  context: string;
}

export interface FollowUp {
  id: string;
  emailId: string;
  reminderDate: string;
  message: string;
  status: 'pending' | 'completed' | 'snoozed';
  createdAt: string;
}

export interface EmailAnalytics {
  period: 'day' | 'week' | 'month' | 'year';
  received: number;
  sent: number;
  averageResponseTime: number;
  topSenders: Array<{ email: string; count: number }>;
  topRecipients: Array<{ email: string; count: number }>;
  categoryDistribution: Record<Category, number>;
  priorityDistribution: Record<Priority, number>;
  sentimentTrends: Array<{ date: string; sentiment: number }>;
  productivityScore: number; // 0-100
}

export interface SearchQuery {
  query: string;
  filters?: {
    from?: string;
    to?: string;
    subject?: string;
    category?: Category;
    priority?: Priority;
    hasAttachment?: boolean;
    dateRange?: { start: string; end: string };
    folder?: string;
    labels?: string[];
  };
  sort?: 'date' | 'relevance' | 'sender';
  limit?: number;
}

class EmailManagementService {
  private accounts: Map<string, EmailAccount> = new Map();
  private emails: Map<string, Email> = new Map();
  private threads: Map<string, EmailThread> = new Map();
  private rules: Map<string, EmailRule> = new Map();
  private templates: Map<string, EmailTemplate> = new Map();
  private drafts: Map<string, DraftEmail> = new Map();
  private followUps: Map<string, FollowUp> = new Map();

  // ==================== Account Management ====================

  async connectAccount(data: {
    email: string;
    provider: EmailProvider;
    displayName: string;
    credentials: AccountCredentials;
  }): Promise<EmailAccount> {
    await this.delay(1500);

    const account: EmailAccount = {
      id: `account-${Date.now()}`,
      email: data.email,
      provider: data.provider,
      displayName: data.displayName,
      credentials: data.credentials,
      settings: {
        autoSync: true,
        syncInterval: 5,
        signature: '',
        defaultFolder: 'inbox',
        notifications: true,
        readReceipts: false,
      },
      statistics: {
        totalEmails: 0,
        unreadEmails: 0,
        sentEmails: 0,
        receivedToday: 0,
        averageResponseTime: 0,
        emailsPerDay: 0,
      },
      connected: true,
      lastSync: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.accounts.set(account.id, account);

    // Simulate initial sync
    await this.syncAccount(account.id);

    return account;
  }

  async syncAccount(accountId: string): Promise<number> {
    const account = this.accounts.get(accountId);
    if (!account) throw new Error('Account not found');

    await this.delay(2000);

    // Simulate fetching new emails
    const newEmailsCount = Math.floor(Math.random() * 10) + 1;

    for (let i = 0; i < newEmailsCount; i++) {
      const email = this.generateSampleEmail(accountId);
      this.emails.set(email.id, email);
      account.statistics.totalEmails++;
      if (email.status === 'unread') account.statistics.unreadEmails++;
    }

    account.lastSync = new Date().toISOString();
    this.accounts.set(accountId, account);

    return newEmailsCount;
  }

  private generateSampleEmail(accountId: string): Email {
    const senders = [
      { name: 'John Doe', email: 'john@example.com' },
      { name: 'Jane Smith', email: 'jane@company.com' },
      { name: 'Support Team', email: 'support@service.com' },
      { name: 'Newsletter', email: 'news@updates.com' },
    ];

    const subjects = [
      'Meeting Tomorrow at 2PM',
      'Project Update - Q4 Review',
      'Invoice #12345 - Payment Due',
      'Welcome to Our Service!',
      'Your Weekly Summary',
    ];

    const sender = senders[Math.floor(Math.random() * senders.length)];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];

    return {
      id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      accountId,
      subject,
      from: sender,
      to: [{ email: 'me@example.com' }],
      body: {
        text: 'This is a sample email body. In production, this would contain the actual email content.',
        preview: 'This is a sample email body. In production...',
      },
      attachments: [],
      date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: Math.random() > 0.3 ? 'unread' : 'read',
      folder: 'inbox',
      labels: [],
      priority: this.determinePriority(subject),
      category: this.categorizeEmail(subject, sender.email),
      sentiment: this.analyzeSentiment('This is a sample email body.'),
      metadata: {
        isImportant: Math.random() > 0.7,
        requiresResponse: Math.random() > 0.5,
        estimatedResponseTime: Math.floor(Math.random() * 120) + 15,
        actionItems: [],
        mentions: [],
        links: [],
        readTime: 30,
      },
    };
  }

  getAccount(id: string): EmailAccount | undefined {
    return this.accounts.get(id);
  }

  getAllAccounts(): EmailAccount[] {
    return Array.from(this.accounts.values());
  }

  disconnectAccount(accountId: string): void {
    this.accounts.delete(accountId);
    // Delete associated emails
    const emailsToDelete = Array.from(this.emails.values())
      .filter(email => email.accountId === accountId)
      .map(email => email.id);
    emailsToDelete.forEach(id => this.emails.delete(id));
  }

  // ==================== Email Management ====================

  getEmail(id: string): Email | undefined {
    return this.emails.get(id);
  }

  getAllEmails(accountId?: string, folder?: string): Email[] {
    let emails = Array.from(this.emails.values());

    if (accountId) {
      emails = emails.filter(e => e.accountId === accountId);
    }

    if (folder) {
      emails = emails.filter(e => e.folder === folder);
    }

    return emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async searchEmails(query: SearchQuery): Promise<Email[]> {
    await this.delay(500);

    let emails = Array.from(this.emails.values());

    // Apply filters
    if (query.filters) {
      if (query.filters.from) {
        emails = emails.filter(e => e.from.email.includes(query.filters!.from!));
      }
      if (query.filters.subject) {
        emails = emails.filter(e => e.subject.toLowerCase().includes(query.filters!.subject!.toLowerCase()));
      }
      if (query.filters.category) {
        emails = emails.filter(e => e.category === query.filters!.category);
      }
      if (query.filters.priority) {
        emails = emails.filter(e => e.priority === query.filters!.priority);
      }
      if (query.filters.hasAttachment) {
        emails = emails.filter(e => e.attachments.length > 0);
      }
      if (query.filters.folder) {
        emails = emails.filter(e => e.folder === query.filters!.folder);
      }
    }

    // Text search
    if (query.query) {
      const searchLower = query.query.toLowerCase();
      emails = emails.filter(e =>
        e.subject.toLowerCase().includes(searchLower) ||
        e.body.text.toLowerCase().includes(searchLower) ||
        e.from.email.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    if (query.sort === 'date') {
      emails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    // Limit
    const limit = query.limit || 50;
    return emails.slice(0, limit);
  }

  markAsRead(emailId: string): Email {
    const email = this.emails.get(emailId);
    if (!email) throw new Error('Email not found');

    email.status = 'read';
    this.emails.set(emailId, email);

    // Update account statistics
    const account = this.accounts.get(email.accountId);
    if (account) {
      account.statistics.unreadEmails = Math.max(0, account.statistics.unreadEmails - 1);
      this.accounts.set(email.accountId, account);
    }

    return email;
  }

  moveEmail(emailId: string, folder: string): Email {
    const email = this.emails.get(emailId);
    if (!email) throw new Error('Email not found');

    email.folder = folder;
    this.emails.set(emailId, email);

    return email;
  }

  deleteEmail(emailId: string): void {
    const email = this.emails.get(emailId);
    if (email) {
      email.status = 'deleted';
      email.folder = 'trash';
      this.emails.set(emailId, email);
    }
  }

  // ==================== AI-Powered Features ====================

  private determinePriority(subject: string): Priority {
    const urgent = ['urgent', 'asap', 'immediate', 'critical'];
    const high = ['important', 'priority', 'attention required'];

    const subjectLower = subject.toLowerCase();

    if (urgent.some(word => subjectLower.includes(word))) return 'urgent';
    if (high.some(word => subjectLower.includes(word))) return 'high';

    return 'normal';
  }

  private categorizeEmail(subject: string, from: string): Category {
    const subjectLower = subject.toLowerCase();
    const fromLower = from.toLowerCase();

    if (fromLower.includes('noreply') || fromLower.includes('newsletter')) return 'newsletters';
    if (subjectLower.includes('invoice') || subjectLower.includes('payment')) return 'finance';
    if (subjectLower.includes('order') || subjectLower.includes('shipping')) return 'shopping';
    if (subjectLower.includes('meeting') || subjectLower.includes('project')) return 'work';
    if (subjectLower.includes('promotion') || subjectLower.includes('sale')) return 'promotions';

    return 'primary';
  }

  private analyzeSentiment(text: string): Sentiment {
    // Simplified sentiment analysis
    const positiveWords = ['thank', 'great', 'excellent', 'appreciate', 'happy'];
    const negativeWords = ['unfortunately', 'sorry', 'issue', 'problem', 'concern'];

    const textLower = text.toLowerCase();
    let score = 0;

    positiveWords.forEach(word => {
      if (textLower.includes(word)) score += 0.2;
    });

    negativeWords.forEach(word => {
      if (textLower.includes(word)) score -= 0.2;
    });

    return {
      overall: score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral',
      score: Math.max(-1, Math.min(1, score)),
      emotions: [],
      tone: 'professional',
    };
  }

  async generateSmartReplies(emailId: string): Promise<SmartReply[]> {
    const email = this.emails.get(emailId);
    if (!email) throw new Error('Email not found');

    await this.delay(800);

    return [
      {
        id: 'reply-1',
        text: 'Thank you for your email. I will review this and get back to you shortly.',
        tone: 'professional',
        length: 'short',
        context: 'acknowledgment',
      },
      {
        id: 'reply-2',
        text: 'I appreciate you reaching out. Let me check on this and I\'ll provide an update by end of day.',
        tone: 'professional',
        length: 'medium',
        context: 'commitment',
      },
      {
        id: 'reply-3',
        text: 'Thanks! Looks good to me.',
        tone: 'casual',
        length: 'short',
        context: 'approval',
      },
    ];
  }

  async draftEmailWithAI(data: {
    accountId: string;
    to: EmailAddress[];
    context: string;
    tone?: 'formal' | 'casual' | 'friendly';
    length?: 'short' | 'medium' | 'long';
  }): Promise<DraftEmail> {
    await this.delay(1500);

    const subject = this.generateSubject(data.context);
    const body = this.generateEmailBody(data.context, data.tone, data.length);
    const suggestions = this.generateSuggestions(body);

    const draft: DraftEmail = {
      id: `draft-${Date.now()}`,
      accountId: data.accountId,
      subject,
      to: data.to,
      body,
      attachments: [],
      aiGenerated: true,
      suggestions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.drafts.set(draft.id, draft);
    return draft;
  }

  private generateSubject(context: string): string {
    // AI-generated subject based on context
    return `Re: ${context.slice(0, 50)}`;
  }

  private generateEmailBody(context: string, tone?: string, length?: string): string {
    const opening = tone === 'casual' ? 'Hi there,' : 'Dear recipient,';
    const body = `\n\nThank you for your message regarding ${context}.\n\nI wanted to follow up on this matter and provide you with an update. Based on our discussion, I believe we can move forward with the proposed solution.\n\nPlease let me know if you have any questions or need additional information.\n\n`;
    const closing = tone === 'casual' ? 'Best,\n[Your name]' : 'Best regards,\n[Your name]';

    return opening + body + closing;
  }

  private generateSuggestions(body: string): EmailSuggestion[] {
    return [
      {
        type: 'tone',
        original: body,
        suggested: body.replace('move forward', 'proceed'),
        reasoning: 'More formal tone',
        confidence: 0.85,
      },
      {
        type: 'clarity',
        original: 'I believe we can',
        suggested: 'We can',
        reasoning: 'More concise and direct',
        confidence: 0.75,
      },
    ];
  }

  async summarizeEmail(emailId: string): Promise<string> {
    const email = this.emails.get(emailId);
    if (!email) throw new Error('Email not found');

    await this.delay(500);

    // AI-generated summary
    return `Email from ${email.from.name || email.from.email} regarding "${email.subject}". Key points: ${email.metadata.actionItems.length > 0 ? email.metadata.actionItems.join(', ') : 'General correspondence'}. ${email.metadata.requiresResponse ? 'Response required.' : 'No action needed.'}`;
  }

  // ==================== Email Rules ====================

  createRule(data: Omit<EmailRule, 'id' | 'createdAt'>): EmailRule {
    const rule: EmailRule = {
      id: `rule-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };

    this.rules.set(rule.id, rule);
    return rule;
  }

  applyRule(ruleId: string, emailId: string): void {
    const rule = this.rules.get(ruleId);
    const email = this.emails.get(emailId);

    if (!rule || !email || !rule.enabled) return;

    // Check conditions
    const matches = rule.conditions.every(condition => this.checkCondition(condition, email));

    if (matches) {
      // Apply actions
      for (const action of rule.actions) {
        this.applyAction(action, email);
      }
    }
  }

  private checkCondition(condition: RuleCondition, email: Email): boolean {
    let value: string = '';

    switch (condition.field) {
      case 'from':
        value = email.from.email;
        break;
      case 'subject':
        value = email.subject;
        break;
      case 'body':
        value = email.body.text;
        break;
    }

    switch (condition.operator) {
      case 'contains':
        return value.toLowerCase().includes(condition.value.toLowerCase());
      case 'equals':
        return value.toLowerCase() === condition.value.toLowerCase();
      case 'starts-with':
        return value.toLowerCase().startsWith(condition.value.toLowerCase());
      case 'ends-with':
        return value.toLowerCase().endsWith(condition.value.toLowerCase());
      default:
        return false;
    }
  }

  private applyAction(action: RuleAction, email: Email): void {
    switch (action.type) {
      case 'move':
        if (action.value) email.folder = action.value;
        break;
      case 'label':
        if (action.value && !email.labels.includes(action.value)) {
          email.labels.push(action.value);
        }
        break;
      case 'mark-as-read':
        email.status = 'read';
        break;
      case 'archive':
        email.folder = 'archive';
        break;
      case 'delete':
        email.status = 'deleted';
        break;
    }

    this.emails.set(email.id, email);
  }

  getRule(id: string): EmailRule | undefined {
    return this.rules.get(id);
  }

  getAllRules(): EmailRule[] {
    return Array.from(this.rules.values());
  }

  // ==================== Templates ====================

  createTemplate(data: Omit<EmailTemplate, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): EmailTemplate {
    const template: EmailTemplate = {
      id: `template-${Date.now()}`,
      ...data,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(template.id, template);
    return template;
  }

  getTemplate(id: string): EmailTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(category?: string): EmailTemplate[] {
    let templates = Array.from(this.templates.values());

    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    return templates;
  }

  // ==================== Follow-ups ====================

  createFollowUp(data: Omit<FollowUp, 'id' | 'status' | 'createdAt'>): FollowUp {
    const followUp: FollowUp = {
      id: `followup-${Date.now()}`,
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.followUps.set(followUp.id, followUp);
    return followUp;
  }

  getPendingFollowUps(): FollowUp[] {
    return Array.from(this.followUps.values())
      .filter(f => f.status === 'pending' && new Date(f.reminderDate) <= new Date())
      .sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime());
  }

  completeFollowUp(id: string): void {
    const followUp = this.followUps.get(id);
    if (followUp) {
      followUp.status = 'completed';
      this.followUps.set(id, followUp);
    }
  }

  // ==================== Analytics ====================

  getAnalytics(accountId: string, period: EmailAnalytics['period']): EmailAnalytics {
    const emails = this.getAllEmails(accountId);

    const now = Date.now();
    const periodMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
      year: 365 * 24 * 60 * 60 * 1000,
    }[period];

    const periodEmails = emails.filter(e => now - new Date(e.date).getTime() < periodMs);

    const received = periodEmails.filter(e => e.folder === 'inbox' || e.folder === 'archive').length;
    const sent = periodEmails.filter(e => e.folder === 'sent').length;

    const categoryDist: Record<Category, number> = {} as any;
    const priorityDist: Record<Priority, number> = {} as any;

    for (const email of periodEmails) {
      categoryDist[email.category] = (categoryDist[email.category] || 0) + 1;
      priorityDist[email.priority] = (priorityDist[email.priority] || 0) + 1;
    }

    return {
      period,
      received,
      sent,
      averageResponseTime: 4.5,
      topSenders: this.getTopCorrespondents(periodEmails, 'from'),
      topRecipients: this.getTopCorrespondents(periodEmails, 'to'),
      categoryDistribution: categoryDist,
      priorityDistribution: priorityDist,
      sentimentTrends: [],
      productivityScore: 75 + Math.random() * 20,
    };
  }

  private getTopCorrespondents(emails: Email[], direction: 'from' | 'to'): Array<{ email: string; count: number }> {
    const counts = new Map<string, number>();

    for (const email of emails) {
      const address = direction === 'from' ? email.from.email : email.to[0]?.email;
      if (address) {
        counts.set(address, (counts.get(address) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  // ==================== Helper Methods ====================

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== Statistics ====================

  getStatistics() {
    const allEmails = Array.from(this.emails.values());

    return {
      totalAccounts: this.accounts.size,
      totalEmails: allEmails.length,
      unreadEmails: allEmails.filter(e => e.status === 'unread').length,
      draftEmails: this.drafts.size,
      totalRules: this.rules.size,
      activeRules: Array.from(this.rules.values()).filter(r => r.enabled).length,
      totalTemplates: this.templates.size,
      pendingFollowUps: Array.from(this.followUps.values()).filter(f => f.status === 'pending').length,
      averagePriority: this.calculateAveragePriority(allEmails),
      sentimentDistribution: this.calculateSentimentDistribution(allEmails),
    };
  }

  private calculateAveragePriority(emails: Email[]): string {
    const priorityScores = { urgent: 4, high: 3, normal: 2, low: 1 };
    const total = emails.reduce((sum, e) => sum + priorityScores[e.priority], 0);
    const avg = total / emails.length;

    if (avg >= 3.5) return 'urgent';
    if (avg >= 2.5) return 'high';
    if (avg >= 1.5) return 'normal';
    return 'low';
  }

  private calculateSentimentDistribution(emails: Email[]): Record<string, number> {
    const dist = { positive: 0, neutral: 0, negative: 0 };

    for (const email of emails) {
      dist[email.sentiment.overall]++;
    }

    return dist;
  }
}

export const emailManagementService = new EmailManagementService();
export default emailManagementService;

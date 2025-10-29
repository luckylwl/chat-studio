export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: number
  model?: string
  tokens?: number
  isStreaming?: boolean
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  model: string
  systemPrompt?: string
  temperature?: number
}

export interface AIModel {
  id: string
  name: string
  provider: string
  maxTokens: number
  description?: string
  pricing?: {
    input: number
    output: number
  }
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  defaultModel: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  fontSize: number
  enableSound: boolean
  enableAnimations: boolean
  // 网络功能配置
  enableWebSearch?: boolean
  searchEngine?: 'google' | 'bing' | 'duckduckgo'
  searchApiKey?: string
  enableWeather?: boolean
  enableStock?: boolean
  enableNews?: boolean
  networkTimeout?: number
  proxyServer?: string
}

export interface APIProvider {
  id: string
  name: string
  baseURL: string
  apiKey: string
  models: AIModel[]
  isEnabled: boolean
}

export interface ChatConfig {
  model: string
  temperature: number
  maxTokens: number
  systemPrompt?: string
  stream?: boolean
}

export interface AppState {
  currentConversationId: string | null
  conversations: Conversation[]
  user: User | null
  apiProviders: APIProvider[]
  isLoading: boolean
  error: string | null
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
}

export type Theme = 'light' | 'dark' | 'system'
export type MessageRole = 'user' | 'assistant' | 'system'

// ===================================
// RAG & Knowledge Base Types
// ===================================

export interface Document {
  id: string
  title: string
  content: string
  type: 'pdf' | 'docx' | 'txt' | 'md' | 'url'
  size: number
  uploadedAt: number
  userId: string
  tags: string[]
  metadata: DocumentMetadata
  embeddings?: number[][]
  chunks?: DocumentChunk[]
}

export interface DocumentMetadata {
  author?: string
  createdDate?: string
  pageCount?: number
  language?: string
  keywords?: string[]
}

export interface DocumentChunk {
  id: string
  documentId: string
  content: string
  embedding?: number[]
  startIndex: number
  endIndex: number
  metadata?: Record<string, any>
}

export interface VectorSearchResult {
  documentId: string
  chunkId: string
  content: string
  score: number
  metadata?: Record<string, any>
}

export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  documentIds: string[]
  createdAt: number
  updatedAt: number
  isPublic: boolean
  ownerId: string
  collaborators: string[]
}

// ===================================
// AI Enhancement Types
// ===================================

export interface ConversationSummary {
  conversationId: string
  summary: string
  keyPoints: string[]
  topics: string[]
  generatedAt: number
}

export interface KeywordExtraction {
  messageId: string
  keywords: string[]
  entities: Entity[]
  concepts: string[]
}

export interface Entity {
  text: string
  type: 'person' | 'organization' | 'location' | 'date' | 'other'
  confidence: number
}

export interface SentimentAnalysis {
  messageId: string
  sentiment: 'positive' | 'negative' | 'neutral'
  score: number
  emotions: {
    joy: number
    sadness: number
    anger: number
    fear: number
    surprise: number
  }
}

export interface AutoClassification {
  conversationId: string
  category: string
  tags: string[]
  confidence: number
}

export interface SmartRecommendation {
  type: 'prompt' | 'model' | 'template' | 'document'
  itemId: string
  reason: string
  confidence: number
}

// ===================================
// Collaboration Types
// ===================================

export interface Workspace {
  id: string
  name: string
  description?: string
  ownerId: string
  members: WorkspaceMember[]
  conversationIds: string[]
  knowledgeBaseIds: string[]
  createdAt: number
  updatedAt: number
  settings: WorkspaceSettings
}

export interface WorkspaceMember {
  userId: string
  role: 'owner' | 'admin' | 'editor' | 'viewer'
  joinedAt: number
  permissions: Permission[]
}

export interface Permission {
  resource: 'conversation' | 'document' | 'settings'
  actions: ('read' | 'write' | 'delete' | 'share')[]
}

export interface WorkspaceSettings {
  isPublic: boolean
  allowInvites: boolean
  defaultRole: 'editor' | 'viewer'
  maxMembers?: number
}

export interface Comment {
  id: string
  messageId: string
  conversationId: string
  userId: string
  content: string
  createdAt: number
  updatedAt?: number
  parentId?: string
  reactions: Reaction[]
}

export interface Reaction {
  userId: string
  emoji: string
  timestamp: number
}

export interface ActivityLog {
  id: string
  userId: string
  action: ActivityAction
  resourceType: 'conversation' | 'message' | 'document' | 'workspace'
  resourceId: string
  metadata?: Record<string, any>
  timestamp: number
}

export type ActivityAction =
  | 'created' | 'updated' | 'deleted'
  | 'shared' | 'commented' | 'reacted'
  | 'joined' | 'left'

export interface CollaborativeSession {
  id: string
  conversationId: string
  participants: CollaboratorPresence[]
  startedAt: number
  isActive: boolean
}

export interface CollaboratorPresence {
  userId: string
  userName: string
  avatar?: string
  cursorPosition?: number
  lastSeen: number
  isTyping: boolean
}

// ===================================
// Workflow Automation Types
// ===================================

export interface Workflow {
  id: string
  name: string
  description?: string
  trigger: WorkflowTrigger
  actions: WorkflowAction[]
  conditions?: WorkflowCondition[]
  isEnabled: boolean
  createdAt: number
  updatedAt: number
  lastRunAt?: number
  runCount: number
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'event'
  config: ScheduleConfig | WebhookConfig | EventConfig
}

export interface ScheduleConfig {
  cron: string
  timezone: string
}

export interface WebhookConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT'
  headers?: Record<string, string>
}

export interface EventConfig {
  eventType: 'conversation.created' | 'message.sent' | 'document.uploaded'
  filters?: Record<string, any>
}

export interface WorkflowAction {
  id: string
  type: 'ai_prompt' | 'webhook' | 'export' | 'notification' | 'transform'
  config: any
  onSuccess?: string // next action id
  onError?: string // next action id
}

export interface WorkflowCondition {
  field: string
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

export interface BatchJob {
  id: string
  name: string
  prompts: string[]
  model: string
  config: ChatConfig
  status: 'pending' | 'running' | 'completed' | 'failed'
  results: BatchJobResult[]
  createdAt: number
  completedAt?: number
  progress: number
}

export interface BatchJobResult {
  promptIndex: number
  prompt: string
  response: string
  tokens: number
  duration: number
  error?: string
}

export interface ScheduledTask {
  id: string
  name: string
  workflowId: string
  schedule: ScheduleConfig
  isEnabled: boolean
  lastRun?: number
  nextRun?: number
  runHistory: TaskRunHistory[]
}

export interface TaskRunHistory {
  timestamp: number
  status: 'success' | 'failed'
  duration: number
  error?: string
  result?: any
}

// ===================================
// Integration Types
// ===================================

export interface Integration {
  id: string
  name: string
  type: 'zapier' | 'slack' | 'teams' | 'discord' | 'webhook'
  config: IntegrationConfig
  isEnabled: boolean
  createdAt: number
}

export interface IntegrationConfig {
  apiKey?: string
  webhookUrl?: string
  channelId?: string
  teamId?: string
  customHeaders?: Record<string, string>
}

export interface SlackIntegration extends Integration {
  type: 'slack'
  config: {
    botToken: string
    channelId: string
    workspaceId: string
  }
}

export interface ChromeExtensionMessage {
  type: 'send_prompt' | 'get_response' | 'get_history'
  payload: any
}

// ===================================
// Advanced Content Management Types
// ===================================

export interface ConversationBranch {
  id: string
  conversationId: string
  name: string
  parentBranchId?: string
  divergePoint: number // message index
  messages: Message[]
  createdAt: number
}

export interface ConversationDiff {
  branchAId: string
  branchBId: string
  changes: DiffChange[]
}

export interface DiffChange {
  type: 'added' | 'removed' | 'modified'
  messageIndex: number
  oldContent?: string
  newContent?: string
}

export interface Folder {
  id: string
  name: string
  parentId?: string
  conversationIds: string[]
  subfolderIds: string[]
  color?: string
  icon?: string
  createdAt: number
}

export interface Tag {
  id: string
  name: string
  color: string
  conversationIds: string[]
  documentIds: string[]
}

export interface Bookmark {
  id: string
  conversationId: string
  messageId: string
  note?: string
  createdAt: number
}

export interface Draft {
  id: string
  conversationId: string
  content: string
  createdAt: number
  updatedAt: number
}

// ===================================
// Analytics Types
// ===================================

export interface ConversationQuality {
  conversationId: string
  averageResponseQuality: number
  responseTimeMs: number
  tokenEfficiency: number
  userSatisfaction?: number
  scores: QualityScore[]
}

export interface QualityScore {
  messageId: string
  relevance: number
  accuracy: number
  helpfulness: number
  coherence: number
  overall: number
}

export interface UsageTrends {
  daily: DataPoint[]
  weekly: DataPoint[]
  monthly: DataPoint[]
}

export interface DataPoint {
  timestamp: number
  value: number
  metadata?: Record<string, any>
}

export interface ModelComparison {
  models: string[]
  metrics: {
    speed: number[]
    quality: number[]
    cost: number[]
    satisfaction: number[]
  }
  testPrompts: string[]
  results: ComparisonResult[][]
}

export interface ComparisonResult {
  model: string
  response: string
  duration: number
  tokens: number
  cost: number
  qualityScore: number
}

export interface ABTest {
  id: string
  name: string
  variants: ABTestVariant[]
  metric: 'quality' | 'speed' | 'satisfaction' | 'custom'
  status: 'running' | 'completed' | 'paused'
  results: ABTestResult[]
  createdAt: number
}

export interface ABTestVariant {
  id: string
  name: string
  prompt: string
  model?: string
  config?: ChatConfig
  weight: number
}

export interface ABTestResult {
  variantId: string
  impressions: number
  metricValue: number
  confidence: number
}

export interface CostAlert {
  id: string
  threshold: number
  period: 'daily' | 'weekly' | 'monthly'
  currentCost: number
  isTriggered: boolean
  notifiedAt?: number
}

// ===================================
// Enterprise Security Types
// ===================================

export interface SSOConfig {
  provider: 'saml' | 'oauth' | 'openid'
  enabled: boolean
  config: {
    issuer?: string
    entryPoint?: string
    certificate?: string
    clientId?: string
    clientSecret?: string
    authorizationURL?: string
    tokenURL?: string
  }
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  resourceType: string
  resourceId: string
  ipAddress: string
  userAgent: string
  timestamp: number
  details?: Record<string, any>
  severity: 'info' | 'warning' | 'critical'
}

export interface EncryptionConfig {
  enabled: boolean
  algorithm: 'aes-256-gcm' | 'chacha20-poly1305'
  keyRotationDays: number
}

export interface ComplianceSettings {
  gdprEnabled: boolean
  hipaaEnabled: boolean
  dataRetentionDays: number
  allowDataExport: boolean
  requireConsent: boolean
}

export interface DataWatermark {
  conversationId: string
  userId: string
  timestamp: number
  signature: string
}

export interface Organization {
  id: string
  name: string
  departments: Department[]
  members: OrganizationMember[]
  settings: OrganizationSettings
  subscription: Subscription
}

export interface Department {
  id: string
  name: string
  parentId?: string
  memberIds: string[]
  quota: ResourceQuota
}

export interface OrganizationMember {
  userId: string
  departmentId: string
  role: 'owner' | 'admin' | 'member'
  quota: ResourceQuota
  joinedAt: number
}

export interface ResourceQuota {
  maxTokensPerMonth: number
  usedTokens: number
  maxConversations: number
  maxDocuments: number
  allowedModels: string[]
}

export interface Subscription {
  plan: 'free' | 'pro' | 'team' | 'enterprise'
  status: 'active' | 'cancelled' | 'expired'
  startDate: number
  endDate?: number
  billingCycle: 'monthly' | 'yearly'
}

export interface CostCenter {
  id: string
  name: string
  departmentId: string
  budget: number
  spent: number
  period: 'monthly' | 'quarterly' | 'yearly'
}

// ===================================
// Multimodal Types
// ===================================

export interface VoiceConfig {
  engine: 'web-speech' | 'elevenlabs' | 'openai-tts'
  voice: string
  speed: number
  pitch: number
  volume: number
}

export interface TTSRequest {
  text: string
  config: VoiceConfig
}

export interface VideoAnalysis {
  videoId: string
  frames: VideoFrame[]
  transcript?: string
  summary?: string
  keyMoments: KeyMoment[]
}

export interface VideoFrame {
  timestamp: number
  imageData: string
  description?: string
}

export interface KeyMoment {
  timestamp: number
  description: string
  importance: number
}

export interface ImageGeneration {
  prompt: string
  model: 'dall-e-3' | 'midjourney' | 'stable-diffusion'
  size: '256x256' | '512x512' | '1024x1024' | '1024x1792'
  quality: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  result?: {
    url: string
    revisedPrompt?: string
  }
}

export interface OCRResult {
  imageId: string
  text: string
  confidence: number
  blocks: TextBlock[]
}

export interface TextBlock {
  text: string
  boundingBox: BoundingBox
  confidence: number
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

// ===================================
// Creative Tools Types
// ===================================

export interface DrawingBoard {
  id: string
  conversationId: string
  canvasData: string
  width: number
  height: number
  layers: DrawingLayer[]
  createdAt: number
  updatedAt: number
}

export interface DrawingLayer {
  id: string
  name: string
  visible: boolean
  opacity: number
  data: string
}

export interface MindMap {
  id: string
  conversationId: string
  rootNode: MindMapNode
  layout: 'tree' | 'radial' | 'org-chart'
  theme: string
}

export interface MindMapNode {
  id: string
  text: string
  children: MindMapNode[]
  color?: string
  icon?: string
  metadata?: Record<string, any>
}

export interface FlowChart {
  id: string
  conversationId: string
  nodes: FlowChartNode[]
  edges: FlowChartEdge[]
  layout: 'horizontal' | 'vertical'
}

export interface FlowChartNode {
  id: string
  type: 'start' | 'process' | 'decision' | 'end'
  label: string
  position: { x: number; y: number }
}

export interface FlowChartEdge {
  id: string
  source: string
  target: string
  label?: string
}

// ===================================
// Prompt Engineering Types
// ===================================

export interface PromptLab {
  id: string
  name: string
  basePrompt: string
  variants: PromptVariant[]
  testCases: PromptTestCase[]
  results: PromptTestResult[]
  createdAt: number
}

export interface PromptVariant {
  id: string
  name: string
  prompt: string
  model?: string
  temperature?: number
}

export interface PromptTestCase {
  id: string
  input: string
  expectedOutput?: string
  metadata?: Record<string, any>
}

export interface PromptTestResult {
  variantId: string
  testCaseId: string
  output: string
  score: number
  duration: number
  tokens: number
  metadata?: Record<string, any>
}

export interface FewShotExample {
  id: string
  input: string
  output: string
  category: string
  tags: string[]
}

export interface FewShotLibrary {
  id: string
  name: string
  examples: FewShotExample[]
  category: string
}

export interface FunctionCall {
  name: string
  description: string
  parameters: FunctionParameter[]
}

export interface FunctionParameter {
  name: string
  type: string
  description: string
  required: boolean
  enum?: string[]
}

export interface PromptChain {
  id: string
  name: string
  steps: PromptChainStep[]
  variables: Record<string, any>
}

export interface PromptChainStep {
  id: string
  name: string
  prompt: string
  model?: string
  nextStep?: string
  condition?: string
}

// ===================================
// Developer Tools Types
// ===================================

export interface APISandbox {
  id: string
  request: {
    model: string
    messages: Message[]
    config: ChatConfig
  }
  response?: {
    content: string
    tokens: number
    duration: number
    cost: number
  }
  isMock: boolean
  createdAt: number
}

export interface RegressionTest {
  id: string
  name: string
  baseline: PromptTestResult[]
  current: PromptTestResult[]
  comparison: RegressionComparison[]
  status: 'passed' | 'failed' | 'warning'
}

export interface RegressionComparison {
  testCaseId: string
  baselineScore: number
  currentScore: number
  delta: number
  deltaPercentage: number
}

export interface PerformanceBenchmark {
  modelId: string
  testSuite: string
  metrics: {
    avgLatency: number
    p50Latency: number
    p95Latency: number
    p99Latency: number
    throughput: number
    errorRate: number
  }
  timestamp: number
}

export interface CostSimulation {
  scenario: string
  estimatedVolume: {
    messagesPerDay: number
    avgTokensPerMessage: number
  }
  models: string[]
  projections: CostProjection[]
}

export interface CostProjection {
  model: string
  dailyCost: number
  monthlyCost: number
  yearlyCost: number
}

// ===================================
// UX Enhancement Types
// ===================================

export interface CustomShortcut {
  id: string
  name: string
  command: string
  description: string
  keys: string[]
  action: () => void
}

export interface WorkspaceLayout {
  id: string
  name: string
  layout: {
    sidebarWidth: number
    chatWidth: number
    panelPositions: Record<string, PanelPosition>
  }
  isDefault: boolean
}

export interface PanelPosition {
  x: number
  y: number
  width: number
  height: number
  visible: boolean
}

export interface MessageTemplate {
  id: string
  name: string
  content: string
  variables: TemplateVariable[]
  category: string
}

export interface TemplateVariable {
  name: string
  defaultValue?: string
  description?: string
}

export interface AIPersona {
  id: string
  name: string
  description: string
  systemPrompt: string
  avatar?: string
  temperature: number
  exampleMessages: string[]
}

// ===================================
// Plugin System Types
// ===================================

export interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  icon?: string
  manifest: PluginManifest
  isEnabled: boolean
  config?: Record<string, any>
  installedAt: number
}

export interface PluginManifest {
  main: string
  permissions: PluginPermission[]
  dependencies?: string[]
  hooks?: PluginHook[]
  settings?: PluginSetting[]
}

export interface PluginPermission {
  type: 'storage' | 'network' | 'ui' | 'api'
  scope: string
}

export interface PluginHook {
  event: string
  handler: string
}

export interface PluginSetting {
  key: string
  type: 'string' | 'number' | 'boolean' | 'select'
  label: string
  defaultValue: any
  options?: string[]
}

export interface PluginMarketplace {
  plugins: MarketplacePlugin[]
  categories: string[]
  featured: string[]
}

export interface MarketplacePlugin extends Plugin {
  downloads: number
  rating: number
  reviews: PluginReview[]
  screenshots: string[]
}

export interface PluginReview {
  userId: string
  rating: number
  comment: string
  timestamp: number
}

// ===================================
// Mobile Types
// ===================================

export interface PushNotification {
  id: string
  title: string
  body: string
  data?: Record<string, any>
  timestamp: number
  isRead: boolean
}

export interface MobileSettings extends UserPreferences {
  pushEnabled: boolean
  vibrationEnabled: boolean
  offlineMode: boolean
  dataSync: 'wifi-only' | 'always' | 'manual'
  cacheSize: number
}

// ===================================
// Gamification Types
// ===================================

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'usage' | 'quality' | 'collaboration' | 'special'
  requirement: AchievementRequirement
  reward: number // points
  unlockedAt?: number
}

export interface AchievementRequirement {
  type: 'conversation_count' | 'message_count' | 'token_count' | 'streak' | 'custom'
  target: number
}

export interface UserStats {
  userId: string
  points: number
  level: number
  achievements: string[]
  streak: {
    current: number
    longest: number
    lastActiveDate: number
  }
  usage: {
    totalConversations: number
    totalMessages: number
    totalTokens: number
    totalCost: number
  }
}

export interface DailyGoal {
  type: 'messages' | 'conversations' | 'tokens'
  target: number
  current: number
  date: number
}

export interface Leaderboard {
  period: 'daily' | 'weekly' | 'monthly' | 'all-time'
  metric: 'points' | 'messages' | 'quality'
  entries: LeaderboardEntry[]
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  userName: string
  avatar?: string
  value: number
}

// ===================================
// Innovative Features Types
// ===================================

export interface CodeExecutionResult {
  stdout: string
  stderr: string
  exitCode: number
  executionTime: number
}

export interface GitIntegration {
  repoUrl: string
  branch: string
  credentials?: {
    username: string
    token: string
  }
}

export interface ConversationAPI {
  conversationId: string
  endpoint: string
  apiKey: string
  rateLimit: number
  requestCount: number
  createdAt: number
}

export interface CrossModelInference {
  prompt: string
  models: string[]
  strategy: 'voting' | 'ensemble' | 'cascade' | 'auto-select'
  results: ModelInferenceResult[]
  finalResult: string
}

export interface ModelInferenceResult {
  model: string
  response: string
  confidence: number
  duration: number
}

// ===================================
// Extended Message and Conversation Types
// ===================================

export interface ExtendedMessage extends Message {
  replyTo?: string
  quotedMessage?: string
  attachments?: MessageAttachment[]
  metadata?: MessageMetadata
  quality?: QualityScore
  sentiment?: SentimentAnalysis
  keywords?: string[]
}

export interface MessageAttachment {
  id: string
  type: 'image' | 'video' | 'audio' | 'document' | 'link'
  url: string
  name: string
  size: number
  mimeType: string
}

export interface MessageMetadata {
  editHistory?: MessageEdit[]
  reactions?: Reaction[]
  isPinned?: boolean
  isBookmarked?: boolean
  customData?: Record<string, any>
}

export interface MessageEdit {
  content: string
  editedAt: number
  editedBy: string
}

export interface ExtendedConversation extends Conversation {
  folderId?: string
  tags?: string[]
  knowledgeBaseIds?: string[]
  branches?: ConversationBranch[]
  collaborators?: string[]
  isArchived?: boolean
  summary?: ConversationSummary
  quality?: ConversationQuality
  workspaceId?: string
  permissions?: Permission[]
}

// ===================================
// Extended User and App State Types
// ===================================

export interface ExtendedUser extends User {
  organizationId?: string
  departmentId?: string
  role?: 'owner' | 'admin' | 'member'
  quota?: ResourceQuota
  stats?: UserStats
  achievements?: string[]
  settings?: MobileSettings
  ssoId?: string
}

export interface ExtendedAppState extends AppState {
  workspaces: Workspace[]
  currentWorkspaceId?: string
  folders: Folder[]
  tags: Tag[]
  documents: Document[]
  knowledgeBases: KnowledgeBase[]
  workflows: Workflow[]
  plugins: Plugin[]
  integrations: Integration[]
  collaborativeSessions: CollaborativeSession[]
  activeCollaborators: CollaboratorPresence[]
}

// ===================================
// AI Chat Studio v4.0 - New Types
// 62 New Features Implementation
// ===================================

// ===================================
// 1. AI AGENT SYSTEM
// ===================================

export interface AIAgent {
  id: string
  name: string
  description: string
  type: 'autonomous' | 'assistant' | 'specialist'
  capabilities: AgentCapability[]
  tools: AgentTool[]
  memory: AgentMemory
  persona: AgentPersona
  status: 'idle' | 'working' | 'paused' | 'error'
  createdAt: number
  updatedAt: number
  userId: string
  config: AgentConfig
}

export interface AgentCapability {
  id: string
  name: string
  description: string
  enabled: boolean
}

export interface AgentTool {
  id: string
  name: string
  description: string
  type: 'web_search' | 'code_execution' | 'file_operation' | 'api_call' | 'calculation' | 'custom'
  config: Record<string, any>
  permissions: string[]
}

export interface AgentMemory {
  shortTerm: MemoryItem[]
  longTerm: MemoryItem[]
  workingMemory: Record<string, any>
  episodic: EpisodicMemory[]
}

export interface MemoryItem {
  id: string
  content: string
  type: 'fact' | 'instruction' | 'preference' | 'context'
  importance: number
  timestamp: number
  expiresAt?: number
  tags: string[]
  embedding?: number[]
}

export interface EpisodicMemory {
  id: string
  episode: string
  context: string
  outcome: string
  learned: string
  timestamp: number
}

export interface AgentPersona {
  name: string
  role: string
  background: string
  style: 'professional' | 'casual' | 'technical' | 'creative' | 'friendly'
  tone: 'formal' | 'informal' | 'empathetic' | 'direct'
  expertise: string[]
  language: string
}

export interface AgentConfig {
  autonomyLevel: 'low' | 'medium' | 'high'
  maxIterations: number
  timeout: number
  requiresApproval: boolean
  allowedTools: string[]
  safetyChecks: boolean
}

export interface AgentTask {
  id: string
  agentId: string
  goal: string
  instructions: string
  context: Record<string, any>
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  steps: AgentStep[]
  result?: any
  error?: string
  startedAt?: number
  completedAt?: number
}

export interface AgentStep {
  id: string
  action: string
  tool?: string
  input: any
  output?: any
  reasoning: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  timestamp: number
  duration?: number
}

export interface AgentCollaboration {
  id: string
  agents: string[]
  task: string
  strategy: 'sequential' | 'parallel' | 'hierarchical'
  coordination: AgentCoordination
  status: 'active' | 'completed'
  createdAt: number
}

export interface AgentCoordination {
  leader?: string
  roles: Record<string, string>
  communication: AgentMessage[]
}

export interface AgentMessage {
  from: string
  to: string
  content: string
  type: 'request' | 'response' | 'notification'
  timestamp: number
}

// ===================================
// 2. VECTOR MEMORY SYSTEM
// ===================================

export interface VectorMemory {
  id: string
  userId: string
  memories: Memory[]
  config: MemoryConfig
  stats: MemoryStats
}

export interface Memory {
  id: string
  content: string
  type: 'personal' | 'factual' | 'procedural' | 'episodic' | 'semantic'
  importance: number
  accessCount: number
  lastAccessed: number
  createdAt: number
  expiresAt?: number
  tags: string[]
  embedding: number[]
  metadata: MemoryMetadata
}

export interface MemoryMetadata {
  source: string
  confidence: number
  verified: boolean
  relatedMemories: string[]
  context: Record<string, any>
}

export interface MemoryConfig {
  maxMemories: number
  retentionDays: number
  importanceThreshold: number
  autoForget: boolean
  forgettingCurve: 'exponential' | 'linear' | 'custom'
}

export interface MemoryStats {
  totalMemories: number
  personalMemories: number
  factualMemories: number
  averageImportance: number
  storageUsed: number
}

export interface MemoryQuery {
  query: string
  type?: Memory['type']
  limit?: number
  minImportance?: number
  dateRange?: { from: number; to: number }
}

export interface MemorySearchResult {
  memory: Memory
  relevance: number
  reasoning: string
}

// ===================================
// 3. AI PERSONALIZATION
// ===================================

export interface AIPersonalization {
  userId: string
  personality: AIPersonality
  preferences: AIPreferences
  learningProfile: LearningProfile
  adaptations: Adaptation[]
}

export interface AIPersonality {
  style: 'professional' | 'casual' | 'friendly' | 'formal' | 'humorous' | 'empathetic' | 'direct'
  tone: 'warm' | 'neutral' | 'enthusiastic' | 'calm' | 'energetic'
  verbosity: 'concise' | 'moderate' | 'detailed'
  formality: number // 0-10
  creativity: number // 0-10
  technicality: number // 0-10
}

export interface AIPreferences {
  responseLength: 'short' | 'medium' | 'long'
  includeExamples: boolean
  includeExplanations: boolean
  useEmojis: boolean
  useMarkdown: boolean
  codeStyle: 'inline' | 'blocks' | 'mixed'
  language: string
  expertise: string[]
}

export interface LearningProfile {
  userInterests: string[]
  commonTopics: string[]
  preferredSources: string[]
  learningStyle: 'visual' | 'textual' | 'mixed'
  proficiencyLevels: Record<string, 'beginner' | 'intermediate' | 'advanced' | 'expert'>
}

export interface Adaptation {
  id: string
  type: 'style' | 'content' | 'format' | 'behavior'
  reason: string
  change: Record<string, any>
  effectiveFrom: number
  metrics: AdaptationMetrics
}

export interface AdaptationMetrics {
  userSatisfaction: number
  responseQuality: number
  engagement: number
}

// ===================================
// 4. MULTI-TURN DIALOGUE UNDERSTANDING
// ===================================

export interface DialogueContext {
  conversationId: string
  currentTopic: string
  topicHistory: Topic[]
  references: Reference[]
  intentions: Intention[]
  entities: Entity[]
  relationships: Relationship[]
}

export interface Topic {
  id: string
  name: string
  introduced: number
  lastMentioned: number
  importance: number
  subtopics: string[]
}

export interface Reference {
  id: string
  text: string
  referent: string
  type: 'pronoun' | 'demonstrative' | 'definite' | 'indefinite'
  resolvedTo?: string
  confidence: number
  position: number
}

export interface Intention {
  id: string
  type: 'question' | 'request' | 'statement' | 'command' | 'clarification'
  explicit: boolean
  fulfilled: boolean
  messageId: string
}

export interface Entity {
  id: string
  text: string
  type: string
  mentions: EntityMention[]
  attributes: Record<string, any>
}

export interface EntityMention {
  messageId: string
  text: string
  position: number
  confidence: number
}

export interface Relationship {
  subject: string
  predicate: string
  object: string
  confidence: number
}

// ===================================
// 5. SMART PROMPT OPTIMIZER
// ===================================

export interface PromptOptimization {
  original: string
  optimized: string
  score: PromptScore
  suggestions: PromptSuggestion[]
  improvements: string[]
  reasoning: string
}

export interface PromptScore {
  overall: number
  clarity: number
  specificity: number
  context: number
  structure: number
  effectiveness: number
}

export interface PromptSuggestion {
  type: 'clarity' | 'detail' | 'structure' | 'context' | 'formatting'
  description: string
  example: string
  priority: 'high' | 'medium' | 'low'
}

export interface PromptTemplate {
  id: string
  name: string
  description: string
  category: string
  template: string
  variables: PromptVariable[]
  examples: PromptExample[]
  rating: number
  usageCount: number
}

export interface PromptVariable {
  name: string
  description: string
  type: 'text' | 'number' | 'select' | 'multiline'
  required: boolean
  defaultValue?: any
  options?: string[]
}

export interface PromptExample {
  input: Record<string, any>
  output: string
  description: string
}

// ===================================
// 6-10. DATA ANALYSIS & VISUALIZATION
// ===================================

export interface ConversationAnalytics {
  conversationId: string
  wordCloud: WordCloudData
  topicClusters: TopicCluster[]
  patterns: ConversationPattern[]
  userBehavior: UserBehavior
  insights: Insight[]
}

export interface WordCloudData {
  words: Array<{ text: string; value: number; category?: string }>
  generatedAt: number
}

export interface TopicCluster {
  id: string
  name: string
  keywords: string[]
  conversations: string[]
  size: number
  center: number[]
}

export interface ConversationPattern {
  id: string
  type: 'time_of_day' | 'question_type' | 'topic_sequence' | 'length_distribution'
  description: string
  frequency: number
  examples: string[]
}

export interface UserBehavior {
  averageSessionDuration: number
  messagesPerSession: number
  preferredTopics: string[]
  activeHours: number[]
  responseTime: number
  engagementScore: number
}

export interface Insight {
  id: string
  type: 'trend' | 'anomaly' | 'recommendation' | 'warning'
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  actionable: boolean
  action?: string
  timestamp: number
}

export interface AdvancedReport {
  id: string
  name: string
  type: 'usage' | 'cost' | 'quality' | 'custom'
  schedule?: CronSchedule
  filters: ReportFilter[]
  metrics: ReportMetric[]
  visualizations: ReportVisualization[]
  recipients: string[]
  createdAt: number
  lastGenerated?: number
}

export interface CronSchedule {
  expression: string
  timezone: string
  enabled: boolean
}

export interface ReportFilter {
  field: string
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between'
  value: any
}

export interface ReportMetric {
  id: string
  name: string
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max'
  field: string
}

export interface ReportVisualization {
  id: string
  type: 'line' | 'bar' | 'pie' | 'table' | 'heatmap' | 'scatter'
  title: string
  data: any[]
  config: Record<string, any>
}

export interface RealTimeMonitoring {
  metrics: MonitoringMetric[]
  alerts: Alert[]
  status: SystemStatus
  logs: LogEntry[]
}

export interface MonitoringMetric {
  id: string
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  threshold?: { warning: number; critical: number }
  history: Array<{ timestamp: number; value: number }>
}

export interface Alert {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  source: string
  timestamp: number
  resolved: boolean
  actions: AlertAction[]
}

export interface AlertAction {
  id: string
  label: string
  action: string
  parameters?: Record<string, any>
}

export interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'down'
  services: ServiceStatus[]
  uptime: number
  lastCheck: number
}

export interface ServiceStatus {
  name: string
  status: 'up' | 'down' | 'degraded'
  latency: number
  errorRate: number
}

export interface LogEntry {
  id: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  timestamp: number
  source: string
  metadata?: Record<string, any>
}

export interface PredictiveAnalytics {
  userId: string
  predictions: Prediction[]
  confidence: number
  basedOn: AnalyticsData
}

export interface Prediction {
  type: 'usage' | 'cost' | 'churn' | 'trend'
  timeframe: string
  prediction: any
  confidence: number
  factors: PredictionFactor[]
}

export interface PredictionFactor {
  factor: string
  impact: number
  description: string
}

export interface AnalyticsData {
  historicalData: any[]
  patterns: string[]
  seasonality?: string
  dataQuality: number
}

export interface QualityScore {
  overall: number
  relevance: number
  accuracy: number
  completeness: number
  clarity: number
  helpfulness: number
  timestamp: number
}

export interface ConversationQuality {
  conversationId: string
  averageScore: QualityScore
  messageScores: Array<{ messageId: string; score: QualityScore }>
  improvements: string[]
  strongPoints: string[]
}

// ===================================
// 11-15. CONTENT CREATION & EDITING
// ===================================

export interface SmartDocument {
  id: string
  title: string
  content: string
  format: 'markdown' | 'html' | 'plain'
  version: number
  versions: DocumentVersion[]
  collaborators: DocumentCollaborator[]
  comments: DocumentComment[]
  status: 'draft' | 'review' | 'published' | 'archived'
  metadata: DocumentMetadata
  createdAt: number
  updatedAt: number
}

export interface DocumentVersion {
  version: number
  content: string
  changes: string
  author: string
  timestamp: number
}

export interface DocumentCollaborator {
  userId: string
  role: 'owner' | 'editor' | 'viewer'
  cursor?: CursorPosition
  selection?: TextSelection
  online: boolean
}

export interface CursorPosition {
  line: number
  column: number
  userId: string
}

export interface TextSelection {
  start: { line: number; column: number }
  end: { line: number; column: number }
  userId: string
}

export interface DocumentComment {
  id: string
  content: string
  author: string
  position: number
  resolved: boolean
  replies: CommentReply[]
  timestamp: number
}

export interface CommentReply {
  id: string
  content: string
  author: string
  timestamp: number
}

export interface DocumentMetadata {
  tags: string[]
  category: string
  readTime: number
  wordCount: number
  language: string
  seo?: SEOMetadata
}

export interface SEOMetadata {
  title: string
  description: string
  keywords: string[]
  ogImage?: string
}

export interface WritingAssistant {
  suggestions: WritingSuggestion[]
  improvements: ContentImprovement[]
  styleAnalysis: StyleAnalysis
  grammar: GrammarCheck[]
}

export interface WritingSuggestion {
  type: 'expand' | 'condense' | 'rephrase' | 'improve' | 'add'
  position: { start: number; end: number }
  original: string
  suggestion: string
  reason: string
  confidence: number
}

export interface ContentImprovement {
  type: 'clarity' | 'engagement' | 'structure' | 'tone' | 'vocabulary'
  description: string
  examples: string[]
  priority: number
}

export interface StyleAnalysis {
  readabilityScore: number
  gradeLevel: number
  tone: string
  voice: 'active' | 'passive' | 'mixed'
  sentenceVariety: number
  vocabulary: VocabularyAnalysis
}

export interface VocabularyAnalysis {
  uniqueWords: number
  complexity: number
  repetitiveness: number
  suggestions: string[]
}

export interface GrammarCheck {
  type: 'spelling' | 'grammar' | 'punctuation' | 'style'
  message: string
  position: { start: number; end: number }
  suggestions: string[]
  severity: 'error' | 'warning' | 'suggestion'
}

export interface TemplateMarketplace {
  templates: MarketplaceTemplate[]
  categories: TemplateCategory[]
  featured: string[]
  trending: string[]
}

export interface MarketplaceTemplate {
  id: string
  name: string
  description: string
  type: 'conversation' | 'prompt' | 'workflow' | 'document'
  category: string
  content: any
  author: string
  rating: number
  downloads: number
  price: number
  isPremium: boolean
  tags: string[]
  preview: string
  createdAt: number
}

export interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: string
  count: number
}

export interface ContentScheduler {
  id: string
  name: string
  content: any
  publishAt: number
  platforms: PublishPlatform[]
  status: 'scheduled' | 'publishing' | 'published' | 'failed'
  approvals: ContentApproval[]
  metadata: Record<string, any>
}

export interface PublishPlatform {
  platform: string
  accountId: string
  customization?: Record<string, any>
}

export interface ContentApproval {
  userId: string
  status: 'pending' | 'approved' | 'rejected'
  comment?: string
  timestamp?: number
}

export interface AIContentDetector {
  content: string
  isAIGenerated: boolean
  confidence: number
  indicators: DetectionIndicator[]
  humanScore: number
  aiScore: number
}

export interface DetectionIndicator {
  type: string
  description: string
  weight: number
}

// Continue in next message due to length...
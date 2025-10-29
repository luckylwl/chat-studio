/**
 * AI Chat Studio v5.0 - Integration & Automation Type Definitions
 *
 * Third-party integrations, AI content creation, RPA automation, and webhooks
 */

// ============================================================================
// 1. Third-Party Integrations
// ============================================================================

// Slack Integration
export interface SlackIntegration {
  id: string
  workspaceId: string
  workspaceName: string
  botToken: string
  userId: string
  channels: SlackChannel[]
  status: 'connected' | 'disconnected' | 'error'
  connectedAt: Date
}

export interface SlackChannel {
  id: string
  name: string
  isPrivate: boolean
  memberCount: number
}

export interface SlackMessage {
  id: string
  channelId: string
  text: string
  userId: string
  timestamp: Date
  attachments?: any[]
  reactions?: SlackReaction[]
}

export interface SlackReaction {
  emoji: string
  count: number
  users: string[]
}

// GitHub Integration
export interface GitHubIntegration {
  id: string
  userId: string
  username: string
  accessToken: string
  repositories: GitHubRepository[]
  status: 'connected' | 'disconnected' | 'error'
  connectedAt: Date
}

export interface GitHubRepository {
  id: string
  name: string
  fullName: string
  private: boolean
  language?: string
  stars: number
  forks: number
  openIssues: number
}

export interface GitHubPullRequest {
  id: string
  number: number
  title: string
  description: string
  author: string
  state: 'open' | 'closed' | 'merged'
  createdAt: Date
  updatedAt: Date
  commits: number
  additions: number
  deletions: number
  aiAnalysis?: PRAnalysis
}

export interface PRAnalysis {
  complexity: 'low' | 'medium' | 'high'
  quality: number // 0-100
  suggestions: string[]
  risks: string[]
  estimatedReviewTime: number // minutes
}

export interface GitHubIssue {
  id: string
  number: number
  title: string
  body: string
  state: 'open' | 'closed'
  labels: string[]
  assignees: string[]
  createdAt: Date
  aiSuggestions?: IssueSuggestions
}

export interface IssueSuggestions {
  category: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  relatedIssues: string[]
  suggestedAssignees: string[]
}

// Google Workspace Integration
export interface GoogleWorkspaceIntegration {
  id: string
  userId: string
  email: string
  accessToken: string
  refreshToken: string
  services: {
    gmail: boolean
    drive: boolean
    calendar: boolean
    docs: boolean
  }
  status: 'connected' | 'disconnected' | 'error'
  connectedAt: Date
}

export interface GmailMessage {
  id: string
  threadId: string
  from: string
  to: string[]
  subject: string
  body: string
  date: Date
  labels: string[]
  attachments: GmailAttachment[]
  aiSummary?: string
}

export interface GmailAttachment {
  filename: string
  mimeType: string
  size: number
  attachmentId: string
}

export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  size: number
  createdTime: Date
  modifiedTime: Date
  webViewLink: string
  shared: boolean
}

export interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: Date
  end: Date
  attendees: string[]
  location?: string
  meetingLink?: string
}

// ============================================================================
// 2. AI Content Creation
// ============================================================================

// Video Generation
export interface VideoProject {
  id: string
  userId: string
  title: string
  description: string
  script: string
  status: 'draft' | 'generating' | 'completed' | 'failed'
  duration: number // seconds
  resolution: '720p' | '1080p' | '4k'
  style: 'realistic' | 'animated' | 'cartoon' | 'documentary'
  scenes: VideoScene[]
  soundtrack?: string
  voiceover?: string
  createdAt: Date
  completedAt?: Date
  videoUrl?: string
}

export interface VideoScene {
  id: string
  order: number
  duration: number
  visualPrompt: string
  audioPrompt?: string
  transition: 'fade' | 'cut' | 'slide' | 'zoom'
  generatedImageUrl?: string
}

export interface VideoEditRequest {
  videoId: string
  operations: VideoOperation[]
}

export interface VideoOperation {
  type: 'trim' | 'split' | 'merge' | 'effect' | 'text' | 'audio'
  params: Record<string, any>
  timestamp?: number
}

// Music Generation
export interface MusicProject {
  id: string
  userId: string
  title: string
  genre: string
  mood: string
  tempo: number // BPM
  duration: number // seconds
  instruments: string[]
  status: 'draft' | 'generating' | 'completed' | 'failed'
  audioUrl?: string
  waveformData?: number[]
  createdAt: Date
}

export interface MusicGenerationParams {
  genre: string
  mood: string
  tempo: number
  duration: number
  instruments: string[]
  structure?: 'intro-verse-chorus-outro' | 'free-form'
  key?: string
  style?: string
}

// Voice Generation & Cloning
export interface VoiceProfile {
  id: string
  userId: string
  name: string
  gender: 'male' | 'female' | 'neutral'
  age: 'child' | 'young' | 'adult' | 'senior'
  accent: string
  language: string
  sampleAudioUrl?: string
  isCloned: boolean
  createdAt: Date
}

export interface VoiceoverProject {
  id: string
  userId: string
  title: string
  text: string
  voiceProfileId: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  audioUrl?: string
  duration?: number
  createdAt: Date
}

export interface VoiceCloneRequest {
  name: string
  audioSamples: string[] // URLs to audio files
  language: string
  minimumDuration: number // seconds of audio needed
}

// 3D Model Generation
export interface Model3DProject {
  id: string
  userId: string
  title: string
  prompt: string
  style: 'realistic' | 'lowpoly' | 'stylized' | 'photorealistic'
  status: 'pending' | 'generating' | 'completed' | 'failed'
  modelUrl?: string // .obj, .fbx, .gltf
  textureUrl?: string
  thumbnailUrl?: string
  vertexCount?: number
  createdAt: Date
}

// ============================================================================
// 3. RPA (Robotic Process Automation)
// ============================================================================

export interface RPARecording {
  id: string
  userId: string
  name: string
  description: string
  steps: RPAStep[]
  status: 'recording' | 'completed' | 'playing'
  duration: number
  createdAt: Date
}

export interface RPAStep {
  id: string
  order: number
  type: 'click' | 'type' | 'wait' | 'scroll' | 'navigate' | 'extract'
  selector?: string
  value?: any
  screenshot?: string
  timestamp: number
}

export interface RPAPlayback {
  id: string
  recordingId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
  currentStep: number
  logs: RPALog[]
  results: Record<string, any>
}

export interface RPALog {
  stepId: string
  timestamp: Date
  level: 'info' | 'warning' | 'error'
  message: string
  screenshot?: string
}

export interface FormFillingTask {
  id: string
  userId: string
  name: string
  url: string
  fields: FormField[]
  status: 'pending' | 'running' | 'completed' | 'failed'
  createdAt: Date
}

export interface FormField {
  selector: string
  type: 'text' | 'email' | 'number' | 'select' | 'checkbox' | 'radio' | 'file'
  value: any
  aiGenerated?: boolean
}

export interface WebAutomationTask {
  id: string
  userId: string
  name: string
  url: string
  actions: WebAction[]
  schedule?: TaskSchedule
  lastRun?: Date
  nextRun?: Date
  status: 'active' | 'paused' | 'completed'
}

export interface WebAction {
  type: 'navigate' | 'click' | 'type' | 'wait' | 'scroll' | 'extract' | 'screenshot'
  selector?: string
  value?: any
  waitFor?: number
}

export interface TaskSchedule {
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom'
  time?: string
  daysOfWeek?: number[]
  enabled: boolean
}

// ============================================================================
// 4. Webhook System
// ============================================================================

export interface Webhook {
  id: string
  userId: string
  name: string
  url: string
  events: string[]
  secret: string
  headers?: Record<string, string>
  active: boolean
  retryPolicy: RetryPolicy
  createdAt: Date
  lastTriggered?: Date
  totalDeliveries: number
  successfulDeliveries: number
  failedDeliveries: number
}

export interface RetryPolicy {
  maxRetries: number
  backoffMultiplier: number
  initialDelay: number // milliseconds
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  event: string
  payload: any
  attempt: number
  status: 'pending' | 'success' | 'failed' | 'retrying'
  response?: WebhookResponse
  timestamp: Date
  duration?: number
}

export interface WebhookResponse {
  statusCode: number
  headers: Record<string, string>
  body: string
}

export interface WebhookEvent {
  type: string
  source: string
  data: any
  timestamp: Date
  userId?: string
  tenantId?: string
}

// ============================================================================
// 5. Supporting Types
// ============================================================================

export interface IntegrationCredentials {
  id: string
  userId: string
  service: 'slack' | 'github' | 'google' | 'zapier' | 'other'
  credentials: Record<string, string>
  expiresAt?: Date
  createdAt: Date
}

export interface APIConnection {
  id: string
  userId: string
  name: string
  baseUrl: string
  authentication: {
    type: 'none' | 'apikey' | 'bearer' | 'basic' | 'oauth'
    config: Record<string, string>
  }
  headers?: Record<string, string>
  status: 'active' | 'inactive' | 'error'
  lastUsed?: Date
}

export interface AutomationLog {
  id: string
  userId: string
  type: 'rpa' | 'webhook' | 'integration'
  action: string
  status: 'success' | 'failed' | 'warning'
  message: string
  data?: any
  timestamp: Date
}

// Export all types
export type {
  // Slack
  SlackIntegration,
  SlackChannel,
  SlackMessage,
  SlackReaction,

  // GitHub
  GitHubIntegration,
  GitHubRepository,
  GitHubPullRequest,
  PRAnalysis,
  GitHubIssue,
  IssueSuggestions,

  // Google Workspace
  GoogleWorkspaceIntegration,
  GmailMessage,
  GmailAttachment,
  GoogleDriveFile,
  GoogleCalendarEvent,

  // AI Content Creation
  VideoProject,
  VideoScene,
  VideoEditRequest,
  VideoOperation,
  MusicProject,
  MusicGenerationParams,
  VoiceProfile,
  VoiceoverProject,
  VoiceCloneRequest,
  Model3DProject,

  // RPA
  RPARecording,
  RPAStep,
  RPAPlayback,
  RPALog,
  FormFillingTask,
  FormField,
  WebAutomationTask,
  WebAction,
  TaskSchedule,

  // Webhook
  Webhook,
  RetryPolicy,
  WebhookDelivery,
  WebhookResponse,
  WebhookEvent,

  // Supporting
  IntegrationCredentials,
  APIConnection,
  AutomationLog
}

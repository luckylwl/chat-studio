/**
 * AI Chat Studio v5.0 Type Definitions
 *
 * Advanced features including multi-agent orchestration, API gateway,
 * BI dashboards, recommendation engine, and enterprise multi-tenancy
 */

// ============================================================================
// 1. Multi-Agent Orchestration System
// ============================================================================

export interface AgentOrchestrator {
  id: string
  name: string
  description: string
  agents: OrchestrationAgent[]
  workflow: WorkflowDefinition
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface OrchestrationAgent {
  id: string
  name: string
  type: 'primary' | 'secondary' | 'specialist'
  capabilities: string[]
  role: 'coordinator' | 'executor' | 'reviewer' | 'optimizer'
  priority: number
  status: 'ready' | 'busy' | 'idle' | 'error'
}

export interface WorkflowDefinition {
  id: string
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  variables: Record<string, any>
  triggers: WorkflowTrigger[]
}

export interface WorkflowNode {
  id: string
  type: 'agent' | 'decision' | 'parallel' | 'sequential' | 'merge' | 'transform'
  agentId?: string
  config: Record<string, any>
  position: { x: number; y: number }
  inputSchema?: Record<string, any>
  outputSchema?: Record<string, any>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  condition?: string
  transform?: string
}

export interface WorkflowTrigger {
  id: string
  type: 'manual' | 'scheduled' | 'event' | 'webhook'
  config: Record<string, any>
  enabled: boolean
}

export interface AgentCommunication {
  id: string
  fromAgent: string
  toAgent: string
  messageType: 'request' | 'response' | 'notification' | 'broadcast'
  content: any
  timestamp: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export interface OrchestrationExecution {
  id: string
  orchestratorId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  results: Record<string, any>
  logs: ExecutionLog[]
  metrics: ExecutionMetrics
}

export interface ExecutionLog {
  timestamp: Date
  level: 'debug' | 'info' | 'warning' | 'error'
  agentId?: string
  nodeId?: string
  message: string
  data?: any
}

export interface ExecutionMetrics {
  totalDuration: number
  agentExecutions: number
  successRate: number
  averageResponseTime: number
  resourceUsage: {
    cpu: number
    memory: number
    tokens: number
  }
}

// ============================================================================
// 2. API Gateway System
// ============================================================================

export interface APIGateway {
  id: string
  name: string
  version: string
  baseUrl: string
  routes: APIRoute[]
  middleware: APIMiddleware[]
  rateLimits: RateLimitConfig[]
  authentication: AuthenticationConfig
  status: 'active' | 'inactive' | 'maintenance'
}

export interface APIRoute {
  id: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  description: string
  target: string
  middleware: string[]
  rateLimit?: string
  authentication: boolean
  cache?: CacheConfig
  validation?: ValidationSchema
}

export interface APIMiddleware {
  id: string
  name: string
  type: 'authentication' | 'logging' | 'transform' | 'validation' | 'ratelimit' | 'cors' | 'custom'
  config: Record<string, any>
  enabled: boolean
  order: number
}

export interface RateLimitConfig {
  id: string
  name: string
  requests: number
  window: number // seconds
  scope: 'global' | 'user' | 'ip' | 'apikey'
  action: 'reject' | 'queue' | 'throttle'
}

export interface AuthenticationConfig {
  type: 'apikey' | 'jwt' | 'oauth' | 'basic' | 'custom'
  config: Record<string, any>
  required: boolean
}

export interface CacheConfig {
  enabled: boolean
  ttl: number // seconds
  strategy: 'memory' | 'redis' | 'cdn'
}

export interface ValidationSchema {
  params?: Record<string, any>
  query?: Record<string, any>
  body?: Record<string, any>
  headers?: Record<string, any>
}

export interface APIKey {
  id: string
  key: string
  name: string
  userId: string
  scopes: string[]
  rateLimit?: string
  expiresAt?: Date
  lastUsed?: Date
  createdAt: Date
  status: 'active' | 'revoked' | 'expired'
}

export interface APIRequest {
  id: string
  method: string
  path: string
  userId?: string
  apiKeyId?: string
  ip: string
  userAgent: string
  timestamp: Date
  duration: number
  statusCode: number
  error?: string
}

export interface APIAnalytics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  requestsByEndpoint: Record<string, number>
  requestsByStatus: Record<number, number>
  topUsers: Array<{ userId: string; requests: number }>
  timeRange: { start: Date; end: Date }
}

// ============================================================================
// 3. Business Intelligence Dashboard
// ============================================================================

export interface BIDashboard {
  id: string
  name: string
  description: string
  widgets: DashboardWidget[]
  layout: DashboardLayout
  filters: DashboardFilter[]
  refreshInterval?: number // seconds
  createdAt: Date
  updatedAt: Date
  createdBy: string
  shared: boolean
  permissions: string[]
}

export interface DashboardWidget {
  id: string
  type: 'chart' | 'table' | 'metric' | 'map' | 'text' | 'custom'
  title: string
  dataSource: DataSource
  visualization: VisualizationConfig
  size: { width: number; height: number }
  position: { x: number; y: number }
  refreshInterval?: number
}

export interface DataSource {
  id: string
  type: 'sql' | 'api' | 'elasticsearch' | 'mongodb' | 'custom'
  connection: Record<string, any>
  query: string
  parameters?: Record<string, any>
  transform?: string
  cache?: CacheConfig
}

export interface VisualizationConfig {
  chartType: 'line' | 'bar' | 'pie' | 'scatter' | 'heatmap' | 'gauge' | 'table' | 'number'
  options: Record<string, any>
  colors?: string[]
  axes?: AxisConfig
  legend?: LegendConfig
}

export interface AxisConfig {
  x?: {
    label: string
    scale?: 'linear' | 'log' | 'time'
  }
  y?: {
    label: string
    scale?: 'linear' | 'log'
  }
}

export interface LegendConfig {
  show: boolean
  position: 'top' | 'bottom' | 'left' | 'right'
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'custom'
  columns: number
  gap: number
}

export interface DashboardFilter {
  id: string
  name: string
  type: 'date' | 'select' | 'multiselect' | 'text' | 'number' | 'range'
  options?: any[]
  defaultValue?: any
  applyTo: string[] // widget IDs
}

export interface Report {
  id: string
  name: string
  description: string
  dashboardId: string
  schedule?: ReportSchedule
  format: 'pdf' | 'excel' | 'csv' | 'json'
  recipients: string[]
  createdAt: Date
  lastRun?: Date
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  time: string
  timezone: string
  enabled: boolean
}

// ============================================================================
// 4. Recommendation Engine
// ============================================================================

export interface RecommendationEngine {
  id: string
  name: string
  type: 'collaborative' | 'content-based' | 'hybrid' | 'deep-learning'
  model: RecommendationModel
  config: RecommendationConfig
  status: 'training' | 'ready' | 'updating' | 'error'
  metrics: RecommendationMetrics
}

export interface RecommendationModel {
  id: string
  algorithm: 'matrix-factorization' | 'neural-collaborative' | 'item2vec' | 'transformer'
  parameters: Record<string, any>
  trainingData: DataSource
  version: string
  lastTrained: Date
}

export interface RecommendationConfig {
  maxRecommendations: number
  minScore: number
  diversityFactor: number
  freshnessFactor: number
  personalizedWeight: number
  contextualFactors: string[]
}

export interface RecommendationMetrics {
  precision: number
  recall: number
  ndcg: number // Normalized Discounted Cumulative Gain
  coverage: number
  diversity: number
  serendipity: number
}

export interface RecommendationRequest {
  userId: string
  context: Record<string, any>
  filters?: RecommendationFilter[]
  count: number
  excludeItems?: string[]
}

export interface RecommendationFilter {
  field: string
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'in'
  value: any
}

export interface Recommendation {
  itemId: string
  score: number
  reason?: string
  metadata?: Record<string, any>
}

export interface UserProfile {
  userId: string
  preferences: Record<string, any>
  interactions: UserInteraction[]
  embeddings?: number[]
  lastUpdated: Date
}

export interface UserInteraction {
  itemId: string
  type: 'view' | 'click' | 'like' | 'purchase' | 'rate' | 'share'
  value?: number
  timestamp: Date
  context?: Record<string, any>
}

export interface ItemProfile {
  itemId: string
  features: Record<string, any>
  embeddings?: number[]
  popularity: number
  category?: string
  tags?: string[]
  createdAt: Date
}

// ============================================================================
// 5. Enterprise Multi-Tenancy
// ============================================================================

export interface Tenant {
  id: string
  name: string
  domain?: string
  status: 'active' | 'suspended' | 'trial' | 'cancelled'
  subscription: Subscription
  settings: TenantSettings
  quotas: TenantQuotas
  createdAt: Date
  expiresAt?: Date
}

export interface Organization {
  id: string
  tenantId: string
  name: string
  type: 'enterprise' | 'business' | 'team' | 'personal'
  structure: OrganizationStructure
  members: OrganizationMember[]
  resources: Resource[]
  billing: BillingInfo
}

export interface OrganizationStructure {
  departments: Department[]
  teams: Team[]
  projects: Project[]
}

export interface Department {
  id: string
  name: string
  parentId?: string
  managerId: string
  members: string[]
}

export interface Team {
  id: string
  name: string
  departmentId?: string
  leadId: string
  members: string[]
  projects: string[]
}

export interface Project {
  id: string
  name: string
  teamId: string
  status: 'active' | 'completed' | 'archived'
  resources: string[]
}

export interface OrganizationMember {
  userId: string
  role: 'owner' | 'admin' | 'manager' | 'member' | 'guest'
  permissions: Permission[]
  departmentId?: string
  teamId?: string
  joinedAt: Date
}

export interface Permission {
  resource: string
  actions: ('create' | 'read' | 'update' | 'delete' | 'manage')[]
  scope: 'all' | 'own' | 'team' | 'department'
}

export interface Resource {
  id: string
  type: string
  name: string
  ownerId: string
  organizationId: string
  permissions: ResourcePermission[]
  createdAt: Date
}

export interface ResourcePermission {
  userId?: string
  teamId?: string
  departmentId?: string
  actions: string[]
}

export interface Subscription {
  id: string
  plan: SubscriptionPlan
  status: 'active' | 'past_due' | 'cancelled' | 'trialing'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialEnd?: Date
}

export interface SubscriptionPlan {
  id: string
  name: string
  tier: 'free' | 'pro' | 'team' | 'enterprise'
  price: number
  currency: string
  interval: 'month' | 'year'
  features: PlanFeature[]
  limits: PlanLimits
}

export interface PlanFeature {
  key: string
  name: string
  included: boolean
  limit?: number
}

export interface PlanLimits {
  users: number
  projects: number
  storage: number // GB
  apiCalls: number
  models: string[]
}

export interface TenantSettings {
  branding: {
    logo?: string
    primaryColor?: string
    customDomain?: string
  }
  security: {
    mfaRequired: boolean
    ssoEnabled: boolean
    ipWhitelist?: string[]
  }
  features: {
    enabled: string[]
    disabled: string[]
  }
}

export interface TenantQuotas {
  users: {
    current: number
    limit: number
  }
  storage: {
    current: number // GB
    limit: number // GB
  }
  apiCalls: {
    current: number
    limit: number
    resetDate: Date
  }
  tokens: {
    current: number
    limit: number
    resetDate: Date
  }
}

export interface BillingInfo {
  customerId: string
  paymentMethod?: PaymentMethod
  billingAddress?: Address
  invoices: Invoice[]
  upcomingInvoice?: Invoice
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'bank' | 'paypal'
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
  default: boolean
}

export interface Address {
  line1: string
  line2?: string
  city: string
  state?: string
  postalCode: string
  country: string
}

export interface Invoice {
  id: string
  number: string
  amount: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible'
  dueDate: Date
  paidAt?: Date
  items: InvoiceItem[]
  pdf?: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

// ============================================================================
// 6. Additional Supporting Types
// ============================================================================

export interface AuditLog {
  id: string
  tenantId: string
  userId: string
  action: string
  resource: string
  resourceId: string
  changes?: Record<string, any>
  metadata?: Record<string, any>
  ip: string
  userAgent: string
  timestamp: Date
}

export interface Notification {
  id: string
  userId: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  actionUrl?: string
  read: boolean
  createdAt: Date
}

export interface Webhook {
  id: string
  url: string
  events: string[]
  secret: string
  active: boolean
  lastTriggered?: Date
  failures: number
}

export interface WebhookDelivery {
  id: string
  webhookId: string
  event: string
  payload: any
  response?: {
    statusCode: number
    body: string
  }
  success: boolean
  timestamp: Date
  duration: number
}

// Export all types
export type {
  // Multi-Agent
  AgentOrchestrator,
  OrchestrationAgent,
  WorkflowDefinition,
  WorkflowNode,
  WorkflowEdge,
  WorkflowTrigger,
  AgentCommunication,
  OrchestrationExecution,
  ExecutionLog,
  ExecutionMetrics,

  // API Gateway
  APIGateway,
  APIRoute,
  APIMiddleware,
  RateLimitConfig,
  AuthenticationConfig,
  CacheConfig,
  ValidationSchema,
  APIKey,
  APIRequest,
  APIAnalytics,

  // BI Dashboard
  BIDashboard,
  DashboardWidget,
  DataSource,
  VisualizationConfig,
  AxisConfig,
  LegendConfig,
  DashboardLayout,
  DashboardFilter,
  Report,
  ReportSchedule,

  // Recommendation
  RecommendationEngine,
  RecommendationModel,
  RecommendationConfig,
  RecommendationMetrics,
  RecommendationRequest,
  RecommendationFilter,
  Recommendation,
  UserProfile,
  UserInteraction,
  ItemProfile,

  // Multi-Tenancy
  Tenant,
  Organization,
  OrganizationStructure,
  Department,
  Team,
  Project,
  OrganizationMember,
  Permission,
  Resource,
  ResourcePermission,
  Subscription,
  SubscriptionPlan,
  PlanFeature,
  PlanLimits,
  TenantSettings,
  TenantQuotas,
  BillingInfo,
  PaymentMethod,
  Address,
  Invoice,
  InvoiceItem,

  // Supporting
  AuditLog,
  Notification,
  Webhook,
  WebhookDelivery
}

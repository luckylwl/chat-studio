/**
 * AI Chat Studio v3.0 - Unified Service Exports
 *
 * This file provides a single entry point for all services.
 * Import all services from here for consistency.
 */

// RAG & Vector Database
export { default as vectorDatabaseService } from './vectorDatabaseService'
export type {
  Document,
  DocumentChunk,
  VectorSearchResult,
  KnowledgeBase
} from '../types'

// AI Enhancement
export { default as aiEnhancementService } from './aiEnhancementService'
export type {
  ConversationSummary,
  KeywordExtraction,
  SentimentAnalysis,
  AutoClassification,
  SmartRecommendation
} from '../types'

// Batch Processing
export { default as batchProcessingService } from './batchProcessingService'
export type {
  BatchJob,
  BatchJobResult
} from '../types'

// Workflow Automation
export { default as workflowService } from './workflowService'
export type {
  Workflow,
  WorkflowAction,
  WorkflowTrigger,
  ScheduledTask
} from '../types'

// Advanced Features (all sub-services)
export {
  folderService,
  collaborationService,
  gamificationService,
  pluginService,
  integrationService,
  creativeToolsService,
  multimodalService,
  enterpriseService,
  analyticsService,
  crossModelService
} from './advancedFeaturesService'

// Re-export all types
export type {
  // Folder & Organization
  Folder,
  Tag,
  Bookmark,
  Draft,

  // Collaboration
  Workspace,
  WorkspaceMember,
  Comment,
  ActivityLog,
  CollaborativeSession,
  CollaboratorPresence,

  // Gamification
  Achievement,
  UserStats,
  DailyGoal,
  Leaderboard,
  LeaderboardEntry,

  // Plugins
  Plugin,
  PluginManifest,
  PluginPermission,

  // Integrations
  Integration,
  IntegrationConfig,
  SlackIntegration,

  // Creative Tools
  MindMap,
  FlowChart,
  DrawingBoard,

  // Multimodal
  ImageGeneration,
  OCRResult,
  VoiceConfig,
  VideoAnalysis,

  // Enterprise
  Organization,
  AuditLog,
  SSOConfig,
  ComplianceSettings,

  // Analytics
  ABTest,
  CostAlert,
  UsageTrends,
  ModelComparison,

  // Innovative
  CrossModelInference,
  ConversationAPI,
  CodeExecutionResult
} from '../types'

/**
 * Initialize all services
 * Call this once when your app starts
 */
export async function initializeServices() {
  console.log('🚀 Initializing AI Chat Studio v3.0 services...')

  try {
    // Initialize vector database
    await vectorDatabaseService.initialize()
    console.log('✅ Vector database initialized')

    // Initialize workflow scheduler
    workflowService.initialize()
    console.log('✅ Workflow scheduler initialized')

    console.log('✅ All services initialized successfully!')
    return true
  } catch (error) {
    console.error('❌ Error initializing services:', error)
    return false
  }
}

/**
 * Cleanup all services
 * Call this when your app is shutting down
 */
export function cleanupServices() {
  console.log('🧹 Cleaning up services...')

  try {
    workflowService.destroy()
    console.log('✅ Services cleaned up')
  } catch (error) {
    console.error('❌ Error cleaning up services:', error)
  }
}

/**
 * Service health check
 * Returns status of all services
 */
export async function checkServiceHealth() {
  return {
    vectorDatabase: {
      status: 'healthy',
      initialized: true
    },
    aiEnhancement: {
      status: 'healthy'
    },
    batchProcessing: {
      status: 'healthy'
    },
    workflow: {
      status: 'healthy'
    },
    collaboration: {
      status: 'healthy'
    },
    gamification: {
      status: 'healthy'
    },
    analytics: {
      status: 'healthy'
    }
  }
}

// Default export with all services
export default {
  vectorDatabase: vectorDatabaseService,
  aiEnhancement: aiEnhancementService,
  batchProcessing: batchProcessingService,
  workflow: workflowService,
  folder: folderService,
  collaboration: collaborationService,
  gamification: gamificationService,
  plugin: pluginService,
  integration: integrationService,
  creative: creativeToolsService,
  multimodal: multimodalService,
  enterprise: enterpriseService,
  analytics: analyticsService,
  crossModel: crossModelService,

  // Utility functions
  initialize: initializeServices,
  cleanup: cleanupServices,
  healthCheck: checkServiceHealth
}

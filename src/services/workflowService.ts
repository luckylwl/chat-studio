import { EventEmitter } from '@/utils/EventEmitter'

interface WorkflowTrigger {
  id: string
  type: 'message_received' | 'user_action' | 'time_based' | 'api_call' | 'keyword_detected' | 'sentiment_change' | 'user_joined' | 'conversation_ended'
  name: string
  description: string
  conditions: WorkflowCondition[]
  enabled: boolean
  priority: number
  cooldown?: number // seconds
  maxExecutions?: number
}

interface WorkflowCondition {
  id: string
  field: string
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'greater_than' | 'less_than' | 'in_range' | 'not_empty' | 'is_empty'
  value: any
  caseSensitive?: boolean
}

interface WorkflowAction {
  id: string
  type: 'send_message' | 'call_api' | 'update_user_data' | 'create_task' | 'send_notification' | 'trigger_webhook' | 'schedule_action' | 'ai_analysis' | 'data_export' | 'escalate_to_human'
  name: string
  description: string
  config: Record<string, any>
  retryConfig?: {
    maxRetries: number
    backoffFactor: number
    retryDelay: number
  }
  timeout?: number
}

interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay' | 'parallel' | 'loop' | 'switch' | 'ai_decision'
  name: string
  description?: string
  config: Record<string, any>
  position: { x: number; y: number }
  connections: WorkflowConnection[]
  metadata?: {
    executionCount: number
    averageExecutionTime: number
    lastExecuted?: Date
    errorCount: number
  }
}

interface WorkflowConnection {
  id: string
  sourceNodeId: string
  targetNodeId: string
  condition?: string
  label?: string
}

interface Workflow {
  id: string
  name: string
  description: string
  version: string
  status: 'draft' | 'active' | 'paused' | 'deprecated'
  category: 'customer_service' | 'lead_generation' | 'content_moderation' | 'data_processing' | 'notification' | 'integration' | 'custom'
  tags: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  variables: WorkflowVariable[]
  triggers: WorkflowTrigger[]
  schedule?: WorkflowSchedule
  analytics: WorkflowAnalytics
  permissions: WorkflowPermissions
}

interface WorkflowVariable {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date'
  value: any
  description?: string
  isGlobal: boolean
  isSecret: boolean
}

interface WorkflowSchedule {
  enabled: boolean
  type: 'interval' | 'cron' | 'once'
  interval?: number // milliseconds
  cronExpression?: string
  startDate?: Date
  endDate?: Date
  timezone: string
}

interface WorkflowAnalytics {
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  averageExecutionTime: number
  lastExecuted?: Date
  executionHistory: WorkflowExecutionRecord[]
  nodePerformance: Record<string, {
    executions: number
    averageTime: number
    errorRate: number
  }>
}

interface WorkflowPermissions {
  canView: string[]
  canEdit: string[]
  canExecute: string[]
  canDelete: string[]
  isPublic: boolean
}

interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled' | 'waiting'
  startTime: Date
  endTime?: Date
  executionTime?: number
  triggeredBy: {
    type: 'manual' | 'trigger' | 'api' | 'schedule'
    userId?: string
    source?: string
  }
  context: Record<string, any>
  currentNodeId?: string
  executedNodes: string[]
  logs: WorkflowExecutionLog[]
  variables: Record<string, any>
  result?: {
    success: boolean
    output?: any
    error?: string
  }
}

interface WorkflowExecutionLog {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'debug'
  nodeId?: string
  message: string
  data?: any
  executionTime?: number
}

interface WorkflowExecutionRecord {
  date: Date
  executions: number
  successes: number
  failures: number
  averageTime: number
}

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'analytics'>
  usageCount: number
  rating: number
  author: string
}

interface WorkflowMetrics {
  totalWorkflows: number
  activeWorkflows: number
  totalExecutions: number
  successRate: number
  averageExecutionTime: number
  mostUsedTriggers: Array<{ trigger: string; count: number }>
  topPerformingWorkflows: Array<{ workflowId: string; name: string; executions: number; successRate: number }>
  executionTrends: Array<{ date: Date; executions: number; successes: number }>
}

class WorkflowService extends EventEmitter {
  private static instance: WorkflowService
  private workflows: Map<string, Workflow> = new Map()
  private executions: Map<string, WorkflowExecution> = new Map()
  private templates: Map<string, WorkflowTemplate> = new Map()
  private runningExecutions: Set<string> = new Set()
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map()
  private isInitialized = false

  constructor() {
    super()
    this.initializeBuiltInTemplates()
  }

  static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService()
    }
    return WorkflowService.instance
  }

  async initialize(): Promise<void> {
    try {
      await this.loadStoredData()
      this.startScheduledWorkflows()
      this.isInitialized = true
      this.emit('initialized')
    } catch (error) {
      console.error('Failed to initialize workflow service:', error)
      throw error
    }
  }

  private async loadStoredData(): Promise<void> {
    // Load workflows
    const storedWorkflows = localStorage.getItem('workflows')
    if (storedWorkflows) {
      const workflows = JSON.parse(storedWorkflows)
      workflows.forEach((workflow: any) => {
        this.workflows.set(workflow.id, {
          ...workflow,
          createdAt: new Date(workflow.createdAt),
          updatedAt: new Date(workflow.updatedAt),
          analytics: {
            ...workflow.analytics,
            lastExecuted: workflow.analytics.lastExecuted ? new Date(workflow.analytics.lastExecuted) : undefined,
            executionHistory: workflow.analytics.executionHistory.map((record: any) => ({
              ...record,
              date: new Date(record.date)
            }))
          }
        })
      })
    }

    // Load executions
    const storedExecutions = localStorage.getItem('workflow_executions')
    if (storedExecutions) {
      const executions = JSON.parse(storedExecutions)
      executions.forEach((execution: any) => {
        this.executions.set(execution.id, {
          ...execution,
          startTime: new Date(execution.startTime),
          endTime: execution.endTime ? new Date(execution.endTime) : undefined,
          logs: execution.logs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }))
        })
      })
    }
  }

  private initializeBuiltInTemplates(): void {
    const templates: WorkflowTemplate[] = [
      {
        id: 'customer_service_escalation',
        name: '客服升级流程',
        description: '当检测到客户不满意时自动升级到人工客服',
        category: 'customer_service',
        tags: ['客服', '升级', '情感分析'],
        difficulty: 'intermediate',
        usageCount: 0,
        rating: 4.8,
        author: 'AI Chat Studio',
        workflow: {
          name: '客服升级流程',
          description: '基于情感分析的客服升级自动化',
          version: '1.0.0',
          status: 'draft',
          category: 'customer_service',
          tags: ['客服', '升级'],
          nodes: [
            {
              id: 'trigger_1',
              type: 'trigger',
              name: '消息接收触发器',
              config: {
                triggerType: 'message_received',
                conditions: [
                  {
                    field: 'message.content',
                    operator: 'not_empty',
                    value: null
                  }
                ]
              },
              position: { x: 100, y: 100 },
              connections: [{ id: 'conn_1', sourceNodeId: 'trigger_1', targetNodeId: 'ai_sentiment' }],
              metadata: { executionCount: 0, averageExecutionTime: 0, errorCount: 0 }
            },
            {
              id: 'ai_sentiment',
              type: 'ai_decision',
              name: '情感分析',
              config: {
                analysisType: 'sentiment',
                threshold: 0.3
              },
              position: { x: 300, y: 100 },
              connections: [
                { id: 'conn_2', sourceNodeId: 'ai_sentiment', targetNodeId: 'escalate', condition: 'negative' },
                { id: 'conn_3', sourceNodeId: 'ai_sentiment', targetNodeId: 'normal_response', condition: 'positive' }
              ],
              metadata: { executionCount: 0, averageExecutionTime: 0, errorCount: 0 }
            },
            {
              id: 'escalate',
              type: 'action',
              name: '升级到人工',
              config: {
                actionType: 'escalate_to_human',
                department: 'customer_service',
                priority: 'high'
              },
              position: { x: 500, y: 50 },
              connections: [],
              metadata: { executionCount: 0, averageExecutionTime: 0, errorCount: 0 }
            },
            {
              id: 'normal_response',
              type: 'action',
              name: '正常AI回复',
              config: {
                actionType: 'send_message',
                template: '感谢您的咨询！我很乐意为您提供帮助。'
              },
              position: { x: 500, y: 150 },
              connections: [],
              metadata: { executionCount: 0, averageExecutionTime: 0, errorCount: 0 }
            }
          ],
          connections: [],
          variables: [
            {
              id: 'sentiment_threshold',
              name: '情感阈值',
              type: 'number',
              value: 0.3,
              description: '负面情感检测阈值',
              isGlobal: false,
              isSecret: false
            }
          ],
          triggers: [],
          analytics: {
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            averageExecutionTime: 0,
            executionHistory: [],
            nodePerformance: {}
          },
          permissions: {
            canView: ['*'],
            canEdit: ['admin'],
            canExecute: ['*'],
            canDelete: ['admin'],
            isPublic: true
          }
        }
      },
      {
        id: 'lead_qualification',
        name: '潜在客户识别',
        description: '自动识别和分类潜在客户，收集联系信息',
        category: 'lead_generation',
        tags: ['销售', '线索', '自动化'],
        difficulty: 'advanced',
        usageCount: 0,
        rating: 4.6,
        author: 'AI Chat Studio',
        workflow: {
          name: '潜在客户识别',
          description: '智能识别潜在客户并收集信息',
          version: '1.0.0',
          status: 'draft',
          category: 'lead_generation',
          tags: ['销售', '线索'],
          nodes: [
            {
              id: 'keyword_trigger',
              type: 'trigger',
              name: '关键词触发',
              config: {
                triggerType: 'keyword_detected',
                keywords: ['购买', '价格', '咨询', '产品', '服务']
              },
              position: { x: 100, y: 100 },
              connections: [{ id: 'conn_1', sourceNodeId: 'keyword_trigger', targetNodeId: 'collect_info' }],
              metadata: { executionCount: 0, averageExecutionTime: 0, errorCount: 0 }
            },
            {
              id: 'collect_info',
              type: 'action',
              name: '收集客户信息',
              config: {
                actionType: 'send_message',
                template: '我很高兴为您介绍我们的产品！请问您的姓名和联系方式是？'
              },
              position: { x: 300, y: 100 },
              connections: [{ id: 'conn_2', sourceNodeId: 'collect_info', targetNodeId: 'wait_response' }],
              metadata: { executionCount: 0, averageExecutionTime: 0, errorCount: 0 }
            },
            {
              id: 'wait_response',
              type: 'delay',
              name: '等待用户回复',
              config: {
                delayType: 'wait_for_message',
                timeout: 300000 // 5 minutes
              },
              position: { x: 500, y: 100 },
              connections: [{ id: 'conn_3', sourceNodeId: 'wait_response', targetNodeId: 'create_lead' }],
              metadata: { executionCount: 0, averageExecutionTime: 0, errorCount: 0 }
            },
            {
              id: 'create_lead',
              type: 'action',
              name: '创建销售线索',
              config: {
                actionType: 'create_task',
                taskType: 'lead',
                assignTo: 'sales_team'
              },
              position: { x: 700, y: 100 },
              connections: [],
              metadata: { executionCount: 0, averageExecutionTime: 0, errorCount: 0 }
            }
          ],
          connections: [],
          variables: [
            {
              id: 'lead_score',
              name: '线索评分',
              type: 'number',
              value: 0,
              description: '潜在客户评分',
              isGlobal: false,
              isSecret: false
            }
          ],
          triggers: [],
          analytics: {
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            averageExecutionTime: 0,
            executionHistory: [],
            nodePerformance: {}
          },
          permissions: {
            canView: ['sales', 'admin'],
            canEdit: ['admin'],
            canExecute: ['sales', 'admin'],
            canDelete: ['admin'],
            isPublic: false
          }
        }
      },
      {
        id: 'content_moderation',
        name: '内容审核',
        description: '自动检测和处理不当内容',
        category: 'content_moderation',
        tags: ['审核', '安全', 'AI检测'],
        difficulty: 'intermediate',
        usageCount: 0,
        rating: 4.9,
        author: 'AI Chat Studio',
        workflow: {
          name: '内容审核',
          description: '智能内容审核和处理',
          version: '1.0.0',
          status: 'draft',
          category: 'content_moderation',
          tags: ['审核', '安全'],
          nodes: [
            {
              id: 'content_trigger',
              type: 'trigger',
              name: '消息内容触发',
              config: {
                triggerType: 'message_received'
              },
              position: { x: 100, y: 100 },
              connections: [{ id: 'conn_1', sourceNodeId: 'content_trigger', targetNodeId: 'ai_moderation' }],
              metadata: { executionCount: 0, averageExecutionTime: 0, errorCount: 0 }
            },
            {
              id: 'ai_moderation',
              type: 'ai_decision',
              name: 'AI内容检测',
              config: {
                analysisType: 'content_moderation',
                checkTypes: ['spam', 'toxicity', 'inappropriate', 'harassment']
              },
              position: { x: 300, y: 100 },
              connections: [
                { id: 'conn_2', sourceNodeId: 'ai_moderation', targetNodeId: 'block_content', condition: 'inappropriate' },
                { id: 'conn_3', sourceNodeId: 'ai_moderation', targetNodeId: 'approve_content', condition: 'safe' }
              ],
              metadata: { executionCount: 0, averageExecutionTime: 0, errorCount: 0 }
            },
            {
              id: 'block_content',
              type: 'action',
              name: '阻止内容',
              config: {
                actionType: 'send_notification',
                message: '您的消息包含不当内容，已被系统拦截。',
                logIncident: true
              },
              position: { x: 500, y: 50 },
              connections: [],
              metadata: { executionCount: 0, averageExecutionTime: 0, errorCount: 0 }
            },
            {
              id: 'approve_content',
              type: 'action',
              name: '批准内容',
              config: {
                actionType: 'update_user_data',
                field: 'last_safe_message',
                value: 'current_time'
              },
              position: { x: 500, y: 150 },
              connections: [],
              metadata: { executionCount: 0, averageExecutionTime: 0, errorCount: 0 }
            }
          ],
          connections: [],
          variables: [
            {
              id: 'toxicity_threshold',
              name: '毒性检测阈值',
              type: 'number',
              value: 0.7,
              description: '内容毒性检测阈值',
              isGlobal: true,
              isSecret: false
            }
          ],
          triggers: [],
          analytics: {
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            averageExecutionTime: 0,
            executionHistory: [],
            nodePerformance: {}
          },
          permissions: {
            canView: ['moderator', 'admin'],
            canEdit: ['admin'],
            canExecute: ['moderator', 'admin'],
            canDelete: ['admin'],
            isPublic: false
          }
        }
      }
    ]

    templates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  // Workflow Management
  async createWorkflow(
    name: string,
    description: string,
    category: Workflow['category'],
    createdBy: string
  ): Promise<Workflow> {
    const workflow: Workflow = {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      version: '1.0.0',
      status: 'draft',
      category,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      nodes: [],
      connections: [],
      variables: [],
      triggers: [],
      analytics: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        executionHistory: [],
        nodePerformance: {}
      },
      permissions: {
        canView: [createdBy],
        canEdit: [createdBy],
        canExecute: [createdBy],
        canDelete: [createdBy],
        isPublic: false
      }
    }

    this.workflows.set(workflow.id, workflow)
    await this.saveWorkflows()
    this.emit('workflow_created', workflow)
    return workflow
  }

  async createWorkflowFromTemplate(templateId: string, userId: string, customizations?: Partial<Workflow>): Promise<Workflow> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    const workflow: Workflow = {
      ...template.workflow,
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      ...customizations
    }

    this.workflows.set(workflow.id, workflow)
    await this.saveWorkflows()

    // Update template usage count
    template.usageCount++
    await this.saveTemplates()

    this.emit('workflow_created', workflow)
    return workflow
  }

  async updateWorkflow(workflowId: string, updates: Partial<Workflow>): Promise<Workflow> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    const updatedWorkflow = {
      ...workflow,
      ...updates,
      updatedAt: new Date()
    }

    this.workflows.set(workflowId, updatedWorkflow)
    await this.saveWorkflows()
    this.emit('workflow_updated', updatedWorkflow)
    return updatedWorkflow
  }

  async executeWorkflow(
    workflowId: string,
    context: Record<string, any> = {},
    triggeredBy: WorkflowExecution['triggeredBy']
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    if (workflow.status !== 'active') {
      throw new Error(`Workflow ${workflowId} is not active`)
    }

    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId,
      status: 'running',
      startTime: new Date(),
      triggeredBy,
      context,
      executedNodes: [],
      logs: [],
      variables: this.initializeWorkflowVariables(workflow)
    }

    this.executions.set(execution.id, execution)
    this.runningExecutions.add(execution.id)

    // Start execution
    this.processWorkflowExecution(execution.id)

    this.emit('workflow_execution_started', execution)
    return execution
  }

  private async processWorkflowExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId)
    if (!execution) return

    const workflow = this.workflows.get(execution.workflowId)
    if (!workflow) return

    try {
      // Find trigger nodes
      const triggerNodes = workflow.nodes.filter(node => node.type === 'trigger')
      if (triggerNodes.length === 0) {
        throw new Error('No trigger nodes found in workflow')
      }

      // Execute starting from the first trigger
      await this.executeNode(execution, workflow, triggerNodes[0])

      // Mark execution as completed
      execution.status = 'completed'
      execution.endTime = new Date()
      execution.executionTime = execution.endTime.getTime() - execution.startTime.getTime()
      execution.result = { success: true }

      // Update workflow analytics
      this.updateWorkflowAnalytics(workflow, execution)

      this.runningExecutions.delete(executionId)
      this.emit('workflow_execution_completed', execution)

    } catch (error) {
      execution.status = 'failed'
      execution.endTime = new Date()
      execution.executionTime = execution.endTime.getTime() - execution.startTime.getTime()
      execution.result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }

      this.addExecutionLog(execution, 'error', undefined, `Workflow execution failed: ${execution.result.error}`)
      this.runningExecutions.delete(executionId)
      this.emit('workflow_execution_failed', execution)
    }

    await this.saveExecutions()
  }

  private async executeNode(execution: WorkflowExecution, workflow: Workflow, node: WorkflowNode): Promise<any> {
    const startTime = Date.now()

    try {
      execution.currentNodeId = node.id
      execution.executedNodes.push(node.id)

      this.addExecutionLog(execution, 'info', node.id, `Executing node: ${node.name}`)

      let result: any

      switch (node.type) {
        case 'trigger':
          result = await this.executeTriggerNode(execution, node)
          break
        case 'condition':
          result = await this.executeConditionNode(execution, node)
          break
        case 'action':
          result = await this.executeActionNode(execution, node)
          break
        case 'delay':
          result = await this.executeDelayNode(execution, node)
          break
        case 'ai_decision':
          result = await this.executeAIDecisionNode(execution, node)
          break
        case 'parallel':
          result = await this.executeParallelNode(execution, workflow, node)
          break
        case 'loop':
          result = await this.executeLoopNode(execution, workflow, node)
          break
        case 'switch':
          result = await this.executeSwitchNode(execution, workflow, node)
          break
        default:
          throw new Error(`Unknown node type: ${node.type}`)
      }

      const executionTime = Date.now() - startTime

      // Update node metadata
      if (!node.metadata) node.metadata = { executionCount: 0, averageExecutionTime: 0, errorCount: 0 }
      node.metadata.executionCount++
      node.metadata.averageExecutionTime =
        (node.metadata.averageExecutionTime * (node.metadata.executionCount - 1) + executionTime) / node.metadata.executionCount
      node.metadata.lastExecuted = new Date()

      this.addExecutionLog(execution, 'info', node.id, `Node completed successfully`, result, executionTime)

      // Execute next nodes based on connections
      await this.executeNextNodes(execution, workflow, node, result)

      return result

    } catch (error) {
      const executionTime = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      if (!node.metadata) node.metadata = { executionCount: 0, averageExecutionTime: 0, errorCount: 0 }
      node.metadata.errorCount++

      this.addExecutionLog(execution, 'error', node.id, `Node execution failed: ${errorMessage}`, undefined, executionTime)
      throw error
    }
  }

  private async executeTriggerNode(execution: WorkflowExecution, node: WorkflowNode): Promise<any> {
    // Trigger nodes just pass through the context
    return { triggered: true, context: execution.context }
  }

  private async executeConditionNode(execution: WorkflowExecution, node: WorkflowNode): Promise<any> {
    const { field, operator, value } = node.config
    const contextValue = this.getValueFromContext(execution, field)

    let result = false

    switch (operator) {
      case 'equals':
        result = contextValue === value
        break
      case 'contains':
        result = String(contextValue).includes(String(value))
        break
      case 'starts_with':
        result = String(contextValue).startsWith(String(value))
        break
      case 'ends_with':
        result = String(contextValue).endsWith(String(value))
        break
      case 'greater_than':
        result = Number(contextValue) > Number(value)
        break
      case 'less_than':
        result = Number(contextValue) < Number(value)
        break
      case 'not_empty':
        result = contextValue != null && contextValue !== ''
        break
      case 'is_empty':
        result = contextValue == null || contextValue === ''
        break
      case 'regex':
        result = new RegExp(value).test(String(contextValue))
        break
    }

    return { conditionMet: result, value: contextValue }
  }

  private async executeActionNode(execution: WorkflowExecution, node: WorkflowNode): Promise<any> {
    const { actionType, ...config } = node.config

    switch (actionType) {
      case 'send_message':
        return await this.executeSendMessageAction(execution, config)
      case 'call_api':
        return await this.executeCallAPIAction(execution, config)
      case 'update_user_data':
        return await this.executeUpdateUserDataAction(execution, config)
      case 'create_task':
        return await this.executeCreateTaskAction(execution, config)
      case 'send_notification':
        return await this.executeSendNotificationAction(execution, config)
      case 'trigger_webhook':
        return await this.executeTriggerWebhookAction(execution, config)
      case 'ai_analysis':
        return await this.executeAIAnalysisAction(execution, config)
      case 'data_export':
        return await this.executeDataExportAction(execution, config)
      case 'escalate_to_human':
        return await this.executeEscalateToHumanAction(execution, config)
      default:
        throw new Error(`Unknown action type: ${actionType}`)
    }
  }

  private async executeDelayNode(execution: WorkflowExecution, node: WorkflowNode): Promise<any> {
    const { delayType, duration, timeout } = node.config

    if (delayType === 'fixed_delay') {
      await this.sleep(duration || 1000)
      return { delayed: true, duration }
    } else if (delayType === 'wait_for_message') {
      // In a real implementation, this would wait for user input
      await this.sleep(timeout || 30000)
      return { waitCompleted: true, timeout }
    }

    return { delayed: false }
  }

  private async executeAIDecisionNode(execution: WorkflowExecution, node: WorkflowNode): Promise<any> {
    const { analysisType, threshold } = node.config

    // Simulate AI analysis
    await this.sleep(1000)

    switch (analysisType) {
      case 'sentiment':
        const sentiment = Math.random() - 0.5 // -0.5 to 0.5
        return {
          sentiment,
          classification: sentiment < -threshold ? 'negative' : sentiment > threshold ? 'positive' : 'neutral'
        }
      case 'content_moderation':
        const toxicity = Math.random()
        return {
          toxicity,
          classification: toxicity > 0.7 ? 'inappropriate' : 'safe'
        }
      case 'intent_detection':
        const intents = ['question', 'request', 'complaint', 'compliment']
        const detectedIntent = intents[Math.floor(Math.random() * intents.length)]
        return {
          intent: detectedIntent,
          confidence: Math.random() * 0.4 + 0.6
        }
      default:
        return { analysis: 'completed', result: 'unknown' }
    }
  }

  private async executeParallelNode(execution: WorkflowExecution, workflow: Workflow, node: WorkflowNode): Promise<any> {
    const parallelConnections = node.connections
    const promises = parallelConnections.map(conn => {
      const nextNode = workflow.nodes.find(n => n.id === conn.targetNodeId)
      return nextNode ? this.executeNode(execution, workflow, nextNode) : Promise.resolve(null)
    })

    const results = await Promise.all(promises)
    return { parallelResults: results }
  }

  private async executeLoopNode(execution: WorkflowExecution, workflow: Workflow, node: WorkflowNode): Promise<any> {
    const { iterations, condition } = node.config
    const results = []

    for (let i = 0; i < (iterations || 1); i++) {
      if (condition && !this.evaluateCondition(execution, condition)) {
        break
      }

      for (const conn of node.connections) {
        const nextNode = workflow.nodes.find(n => n.id === conn.targetNodeId)
        if (nextNode) {
          const result = await this.executeNode(execution, workflow, nextNode)
          results.push(result)
        }
      }
    }

    return { loopResults: results, iterations: results.length }
  }

  private async executeSwitchNode(execution: WorkflowExecution, workflow: Workflow, node: WorkflowNode): Promise<any> {
    const { switchValue } = node.config
    const value = this.getValueFromContext(execution, switchValue)

    for (const conn of node.connections) {
      if (conn.condition === String(value) || conn.condition === 'default') {
        const nextNode = workflow.nodes.find(n => n.id === conn.targetNodeId)
        if (nextNode) {
          return await this.executeNode(execution, workflow, nextNode)
        }
      }
    }

    return { switched: false, value }
  }

  // Action implementations
  private async executeSendMessageAction(execution: WorkflowExecution, config: any): Promise<any> {
    const { template, recipient } = config
    const message = this.interpolateTemplate(template, execution)

    // Simulate sending message
    await this.sleep(500)

    return {
      messageSent: true,
      recipient: recipient || 'user',
      message,
      timestamp: new Date()
    }
  }

  private async executeCallAPIAction(execution: WorkflowExecution, config: any): Promise<any> {
    const { url, method, headers, body } = config

    // Simulate API call
    await this.sleep(1000)

    return {
      apiCalled: true,
      url,
      method: method || 'POST',
      status: 200,
      response: { success: true, data: 'simulated response' }
    }
  }

  private async executeUpdateUserDataAction(execution: WorkflowExecution, config: any): Promise<any> {
    const { field, value } = config
    const newValue = this.interpolateTemplate(value, execution)

    // Update execution variables
    execution.variables[field] = newValue

    return {
      dataUpdated: true,
      field,
      value: newValue
    }
  }

  private async executeCreateTaskAction(execution: WorkflowExecution, config: any): Promise<any> {
    const { taskType, assignTo, priority, description } = config

    const task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: taskType,
      assignedTo: assignTo,
      priority: priority || 'medium',
      description: this.interpolateTemplate(description || '', execution),
      createdAt: new Date(),
      status: 'pending'
    }

    return {
      taskCreated: true,
      task
    }
  }

  private async executeSendNotificationAction(execution: WorkflowExecution, config: any): Promise<any> {
    const { message, recipient, channel } = config

    return {
      notificationSent: true,
      recipient: recipient || 'admin',
      channel: channel || 'email',
      message: this.interpolateTemplate(message, execution),
      timestamp: new Date()
    }
  }

  private async executeTriggerWebhookAction(execution: WorkflowExecution, config: any): Promise<any> {
    const { url, payload } = config

    // Simulate webhook trigger
    await this.sleep(800)

    return {
      webhookTriggered: true,
      url,
      payload,
      response: { status: 200, message: 'Webhook received' }
    }
  }

  private async executeAIAnalysisAction(execution: WorkflowExecution, config: any): Promise<any> {
    const { analysisType, data } = config

    // Simulate AI analysis
    await this.sleep(2000)

    return {
      analysisCompleted: true,
      type: analysisType,
      result: {
        confidence: Math.random() * 0.4 + 0.6,
        classification: 'positive',
        insights: ['High engagement detected', 'User satisfaction positive']
      }
    }
  }

  private async executeDataExportAction(execution: WorkflowExecution, config: any): Promise<any> {
    const { format, data } = config

    // Simulate data export
    await this.sleep(1500)

    return {
      dataExported: true,
      format: format || 'json',
      recordCount: Math.floor(Math.random() * 1000) + 100,
      exportUrl: `https://exports.example.com/export_${Date.now()}.${format}`
    }
  }

  private async executeEscalateToHumanAction(execution: WorkflowExecution, config: any): Promise<any> {
    const { department, priority, reason } = config

    return {
      escalated: true,
      department: department || 'customer_service',
      priority: priority || 'medium',
      reason: this.interpolateTemplate(reason || 'Automatic escalation', execution),
      assignedAgent: `agent_${Math.floor(Math.random() * 10) + 1}`,
      escalationTime: new Date()
    }
  }

  private async executeNextNodes(execution: WorkflowExecution, workflow: Workflow, currentNode: WorkflowNode, result: any): Promise<void> {
    for (const connection of currentNode.connections) {
      let shouldExecute = true

      // Check connection conditions
      if (connection.condition) {
        shouldExecute = this.evaluateConnectionCondition(connection.condition, result)
      }

      if (shouldExecute) {
        const nextNode = workflow.nodes.find(node => node.id === connection.targetNodeId)
        if (nextNode) {
          await this.executeNode(execution, workflow, nextNode)
        }
      }
    }
  }

  private evaluateConnectionCondition(condition: string, result: any): boolean {
    // Simple condition evaluation
    if (condition === 'positive' && result.classification === 'positive') return true
    if (condition === 'negative' && result.classification === 'negative') return true
    if (condition === 'neutral' && result.classification === 'neutral') return true
    if (condition === 'safe' && result.classification === 'safe') return true
    if (condition === 'inappropriate' && result.classification === 'inappropriate') return true
    if (condition === 'success' && result.success === true) return true
    if (condition === 'failure' && result.success === false) return true

    return condition === 'default'
  }

  private evaluateCondition(execution: WorkflowExecution, condition: any): boolean {
    // Implement condition evaluation logic
    return true
  }

  private getValueFromContext(execution: WorkflowExecution, path: string): any {
    const parts = path.split('.')
    let value = execution.context

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part]
      } else {
        return undefined
      }
    }

    return value
  }

  private interpolateTemplate(template: string, execution: WorkflowExecution): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = this.getValueFromContext(execution, key.trim())
      return value !== undefined ? String(value) : match
    })
  }

  private initializeWorkflowVariables(workflow: Workflow): Record<string, any> {
    const variables: Record<string, any> = {}
    workflow.variables.forEach(variable => {
      variables[variable.name] = variable.value
    })
    return variables
  }

  private addExecutionLog(
    execution: WorkflowExecution,
    level: WorkflowExecutionLog['level'],
    nodeId: string | undefined,
    message: string,
    data?: any,
    executionTime?: number
  ): void {
    execution.logs.push({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      nodeId,
      message,
      data,
      executionTime
    })
  }

  private updateWorkflowAnalytics(workflow: Workflow, execution: WorkflowExecution): void {
    workflow.analytics.totalExecutions++

    if (execution.result?.success) {
      workflow.analytics.successfulExecutions++
    } else {
      workflow.analytics.failedExecutions++
    }

    if (execution.executionTime) {
      workflow.analytics.averageExecutionTime =
        (workflow.analytics.averageExecutionTime * (workflow.analytics.totalExecutions - 1) + execution.executionTime) /
        workflow.analytics.totalExecutions
    }

    workflow.analytics.lastExecuted = execution.endTime

    // Update daily execution history
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let todayRecord = workflow.analytics.executionHistory.find(record =>
      record.date.getTime() === today.getTime()
    )

    if (!todayRecord) {
      todayRecord = {
        date: today,
        executions: 0,
        successes: 0,
        failures: 0,
        averageTime: 0
      }
      workflow.analytics.executionHistory.push(todayRecord)
    }

    todayRecord.executions++
    if (execution.result?.success) {
      todayRecord.successes++
    } else {
      todayRecord.failures++
    }

    if (execution.executionTime) {
      todayRecord.averageTime =
        (todayRecord.averageTime * (todayRecord.executions - 1) + execution.executionTime) / todayRecord.executions
    }

    // Keep only last 30 days
    workflow.analytics.executionHistory = workflow.analytics.executionHistory
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 30)
  }

  private startScheduledWorkflows(): void {
    this.workflows.forEach(workflow => {
      if (workflow.status === 'active' && workflow.schedule?.enabled) {
        this.scheduleWorkflow(workflow)
      }
    })
  }

  private scheduleWorkflow(workflow: Workflow): void {
    if (!workflow.schedule) return

    const { type, interval, cronExpression } = workflow.schedule

    if (type === 'interval' && interval) {
      const timeoutId = setInterval(() => {
        this.executeWorkflow(workflow.id, {}, {
          type: 'schedule',
          source: 'scheduler'
        })
      }, interval)

      this.scheduledJobs.set(workflow.id, timeoutId as any)
    }
    // Cron scheduling would require a cron library in a real implementation
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Data Access Methods
  getWorkflows(userId?: string): Workflow[] {
    const workflows = Array.from(this.workflows.values())
    if (!userId) return workflows

    return workflows.filter(workflow =>
      workflow.permissions.isPublic ||
      workflow.permissions.canView.includes(userId) ||
      workflow.permissions.canView.includes('*')
    )
  }

  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId)
  }

  getExecutions(workflowId?: string): WorkflowExecution[] {
    const executions = Array.from(this.executions.values())
    return workflowId ? executions.filter(exec => exec.workflowId === workflowId) : executions
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId)
  }

  getTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values())
  }

  getTemplate(templateId: string): WorkflowTemplate | undefined {
    return this.templates.get(templateId)
  }

  getWorkflowMetrics(): WorkflowMetrics {
    const workflows = Array.from(this.workflows.values())
    const executions = Array.from(this.executions.values())

    const totalExecutions = executions.length
    const successfulExecutions = executions.filter(exec => exec.result?.success).length
    const successRate = totalExecutions > 0 ? successfulExecutions / totalExecutions : 0

    const averageExecutionTime = executions.length > 0
      ? executions.reduce((sum, exec) => sum + (exec.executionTime || 0), 0) / executions.length
      : 0

    // Get execution trends for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const executionTrends: Array<{ date: Date; executions: number; successes: number }> = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const dayExecutions = executions.filter(exec => {
        const execDate = new Date(exec.startTime)
        execDate.setHours(0, 0, 0, 0)
        return execDate.getTime() === date.getTime()
      })

      executionTrends.push({
        date,
        executions: dayExecutions.length,
        successes: dayExecutions.filter(exec => exec.result?.success).length
      })
    }

    return {
      totalWorkflows: workflows.length,
      activeWorkflows: workflows.filter(wf => wf.status === 'active').length,
      totalExecutions,
      successRate,
      averageExecutionTime,
      mostUsedTriggers: [],
      topPerformingWorkflows: workflows
        .map(wf => ({
          workflowId: wf.id,
          name: wf.name,
          executions: wf.analytics.totalExecutions,
          successRate: wf.analytics.totalExecutions > 0
            ? wf.analytics.successfulExecutions / wf.analytics.totalExecutions
            : 0
        }))
        .sort((a, b) => b.executions - a.executions)
        .slice(0, 5),
      executionTrends
    }
  }

  // Storage Methods
  private async saveWorkflows(): Promise<void> {
    const workflows = Array.from(this.workflows.values())
    localStorage.setItem('workflows', JSON.stringify(workflows))
  }

  private async saveExecutions(): Promise<void> {
    const executions = Array.from(this.executions.values())
    localStorage.setItem('workflow_executions', JSON.stringify(executions))
  }

  private async saveTemplates(): Promise<void> {
    const templates = Array.from(this.templates.values())
    localStorage.setItem('workflow_templates', JSON.stringify(templates))
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`)
    }

    // Cancel scheduled job if exists
    const scheduledJob = this.scheduledJobs.get(workflowId)
    if (scheduledJob) {
      clearInterval(scheduledJob)
      this.scheduledJobs.delete(workflowId)
    }

    this.workflows.delete(workflowId)
    await this.saveWorkflows()
    this.emit('workflow_deleted', workflowId)
  }

  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId)
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`)
    }

    if (execution.status === 'running') {
      execution.status = 'cancelled'
      execution.endTime = new Date()
      execution.executionTime = execution.endTime.getTime() - execution.startTime.getTime()

      this.runningExecutions.delete(executionId)
      this.addExecutionLog(execution, 'warning', undefined, 'Execution cancelled by user')

      await this.saveExecutions()
      this.emit('workflow_execution_cancelled', execution)
    }
  }

  isReady(): boolean {
    return this.isInitialized
  }
}

export default WorkflowService.getInstance()
export {
  WorkflowService,
  type Workflow,
  type WorkflowExecution,
  type WorkflowTemplate,
  type WorkflowMetrics,
  type WorkflowNode,
  type WorkflowTrigger,
  type WorkflowAction
}
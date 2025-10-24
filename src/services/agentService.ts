/**
 * AI Agent Service
 * Autonomous agents that can plan and execute multi-step tasks
 */

import { functionCallingService, type FunctionDefinition } from './functionCalling'

export interface AgentTask {
  id: string
  description: string
  status: 'pending' | 'planning' | 'executing' | 'completed' | 'failed'
  plan?: AgentPlan
  result?: any
  error?: string
  createdAt: number
  startedAt?: number
  completedAt?: number
}

export interface AgentPlan {
  goal: string
  steps: AgentStep[]
  estimatedDuration?: number
  confidence?: number
}

export interface AgentStep {
  id: string
  description: string
  tool?: string
  arguments?: Record<string, any>
  dependencies?: string[] // IDs of steps that must complete first
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  result?: any
  error?: string
  startedAt?: number
  completedAt?: number
  duration?: number
}

export interface AgentConfig {
  maxSteps?: number
  maxDuration?: number // milliseconds
  allowedTools?: string[]
  autoExecute?: boolean
  verbose?: boolean
}

export class AgentService {
  private tasks: Map<string, AgentTask> = new Map()
  private config: AgentConfig

  constructor(config: AgentConfig = {}) {
    this.config = {
      maxSteps: 10,
      maxDuration: 300000, // 5 minutes
      autoExecute: true,
      verbose: false,
      ...config
    }
  }

  /**
   * Create a new agent task
   */
  async createTask(description: string): Promise<AgentTask> {
    const id = `task-${Date.now()}-${Math.random().toString(36).substring(7)}`

    const task: AgentTask = {
      id,
      description,
      status: 'pending',
      createdAt: Date.now()
    }

    this.tasks.set(id, task)

    if (this.config.autoExecute) {
      // Start execution in background
      this.executeTask(id).catch(console.error)
    }

    return task
  }

  /**
   * Plan task execution
   */
  async planTask(taskId: string): Promise<AgentPlan> {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    task.status = 'planning'

    try {
      // Get available tools
      const tools = functionCallingService.getFunctions()

      // Generate plan based on available tools
      const plan = await this.generatePlan(task.description, tools)

      task.plan = plan
      this.log(`Plan generated for task ${taskId}:`, plan)

      return plan
    } catch (error: any) {
      task.status = 'failed'
      task.error = error.message
      throw error
    }
  }

  /**
   * Execute a task
   */
  async executeTask(taskId: string): Promise<any> {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    task.startedAt = Date.now()

    try {
      // Generate plan if not exists
      if (!task.plan) {
        await this.planTask(taskId)
      }

      if (!task.plan) {
        throw new Error('Failed to generate plan')
      }

      task.status = 'executing'

      // Execute steps
      const results = await this.executeSteps(task.plan.steps)

      task.status = 'completed'
      task.completedAt = Date.now()
      task.result = results

      this.log(`Task ${taskId} completed:`, results)

      return results
    } catch (error: any) {
      task.status = 'failed'
      task.error = error.message
      task.completedAt = Date.now()

      this.log(`Task ${taskId} failed:`, error.message)

      throw error
    }
  }

  /**
   * Execute plan steps
   */
  private async executeSteps(steps: AgentStep[]): Promise<any> {
    const results: Record<string, any> = {}
    const completed = new Set<string>()

    // Execute steps in dependency order
    for (const step of steps) {
      // Check if dependencies are met
      if (step.dependencies && step.dependencies.length > 0) {
        const unmet = step.dependencies.filter(depId => !completed.has(depId))
        if (unmet.length > 0) {
          step.status = 'skipped'
          step.error = `Dependencies not met: ${unmet.join(', ')}`
          continue
        }
      }

      // Execute step
      step.status = 'running'
      step.startedAt = Date.now()

      try {
        const result = await this.executeStep(step, results)
        step.result = result
        step.status = 'completed'
        step.completedAt = Date.now()
        step.duration = step.completedAt - step.startedAt

        results[step.id] = result
        completed.add(step.id)

        this.log(`Step ${step.id} completed:`, result)
      } catch (error: any) {
        step.status = 'failed'
        step.error = error.message
        step.completedAt = Date.now()
        step.duration = step.completedAt - (step.startedAt || 0)

        this.log(`Step ${step.id} failed:`, error.message)

        // Decide whether to continue or abort
        if (this.isStepCritical(step)) {
          throw new Error(`Critical step failed: ${step.description}`)
        }
      }
    }

    return results
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: AgentStep,
    previousResults: Record<string, any>
  ): Promise<any> {
    if (!step.tool) {
      // Simple action without tool
      return { success: true, message: step.description }
    }

    // Resolve arguments (may reference previous results)
    const args = this.resolveArguments(step.arguments || {}, previousResults)

    // Call function
    const result = await functionCallingService.callFunction(step.tool, args)

    if (!result.success) {
      throw new Error(result.error || 'Function call failed')
    }

    return result.result
  }

  /**
   * Resolve step arguments (replace references to previous results)
   */
  private resolveArguments(
    args: Record<string, any>,
    previousResults: Record<string, any>
  ): Record<string, any> {
    const resolved: Record<string, any> = {}

    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string' && value.startsWith('$')) {
        // Reference to previous result
        const refKey = value.substring(1)
        resolved[key] = previousResults[refKey]
      } else {
        resolved[key] = value
      }
    }

    return resolved
  }

  /**
   * Generate execution plan (simplified - in production use LLM)
   */
  private async generatePlan(
    description: string,
    tools: FunctionDefinition[]
  ): Promise<AgentPlan> {
    // This is a simplified implementation
    // In production, use an LLM to generate sophisticated plans

    const steps: AgentStep[] = []

    // Parse description and match with tools
    const descLower = description.toLowerCase()

    // Example: If description mentions "search"
    if (descLower.includes('search') || descLower.includes('查找')) {
      steps.push({
        id: 'step-1',
        description: 'Perform web search',
        tool: 'web_search',
        arguments: {
          query: this.extractSearchQuery(description),
          provider: 'duckduckgo'
        },
        status: 'pending'
      })
    }

    // Example: If description mentions "calculate"
    if (descLower.includes('calculate') || descLower.includes('计算')) {
      const expression = this.extractMathExpression(description)
      if (expression) {
        steps.push({
          id: 'step-2',
          description: 'Perform calculation',
          tool: 'calculator',
          arguments: { expression },
          status: 'pending'
        })
      }
    }

    // Example: If description mentions "time" or "date"
    if (descLower.includes('time') || descLower.includes('时间') ||
        descLower.includes('date') || descLower.includes('日期')) {
      steps.push({
        id: 'step-3',
        description: 'Get current time',
        tool: 'get_current_time',
        arguments: { format: 'readable' },
        status: 'pending'
      })
    }

    // If no specific tools matched, create a generic plan
    if (steps.length === 0) {
      steps.push({
        id: 'step-1',
        description: `Execute: ${description}`,
        status: 'pending'
      })
    }

    return {
      goal: description,
      steps,
      estimatedDuration: steps.length * 2000, // 2 seconds per step
      confidence: 0.8
    }
  }

  /**
   * Extract search query from description
   */
  private extractSearchQuery(description: string): string {
    // Simple extraction - in production use NLP
    const match = description.match(/search(?:\s+for)?\s+["']?([^"']+)["']?/i) ||
                  description.match(/查找\s*["']?([^"']+)["']?/i)
    return match ? match[1] : description
  }

  /**
   * Extract math expression from description
   */
  private extractMathExpression(description: string): string | null {
    // Look for mathematical expressions
    const match = description.match(/calculate\s+(.+)|计算\s+(.+)/i)
    return match ? (match[1] || match[2]).trim() : null
  }

  /**
   * Check if step is critical (failure should abort task)
   */
  private isStepCritical(step: AgentStep): boolean {
    // In production, use more sophisticated logic
    return step.dependencies !== undefined && step.dependencies.length > 0
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId)
  }

  /**
   * List all tasks
   */
  listTasks(): AgentTask[] {
    return Array.from(this.tasks.values())
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task || task.status === 'completed' || task.status === 'failed') {
      return false
    }

    task.status = 'failed'
    task.error = 'Cancelled by user'
    task.completedAt = Date.now()

    return true
  }

  /**
   * Clear task history
   */
  clearTasks(): void {
    this.tasks.clear()
  }

  /**
   * Log helper
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.verbose) {
      console.log(`[Agent] ${message}`, ...args)
    }
  }

  /**
   * Get agent statistics
   */
  getStats() {
    const tasks = this.listTasks()

    return {
      totalTasks: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      inProgress: tasks.filter(t => t.status === 'executing' || t.status === 'planning').length,
      averageDuration: this.calculateAverageDuration(tasks)
    }
  }

  /**
   * Calculate average task duration
   */
  private calculateAverageDuration(tasks: AgentTask[]): number {
    const completed = tasks.filter(t => t.completedAt && t.startedAt)
    if (completed.length === 0) return 0

    const total = completed.reduce((sum, t) => {
      return sum + (t.completedAt! - t.startedAt!)
    }, 0)

    return Math.round(total / completed.length)
  }
}

/**
 * Global agent service instance
 */
export const agentService = new AgentService({
  maxSteps: 10,
  maxDuration: 300000,
  autoExecute: true,
  verbose: true
})

/**
 * Quick task execution helper
 */
export async function executeAgentTask(description: string): Promise<any> {
  const task = await agentService.createTask(description)

  // Wait for completion
  while (task.status === 'pending' || task.status === 'planning' || task.status === 'executing') {
    await new Promise(resolve => setTimeout(resolve, 100))
    // Refresh task state
    const updated = agentService.getTask(task.id)
    if (updated) {
      Object.assign(task, updated)
    }
  }

  if (task.status === 'failed') {
    throw new Error(task.error || 'Task failed')
  }

  return task.result
}

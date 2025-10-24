/**
 * Function Calling Framework
 * Enables AI to call external tools and functions
 */

export interface FunctionParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  required?: boolean
  enum?: string[]
  properties?: Record<string, FunctionParameter>
  items?: FunctionParameter
}

export interface FunctionDefinition {
  name: string
  description: string
  parameters: FunctionParameter[]
  handler: (args: any) => Promise<any> | any
  category?: string
  requiresAuth?: boolean
}

export interface FunctionCall {
  id: string
  name: string
  arguments: Record<string, any>
  result?: any
  error?: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  timestamp: number
  duration?: number
}

export interface FunctionCallResult {
  success: boolean
  result?: any
  error?: string
  duration: number
}

export class FunctionCallingService {
  private functions: Map<string, FunctionDefinition> = new Map()
  private callHistory: FunctionCall[] = []

  /**
   * Register a function
   */
  registerFunction(definition: FunctionDefinition): void {
    this.functions.set(definition.name, definition)
  }

  /**
   * Register multiple functions
   */
  registerFunctions(definitions: FunctionDefinition[]): void {
    definitions.forEach(def => this.registerFunction(def))
  }

  /**
   * Unregister a function
   */
  unregisterFunction(name: string): boolean {
    return this.functions.delete(name)
  }

  /**
   * Get all registered functions
   */
  getFunctions(): FunctionDefinition[] {
    return Array.from(this.functions.values())
  }

  /**
   * Get function by name
   */
  getFunction(name: string): FunctionDefinition | undefined {
    return this.functions.get(name)
  }

  /**
   * Call a function
   */
  async callFunction(name: string, args: Record<string, any>): Promise<FunctionCallResult> {
    const startTime = Date.now()

    const callId = `call-${Date.now()}-${Math.random().toString(36).substring(7)}`
    const call: FunctionCall = {
      id: callId,
      name,
      arguments: args,
      status: 'pending',
      timestamp: startTime
    }

    this.callHistory.push(call)

    const func = this.functions.get(name)
    if (!func) {
      const error = `Function '${name}' not found`
      this.updateCall(callId, { status: 'failed', error })
      return {
        success: false,
        error,
        duration: Date.now() - startTime
      }
    }

    // Validate arguments
    const validation = this.validateArguments(func, args)
    if (!validation.valid) {
      this.updateCall(callId, { status: 'failed', error: validation.error })
      return {
        success: false,
        error: validation.error,
        duration: Date.now() - startTime
      }
    }

    try {
      this.updateCall(callId, { status: 'running' })

      const result = await func.handler(args)
      const duration = Date.now() - startTime

      this.updateCall(callId, { status: 'completed', result, duration })

      return {
        success: true,
        result,
        duration
      }
    } catch (error: any) {
      const duration = Date.now() - startTime
      const errorMessage = error.message || 'Unknown error'

      this.updateCall(callId, { status: 'failed', error: errorMessage, duration })

      return {
        success: false,
        error: errorMessage,
        duration
      }
    }
  }

  /**
   * Validate function arguments
   */
  private validateArguments(func: FunctionDefinition, args: Record<string, any>): { valid: boolean; error?: string } {
    for (const param of func.parameters) {
      if (param.required && !(param.name in args)) {
        return {
          valid: false,
          error: `Missing required parameter: ${param.name}`
        }
      }

      if (param.name in args) {
        const value = args[param.name]
        const actualType = Array.isArray(value) ? 'array' : typeof value

        if (actualType !== param.type && value !== null && value !== undefined) {
          return {
            valid: false,
            error: `Parameter '${param.name}' must be of type ${param.type}, got ${actualType}`
          }
        }

        if (param.enum && !param.enum.includes(value)) {
          return {
            valid: false,
            error: `Parameter '${param.name}' must be one of: ${param.enum.join(', ')}`
          }
        }
      }
    }

    return { valid: true }
  }

  /**
   * Update function call status
   */
  private updateCall(callId: string, updates: Partial<FunctionCall>): void {
    const call = this.callHistory.find(c => c.id === callId)
    if (call) {
      Object.assign(call, updates)
    }
  }

  /**
   * Get call history
   */
  getCallHistory(): FunctionCall[] {
    return this.callHistory
  }

  /**
   * Clear call history
   */
  clearHistory(): void {
    this.callHistory = []
  }

  /**
   * Convert functions to OpenAI format
   */
  toOpenAIFormat(): any[] {
    return this.getFunctions().map(func => ({
      name: func.name,
      description: func.description,
      parameters: {
        type: 'object',
        properties: func.parameters.reduce((acc, param) => {
          acc[param.name] = {
            type: param.type,
            description: param.description,
            ...(param.enum && { enum: param.enum })
          }
          return acc
        }, {} as Record<string, any>),
        required: func.parameters.filter(p => p.required).map(p => p.name)
      }
    }))
  }

  /**
   * Convert functions to Anthropic format
   */
  toAnthropicFormat(): any[] {
    return this.getFunctions().map(func => ({
      name: func.name,
      description: func.description,
      input_schema: {
        type: 'object',
        properties: func.parameters.reduce((acc, param) => {
          acc[param.name] = {
            type: param.type,
            description: param.description,
            ...(param.enum && { enum: param.enum })
          }
          return acc
        }, {} as Record<string, any>),
        required: func.parameters.filter(p => p.required).map(p => p.name)
      }
    }))
  }

  /**
   * Parse function call from AI response
   */
  parseFunctionCall(response: any): { name: string; arguments: Record<string, any> } | null {
    // OpenAI format
    if (response.function_call) {
      return {
        name: response.function_call.name,
        arguments: JSON.parse(response.function_call.arguments || '{}')
      }
    }

    // Anthropic format
    if (response.type === 'tool_use') {
      return {
        name: response.name,
        arguments: response.input || {}
      }
    }

    return null
  }
}

/**
 * Create global function calling service
 */
export const functionCallingService = new FunctionCallingService()

/**
 * Decorator for registering functions
 */
export function FunctionTool(definition: Omit<FunctionDefinition, 'handler'>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const handler = descriptor.value

    functionCallingService.registerFunction({
      ...definition,
      handler
    })

    return descriptor
  }
}

/**
 * Built-in Tools for Function Calling
 */

import { functionCallingService, type FunctionDefinition } from './functionCalling'
import { createWebSearchService } from './webSearchService'
import { parseDocument, formatDocumentForAI } from './documentParser'

/**
 * Web Search Tool
 */
const webSearchTool: FunctionDefinition = {
  name: 'web_search',
  description: 'Search the web for current information using various search engines',
  category: 'search',
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'The search query',
      required: true
    },
    {
      name: 'provider',
      type: 'string',
      description: 'Search provider to use',
      enum: ['duckduckgo', 'serper', 'tavily', 'brave'],
      required: false
    },
    {
      name: 'max_results',
      type: 'number',
      description: 'Maximum number of results to return (1-20)',
      required: false
    }
  ],
  handler: async (args) => {
    const { query, provider = 'duckduckgo', max_results = 10 } = args

    const searchService = createWebSearchService({
      provider,
      maxResults: Math.min(max_results, 20)
    })

    const results = await searchService.search(query)
    return {
      query,
      provider,
      results_count: results.length,
      results: results.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        source: r.source
      }))
    }
  }
}

/**
 * Calculator Tool
 */
const calculatorTool: FunctionDefinition = {
  name: 'calculator',
  description: 'Perform mathematical calculations',
  category: 'utility',
  parameters: [
    {
      name: 'expression',
      type: 'string',
      description: 'Mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "sin(PI/2)")',
      required: true
    }
  ],
  handler: (args) => {
    const { expression } = args

    try {
      // Safe math evaluation (basic implementation)
      const result = evaluateMathExpression(expression)
      return {
        expression,
        result,
        formatted: `${expression} = ${result}`
      }
    } catch (error: any) {
      throw new Error(`Calculation error: ${error.message}`)
    }
  }
}

/**
 * Current Time Tool
 */
const currentTimeTool: FunctionDefinition = {
  name: 'get_current_time',
  description: 'Get the current date and time in various formats',
  category: 'utility',
  parameters: [
    {
      name: 'timezone',
      type: 'string',
      description: 'Timezone (e.g., "America/New_York", "Asia/Tokyo")',
      required: false
    },
    {
      name: 'format',
      type: 'string',
      description: 'Output format: "iso", "unix", "readable"',
      enum: ['iso', 'unix', 'readable'],
      required: false
    }
  ],
  handler: (args) => {
    const { timezone, format = 'iso' } = args
    const now = new Date()

    let formatted: string
    switch (format) {
      case 'unix':
        formatted = Math.floor(now.getTime() / 1000).toString()
        break
      case 'readable':
        formatted = now.toLocaleString('en-US', { timezone })
        break
      case 'iso':
      default:
        formatted = now.toISOString()
    }

    return {
      timestamp: now.getTime(),
      iso: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000),
      readable: now.toLocaleString(),
      timezone: timezone || 'UTC',
      formatted
    }
  }
}

/**
 * Random Number Generator Tool
 */
const randomNumberTool: FunctionDefinition = {
  name: 'random_number',
  description: 'Generate random numbers',
  category: 'utility',
  parameters: [
    {
      name: 'min',
      type: 'number',
      description: 'Minimum value (inclusive)',
      required: true
    },
    {
      name: 'max',
      type: 'number',
      description: 'Maximum value (inclusive)',
      required: true
    },
    {
      name: 'count',
      type: 'number',
      description: 'Number of random numbers to generate',
      required: false
    },
    {
      name: 'decimals',
      type: 'number',
      description: 'Number of decimal places (0 for integers)',
      required: false
    }
  ],
  handler: (args) => {
    const { min, max, count = 1, decimals = 0 } = args

    if (min >= max) {
      throw new Error('min must be less than max')
    }

    const numbers: number[] = []
    for (let i = 0; i < count; i++) {
      const random = Math.random() * (max - min) + min
      const rounded = decimals === 0
        ? Math.floor(random)
        : Number(random.toFixed(decimals))
      numbers.push(rounded)
    }

    return {
      min,
      max,
      count,
      decimals,
      numbers,
      single: numbers[0]
    }
  }
}

/**
 * Base64 Encode/Decode Tool
 */
const base64Tool: FunctionDefinition = {
  name: 'base64',
  description: 'Encode or decode base64 strings',
  category: 'utility',
  parameters: [
    {
      name: 'operation',
      type: 'string',
      description: 'Operation to perform',
      enum: ['encode', 'decode'],
      required: true
    },
    {
      name: 'text',
      type: 'string',
      description: 'Text to encode or decode',
      required: true
    }
  ],
  handler: (args) => {
    const { operation, text } = args

    try {
      if (operation === 'encode') {
        const encoded = btoa(text)
        return { operation, input: text, output: encoded }
      } else {
        const decoded = atob(text)
        return { operation, input: text, output: decoded }
      }
    } catch (error: any) {
      throw new Error(`Base64 ${operation} error: ${error.message}`)
    }
  }
}

/**
 * UUID Generator Tool
 */
const uuidTool: FunctionDefinition = {
  name: 'generate_uuid',
  description: 'Generate a UUID (Universally Unique Identifier)',
  category: 'utility',
  parameters: [
    {
      name: 'count',
      type: 'number',
      description: 'Number of UUIDs to generate',
      required: false
    }
  ],
  handler: (args) => {
    const { count = 1 } = args

    const uuids: string[] = []
    for (let i = 0; i < count; i++) {
      uuids.push(crypto.randomUUID())
    }

    return {
      count,
      uuids,
      single: uuids[0]
    }
  }
}

/**
 * Weather Tool (Mock - requires actual API)
 */
const weatherTool: FunctionDefinition = {
  name: 'get_weather',
  description: 'Get current weather information for a location',
  category: 'information',
  parameters: [
    {
      name: 'location',
      type: 'string',
      description: 'City name or location (e.g., "London", "New York, NY")',
      required: true
    },
    {
      name: 'units',
      type: 'string',
      description: 'Temperature units',
      enum: ['celsius', 'fahrenheit'],
      required: false
    }
  ],
  handler: async (args) => {
    const { location, units = 'celsius' } = args

    // This is a mock implementation
    // In production, integrate with OpenWeatherMap or similar API
    return {
      location,
      temperature: 20,
      units,
      condition: 'Partly Cloudy',
      humidity: 65,
      wind_speed: 15,
      forecast: [
        { day: 'Today', high: 22, low: 18, condition: 'Sunny' },
        { day: 'Tomorrow', high: 24, low: 19, condition: 'Clear' }
      ],
      note: 'Mock weather data - integrate real API in production'
    }
  }
}

/**
 * Text Statistics Tool
 */
const textStatsTool: FunctionDefinition = {
  name: 'text_statistics',
  description: 'Calculate statistics for a piece of text',
  category: 'utility',
  parameters: [
    {
      name: 'text',
      type: 'string',
      description: 'Text to analyze',
      required: true
    }
  ],
  handler: (args) => {
    const { text } = args

    const characters = text.length
    const charactersNoSpaces = text.replace(/\s/g, '').length
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length
    const lines = text.split('\n').length
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length

    // Average word length
    const wordList = text.trim().split(/\s+/).filter(w => w.length > 0)
    const avgWordLength = wordList.length > 0
      ? wordList.reduce((sum, word) => sum + word.length, 0) / wordList.length
      : 0

    // Reading time (average 200 words per minute)
    const readingTimeMinutes = Math.ceil(words / 200)

    return {
      characters,
      characters_no_spaces: charactersNoSpaces,
      words,
      lines,
      sentences,
      paragraphs,
      average_word_length: Number(avgWordLength.toFixed(2)),
      reading_time_minutes: readingTimeMinutes
    }
  }
}

/**
 * Safe Math Expression Evaluator
 */
function evaluateMathExpression(expr: string): number {
  // Remove any non-math characters for safety
  const sanitized = expr.replace(/[^0-9+\-*/.()√πe\s]/gi, '')

  // Replace math symbols
  let processed = sanitized
    .replace(/√/g, 'Math.sqrt')
    .replace(/π/gi, 'Math.PI')
    .replace(/\be\b/gi, 'Math.E')

  // Safe evaluation using Function constructor (limited scope)
  const safeEval = new Function('Math', `return ${processed}`)
  return safeEval(Math)
}

/**
 * Register all built-in tools
 */
export function registerBuiltinTools(): void {
  functionCallingService.registerFunctions([
    webSearchTool,
    calculatorTool,
    currentTimeTool,
    randomNumberTool,
    base64Tool,
    uuidTool,
    weatherTool,
    textStatsTool
  ])
}

/**
 * Get all builtin tools
 */
export function getBuiltinTools() {
  return [
    webSearchTool,
    calculatorTool,
    currentTimeTool,
    randomNumberTool,
    base64Tool,
    uuidTool,
    weatherTool,
    textStatsTool
  ]
}

// Auto-register on import
registerBuiltinTools()

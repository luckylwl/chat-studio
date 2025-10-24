/**
 * 环境变量配置
 * 统一管理所有环境变量，提供类型安全和默认值
 */

// 环境变量接口
interface EnvironmentVariables {
  // OpenAI 配置
  openai: {
    apiKey: string
    apiBase: string
    orgId?: string
    defaultModel: string
  }

  // Anthropic 配置
  anthropic: {
    apiKey: string
    apiBase: string
    defaultModel: string
  }

  // Google 配置
  google: {
    apiKey: string
    apiBase: string
    defaultModel: string
  }

  // 应用配置
  app: {
    name: string
    version: string
    env: 'development' | 'production' | 'test'
  }

  // 后端配置
  backend: {
    apiUrl: string
    wsUrl: string
  }

  // 功能开关
  features: {
    voiceChat: boolean
    codeExecution: boolean
    mcpIntegration: boolean
    pwa: boolean
  }

  // 监控配置
  monitoring: {
    sentry: {
      dsn: string
      environment: string
      tracesSampleRate: number
    }
    ga: {
      trackingId: string
    }
  }

  // 性能配置
  performance: {
    enableMonitoring: boolean
    enableErrorReporting: boolean
    maxMessageHistory: number
    cacheTtlMinutes: number
  }

  // 安全配置
  security: {
    enableCSP: boolean
    allowedOrigins: string[]
  }

  // 存储配置
  storage: {
    useIndexedDB: boolean
    quotaMB: number
  }

  // 开发者选项
  developer: {
    debugMode: boolean
    showPerformanceOverlay: boolean
    enableMockAPI: boolean
  }
}

/**
 * 获取环境变量值
 */
function getEnv(key: string, defaultValue: string = ''): string {
  return import.meta.env[key] || defaultValue
}

/**
 * 获取布尔型环境变量
 */
function getBoolEnv(key: string, defaultValue: boolean = false): boolean {
  const value = getEnv(key)
  if (value === '') return defaultValue
  return value === 'true' || value === '1'
}

/**
 * 获取数字型环境变量
 */
function getNumberEnv(key: string, defaultValue: number = 0): number {
  const value = getEnv(key)
  if (value === '') return defaultValue
  const num = Number(value)
  return isNaN(num) ? defaultValue : num
}

/**
 * 获取数组型环境变量
 */
function getArrayEnv(key: string, defaultValue: string[] = []): string[] {
  const value = getEnv(key)
  if (value === '') return defaultValue
  return value.split(',').map(v => v.trim()).filter(Boolean)
}

/**
 * 环境变量配置对象
 */
export const env: EnvironmentVariables = {
  openai: {
    apiKey: getEnv('VITE_OPENAI_API_KEY'),
    apiBase: getEnv('VITE_OPENAI_API_BASE', 'https://api.openai.com/v1'),
    orgId: getEnv('VITE_OPENAI_ORG_ID'),
    defaultModel: getEnv('VITE_OPENAI_DEFAULT_MODEL', 'gpt-4-turbo-preview')
  },

  anthropic: {
    apiKey: getEnv('VITE_ANTHROPIC_API_KEY'),
    apiBase: getEnv('VITE_ANTHROPIC_API_BASE', 'https://api.anthropic.com'),
    defaultModel: getEnv('VITE_ANTHROPIC_DEFAULT_MODEL', 'claude-3-opus-20240229')
  },

  google: {
    apiKey: getEnv('VITE_GOOGLE_API_KEY'),
    apiBase: getEnv('VITE_GOOGLE_API_BASE', 'https://generativelanguage.googleapis.com'),
    defaultModel: getEnv('VITE_GOOGLE_DEFAULT_MODEL', 'gemini-pro')
  },

  app: {
    name: getEnv('VITE_APP_NAME', 'AI Chat Studio'),
    version: getEnv('VITE_APP_VERSION', '2.1.0'),
    env: getEnv('VITE_APP_ENV', 'development') as 'development' | 'production' | 'test'
  },

  backend: {
    apiUrl: getEnv('VITE_BACKEND_API_URL', 'http://localhost:8000'),
    wsUrl: getEnv('VITE_BACKEND_WS_URL', 'ws://localhost:8000')
  },

  features: {
    voiceChat: getBoolEnv('VITE_ENABLE_VOICE_CHAT', true),
    codeExecution: getBoolEnv('VITE_ENABLE_CODE_EXECUTION', true),
    mcpIntegration: getBoolEnv('VITE_ENABLE_MCP_INTEGRATION', true),
    pwa: getBoolEnv('VITE_ENABLE_PWA', true)
  },

  monitoring: {
    sentry: {
      dsn: getEnv('VITE_SENTRY_DSN'),
      environment: getEnv('VITE_SENTRY_ENVIRONMENT', 'development'),
      tracesSampleRate: getNumberEnv('VITE_SENTRY_TRACES_SAMPLE_RATE', 1.0)
    },
    ga: {
      trackingId: getEnv('VITE_GA_TRACKING_ID')
    }
  },

  performance: {
    enableMonitoring: getBoolEnv('VITE_ENABLE_PERFORMANCE_MONITORING', true),
    enableErrorReporting: getBoolEnv('VITE_ENABLE_ERROR_REPORTING', true),
    maxMessageHistory: getNumberEnv('VITE_MAX_MESSAGE_HISTORY', 1000),
    cacheTtlMinutes: getNumberEnv('VITE_CACHE_TTL_MINUTES', 60)
  },

  security: {
    enableCSP: getBoolEnv('VITE_ENABLE_CSP', true),
    allowedOrigins: getArrayEnv('VITE_ALLOWED_ORIGINS', ['http://localhost:5173'])
  },

  storage: {
    useIndexedDB: getBoolEnv('VITE_USE_INDEXEDDB', true),
    quotaMB: getNumberEnv('VITE_STORAGE_QUOTA_MB', 100)
  },

  developer: {
    debugMode: getBoolEnv('VITE_DEBUG_MODE', false),
    showPerformanceOverlay: getBoolEnv('VITE_SHOW_PERFORMANCE_OVERLAY', false),
    enableMockAPI: getBoolEnv('VITE_ENABLE_MOCK_API', false)
  }
}

/**
 * 验证必需的环境变量
 */
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // 检查是否至少配置了一个 AI API
  const hasAnyAPI = env.openai.apiKey || env.anthropic.apiKey || env.google.apiKey

  if (!hasAnyAPI && !env.developer.enableMockAPI) {
    errors.push('至少需要配置一个 AI API 密钥 (OpenAI/Anthropic/Google) 或启用 Mock API')
  }

  // 检查后端配置
  if (!env.backend.apiUrl) {
    errors.push('缺少后端 API URL 配置')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 开发环境下打印配置信息
 */
export function logEnvConfig() {
  if (env.app.env !== 'development') return

  console.group('🔧 环境变量配置')
  console.log('应用环境:', env.app.env)
  console.log('应用版本:', env.app.version)
  console.log('OpenAI API:', env.openai.apiKey ? '✅ 已配置' : '❌ 未配置')
  console.log('Anthropic API:', env.anthropic.apiKey ? '✅ 已配置' : '❌ 未配置')
  console.log('Google API:', env.google.apiKey ? '✅ 已配置' : '❌ 未配置')
  console.log('后端 API:', env.backend.apiUrl)
  console.log('Mock API:', env.developer.enableMockAPI ? '✅ 启用' : '❌ 禁用')
  console.log('性能监控:', env.performance.enableMonitoring ? '✅ 启用' : '❌ 禁用')
  console.log('错误上报:', env.performance.enableErrorReporting ? '✅ 启用' : '❌ 禁用')
  console.groupEnd()

  // 验证配置
  const { valid, errors } = validateEnv()
  if (!valid) {
    console.warn('⚠️ 环境变量配置问题:')
    errors.forEach(error => console.warn('  -', error))
  }
}

// 导出类型
export type { EnvironmentVariables }

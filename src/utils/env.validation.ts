/**
 * Environment Variables Validation
 * Validates and provides type-safe access to environment variables
 */

interface EnvConfig {
  // App
  APP_NAME: string
  APP_VERSION: string
  APP_ENV: 'development' | 'production' | 'test'

  // API Keys
  OPENAI_API_KEY?: string
  ANTHROPIC_API_KEY?: string
  GOOGLE_API_KEY?: string

  // API URLs
  OPENAI_API_BASE?: string
  ANTHROPIC_API_BASE?: string
  GOOGLE_API_BASE?: string

  // Backend
  BACKEND_API_URL: string
  BACKEND_WS_URL: string

  // Feature Flags
  ENABLE_VOICE_CHAT: boolean
  ENABLE_CODE_EXECUTION: boolean
  ENABLE_MCP_INTEGRATION: boolean
  ENABLE_PWA: boolean

  // Monitoring
  SENTRY_DSN?: string
  GA_TRACKING_ID?: string
  ENABLE_PERFORMANCE_MONITORING: boolean

  // Security
  ENABLE_CSP: boolean
  ALLOWED_ORIGINS: string[]

  // Storage
  USE_INDEXEDDB: boolean
  STORAGE_QUOTA_MB: number
}

class EnvValidator {
  private env: Record<string, string | undefined>

  constructor() {
    this.env = import.meta.env
  }

  /**
   * Get string value
   */
  private getString(key: string, defaultValue?: string, required = false): string {
    const value = this.env[`VITE_${key}`] || defaultValue

    if (required && !value) {
      throw new Error(`Missing required environment variable: VITE_${key}`)
    }

    return value || ''
  }

  /**
   * Get boolean value
   */
  private getBoolean(key: string, defaultValue = false): boolean {
    const value = this.env[`VITE_${key}`]

    if (value === undefined) return defaultValue

    return value.toLowerCase() === 'true' || value === '1'
  }

  /**
   * Get number value
   */
  private getNumber(key: string, defaultValue: number): number {
    const value = this.env[`VITE_${key}`]

    if (value === undefined) return defaultValue

    const parsed = parseInt(value, 10)

    if (isNaN(parsed)) {
      console.warn(`Invalid number for ${key}, using default: ${defaultValue}`)
      return defaultValue
    }

    return parsed
  }

  /**
   * Get array value (comma-separated)
   */
  private getArray(key: string, defaultValue: string[] = []): string[] {
    const value = this.env[`VITE_${key}`]

    if (!value) return defaultValue

    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }

  /**
   * Validate and return config
   */
  validate(): EnvConfig {
    // Validate required variables
    const requiredVars = ['APP_NAME', 'BACKEND_API_URL']

    for (const varName of requiredVars) {
      if (!this.env[`VITE_${varName}`]) {
        console.error(`Missing required environment variable: VITE_${varName}`)
      }
    }

    // Build and return config
    const config: EnvConfig = {
      // App
      APP_NAME: this.getString('APP_NAME', 'AI Chat Studio'),
      APP_VERSION: this.getString('APP_VERSION', '2.2.0'),
      APP_ENV: this.getString('APP_ENV', 'development') as EnvConfig['APP_ENV'],

      // API Keys
      OPENAI_API_KEY: this.getString('OPENAI_API_KEY'),
      ANTHROPIC_API_KEY: this.getString('ANTHROPIC_API_KEY'),
      GOOGLE_API_KEY: this.getString('GOOGLE_API_KEY'),

      // API URLs
      OPENAI_API_BASE: this.getString('OPENAI_API_BASE', 'https://api.openai.com/v1'),
      ANTHROPIC_API_BASE: this.getString('ANTHROPIC_API_BASE', 'https://api.anthropic.com'),
      GOOGLE_API_BASE: this.getString(
        'GOOGLE_API_BASE',
        'https://generativelanguage.googleapis.com'
      ),

      // Backend
      BACKEND_API_URL: this.getString('BACKEND_API_URL', 'http://localhost:8000'),
      BACKEND_WS_URL: this.getString('BACKEND_WS_URL', 'ws://localhost:8000'),

      // Feature Flags
      ENABLE_VOICE_CHAT: this.getBoolean('ENABLE_VOICE_CHAT', true),
      ENABLE_CODE_EXECUTION: this.getBoolean('ENABLE_CODE_EXECUTION', true),
      ENABLE_MCP_INTEGRATION: this.getBoolean('ENABLE_MCP_INTEGRATION', true),
      ENABLE_PWA: this.getBoolean('ENABLE_PWA', true),

      // Monitoring
      SENTRY_DSN: this.getString('SENTRY_DSN'),
      GA_TRACKING_ID: this.getString('GA_TRACKING_ID'),
      ENABLE_PERFORMANCE_MONITORING: this.getBoolean('ENABLE_PERFORMANCE_MONITORING', true),

      // Security
      ENABLE_CSP: this.getBoolean('ENABLE_CSP', true),
      ALLOWED_ORIGINS: this.getArray('ALLOWED_ORIGINS', [
        'http://localhost:5173',
        'http://localhost:3000',
      ]),

      // Storage
      USE_INDEXEDDB: this.getBoolean('USE_INDEXEDDB', true),
      STORAGE_QUOTA_MB: this.getNumber('STORAGE_QUOTA_MB', 100),
    }

    // Log warnings for missing optional but recommended vars
    if (!config.OPENAI_API_KEY && !config.ANTHROPIC_API_KEY && !config.GOOGLE_API_KEY) {
      console.warn('⚠️  No AI API keys configured. The app will run in demo mode.')
    }

    // Log configuration in development
    if (config.APP_ENV === 'development') {
      console.log('📋 Environment Configuration:', {
        ...config,
        OPENAI_API_KEY: config.OPENAI_API_KEY ? '***' : undefined,
        ANTHROPIC_API_KEY: config.ANTHROPIC_API_KEY ? '***' : undefined,
        GOOGLE_API_KEY: config.GOOGLE_API_KEY ? '***' : undefined,
      })
    }

    return config
  }
}

// Singleton instance
const validator = new EnvValidator()
export const env = validator.validate()

export default env

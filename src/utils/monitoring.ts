/**
 * Performance Monitoring and Analytics Integration
 * Supports Sentry for error tracking and Google Analytics for user analytics
 */

import { env } from './env.validation'

// Sentry Integration
export interface SentryConfig {
  dsn: string
  environment: string
  release?: string
  tracesSampleRate?: number
  replaysSessionSampleRate?: number
  replaysOnErrorSampleRate?: number
}

/**
 * Initialize Sentry error tracking
 */
export const initSentry = async () => {
  if (!env.SENTRY_DSN) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.')
    return
  }

  try {
    // Dynamic import to reduce bundle size
    const Sentry = await import('@sentry/react')
    const { BrowserTracing } = await import('@sentry/tracing')

    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.APP_ENV,
      release: env.APP_VERSION,

      // Performance Monitoring
      integrations: [
        new BrowserTracing({
          tracePropagationTargets: ['localhost', env.BACKEND_API_URL],
        }),
      ],

      // Sample rates
      tracesSampleRate: env.APP_ENV === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive data from error reports
        if (event.request) {
          delete event.request.cookies
          delete event.request.headers
        }

        // Filter out specific errors
        const error = hint.originalException
        if (error && typeof error === 'object' && 'message' in error) {
          const message = (error as Error).message
          // Ignore network errors during development
          if (env.APP_ENV === 'development' && message.includes('fetch')) {
            return null
          }
        }

        return event
      },
    })

    console.log('✅ Sentry initialized')
  } catch (error) {
    console.error('Failed to initialize Sentry:', error)
  }
}

/**
 * Capture exception to Sentry
 */
export const captureException = async (error: Error, context?: Record<string, any>) => {
  if (!env.SENTRY_DSN) return

  try {
    const Sentry = await import('@sentry/react')
    Sentry.captureException(error, { extra: context })
  } catch (e) {
    console.error('Failed to capture exception:', e)
  }
}

/**
 * Capture message to Sentry
 */
export const captureMessage = async (
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) => {
  if (!env.SENTRY_DSN) return

  try {
    const Sentry = await import('@sentry/react')
    Sentry.captureMessage(message, {
      level,
      extra: context,
    })
  } catch (e) {
    console.error('Failed to capture message:', e)
  }
}

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = async (
  message: string,
  category: string,
  data?: Record<string, any>
) => {
  if (!env.SENTRY_DSN) return

  try {
    const Sentry = await import('@sentry/react')
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
    })
  } catch (e) {
    console.error('Failed to add breadcrumb:', e)
  }
}

/**
 * Set user context
 */
export const setUser = async (user: { id: string; email?: string; username?: string } | null) => {
  if (!env.SENTRY_DSN) return

  try {
    const Sentry = await import('@sentry/react')
    Sentry.setUser(user)
  } catch (e) {
    console.error('Failed to set user:', e)
  }
}

// Google Analytics Integration

/**
 * Initialize Google Analytics
 */
export const initGA = () => {
  if (!env.GA_TRACKING_ID) {
    console.warn('⚠️  Google Analytics tracking ID not configured. Analytics disabled.')
    return
  }

  try {
    // Load GA script
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${env.GA_TRACKING_ID}`
    document.head.appendChild(script)

    // Initialize gtag
    window.dataLayer = window.dataLayer || []
    function gtag(...args: any[]) {
      window.dataLayer.push(args)
    }
    window.gtag = gtag

    gtag('js', new Date())
    gtag('config', env.GA_TRACKING_ID, {
      send_page_view: false, // We'll track manually
      anonymize_ip: true,
    })

    console.log('✅ Google Analytics initialized')
  } catch (error) {
    console.error('Failed to initialize Google Analytics:', error)
  }
}

/**
 * Track page view
 */
export const trackPageView = (path: string, title?: string) => {
  if (!env.GA_TRACKING_ID || !window.gtag) return

  try {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title || document.title,
    })
  } catch (error) {
    console.error('Failed to track page view:', error)
  }
}

/**
 * Track custom event
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (!env.GA_TRACKING_ID || !window.gtag) return

  try {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value,
    })
  } catch (error) {
    console.error('Failed to track event:', error)
  }
}

/**
 * Track timing
 */
export const trackTiming = (
  name: string,
  value: number,
  category: string,
  label?: string
) => {
  if (!env.GA_TRACKING_ID || !window.gtag) return

  try {
    window.gtag('event', 'timing_complete', {
      name,
      value,
      event_category: category,
      event_label: label,
    })
  } catch (error) {
    console.error('Failed to track timing:', error)
  }
}

/**
 * Track exception
 */
export const trackException = (description: string, fatal = false) => {
  if (!env.GA_TRACKING_ID || !window.gtag) return

  try {
    window.gtag('event', 'exception', {
      description,
      fatal,
    })
  } catch (error) {
    console.error('Failed to track exception:', error)
  }
}

// Performance Monitoring

export interface PerformanceMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
}

/**
 * Initialize performance monitoring
 */
export const initPerformanceMonitoring = () => {
  if (!env.ENABLE_PERFORMANCE_MONITORING) {
    console.warn('⚠️  Performance monitoring disabled')
    return
  }

  try {
    // Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => {
        trackTiming('CLS', metric.value, 'Web Vitals')
        console.log('CLS:', metric.value)
      })

      getFID((metric) => {
        trackTiming('FID', metric.value, 'Web Vitals')
        console.log('FID:', metric.value)
      })

      getFCP((metric) => {
        trackTiming('FCP', metric.value, 'Web Vitals')
        console.log('FCP:', metric.value)
      })

      getLCP((metric) => {
        trackTiming('LCP', metric.value, 'Web Vitals')
        console.log('LCP:', metric.value)
      })

      getTTFB((metric) => {
        trackTiming('TTFB', metric.value, 'Web Vitals')
        console.log('TTFB:', metric.value)
      })
    })

    console.log('✅ Performance monitoring initialized')
  } catch (error) {
    console.error('Failed to initialize performance monitoring:', error)
  }
}

/**
 * Monitor API request performance
 */
export const monitorAPIRequest = async <T>(
  endpoint: string,
  request: () => Promise<T>
): Promise<T> => {
  const startTime = performance.now()

  try {
    const result = await request()
    const duration = performance.now() - startTime

    // Track successful request
    trackTiming(endpoint, duration, 'API', 'success')
    addBreadcrumb('API Request', 'http', {
      endpoint,
      duration,
      status: 'success',
    })

    return result
  } catch (error) {
    const duration = performance.now() - startTime

    // Track failed request
    trackTiming(endpoint, duration, 'API', 'error')
    trackException(`API Error: ${endpoint}`, false)

    addBreadcrumb('API Request', 'http', {
      endpoint,
      duration,
      status: 'error',
      error: (error as Error).message,
    })

    throw error
  }
}

/**
 * Monitor component render time
 */
export const monitorComponentRender = (componentName: string, renderTime: number) => {
  if (!env.ENABLE_PERFORMANCE_MONITORING) return

  trackTiming(componentName, renderTime, 'Component Render')

  // Warn if render time is too high
  if (renderTime > 100) {
    console.warn(`⚠️  Slow render detected: ${componentName} took ${renderTime}ms`)
    captureMessage(
      `Slow component render: ${componentName}`,
      'warning',
      { renderTime }
    )
  }
}

/**
 * Initialize all monitoring services
 */
export const initMonitoring = async () => {
  console.log('🔧 Initializing monitoring services...')

  // Initialize in parallel
  await Promise.all([
    initSentry(),
    Promise.resolve(initGA()),
    Promise.resolve(initPerformanceMonitoring()),
  ])

  console.log('✅ All monitoring services initialized')
}

// Type declarations for window
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

/**
 * Example usage:
 *
 * // In main.tsx
 * import { initMonitoring } from './utils/monitoring'
 * initMonitoring()
 *
 * // Track page views
 * import { trackPageView } from './utils/monitoring'
 * trackPageView('/chat', 'Chat Page')
 *
 * // Track events
 * import { trackEvent } from './utils/monitoring'
 * trackEvent('send_message', 'Chat', 'GPT-4')
 *
 * // Monitor API requests
 * import { monitorAPIRequest } from './utils/monitoring'
 * const data = await monitorAPIRequest('/api/chat', () => fetch('/api/chat'))
 *
 * // Capture errors
 * import { captureException } from './utils/monitoring'
 * try {
 *   // code
 * } catch (error) {
 *   captureException(error, { userId: '123' })
 * }
 */

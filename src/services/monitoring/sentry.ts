/**
 * Sentry 错误监控服务
 * 集成 Sentry 进行错误追踪和性能监控
 */

import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { env } from '@/config/env'

/**
 * 初始化 Sentry
 */
export function initSentry(): void {
  // 检查是否配置了 DSN
  if (!env.monitoring.sentry.dsn) {
    console.log('Sentry DSN not configured, skipping initialization')
    return
  }

  // 生产环境才启用
  if (env.app.env === 'development' && !env.developer.debugMode) {
    console.log('Sentry disabled in development mode')
    return
  }

  try {
    Sentry.init({
      dsn: env.monitoring.sentry.dsn,
      environment: env.monitoring.sentry.environment,

      // 性能监控
      integrations: [
        new BrowserTracing({
          tracingOrigins: ['localhost', env.backend.apiUrl],
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            React.useEffect,
            useLocation,
            useNavigationType,
            createRoutesFromChildren,
            matchRoutes
          ),
        }),
      ],

      // 采样率
      tracesSampleRate: env.monitoring.sentry.tracesSampleRate,

      // 忽略的错误
      ignoreErrors: [
        // 浏览器扩展错误
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'atomicFindClose',
        // 网络错误
        'NetworkError',
        'Network request failed',
        // 取消的请求
        'AbortError',
        'Request aborted',
      ],

      // 数据清洗
      beforeSend(event, hint) {
        // 移除敏感信息
        if (event.request) {
          delete event.request.cookies
          // 移除 API 密钥
          if (event.request.headers) {
            delete event.request.headers.Authorization
            delete event.request.headers['x-api-key']
          }
        }

        // 过滤本地开发错误
        if (event.request?.url?.includes('localhost')) {
          return null
        }

        return event
      },

      // 用户反馈
      beforeBreadcrumb(breadcrumb, hint) {
        // 不记录 console.log
        if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
          return null
        }
        return breadcrumb
      },
    })

    // 设置用户上下文
    const userId = localStorage.getItem('userId')
    if (userId) {
      Sentry.setUser({ id: userId })
    }

    console.log('Sentry initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Sentry:', error)
  }
}

/**
 * 捕获错误
 */
export function captureError(error: Error, context?: Record<string, any>): void {
  if (context) {
    Sentry.setContext('additional', context)
  }
  Sentry.captureException(error)
}

/**
 * 捕获消息
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level)
}

/**
 * 添加面包屑
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb)
}

/**
 * 设置用户信息
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  Sentry.setUser(user)
}

/**
 * 设置标签
 */
export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value)
}

/**
 * 设置上下文
 */
export function setContext(name: string, context: Record<string, any>): void {
  Sentry.setContext(name, context)
}

/**
 * 性能追踪
 */
export function startTransaction(name: string, op: string): Sentry.Transaction {
  return Sentry.startTransaction({ name, op })
}

/**
 * React 错误边界
 */
export const ErrorBoundary = Sentry.ErrorBoundary

/**
 * 性能监控 HOC
 */
export function withProfiler<P extends object>(
  Component: React.ComponentType<P>,
  name?: string
): React.ComponentType<P> {
  return Sentry.withProfiler(Component, { name })
}

// 导出 Sentry 实例
export { Sentry }

// React Router 相关导入（用于路由追踪）
import React, { useEffect } from 'react'
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from 'react-router-dom'

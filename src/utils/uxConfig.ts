/**
 * UX 配置工具
 * 提供便捷的配置管理功能
 */

import type { AccessibilityConfig } from '@/components/AccessibilitySettings'
import type { GestureConfig } from '@/components/MobileGestureHandler'

// ============================================
// 类型定义
// ============================================

export interface UXConfig {
  accessibility: AccessibilityConfig
  gestures: GestureConfig
  performance: {
    enableVirtualScroll: boolean
    preloadPages: number
    cacheTimeout: number
  }
  collaboration: {
    enabled: boolean
    websocketUrl?: string
  }
  smartFeatures: {
    suggestions: boolean
    commandRecommendations: boolean
    behaviorLearning: boolean
  }
}

// ============================================
// 默认配置
// ============================================

export const defaultUXConfig: UXConfig = {
  accessibility: {
    screenReader: {
      enabled: false,
      announceMessages: true,
      announceActions: true,
      verbosity: 'medium',
    },
    visual: {
      highContrast: false,
      fontSize: 'medium',
      lineHeight: 'normal',
      reducedMotion: false,
      focusIndicator: 'default',
    },
    keyboard: {
      skipLinks: true,
      enhancedFocus: false,
      customShortcuts: false,
    },
    color: {
      colorBlindMode: 'none',
      customColors: false,
    },
  },
  gestures: {
    swipeThreshold: 50,
    swipeVelocity: 0.3,
    longPressDelay: 500,
    doubleTapDelay: 300,
    pinchThreshold: 0.1,
  },
  performance: {
    enableVirtualScroll: true,
    preloadPages: 1,
    cacheTimeout: 3600000, // 1 hour
  },
  collaboration: {
    enabled: false,
  },
  smartFeatures: {
    suggestions: true,
    commandRecommendations: true,
    behaviorLearning: true,
  },
}

// ============================================
// 配置管理器
// ============================================

export class UXConfigManager {
  private static instance: UXConfigManager
  private config: UXConfig
  private readonly STORAGE_KEY = 'ux-config'

  private constructor() {
    this.config = this.loadConfig()
  }

  /**
   * 获取单例实例
   */
  static getInstance(): UXConfigManager {
    if (!UXConfigManager.instance) {
      UXConfigManager.instance = new UXConfigManager()
    }
    return UXConfigManager.instance
  }

  /**
   * 加载配置
   */
  private loadConfig(): UXConfig {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // 合并默认配置和保存的配置
        return this.mergeConfig(defaultUXConfig, parsed)
      }
    } catch (error) {
      console.error('Failed to load UX config:', error)
    }
    return defaultUXConfig
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config))
    } catch (error) {
      console.error('Failed to save UX config:', error)
    }
  }

  /**
   * 深度合并配置
   */
  private mergeConfig(target: any, source: any): any {
    const result = { ...target }

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.mergeConfig(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }

    return result
  }

  /**
   * 获取完整配置
   */
  getConfig(): UXConfig {
    return { ...this.config }
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<UXConfig>): void {
    this.config = this.mergeConfig(this.config, updates)
    this.saveConfig()
  }

  /**
   * 获取可访问性配置
   */
  getAccessibilityConfig(): AccessibilityConfig {
    return { ...this.config.accessibility }
  }

  /**
   * 更新可访问性配置
   */
  updateAccessibilityConfig(updates: Partial<AccessibilityConfig>): void {
    this.config.accessibility = this.mergeConfig(
      this.config.accessibility,
      updates
    )
    this.saveConfig()
  }

  /**
   * 获取手势配置
   */
  getGestureConfig(): GestureConfig {
    return { ...this.config.gestures }
  }

  /**
   * 更新手势配置
   */
  updateGestureConfig(updates: Partial<GestureConfig>): void {
    this.config.gestures = { ...this.config.gestures, ...updates }
    this.saveConfig()
  }

  /**
   * 是否启用智能建议
   */
  isSuggestionsEnabled(): boolean {
    return this.config.smartFeatures.suggestions
  }

  /**
   * 是否启用命令推荐
   */
  isCommandRecommendationsEnabled(): boolean {
    return this.config.smartFeatures.commandRecommendations
  }

  /**
   * 是否启用行为学习
   */
  isBehaviorLearningEnabled(): boolean {
    return this.config.smartFeatures.behaviorLearning
  }

  /**
   * 是否启用协作功能
   */
  isCollaborationEnabled(): boolean {
    return this.config.collaboration.enabled
  }

  /**
   * 获取 WebSocket URL
   */
  getWebSocketUrl(): string | undefined {
    return this.config.collaboration.websocketUrl
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.config = { ...defaultUXConfig }
    this.saveConfig()
  }

  /**
   * 导出配置
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2)
  }

  /**
   * 导入配置
   */
  importConfig(json: string): boolean {
    try {
      const imported = JSON.parse(json)
      this.config = this.mergeConfig(defaultUXConfig, imported)
      this.saveConfig()
      return true
    } catch (error) {
      console.error('Failed to import config:', error)
      return false
    }
  }

  /**
   * 应用推荐配置
   */
  applyRecommendedConfig(profile: 'minimal' | 'balanced' | 'full'): void {
    const profiles: Record<string, Partial<UXConfig>> = {
      minimal: {
        smartFeatures: {
          suggestions: false,
          commandRecommendations: false,
          behaviorLearning: false,
        },
        performance: {
          enableVirtualScroll: false,
          preloadPages: 0,
          cacheTimeout: 0,
        },
      },
      balanced: {
        smartFeatures: {
          suggestions: true,
          commandRecommendations: true,
          behaviorLearning: false,
        },
        performance: {
          enableVirtualScroll: true,
          preloadPages: 1,
          cacheTimeout: 3600000,
        },
      },
      full: {
        smartFeatures: {
          suggestions: true,
          commandRecommendations: true,
          behaviorLearning: true,
        },
        performance: {
          enableVirtualScroll: true,
          preloadPages: 2,
          cacheTimeout: 7200000,
        },
        collaboration: {
          enabled: true,
        },
      },
    }

    this.updateConfig(profiles[profile])
  }
}

// ============================================
// 导出单例实例
// ============================================

export const uxConfig = UXConfigManager.getInstance()

// ============================================
// 便捷函数
// ============================================

/**
 * 获取当前 UX 配置
 */
export const getUXConfig = () => uxConfig.getConfig()

/**
 * 更新 UX 配置
 */
export const updateUXConfig = (updates: Partial<UXConfig>) =>
  uxConfig.updateConfig(updates)

/**
 * 重置 UX 配置
 */
export const resetUXConfig = () => uxConfig.reset()

/**
 * 应用推荐配置
 */
export const applyRecommendedProfile = (
  profile: 'minimal' | 'balanced' | 'full'
) => uxConfig.applyRecommendedConfig(profile)

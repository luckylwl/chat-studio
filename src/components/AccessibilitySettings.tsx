import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  XMarkIcon,
  SpeakerWaveIcon,
  EyeIcon,
  AdjustmentsHorizontalIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

// 可访问性配置接口
export interface AccessibilityConfig {
  // 屏幕阅读器
  screenReader: {
    enabled: boolean
    announceMessages: boolean
    announceActions: boolean
    verbosity: 'low' | 'medium' | 'high'
  }
  // 视觉辅助
  visual: {
    highContrast: boolean
    fontSize: 'small' | 'medium' | 'large' | 'x-large'
    lineHeight: 'compact' | 'normal' | 'relaxed'
    reducedMotion: boolean
    focusIndicator: 'default' | 'enhanced' | 'high-visibility'
  }
  // 键盘导航
  keyboard: {
    skipLinks: boolean
    enhancedFocus: boolean
    customShortcuts: boolean
  }
  // 色彩
  color: {
    colorBlindMode: 'none' | 'deuteranopia' | 'protanopia' | 'tritanopia'
    customColors: boolean
  }
}

const defaultConfig: AccessibilityConfig = {
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
}

interface AccessibilitySettingsProps {
  isOpen: boolean
  onClose: () => void
  config?: AccessibilityConfig
  onConfigChange?: (config: AccessibilityConfig) => void
}

const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  isOpen,
  onClose,
  config: initialConfig,
  onConfigChange,
}) => {
  const [config, setConfig] = useState<AccessibilityConfig>(
    initialConfig || defaultConfig
  )
  const [activeTab, setActiveTab] = useState<
    'screenReader' | 'visual' | 'keyboard' | 'color'
  >('visual')

  // 加载保存的配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('accessibility-config')
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig(parsed)
      } catch (e) {
        console.error('Failed to load accessibility config:', e)
      }
    }
  }, [])

  // 保存配置
  const saveConfig = (newConfig: AccessibilityConfig) => {
    setConfig(newConfig)
    localStorage.setItem('accessibility-config', JSON.stringify(newConfig))
    onConfigChange?.(newConfig)
    applyConfig(newConfig)
  }

  // 应用配置到页面
  const applyConfig = (cfg: AccessibilityConfig) => {
    const root = document.documentElement

    // 字体大小
    const fontSizes = { small: '14px', medium: '16px', large: '18px', 'x-large': '20px' }
    root.style.fontSize = fontSizes[cfg.visual.fontSize]

    // 行高
    const lineHeights = { compact: '1.4', normal: '1.6', relaxed: '1.8' }
    root.style.setProperty('--line-height', lineHeights[cfg.visual.lineHeight])

    // 高对比度
    if (cfg.visual.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // 减少动画
    if (cfg.visual.reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // 焦点指示器
    root.setAttribute('data-focus-style', cfg.visual.focusIndicator)

    // 色盲模式
    root.setAttribute('data-colorblind-mode', cfg.color.colorBlindMode)

    // 屏幕阅读器
    if (cfg.screenReader.enabled) {
      root.setAttribute('data-screen-reader', 'true')
    } else {
      root.removeAttribute('data-screen-reader')
    }
  }

  const updateConfig = <K extends keyof AccessibilityConfig>(
    category: K,
    updates: Partial<AccessibilityConfig[K]>
  ) => {
    const newConfig = {
      ...config,
      [category]: {
        ...config[category],
        ...updates,
      },
    }
    saveConfig(newConfig)
  }

  const tabs = [
    { id: 'visual' as const, label: '视觉', icon: EyeIcon },
    { id: 'screenReader' as const, label: '屏幕阅读器', icon: SpeakerWaveIcon },
    { id: 'keyboard' as const, label: '键盘', icon: AdjustmentsHorizontalIcon },
    { id: 'color' as const, label: '色彩', icon: AdjustmentsHorizontalIcon },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* 面板 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl md:max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            role="dialog"
            aria-labelledby="accessibility-title"
            aria-modal="true"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2
                id="accessibility-title"
                className="text-2xl font-bold text-gray-900 dark:text-white"
              >
                无障碍设置
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="关闭"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* 标签页 */}
            <div className="flex gap-2 p-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* 视觉设置 */}
              {activeTab === 'visual' && (
                <div className="space-y-6">
                  {/* 字体大小 */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      字体大小
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(['small', 'medium', 'large', 'x-large'] as const).map(
                        (size) => (
                          <button
                            key={size}
                            onClick={() => updateConfig('visual', { fontSize: size })}
                            className={`px-4 py-3 rounded-lg border-2 transition-all ${
                              config.visual.fontSize === size
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="capitalize">
                                {size === 'x-large' ? '特大' : size === 'large' ? '大' : size === 'medium' ? '中' : '小'}
                              </span>
                              {config.visual.fontSize === size && (
                                <CheckIcon className="w-5 h-5 text-blue-500" />
                              )}
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* 行高 */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      行高
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['compact', 'normal', 'relaxed'] as const).map((height) => (
                        <button
                          key={height}
                          onClick={() => updateConfig('visual', { lineHeight: height })}
                          className={`px-4 py-3 rounded-lg border-2 transition-all ${
                            config.visual.lineHeight === height
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="capitalize">
                              {height === 'compact' ? '紧凑' : height === 'normal' ? '标准' : '宽松'}
                            </span>
                            {config.visual.lineHeight === height && (
                              <CheckIcon className="w-5 h-5 text-blue-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 高对比度 */}
                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                    <div>
                      <div className="font-medium">高对比度模式</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        增强文字和背景的对比度
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.visual.highContrast}
                      onChange={(e) =>
                        updateConfig('visual', { highContrast: e.target.checked })
                      }
                      className="w-5 h-5"
                    />
                  </label>

                  {/* 减少动画 */}
                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                    <div>
                      <div className="font-medium">减少动画效果</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        最小化动画和过渡效果
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.visual.reducedMotion}
                      onChange={(e) =>
                        updateConfig('visual', { reducedMotion: e.target.checked })
                      }
                      className="w-5 h-5"
                    />
                  </label>

                  {/* 焦点指示器 */}
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      焦点指示器样式
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['default', 'enhanced', 'high-visibility'] as const).map(
                        (style) => (
                          <button
                            key={style}
                            onClick={() =>
                              updateConfig('visual', { focusIndicator: style })
                            }
                            className={`px-4 py-3 rounded-lg border-2 transition-all ${
                              config.visual.focusIndicator === style
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm">
                                {style === 'default' ? '默认' : style === 'enhanced' ? '增强' : '高可见'}
                              </span>
                              {config.visual.focusIndicator === style && (
                                <CheckIcon className="w-5 h-5 text-blue-500" />
                              )}
                            </div>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 屏幕阅读器设置 */}
              {activeTab === 'screenReader' && (
                <div className="space-y-6">
                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                    <div>
                      <div className="font-medium">启用屏幕阅读器优化</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        为屏幕阅读器添加额外的语义信息
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.screenReader.enabled}
                      onChange={(e) =>
                        updateConfig('screenReader', { enabled: e.target.checked })
                      }
                      className="w-5 h-5"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                    <div>
                      <div className="font-medium">宣读新消息</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        自动朗读收到的新消息
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.screenReader.announceMessages}
                      onChange={(e) =>
                        updateConfig('screenReader', {
                          announceMessages: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                      disabled={!config.screenReader.enabled}
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                    <div>
                      <div className="font-medium">宣读操作结果</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        朗读按钮点击和操作结果
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.screenReader.announceActions}
                      onChange={(e) =>
                        updateConfig('screenReader', {
                          announceActions: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                      disabled={!config.screenReader.enabled}
                    />
                  </label>

                  <div>
                    <label className="block text-sm font-medium mb-3">
                      详细程度
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['low', 'medium', 'high'] as const).map((level) => (
                        <button
                          key={level}
                          onClick={() =>
                            updateConfig('screenReader', { verbosity: level })
                          }
                          disabled={!config.screenReader.enabled}
                          className={`px-4 py-3 rounded-lg border-2 transition-all disabled:opacity-50 ${
                            config.screenReader.verbosity === level
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                          }`}
                        >
                          {level === 'low' ? '简洁' : level === 'medium' ? '中等' : '详细'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 键盘导航设置 */}
              {activeTab === 'keyboard' && (
                <div className="space-y-6">
                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                    <div>
                      <div className="font-medium">启用跳转链接</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        允许快速跳转到主要内容区域
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.keyboard.skipLinks}
                      onChange={(e) =>
                        updateConfig('keyboard', { skipLinks: e.target.checked })
                      }
                      className="w-5 h-5"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                    <div>
                      <div className="font-medium">增强焦点管理</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        改进Tab键导航和焦点控制
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.keyboard.enhancedFocus}
                      onChange={(e) =>
                        updateConfig('keyboard', { enhancedFocus: e.target.checked })
                      }
                      className="w-5 h-5"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                    <div>
                      <div className="font-medium">自定义快捷键</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        允许自定义键盘快捷键
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.keyboard.customShortcuts}
                      onChange={(e) =>
                        updateConfig('keyboard', {
                          customShortcuts: e.target.checked,
                        })
                      }
                      className="w-5 h-5"
                    />
                  </label>
                </div>
              )}

              {/* 色彩设置 */}
              {activeTab === 'color' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3">
                      色盲模式
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: 'none' as const, label: '无' },
                        { value: 'deuteranopia' as const, label: '红绿色盲（绿色弱）' },
                        { value: 'protanopia' as const, label: '红绿色盲（红色弱）' },
                        { value: 'tritanopia' as const, label: '黄蓝色盲' },
                      ].map((mode) => (
                        <button
                          key={mode.value}
                          onClick={() =>
                            updateConfig('color', { colorBlindMode: mode.value })
                          }
                          className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-left ${
                            config.color.colorBlindMode === mode.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{mode.label}</span>
                            {config.color.colorBlindMode === mode.value && (
                              <CheckIcon className="w-5 h-5 text-blue-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer">
                    <div>
                      <div className="font-medium">自定义颜色方案</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        允许自定义界面颜色
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.color.customColors}
                      onChange={(e) =>
                        updateConfig('color', { customColors: e.target.checked })
                      }
                      className="w-5 h-5"
                    />
                  </label>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => saveConfig(defaultConfig)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                重置为默认
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                完成
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AccessibilitySettings
export { defaultConfig }
export type { AccessibilityConfig }

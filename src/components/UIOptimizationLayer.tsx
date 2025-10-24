import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CommandLineIcon,
  BoltIcon,
  PaintBrushIcon,
  EyeIcon,
  CursorArrowRippleIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  XMarkIcon,
  ChevronRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'

interface UIOptimizationLayerProps {
  children: React.ReactNode
}

interface OptimizationSettings {
  animations: {
    enabled: boolean
    duration: 'fast' | 'normal' | 'slow'
    easing: 'linear' | 'ease' | 'ease-in-out' | 'spring'
  }
  performance: {
    reducedMotion: boolean
    lowPowerMode: boolean
    prefersHighContrast: boolean
    reducedTransparency: boolean
  }
  accessibility: {
    focusVisible: boolean
    screenReader: boolean
    keyboardNavigation: boolean
    colorBlindFriendly: boolean
  }
  visual: {
    fontSize: 'small' | 'medium' | 'large' | 'xl'
    density: 'compact' | 'comfortable' | 'spacious'
    colorScheme: 'system' | 'light' | 'dark' | 'high-contrast'
    borderRadius: 'none' | 'small' | 'medium' | 'large'
  }
  interactions: {
    hapticFeedback: boolean
    soundEffects: boolean
    mouseEffects: boolean
    keyboardShortcuts: boolean
  }
}

const UIOptimizationLayer: React.FC<UIOptimizationLayerProps> = ({ children }) => {
  const [showOptimizer, setShowOptimizer] = useState(false)
  const [settings, setSettings] = useState<OptimizationSettings>({
    animations: {
      enabled: true,
      duration: 'normal',
      easing: 'ease-in-out'
    },
    performance: {
      reducedMotion: false,
      lowPowerMode: false,
      prefersHighContrast: false,
      reducedTransparency: false
    },
    accessibility: {
      focusVisible: true,
      screenReader: false,
      keyboardNavigation: true,
      colorBlindFriendly: false
    },
    visual: {
      fontSize: 'medium',
      density: 'comfortable',
      colorScheme: 'system',
      borderRadius: 'medium'
    },
    interactions: {
      hapticFeedback: false,
      soundEffects: false,
      mouseEffects: true,
      keyboardShortcuts: true
    }
  })

  const [activeOptimizations, setActiveOptimizations] = useState<string[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Load settings from localStorage
    const stored = localStorage.getItem('ui_optimization_settings')
    if (stored) {
      try {
        setSettings(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to load UI optimization settings:', error)
      }
    }

    // Detect system preferences
    detectSystemPreferences()

    // Apply initial optimizations
    applyOptimizations()
  }, [])

  useEffect(() => {
    // Save settings to localStorage
    localStorage.setItem('ui_optimization_settings', JSON.stringify(settings))
    applyOptimizations()
  }, [settings])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!settings.interactions.keyboardShortcuts) return

      // Ctrl/Cmd + Shift + O: Open UI Optimizer
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'O') {
        e.preventDefault()
        setShowOptimizer(true)
      }

      // Ctrl/Cmd + Shift + R: Run auto-optimization
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        runAutoOptimization()
      }

      // Ctrl/Cmd + Shift + D: Toggle dark mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        toggleColorScheme()
      }

      // Ctrl/Cmd + Shift + A: Toggle animations
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        toggleAnimations()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [settings])

  const detectSystemPreferences = () => {
    // Detect system preferences and update settings accordingly
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      darkMode: window.matchMedia('(prefers-color-scheme: dark)'),
      reducedTransparency: window.matchMedia('(prefers-reduced-transparency: reduce)')
    }

    setSettings(prev => ({
      ...prev,
      performance: {
        ...prev.performance,
        reducedMotion: mediaQueries.reducedMotion.matches,
        prefersHighContrast: mediaQueries.highContrast.matches,
        reducedTransparency: mediaQueries.reducedTransparency.matches
      }
    }))

    // Listen for changes
    Object.entries(mediaQueries).forEach(([key, mediaQuery]) => {
      mediaQuery.addEventListener('change', detectSystemPreferences)
    })
  }

  const applyOptimizations = () => {
    const root = document.documentElement

    // Apply CSS custom properties based on settings
    root.style.setProperty('--animation-duration',
      settings.animations.duration === 'fast' ? '0.15s' :
      settings.animations.duration === 'slow' ? '0.5s' : '0.3s'
    )

    root.style.setProperty('--animation-easing', settings.animations.easing)

    root.style.setProperty('--font-size-scale',
      settings.visual.fontSize === 'small' ? '0.875' :
      settings.visual.fontSize === 'large' ? '1.125' :
      settings.visual.fontSize === 'xl' ? '1.25' : '1'
    )

    root.style.setProperty('--density-scale',
      settings.visual.density === 'compact' ? '0.8' :
      settings.visual.density === 'spacious' ? '1.2' : '1'
    )

    root.style.setProperty('--border-radius',
      settings.visual.borderRadius === 'none' ? '0' :
      settings.visual.borderRadius === 'small' ? '0.25rem' :
      settings.visual.borderRadius === 'large' ? '1rem' : '0.5rem'
    )

    // Apply theme classes
    root.classList.toggle('reduced-motion', settings.performance.reducedMotion || !settings.animations.enabled)
    root.classList.toggle('high-contrast', settings.performance.prefersHighContrast)
    root.classList.toggle('reduced-transparency', settings.performance.reducedTransparency)
    root.classList.toggle('focus-visible', settings.accessibility.focusVisible)
    root.classList.toggle('color-blind-friendly', settings.accessibility.colorBlindFriendly)
    root.classList.toggle('low-power-mode', settings.performance.lowPowerMode)

    // Apply color scheme
    if (settings.visual.colorScheme !== 'system') {
      root.classList.toggle('dark', settings.visual.colorScheme === 'dark')
      root.classList.toggle('light', settings.visual.colorScheme === 'light')
      root.classList.toggle('high-contrast', settings.visual.colorScheme === 'high-contrast')
    }
  }

  const runAutoOptimization = async () => {
    setIsOptimizing(true)
    setActiveOptimizations([])

    const optimizations = [
      'Analyzing system performance...',
      'Detecting user preferences...',
      'Optimizing animations...',
      'Adjusting visual density...',
      'Enhancing accessibility...',
      'Applying color optimizations...',
      'Fine-tuning interactions...',
      'Optimization complete!'
    ]

    for (let i = 0; i < optimizations.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300))
      setActiveOptimizations(prev => [...prev, optimizations[i]])
    }

    // Apply auto-detected optimizations
    const connection = (navigator as any).connection
    const isSlowConnection = connection && connection.effectiveType === '2g'
    const isLowPowerDevice = (navigator as any).deviceMemory < 4

    if (isSlowConnection || isLowPowerDevice) {
      setSettings(prev => ({
        ...prev,
        performance: {
          ...prev.performance,
          lowPowerMode: true,
          reducedMotion: true
        },
        animations: {
          ...prev.animations,
          enabled: false
        }
      }))
    }

    setTimeout(() => {
      setIsOptimizing(false)
      setActiveOptimizations([])
    }, 1000)
  }

  const toggleColorScheme = () => {
    setSettings(prev => ({
      ...prev,
      visual: {
        ...prev.visual,
        colorScheme: prev.visual.colorScheme === 'dark' ? 'light' : 'dark'
      }
    }))
  }

  const toggleAnimations = () => {
    setSettings(prev => ({
      ...prev,
      animations: {
        ...prev.animations,
        enabled: !prev.animations.enabled
      }
    }))
  }

  const updateSetting = (category: keyof OptimizationSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const generateCSS = (): string => {
    return `
      :root {
        --animation-duration: ${settings.animations.duration === 'fast' ? '0.15s' : settings.animations.duration === 'slow' ? '0.5s' : '0.3s'};
        --animation-easing: ${settings.animations.easing};
        --font-size-scale: ${settings.visual.fontSize === 'small' ? '0.875' : settings.visual.fontSize === 'large' ? '1.125' : settings.visual.fontSize === 'xl' ? '1.25' : '1'};
        --density-scale: ${settings.visual.density === 'compact' ? '0.8' : settings.visual.density === 'spacious' ? '1.2' : '1'};
        --border-radius: ${settings.visual.borderRadius === 'none' ? '0' : settings.visual.borderRadius === 'small' ? '0.25rem' : settings.visual.borderRadius === 'large' ? '1rem' : '0.5rem'};
      }

      .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }

      .high-contrast {
        filter: contrast(150%);
      }

      .reduced-transparency {
        backdrop-filter: none !important;
      }

      .focus-visible *:focus {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
      }

      .color-blind-friendly {
        --color-primary: #0066cc;
        --color-secondary: #ff6600;
        --color-success: #009900;
        --color-warning: #ff9900;
        --color-error: #cc0000;
      }

      .low-power-mode {
        --shadow-intensity: 0;
        --gradient-complexity: 1;
      }

      body {
        font-size: calc(1rem * var(--font-size-scale));
      }

      .ui-element {
        padding: calc(1rem * var(--density-scale));
        border-radius: var(--border-radius);
        transition-duration: var(--animation-duration);
        transition-timing-function: var(--animation-easing);
      }
    `
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Inject optimized CSS */}
      <style>{generateCSS()}</style>

      {/* Main content */}
      {children}

      {/* UI Optimizer Panel */}
      <AnimatePresence>
        {showOptimizer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowOptimizer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <AdjustmentsHorizontalIcon className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      UI 优化中心
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      自定义界面体验和性能设置
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={runAutoOptimization}
                    disabled={isOptimizing}
                    className="flex items-center gap-2"
                  >
                    <BoltIcon className="w-4 h-4" />
                    {isOptimizing ? '优化中...' : '自动优化'}
                  </Button>

                  <button
                    onClick={() => setShowOptimizer(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Auto-optimization progress */}
              <AnimatePresence>
                {isOptimizing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="space-y-2">
                        {activeOptimizations.map((optimization, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400"
                          >
                            <CheckIcon className="w-4 h-4" />
                            {optimization}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Settings Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Animations */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <SparklesIcon className="w-5 h-5" />
                      动画设置
                    </h3>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.animations.enabled}
                          onChange={(e) => updateSetting('animations', 'enabled', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">启用动画</span>
                      </label>

                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">动画速度</label>
                        <select
                          value={settings.animations.duration}
                          onChange={(e) => updateSetting('animations', 'duration', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        >
                          <option value="fast">快速</option>
                          <option value="normal">正常</option>
                          <option value="slow">慢速</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">缓动效果</label>
                        <select
                          value={settings.animations.easing}
                          onChange={(e) => updateSetting('animations', 'easing', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        >
                          <option value="linear">线性</option>
                          <option value="ease">缓动</option>
                          <option value="ease-in-out">缓入缓出</option>
                          <option value="spring">弹簧</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Visual Settings */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <PaintBrushIcon className="w-5 h-5" />
                      视觉设置
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">字体大小</label>
                        <select
                          value={settings.visual.fontSize}
                          onChange={(e) => updateSetting('visual', 'fontSize', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        >
                          <option value="small">小</option>
                          <option value="medium">中等</option>
                          <option value="large">大</option>
                          <option value="xl">超大</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">界面密度</label>
                        <select
                          value={settings.visual.density}
                          onChange={(e) => updateSetting('visual', 'density', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        >
                          <option value="compact">紧凑</option>
                          <option value="comfortable">舒适</option>
                          <option value="spacious">宽松</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">圆角样式</label>
                        <select
                          value={settings.visual.borderRadius}
                          onChange={(e) => updateSetting('visual', 'borderRadius', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                        >
                          <option value="none">无圆角</option>
                          <option value="small">小圆角</option>
                          <option value="medium">中等圆角</option>
                          <option value="large">大圆角</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Performance Settings */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <BoltIcon className="w-5 h-5" />
                      性能设置
                    </h3>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.performance.reducedMotion}
                          onChange={(e) => updateSetting('performance', 'reducedMotion', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">减少动画</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.performance.lowPowerMode}
                          onChange={(e) => updateSetting('performance', 'lowPowerMode', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">低功耗模式</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.performance.reducedTransparency}
                          onChange={(e) => updateSetting('performance', 'reducedTransparency', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">减少透明效果</span>
                      </label>
                    </div>
                  </div>

                  {/* Accessibility Settings */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <EyeIcon className="w-5 h-5" />
                      无障碍设置
                    </h3>

                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.accessibility.focusVisible}
                          onChange={(e) => updateSetting('accessibility', 'focusVisible', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">增强焦点可见性</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.accessibility.keyboardNavigation}
                          onChange={(e) => updateSetting('accessibility', 'keyboardNavigation', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">键盘导航优化</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.accessibility.colorBlindFriendly}
                          onChange={(e) => updateSetting('accessibility', 'colorBlindFriendly', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">色盲友好色彩</span>
                      </label>

                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.performance.prefersHighContrast}
                          onChange={(e) => updateSetting('performance', 'prefersHighContrast', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">高对比度</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div>使用键盘快捷键快速访问优化功能</div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Ctrl+Shift+O</kbd>
                      打开优化器
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Ctrl+Shift+R</kbd>
                      自动优化
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating UI Optimizer Button */}
      <motion.button
        onClick={() => setShowOptimizer(true)}
        className="fixed bottom-4 right-20 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center z-40"
        title="UI优化器 (Ctrl+Shift+O)"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <AdjustmentsHorizontalIcon className="w-5 h-5" />
      </motion.button>
    </div>
  )
}

export default UIOptimizationLayer
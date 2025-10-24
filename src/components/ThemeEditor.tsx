import React, { useState, useEffect } from 'react'
import {
  SwatchIcon,
  SunIcon,
  MoonIcon,
  SparklesIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { Button, Badge } from './ui'
import { cn } from '@/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
  muted: string
  border: string
  success: string
  warning: string
  error: string
}

interface Theme {
  id: string
  name: string
  colors: {
    light: ThemeColors
    dark: ThemeColors
  }
  fonts: {
    body: string
    heading: string
    mono: string
  }
  borderRadius: number
  spacing: number
}

interface ThemeEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (theme: Theme) => void
}

const ThemeEditor: React.FC<ThemeEditorProps> = ({ isOpen, onClose, onSave }) => {
  const [currentMode, setCurrentMode] = useState<'light' | 'dark'>('light')
  const [theme, setTheme] = useState<Theme>({
    id: `theme-${Date.now()}`,
    name: '我的主题',
    colors: {
      light: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#f59e0b',
        background: '#ffffff',
        foreground: '#1f2937',
        muted: '#6b7280',
        border: '#e5e7eb',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      },
      dark: {
        primary: '#60a5fa',
        secondary: '#a78bfa',
        accent: '#fbbf24',
        background: '#111827',
        foreground: '#f3f4f6',
        muted: '#9ca3af',
        border: '#374151',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171'
      }
    },
    fonts: {
      body: 'Inter, sans-serif',
      heading: 'Inter, sans-serif',
      mono: 'JetBrains Mono, monospace'
    },
    borderRadius: 12,
    spacing: 16
  })
  const [previewContent, setPreviewContent] = useState('message')

  const presetThemes: Partial<Theme>[] = [
    {
      name: '蓝色海洋',
      colors: {
        light: {
          ...theme.colors.light,
          primary: '#0ea5e9',
          secondary: '#06b6d4',
          accent: '#14b8a6'
        },
        dark: {
          ...theme.colors.dark,
          primary: '#38bdf8',
          secondary: '#22d3ee',
          accent: '#2dd4bf'
        }
      }
    },
    {
      name: '紫色梦幻',
      colors: {
        light: {
          ...theme.colors.light,
          primary: '#8b5cf6',
          secondary: '#a78bfa',
          accent: '#c084fc'
        },
        dark: {
          ...theme.colors.dark,
          primary: '#a78bfa',
          secondary: '#c084fc',
          accent: '#d8b4fe'
        }
      }
    },
    {
      name: '绿色森林',
      colors: {
        light: {
          ...theme.colors.light,
          primary: '#10b981',
          secondary: '#059669',
          accent: '#34d399'
        },
        dark: {
          ...theme.colors.dark,
          primary: '#34d399',
          secondary: '#10b981',
          accent: '#6ee7b7'
        }
      }
    },
    {
      name: '橙色日落',
      colors: {
        light: {
          ...theme.colors.light,
          primary: '#f97316',
          secondary: '#fb923c',
          accent: '#fdba74'
        },
        dark: {
          ...theme.colors.dark,
          primary: '#fb923c',
          secondary: '#fdba74',
          accent: '#fed7aa'
        }
      }
    }
  ]

  const updateColor = (mode: 'light' | 'dark', key: keyof ThemeColors, value: string) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [mode]: {
          ...prev.colors[mode],
          [key]: value
        }
      }
    }))
  }

  const applyPreset = (preset: Partial<Theme>) => {
    setTheme(prev => ({
      ...prev,
      ...preset
    }))
    toast.success('已应用预设主题')
  }

  const resetToDefault = () => {
    // Reset to initial theme
    toast.success('已重置为默认主题')
  }

  const exportTheme = () => {
    const json = JSON.stringify(theme, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${theme.name}.json`
    a.click()
    toast.success('主题已导出')
  }

  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        setTheme(imported)
        toast.success('主题已导入')
      } catch (error) {
        toast.error('导入失败：无效的主题文件')
      }
    }
    reader.readAsText(file)
  }

  const handleSave = () => {
    onSave(theme)
    toast.success('主题已保存')
    onClose()
  }

  // Apply theme preview in real-time
  useEffect(() => {
    if (!isOpen) return

    const root = document.documentElement
    const colors = theme.colors[currentMode]

    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--preview-${key}`, value)
    })

    root.style.setProperty('--preview-border-radius', `${theme.borderRadius}px`)
    root.style.setProperty('--preview-spacing', `${theme.spacing}px`)
  }, [theme, currentMode, isOpen])

  if (!isOpen) return null

  const colors = theme.colors[currentMode]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-6xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <SwatchIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">主题编辑器</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">自定义应用外观</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportTheme}>
              导出
            </Button>
            <label>
              <Button variant="outline" size="sm" as="span">
                导入
              </Button>
              <input
                type="file"
                accept=".json"
                onChange={importTheme}
                className="hidden"
              />
            </label>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Editor Panel */}
          <div className="w-1/2 overflow-y-auto p-6 border-r border-gray-200 dark:border-gray-700">
            {/* Theme Name */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                主题名称
              </label>
              <input
                type="text"
                value={theme.name}
                onChange={(e) => setTheme(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Mode Toggle */}
            <div className="mb-6">
              <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-900 rounded-lg">
                <button
                  onClick={() => setCurrentMode('light')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors',
                    currentMode === 'light'
                      ? 'bg-white dark:bg-gray-800 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  <SunIcon className="w-4 h-4" />
                  浅色模式
                </button>
                <button
                  onClick={() => setCurrentMode('dark')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-colors',
                    currentMode === 'dark'
                      ? 'bg-white dark:bg-gray-800 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  <MoonIcon className="w-4 h-4" />
                  深色模式
                </button>
              </div>
            </div>

            {/* Preset Themes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                预设主题
              </label>
              <div className="grid grid-cols-2 gap-2">
                {presetThemes.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => applyPreset(preset)}
                    className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 dark:hover:border-primary-700 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: preset.colors?.[currentMode]?.primary }}
                      />
                      <span className="text-sm font-medium">{preset.name}</span>
                    </div>
                    <div className="flex gap-1">
                      {['primary', 'secondary', 'accent'].map((key) => (
                        <div
                          key={key}
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor: preset.colors?.[currentMode]?.[key as keyof ThemeColors]
                          }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Pickers */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">颜色配置</h3>
              {Object.entries(colors).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <label className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {key}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => updateColor(currentMode, key as keyof ThemeColors, e.target.value)}
                      className="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateColor(currentMode, key as keyof ThemeColors, e.target.value)}
                      className="w-24 px-2 py-1 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Border Radius */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                圆角大小: {theme.borderRadius}px
              </label>
              <input
                type="range"
                min="0"
                max="24"
                value={theme.borderRadius}
                onChange={(e) => setTheme(prev => ({ ...prev, borderRadius: Number(e.target.value) }))}
                className="w-full"
              />
            </div>

            {/* Spacing */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                间距大小: {theme.spacing}px
              </label>
              <input
                type="range"
                min="8"
                max="32"
                value={theme.spacing}
                onChange={(e) => setTheme(prev => ({ ...prev, spacing: Number(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">实时预览</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewContent('message')}
                  className={cn(
                    'px-3 py-1 text-xs rounded-lg',
                    previewContent === 'message'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                >
                  消息
                </button>
                <button
                  onClick={() => setPreviewContent('ui')}
                  className={cn(
                    'px-3 py-1 text-xs rounded-lg',
                    previewContent === 'ui'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                >
                  UI组件
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {previewContent === 'message' && (
                <>
                  {/* User Message */}
                  <div className="flex gap-3 justify-end">
                    <div
                      className="max-w-xs p-4 rounded-2xl"
                      style={{
                        backgroundColor: colors.primary,
                        color: colors.background,
                        borderRadius: `${theme.borderRadius}px`
                      }}
                    >
                      <p className="text-sm">这是一条用户消息预览</p>
                    </div>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <span className="text-white text-sm">U</span>
                    </div>
                  </div>

                  {/* AI Message */}
                  <div className="flex gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colors.secondary }}
                    >
                      <span className="text-white text-sm">AI</span>
                    </div>
                    <div
                      className="max-w-xs p-4 border"
                      style={{
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                        borderRadius: `${theme.borderRadius}px`
                      }}
                    >
                      <p className="text-sm" style={{ color: colors.foreground }}>
                        这是一条AI助手消息预览，展示主题的实际效果
                      </p>
                    </div>
                  </div>
                </>
              )}

              {previewContent === 'ui' && (
                <div className="space-y-3">
                  {/* Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      className="px-4 py-2 text-sm font-medium text-white"
                      style={{
                        backgroundColor: colors.primary,
                        borderRadius: `${theme.borderRadius}px`
                      }}
                    >
                      主要按钮
                    </button>
                    <button
                      className="px-4 py-2 text-sm font-medium border"
                      style={{
                        borderColor: colors.border,
                        color: colors.foreground,
                        borderRadius: `${theme.borderRadius}px`
                      }}
                    >
                      次要按钮
                    </button>
                    <button
                      className="px-4 py-2 text-sm font-medium text-white"
                      style={{
                        backgroundColor: colors.accent,
                        borderRadius: `${theme.borderRadius}px`
                      }}
                    >
                      强调按钮
                    </button>
                  </div>

                  {/* Cards */}
                  <div
                    className="p-4 border"
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      borderRadius: `${theme.borderRadius}px`
                    }}
                  >
                    <h4 className="font-semibold mb-2" style={{ color: colors.foreground }}>
                      卡片标题
                    </h4>
                    <p className="text-sm" style={{ color: colors.muted }}>
                      这是卡片内容的示例文本
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex gap-2">
                    {['success', 'warning', 'error'].map((type) => (
                      <span
                        key={type}
                        className="px-2 py-1 text-xs font-medium rounded"
                        style={{
                          backgroundColor: colors[type as keyof ThemeColors],
                          color: colors.background
                        }}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <Button variant="outline" onClick={resetToDefault}>
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            重置
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleSave}>
              <CheckIcon className="w-4 h-4 mr-2" />
              保存主题
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ThemeEditor
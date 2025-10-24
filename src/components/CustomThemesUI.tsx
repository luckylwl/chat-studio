import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSliders as FiPalette, FiMonitor, FiSun, FiMoon, FiSettings, FiDownload, FiUpload, FiSave, FiRefreshCw, FiEye, FiEdit3, FiCopy, FiTrash2, FiPlus, FiGrid, FiLayout, FiType, FiCircle, FiSquare, FiStar, FiHeart, FiZap, FiSliders } from 'react-icons/fi'

interface Theme {
  id: string
  name: string
  description: string
  author: string
  category: 'light' | 'dark' | 'colorful' | 'minimal' | 'gaming' | 'professional'
  isDefault: boolean
  isCustom: boolean
  created: number
  updated: number
  downloads: number
  rating: number
  preview: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    success: string
    warning: string
    error: string
    info: string
  }
  typography: {
    fontFamily: string
    fontSize: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
      '2xl': string
    }
    fontWeight: {
      normal: string
      medium: string
      semibold: string
      bold: string
    }
    lineHeight: {
      tight: string
      normal: string
      relaxed: string
    }
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  animations: {
    duration: string
    easing: string
    enabled: boolean
  }
}

interface UICustomization {
  layout: {
    sidebarWidth: number
    chatBubbleStyle: 'rounded' | 'square' | 'bubble'
    messageSpacing: 'compact' | 'normal' | 'spacious'
    showAvatars: boolean
    showTimestamps: boolean
    showMessageNumbers: boolean
  }
  chat: {
    fontFamily: string
    fontSize: number
    lineHeight: number
    codeBlockTheme: string
    syntaxHighlighting: boolean
    markdownRendering: boolean
    emojiStyle: 'native' | 'twemoji' | 'apple'
  }
  interface: {
    showToolbar: boolean
    compactMode: boolean
    fullScreenMode: boolean
    transparencyEffects: boolean
    blurEffects: boolean
    particleEffects: boolean
  }
}

const PRESET_THEMES: Theme[] = [
  {
    id: 'default-dark',
    name: 'Default Dark',
    description: 'The classic dark theme with blue accents',
    author: 'AI Chat Studio',
    category: 'dark',
    isDefault: true,
    isCustom: false,
    created: Date.now() - 86400000,
    updated: Date.now() - 3600000,
    downloads: 15420,
    rating: 4.8,
    preview: '/themes/default-dark.png',
    colors: {
      primary: '#3B82F6',
      secondary: '#6366F1',
      accent: '#8B5CF6',
      background: '#0F172A',
      surface: '#1E293B',
      text: '#F8FAFC',
      textSecondary: '#94A3B8',
      border: '#334155',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#06B6D4'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem'
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75'
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    },
    animations: {
      duration: '200ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      enabled: true
    }
  },
  {
    id: 'light-modern',
    name: 'Light Modern',
    description: 'Clean and bright theme for daytime use',
    author: 'Design Team',
    category: 'light',
    isDefault: false,
    isCustom: false,
    created: Date.now() - 172800000,
    updated: Date.now() - 7200000,
    downloads: 8930,
    rating: 4.6,
    preview: '/themes/light-modern.png',
    colors: {
      primary: '#2563EB',
      secondary: '#7C3AED',
      accent: '#059669',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#1E293B',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
      info: '#0284C7'
    },
    typography: {
      fontFamily: 'SF Pro Display, system-ui, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem'
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75'
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem'
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    },
    animations: {
      duration: '150ms',
      easing: 'ease-out',
      enabled: true
    }
  },
  {
    id: 'neon-gaming',
    name: 'Neon Gaming',
    description: 'Cyberpunk-inspired theme with glowing effects',
    author: 'GamersUnite',
    category: 'gaming',
    isDefault: false,
    isCustom: false,
    created: Date.now() - 259200000,
    updated: Date.now() - 14400000,
    downloads: 12567,
    rating: 4.9,
    preview: '/themes/neon-gaming.png',
    colors: {
      primary: '#00F5FF',
      secondary: '#FF0080',
      accent: '#FFFF00',
      background: '#0D0D0D',
      surface: '#1A1A1A',
      text: '#00F5FF',
      textSecondary: '#8080FF',
      border: '#333333',
      success: '#00FF41',
      warning: '#FFB000',
      error: '#FF073A',
      info: '#00F5FF'
    },
    typography: {
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem'
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.5',
        relaxed: '1.75'
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.125rem',
      md: '0.25rem',
      lg: '0.375rem',
      xl: '0.5rem'
    },
    shadows: {
      sm: '0 0 5px rgb(0 245 255 / 0.3)',
      md: '0 0 10px rgb(0 245 255 / 0.4)',
      lg: '0 0 20px rgb(0 245 255 / 0.5)',
      xl: '0 0 30px rgb(0 245 255 / 0.6)'
    },
    animations: {
      duration: '300ms',
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      enabled: true
    }
  },
  {
    id: 'forest-zen',
    name: 'Forest Zen',
    description: 'Calm and natural theme with earthy tones',
    author: 'NatureLovers',
    category: 'minimal',
    isDefault: false,
    isCustom: false,
    created: Date.now() - 345600000,
    updated: Date.now() - 21600000,
    downloads: 6789,
    rating: 4.7,
    preview: '/themes/forest-zen.png',
    colors: {
      primary: '#059669',
      secondary: '#0D9488',
      accent: '#84CC16',
      background: '#F0FDF4',
      surface: '#FFFFFF',
      text: '#1F2937',
      textSecondary: '#6B7280',
      border: '#D1FAE5',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#06B6D4'
    },
    typography: {
      fontFamily: 'Poppins, system-ui, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem'
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700'
      },
      lineHeight: {
        tight: '1.25',
        normal: '1.6',
        relaxed: '1.8'
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem'
    },
    borderRadius: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem'
    },
    shadows: {
      sm: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    },
    animations: {
      duration: '250ms',
      easing: 'ease-in-out',
      enabled: true
    }
  }
]

export default function CustomThemesUI() {
  const [themes, setThemes] = useState<Theme[]>(PRESET_THEMES)
  const [selectedTheme, setSelectedTheme] = useState<Theme>(PRESET_THEMES[0])
  const [activeTab, setActiveTab] = useState<'browse' | 'customize' | 'create' | 'settings'>('browse')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [customization, setCustomization] = useState<UICustomization>({
    layout: {
      sidebarWidth: 320,
      chatBubbleStyle: 'rounded',
      messageSpacing: 'normal',
      showAvatars: true,
      showTimestamps: true,
      showMessageNumbers: false
    },
    chat: {
      fontFamily: 'Inter',
      fontSize: 14,
      lineHeight: 1.5,
      codeBlockTheme: 'github-dark',
      syntaxHighlighting: true,
      markdownRendering: true,
      emojiStyle: 'native'
    },
    interface: {
      showToolbar: true,
      compactMode: false,
      fullScreenMode: false,
      transparencyEffects: true,
      blurEffects: true,
      particleEffects: false
    }
  })
  const [isCreating, setIsCreating] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const categories = [
    { id: 'all', name: 'All Themes', count: themes.length },
    { id: 'light', name: 'Light', count: themes.filter(t => t.category === 'light').length },
    { id: 'dark', name: 'Dark', count: themes.filter(t => t.category === 'dark').length },
    { id: 'colorful', name: 'Colorful', count: themes.filter(t => t.category === 'colorful').length },
    { id: 'minimal', name: 'Minimal', count: themes.filter(t => t.category === 'minimal').length },
    { id: 'gaming', name: 'Gaming', count: themes.filter(t => t.category === 'gaming').length },
    { id: 'professional', name: 'Professional', count: themes.filter(t => t.category === 'professional').length }
  ]

  const filteredThemes = themes.filter(theme =>
    selectedCategory === 'all' || theme.category === selectedCategory
  )

  const applyTheme = (theme: Theme) => {
    setSelectedTheme(theme)
    // Apply theme to document root
    const root = document.documentElement
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })
  }

  const createCustomTheme = () => {
    const customTheme: Theme = {
      id: Date.now().toString(),
      name: 'My Custom Theme',
      description: 'A custom theme created by user',
      author: 'You',
      category: 'colorful',
      isDefault: false,
      isCustom: true,
      created: Date.now(),
      updated: Date.now(),
      downloads: 0,
      rating: 5.0,
      preview: '/themes/custom.png',
      colors: { ...selectedTheme.colors },
      typography: { ...selectedTheme.typography },
      spacing: { ...selectedTheme.spacing },
      borderRadius: { ...selectedTheme.borderRadius },
      shadows: { ...selectedTheme.shadows },
      animations: { ...selectedTheme.animations }
    }

    setThemes([...themes, customTheme])
    setSelectedTheme(customTheme)
    setActiveTab('customize')
  }

  const exportTheme = (theme: Theme) => {
    const themeData = JSON.stringify(theme, null, 2)
    const blob = new Blob([themeData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${theme.name.replace(/\s+/g, '-').toLowerCase()}.theme.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
              <FiPalette className="text-pink-400" />
              Custom Themes & UI
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Personalize your chat experience with custom themes and layouts
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                previewMode
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <FiEye className="w-4 h-4" />
              {previewMode ? 'Exit Preview' : 'Live Preview'}
            </button>

            <button
              onClick={createCustomTheme}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Create Theme
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
          {[
            { id: 'browse', label: 'Browse Themes', icon: FiGrid },
            { id: 'customize', label: 'Customize', icon: FiSliders },
            { id: 'create', label: 'Theme Creator', icon: FiPalette },
            { id: 'settings', label: 'UI Settings', icon: FiSettings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-pink-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'browse' && (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex"
            >
              {/* Sidebar */}
              <div className="w-80 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="text-lg font-semibold text-white mb-3">Categories</h3>
                  <div className="space-y-1">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-pink-600/20 text-pink-400 border border-pink-600/50'
                            : 'hover:bg-gray-800 text-gray-300'
                        }`}
                      >
                        <span className="text-sm capitalize">{category.name}</span>
                        <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                          {category.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Theme Info */}
                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-3">Current Theme</h4>
                  <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                    <h5 className="font-medium text-white mb-1">{selectedTheme.name}</h5>
                    <p className="text-xs text-gray-400 mb-2">{selectedTheme.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>by {selectedTheme.author}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <FiStar className="w-3 h-3 text-yellow-400" />
                        <span>{selectedTheme.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Themes Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredThemes.map(theme => (
                    <motion.div
                      key={theme.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-gray-800/50 rounded-lg overflow-hidden border cursor-pointer transition-all hover:scale-105 ${
                        selectedTheme.id === theme.id
                          ? 'border-pink-500 ring-2 ring-pink-500/20'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => applyTheme(theme)}
                    >
                      {/* Theme Preview */}
                      <div
                        className="h-32 bg-gradient-to-br p-4 flex items-end"
                        style={{
                          background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                        }}
                      >
                        <div className="bg-black/20 backdrop-blur-sm rounded px-2 py-1">
                          <span className="text-white text-xs font-medium">{theme.name}</span>
                        </div>
                      </div>

                      {/* Theme Info */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-white">{theme.name}</h3>
                          <div className="flex items-center gap-1">
                            {theme.isDefault && (
                              <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                            {theme.isCustom && (
                              <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">
                                Custom
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {theme.description}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <FiStar className="w-3 h-3 text-yellow-400" />
                              <span>{theme.rating}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FiDownload className="w-3 h-3" />
                              <span>{formatNumber(theme.downloads)}</span>
                            </div>
                          </div>

                          <span className="capitalize">{theme.category}</span>
                        </div>

                        {/* Color Palette Preview */}
                        <div className="flex items-center gap-1 mt-3">
                          {Object.entries(theme.colors).slice(0, 6).map(([key, color]) => (
                            <div
                              key={key}
                              className="w-4 h-4 rounded-full border border-gray-600"
                              style={{ backgroundColor: color }}
                              title={key}
                            />
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              applyTheme(theme)
                            }}
                            className="flex-1 bg-pink-600 hover:bg-pink-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            Apply
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              exportTheme(theme)
                            }}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Export theme"
                          >
                            <FiDownload className="w-4 h-4" />
                          </button>

                          {theme.isCustom && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedTheme(theme)
                                setActiveTab('customize')
                              }}
                              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Edit theme"
                            >
                              <FiEdit3 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'customize' && (
            <motion.div
              key="customize"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex"
            >
              {/* Color Customization */}
              <div className="w-1/3 border-r border-gray-800 overflow-y-auto p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Color Palette</h3>

                <div className="space-y-4">
                  {Object.entries(selectedTheme.colors).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => {
                            const newTheme = {
                              ...selectedTheme,
                              colors: {
                                ...selectedTheme.colors,
                                [key]: e.target.value
                              }
                            }
                            setSelectedTheme(newTheme)
                          }}
                          className="w-12 h-8 rounded border border-gray-600 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => {
                            const newTheme = {
                              ...selectedTheme,
                              colors: {
                                ...selectedTheme.colors,
                                [key]: e.target.value
                              }
                            }
                            setSelectedTheme(newTheme)
                          }}
                          className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700">
                  <button
                    onClick={() => exportTheme(selectedTheme)}
                    className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <FiSave className="w-4 h-4" />
                    Save Theme
                  </button>
                </div>
              </div>

              {/* Typography & Spacing */}
              <div className="w-1/3 border-r border-gray-800 overflow-y-auto p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Typography & Spacing</h3>

                <div className="space-y-6">
                  {/* Font Family */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Font Family</label>
                    <select
                      value={selectedTheme.typography.fontFamily}
                      onChange={(e) => {
                        const newTheme = {
                          ...selectedTheme,
                          typography: {
                            ...selectedTheme.typography,
                            fontFamily: e.target.value
                          }
                        }
                        setSelectedTheme(newTheme)
                      }}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="Inter, system-ui, sans-serif">Inter</option>
                      <option value="SF Pro Display, system-ui, sans-serif">SF Pro Display</option>
                      <option value="JetBrains Mono, monospace">JetBrains Mono</option>
                      <option value="Poppins, system-ui, sans-serif">Poppins</option>
                      <option value="Roboto, system-ui, sans-serif">Roboto</option>
                    </select>
                  </div>

                  {/* Border Radius */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Border Radius</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedTheme.borderRadius).map(([size, value]) => (
                        <div key={size}>
                          <label className="block text-xs text-gray-500 mb-1 capitalize">{size}</label>
                          <input
                            type="text"
                            value={value}
                            onChange={(e) => {
                              const newTheme = {
                                ...selectedTheme,
                                borderRadius: {
                                  ...selectedTheme.borderRadius,
                                  [size]: e.target.value
                                }
                              }
                              setSelectedTheme(newTheme)
                            }}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Animations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">Animations</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedTheme.animations.enabled}
                          onChange={(e) => {
                            const newTheme = {
                              ...selectedTheme,
                              animations: {
                                ...selectedTheme.animations,
                                enabled: e.target.checked
                              }
                            }
                            setSelectedTheme(newTheme)
                          }}
                          className="w-4 h-4 text-pink-600 bg-gray-800 border-gray-600 rounded focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-300">Enable animations</span>
                      </label>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Duration</label>
                        <input
                          type="text"
                          value={selectedTheme.animations.duration}
                          onChange={(e) => {
                            const newTheme = {
                              ...selectedTheme,
                              animations: {
                                ...selectedTheme.animations,
                                duration: e.target.value
                              }
                            }
                            setSelectedTheme(newTheme)
                          }}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="flex-1 p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Live Preview</h3>

                <div
                  className="bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto"
                  style={{
                    backgroundColor: selectedTheme.colors.surface,
                    color: selectedTheme.colors.text,
                    fontFamily: selectedTheme.typography.fontFamily
                  }}
                >
                  {/* Sample Chat Interface */}
                  <div className="space-y-4">
                    {/* Sample Message */}
                    <div className="flex items-start gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{ backgroundColor: selectedTheme.colors.primary }}
                      >
                        AI
                      </div>
                      <div
                        className="flex-1 p-3 rounded-lg"
                        style={{
                          backgroundColor: selectedTheme.colors.background,
                          borderRadius: selectedTheme.borderRadius.md
                        }}
                      >
                        <p style={{ fontSize: selectedTheme.typography.fontSize.sm }}>
                          Hello! This is how your theme will look in the chat interface.
                        </p>
                      </div>
                    </div>

                    {/* Sample User Message */}
                    <div className="flex items-start gap-3 justify-end">
                      <div
                        className="flex-1 max-w-xs p-3 rounded-lg"
                        style={{
                          backgroundColor: selectedTheme.colors.primary,
                          borderRadius: selectedTheme.borderRadius.md,
                          color: 'white'
                        }}
                      >
                        <p style={{ fontSize: selectedTheme.typography.fontSize.sm }}>
                          This looks great! I love the color scheme.
                        </p>
                      </div>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                        style={{ backgroundColor: selectedTheme.colors.secondary }}
                      >
                        You
                      </div>
                    </div>

                    {/* Sample System Message */}
                    <div
                      className="text-center p-2 rounded"
                      style={{
                        backgroundColor: selectedTheme.colors.background,
                        color: selectedTheme.colors.textSecondary,
                        fontSize: selectedTheme.typography.fontSize.xs
                      }}
                    >
                      System: Theme applied successfully
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center">
                <FiPalette className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Advanced Theme Creator</h3>
                <p className="text-gray-500 mb-4">
                  Create themes from scratch with advanced tools and AI assistance
                </p>
                <button className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg font-medium transition-colors">
                  Launch Creator
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full overflow-y-auto p-6"
            >
              <div className="max-w-2xl mx-auto space-y-8">
                {/* Layout Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Layout Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Sidebar Width: {customization.layout.sidebarWidth}px
                      </label>
                      <input
                        type="range"
                        min="240"
                        max="480"
                        value={customization.layout.sidebarWidth}
                        onChange={(e) => setCustomization(prev => ({
                          ...prev,
                          layout: { ...prev.layout, sidebarWidth: parseInt(e.target.value) }
                        }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Chat Bubble Style</label>
                      <select
                        value={customization.layout.chatBubbleStyle}
                        onChange={(e) => setCustomization(prev => ({
                          ...prev,
                          layout: { ...prev.layout, chatBubbleStyle: e.target.value as any }
                        }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="rounded">Rounded</option>
                        <option value="square">Square</option>
                        <option value="bubble">Bubble</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={customization.layout.showAvatars}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            layout: { ...prev.layout, showAvatars: e.target.checked }
                          }))}
                          className="w-4 h-4 text-pink-600 bg-gray-800 border-gray-600 rounded focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-300">Show avatars</span>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={customization.layout.showTimestamps}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            layout: { ...prev.layout, showTimestamps: e.target.checked }
                          }))}
                          className="w-4 h-4 text-pink-600 bg-gray-800 border-gray-600 rounded focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-300">Show timestamps</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Interface Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Interface Settings</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={customization.interface.compactMode}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            interface: { ...prev.interface, compactMode: e.target.checked }
                          }))}
                          className="w-4 h-4 text-pink-600 bg-gray-800 border-gray-600 rounded focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-300">Compact mode</span>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={customization.interface.transparencyEffects}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            interface: { ...prev.interface, transparencyEffects: e.target.checked }
                          }))}
                          className="w-4 h-4 text-pink-600 bg-gray-800 border-gray-600 rounded focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-300">Transparency effects</span>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={customization.interface.blurEffects}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            interface: { ...prev.interface, blurEffects: e.target.checked }
                          }))}
                          className="w-4 h-4 text-pink-600 bg-gray-800 border-gray-600 rounded focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-300">Blur effects</span>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={customization.interface.particleEffects}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            interface: { ...prev.interface, particleEffects: e.target.checked }
                          }))}
                          className="w-4 h-4 text-pink-600 bg-gray-800 border-gray-600 rounded focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-300">Particle effects</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Chat Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Chat Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Font Size: {customization.chat.fontSize}px
                      </label>
                      <input
                        type="range"
                        min="12"
                        max="20"
                        value={customization.chat.fontSize}
                        onChange={(e) => setCustomization(prev => ({
                          ...prev,
                          chat: { ...prev.chat, fontSize: parseInt(e.target.value) }
                        }))}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Emoji Style</label>
                      <select
                        value={customization.chat.emojiStyle}
                        onChange={(e) => setCustomization(prev => ({
                          ...prev,
                          chat: { ...prev.chat, emojiStyle: e.target.value as any }
                        }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="native">Native</option>
                        <option value="twemoji">Twemoji</option>
                        <option value="apple">Apple</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={customization.chat.syntaxHighlighting}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            chat: { ...prev.chat, syntaxHighlighting: e.target.checked }
                          }))}
                          className="w-4 h-4 text-pink-600 bg-gray-800 border-gray-600 rounded focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-300">Syntax highlighting</span>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={customization.chat.markdownRendering}
                          onChange={(e) => setCustomization(prev => ({
                            ...prev,
                            chat: { ...prev.chat, markdownRendering: e.target.checked }
                          }))}
                          className="w-4 h-4 text-pink-600 bg-gray-800 border-gray-600 rounded focus:ring-pink-500"
                        />
                        <span className="text-sm text-gray-300">Markdown rendering</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="pt-6 border-t border-gray-700">
                  <button className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 px-6 py-3 rounded-lg font-medium transition-colors">
                    <FiSave className="w-5 h-5" />
                    Save All Settings
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
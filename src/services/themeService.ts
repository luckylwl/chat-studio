export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeColors {
  primary: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
    950: string
  }
  gray: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
    950: string
  }
  accent: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
    950: string
  }
  success: string
  warning: string
  error: string
  info: string
}

export interface Theme {
  id: string
  name: string
  description: string
  colors: ThemeColors
  isDark: boolean
  isCustom: boolean
  author?: string
  preview?: string
}

export interface ThemeSettings {
  mode: ThemeMode
  currentTheme: string
  systemThemeSync: boolean
  customThemes: Theme[]
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
  fontFamily: 'system' | 'serif' | 'mono' | 'custom'
  borderRadius: 'none' | 'small' | 'medium' | 'large'
  animations: boolean
  reducedMotion: boolean
  highContrast: boolean
  customCSS: string
}

class ThemeService {
  private static instance: ThemeService
  private settings: ThemeSettings
  private themes: Map<string, Theme> = new Map()
  private listeners: Map<string, Function[]> = new Map()
  private systemMediaQuery: MediaQueryList

  // 预定义主题
  private readonly builtInThemes: Theme[] = [
    {
      id: 'default-light',
      name: '默认浅色',
      description: '经典的浅色主题，适合日间使用',
      isDark: false,
      isCustom: false,
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712'
        },
        accent: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49'
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      }
    },
    {
      id: 'default-dark',
      name: '默认深色',
      description: '优雅的深色主题，适合夜间使用',
      isDark: true,
      isCustom: false,
      colors: {
        primary: {
          50: '#172554',
          100: '#1e3a8a',
          200: '#1e40af',
          300: '#1d4ed8',
          400: '#2563eb',
          500: '#3b82f6',
          600: '#60a5fa',
          700: '#93c5fd',
          800: '#bfdbfe',
          900: '#dbeafe',
          950: '#eff6ff'
        },
        gray: {
          50: '#030712',
          100: '#111827',
          200: '#1f2937',
          300: '#374151',
          400: '#4b5563',
          500: '#6b7280',
          600: '#9ca3af',
          700: '#d1d5db',
          800: '#e5e7eb',
          900: '#f3f4f6',
          950: '#f9fafb'
        },
        accent: {
          50: '#082f49',
          100: '#0c4a6e',
          200: '#075985',
          300: '#0369a1',
          400: '#0284c7',
          500: '#0ea5e9',
          600: '#38bdf8',
          700: '#7dd3fc',
          800: '#bae6fd',
          900: '#e0f2fe',
          950: '#f0f9ff'
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      }
    },
    {
      id: 'purple-light',
      name: '紫色浅色',
      description: '优雅的紫色系浅色主题',
      isDark: false,
      isCustom: false,
      colors: {
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764'
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712'
        },
        accent: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724'
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#a855f7'
      }
    },
    {
      id: 'green-light',
      name: '绿色浅色',
      description: '清新的绿色系浅色主题',
      isDark: false,
      isCustom: false,
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16'
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712'
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22'
        },
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      }
    },
    {
      id: 'ocean-dark',
      name: '海洋深色',
      description: '深邃的海洋色系深色主题',
      isDark: true,
      isCustom: false,
      colors: {
        primary: {
          50: '#052e16',
          100: '#14532d',
          200: '#166534',
          300: '#15803d',
          400: '#16a34a',
          500: '#22c55e',
          600: '#4ade80',
          700: '#86efac',
          800: '#bbf7d0',
          900: '#dcfce7',
          950: '#f0fdf4'
        },
        gray: {
          50: '#020617',
          100: '#0f172a',
          200: '#1e293b',
          300: '#334155',
          400: '#475569',
          500: '#64748b',
          600: '#94a3b8',
          700: '#cbd5e1',
          800: '#e2e8f0',
          900: '#f1f5f9',
          950: '#f8fafc'
        },
        accent: {
          50: '#0c4a6e',
          100: '#075985',
          200: '#0369a1',
          300: '#0284c7',
          400: '#0ea5e9',
          500: '#38bdf8',
          600: '#7dd3fc',
          700: '#bae6fd',
          800: '#e0f2fe',
          900: '#f0f9ff',
          950: '#f8fafc'
        },
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#38bdf8'
      }
    }
  ]

  private constructor() {
    this.settings = this.getDefaultSettings()
    this.initializeBuiltInThemes()
    this.loadSettings()
    this.setupSystemThemeDetection()
    this.applyTheme()
  }

  public static getInstance(): ThemeService {
    if (!ThemeService.instance) {
      ThemeService.instance = new ThemeService()
    }
    return ThemeService.instance
  }

  private getDefaultSettings(): ThemeSettings {
    return {
      mode: 'system',
      currentTheme: 'default-light',
      systemThemeSync: true,
      customThemes: [],
      fontSize: 'medium',
      fontFamily: 'system',
      borderRadius: 'medium',
      animations: true,
      reducedMotion: false,
      highContrast: false,
      customCSS: ''
    }
  }

  private initializeBuiltInThemes(): void {
    this.builtInThemes.forEach(theme => {
      this.themes.set(theme.id, theme)
    })
  }

  private setupSystemThemeDetection(): void {
    this.systemMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.systemMediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this))

    // 检测用户的偏好设置
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.settings.reducedMotion = true
    }

    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.settings.highContrast = true
    }
  }

  private handleSystemThemeChange = (e: MediaQueryListEvent) => {
    if (this.settings.mode === 'system') {
      const newTheme = e.matches ? 'default-dark' : 'default-light'
      this.setTheme(newTheme, false) // 不保存到设置中，因为是系统自动切换
    }
  }

  // 主题管理
  public getThemes(): Theme[] {
    return Array.from(this.themes.values())
  }

  public getTheme(id: string): Theme | undefined {
    return this.themes.get(id)
  }

  public getCurrentTheme(): Theme | undefined {
    return this.themes.get(this.settings.currentTheme)
  }

  public setMode(mode: ThemeMode): void {
    this.settings.mode = mode

    if (mode === 'system') {
      const isDark = this.systemMediaQuery.matches
      const newTheme = isDark ? 'default-dark' : 'default-light'
      this.setTheme(newTheme, false)
    }

    this.saveSettings()
    this.emit('mode_changed', mode)
  }

  public setTheme(themeId: string, saveToSettings = true): void {
    const theme = this.themes.get(themeId)
    if (!theme) {
      console.warn(`Theme not found: ${themeId}`)
      return
    }

    const oldTheme = this.settings.currentTheme
    this.settings.currentTheme = themeId

    if (saveToSettings) {
      this.saveSettings()
    }

    this.applyTheme()
    this.emit('theme_changed', { from: oldTheme, to: themeId, theme })
  }

  public createCustomTheme(theme: Omit<Theme, 'id' | 'isCustom'>): string {
    const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const customTheme: Theme = {
      ...theme,
      id,
      isCustom: true
    }

    this.themes.set(id, customTheme)
    this.settings.customThemes.push(customTheme)
    this.saveSettings()
    this.emit('theme_created', customTheme)

    return id
  }

  public updateCustomTheme(id: string, updates: Partial<Theme>): boolean {
    const theme = this.themes.get(id)
    if (!theme || !theme.isCustom) {
      return false
    }

    const updatedTheme = { ...theme, ...updates, id, isCustom: true }
    this.themes.set(id, updatedTheme)

    // 更新设置中的自定义主题
    const index = this.settings.customThemes.findIndex(t => t.id === id)
    if (index !== -1) {
      this.settings.customThemes[index] = updatedTheme
    }

    this.saveSettings()

    // 如果更新的是当前主题，重新应用
    if (this.settings.currentTheme === id) {
      this.applyTheme()
    }

    this.emit('theme_updated', updatedTheme)
    return true
  }

  public deleteCustomTheme(id: string): boolean {
    const theme = this.themes.get(id)
    if (!theme || !theme.isCustom) {
      return false
    }

    this.themes.delete(id)
    this.settings.customThemes = this.settings.customThemes.filter(t => t.id !== id)

    // 如果删除的是当前主题，切换到默认主题
    if (this.settings.currentTheme === id) {
      this.setTheme('default-light')
    }

    this.saveSettings()
    this.emit('theme_deleted', theme)
    return true
  }

  private applyTheme(): void {
    const theme = this.getCurrentTheme()
    if (!theme) return

    const root = document.documentElement

    // 应用主题模式
    root.classList.toggle('dark', theme.isDark)
    root.setAttribute('data-theme', theme.id)

    // 应用颜色变量
    this.applyColorVariables(theme.colors)

    // 应用字体设置
    this.applyFontSettings()

    // 应用其他设置
    this.applyOtherSettings()

    // 应用自定义CSS
    this.applyCustomCSS()
  }

  private applyColorVariables(colors: ThemeColors): void {
    const root = document.documentElement

    // 应用主色调
    Object.entries(colors.primary).forEach(([key, value]) => {
      root.style.setProperty(`--color-primary-${key}`, value)
    })

    // 应用灰色调
    Object.entries(colors.gray).forEach(([key, value]) => {
      root.style.setProperty(`--color-gray-${key}`, value)
    })

    // 应用强调色
    Object.entries(colors.accent).forEach(([key, value]) => {
      root.style.setProperty(`--color-accent-${key}`, value)
    })

    // 应用语义颜色
    root.style.setProperty('--color-success', colors.success)
    root.style.setProperty('--color-warning', colors.warning)
    root.style.setProperty('--color-error', colors.error)
    root.style.setProperty('--color-info', colors.info)
  }

  private applyFontSettings(): void {
    const root = document.documentElement

    // 字体大小
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'extra-large': '20px'
    }
    root.style.setProperty('--font-size-base', fontSizeMap[this.settings.fontSize])

    // 字体家族
    const fontFamilyMap = {
      system: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      serif: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      custom: 'var(--font-family-custom, ui-sans-serif, system-ui)'
    }
    root.style.setProperty('--font-family-base', fontFamilyMap[this.settings.fontFamily])
  }

  private applyOtherSettings(): void {
    const root = document.documentElement

    // 圆角
    const borderRadiusMap = {
      none: '0',
      small: '0.25rem',
      medium: '0.5rem',
      large: '1rem'
    }
    root.style.setProperty('--border-radius-base', borderRadiusMap[this.settings.borderRadius])

    // 动画
    root.classList.toggle('no-animations', !this.settings.animations || this.settings.reducedMotion)

    // 高对比度
    root.classList.toggle('high-contrast', this.settings.highContrast)
  }

  private applyCustomCSS(): void {
    let styleElement = document.getElementById('custom-theme-css') as HTMLStyleElement

    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'custom-theme-css'
      document.head.appendChild(styleElement)
    }

    styleElement.textContent = this.settings.customCSS
  }

  // 设置管理
  public getSettings(): ThemeSettings {
    return { ...this.settings }
  }

  public updateSettings(updates: Partial<ThemeSettings>): void {
    const oldSettings = { ...this.settings }
    this.settings = { ...this.settings, ...updates }

    // 如果主题相关设置改变，重新应用主题
    const themeRelatedKeys = ['fontSize', 'fontFamily', 'borderRadius', 'animations', 'reducedMotion', 'highContrast', 'customCSS']
    const hasThemeChanges = themeRelatedKeys.some(key => key in updates)

    if (hasThemeChanges) {
      this.applyTheme()
    }

    // 如果模式改变，处理主题切换
    if (updates.mode && updates.mode !== oldSettings.mode) {
      this.setMode(updates.mode)
    }

    this.saveSettings()
    this.emit('settings_updated', { from: oldSettings, to: this.settings })
  }

  // 主题导入导出
  public exportTheme(themeId: string): string {
    const theme = this.themes.get(themeId)
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`)
    }

    return JSON.stringify(theme, null, 2)
  }

  public importTheme(themeData: string): string {
    try {
      const theme = JSON.parse(themeData) as Theme

      // 验证主题数据
      if (!this.validateTheme(theme)) {
        throw new Error('Invalid theme data')
      }

      // 生成新的ID避免冲突
      const id = `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const importedTheme: Theme = {
        ...theme,
        id,
        isCustom: true
      }

      this.themes.set(id, importedTheme)
      this.settings.customThemes.push(importedTheme)
      this.saveSettings()
      this.emit('theme_imported', importedTheme)

      return id
    } catch (error) {
      throw new Error(`Failed to import theme: ${error}`)
    }
  }

  private validateTheme(theme: any): theme is Theme {
    if (!theme || typeof theme !== 'object') return false
    if (!theme.name || !theme.colors) return false
    if (!theme.colors.primary || !theme.colors.gray) return false
    return true
  }

  // 实用方法
  public isDark(): boolean {
    const theme = this.getCurrentTheme()
    return theme?.isDark || false
  }

  public generateColorPalette(baseColor: string): Partial<ThemeColors['primary']> {
    // 简化的颜色生成器，实际项目中可以使用更复杂的算法
    const colors: any = {}
    const hsl = this.hexToHsl(baseColor)

    const lightnesses = [95, 90, 80, 65, 50, 45, 35, 25, 15, 10, 5]
    lightnesses.forEach((lightness, index) => {
      const scale = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950][index]
      colors[scale] = this.hslToHex(hsl.h, hsl.s, lightness)
    })

    return colors
  }

  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h: number, s: number, l = (max + min) / 2

    if (max === min) {
      h = s = 0 // achromatic
    } else {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
        default: h = 0
      }
      h /= 6
    }

    return { h: h * 360, s: s * 100, l: l * 100 }
  }

  private hslToHex(h: number, s: number, l: number): string {
    l /= 100
    const a = s * Math.min(l, 1 - l) / 100
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color).toString(16).padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }

  // 事件系统
  public addEventListener(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(listener)
  }

  public removeEventListener(event: string, listener: Function): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(data))
    }
  }

  // 存储管理
  private saveSettings(): void {
    try {
      localStorage.setItem('theme-settings', JSON.stringify(this.settings))
    } catch (error) {
      console.error('Failed to save theme settings:', error)
    }
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem('theme-settings')
      if (stored) {
        const loadedSettings = JSON.parse(stored)
        this.settings = { ...this.settings, ...loadedSettings }

        // 加载自定义主题
        this.settings.customThemes.forEach(theme => {
          this.themes.set(theme.id, theme)
        })
      }
    } catch (error) {
      console.error('Failed to load theme settings:', error)
    }
  }

  // 重置到默认设置
  public reset(): void {
    this.settings = this.getDefaultSettings()
    this.settings.customThemes = []

    // 清除自定义主题
    Array.from(this.themes.keys()).forEach(id => {
      if (id.startsWith('custom-') || id.startsWith('imported-')) {
        this.themes.delete(id)
      }
    })

    this.saveSettings()
    this.applyTheme()
    this.emit('reset')
  }
}

export { ThemeService }
export default ThemeService.getInstance()
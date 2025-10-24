export interface Translation {
  [key: string]: string | Translation
}

export interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
  rtl?: boolean
  region?: string
}

export interface I18nSettings {
  currentLanguage: string
  fallbackLanguage: string
  autoDetect: boolean
  enableRTL: boolean
  dateFormat: string
  numberFormat: string
  currency: string
}

class I18nService {
  private static instance: I18nService
  private translations: Map<string, Translation> = new Map()
  private settings: I18nSettings
  private listeners: Map<string, Function[]> = new Map()

  // 支持的语言列表
  private readonly supportedLanguages: Language[] = [
    {
      code: 'zh-CN',
      name: 'Chinese (Simplified)',
      nativeName: '简体中文',
      flag: '🇨🇳',
      region: 'China'
    },
    {
      code: 'zh-TW',
      name: 'Chinese (Traditional)',
      nativeName: '繁體中文',
      flag: '🇹🇼',
      region: 'Taiwan'
    },
    {
      code: 'en-US',
      name: 'English (US)',
      nativeName: 'English',
      flag: '🇺🇸',
      region: 'United States'
    },
    {
      code: 'en-GB',
      name: 'English (UK)',
      nativeName: 'English (UK)',
      flag: '🇬🇧',
      region: 'United Kingdom'
    },
    {
      code: 'ja-JP',
      name: 'Japanese',
      nativeName: '日本語',
      flag: '🇯🇵',
      region: 'Japan'
    },
    {
      code: 'ko-KR',
      name: 'Korean',
      nativeName: '한국어',
      flag: '🇰🇷',
      region: 'South Korea'
    },
    {
      code: 'fr-FR',
      name: 'French',
      nativeName: 'Français',
      flag: '🇫🇷',
      region: 'France'
    },
    {
      code: 'de-DE',
      name: 'German',
      nativeName: 'Deutsch',
      flag: '🇩🇪',
      region: 'Germany'
    },
    {
      code: 'es-ES',
      name: 'Spanish',
      nativeName: 'Español',
      flag: '🇪🇸',
      region: 'Spain'
    },
    {
      code: 'it-IT',
      name: 'Italian',
      nativeName: 'Italiano',
      flag: '🇮🇹',
      region: 'Italy'
    },
    {
      code: 'pt-BR',
      name: 'Portuguese (Brazil)',
      nativeName: 'Português (Brasil)',
      flag: '🇧🇷',
      region: 'Brazil'
    },
    {
      code: 'ru-RU',
      name: 'Russian',
      nativeName: 'Русский',
      flag: '🇷🇺',
      region: 'Russia'
    },
    {
      code: 'ar-SA',
      name: 'Arabic',
      nativeName: 'العربية',
      flag: '🇸🇦',
      rtl: true,
      region: 'Saudi Arabia'
    },
    {
      code: 'hi-IN',
      name: 'Hindi',
      nativeName: 'हिन्दी',
      flag: '🇮🇳',
      region: 'India'
    },
    {
      code: 'th-TH',
      name: 'Thai',
      nativeName: 'ไทย',
      flag: '🇹🇭',
      region: 'Thailand'
    },
    {
      code: 'vi-VN',
      name: 'Vietnamese',
      nativeName: 'Tiếng Việt',
      flag: '🇻🇳',
      region: 'Vietnam'
    }
  ]

  private constructor() {
    this.settings = this.getDefaultSettings()
    this.loadSettings()
    this.initializeTranslations()
    this.autoDetectLanguage()
  }

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService()
    }
    return I18nService.instance
  }

  private getDefaultSettings(): I18nSettings {
    return {
      currentLanguage: 'zh-CN',
      fallbackLanguage: 'en-US',
      autoDetect: true,
      enableRTL: false,
      dateFormat: 'YYYY-MM-DD',
      numberFormat: 'decimal',
      currency: 'CNY'
    }
  }

  private initializeTranslations(): void {
    // 简体中文
    this.translations.set('zh-CN', {
      common: {
        save: '保存',
        cancel: '取消',
        delete: '删除',
        edit: '编辑',
        add: '添加',
        search: '搜索',
        loading: '加载中...',
        error: '错误',
        success: '成功',
        warning: '警告',
        info: '信息',
        yes: '是',
        no: '否',
        ok: '确定',
        close: '关闭',
        back: '返回',
        next: '下一步',
        previous: '上一步',
        continue: '继续',
        finish: '完成'
      },
      navigation: {
        home: '首页',
        chat: '对话',
        settings: '设置',
        history: '历史',
        templates: '模板',
        analytics: '分析',
        help: '帮助',
        about: '关于'
      },
      chat: {
        newConversation: '新建对话',
        clearConversation: '清空对话',
        deleteConversation: '删除对话',
        copyMessage: '复制消息',
        regenerateResponse: '重新生成',
        sendMessage: '发送消息',
        inputPlaceholder: '输入您的消息...',
        voiceInput: '语音输入',
        fileUpload: '文件上传',
        model: '模型',
        temperature: '温度',
        maxTokens: '最大Token数',
        systemPrompt: '系统提示词'
      },
      voice: {
        startListening: '开始语音识别',
        stopListening: '停止语音识别',
        speaking: '朗读中',
        stopSpeaking: '停止朗读',
        voiceSettings: '语音设置',
        language: '语言',
        voice: '声音',
        rate: '语速',
        pitch: '音调',
        volume: '音量',
        autoSpeak: '自动朗读AI回复',
        voiceInputEnabled: '启用语音输入'
      },
      templates: {
        conversationTemplates: '对话模板',
        browseTemplates: '浏览模板',
        favoriteTemplates: '收藏模板',
        recentTemplates: '最近使用',
        popularTemplates: '热门模板',
        createTemplate: '创建模板',
        searchTemplates: '搜索模板...',
        allCategories: '全部分类',
        templateApplied: '已应用模板',
        addToFavorites: '添加到收藏',
        removeFromFavorites: '取消收藏'
      },
      analytics: {
        analytics: '分析',
        dashboard: '仪表板',
        overview: '概览',
        conversations: '对话数',
        messages: '消息数',
        tokens: 'Token数',
        responseTime: '响应时间',
        modelUsage: '模型使用',
        userBehavior: '用户行为',
        insights: '洞察',
        recommendations: '建议',
        exportData: '导出数据',
        dateRange: '日期范围',
        lastWeek: '过去一周',
        lastMonth: '过去一月',
        customRange: '自定义范围'
      },
      settings: {
        settings: '设置',
        general: '通用',
        appearance: '外观',
        language: '语言',
        voice: '语音',
        models: '模型',
        data: '数据',
        privacy: '隐私',
        about: '关于',
        theme: '主题',
        lightMode: '浅色模式',
        darkMode: '深色模式',
        systemMode: '跟随系统',
        fontSize: '字体大小',
        apiKey: 'API密钥',
        apiProvider: 'API提供商',
        modelSelection: '模型选择'
      },
      errors: {
        networkError: '网络错误',
        apiError: 'API错误',
        invalidInput: '输入无效',
        unauthorized: '未授权',
        forbidden: '禁止访问',
        notFound: '未找到',
        serverError: '服务器错误',
        unknownError: '未知错误'
      }
    })

    // 英文
    this.translations.set('en-US', {
      common: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Info',
        yes: 'Yes',
        no: 'No',
        ok: 'OK',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        continue: 'Continue',
        finish: 'Finish'
      },
      navigation: {
        home: 'Home',
        chat: 'Chat',
        settings: 'Settings',
        history: 'History',
        templates: 'Templates',
        analytics: 'Analytics',
        help: 'Help',
        about: 'About'
      },
      chat: {
        newConversation: 'New Conversation',
        clearConversation: 'Clear Conversation',
        deleteConversation: 'Delete Conversation',
        copyMessage: 'Copy Message',
        regenerateResponse: 'Regenerate Response',
        sendMessage: 'Send Message',
        inputPlaceholder: 'Type your message...',
        voiceInput: 'Voice Input',
        fileUpload: 'File Upload',
        model: 'Model',
        temperature: 'Temperature',
        maxTokens: 'Max Tokens',
        systemPrompt: 'System Prompt'
      },
      voice: {
        startListening: 'Start Voice Recognition',
        stopListening: 'Stop Voice Recognition',
        speaking: 'Speaking',
        stopSpeaking: 'Stop Speaking',
        voiceSettings: 'Voice Settings',
        language: 'Language',
        voice: 'Voice',
        rate: 'Rate',
        pitch: 'Pitch',
        volume: 'Volume',
        autoSpeak: 'Auto-speak AI responses',
        voiceInputEnabled: 'Enable voice input'
      },
      templates: {
        conversationTemplates: 'Conversation Templates',
        browseTemplates: 'Browse Templates',
        favoriteTemplates: 'Favorite Templates',
        recentTemplates: 'Recent Templates',
        popularTemplates: 'Popular Templates',
        createTemplate: 'Create Template',
        searchTemplates: 'Search templates...',
        allCategories: 'All Categories',
        templateApplied: 'Template applied',
        addToFavorites: 'Add to favorites',
        removeFromFavorites: 'Remove from favorites'
      },
      analytics: {
        analytics: 'Analytics',
        dashboard: 'Dashboard',
        overview: 'Overview',
        conversations: 'Conversations',
        messages: 'Messages',
        tokens: 'Tokens',
        responseTime: 'Response Time',
        modelUsage: 'Model Usage',
        userBehavior: 'User Behavior',
        insights: 'Insights',
        recommendations: 'Recommendations',
        exportData: 'Export Data',
        dateRange: 'Date Range',
        lastWeek: 'Last Week',
        lastMonth: 'Last Month',
        customRange: 'Custom Range'
      },
      settings: {
        settings: 'Settings',
        general: 'General',
        appearance: 'Appearance',
        language: 'Language',
        voice: 'Voice',
        models: 'Models',
        data: 'Data',
        privacy: 'Privacy',
        about: 'About',
        theme: 'Theme',
        lightMode: 'Light Mode',
        darkMode: 'Dark Mode',
        systemMode: 'System Mode',
        fontSize: 'Font Size',
        apiKey: 'API Key',
        apiProvider: 'API Provider',
        modelSelection: 'Model Selection'
      },
      errors: {
        networkError: 'Network Error',
        apiError: 'API Error',
        invalidInput: 'Invalid Input',
        unauthorized: 'Unauthorized',
        forbidden: 'Forbidden',
        notFound: 'Not Found',
        serverError: 'Server Error',
        unknownError: 'Unknown Error'
      }
    })

    // 日文
    this.translations.set('ja-JP', {
      common: {
        save: '保存',
        cancel: 'キャンセル',
        delete: '削除',
        edit: '編集',
        add: '追加',
        search: '検索',
        loading: '読み込み中...',
        error: 'エラー',
        success: '成功',
        warning: '警告',
        info: '情報',
        yes: 'はい',
        no: 'いいえ',
        ok: 'OK',
        close: '閉じる',
        back: '戻る',
        next: '次へ',
        previous: '前へ',
        continue: '続行',
        finish: '完了'
      },
      navigation: {
        home: 'ホーム',
        chat: 'チャット',
        settings: '設定',
        history: '履歴',
        templates: 'テンプレート',
        analytics: '分析',
        help: 'ヘルプ',
        about: 'について'
      },
      chat: {
        newConversation: '新しい会話',
        clearConversation: '会話をクリア',
        deleteConversation: '会話を削除',
        copyMessage: 'メッセージをコピー',
        regenerateResponse: '応答を再生成',
        sendMessage: 'メッセージを送信',
        inputPlaceholder: 'メッセージを入力...',
        voiceInput: '音声入力',
        fileUpload: 'ファイルアップロード',
        model: 'モデル',
        temperature: '温度',
        maxTokens: '最大トークン数',
        systemPrompt: 'システムプロンプト'
      }
      // ... 其他翻译
    })

    // 法文
    this.translations.set('fr-FR', {
      common: {
        save: 'Enregistrer',
        cancel: 'Annuler',
        delete: 'Supprimer',
        edit: 'Modifier',
        add: 'Ajouter',
        search: 'Rechercher',
        loading: 'Chargement...',
        error: 'Erreur',
        success: 'Succès',
        warning: 'Avertissement',
        info: 'Info',
        yes: 'Oui',
        no: 'Non',
        ok: 'OK',
        close: 'Fermer',
        back: 'Retour',
        next: 'Suivant',
        previous: 'Précédent',
        continue: 'Continuer',
        finish: 'Terminer'
      },
      navigation: {
        home: 'Accueil',
        chat: 'Chat',
        settings: 'Paramètres',
        history: 'Historique',
        templates: 'Modèles',
        analytics: 'Analyses',
        help: 'Aide',
        about: 'À propos'
      }
      // ... 其他翻译
    })
  }

  private autoDetectLanguage(): void {
    if (!this.settings.autoDetect) return

    const browserLanguage = navigator.language || 'en-US'
    const supportedLanguage = this.supportedLanguages.find(lang =>
      lang.code === browserLanguage || lang.code.split('-')[0] === browserLanguage.split('-')[0]
    )

    if (supportedLanguage && this.translations.has(supportedLanguage.code)) {
      this.settings.currentLanguage = supportedLanguage.code
      this.saveSettings()
    }
  }

  // 翻译方法
  public t(key: string, params?: Record<string, any>): string {
    const translation = this.getTranslation(key, this.settings.currentLanguage)
    if (!translation) {
      // 尝试回退语言
      const fallbackTranslation = this.getTranslation(key, this.settings.fallbackLanguage)
      if (!fallbackTranslation) {
        console.warn(`Translation missing for key: ${key}`)
        return key
      }
      return this.interpolate(fallbackTranslation, params)
    }
    return this.interpolate(translation, params)
  }

  private getTranslation(key: string, language: string): string | null {
    const translations = this.translations.get(language)
    if (!translations) return null

    const keys = key.split('.')
    let current: any = translations

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        return null
      }
    }

    return typeof current === 'string' ? current : null
  }

  private interpolate(text: string, params?: Record<string, any>): string {
    if (!params) return text

    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match
    })
  }

  // 语言管理
  public getSupportedLanguages(): Language[] {
    return [...this.supportedLanguages]
  }

  public getCurrentLanguage(): Language | undefined {
    return this.supportedLanguages.find(lang => lang.code === this.settings.currentLanguage)
  }

  public setLanguage(languageCode: string): void {
    if (!this.supportedLanguages.find(lang => lang.code === languageCode)) {
      throw new Error(`Unsupported language: ${languageCode}`)
    }

    const oldLanguage = this.settings.currentLanguage
    this.settings.currentLanguage = languageCode

    // 更新RTL设置
    const language = this.supportedLanguages.find(lang => lang.code === languageCode)
    this.settings.enableRTL = language?.rtl || false

    this.saveSettings()
    this.updateDocumentDirection()
    this.emit('language_changed', { from: oldLanguage, to: languageCode })
  }

  private updateDocumentDirection(): void {
    const currentLang = this.getCurrentLanguage()
    if (currentLang?.rtl) {
      document.documentElement.dir = 'rtl'
      document.documentElement.lang = currentLang.code
    } else {
      document.documentElement.dir = 'ltr'
      document.documentElement.lang = this.settings.currentLanguage
    }
  }

  // 日期和数字格式化
  public formatDate(date: Date, format?: string): string {
    const locale = this.settings.currentLanguage.replace('-', '_')
    const formatStr = format || this.settings.dateFormat

    try {
      if (formatStr === 'relative') {
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
        const diffTime = date.getTime() - Date.now()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (Math.abs(diffDays) < 1) {
          const diffHours = Math.ceil(diffTime / (1000 * 60 * 60))
          if (Math.abs(diffHours) < 1) {
            const diffMinutes = Math.ceil(diffTime / (1000 * 60))
            return rtf.format(diffMinutes, 'minute')
          }
          return rtf.format(diffHours, 'hour')
        }
        return rtf.format(diffDays, 'day')
      }

      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    } catch (error) {
      return date.toLocaleDateString()
    }
  }

  public formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    const locale = this.settings.currentLanguage.replace('-', '_')

    try {
      return new Intl.NumberFormat(locale, {
        style: this.settings.numberFormat === 'currency' ? 'currency' : 'decimal',
        currency: this.settings.currency,
        ...options
      }).format(number)
    } catch (error) {
      return number.toString()
    }
  }

  public formatCurrency(amount: number, currency?: string): string {
    return this.formatNumber(amount, {
      style: 'currency',
      currency: currency || this.settings.currency
    })
  }

  // 复数形式处理
  public plural(key: string, count: number, params?: Record<string, any>): string {
    const pluralKey = count === 1 ? `${key}_one` : `${key}_other`
    const translation = this.getTranslation(pluralKey, this.settings.currentLanguage) ||
                       this.getTranslation(key, this.settings.currentLanguage)

    if (translation) {
      return this.interpolate(translation, { ...params, count })
    }

    return key
  }

  // 设置管理
  public getSettings(): I18nSettings {
    return { ...this.settings }
  }

  public updateSettings(updates: Partial<I18nSettings>): void {
    this.settings = { ...this.settings, ...updates }
    this.saveSettings()

    if (updates.currentLanguage) {
      this.updateDocumentDirection()
    }

    this.emit('settings_updated', this.settings)
  }

  // 翻译检查和验证
  public validateTranslations(): { missing: string[], incomplete: string[] } {
    const missing: string[] = []
    const incomplete: string[] = []

    const baseTranslation = this.translations.get(this.settings.fallbackLanguage)
    if (!baseTranslation) return { missing, incomplete }

    this.translations.forEach((translation, languageCode) => {
      if (languageCode === this.settings.fallbackLanguage) return

      const missingKeys = this.findMissingKeys(baseTranslation, translation)
      if (missingKeys.length > 0) {
        incomplete.push(languageCode)
        missing.push(...missingKeys.map(key => `${languageCode}.${key}`))
      }
    })

    return { missing, incomplete }
  }

  private findMissingKeys(base: Translation, target: Translation, prefix = ''): string[] {
    const missing: string[] = []

    Object.keys(base).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key

      if (!(key in target)) {
        missing.push(fullKey)
      } else if (typeof base[key] === 'object' && typeof target[key] === 'object') {
        missing.push(...this.findMissingKeys(
          base[key] as Translation,
          target[key] as Translation,
          fullKey
        ))
      }
    })

    return missing
  }

  // 翻译加载和管理
  public async loadTranslations(languageCode: string, translations: Translation): Promise<void> {
    this.translations.set(languageCode, translations)
    this.emit('translations_loaded', { languageCode, translations })
  }

  public addTranslation(languageCode: string, key: string, value: string): void {
    const translations = this.translations.get(languageCode) || {}
    const keys = key.split('.')
    let current = translations

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {}
      }
      current = current[k] as Translation
    }

    current[keys[keys.length - 1]] = value
    this.translations.set(languageCode, translations)
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
      localStorage.setItem('i18n-settings', JSON.stringify(this.settings))
    } catch (error) {
      console.error('Failed to save i18n settings:', error)
    }
  }

  private loadSettings(): void {
    try {
      const stored = localStorage.getItem('i18n-settings')
      if (stored) {
        this.settings = { ...this.settings, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.error('Failed to load i18n settings:', error)
    }
  }

  // 实用方法
  public isRTL(): boolean {
    return this.settings.enableRTL
  }

  public getDirection(): 'ltr' | 'rtl' {
    return this.isRTL() ? 'rtl' : 'ltr'
  }

  public getLanguageDirection(languageCode: string): 'ltr' | 'rtl' {
    const language = this.supportedLanguages.find(lang => lang.code === languageCode)
    return language?.rtl ? 'rtl' : 'ltr'
  }

  // 翻译导出和导入
  public exportTranslations(languageCode?: string): Translation | Record<string, Translation> {
    if (languageCode) {
      return this.translations.get(languageCode) || {}
    }

    const exported: Record<string, Translation> = {}
    this.translations.forEach((translation, code) => {
      exported[code] = translation
    })
    return exported
  }

  public importTranslations(data: Record<string, Translation>): void {
    Object.entries(data).forEach(([languageCode, translations]) => {
      this.translations.set(languageCode, translations)
    })
    this.emit('translations_imported', data)
  }
}

// 创建全局翻译函数
export const i18nService = I18nService.getInstance()
export const t = (key: string, params?: Record<string, any>) => i18nService.t(key, params)

export { I18nService }
export default i18nService
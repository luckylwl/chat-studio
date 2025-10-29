/**
 * AI Chat Studio v4.0 - Multilingual & I18N Services
 *
 * This file contains multilingual and internationalization features:
 * - Smart Translation Service
 * - Language Detection Service
 * - Cultural Adaptation Service
 * - Localization Manager Service
 */

import localforage from 'localforage'
import type {
  Translation,
  TranslationMemory,
  LanguageDetection,
  CulturalContext,
  LocalizationConfig,
  GlossaryTerm,
  TranslationQuality
} from '../types/v4-types'

// ===================================
// SMART TRANSLATION SERVICE
// ===================================

class SmartTranslationService {
  private readonly TRANSLATIONS_KEY = 'translations'
  private readonly TRANSLATION_MEMORY_KEY = 'translation_memory'
  private readonly GLOSSARY_KEY = 'glossary'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'translation'
  })

  private translationCache: Map<string, Translation> = new Map()

  // Translation
  async translate(
    text: string,
    fromLang: string,
    toLang: string,
    options?: {
      useMemory?: boolean
      preserveFormatting?: boolean
      domain?: string
    }
  ): Promise<Translation> {
    const cacheKey = `${text}_${fromLang}_${toLang}`

    // Check cache
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!
    }

    // Check translation memory
    if (options?.useMemory) {
      const memoryMatch = await this.searchMemory(text, fromLang, toLang)

      if (memoryMatch && memoryMatch.confidence > 0.9) {
        return memoryMatch
      }
    }

    // Perform translation
    const translation: Translation = {
      id: `trans_${Date.now()}`,
      sourceText: text,
      translatedText: await this.performTranslation(text, fromLang, toLang, options),
      sourceLang: fromLang,
      targetLang: toLang,
      confidence: 0.85 + Math.random() * 0.15,
      alternatives: await this.generateAlternatives(text, fromLang, toLang, 3),
      metadata: {
        domain: options?.domain,
        preservedFormatting: options?.preserveFormatting,
        timestamp: Date.now()
      }
    }

    // Cache translation
    this.translationCache.set(cacheKey, translation)

    // Store in memory
    if (options?.useMemory) {
      await this.addToMemory(translation)
    }

    // Save translation
    await this.saveTranslation(translation)

    return translation
  }

  async translateBatch(
    texts: string[],
    fromLang: string,
    toLang: string
  ): Promise<Translation[]> {
    const translations: Translation[] = []

    for (const text of texts) {
      const translation = await this.translate(text, fromLang, toLang, { useMemory: true })
      translations.push(translation)
    }

    return translations
  }

  async retranslate(
    translationId: string,
    alternativeIndex?: number
  ): Promise<Translation> {
    const translations = await this.getAllTranslations()
    const original = translations.find(t => t.id === translationId)

    if (!original) {
      throw new Error('Translation not found')
    }

    if (alternativeIndex !== undefined && original.alternatives[alternativeIndex]) {
      // Use alternative translation
      const newTranslation = {
        ...original,
        id: `trans_${Date.now()}`,
        translatedText: original.alternatives[alternativeIndex]
      }

      await this.saveTranslation(newTranslation)
      return newTranslation
    }

    // Retranslate from scratch
    return await this.translate(
      original.sourceText,
      original.sourceLang,
      original.targetLang
    )
  }

  // Translation Memory
  async searchMemory(
    text: string,
    fromLang: string,
    toLang: string,
    threshold: number = 0.8
  ): Promise<Translation | null> {
    const memory = await this.getTranslationMemory()

    for (const entry of memory.entries) {
      if (
        entry.sourceLang === fromLang &&
        entry.targetLang === toLang &&
        this.calculateSimilarity(text, entry.sourceText) >= threshold
      ) {
        return entry
      }
    }

    return null
  }

  async getTranslationMemory(): Promise<TranslationMemory> {
    const memory = await this.store.getItem<TranslationMemory>(this.TRANSLATION_MEMORY_KEY)

    if (!memory) {
      return {
        id: 'default_memory',
        name: 'Default Translation Memory',
        entries: [],
        languagePairs: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    }

    return memory
  }

  async addToMemory(translation: Translation): Promise<void> {
    const memory = await this.getTranslationMemory()

    memory.entries.push(translation)

    // Add language pair if new
    const pairKey = `${translation.sourceLang}-${translation.targetLang}`
    if (!memory.languagePairs.includes(pairKey)) {
      memory.languagePairs.push(pairKey)
    }

    memory.updatedAt = Date.now()

    // Keep last 10000 entries
    if (memory.entries.length > 10000) {
      memory.entries = memory.entries.slice(-10000)
    }

    await this.store.setItem(this.TRANSLATION_MEMORY_KEY, memory)
  }

  // Glossary Management
  async addGlossaryTerm(
    term: string,
    translation: string,
    fromLang: string,
    toLang: string,
    domain?: string
  ): Promise<GlossaryTerm> {
    const glossaryTerm: GlossaryTerm = {
      id: `term_${Date.now()}`,
      term,
      translation,
      sourceLang: fromLang,
      targetLang: toLang,
      domain,
      context: null,
      createdAt: Date.now()
    }

    const glossary = await this.getAllGlossaryTerms()
    glossary.push(glossaryTerm)
    await this.store.setItem(this.GLOSSARY_KEY, glossary)

    return glossaryTerm
  }

  async getAllGlossaryTerms(domain?: string): Promise<GlossaryTerm[]> {
    let terms = await this.store.getItem<GlossaryTerm[]>(this.GLOSSARY_KEY) || []

    if (domain) {
      terms = terms.filter(t => t.domain === domain)
    }

    return terms
  }

  async findGlossaryTerm(
    term: string,
    fromLang: string,
    toLang: string
  ): Promise<GlossaryTerm | null> {
    const glossary = await this.getAllGlossaryTerms()

    return glossary.find(
      t =>
        t.term.toLowerCase() === term.toLowerCase() &&
        t.sourceLang === fromLang &&
        t.targetLang === toLang
    ) || null
  }

  // Quality Assessment
  async assessQuality(translation: Translation): Promise<TranslationQuality> {
    return {
      translationId: translation.id,
      accuracy: 0.8 + Math.random() * 0.2,
      fluency: 0.75 + Math.random() * 0.25,
      adequacy: 0.8 + Math.random() * 0.2,
      overallScore: 0.8 + Math.random() * 0.2,
      issues: [],
      suggestions: []
    }
  }

  // Helper Methods
  private async performTranslation(
    text: string,
    fromLang: string,
    toLang: string,
    options?: any
  ): Promise<string> {
    // Check glossary first
    const words = text.split(/\s+/)
    const translatedWords: string[] = []

    for (const word of words) {
      const glossaryTerm = await this.findGlossaryTerm(word, fromLang, toLang)

      if (glossaryTerm) {
        translatedWords.push(glossaryTerm.translation)
      } else {
        // Simulate translation (in real app, would use translation API)
        translatedWords.push(this.simulateWordTranslation(word, fromLang, toLang))
      }
    }

    return translatedWords.join(' ')
  }

  private simulateWordTranslation(word: string, fromLang: string, toLang: string): string {
    // Simple simulation (in real app, would use actual translation service)
    const translations: Record<string, Record<string, string>> = {
      'en-zh': {
        'hello': '你好',
        'world': '世界',
        'thanks': '谢谢',
        'goodbye': '再见'
      },
      'en-es': {
        'hello': 'hola',
        'world': 'mundo',
        'thanks': 'gracias',
        'goodbye': 'adiós'
      },
      'en-fr': {
        'hello': 'bonjour',
        'world': 'monde',
        'thanks': 'merci',
        'goodbye': 'au revoir'
      }
    }

    const langPair = `${fromLang}-${toLang}`
    const dict = translations[langPair] || {}

    return dict[word.toLowerCase()] || word
  }

  private async generateAlternatives(
    text: string,
    fromLang: string,
    toLang: string,
    count: number
  ): Promise<string[]> {
    const alternatives: string[] = []

    for (let i = 0; i < count; i++) {
      // Generate variations (in real app, would use translation service)
      alternatives.push(await this.performTranslation(text, fromLang, toLang))
    }

    return alternatives
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))

    const intersection = new Set([...words1].filter(w => words2.has(w)))
    const union = new Set([...words1, ...words2])

    return intersection.size / union.size
  }

  private async getAllTranslations(): Promise<Translation[]> {
    return await this.store.getItem<Translation[]>(this.TRANSLATIONS_KEY) || []
  }

  private async saveTranslation(translation: Translation): Promise<void> {
    const translations = await this.getAllTranslations()
    translations.push(translation)

    // Keep last 10000 translations
    if (translations.length > 10000) {
      translations.splice(0, translations.length - 10000)
    }

    await this.store.setItem(this.TRANSLATIONS_KEY, translations)
  }
}

// ===================================
// LANGUAGE DETECTION SERVICE
// ===================================

class LanguageDetectionService {
  private readonly DETECTIONS_KEY = 'language_detections'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'language_detection'
  })

  // Language patterns for common languages
  private languagePatterns: Record<string, RegExp[]> = {
    en: [/\b(the|is|are|and|or|but)\b/i],
    zh: [/[\u4e00-\u9fa5]/],
    es: [/\b(el|la|los|las|es|son)\b/i],
    fr: [/\b(le|la|les|est|sont|et|ou)\b/i],
    de: [/\b(der|die|das|ist|sind|und|oder)\b/i],
    ja: [/[\u3040-\u309f\u30a0-\u30ff]/],
    ko: [/[\uac00-\ud7af]/],
    ar: [/[\u0600-\u06ff]/],
    ru: [/[\u0400-\u04ff]/],
    pt: [/\b(o|a|os|as|é|são)\b/i]
  }

  async detect(text: string): Promise<LanguageDetection> {
    const scores: Record<string, number> = {}

    // Calculate scores for each language
    for (const [lang, patterns] of Object.entries(this.languagePatterns)) {
      scores[lang] = 0

      for (const pattern of patterns) {
        const matches = text.match(pattern)
        if (matches) {
          scores[lang] += matches.length
        }
      }
    }

    // Normalize scores
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0)

    if (total === 0) {
      return {
        language: 'en',
        confidence: 0.5,
        alternatives: [],
        isReliable: false
      }
    }

    const normalizedScores = Object.entries(scores)
      .map(([lang, score]) => ({ language: lang, confidence: score / total }))
      .sort((a, b) => b.confidence - a.confidence)

    const detection: LanguageDetection = {
      language: normalizedScores[0].language,
      confidence: normalizedScores[0].confidence,
      alternatives: normalizedScores.slice(1, 4),
      isReliable: normalizedScores[0].confidence > 0.7
    }

    await this.saveDetection(text, detection)

    return detection
  }

  async detectMultiple(texts: string[]): Promise<LanguageDetection[]> {
    const detections: LanguageDetection[] = []

    for (const text of texts) {
      detections.push(await this.detect(text))
    }

    return detections
  }

  async getSupportedLanguages(): Promise<Array<{ code: string; name: string; nativeName: string }>> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
      { code: 'pl', name: 'Polish', nativeName: 'Polski' },
      { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
      { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
      { code: 'th', name: 'Thai', nativeName: 'ไทย' },
      { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' }
    ]
  }

  async getAllDetections(): Promise<Array<{ text: string; detection: LanguageDetection }>> {
    return await this.store.getItem<Array<{ text: string; detection: LanguageDetection }>>(
      this.DETECTIONS_KEY
    ) || []
  }

  private async saveDetection(text: string, detection: LanguageDetection): Promise<void> {
    const detections = await this.getAllDetections()

    detections.push({ text, detection })

    // Keep last 1000 detections
    if (detections.length > 1000) {
      detections.splice(0, detections.length - 1000)
    }

    await this.store.setItem(this.DETECTIONS_KEY, detections)
  }
}

// ===================================
// CULTURAL ADAPTATION SERVICE
// ===================================

class CulturalAdaptationService {
  private readonly CONTEXTS_KEY = 'cultural_contexts'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'cultural_adaptation'
  })

  private culturalRules: Record<string, any> = {
    en: {
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      currency: 'USD',
      firstDayOfWeek: 0, // Sunday
      decimalSeparator: '.',
      thousandsSeparator: ',',
      formality: 'medium',
      directness: 'direct'
    },
    zh: {
      dateFormat: 'YYYY年MM月DD日',
      timeFormat: '24h',
      currency: 'CNY',
      firstDayOfWeek: 1, // Monday
      decimalSeparator: '.',
      thousandsSeparator: ',',
      formality: 'high',
      directness: 'indirect'
    },
    ja: {
      dateFormat: 'YYYY年MM月DD日',
      timeFormat: '24h',
      currency: 'JPY',
      firstDayOfWeek: 0,
      decimalSeparator: '.',
      thousandsSeparator: ',',
      formality: 'high',
      directness: 'indirect'
    },
    de: {
      dateFormat: 'DD.MM.YYYY',
      timeFormat: '24h',
      currency: 'EUR',
      firstDayOfWeek: 1,
      decimalSeparator: ',',
      thousandsSeparator: '.',
      formality: 'medium',
      directness: 'direct'
    },
    ar: {
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '12h',
      currency: 'SAR',
      firstDayOfWeek: 6, // Saturday
      decimalSeparator: '.',
      thousandsSeparator: ',',
      formality: 'high',
      directness: 'indirect',
      rtl: true
    }
  }

  async getCulturalContext(language: string, region?: string): Promise<CulturalContext> {
    const rules = this.culturalRules[language] || this.culturalRules['en']

    const context: CulturalContext = {
      language,
      region: region || language,
      dateFormat: rules.dateFormat,
      timeFormat: rules.timeFormat,
      numberFormat: {
        decimalSeparator: rules.decimalSeparator,
        thousandsSeparator: rules.thousandsSeparator
      },
      currency: rules.currency,
      firstDayOfWeek: rules.firstDayOfWeek,
      formality: rules.formality,
      customs: this.getCustoms(language),
      holidays: this.getHolidays(language),
      etiquette: this.getEtiquette(language)
    }

    await this.saveContext(context)

    return context
  }

  async adaptContent(
    content: string,
    targetLanguage: string,
    options?: {
      adaptDates?: boolean
      adaptNumbers?: boolean
      adaptCurrency?: boolean
      adaptFormality?: boolean
    }
  ): Promise<string> {
    let adapted = content
    const context = await this.getCulturalContext(targetLanguage)

    if (options?.adaptDates !== false) {
      adapted = this.adaptDates(adapted, context)
    }

    if (options?.adaptNumbers !== false) {
      adapted = this.adaptNumbers(adapted, context)
    }

    if (options?.adaptCurrency !== false) {
      adapted = this.adaptCurrency(adapted, context)
    }

    if (options?.adaptFormality !== false) {
      adapted = this.adaptFormality(adapted, context)
    }

    return adapted
  }

  async getTimeZone(language: string, region?: string): Promise<string> {
    const timezones: Record<string, string> = {
      en: 'America/New_York',
      zh: 'Asia/Shanghai',
      ja: 'Asia/Tokyo',
      de: 'Europe/Berlin',
      fr: 'Europe/Paris',
      es: 'Europe/Madrid',
      ar: 'Asia/Riyadh'
    }

    return timezones[language] || 'UTC'
  }

  async formatDate(date: Date, language: string): Promise<string> {
    const context = await this.getCulturalContext(language)

    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()

    return context.dateFormat
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year.toString())
  }

  async formatNumber(number: number, language: string): Promise<string> {
    const context = await this.getCulturalContext(language)

    const parts = number.toString().split('.')
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, context.numberFormat.thousandsSeparator)
    const decimalPart = parts[1] || ''

    return decimalPart
      ? `${integerPart}${context.numberFormat.decimalSeparator}${decimalPart}`
      : integerPart
  }

  async formatCurrency(amount: number, language: string): Promise<string> {
    const context = await this.getCulturalContext(language)
    const formatted = await this.formatNumber(amount, language)

    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      SAR: 'ر.س'
    }

    const symbol = symbols[context.currency] || context.currency

    return `${symbol}${formatted}`
  }

  // Helper Methods
  private adaptDates(content: string, context: CulturalContext): string {
    // Simple date adaptation (in real app, would be more sophisticated)
    return content.replace(/\d{1,2}\/\d{1,2}\/\d{4}/g, match => {
      // Convert to target format
      return match // Simplified
    })
  }

  private adaptNumbers(content: string, context: CulturalContext): string {
    // Adapt number formatting
    return content.replace(/\d{1,3}(,\d{3})*(\.\d+)?/g, match => {
      const number = parseFloat(match.replace(/,/g, ''))
      const parts = match.split('.')
      const integerPart = parts[0].replace(/,/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, context.numberFormat.thousandsSeparator)
      const decimalPart = parts[1] || ''

      return decimalPart
        ? `${integerPart}${context.numberFormat.decimalSeparator}${decimalPart}`
        : integerPart
    })
  }

  private adaptCurrency(content: string, context: CulturalContext): string {
    // Simple currency symbol adaptation
    return content
      .replace(/\$(\d+)/g, `${context.currency} $1`)
  }

  private adaptFormality(content: string, context: CulturalContext): string {
    // Adapt formality level (simplified)
    if (context.formality === 'high') {
      // Make more formal
      return content
        .replace(/\bcan't\b/g, 'cannot')
        .replace(/\bwon't\b/g, 'will not')
        .replace(/\bdon't\b/g, 'do not')
    }

    return content
  }

  private getCustoms(language: string): string[] {
    const customs: Record<string, string[]> = {
      en: ['Handshakes are common greetings', 'Punctuality is valued'],
      zh: ['Remove shoes when entering homes', 'Red envelopes for gifts', 'Respect for elders'],
      ja: ['Bowing as greeting', 'Remove shoes indoors', 'Gift giving etiquette'],
      ar: ['Right hand for eating', 'Modesty in dress', 'Hospitality is important']
    }

    return customs[language] || []
  }

  private getHolidays(language: string): string[] {
    const holidays: Record<string, string[]> = {
      en: ['Christmas', 'Thanksgiving', 'New Year'],
      zh: ['Spring Festival', 'Mid-Autumn Festival', 'Dragon Boat Festival'],
      ja: ['New Year', 'Golden Week', 'Obon'],
      ar: ['Eid al-Fitr', 'Eid al-Adha', 'Ramadan']
    }

    return holidays[language] || []
  }

  private getEtiquette(language: string): string[] {
    const etiquette: Record<string, string[]> = {
      en: ['Direct eye contact shows confidence', 'Personal space is important'],
      zh: ['Indirect communication', 'Face-saving is important', 'Hierarchy matters'],
      ja: ['Indirect communication', 'Silence is valued', 'Group harmony'],
      ar: ['Indirect eye contact with opposite gender', 'Respect for elders']
    }

    return etiquette[language] || []
  }

  private async saveContext(context: CulturalContext): Promise<void> {
    const contexts = await this.store.getItem<CulturalContext[]>(this.CONTEXTS_KEY) || []

    // Update or add context
    const index = contexts.findIndex(c => c.language === context.language && c.region === context.region)

    if (index >= 0) {
      contexts[index] = context
    } else {
      contexts.push(context)
    }

    await this.store.setItem(this.CONTEXTS_KEY, contexts)
  }
}

// ===================================
// LOCALIZATION MANAGER SERVICE
// ===================================

class LocalizationManagerService {
  private readonly CONFIG_KEY = 'localization_config'
  private readonly STRINGS_KEY = 'localization_strings'

  private store = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'localization'
  })

  async getConfig(): Promise<LocalizationConfig> {
    const config = await this.store.getItem<LocalizationConfig>(this.CONFIG_KEY)

    if (!config) {
      return {
        defaultLanguage: 'en',
        supportedLanguages: ['en', 'zh', 'es', 'fr', 'de', 'ja'],
        fallbackLanguage: 'en',
        autoDetect: true,
        persistSelection: true
      }
    }

    return config
  }

  async updateConfig(updates: Partial<LocalizationConfig>): Promise<LocalizationConfig> {
    const config = await this.getConfig()
    const updated = { ...config, ...updates }
    await this.store.setItem(this.CONFIG_KEY, updated)
    return updated
  }

  async getString(key: string, language: string, variables?: Record<string, string>): Promise<string> {
    const strings = await this.getAllStrings(language)
    let value = strings[key] || key

    // Replace variables
    if (variables) {
      for (const [varKey, varValue] of Object.entries(variables)) {
        value = value.replace(`{${varKey}}`, varValue)
      }
    }

    return value
  }

  async getAllStrings(language: string): Promise<Record<string, string>> {
    return await this.store.getItem<Record<string, string>>(`${this.STRINGS_KEY}_${language}`) || {}
  }

  async setStrings(language: string, strings: Record<string, string>): Promise<void> {
    await this.store.setItem(`${this.STRINGS_KEY}_${language}`, strings)
  }

  async addString(language: string, key: string, value: string): Promise<void> {
    const strings = await this.getAllStrings(language)
    strings[key] = value
    await this.setStrings(language, strings)
  }
}

// ===================================
// EXPORTS
// ===================================

export const smartTranslationService = new SmartTranslationService()
export const languageDetectionService = new LanguageDetectionService()
export const culturalAdaptationService = new CulturalAdaptationService()
export const localizationManagerService = new LocalizationManagerService()

export default {
  smartTranslation: smartTranslationService,
  languageDetection: languageDetectionService,
  culturalAdaptation: culturalAdaptationService,
  localizationManager: localizationManagerService
}

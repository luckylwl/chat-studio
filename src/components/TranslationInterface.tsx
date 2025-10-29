/**
 * Translation Interface Component
 *
 * Comprehensive multilingual translation and localization interface
 */

import React, { useState, useEffect } from 'react'
import {
  translationServiceV2,
  languageDetectionService,
  culturalAdaptationService,
  localizationService
} from '../services/multilingualI18nServices'
import type {
  Translation,
  LanguageDetection,
  TranslationMemory,
  Locale
} from '../types/v4-types'

interface TranslationInterfaceProps {
  userId: string
}

export const TranslationInterface: React.FC<TranslationInterfaceProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'translate' | 'detect' | 'memory' | 'localize'>('translate')

  // Translation state
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [sourceLang, setSourceLang] = useState('en')
  const [targetLang, setTargetLang] = useState('zh')
  const [translationStyle, setTranslationStyle] = useState<'formal' | 'casual' | 'technical'>('formal')
  const [translating, setTranslating] = useState(false)
  const [translationHistory, setTranslationHistory] = useState<Translation[]>([])

  // Detection state
  const [detectionText, setDetectionText] = useState('')
  const [detectionResult, setDetectionResult] = useState<LanguageDetection | null>(null)
  const [detecting, setDetecting] = useState(false)

  // Translation Memory state
  const [memoryEntries, setMemoryEntries] = useState<TranslationMemory[]>([])
  const [memorySearchQuery, setMemorySearchQuery] = useState('')

  // Localization state
  const [selectedLocale, setSelectedLocale] = useState<string>('en-US')
  const [dateToFormat, setDateToFormat] = useState(new Date())
  const [numberToFormat, setNumberToFormat] = useState(1234567.89)
  const [currencyAmount, setCurrencyAmount] = useState(9999.99)
  const [formattedDate, setFormattedDate] = useState('')
  const [formattedNumber, setFormattedNumber] = useState('')
  const [formattedCurrency, setFormattedCurrency] = useState('')

  const supportedLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'th', name: 'ไทย', flag: '🇹🇭' },
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' },
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'sv', name: 'Svenska', flag: '🇸🇪' }
  ]

  const locales = [
    'en-US', 'en-GB', 'zh-CN', 'zh-TW', 'es-ES', 'es-MX',
    'fr-FR', 'de-DE', 'ja-JP', 'ko-KR', 'ru-RU', 'ar-SA',
    'pt-BR', 'pt-PT', 'it-IT', 'hi-IN', 'th-TH', 'vi-VN'
  ]

  useEffect(() => {
    loadTranslationHistory()
    loadTranslationMemory()
  }, [userId])

  const loadTranslationHistory = async () => {
    try {
      const history = await translationServiceV2.getHistory(userId)
      setTranslationHistory(history.slice(0, 10)) // Last 10 translations
    } catch (error) {
      console.error('Failed to load translation history:', error)
    }
  }

  const loadTranslationMemory = async () => {
    try {
      const memory = await translationServiceV2.getMemory(userId, sourceLang, targetLang)
      setMemoryEntries(memory)
    } catch (error) {
      console.error('Failed to load translation memory:', error)
    }
  }

  const handleTranslate = async () => {
    if (!sourceText.trim()) return

    setTranslating(true)
    try {
      const translation = await translationServiceV2.translate(
        sourceText,
        sourceLang,
        targetLang,
        {
          style: translationStyle,
          preserveFormatting: true,
          useMemory: true
        }
      )

      setTranslatedText(translation.translatedText)
      setTranslationHistory([translation, ...translationHistory].slice(0, 10))
    } catch (error) {
      console.error('Translation failed:', error)
      alert('Translation failed. Please try again.')
    } finally {
      setTranslating(false)
    }
  }

  const handleDetectLanguage = async () => {
    if (!detectionText.trim()) return

    setDetecting(true)
    try {
      const result = await languageDetectionService.detect(detectionText)
      setDetectionResult(result)
    } catch (error) {
      console.error('Detection failed:', error)
      alert('Language detection failed. Please try again.')
    } finally {
      setDetecting(false)
    }
  }

  const handleSwapLanguages = () => {
    const temp = sourceLang
    setSourceLang(targetLang)
    setTargetLang(temp)
    setSourceText(translatedText)
    setTranslatedText(sourceText)
  }

  const handleAutoDetect = async () => {
    if (!sourceText.trim()) return

    const result = await languageDetectionService.detect(sourceText)
    setSourceLang(result.language)
  }

  const handleSearchMemory = async () => {
    if (!memorySearchQuery.trim()) return

    try {
      const results = await translationServiceV2.searchMemory(
        userId,
        memorySearchQuery,
        sourceLang,
        targetLang
      )
      setMemoryEntries(results)
    } catch (error) {
      console.error('Memory search failed:', error)
    }
  }

  const handleFormatDate = async () => {
    try {
      const formatted = await culturalAdaptationService.formatDate(dateToFormat, selectedLocale)
      setFormattedDate(formatted)
    } catch (error) {
      console.error('Date formatting failed:', error)
    }
  }

  const handleFormatNumber = async () => {
    try {
      const formatted = await culturalAdaptationService.formatNumber(numberToFormat, selectedLocale)
      setFormattedNumber(formatted)
    } catch (error) {
      console.error('Number formatting failed:', error)
    }
  }

  const handleFormatCurrency = async () => {
    try {
      const formatted = await culturalAdaptationService.formatCurrency(currencyAmount, selectedLocale)
      setFormattedCurrency(formatted)
    } catch (error) {
      console.error('Currency formatting failed:', error)
    }
  }

  const renderTranslateTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.translationContainer}>
        {/* Language selector */}
        <div style={styles.languageSelector}>
          <div style={styles.languageDropdown}>
            <label style={styles.label}>From</label>
            <select
              style={styles.select}
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
            >
              {supportedLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
            <button style={styles.detectButton} onClick={handleAutoDetect}>
              Auto-detect
            </button>
          </div>

          <button style={styles.swapButton} onClick={handleSwapLanguages}>
            ⇄
          </button>

          <div style={styles.languageDropdown}>
            <label style={styles.label}>To</label>
            <select
              style={styles.select}
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
            >
              {supportedLanguages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Translation style */}
        <div style={styles.styleSelector}>
          <label style={styles.label}>Translation Style</label>
          <div style={styles.styleButtons}>
            <button
              style={translationStyle === 'formal' ? styles.activeStyleButton : styles.styleButton}
              onClick={() => setTranslationStyle('formal')}
            >
              Formal
            </button>
            <button
              style={translationStyle === 'casual' ? styles.activeStyleButton : styles.styleButton}
              onClick={() => setTranslationStyle('casual')}
            >
              Casual
            </button>
            <button
              style={translationStyle === 'technical' ? styles.activeStyleButton : styles.styleButton}
              onClick={() => setTranslationStyle('technical')}
            >
              Technical
            </button>
          </div>
        </div>

        {/* Translation panels */}
        <div style={styles.translationPanels}>
          <div style={styles.translationPanel}>
            <h3 style={styles.panelTitle}>Source Text</h3>
            <textarea
              style={styles.textarea}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Enter text to translate..."
            />
            <div style={styles.panelFooter}>
              <span style={styles.charCount}>{sourceText.length} characters</span>
            </div>
          </div>

          <div style={styles.translationPanel}>
            <h3 style={styles.panelTitle}>Translated Text</h3>
            <textarea
              style={styles.textarea}
              value={translatedText}
              readOnly
              placeholder="Translation will appear here..."
            />
            <div style={styles.panelFooter}>
              <span style={styles.charCount}>{translatedText.length} characters</span>
            </div>
          </div>
        </div>

        <button
          style={styles.largePrimaryButton}
          onClick={handleTranslate}
          disabled={translating || !sourceText.trim()}
        >
          {translating ? 'Translating...' : 'Translate'}
        </button>

        {/* Translation history */}
        {translationHistory.length > 0 && (
          <div style={styles.historySection}>
            <h3 style={styles.sectionTitle}>Recent Translations</h3>
            <div style={styles.historyList}>
              {translationHistory.map((trans, idx) => (
                <div key={idx} style={styles.historyItem}>
                  <div style={styles.historyHeader}>
                    <span style={styles.historyLangs}>
                      {trans.sourceLang} → {trans.targetLang}
                    </span>
                    <span style={styles.historyTime}>
                      {new Date(trans.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p style={styles.historyText}>{trans.sourceText}</p>
                  <p style={styles.historyTranslation}>{trans.translatedText}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderDetectTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.detectContainer}>
        <h2 style={styles.sectionTitle}>Language Detection</h2>
        <p style={styles.description}>
          Automatically detect the language of any text with confidence scores
        </p>

        <textarea
          style={styles.largeTextarea}
          value={detectionText}
          onChange={(e) => setDetectionText(e.target.value)}
          placeholder="Enter text to detect language..."
        />

        <button
          style={styles.largePrimaryButton}
          onClick={handleDetectLanguage}
          disabled={detecting || !detectionText.trim()}
        >
          {detecting ? 'Detecting...' : 'Detect Language'}
        </button>

        {detectionResult && (
          <div style={styles.detectionResult}>
            <h3>Detection Result</h3>
            <div style={styles.primaryLanguage}>
              <span style={styles.languageFlag}>
                {supportedLanguages.find(l => l.code === detectionResult.language)?.flag}
              </span>
              <div>
                <h4 style={styles.detectedLanguageName}>
                  {supportedLanguages.find(l => l.code === detectionResult.language)?.name || detectionResult.language}
                </h4>
                <p style={styles.confidence}>
                  Confidence: {(detectionResult.confidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {detectionResult.alternatives && detectionResult.alternatives.length > 0 && (
              <div style={styles.alternatives}>
                <h4>Alternative Detections</h4>
                {detectionResult.alternatives.map((alt, idx) => (
                  <div key={idx} style={styles.alternativeItem}>
                    <span>{supportedLanguages.find(l => l.code === alt.language)?.name || alt.language}</span>
                    <span>{(alt.confidence * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const renderMemoryTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.memoryContainer}>
        <h2 style={styles.sectionTitle}>Translation Memory</h2>
        <p style={styles.description}>
          Browse and search previously translated phrases for consistency
        </p>

        <div style={styles.memorySearch}>
          <input
            type="text"
            style={styles.input}
            value={memorySearchQuery}
            onChange={(e) => setMemorySearchQuery(e.target.value)}
            placeholder="Search translation memory..."
          />
          <button style={styles.primaryButton} onClick={handleSearchMemory}>
            Search
          </button>
        </div>

        <div style={styles.memoryList}>
          {memoryEntries.map((entry, idx) => (
            <div key={idx} style={styles.memoryCard}>
              <div style={styles.memoryHeader}>
                <span style={styles.memoryLangs}>
                  {entry.sourceLang} → {entry.targetLang}
                </span>
                <span style={styles.memoryScore}>
                  Match: {(entry.matchScore * 100).toFixed(0)}%
                </span>
              </div>
              <div style={styles.memoryContent}>
                <p style={styles.memorySource}>{entry.sourceText}</p>
                <p style={styles.memoryTarget}>{entry.translatedText}</p>
              </div>
              <div style={styles.memoryFooter}>
                <span style={styles.memoryUsage}>Used {entry.usageCount} times</span>
                <span style={styles.memoryDate}>
                  {new Date(entry.lastUsed).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderLocalizeTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.localizeContainer}>
        <h2 style={styles.sectionTitle}>Cultural Adaptation & Localization</h2>
        <p style={styles.description}>
          Format dates, numbers, and currencies for different locales
        </p>

        <div style={styles.localeSelector}>
          <label style={styles.label}>Select Locale</label>
          <select
            style={styles.select}
            value={selectedLocale}
            onChange={(e) => setSelectedLocale(e.target.value)}
          >
            {locales.map(locale => (
              <option key={locale} value={locale}>{locale}</option>
            ))}
          </select>
        </div>

        <div style={styles.formatGrid}>
          {/* Date formatting */}
          <div style={styles.formatCard}>
            <h3 style={styles.formatTitle}>📅 Date Formatting</h3>
            <input
              type="date"
              style={styles.input}
              value={dateToFormat.toISOString().split('T')[0]}
              onChange={(e) => setDateToFormat(new Date(e.target.value))}
            />
            <button style={styles.primaryButton} onClick={handleFormatDate}>
              Format Date
            </button>
            {formattedDate && (
              <div style={styles.formatResult}>
                <strong>Result:</strong> {formattedDate}
              </div>
            )}
          </div>

          {/* Number formatting */}
          <div style={styles.formatCard}>
            <h3 style={styles.formatTitle}>🔢 Number Formatting</h3>
            <input
              type="number"
              style={styles.input}
              value={numberToFormat}
              onChange={(e) => setNumberToFormat(parseFloat(e.target.value))}
            />
            <button style={styles.primaryButton} onClick={handleFormatNumber}>
              Format Number
            </button>
            {formattedNumber && (
              <div style={styles.formatResult}>
                <strong>Result:</strong> {formattedNumber}
              </div>
            )}
          </div>

          {/* Currency formatting */}
          <div style={styles.formatCard}>
            <h3 style={styles.formatTitle}>💰 Currency Formatting</h3>
            <input
              type="number"
              style={styles.input}
              value={currencyAmount}
              onChange={(e) => setCurrencyAmount(parseFloat(e.target.value))}
            />
            <button style={styles.primaryButton} onClick={handleFormatCurrency}>
              Format Currency
            </button>
            {formattedCurrency && (
              <div style={styles.formatResult}>
                <strong>Result:</strong> {formattedCurrency}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Translation Center</h1>
        <p style={styles.subtitle}>AI-powered translation across 18+ languages</p>
      </div>

      <div style={styles.tabs}>
        <button
          style={activeTab === 'translate' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('translate')}
        >
          🌐 Translate
        </button>
        <button
          style={activeTab === 'detect' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('detect')}
        >
          🔍 Detect
        </button>
        <button
          style={activeTab === 'memory' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('memory')}
        >
          💾 Memory
        </button>
        <button
          style={activeTab === 'localize' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('localize')}
        >
          🌍 Localize
        </button>
      </div>

      {activeTab === 'translate' && renderTranslateTab()}
      {activeTab === 'detect' && renderDetectTab()}
      {activeTab === 'memory' && renderMemoryTab()}
      {activeTab === 'localize' && renderLocalizeTab()}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    marginBottom: '30px',
    textAlign: 'center'
  },
  title: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#1F2937'
  },
  subtitle: {
    fontSize: '16px',
    color: '#6B7280',
    margin: 0
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '30px',
    borderBottom: '2px solid #E5E7EB',
    paddingBottom: '0',
    justifyContent: 'center'
  },
  tab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    fontSize: '16px',
    fontWeight: 500,
    color: '#6B7280',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  activeTab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid #3B82F6',
    fontSize: '16px',
    fontWeight: 600,
    color: '#3B82F6',
    cursor: 'pointer'
  },
  tabContent: {
    minHeight: '500px'
  },
  // Translation tab styles
  translationContainer: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  languageSelector: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '20px',
    marginBottom: '20px',
    justifyContent: 'center'
  },
  languageDropdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '200px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151'
  },
  select: {
    padding: '10px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white'
  },
  detectButton: {
    padding: '8px 16px',
    background: '#F3F4F6',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  swapButton: {
    padding: '10px 16px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '20px',
    cursor: 'pointer',
    marginBottom: '0'
  },
  styleSelector: {
    marginBottom: '24px',
    textAlign: 'center'
  },
  styleButtons: {
    display: 'inline-flex',
    gap: '8px',
    marginTop: '8px'
  },
  styleButton: {
    padding: '8px 20px',
    background: '#F3F4F6',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#6B7280'
  },
  activeStyleButton: {
    padding: '8px 20px',
    background: '#3B82F6',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    color: 'white',
    fontWeight: 600
  },
  translationPanels: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '24px'
  },
  translationPanel: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column'
  },
  panelTitle: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#1F2937'
  },
  textarea: {
    flex: 1,
    minHeight: '200px',
    padding: '12px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.6',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  panelFooter: {
    marginTop: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  charCount: {
    fontSize: '12px',
    color: '#9CA3AF'
  },
  largePrimaryButton: {
    padding: '16px 48px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    margin: '0 auto',
    display: 'block',
    transition: 'background 0.2s'
  },
  historySection: {
    marginTop: '40px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#1F2937'
  },
  description: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '24px'
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  historyItem: {
    background: 'white',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB'
  },
  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  historyLangs: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#3B82F6'
  },
  historyTime: {
    fontSize: '12px',
    color: '#9CA3AF'
  },
  historyText: {
    fontSize: '14px',
    color: '#1F2937',
    marginBottom: '8px'
  },
  historyTranslation: {
    fontSize: '14px',
    color: '#6B7280'
  },
  // Detection tab styles
  detectContainer: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  largeTextarea: {
    width: '100%',
    minHeight: '200px',
    padding: '16px',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '24px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  detectionResult: {
    marginTop: '32px',
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  primaryLanguage: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    background: '#F9FAFB',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  languageFlag: {
    fontSize: '48px'
  },
  detectedLanguageName: {
    fontSize: '24px',
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#1F2937'
  },
  confidence: {
    fontSize: '16px',
    color: '#6B7280',
    margin: 0
  },
  alternatives: {
    marginTop: '16px'
  },
  alternativeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    background: '#F9FAFB',
    borderRadius: '6px',
    marginTop: '8px'
  },
  // Memory tab styles
  memoryContainer: {
    maxWidth: '1000px',
    margin: '0 auto'
  },
  memorySearch: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px'
  },
  primaryButton: {
    padding: '12px 24px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  memoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  memoryCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  memoryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  memoryLangs: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#3B82F6'
  },
  memoryScore: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#10B981'
  },
  memoryContent: {
    marginBottom: '12px'
  },
  memorySource: {
    fontSize: '14px',
    color: '#1F2937',
    marginBottom: '8px',
    fontWeight: 500
  },
  memoryTarget: {
    fontSize: '14px',
    color: '#6B7280'
  },
  memoryFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#9CA3AF'
  },
  memoryUsage: {},
  memoryDate: {},
  // Localization tab styles
  localizeContainer: {
    maxWidth: '1000px',
    margin: '0 auto'
  },
  localeSelector: {
    marginBottom: '32px',
    maxWidth: '300px'
  },
  formatGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px'
  },
  formatCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formatTitle: {
    fontSize: '18px',
    fontWeight: 600,
    margin: 0,
    color: '#1F2937'
  },
  formatResult: {
    padding: '16px',
    background: '#F0F9FF',
    borderRadius: '8px',
    border: '1px solid #BFDBFE',
    fontSize: '14px',
    color: '#1E40AF'
  }
}

export default TranslationInterface

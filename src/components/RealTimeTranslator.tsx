import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnalytics } from './AnalyticsProvider'
import { useAppStore } from '@/store'
import { cn } from '@/utils'

interface TranslationLanguage {
  code: string
  name: string
  nativeName: string
  flag: string
  isRTL: boolean
  family: 'indo-european' | 'sino-tibetan' | 'afro-asiatic' | 'niger-congo' | 'austronesian' | 'other'
}

interface TranslationHistory {
  id: string
  sourceText: string
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  timestamp: number
  type: 'text' | 'voice' | 'image' | 'document'
  confidence: number
  alternativeTranslations?: string[]
  context?: string
  isBookmarked: boolean
}

interface VoiceRecognitionResult {
  text: string
  confidence: number
  isFinal: boolean
  language: string
}

interface ConversationMode {
  id: string
  name: string
  description: string
  icon: string
  participants: number
  layout: 'split' | 'overlay' | 'carousel'
  autoDetect: boolean
  realTimeMode: boolean
}

const languages: TranslationLanguage[] = [
  { code: 'zh-CN', name: '中文', nativeName: '中文', flag: '🇨🇳', isRTL: false, family: 'sino-tibetan' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', isRTL: false, family: 'indo-european' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', isRTL: false, family: 'indo-european' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', isRTL: false, family: 'indo-european' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', isRTL: false, family: 'indo-european' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', isRTL: false, family: 'other' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', isRTL: false, family: 'other' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isRTL: true, family: 'afro-asiatic' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', isRTL: false, family: 'indo-european' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', isRTL: false, family: 'indo-european' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', isRTL: false, family: 'indo-european' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', isRTL: false, family: 'indo-european' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', isRTL: false, family: 'other' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', isRTL: false, family: 'indo-european' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭', isRTL: false, family: 'other' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳', isRTL: false, family: 'other' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', isRTL: false, family: 'indo-european' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', isRTL: false, family: 'indo-european' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', isRTL: false, family: 'indo-european' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', isRTL: false, family: 'other' }
]

const conversationModes: ConversationMode[] = [
  {
    id: 'bilateral',
    name: '双向对话',
    description: '两人之间的实时翻译对话',
    icon: '💬',
    participants: 2,
    layout: 'split',
    autoDetect: true,
    realTimeMode: true
  },
  {
    id: 'multilingual',
    name: '多语言会议',
    description: '多人多语言实时会议翻译',
    icon: '🌍',
    participants: 8,
    layout: 'overlay',
    autoDetect: true,
    realTimeMode: true
  },
  {
    id: 'presentation',
    name: '演讲模式',
    description: '演讲者与听众的翻译模式',
    icon: '🎤',
    participants: 1,
    layout: 'overlay',
    autoDetect: false,
    realTimeMode: true
  },
  {
    id: 'text_chat',
    name: '文字对话',
    description: '文字消息的即时翻译',
    icon: '📝',
    participants: 2,
    layout: 'split',
    autoDetect: true,
    realTimeMode: false
  },
  {
    id: 'tourist',
    name: '旅行助手',
    description: '旅行中的快速翻译工具',
    icon: '🗺️',
    participants: 2,
    layout: 'carousel',
    autoDetect: true,
    realTimeMode: false
  }
]

interface RealTimeTranslatorProps {
  className?: string
}

export const RealTimeTranslator: React.FC<RealTimeTranslatorProps> = ({ className }) => {
  const { t } = useTranslation()
  const { trackFeatureUsage, trackUserAction } = useAnalytics()
  const { user } = useAppStore()

  const [sourceLanguage, setSourceLanguage] = useState<string>('auto')
  const [targetLanguage, setTargetLanguage] = useState<string>('en')
  const [conversationMode, setConversationMode] = useState<ConversationMode>(conversationModes[0])
  const [isListening, setIsListening] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [currentTranslation, setCurrentTranslation] = useState('')
  const [translationHistory, setTranslationHistory] = useState<TranslationHistory[]>([])
  const [inputText, setInputText] = useState('')
  const [voiceRecognitionResult, setVoiceRecognitionResult] = useState<VoiceRecognitionResult | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedHistory, setSelectedHistory] = useState<TranslationHistory | null>(null)
  const [bookmarkedTranslations, setBookmarkedTranslations] = useState<TranslationHistory[]>([])
  const [voiceSettings, setVoiceSettings] = useState({
    speed: 1,
    pitch: 1,
    volume: 1,
    voice: 'system'
  })
  const [isAutoTranslate, setIsAutoTranslate] = useState(true)
  const [showLanguageDetection, setShowLanguageDetection] = useState(false)
  const [detectedLanguages, setDetectedLanguages] = useState<Array<{ language: string; confidence: number }>>([])

  const recognitionRef = useRef<any>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    trackFeatureUsage('real_time_translator')
  }, [trackFeatureUsage])

  const initializeSpeechRecognition = useCallback(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = sourceLanguage === 'auto' ? 'auto' : sourceLanguage

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: any) => {
        const result = event.results[event.results.length - 1]
        const transcript = result[0].transcript
        const confidence = result[0].confidence

        setVoiceRecognitionResult({
          text: transcript,
          confidence: confidence || 0.8,
          isFinal: result.isFinal,
          language: sourceLanguage
        })

        if (result.isFinal && isAutoTranslate) {
          translateText(transcript, sourceLanguage, targetLanguage, 'voice')
        }
      }

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [sourceLanguage, targetLanguage, isAutoTranslate])

  const translateText = useCallback(async (
    text: string,
    fromLang: string,
    toLang: string,
    type: 'text' | 'voice' | 'image' | 'document' = 'text'
  ) => {
    if (!text.trim()) return

    setIsTranslating(true)
    trackUserAction('translate_text', 'button', {
      fromLang,
      toLang,
      type,
      textLength: text.length
    })

    try {
      // 模拟翻译API调用
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

      // 模拟翻译结果
      const translatedText = await simulateTranslation(text, fromLang, toLang)
      const confidence = 0.85 + Math.random() * 0.15

      // 检测源语言（如果是自动检测）
      let detectedSourceLang = fromLang
      if (fromLang === 'auto') {
        detectedSourceLang = await detectLanguage(text)
      }

      const translation: TranslationHistory = {
        id: `translation_${Date.now()}`,
        sourceText: text,
        translatedText,
        sourceLanguage: detectedSourceLang,
        targetLanguage: toLang,
        timestamp: Date.now(),
        type,
        confidence,
        alternativeTranslations: generateAlternatives(translatedText),
        isBookmarked: false
      }

      setTranslationHistory(prev => [translation, ...prev.slice(0, 99)]) // 保留最新100条
      setCurrentTranslation(translatedText)

      // 语音播放翻译结果
      if (type === 'voice' && translatedText) {
        speakText(translatedText, toLang)
      }

    } catch (error) {
      console.error('Translation error:', error)
    } finally {
      setIsTranslating(false)
    }
  }, [trackUserAction])

  const simulateTranslation = async (text: string, fromLang: string, toLang: string): Promise<string> => {
    // 简单的模拟翻译逻辑
    const translations: Record<string, Record<string, string>> = {
      'zh-CN': {
        'en': 'Hello, this is a translated message.',
        'ja': 'こんにちは、これは翻訳されたメッセージです。',
        'ko': '안녕하세요, 이것은 번역된 메시지입니다.',
        'fr': 'Bonjour, ceci est un message traduit.',
        'de': 'Hallo, das ist eine übersetzte Nachricht.',
        'es': 'Hola, este es un mensaje traducido.'
      },
      'en': {
        'zh-CN': '你好，这是一条翻译的消息。',
        'ja': 'こんにちは、これは翻訳されたメッセージです。',
        'ko': '안녕하세요, 이것은 번역된 메시지입니다.',
        'fr': 'Bonjour, ceci est un message traduit.',
        'de': 'Hallo, das ist eine übersetzte Nachricht.'
      }
    }

    // 如果有预设翻译则返回，否则返回模拟结果
    if (translations[fromLang]?.[toLang]) {
      return translations[fromLang][toLang]
    }

    return `[${toLang}] ${text} (模拟翻译)`
  }

  const detectLanguage = async (text: string): Promise<string> => {
    // 简单的语言检测模拟
    if (/[\u4e00-\u9fff]/.test(text)) return 'zh-CN'
    if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/.test(text)) return 'ja'
    if (/[\uac00-\ud7af]/.test(text)) return 'ko'
    if (/[\u0600-\u06ff]/.test(text)) return 'ar'
    if (/[\u0400-\u04ff]/.test(text)) return 'ru'
    return 'en'
  }

  const generateAlternatives = (translation: string): string[] => {
    return [
      `${translation} (备选1)`,
      `${translation} (备选2)`,
      `${translation} (备选3)`
    ].slice(0, Math.floor(Math.random() * 3) + 1)
  }

  const speakText = useCallback((text: string, language: string) => {
    if ('speechSynthesis' in window) {
      // 停止之前的朗读
      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language
      utterance.rate = voiceSettings.speed
      utterance.pitch = voiceSettings.pitch
      utterance.volume = voiceSettings.volume

      speechSynthesisRef.current = utterance
      speechSynthesis.speak(utterance)
    }
  }, [voiceSettings])

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Failed to start speech recognition:', error)
      }
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }, [])

  const toggleBookmark = useCallback((translation: TranslationHistory) => {
    const updatedTranslation = { ...translation, isBookmarked: !translation.isBookmarked }

    setTranslationHistory(prev =>
      prev.map(t => t.id === translation.id ? updatedTranslation : t)
    )

    if (updatedTranslation.isBookmarked) {
      setBookmarkedTranslations(prev => [...prev, updatedTranslation])
    } else {
      setBookmarkedTranslations(prev => prev.filter(t => t.id !== translation.id))
    }

    trackUserAction('toggle_bookmark', 'button', { translationId: translation.id })
  }, [trackUserAction])

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const fileType = file.type
    let extractedText = ''

    try {
      if (fileType.startsWith('image/')) {
        extractedText = await extractTextFromImage(file)
      } else if (fileType === 'application/pdf' || fileType.includes('document')) {
        extractedText = await extractTextFromDocument(file)
      } else if (fileType.startsWith('text/')) {
        extractedText = await file.text()
      }

      if (extractedText) {
        setInputText(extractedText)
        if (isAutoTranslate) {
          translateText(extractedText, sourceLanguage, targetLanguage, 'document')
        }
      }
    } catch (error) {
      console.error('File processing error:', error)
    }
  }, [sourceLanguage, targetLanguage, isAutoTranslate, translateText])

  const extractTextFromImage = async (file: File): Promise<string> => {
    // 模拟OCR功能
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`从图片中提取的文本内容: ${file.name}`)
      }, 2000)
    })
  }

  const extractTextFromDocument = async (file: File): Promise<string> => {
    // 模拟文档文本提取
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`从文档中提取的文本内容: ${file.name}`)
      }, 1500)
    })
  }

  const handleCameraCapture = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const extractedText = await extractTextFromImage(file)
      setInputText(extractedText)
      if (isAutoTranslate) {
        translateText(extractedText, sourceLanguage, targetLanguage, 'image')
      }
    }
  }, [sourceLanguage, targetLanguage, isAutoTranslate, translateText])

  const swapLanguages = useCallback(() => {
    if (sourceLanguage !== 'auto') {
      const temp = sourceLanguage
      setSourceLanguage(targetLanguage)
      setTargetLanguage(temp)
      trackUserAction('swap_languages', 'button')
    }
  }, [sourceLanguage, targetLanguage, trackUserAction])

  const clearHistory = useCallback(() => {
    setTranslationHistory([])
    trackUserAction('clear_history', 'button')
  }, [trackUserAction])

  const exportHistory = useCallback(() => {
    const dataStr = JSON.stringify(translationHistory, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

    const exportFileDefaultName = `translation_history_${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()

    trackUserAction('export_history', 'button', { historyCount: translationHistory.length })
  }, [translationHistory, trackUserAction])

  useEffect(() => {
    initializeSpeechRecognition()
  }, [initializeSpeechRecognition])

  return (
    <div className={cn("bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700", className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🌐</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                实时翻译器
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                智能多语言实时翻译系统
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {showHistory ? '隐藏历史' : '显示历史'}
            </button>
            <button
              onClick={exportHistory}
              className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-colors"
            >
              导出历史
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Conversation Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            对话模式
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {conversationModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setConversationMode(mode)}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all",
                  conversationMode.id === mode.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{mode.icon}</span>
                  <span className="font-medium text-sm">{mode.name}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {mode.description}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                    {mode.participants === 1 ? '单人' : `${mode.participants}人`}
                  </span>
                  {mode.realTimeMode && (
                    <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded">
                      实时
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              源语言
            </label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="auto">🔍 自动检测</option>
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end justify-center">
            <button
              onClick={swapLanguages}
              disabled={sourceLanguage === 'auto'}
              className={cn(
                "p-2 rounded-lg transition-all",
                sourceLanguage === 'auto'
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/50"
              )}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              目标语言
            </label>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isAutoTranslate}
                onChange={(e) => setIsAutoTranslate(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">自动翻译</span>
            </label>
          </div>

          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="输入要翻译的文本，或使用语音输入..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] resize-none"
              dir={languages.find(l => l.code === sourceLanguage)?.isRTL ? 'rtl' : 'ltr'}
            />

            {voiceRecognitionResult && !voiceRecognitionResult.isFinal && (
              <div className="absolute bottom-3 left-3 text-sm text-blue-500 bg-blue-50 dark:bg-blue-950/50 px-2 py-1 rounded">
                正在识别: {voiceRecognitionResult.text}
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-blue-500 text-white hover:bg-blue-600"
              )}
            >
              {isListening ? (
                <>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  停止录音
                </>
              ) : (
                <>
                  🎤 语音输入
                </>
              )}
            </button>

            <button
              onClick={() => translateText(inputText, sourceLanguage, targetLanguage)}
              disabled={!inputText.trim() || isTranslating}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                !inputText.trim() || isTranslating
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-green-500 text-white hover:bg-green-600"
              )}
            >
              {isTranslating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  翻译中...
                </>
              ) : (
                <>
                  🔄 翻译
                </>
              )}
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-purple-500 text-white hover:bg-purple-600 transition-all"
            >
              📄 上传文件
            </button>

            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-orange-500 text-white hover:bg-orange-600 transition-all"
            >
              📷 拍照翻译
            </button>

            <button
              onClick={() => setInputText('')}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              🗑️
            </button>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx,image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
        </div>

        {/* Translation Result */}
        {currentTranslation && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">翻译结果</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => speakText(currentTranslation, targetLanguage)}
                  className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors"
                >
                  🔊
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(currentTranslation)}
                  className="p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-950/50 rounded transition-colors"
                >
                  📋
                </button>
              </div>
            </div>
            <p
              className="text-gray-900 dark:text-gray-100 text-lg"
              dir={languages.find(l => l.code === targetLanguage)?.isRTL ? 'rtl' : 'ltr'}
            >
              {currentTranslation}
            </p>
          </div>
        )}

        {/* Translation History */}
        {showHistory && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                翻译历史 ({translationHistory.length})
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearHistory}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  清空历史
                </button>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {translationHistory.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  暂无翻译历史
                </div>
              ) : (
                translationHistory.map((translation) => (
                  <div
                    key={translation.id}
                    className="p-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                          {languages.find(l => l.code === translation.sourceLanguage)?.flag || '🔍'} → {languages.find(l => l.code === translation.targetLanguage)?.flag || '🌍'}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded">
                          {translation.type === 'voice' ? '🎤' : translation.type === 'image' ? '📷' : translation.type === 'document' ? '📄' : '📝'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(translation.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleBookmark(translation)}
                          className={cn(
                            "p-1 rounded transition-colors",
                            translation.isBookmarked
                              ? "text-yellow-500"
                              : "text-gray-400 hover:text-yellow-500"
                          )}
                        >
                          {translation.isBookmarked ? '⭐' : '☆'}
                        </button>
                        <button
                          onClick={() => speakText(translation.translatedText, translation.targetLanguage)}
                          className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors"
                        >
                          🔊
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">原文:</span> {translation.sourceText}
                      </p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        <span className="font-medium">译文:</span> {translation.translatedText}
                      </p>
                      {translation.alternativeTranslations && translation.alternativeTranslations.length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            备选翻译 ({translation.alternativeTranslations.length})
                          </summary>
                          <div className="mt-2 pl-4 space-y-1">
                            {translation.alternativeTranslations.map((alt, index) => (
                              <p key={index} className="text-gray-600 dark:text-gray-400">
                                • {alt}
                              </p>
                            ))}
                          </div>
                        </details>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>置信度: {Math.round(translation.confidence * 100)}%</span>
                        {translation.confidence < 0.8 && (
                          <span className="text-yellow-600">⚠️ 低置信度</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Voice Settings */}
        <details className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <summary className="p-4 cursor-pointer font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            语音设置
          </summary>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                语速: {voiceSettings.speed}
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={voiceSettings.speed}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                音调: {voiceSettings.pitch}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={voiceSettings.pitch}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                音量: {voiceSettings.volume}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={voiceSettings.volume}
                onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}

export default RealTimeTranslator
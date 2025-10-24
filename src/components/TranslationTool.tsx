import React, { useState } from 'react'
import { Button, Textarea, Select } from './ui'
import {
  ArrowRightIcon,
  ArrowPathIcon,
  LanguageIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'

interface Language {
  code: string
  name: string
  nativeName: string
}

interface TranslationToolProps {
  onTranslate?: (text: string, fromLang: string, toLang: string, result: string) => void
  className?: string
}

const TranslationTool: React.FC<TranslationToolProps> = ({ onTranslate, className }) => {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [fromLang, setFromLang] = useState('auto')
  const [toLang, setToLang] = useState('en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [copied, setCopied] = useState(false)

  const languages: Language[] = [
    { code: 'auto', name: '自动检测', nativeName: 'Auto Detect' },
    { code: 'zh', name: '中文', nativeName: '中文' },
    { code: 'en', name: '英语', nativeName: 'English' },
    { code: 'ja', name: '日语', nativeName: '日本語' },
    { code: 'ko', name: '韩语', nativeName: '한국어' },
    { code: 'es', name: '西班牙语', nativeName: 'Español' },
    { code: 'fr', name: '法语', nativeName: 'Français' },
    { code: 'de', name: '德语', nativeName: 'Deutsch' },
    { code: 'it', name: '意大利语', nativeName: 'Italiano' },
    { code: 'pt', name: '葡萄牙语', nativeName: 'Português' },
    { code: 'ru', name: '俄语', nativeName: 'Русский' },
    { code: 'ar', name: '阿拉伯语', nativeName: 'العربية' },
    { code: 'hi', name: '印地语', nativeName: 'हिन्दी' },
    { code: 'th', name: '泰语', nativeName: 'ไทย' },
    { code: 'vi', name: '越南语', nativeName: 'Tiếng Việt' },
    { code: 'id', name: '印尼语', nativeName: 'Bahasa Indonesia' },
    { code: 'ms', name: '马来语', nativeName: 'Bahasa Melayu' },
    { code: 'tr', name: '土耳其语', nativeName: 'Türkçe' },
    { code: 'pl', name: '波兰语', nativeName: 'Polski' },
    { code: 'nl', name: '荷兰语', nativeName: 'Nederlands' },
    { code: 'sv', name: '瑞典语', nativeName: 'Svenska' },
    { code: 'da', name: '丹麦语', nativeName: 'Dansk' },
    { code: 'no', name: '挪威语', nativeName: 'Norsk' },
    { code: 'fi', name: '芬兰语', nativeName: 'Suomi' },
    { code: 'he', name: '希伯来语', nativeName: 'עברית' },
    { code: 'cs', name: '捷克语', nativeName: 'Čeština' },
    { code: 'hu', name: '匈牙利语', nativeName: 'Magyar' },
    { code: 'ro', name: '罗马尼亚语', nativeName: 'Română' },
    { code: 'bg', name: '保加利亚语', nativeName: 'Български' },
    { code: 'hr', name: '克罗地亚语', nativeName: 'Hrvatski' },
    { code: 'sr', name: '塞尔维亚语', nativeName: 'Српски' },
    { code: 'sk', name: '斯洛伐克语', nativeName: 'Slovenčina' },
    { code: 'sl', name: '斯洛文尼亚语', nativeName: 'Slovenščina' },
    { code: 'et', name: '爱沙尼亚语', nativeName: 'Eesti' },
    { code: 'lv', name: '拉脱维亚语', nativeName: 'Latviešu' },
    { code: 'lt', name: '立陶宛语', nativeName: 'Lietuvių' },
    { code: 'uk', name: '乌克兰语', nativeName: 'Українська' },
    { code: 'be', name: '白俄罗斯语', nativeName: 'Беларуская' },
    { code: 'ka', name: '格鲁吉亚语', nativeName: 'ქართული' },
    { code: 'am', name: '阿姆哈拉语', nativeName: 'አማርኛ' },
    { code: 'sw', name: '斯瓦希里语', nativeName: 'Kiswahili' },
    { code: 'zu', name: '祖鲁语', nativeName: 'isiZulu' }
  ]

  const languageOptions = languages.map(lang => ({
    value: lang.code,
    label: `${lang.name} (${lang.nativeName})`,
    searchText: `${lang.name} ${lang.nativeName} ${lang.code}`
  }))

  const quickTranslations = [
    { from: 'auto', to: 'en', label: '翻译为英语' },
    { from: 'auto', to: 'zh', label: '翻译为中文' },
    { from: 'en', to: 'zh', label: '英译中' },
    { from: 'zh', to: 'en', label: '中译英' },
    { from: 'auto', to: 'ja', label: '翻译为日语' },
    { from: 'auto', to: 'ko', label: '翻译为韩语' }
  ]

  // Mock translation function (would normally call an API)
  const translateText = async (text: string, from: string, to: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock translation results
    const mockTranslations: Record<string, Record<string, string>> = {
      'Hello world': {
        'zh': '你好世界',
        'ja': 'こんにちは世界',
        'ko': '안녕 세계',
        'es': 'Hola mundo',
        'fr': 'Bonjour le monde'
      },
      '你好世界': {
        'en': 'Hello world',
        'ja': 'こんにちは世界',
        'ko': '안녕 세계'
      },
      'How are you?': {
        'zh': '你好吗？',
        'ja': '元気ですか？',
        'ko': '어떻게 지내세요?'
      }
    }

    const translation = mockTranslations[text]?.[to]
    if (translation) {
      return translation
    }

    // Fallback: return a mock translation with language indication
    const fromLangName = languages.find(l => l.code === from)?.name || from
    const toLangName = languages.find(l => l.code === to)?.name || to
    return `[模拟翻译] 从${fromLangName}翻译到${toLangName}: ${text}`
  }

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast.error('请输入要翻译的文本')
      return
    }

    if (fromLang === toLang && fromLang !== 'auto') {
      toast.error('源语言和目标语言不能相同')
      return
    }

    setIsTranslating(true)
    try {
      const result = await translateText(sourceText.trim(), fromLang, toLang)
      setTranslatedText(result)
      onTranslate?.(sourceText, fromLang, toLang, result)
      toast.success('翻译完成')
    } catch (error) {
      console.error('Translation error:', error)
      toast.error('翻译失败，请重试')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleSwapLanguages = () => {
    if (fromLang === 'auto') {
      toast.error('无法交换自动检测的语言')
      return
    }

    const temp = fromLang
    setFromLang(toLang)
    setToLang(temp)

    // Also swap text if both have content
    if (sourceText && translatedText) {
      setSourceText(translatedText)
      setTranslatedText(sourceText)
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
      toast.error('复制失败')
    }
  }

  const handleQuickTranslation = (from: string, to: string) => {
    setFromLang(from)
    setToLang(to)
    if (sourceText.trim()) {
      // Auto translate after setting languages
      setTimeout(() => handleTranslate(), 100)
    }
  }

  const clearText = () => {
    setSourceText('')
    setTranslatedText('')
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Quick Translation Buttons */}
      <div className="flex flex-wrap gap-2">
        {quickTranslations.map((qt, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => handleQuickTranslation(qt.from, qt.to)}
            className="text-xs"
          >
            {qt.label}
          </Button>
        ))}
      </div>

      {/* Language Selection */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select
            options={languageOptions.filter(opt => opt.value === 'auto' || opt.value !== toLang)}
            value={fromLang}
            onChange={setFromLang}
            placeholder="源语言"
            className="w-full"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSwapLanguages}
          className="flex-shrink-0"
          disabled={fromLang === 'auto'}
          title="交换语言"
        >
          <ArrowPathIcon className="h-4 w-4" />
        </Button>

        <div className="flex-1">
          <Select
            options={languageOptions.filter(opt => opt.value !== 'auto' && opt.value !== fromLang)}
            value={toLang}
            onChange={setToLang}
            placeholder="目标语言"
            className="w-full"
          />
        </div>
      </div>

      {/* Translation Areas */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Source Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {languages.find(l => l.code === fromLang)?.name || '源文本'}
            </label>
            {sourceText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearText}
                className="text-xs"
              >
                清空
              </Button>
            )}
          </div>
          <Textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="输入要翻译的文本..."
            className="min-h-[120px] resize-none"
            autoResize
          />
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{sourceText.length} 字符</span>
          </div>
        </div>

        {/* Translated Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {languages.find(l => l.code === toLang)?.name || '译文'}
            </label>
            {translatedText && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(translatedText)}
                className="text-xs gap-1"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-3 w-3" />
                    已复制
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="h-3 w-3" />
                    复制
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="relative">
            <Textarea
              value={translatedText}
              readOnly
              placeholder="翻译结果将显示在这里..."
              className="min-h-[120px] resize-none bg-gray-50 dark:bg-gray-800"
            />
            {isTranslating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  翻译中...
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{translatedText.length} 字符</span>
          </div>
        </div>
      </div>

      {/* Translate Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleTranslate}
          disabled={!sourceText.trim() || isTranslating}
          className="gap-2 px-8"
          size="lg"
        >
          {isTranslating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              翻译中...
            </>
          ) : (
            <>
              <LanguageIcon className="h-4 w-4" />
              翻译
              <ArrowRightIcon className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Translation Tips */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start gap-2">
          <LanguageIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">翻译提示：</p>
            <ul className="text-xs space-y-1 opacity-90">
              <li>• 支持 40+ 种语言互译</li>
              <li>• 自动检测源语言类型</li>
              <li>• 一键交换源语言和目标语言</li>
              <li>• 点击快捷按钮进行常用语言翻译</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TranslationTool
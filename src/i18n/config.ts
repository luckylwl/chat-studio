import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'
import ja from './locales/ja.json'

// Language resources
const resources = {
  en: { translation: en },
  'zh-CN': { translation: zhCN },
  ja: { translation: ja },
}

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh-CN', 'ja'],

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false, // React already safes from xss
    },

    react: {
      useSuspense: false,
    },
  })

export default i18n

// Helper function to get language name
export const getLanguageName = (code: string): string => {
  const names: Record<string, string> = {
    en: 'English',
    'zh-CN': '简体中文',
    ja: '日本語',
  }
  return names[code] || code
}

// Helper function to get all available languages
export const getAvailableLanguages = () => {
  return Object.keys(resources).map((code) => ({
    code,
    name: getLanguageName(code),
  }))
}

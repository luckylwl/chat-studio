import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils'

interface Language {
  code: string
  name: string
  flag: string
}

const languages: Language[] = [
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
]

interface LanguageSwitcherProps {
  className?: string
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { i18n } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsOpen(false)
    localStorage.setItem('language', langCode)
  }

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <LanguageIcon className="h-4 w-4" />
        <span className="flex items-center gap-1">
          <span>{currentLanguage.flag}</span>
          <span>{currentLanguage.name}</span>
        </span>
        <ChevronDownIcon className={cn(
          "h-4 w-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageChange(language.code)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                    currentLanguage.code === language.code && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                  )}
                >
                  <span className="text-lg">{language.flag}</span>
                  <span className="font-medium">{language.name}</span>
                  {currentLanguage.code === language.code && (
                    <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LanguageSwitcher
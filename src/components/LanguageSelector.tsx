import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LanguageIcon,
  ChevronDownIcon,
  CheckIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import i18nService, { Language } from '@/services/i18nService'
import { cn } from '@/utils'

interface LanguageSelectorProps {
  variant?: 'button' | 'dropdown' | 'inline'
  size?: 'sm' | 'md' | 'lg'
  showFlag?: boolean
  showName?: boolean
  className?: string
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'dropdown',
  size = 'md',
  showFlag = true,
  showName = true,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<Language | undefined>()
  const [supportedLanguages, setSupportedLanguages] = useState<Language[]>([])

  useEffect(() => {
    setCurrentLanguage(i18nService.getCurrentLanguage())
    setSupportedLanguages(i18nService.getSupportedLanguages())

    const handleLanguageChange = () => {
      setCurrentLanguage(i18nService.getCurrentLanguage())
    }

    i18nService.addEventListener('language_changed', handleLanguageChange)
    return () => {
      i18nService.removeEventListener('language_changed', handleLanguageChange)
    }
  }, [])

  const handleLanguageSelect = (language: Language) => {
    i18nService.setLanguage(language.code)
    setIsOpen(false)
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1'
      case 'lg':
        return 'text-base px-4 py-3'
      default:
        return 'text-sm px-3 py-2'
    }
  }

  const renderLanguageOption = (language: Language, isSelected = false) => (
    <div className="flex items-center gap-2">
      {showFlag && (
        <span className="text-lg leading-none">{language.flag}</span>
      )}
      {showName && (
        <div className="flex flex-col">
          <span className="font-medium">{language.nativeName}</span>
          {language.name !== language.nativeName && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {language.name}
            </span>
          )}
        </div>
      )}
      {isSelected && variant === 'dropdown' && (
        <CheckIcon className="w-4 h-4 text-primary-600 ml-auto" />
      )}
    </div>
  )

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={() => setIsOpen(true)}
        className={cn('flex items-center gap-2', className)}
      >
        <LanguageIcon className="w-4 h-4" />
        {currentLanguage && renderLanguageOption(currentLanguage)}

        {/* 语言选择弹窗 */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={() => setIsOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <GlobeAltIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    选择语言 / Select Language
                  </h3>
                </div>

                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {supportedLanguages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageSelect(language)}
                      className={cn(
                        "w-full p-3 rounded-lg text-left transition-colors",
                        currentLanguage?.code === language.code
                          ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      )}
                    >
                      {renderLanguageOption(language, currentLanguage?.code === language.code)}
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {supportedLanguages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageSelect(language)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
              getSizeClasses(),
              currentLanguage?.code === language.code
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            {renderLanguageOption(language)}
          </button>
        ))}
      </div>
    )
  }

  // Default dropdown variant
  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-750',
          getSizeClasses(),
          isOpen && 'ring-2 ring-primary-500 border-primary-500'
        )}
      >
        {currentLanguage ? (
          renderLanguageOption(currentLanguage)
        ) : (
          <>
            <LanguageIcon className="w-4 h-4" />
            <span>Language</span>
          </>
        )}
        <ChevronDownIcon
          className={cn(
            'w-4 h-4 transition-transform ml-auto',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* 下拉菜单 */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-2 max-h-80 overflow-y-auto"
            >
              {supportedLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language)}
                  className={cn(
                    'w-full px-3 py-2 text-left transition-colors',
                    currentLanguage?.code === language.code
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                  )}
                >
                  {renderLanguageOption(language, currentLanguage?.code === language.code)}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LanguageSelector
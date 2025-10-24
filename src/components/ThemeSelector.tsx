import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  SwatchIcon,
  PlusIcon,
  CheckIcon,
  EyeDropperIcon,
  TrashIcon,
  DownloadIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'
import { Button, Badge, Tabs, Tab } from './ui'
import themeService, { Theme, ThemeMode } from '@/services/themeService'
import { cn } from '@/utils'

interface ThemeSelectorProps {
  variant?: 'compact' | 'expanded' | 'modal'
  showCustomization?: boolean
  className?: string
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  variant = 'compact',
  showCustomization = true,
  className
}) => {
  const [currentTheme, setCurrentTheme] = useState<Theme | undefined>()
  const [themes, setThemes] = useState<Theme[]>([])
  const [mode, setMode] = useState<ThemeMode>('system')
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'built-in' | 'custom'>('built-in')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadThemeData()

    const handleThemeChange = () => {
      loadThemeData()
    }

    themeService.addEventListener('theme_changed', handleThemeChange)
    themeService.addEventListener('mode_changed', handleThemeChange)
    themeService.addEventListener('theme_created', handleThemeChange)
    themeService.addEventListener('theme_deleted', handleThemeChange)

    return () => {
      themeService.removeEventListener('theme_changed', handleThemeChange)
      themeService.removeEventListener('mode_changed', handleThemeChange)
      themeService.removeEventListener('theme_created', handleThemeChange)
      themeService.removeEventListener('theme_deleted', handleThemeChange)
    }
  }, [])

  const loadThemeData = () => {
    setCurrentTheme(themeService.getCurrentTheme())
    setThemes(themeService.getThemes())
    setMode(themeService.getSettings().mode)
  }

  const handleModeChange = (newMode: ThemeMode) => {
    themeService.setMode(newMode)
  }

  const handleThemeSelect = (themeId: string) => {
    themeService.setTheme(themeId)
  }

  const handleDeleteTheme = (themeId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (confirm('确定要删除这个自定义主题吗？')) {
      themeService.deleteCustomTheme(themeId)
    }
  }

  const ModeButton: React.FC<{
    mode: ThemeMode
    icon: React.ReactNode
    label: string
    isActive: boolean
  }> = ({ mode: buttonMode, icon, label, isActive }) => (
    <button
      onClick={() => handleModeChange(buttonMode)}
      className={cn(
        'flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 min-w-0',
        isActive
          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
      )}
    >
      {icon}
      <span className="text-xs sm:text-sm font-medium">{label}</span>
    </button>
  )

  const ThemeCard: React.FC<{ theme: Theme }> = ({ theme }) => {
    const isSelected = currentTheme?.id === theme.id

    return (
      <motion.div
        layout
        whileHover={{ y: -2 }}
        className={cn(
          'relative p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all duration-200 group',
          isSelected
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
        )}
        onClick={() => handleThemeSelect(theme.id)}
      >
        {/* 选中标识 */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
            <CheckIcon className="w-4 h-4 text-white" />
          </div>
        )}

        {/* 删除按钮（仅自定义主题） */}
        {theme.isCustom && (
          <button
            onClick={(e) => handleDeleteTheme(theme.id, e)}
            className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
          >
            <TrashIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
          </button>
        )}

        {/* 主题预览 */}
        <div className="mb-3">
          <div className="flex gap-1 mb-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: theme.colors.primary[500] }}
            />
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: theme.colors.accent[500] }}
            />
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: theme.colors.gray[400] }}
            />
          </div>
          <div
            className="h-8 rounded-md mb-2"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary[500]}, ${theme.colors.accent[500]})`
            }}
          />
        </div>

        {/* 主题信息 */}
        <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
          {theme.name}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
          {theme.description}
        </p>

        {/* 标签 */}
        <div className="flex gap-1 flex-wrap">
          <Badge variant={theme.isDark ? 'secondary' : 'outline'} className="text-xs px-1.5 py-0.5">
            {theme.isDark ? '深色' : '浅色'}
          </Badge>
          {theme.isCustom && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5">
              自定义
            </Badge>
          )}
          {theme.author && (
            <Badge variant="outline" className="text-xs px-1.5 py-0.5 hidden sm:inline-flex">
              {theme.author}
            </Badge>
          )}
        </div>
      </motion.div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {/* 模式切换 */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => handleModeChange('light')}
            className={cn(
              'p-2 rounded-md transition-colors',
              mode === 'light' || (mode === 'system' && !themeService.isDark())
                ? 'bg-white dark:bg-gray-700 shadow-sm'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
            title="浅色模式"
          >
            <SunIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleModeChange('system')}
            className={cn(
              'p-2 rounded-md transition-colors',
              mode === 'system'
                ? 'bg-white dark:bg-gray-700 shadow-sm'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
            title="跟随系统"
          >
            <ComputerDesktopIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleModeChange('dark')}
            className={cn(
              'p-2 rounded-md transition-colors',
              mode === 'dark' || (mode === 'system' && themeService.isDark())
                ? 'bg-white dark:bg-gray-700 shadow-sm'
                : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
            title="深色模式"
          >
            <MoonIcon className="w-4 h-4" />
          </button>
        </div>

        {showCustomization && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2"
          >
            <SwatchIcon className="w-4 h-4" />
            主题
          </Button>
        )}

        {/* 主题选择模态框 */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-900 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                      主题设置
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowModal(false)}
                      className="h-8 w-8 p-0"
                    >
                      ✕
                    </Button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)] sm:max-h-[calc(80vh-120px)]">
                  {/* 模式选择 */}
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 sm:mb-3">
                      外观模式
                    </h3>
                    <div className="flex gap-1 sm:gap-2 flex-wrap">
                      <ModeButton
                        mode="light"
                        icon={<SunIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        label="浅色"
                        isActive={mode === 'light'}
                      />
                      <ModeButton
                        mode="system"
                        icon={<ComputerDesktopIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        label="跟随系统"
                        isActive={mode === 'system'}
                      />
                      <ModeButton
                        mode="dark"
                        icon={<MoonIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        label="深色"
                        isActive={mode === 'dark'}
                      />
                    </div>
                  </div>

                  {/* 主题选择 */}
                  <div>
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100">
                        主题配色
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                      >
                        <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">创建主题</span>
                        <span className="sm:hidden">创建</span>
                      </Button>
                    </div>

                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mb-4">
                      <Tab value="built-in">内置主题</Tab>
                      <Tab value="custom">自定义主题</Tab>
                    </Tabs>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {themes
                        .filter(theme => activeTab === 'built-in' ? !theme.isCustom : theme.isCustom)
                        .map(theme => (
                          <ThemeCard key={theme.id} theme={theme} />
                        ))}
                    </div>

                    {activeTab === 'custom' && themes.filter(t => t.isCustom).length === 0 && (
                      <div className="text-center py-8">
                        <SwatchIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-400">
                          还没有自定义主题，点击上方按钮创建一个吧！
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // 展开版本的实现...
  return (
    <div className={cn('space-y-6', className)}>
      {/* 模式选择 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
          外观模式
        </h3>
        <div className="flex gap-2">
          <ModeButton
            mode="light"
            icon={<SunIcon className="w-4 h-4" />}
            label="浅色"
            isActive={mode === 'light'}
          />
          <ModeButton
            mode="system"
            icon={<ComputerDesktopIcon className="w-4 h-4" />}
            label="跟随系统"
            isActive={mode === 'system'}
          />
          <ModeButton
            mode="dark"
            icon={<MoonIcon className="w-4 h-4" />}
            label="深色"
            isActive={mode === 'dark'}
          />
        </div>
      </div>

      {/* 主题选择 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            主题配色
          </h3>
          {showCustomization && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              创建主题
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="mb-4">
          <Tab value="built-in">内置主题</Tab>
          <Tab value="custom">自定义主题</Tab>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes
            .filter(theme => activeTab === 'built-in' ? !theme.isCustom : theme.isCustom)
            .map(theme => (
              <ThemeCard key={theme.id} theme={theme} />
            ))}
        </div>

        {activeTab === 'custom' && themes.filter(t => t.isCustom).length === 0 && (
          <div className="text-center py-8">
            <SwatchIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              还没有自定义主题，点击上方按钮创建一个吧！
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ThemeSelector
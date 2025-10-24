import React, { useState, useEffect } from 'react'
import {
  GlobeAltIcon,
  SwatchIcon,
  SpeakerWaveIcon,
  ChartBarIcon,
  SparklesIcon,
  Cog6ToothIcon,
  EyeIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/react/24/outline'
import { Button, Badge, Slider, Switch } from './ui'
import LanguageSelector from './LanguageSelector'
import ThemeSelector from './ThemeSelector'
import i18nService, { t } from '@/services/i18nService'
import themeService from '@/services/themeService'
import { VoiceService } from '@/services/voiceService'
import analyticsService from '@/services/analyticsService'
import templateService from '@/services/templateService'
import { toast } from 'react-hot-toast'

interface AdvancedSettingsPanelProps {
  className?: string
}

const AdvancedSettingsPanel: React.FC<AdvancedSettingsPanelProps> = ({
  className
}) => {
  const [activeSection, setActiveSection] = useState<string>('appearance')
  const [i18nSettings, setI18nSettings] = useState(i18nService.getSettings())
  const [themeSettings, setThemeSettings] = useState(themeService.getSettings())
  const [voiceSettings, setVoiceSettings] = useState(VoiceService.getInstance().getSettings())
  const [analyticsSettings, setAnalyticsSettings] = useState(analyticsService.getSettings())
  const [templateSettings, setTemplateSettings] = useState(templateService.getSettings())

  useEffect(() => {
    // 监听设置变化
    const handleI18nChange = () => setI18nSettings(i18nService.getSettings())
    const handleThemeChange = () => setThemeSettings(themeService.getSettings())
    const handleVoiceChange = () => setVoiceSettings(VoiceService.getInstance().getSettings())
    const handleAnalyticsChange = () => setAnalyticsSettings(analyticsService.getSettings())
    const handleTemplateChange = () => setTemplateSettings(templateService.getSettings())

    i18nService.addEventListener('settings_updated', handleI18nChange)
    themeService.addEventListener('settings_updated', handleThemeChange)
    VoiceService.getInstance().addEventListener('settings_updated', handleVoiceChange)
    analyticsService.addEventListener('settings_updated', handleAnalyticsChange)
    templateService.addEventListener('settings_updated', handleTemplateChange)

    return () => {
      i18nService.removeEventListener('settings_updated', handleI18nChange)
      themeService.removeEventListener('settings_updated', handleThemeChange)
      VoiceService.getInstance().removeEventListener('settings_updated', handleVoiceChange)
      analyticsService.removeEventListener('settings_updated', handleAnalyticsChange)
      templateService.removeEventListener('settings_updated', handleTemplateChange)
    }
  }, [])

  const sections = [
    {
      id: 'appearance',
      title: t('settings.appearance'),
      icon: <SwatchIcon className="w-5 h-5" />,
      description: '主题、外观和显示设置'
    },
    {
      id: 'language',
      title: t('settings.language'),
      icon: <GlobeAltIcon className="w-5 h-5" />,
      description: '语言、地区和国际化设置'
    },
    {
      id: 'voice',
      title: t('settings.voice'),
      icon: <SpeakerWaveIcon className="w-5 h-5" />,
      description: '语音识别和语音合成设置'
    },
    {
      id: 'templates',
      title: t('navigation.templates'),
      icon: <SparklesIcon className="w-5 h-5" />,
      description: '对话模板和预设管理'
    },
    {
      id: 'analytics',
      title: t('navigation.analytics'),
      icon: <ChartBarIcon className="w-5 h-5" />,
      description: '使用统计和数据分析设置'
    },
    {
      id: 'advanced',
      title: '高级设置',
      icon: <Cog6ToothIcon className="w-5 h-5" />,
      description: '高级功能和实验性特性'
    }
  ]

  const handleExportSettings = () => {
    const settings = {
      i18n: i18nSettings,
      theme: themeSettings,
      voice: voiceSettings,
      analytics: analyticsSettings,
      template: templateSettings,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    }

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-chat-studio-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('设置已导出')
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string)

        if (settings.i18n) i18nService.updateSettings(settings.i18n)
        if (settings.theme) themeService.updateSettings(settings.theme)
        if (settings.voice) VoiceService.getInstance().updateSettings(settings.voice)
        if (settings.analytics) analyticsService.updateSettings(settings.analytics)
        if (settings.template) templateService.updateSettings(settings.template)

        toast.success('设置已导入')
      } catch (error) {
        toast.error('导入失败：文件格式错误')
      }
    }
    reader.readAsText(file)
  }

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          主题设置
        </h3>
        <ThemeSelector variant="expanded" />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">显示设置</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                字体大小
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                调整界面文字大小
              </p>
            </div>
            <select
              value={themeSettings.fontSize}
              onChange={(e) => themeService.updateSettings({ fontSize: e.target.value as any })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="small">小</option>
              <option value="medium">中</option>
              <option value="large">大</option>
              <option value="extra-large">特大</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                动画效果
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                启用界面动画和过渡效果
              </p>
            </div>
            <Switch
              checked={themeSettings.animations}
              onCheckedChange={(checked) => themeService.updateSettings({ animations: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                减少动画
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                为有需要的用户减少动画效果
              </p>
            </div>
            <Switch
              checked={themeSettings.reducedMotion}
              onCheckedChange={(checked) => themeService.updateSettings({ reducedMotion: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                高对比度
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                提高文字和背景的对比度
              </p>
            </div>
            <Switch
              checked={themeSettings.highContrast}
              onCheckedChange={(checked) => themeService.updateSettings({ highContrast: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderLanguageSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          语言设置
        </h3>
        <LanguageSelector variant="inline" />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">地区设置</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                自动检测语言
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                根据浏览器设置自动选择语言
              </p>
            </div>
            <Switch
              checked={i18nSettings.autoDetect}
              onCheckedChange={(checked) => i18nService.updateSettings({ autoDetect: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                日期格式
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                选择日期显示格式
              </p>
            </div>
            <select
              value={i18nSettings.dateFormat}
              onChange={(e) => i18nService.updateSettings({ dateFormat: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="YYYY-MM-DD">2024-01-01</option>
              <option value="DD/MM/YYYY">01/01/2024</option>
              <option value="MM/DD/YYYY">01/01/2024</option>
              <option value="relative">相对时间</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                货币
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                选择货币显示格式
              </p>
            </div>
            <select
              value={i18nSettings.currency}
              onChange={(e) => i18nService.updateSettings({ currency: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              <option value="CNY">CNY (¥)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderVoiceSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          语音设置
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                自动朗读AI回复
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                AI回复完成后自动开始朗读
              </p>
            </div>
            <Switch
              checked={voiceSettings.autoSpeak}
              onCheckedChange={(checked) => VoiceService.getInstance().updateSettings({ autoSpeak: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                启用语音输入
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                启用语音识别功能
              </p>
            </div>
            <Switch
              checked={voiceSettings.voiceInput}
              onCheckedChange={(checked) => VoiceService.getInstance().updateSettings({ voiceInput: checked })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              语速: {voiceSettings.rate.toFixed(1)}
            </label>
            <Slider
              value={[voiceSettings.rate]}
              onValueChange={([value]) => VoiceService.getInstance().updateSettings({ rate: value })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              音调: {voiceSettings.pitch.toFixed(1)}
            </label>
            <Slider
              value={[voiceSettings.pitch]}
              onValueChange={([value]) => VoiceService.getInstance().updateSettings({ pitch: value })}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              音量: {Math.round(voiceSettings.volume * 100)}%
            </label>
            <Slider
              value={[voiceSettings.volume]}
              onValueChange={([value]) => VoiceService.getInstance().updateSettings({ volume: value })}
              min={0.0}
              max={1.0}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderTemplateSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          模板设置
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                启用快速访问
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                在对话界面显示模板快捷按钮
              </p>
            </div>
            <Switch
              checked={templateSettings.enableQuickAccess}
              onCheckedChange={(checked) => templateService.updateSettings({ enableQuickAccess: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                侧边栏显示
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                在侧边栏显示常用模板
              </p>
            </div>
            <Switch
              checked={templateSettings.showInSidebar}
              onCheckedChange={(checked) => templateService.updateSettings({ showInSidebar: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                自动应用模型
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                使用模板时自动切换到推荐模型
              </p>
            </div>
            <Switch
              checked={templateSettings.autoApplyModel}
              onCheckedChange={(checked) => templateService.updateSettings({ autoApplyModel: checked })}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">统计信息</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-primary-600">
              {templateService.getAllTemplates().length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              总模板数
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-primary-600">
              {templateService.getFavoriteTemplates().length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              收藏模板
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAnalyticsSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          数据收集
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                启用数据跟踪
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                收集使用统计以改善体验
              </p>
            </div>
            <Switch
              checked={analyticsSettings.enableTracking}
              onCheckedChange={(checked) => analyticsService.updateSettings({ enableTracking: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                详细指标
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                收集详细的性能和使用指标
              </p>
            </div>
            <Switch
              checked={analyticsSettings.trackDetailedMetrics}
              onCheckedChange={(checked) => analyticsService.updateSettings({ trackDetailedMetrics: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                数据匿名化
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                匿名化所有收集的数据
              </p>
            </div>
            <Switch
              checked={analyticsSettings.anonymizeData}
              onCheckedChange={(checked) => analyticsService.updateSettings({ anonymizeData: checked })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              数据保留天数: {analyticsSettings.retentionDays}
            </label>
            <Slider
              value={[analyticsSettings.retentionDays]}
              onValueChange={([value]) => analyticsService.updateSettings({ retentionDays: value })}
              min={7}
              max={365}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">数据管理</h4>
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => analyticsService.exportData('json')}
            className="w-full justify-start"
          >
            导出分析数据
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm('确定要清除所有分析数据吗？此操作无法撤销。')) {
                analyticsService.clearData()
                toast.success('数据已清除')
              }
            }}
            className="w-full justify-start text-red-600 hover:text-red-700"
          >
            清除所有数据
          </Button>
        </div>
      </div>
    </div>
  )

  const renderAdvancedSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          高级选项
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              自定义CSS
            </label>
            <textarea
              value={themeSettings.customCSS}
              onChange={(e) => themeService.updateSettings({ customCSS: e.target.value })}
              placeholder="输入自定义CSS代码..."
              className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-mono text-sm"
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">设置管理</h4>
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={handleExportSettings}
                className="w-full justify-start"
              >
                导出所有设置
              </Button>
              <div>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportSettings}
                  className="hidden"
                  id="import-settings"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('import-settings')?.click()}
                  className="w-full justify-start"
                >
                  导入设置文件
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('确定要重置所有设置吗？此操作无法撤销。')) {
                    themeService.reset()
                    toast.success('设置已重置')
                  }
                }}
                className="w-full justify-start text-red-600 hover:text-red-700"
              >
                重置所有设置
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'appearance':
        return renderAppearanceSettings()
      case 'language':
        return renderLanguageSettings()
      case 'voice':
        return renderVoiceSettings()
      case 'templates':
        return renderTemplateSettings()
      case 'analytics':
        return renderAnalyticsSettings()
      case 'advanced':
        return renderAdvancedSettings()
      default:
        return null
    }
  }

  return (
    <div className={`flex h-full ${className}`}>
      {/* 侧边栏 */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          设置
        </h2>
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                activeSection === section.id
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {section.icon}
              <div className="flex-1 min-w-0">
                <div className="font-medium">{section.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {section.description}
                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 p-6 overflow-y-auto">
        {renderSectionContent()}
      </div>
    </div>
  )
}

export default AdvancedSettingsPanel
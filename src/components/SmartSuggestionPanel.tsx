import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/store'
import {
  SmartSuggestion,
  QuickAction,
  SmartSuggestionService,
  SuggestionContext
} from '@/services/smartSuggestionService'

interface SmartSuggestionPanelProps {
  isOpen: boolean
  onClose: () => void
  onSuggestionSelect: (suggestion: SmartSuggestion) => void
}

const SmartSuggestionPanel: React.FC<SmartSuggestionPanelProps> = ({
  isOpen,
  onClose,
  onSuggestionSelect
}) => {
  const { currentConversationId, conversations, user } = useAppStore()
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [quickActions, setQuickActions] = useState<QuickAction[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'suggestions' | 'actions' | 'settings'>('suggestions')
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null)
  const [preferences, setPreferences] = useState<any>({})

  const suggestionService = SmartSuggestionService.getInstance()

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && activeTab === 'suggestions') {
      generateSuggestions()
    }
  }, [currentConversationId, activeTab])

  const loadData = async () => {
    try {
      await suggestionService.initialize()
      const actions = suggestionService.getQuickActions()
      const prefs = suggestionService.getPreferences()

      setQuickActions(actions)
      setPreferences(prefs)
    } catch (error) {
      console.error('Load suggestion data error:', error)
    }
  }

  const generateSuggestions = async () => {
    if (!preferences.enableSmartSuggestions) {
      return
    }

    setLoading(true)
    try {
      const context = buildSuggestionContext()
      const newSuggestions = await suggestionService.generateSuggestions(context)
      setSuggestions(newSuggestions)
    } catch (error) {
      console.error('Generate suggestions error:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildSuggestionContext = (): SuggestionContext => {
    const currentConversation = conversations.find(c => c.id === currentConversationId)

    return {
      conversationHistory: currentConversation?.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      })) || [],
      currentModel: currentConversation?.model || user?.preferences.defaultModel || 'gpt-4',
      userPreferences: user?.preferences || {},
      conversationLength: currentConversation?.messages.length || 0,
      lastActivityTime: currentConversation?.updatedAt || Date.now()
    }
  }

  const handleSuggestionClick = async (suggestion: SmartSuggestion) => {
    try {
      await suggestionService.useSuggestion(suggestion.id)
      onSuggestionSelect(suggestion)
      onClose()
    } catch (error) {
      console.error('Use suggestion error:', error)
    }
  }

  const handleActionClick = async (action: QuickAction) => {
    try {
      const result = await suggestionService.executeQuickAction(action.id)
      if (result) {
        // 可以显示成功提示
      }
    } catch (error) {
      console.error('Execute action error:', error)
    }
  }

  const updatePreference = async (key: string, value: any) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    await suggestionService.updatePreferences(newPreferences)

    if (key === 'enableSmartSuggestions' && value) {
      generateSuggestions()
    }
  }

  const renderSuggestionItem = (suggestion: SmartSuggestion) => {
    const isExpanded = expandedSuggestion === suggestion.id
    const confidenceColor = suggestion.confidence >= 0.8 ? 'text-green-600' :
                           suggestion.confidence >= 0.6 ? 'text-orange-600' : 'text-red-600'

    return (
      <motion.div
        key={suggestion.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow ${
          suggestion.metadata?.priority === 'high' ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' : ''
        }`}
        onClick={() => handleSuggestionClick(suggestion)}
        onDoubleClick={() => setExpandedSuggestion(isExpanded ? null : suggestion.id)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start flex-1">
            <span className="text-2xl mr-3 mt-1">{suggestion.icon}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                {suggestion.title}
              </h4>
              <p className={`text-sm text-gray-600 dark:text-gray-300 ${isExpanded ? '' : 'line-clamp-1'}`}>
                {suggestion.description}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`text-xs font-medium ${confidenceColor} bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full mb-1`}>
              {Math.round(suggestion.confidence * 100)}%
            </span>
            <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {suggestion.type}
            </span>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
            >
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {suggestion.content}
              </p>
              {suggestion.metadata?.tags && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {suggestion.metadata.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500">
                <span>使用次数: {suggestion.usageCount}</span>
                <span>{new Date(suggestion.createdAt).toLocaleString()}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  const renderQuickActionItem = (action: QuickAction) => (
    <motion.div
      key={action.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleActionClick(action)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1">
          <span className="text-2xl mr-3 mt-1">{action.icon}</span>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
              {action.name}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {action.description}
            </p>
          </div>
        </div>
        {action.hotkey && (
          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
            {action.hotkey}
          </span>
        )}
      </div>
      <div className="flex justify-between items-center mt-3">
        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
          {action.category}
        </span>
        <span className="text-xs text-gray-500">
          使用 {action.usageCount} 次
        </span>
      </div>
    </motion.div>
  )

  const renderSuggestionsTab = () => (
    <div className="flex-1 overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-gray-300">正在生成智能建议...</p>
          </div>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <span className="text-6xl mb-4 block">🤖</span>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无智能建议</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {preferences.enableSmartSuggestions
                ? '继续对话，我会为你生成更多建议'
                : '请在设置中启用智能建议功能'
              }
            </p>
            <button
              onClick={generateSuggestions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              刷新建议
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 overflow-y-auto h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">智能建议</h3>
            <button
              onClick={generateSuggestions}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              🔄
            </button>
          </div>
          {suggestions.map(renderSuggestionItem)}
        </div>
      )}
    </div>
  )

  const renderActionsTab = () => (
    <div className="flex-1 overflow-hidden">
      <div className="p-4 overflow-y-auto h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">快捷操作</h3>
        </div>
        {quickActions.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <span className="text-6xl mb-4 block">⚡</span>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">暂无快捷操作</h3>
            </div>
          </div>
        ) : (
          <div>
            {quickActions.map(renderQuickActionItem)}
          </div>
        )}
      </div>
    </div>
  )

  const renderSettingsTab = () => (
    <div className="flex-1 overflow-hidden">
      <div className="p-4 overflow-y-auto h-full">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">智能建议设置</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <label className="text-gray-700 dark:text-gray-300">启用智能建议</label>
            <input
              type="checkbox"
              checked={preferences.enableSmartSuggestions}
              onChange={(e) => updatePreference('enableSmartSuggestions', e.target.checked)}
              className="toggle"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <label className="text-gray-700 dark:text-gray-300">启用快捷操作</label>
            <input
              type="checkbox"
              checked={preferences.enableQuickActions}
              onChange={(e) => updatePreference('enableQuickActions', e.target.checked)}
              className="toggle"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <label className="text-gray-700 dark:text-gray-300">显示时间相关建议</label>
            <input
              type="checkbox"
              checked={preferences.showTimeBasedSuggestions}
              onChange={(e) => updatePreference('showTimeBasedSuggestions', e.target.checked)}
              className="toggle"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <label className="text-gray-700 dark:text-gray-300">显示上下文建议</label>
            <input
              type="checkbox"
              checked={preferences.showContextualSuggestions}
              onChange={(e) => updatePreference('showContextualSuggestions', e.target.checked)}
              className="toggle"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <label className="text-gray-700 dark:text-gray-300">显示后续问题建议</label>
            <input
              type="checkbox"
              checked={preferences.showFollowUpSuggestions}
              onChange={(e) => updatePreference('showFollowUpSuggestions', e.target.checked)}
              className="toggle"
            />
          </div>

          <div className="py-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">建议数量</label>
            <div className="flex gap-2">
              {[3, 5, 8, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => updatePreference('maxSuggestions', num)}
                  className={`px-3 py-1 rounded text-sm ${
                    preferences.maxSuggestions === num
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="py-4">
            <button
              onClick={() => {
                if (confirm('确定要重置所有智能建议设置吗？')) {
                  const defaultPrefs = {
                    enableSmartSuggestions: true,
                    enableQuickActions: true,
                    maxSuggestions: 5,
                    suggestionRefreshInterval: 30000,
                    showTimeBasedSuggestions: true,
                    showContextualSuggestions: true,
                    showFollowUpSuggestions: true
                  }
                  setPreferences(defaultPrefs)
                  suggestionService.updatePreferences(defaultPrefs)
                }
              }}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              重置为默认设置
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">智能助手</h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Tab Bar */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { key: 'suggestions', label: '建议', icon: '💡' },
                { key: 'actions', label: '操作', icon: '⚡' },
                { key: 'settings', label: '设置', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 flex items-center justify-center py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            {activeTab === 'suggestions' && renderSuggestionsTab()}
            {activeTab === 'actions' && renderActionsTab()}
            {activeTab === 'settings' && renderSettingsTab()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SmartSuggestionPanel
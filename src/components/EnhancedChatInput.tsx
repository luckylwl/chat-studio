import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  PaperAirplaneIcon,
  PhotoIcon,
  MicrophoneIcon,
  Cog6ToothIcon,
  LanguageIcon,
  XMarkIcon,
  CommandLineIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'
import { Button, Textarea, Badge } from './ui'
import { useAppStore } from '@/store'
import { createAIService } from '@/services/aiApi'
import { createNetworkService, detectNetworkCommand } from '@/services/networkService'
import QuickPhrases from './QuickPhrases'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils'
import FileUpload from './FileUpload'
import type { UploadedFile } from '@/services/fileService'
import { fileService } from '@/services/fileService'
import ImageUploader from './ImageUploader'
import type { UploadedImage } from './ImageUploader'
import { createVisionService } from '@/services/visionApi'
import AIAssistantPresets from './AIAssistantPresets'
import TranslationTool from './TranslationTool'
import VoiceControl from './VoiceControl'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import analyticsService from '@/services/analyticsService'

// Slash 命令定义
interface SlashCommand {
  command: string
  description: string
  icon: string
  action: (args: string) => void
}

// 自动补全建议
interface AutocompleteSuggestion {
  text: string
  description: string
  type: 'command' | 'phrase' | 'history'
}

const EnhancedChatInput: React.FC = () => {
  const [input, setInput] = useState('')
  const [showModelSelector, setShowModelSelector] = useState(false)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [showVoiceControl, setShowVoiceControl] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autocompleteRef = useRef<HTMLDivElement>(null)

  const modelSelectorRef = useClickOutside<HTMLDivElement>(() => setShowModelSelector(false), showModelSelector)
  const fileUploadRef = useClickOutside<HTMLDivElement>(() => setShowFileUpload(false), showFileUpload)
  const imageUploadRef = useClickOutside<HTMLDivElement>(() => setShowImageUpload(false), showImageUpload)
  const translationRef = useClickOutside<HTMLDivElement>(() => setShowTranslation(false), showTranslation)
  const voiceControlRef = useClickOutside<HTMLDivElement>(() => setShowVoiceControl(false), showVoiceControl)

  useEscapeKey(() => {
    if (showAutocomplete) setShowAutocomplete(false)
    else if (showCommandPalette) setShowCommandPalette(false)
    else if (showModelSelector) setShowModelSelector(false)
    else if (showFileUpload) setShowFileUpload(false)
    else if (showImageUpload) setShowImageUpload(false)
    else if (showTranslation) setShowTranslation(false)
    else if (showVoiceControl) setShowVoiceControl(false)
  }, showAutocomplete || showCommandPalette || showModelSelector || showFileUpload || showImageUpload || showTranslation || showVoiceControl)

  const {
    currentConversationId,
    conversations,
    addMessage,
    updateMessage,
    deleteMessage,
    user,
    apiProviders,
    isLoading,
    setLoading
  } = useAppStore()

  const currentConversation = conversations.find(c => c.id === currentConversationId)

  // Slash 命令
  const slashCommands: SlashCommand[] = [
    {
      command: '/code',
      description: '请求代码生成或解释',
      icon: '💻',
      action: (args) => setInput(`请帮我写代码: ${args}`)
    },
    {
      command: '/translate',
      description: '翻译文本',
      icon: '🌐',
      action: (args) => setInput(`请翻译: ${args}`)
    },
    {
      command: '/explain',
      description: '解释概念或代码',
      icon: '📚',
      action: (args) => setInput(`请解释: ${args}`)
    },
    {
      command: '/summarize',
      description: '总结内容',
      icon: '📝',
      action: (args) => setInput(`请总结: ${args}`)
    },
    {
      command: '/improve',
      description: '改进文本或代码',
      icon: '✨',
      action: (args) => setInput(`请改进: ${args}`)
    },
    {
      command: '/debug',
      description: '调试代码',
      icon: '🐛',
      action: (args) => setInput(`请帮我调试这段代码: ${args}`)
    },
    {
      command: '/weather',
      description: '查询天气',
      icon: '🌤️',
      action: (args) => setInput(`天气 ${args}`)
    },
    {
      command: '/stock',
      description: '查询股票',
      icon: '📈',
      action: (args) => setInput(`股票 ${args}`)
    },
    {
      command: '/search',
      description: '网络搜索',
      icon: '🔍',
      action: (args) => setInput(`搜索 ${args}`)
    },
    {
      command: '/clear',
      description: '清空输入',
      icon: '🗑️',
      action: () => setInput('')
    }
  ]

  // 检测斜杠命令
  const detectSlashCommand = useCallback((text: string) => {
    if (!text.startsWith('/')) return null
    const spaceIndex = text.indexOf(' ')
    const command = spaceIndex > -1 ? text.substring(0, spaceIndex) : text
    return slashCommands.find(cmd => cmd.command === command)
  }, [])

  // 更新自动补全建议
  const updateAutocompleteSuggestions = useCallback((text: string, position: number) => {
    const suggestions: AutocompleteSuggestion[] = []

    // 检测斜杠命令
    if (text.startsWith('/')) {
      const query = text.toLowerCase()
      slashCommands.forEach(cmd => {
        if (cmd.command.toLowerCase().includes(query.slice(1))) {
          suggestions.push({
            text: cmd.command,
            description: `${cmd.icon} ${cmd.description}`,
            type: 'command'
          })
        }
      })
    }

    // 从历史对话中提取常用短语 (简化版)
    if (text.length >= 2 && !text.startsWith('/')) {
      const recentMessages = currentConversation?.messages
        .filter(m => m.role === 'user')
        .slice(-10)
        .map(m => m.content) || []

      recentMessages.forEach(msg => {
        if (msg.toLowerCase().includes(text.toLowerCase()) && msg !== text) {
          suggestions.push({
            text: msg,
            description: '来自历史记录',
            type: 'history'
          })
        }
      })
    }

    setAutocompleteSuggestions(suggestions.slice(0, 5))
    setShowAutocomplete(suggestions.length > 0)
    setSelectedSuggestionIndex(0)
  }, [currentConversation, slashCommands])

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const newPosition = e.target.selectionStart || 0
    setInput(newValue)
    setCursorPosition(newPosition)
    updateAutocompleteSuggestions(newValue, newPosition)
  }

  // 选择自动补全建议
  const selectSuggestion = (suggestion: AutocompleteSuggestion) => {
    if (suggestion.type === 'command') {
      setInput(suggestion.text + ' ')
    } else {
      setInput(suggestion.text)
    }
    setShowAutocomplete(false)
    textareaRef.current?.focus()
  }

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!input.trim() || !currentConversationId || isLoading) {
      return
    }

    let message = input.trim()
    const model = currentConversation?.model || user?.preferences.defaultModel || 'gpt-4'

    // 检测并执行斜杠命令
    const slashCmd = detectSlashCommand(message)
    if (slashCmd) {
      const args = message.substring(slashCmd.command.length).trim()
      slashCmd.action(args)
      return
    }

    // 包含文件分析结果
    if (uploadedFiles.length > 0) {
      const fileContents = uploadedFiles
        .filter(f => f.status === 'completed')
        .map(f => fileService.formatForAI(f))
        .join('\n\n')

      if (fileContents) {
        message = `${message}\n\n📎 附加文件:\n${fileContents}`
      }
    }

    // Check if we need to use vision API
    const hasImages = uploadedImages.length > 0
    const isVisionModel = model.includes('gpt-4') || model.includes('claude-3')

    setInput('')
    setUploadedFiles([])
    const imagesToSend = [...uploadedImages]
    setUploadedImages([])

    addMessage(currentConversationId, {
      content: message,
      role: 'user'
    })

    analyticsService.trackMessageSent(
      currentConversationId,
      'user',
      message.length,
      model
    )

    setLoading(true)

    // 检查网络命令
    const networkCommand = detectNetworkCommand(message)
    if (networkCommand.type && user?.preferences) {
      try {
        const networkService = createNetworkService(user.preferences)
        let networkResponse = ''

        switch (networkCommand.type) {
          case 'weather':
            if (user.preferences.enableWeather) {
              const weather = await networkService.getWeather(networkCommand.query)
              networkResponse = `📍 ${weather.location}\n🌡️ 温度: ${weather.temperature}°C\n☁️ 天气: ${weather.condition}\n💧 湿度: ${weather.humidity}%\n🌬️ 风速: ${weather.windSpeed}km/h\n\n📅 未来5天预报:\n${weather.forecast.map(day => `${day.date}: ${day.condition} ${day.low}°C - ${day.high}°C`).join('\n')}`
            } else {
              networkResponse = '⚠️ 天气查询功能未启用'
            }
            break

          case 'stock':
            if (user.preferences.enableStock) {
              const stock = await networkService.getStock(networkCommand.query)
              networkResponse = `📈 ${stock.symbol} - ${stock.name}\n💰 价格: $${stock.price}\n📊 涨跌: ${stock.change > 0 ? '+' : ''}${stock.change} (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent}%)`
            } else {
              networkResponse = '⚠️ 股票查询功能未启用'
            }
            break

          case 'news':
            if (user.preferences.enableNews) {
              const news = await networkService.getNews(networkCommand.query, 5)
              networkResponse = `📰 最新新闻${networkCommand.query ? ` - ${networkCommand.query}` : ''}:\n\n${news.map((item, i) => `${i + 1}. **${item.title}**\n📝 ${item.summary}\n🔗 ${item.url}\n`).join('\n')}`
            } else {
              networkResponse = '⚠️ 新闻查询功能未启用'
            }
            break

          case 'search':
            if (user.preferences.enableWebSearch) {
              const results = await networkService.search(networkCommand.query)
              networkResponse = `🔍 搜索结果 - "${networkCommand.query}":\n\n${results.map((result, i) => `${i + 1}. **${result.title}**\n📝 ${result.snippet}\n🔗 ${result.url}\n`).join('\n')}`
            } else {
              networkResponse = '⚠️ 网络搜索功能未启用'
            }
            break
        }

        addMessage(currentConversationId, {
          content: networkResponse,
          role: 'assistant',
          model: 'network-service'
        })

        setLoading(false)
        return
      } catch (error: any) {
        console.error('Network service error:', error)
        addMessage(currentConversationId, {
          content: `❌ 网络服务请求失败: ${error.message}`,
          role: 'assistant',
          model: 'network-service'
        })
        setLoading(false)
        return
      }
    }

    try {
      const provider = apiProviders.find(p =>
        p.isEnabled && p.models.some(m => m.id === model)
      )

      if (!provider) {
        toast.error('找不到对应的API提供商')
        setLoading(false)
        return
      }

      if (!provider.apiKey || provider.apiKey.trim() === '') {
        toast.error(`请为 ${provider.name} 配置API密钥`)
        setLoading(false)
        return
      }

      const conversation = conversations.find(c => c.id === currentConversationId)

      if (!conversation) {
        throw new Error('Conversation not found')
      }

      const tempMessageId = addMessage(currentConversationId, {
        content: '',
        role: 'assistant',
        model: model,
        isStreaming: true
      })

      try {
        let fullResponse = ''
        let response

        // Use Vision API if images are present and model supports it
        if (hasImages && isVisionModel) {
          const visionService = createVisionService(provider)

          response = await visionService.sendMessageWithImages(
            conversation.messages,
            imagesToSend,
            {
              model: model,
              temperature: user?.preferences.temperature || 0.7,
              maxTokens: user?.preferences.maxTokens || 4096,
              systemPrompt: user?.preferences.systemPrompt,
              stream: true
            },
            (chunk) => {
              fullResponse += chunk
              updateMessage(currentConversationId, tempMessageId, {
                content: fullResponse,
                isStreaming: true
              })
            }
          )
        } else {
          // Use regular AI service for text-only messages
          const aiService = createAIService(provider)

          response = await aiService.sendMessage(
            conversation.messages,
            {
              model: model,
              temperature: user?.preferences.temperature || 0.7,
              maxTokens: user?.preferences.maxTokens || 2048,
              systemPrompt: user?.preferences.systemPrompt,
              stream: true
            },
            (chunk) => {
              fullResponse += chunk
              updateMessage(currentConversationId, tempMessageId, {
                content: fullResponse,
                isStreaming: true
              })
            }
          )
        }

        updateMessage(currentConversationId, tempMessageId, {
          content: response.content,
          isStreaming: false,
          tokens: response.tokens
        })

      } catch (error: any) {
        console.error('Failed to send message:', error)
        toast.error(`发送消息失败: ${error.message}`)

        if (tempMessageId) {
          deleteMessage(currentConversationId, tempMessageId)
        }
      }

    } catch (outerError: any) {
      console.error('Outer error:', outerError)
      toast.error('发送消息时发生未知错误')
    } finally {
      setLoading(false)
    }
  }, [input, currentConversationId, isLoading, addMessage, updateMessage, deleteMessage, setLoading, currentConversation, user, apiProviders, conversations, uploadedFiles, uploadedImages, detectSlashCommand])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 自动补全导航
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev =>
          Math.min(prev + 1, autocompleteSuggestions.length - 1)
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Tab' || (e.key === 'Enter' && showAutocomplete)) {
        e.preventDefault()
        if (autocompleteSuggestions[selectedSuggestionIndex]) {
          selectSuggestion(autocompleteSuggestions[selectedSuggestionIndex])
        }
        return
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowAutocomplete(false)
        return
      }
    }

    // 发送消息
    if (e.key === 'Enter' && !e.shiftKey && !showAutocomplete) {
      e.preventDefault()
      handleSubmit()
    }

    // Ctrl/Cmd + K: 打开命令面板
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      setShowCommandPalette(!showCommandPalette)
    }
  }

  return (
    <div className="relative">
      {/* 命令面板 */}
      {showCommandPalette && (
        <div className="absolute bottom-full left-0 right-0 mb-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CommandLineIcon className="w-5 h-5 text-primary-500" />
              <h3 className="font-medium text-gray-900 dark:text-gray-100">命令面板</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommandPalette(false)}
              className="h-8 w-8 p-0"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {slashCommands.map((cmd) => (
              <button
                key={cmd.command}
                onClick={() => {
                  setInput(cmd.command + ' ')
                  setShowCommandPalette(false)
                  textareaRef.current?.focus()
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <span className="text-2xl">{cmd.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {cmd.command}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {cmd.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 自动补全下拉框 */}
      {showAutocomplete && autocompleteSuggestions.length > 0 && (
        <div
          ref={autocompleteRef}
          className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
        >
          {autocompleteSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => selectSuggestion(suggestion)}
              className={cn(
                'w-full flex items-start gap-2 p-3 text-left transition-colors',
                index === selectedSuggestionIndex
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              )}
            >
              <LightBulbIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary-500" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                  {suggestion.text}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {suggestion.description}
                </div>
              </div>
              {index === selectedSuggestionIndex && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">Tab</Badge>
              )}
            </button>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all duration-200 mx-2 sm:mx-0">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1 sm:gap-2">
            <Badge variant="outline" className="text-xs truncate max-w-[120px] sm:max-w-none">
              {currentConversation?.model?.replace(/^gpt-/, 'GPT-') || '请选择模型'}
            </Badge>
            {isLoading && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                <span className="hidden sm:inline">生成中...</span>
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowImageUpload(!showImageUpload)}
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg",
                showImageUpload && "bg-purple-100 dark:bg-purple-900/30 text-purple-600"
              )}
              title="图片上传 (Vision)"
            >
              <PhotoIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFileUpload(!showFileUpload)}
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg",
                showFileUpload && "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
              )}
              title="文件上传"
            >
              <PhotoIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranslation(!showTranslation)}
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg",
                showTranslation && "bg-green-100 dark:bg-green-900/30 text-green-600"
              )}
              title="翻译工具"
            >
              <LanguageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVoiceControl(!showVoiceControl)}
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg",
                showVoiceControl && "bg-red-100 dark:bg-red-900/30 text-red-600"
              )}
              title="语音控制"
            >
              <MicrophoneIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCommandPalette(!showCommandPalette)}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg"
              title="命令面板 (Ctrl+K)"
            >
              <CommandLineIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg"
              title="模型设置"
            >
              <Cog6ToothIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {/* 图片上传面板 */}
        {showImageUpload && (
          <div ref={imageUploadRef} className="px-2 sm:px-3 py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700">
            <ImageUploader onImagesChange={setUploadedImages} maxImages={5} maxSizeInMB={10} />
            {uploadedImages.length > 0 && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                💡 已上传 {uploadedImages.length} 张图片，使用 GPT-4V 或 Claude 3 模型可以识别图片内容
              </div>
            )}
          </div>
        )}

        {/* 文件上传面板 */}
        {showFileUpload && (
          <div ref={fileUploadRef} className="px-2 sm:px-3 py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700">
            <FileUpload onFilesAnalyzed={setUploadedFiles} maxFiles={5} />
          </div>
        )}

        {/* 翻译工具面板 */}
        {showTranslation && (
          <div ref={translationRef} className="px-2 sm:px-3 py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700">
            <TranslationTool
              onTranslate={(sourceText, fromLang, toLang, result) => {
                const translationText = `🌐 ${fromLang} → ${toLang}: ${result}`
                setInput(prev => prev + (prev ? '\n\n' : '') + translationText)
                textareaRef.current?.focus()
              }}
            />
          </div>
        )}

        {/* 语音控制面板 */}
        {showVoiceControl && (
          <div ref={voiceControlRef} className="px-2 sm:px-3 py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700">
            <VoiceControl
              onTranscript={(text) => {
                setInput(prev => prev + (prev ? ' ' : '') + text)
                textareaRef.current?.focus()
              }}
              onVoiceCommand={(command) => {
                if (command === '发送消息' && input.trim()) handleSubmit()
                else if (command === '清空输入') setInput('')
              }}
            />
          </div>
        )}

        {/* 快捷短语和AI助手 */}
        <div className="px-2 sm:px-3 py-1.5 sm:py-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-1 sm:gap-2">
          <QuickPhrases
            onInsert={(text) => {
              setInput(prev => prev + (prev ? '\n\n' : '') + text)
              textareaRef.current?.focus()
            }}
          />
          <AIAssistantPresets
            onSelect={(assistant) => {
              const prompt = `请以"${assistant.name}"的身份回答：`
              setInput(prev => prev ? `${prev}\n\n${prompt}` : prompt)
              textareaRef.current?.focus()
            }}
          />
        </div>

        {/* 输入框 */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="输入消息... (试试 / 命令，Ctrl+K 打开命令面板)"
            className="border-0 focus-visible:ring-0 resize-none min-h-[50px] sm:min-h-[60px] max-h-[150px] sm:max-h-[200px] rounded-none px-2 sm:px-3 py-2 sm:py-3 text-sm sm:text-base"
            autoResize
            disabled={isLoading}
          />

          {/* 发送按钮 */}
          <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3">
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              size="sm"
              className={cn(
                "h-8 w-8 sm:h-9 sm:w-9 p-0 transition-all duration-200 rounded-lg shadow-lg",
                input.trim() && !isLoading
                  ? "opacity-100 scale-100 bg-primary-500 hover:bg-primary-600"
                  : "opacity-50 scale-90"
              )}
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <PaperAirplaneIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0 truncate">
              <span className="hidden sm:inline">💡 试试斜杠命令: /code, /translate, /explain</span>
              <span className="sm:hidden">💡 / 命令</span>
              {uploadedImages.length > 0 && (
                <span className="text-purple-600 dark:text-purple-400">🖼️ {uploadedImages.length}</span>
              )}
              {uploadedFiles.length > 0 && (
                <span className="text-blue-600 dark:text-blue-400">📎 {uploadedFiles.length}</span>
              )}
            </div>
            <span className="flex-shrink-0">{input.length}/4000</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedChatInput
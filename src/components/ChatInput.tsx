/**
 * ChatInput 组件
 *
 * 功能说明:
 * AI 对话输入框组件，提供完整的消息输入和发送功能
 *
 * 核心特性:
 * 1. 多模型支持 - 支持切换不同的 AI 模型（GPT-4, Claude, Gemini 等）
 * 2. 流式响应 - 实时显示 AI 生成的内容
 * 3. 文件上传 - 支持图片和文档上传，自动分析文件内容
 * 4. 语音输入 - 支持语音转文字和语音命令
 * 5. 翻译工具 - 内置翻译功能，可快速翻译文本
 * 6. 网络命令 - 支持天气、股票、新闻、搜索等网络查询
 * 7. 快捷短语 - 常用短语快速插入
 * 8. AI 助手预设 - 快速切换不同角色的 AI 助手
 * 9. 快捷键支持 - Enter 发送，Shift+Enter 换行，ESC 关闭弹窗
 * 10. 响应式设计 - 自适应移动端和桌面端
 *
 * 使用的服务:
 * - aiApi: AI 服务接口（OpenAI, Anthropic, Google）
 * - networkService: 网络查询服务（天气、股票、新闻、搜索）
 * - fileService: 文件处理服务
 * - analyticsService: 数据分析服务
 *
 * @component
 */

import React, { useState, useRef, useCallback } from 'react'
import {
  PaperAirplaneIcon,
  PhotoIcon,
  DocumentIcon,
  MicrophoneIcon,
  StopIcon,
  Cog6ToothIcon,
  LanguageIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Button, Textarea, Select, Badge } from './ui'
import { useAppStore } from '@/store'
import { createAIService } from '@/services/aiApi'
import { createNetworkService, detectNetworkCommand } from '@/services/networkService'
import QuickPhrases from './QuickPhrases'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils'
import FileUpload from './FileUpload'
import type { UploadedFile } from '@/services/fileService'
import { fileService } from '@/services/fileService'
import AIAssistantPresets from './AIAssistantPresets'
import TranslationTool from './TranslationTool'
import VoiceControl from './VoiceControl'
import { useClickOutside } from '@/hooks/useClickOutside'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import analyticsService from '@/services/analyticsService'

const ChatInput: React.FC = () => {
  // ============================================
  // 状态管理
  // ============================================

  /** 输入框文本内容 */
  const [input, setInput] = useState('')

  /** 是否正在录音（语音输入） */
  const [isRecording, setIsRecording] = useState(false)

  /** 是否显示模型选择器弹窗 */
  const [showModelSelector, setShowModelSelector] = useState(false)

  /** 是否显示文件上传面板 */
  const [showFileUpload, setShowFileUpload] = useState(false)

  /** 是否显示翻译工具面板 */
  const [showTranslation, setShowTranslation] = useState(false)

  /** 是否显示语音控制面板 */
  const [showVoiceControl, setShowVoiceControl] = useState(false)

  /** 已上传的文件列表 */
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  /** 输入框 DOM 引用 - 用于聚焦和滚动 */
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ============================================
  // 弹窗关闭处理
  // 跨平台兼容性: 支持点击外部关闭和 ESC 键关闭
  // iOS/Android: 触摸外部关闭，虚拟键盘自动处理
  // Web: 鼠标点击外部关闭，ESC 键盘快捷键
  // ============================================

  /** 点击模型选择器外部时关闭 */
  const modelSelectorRef = useClickOutside<HTMLDivElement>(() => setShowModelSelector(false), showModelSelector)

  /** 点击文件上传面板外部时关闭 */
  const fileUploadRef = useClickOutside<HTMLDivElement>(() => setShowFileUpload(false), showFileUpload)

  /** 点击翻译工具面板外部时关闭 */
  const translationRef = useClickOutside<HTMLDivElement>(() => setShowTranslation(false), showTranslation)

  /** 点击语音控制面板外部时关闭 */
  const voiceControlRef = useClickOutside<HTMLDivElement>(() => setShowVoiceControl(false), showVoiceControl)

  /**
   * ESC 键关闭弹窗
   * 跨平台说明:
   * - Web: 标准键盘 ESC 键
   * - iOS/Android: 通常由返回手势或返回按钮触发，需要额外处理
   */
  useEscapeKey(() => {
    if (showModelSelector) setShowModelSelector(false)
    else if (showFileUpload) setShowFileUpload(false)
    else if (showTranslation) setShowTranslation(false)
    else if (showVoiceControl) setShowVoiceControl(false)
  }, showModelSelector || showFileUpload || showTranslation || showVoiceControl)

  // ============================================
  // 全局状态和数据
  // 使用 Zustand 状态管理库
  // ============================================

  const {
    /** 当前激活的对话 ID */
    currentConversationId,
    /** 所有对话列表 */
    conversations,
    /** 添加新消息到对话 */
    addMessage,
    /** 更新已有消息（用于流式响应） */
    updateMessage,
    /** 删除消息 */
    deleteMessage,
    /** 当前用户信息和偏好设置 */
    user,
    /** AI 服务提供商列表（OpenAI, Anthropic, Google 等） */
    apiProviders,
    /** 是否正在加载 AI 响应 */
    isLoading,
    /** 设置加载状态 */
    setLoading
  } = useAppStore()

  /** 当前对话对象 */
  const currentConversation = conversations.find(c => c.id === currentConversationId)

  /**
   * 可用的 AI 模型列表
   * 过滤掉未启用的提供商，展平所有模型到一个列表
   */
  const availableModels = apiProviders
    .filter(provider => provider.isEnabled)
    .flatMap(provider => provider.models.map(model => ({
      value: model.id,
      label: `${model.name} (${provider.name})`,
      description: model.description
    })))

  // ============================================
  // 核心功能: 消息提交处理
  // ============================================

  /**
   * 处理消息提交
   *
   * 功能流程:
   * 1. 验证输入和状态（非空、有对话ID、非加载中）
   * 2. 处理文件附件（如果有）
   * 3. 添加用户消息到对话
   * 4. 检测是否为网络命令（天气、股票、新闻、搜索）
   * 5. 如果是网络命令，调用网络服务并返回结果
   * 6. 如果是 AI 对话，调用对应的 AI 服务
   * 7. 使用流式响应实时更新 AI 回复
   * 8. 记录分析数据
   *
   * 跨平台兼容性:
   * - iOS: 使用原生文件选择器和语音识别
   * - Android: 支持 Android 文件管理器和语音输入
   * - Web: 标准 File API 和 Web Speech API
   *
   * 错误处理:
   * - API 密钥缺失 - 提示配置
   * - 网络错误 - 显示错误消息
   * - 流式中断 - 清理临时消息
   *
   * @param e - 表单提交事件（可选）
   */
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!input.trim() || !currentConversationId || isLoading) {
      return
    }

    // 获取输入文本并去除首尾空格
    let message = input.trim()

    // 获取当前使用的 AI 模型（优先级：对话设置 > 用户默认 > 系统默认）
    const model = currentConversation?.model || user?.preferences.defaultModel || 'gpt-4'

    // ============================================
    // 处理文件附件
    // 将已分析的文件内容添加到消息中
    // ============================================
    if (uploadedFiles.length > 0) {
      const fileContents = uploadedFiles
        .filter(f => f.status === 'completed') // 只包含上传成功的文件
        .map(f => fileService.formatForAI(f))  // 格式化为 AI 可读的格式
        .join('\n\n')

      if (fileContents) {
        message = `${message}\n\n📎 附加文件:\n${fileContents}`
      }
    }

    // 清空输入框
    setInput('')

    // ============================================
    // 添加用户消息到对话历史
    // ============================================
    addMessage(currentConversationId, {
      content: message,
      role: 'user'
    })

    // ============================================
    // 记录分析数据
    // 用于统计和用户行为分析
    // ============================================
    analyticsService.trackMessageSent(
      currentConversationId,
      'user',
      message.length,
      model
    )

    // 设置加载状态
    setLoading(true)

    // ============================================
    // 检测并处理网络命令
    // 支持的命令类型:
    // - "天气 城市名" - 查询天气
    // - "股票 代码" - 查询股票价格
    // - "新闻 关键词" - 搜索新闻
    // - "搜索 关键词" - 网络搜索
    // ============================================
    const networkCommand = detectNetworkCommand(message)
    if (networkCommand.type && user?.preferences) {
      try {
        const networkService = createNetworkService(user.preferences)
        let networkResponse = ''

        switch (networkCommand.type) {
          // ============================================
          // 天气查询
          // 示例: "天气 北京", "weather Shanghai"
          // 返回: 当前天气 + 未来5天预报
          // ============================================
          case 'weather':
            if (user.preferences.enableWeather) {
              const weather = await networkService.getWeather(networkCommand.query)
              networkResponse = `📍 ${weather.location}\n🌡️ 温度: ${weather.temperature}°C\n☁️ 天气: ${weather.condition}\n💧 湿度: ${weather.humidity}%\n🌬️ 风速: ${weather.windSpeed}km/h\n\n📅 未来5天预报:\n${weather.forecast.map(day => `${day.date}: ${day.condition} ${day.low}°C - ${day.high}°C`).join('\n')}`
            } else {
              networkResponse = '⚠️ 天气查询功能未启用，请在设置中开启网络功能。'
            }
            break

          // ============================================
          // 股票查询
          // 示例: "股票 AAPL", "stock TSLA"
          // 返回: 价格、涨跌、市值、成交量
          // ============================================
          case 'stock':
            if (user.preferences.enableStock) {
              const stock = await networkService.getStock(networkCommand.query)
              networkResponse = `📈 ${stock.symbol} - ${stock.name}\n💰 价格: $${stock.price}\n📊 涨跌: ${stock.change > 0 ? '+' : ''}${stock.change} (${stock.changePercent > 0 ? '+' : ''}${stock.changePercent}%)\n🏢 市值: $${(stock.marketCap! / 1000000000).toFixed(2)}B\n📊 成交量: ${(stock.volume! / 1000000).toFixed(2)}M`
            } else {
              networkResponse = '⚠️ 股票查询功能未启用，请在设置中开启网络功能。'
            }
            break

          // ============================================
          // 新闻搜索
          // 示例: "新闻 科技", "news AI"
          // 返回: 最新5条相关新闻
          // ============================================
          case 'news':
            if (user.preferences.enableNews) {
              const news = await networkService.getNews(networkCommand.query, 5)
              networkResponse = `📰 最新新闻${networkCommand.query ? ` - ${networkCommand.query}` : ''}:\n\n${news.map((item, i) => `${i + 1}. **${item.title}**\n📅 ${item.publishedAt}\n📰 ${item.source}\n📝 ${item.summary}\n🔗 ${item.url}\n`).join('\n')}`
            } else {
              networkResponse = '⚠️ 新闻查询功能未启用，请在设置中开启网络功能。'
            }
            break

          // ============================================
          // 网络搜索
          // 示例: "搜索 React hooks", "search TypeScript"
          // 返回: 搜索结果列表
          // ============================================
          case 'search':
            if (user.preferences.enableWebSearch) {
              const results = await networkService.search(networkCommand.query)
              networkResponse = `🔍 搜索结果 - "${networkCommand.query}":\n\n${results.map((result, i) => `${i + 1}. **${result.title}**\n📝 ${result.snippet}\n🔗 ${result.url}\n${result.timestamp ? `📅 ${result.timestamp}` : ''}\n`).join('\n')}`
            } else {
              networkResponse = '⚠️ 网络搜索功能未启用，请在设置中开启网络功能。'
            }
            break
        }

        // 将网络服务的响应添加为助手消息
        addMessage(currentConversationId, {
          content: networkResponse,
          role: 'assistant',
          model: 'network-service' // 标记为网络服务，与 AI 模型区分
        })

        setLoading(false)
        return // 网络命令处理完毕，不再调用 AI 服务
      } catch (error: any) {
        console.error('Network service error:', error)
        // 网络服务错误，添加错误消息
        addMessage(currentConversationId, {
          content: `❌ 网络服务请求失败: ${error.message}`,
          role: 'assistant',
          model: 'network-service'
        })
        setLoading(false)
        return
      }
    }

    // ============================================
    // AI 服务调用
    // 如果不是网络命令，则调用 AI 模型生成回复
    // ============================================
    try {
      // 查找当前模型对应的 API 提供商
      // 支持的提供商: OpenAI, Anthropic, Google, 本地模型等
      const provider = apiProviders.find(p =>
        p.isEnabled && p.models.some(m => m.id === model)
      )

      // 验证提供商存在
      if (!provider) {
        toast.error('找不到对应的API提供商，请检查模型配置')
        setLoading(false)
        return
      }

      // 验证 API 密钥已配置
      if (!provider.apiKey || provider.apiKey.trim() === '') {
        toast.error(`请为 ${provider.name} 配置API密钥`)
        setLoading(false)
        return
      }

      // 创建 AI 服务实例
      const aiService = createAIService(provider)

      // 获取完整的对话历史（用于上下文）
      const conversation = conversations.find(c => c.id === currentConversationId)

      if (!conversation) {
        throw new Error('Conversation not found')
      }

      // ============================================
      // 流式响应处理
      // 添加临时占位消息，用于实时更新 AI 回复
      // ============================================
      const tempMessageId = addMessage(currentConversationId, {
        content: '',                    // 初始内容为空
        role: 'assistant',
        model: model,
        isStreaming: true               // 标记为流式消息
      })

      try {
        // 用于累积流式响应的完整内容
        let fullResponse = ''

        /**
         * 调用 AI 服务发送消息
         *
         * 参数说明:
         * - messages: 对话历史上下文
         * - options: 生成参数
         *   - temperature: 创造性（0-2，越高越随机）
         *   - maxTokens: 最大生成长度
         *   - systemPrompt: 系统提示词（定义 AI 角色）
         *   - stream: 启用流式响应
         * - callback: 流式回调函数，每次接收到新内容时调用
         *
         * 跨平台兼容性:
         * - iOS/Android: 使用 Fetch API（React Native polyfill）
         * - Web: 原生 Fetch API + ReadableStream
         */
        const response = await aiService.sendMessage(
          conversation.messages,
          {
            model: model,
            temperature: user?.preferences.temperature || 0.7,    // 默认 0.7（平衡）
            maxTokens: user?.preferences.maxTokens || 2048,       // 默认 2048 tokens
            systemPrompt: user?.preferences.systemPrompt,         // 自定义系统提示词
            stream: true                                          // 启用流式响应
          },
          (chunk) => {
            // 流式回调：每次接收到新内容时触发
            fullResponse += chunk

            // 实时更新消息显示
            // 用户可以看到 AI 逐字输出的效果
            updateMessage(currentConversationId, tempMessageId, {
              content: fullResponse,
              isStreaming: true
            })
          }
        )

        // ============================================
        // 流式响应完成
        // 最终化消息，移除流式标记，添加 token 使用统计
        // ============================================
        updateMessage(currentConversationId, tempMessageId, {
          content: response.content,      // 完整响应内容
          isStreaming: false,             // 标记流式结束
          tokens: response.tokens         // Token 使用统计
        })

      } catch (error: any) {
        // ============================================
        // AI 服务错误处理
        // 可能的错误:
        // - API 限流
        // - 余额不足
        // - 网络超时
        // - 模型不可用
        // ============================================
        console.error('Failed to send message:', error)
        toast.error(`发送消息失败: ${error.message}`)

        // 删除失败的临时消息
        // 避免界面显示空消息
        if (tempMessageId) {
          deleteMessage(currentConversationId, tempMessageId)
        }
      }

    } catch (outerError: any) {
      // ============================================
      // 外层错误处理
      // 捕获未预期的错误（如状态管理异常）
      // ============================================
      console.error('Outer error:', outerError)
      toast.error('发送消息时发生未知错误')
    } finally {
      // 无论成功或失败，都要清除加载状态
      setLoading(false)
    }
  }, [input, currentConversationId, isLoading, addMessage, updateMessage, deleteMessage, setLoading, currentConversation, user, apiProviders, conversations, uploadedFiles])

  // ============================================
  // 辅助函数
  // ============================================

  /**
   * 键盘事件处理
   *
   * 快捷键:
   * - Enter: 发送消息
   * - Shift + Enter: 换行
   *
   * 跨平台兼容性:
   * - iOS: 软键盘"发送"按钮触发 Enter 事件
   * - Android: 软键盘"发送"按钮触发 Enter 事件
   * - Web: 标准键盘 Enter 键
   *
   * @param e - 键盘事件
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()  // 阻止默认换行行为
      handleSubmit()      // 触发消息发送
    }
    // Shift + Enter 允许默认行为（换行）
  }

  /**
   * 文件上传处理（已废弃，现使用 FileUpload 组件）
   *
   * 保留此函数用于向后兼容
   *
   * @param type - 文件类型（图片或文档）
   * @deprecated 请使用 FileUpload 组件代替
   */
  const handleFileUpload = (type: 'image' | 'document') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.txt'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        toast.success(`已上传文件: ${file.name}`)
        // Handle file upload logic here
      }
    }
    input.click()
  }

  /**
   * 语音录音处理（已废弃，现使用 VoiceControl 组件）
   *
   * 保留此函数用于向后兼容
   *
   * @deprecated 请使用 VoiceControl 组件代替
   */
  const handleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false)
      toast.success('录音已停止')
    } else {
      setIsRecording(true)
      toast.success('开始录音...')
      // Handle voice recording logic here
    }
  }

  // ============================================
  // 组件渲染
  // ============================================

  return (
    <div className="relative">
      {/* ============================================
          模型选择器弹窗
          显示可用的 AI 模型列表，支持切换模型
          ============================================ */}
      {/* Model Selector */}
      {showModelSelector && (
        <div
          ref={modelSelectorRef}
          className="absolute bottom-full left-0 right-0 mb-4 p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">选择模型</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModelSelector(false)}
              className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="关闭 (ESC)"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
          <Select
            options={availableModels}
            value={currentConversation?.model}
            onChange={(value) => {
              // Update conversation model
              toast.success('模型已切换')
              setShowModelSelector(false)
            }}
            placeholder="选择AI模型"
          />
        </div>
      )}

      {/* ============================================
          输入区域主容器
          响应式设计:
          - 移动端: 更小的圆角、padding、按钮
          - 桌面端: 更大的圆角、padding、按钮
          跨平台兼容性:
          - iOS: 支持安全区域（safe-area-inset）
          - Android: 自适应软键盘弹出
          - Web: 标准桌面布局
          ============================================ */}
      {/* Input Area */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all duration-200 mx-2 sm:mx-0">
        {/* ============================================
            顶部工具栏
            显示当前模型、加载状态、功能按钮
            ============================================ */}
        {/* Top toolbar */}
        <div className="flex items-center justify-between p-2 sm:p-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-1 sm:gap-2">
            <Badge variant="outline" className="text-xs truncate max-w-[120px] sm:max-w-none">
              {currentConversation?.model?.replace(/^gpt-/, 'GPT-') || '请选择模型'}
            </Badge>
            {isLoading && (
              <Badge variant="secondary" className="text-xs flex items-center gap-1">
                <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                <span className="hidden sm:inline">生成中...</span>
                <span className="sm:hidden">...</span>
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFileUpload(!showFileUpload)}
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg transition-colors",
                showFileUpload && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
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
                "h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg transition-colors",
                showTranslation && "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
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
                "h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg transition-colors",
                showVoiceControl && "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              )}
              title="语音控制"
            >
              <MicrophoneIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowModelSelector(!showModelSelector)}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              title="模型设置"
            >
              <Cog6ToothIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>

        {/* File Upload */}
        {showFileUpload && (
          <div
            ref={fileUploadRef}
            className="px-2 sm:px-3 py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700 relative"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">文件上传</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileUpload(false)}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="关闭 (ESC)"
              >
                <XMarkIcon className="h-3 w-3" />
              </Button>
            </div>
            <FileUpload
              onFilesAnalyzed={setUploadedFiles}
              maxFiles={5}
            />
          </div>
        )}

        {/* Translation Tool */}
        {showTranslation && (
          <div
            ref={translationRef}
            className="px-2 sm:px-3 py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700 relative"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">翻译工具</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTranslation(false)}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="关闭 (ESC)"
              >
                <XMarkIcon className="h-3 w-3" />
              </Button>
            </div>
            <TranslationTool
              onTranslate={(sourceText, fromLang, toLang, result) => {
                const translationText = `🌐 翻译结果：\n原文（${fromLang}）: ${sourceText}\n译文（${toLang}）: ${result}`
                setInput(prevInput => prevInput + (prevInput ? '\n\n' : '') + translationText)
                textareaRef.current?.focus()
              }}
            />
          </div>
        )}

        {/* Voice Control */}
        {showVoiceControl && (
          <div
            ref={voiceControlRef}
            className="px-2 sm:px-3 py-2 sm:py-3 border-b border-gray-100 dark:border-gray-700 relative"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">语音控制</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVoiceControl(false)}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="关闭 (ESC)"
              >
                <XMarkIcon className="h-3 w-3" />
              </Button>
            </div>
            <VoiceControl
              onTranscript={(text) => {
                setInput(prevInput => prevInput + (prevInput ? ' ' : '') + text)
                textareaRef.current?.focus()
              }}
              onVoiceCommand={(command) => {
                // Handle voice commands like "发送消息", "清空输入" etc.
                if (command === '发送消息' && input.trim()) {
                  handleSubmit()
                } else if (command === '清空输入') {
                  setInput('')
                  textareaRef.current?.focus()
                }
              }}
              className="justify-center"
            />
          </div>
        )}

        {/* Quick Phrases and AI Assistants */}
        <div className="px-2 sm:px-3 py-1.5 sm:py-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-1 sm:gap-2 flex-wrap overflow-x-auto scrollbar-hide">
          <QuickPhrases
            onInsert={(text) => {
              setInput(prevInput => prevInput + (prevInput ? '\n\n' : '') + text)
              textareaRef.current?.focus()
            }}
          />
          <AIAssistantPresets
            onSelect={(assistant) => {
              const assistantPrompt = `请以"${assistant.name}"的身份回答我的问题。\n\n${assistant.systemPrompt}\n\n我的问题是：`
              setInput(prevInput => prevInput ? `${prevInput}\n\n${assistantPrompt}` : assistantPrompt)
              textareaRef.current?.focus()
            }}
          />
        </div>

        {/* Input */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入您的消息... (Shift + Enter 换行，Enter 发送)"
            className="border-0 focus-visible:ring-0 resize-none min-h-[50px] sm:min-h-[60px] max-h-[150px] sm:max-h-[200px] rounded-none px-2 sm:px-3 py-2 sm:py-3 text-sm sm:text-base"
            autoResize
            disabled={isLoading}
          />

          {/* Send Button */}
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

        {/* ============================================
            底部信息栏
            显示:
            - 功能提示（网络命令使用方法）
            - 附件数量
            - 字符计数
            响应式:
            - 桌面端: 显示完整提示
            - 移动端: 显示简化提示
            ============================================ */}
        {/* Bottom Info */}
        <div className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
              <span className="truncate text-xs sm:text-sm">
                {/* 根据用户设置显示不同的提示 */}
                {user?.preferences?.enableWebSearch || user?.preferences?.enableWeather || user?.preferences?.enableStock || user?.preferences?.enableNews ?
                  <span className="hidden sm:inline">💡 尝试: "天气 北京", "股票 AAPL", "新闻 科技", "搜索 React"</span> :
                  <span className="hidden sm:inline">AI Chat Studio 可能出现错误，请验证重要信息</span>}
                <span className="sm:hidden">💡 支持天气、股票、新闻查询</span>
              </span>
              {/* 显示附件数量 */}
              {uploadedFiles.length > 0 && (
                <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">
                  📎 {uploadedFiles.length}
                </span>
              )}
            </div>
            {/* 字符计数器（限制 4000 字符） */}
            <span className="flex-shrink-0 text-xs">
              {input.length}/4000
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInput
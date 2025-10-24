import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MicrophoneIcon,
  SpeakerWaveIcon,
  StopIcon,
  PlayIcon,
  PauseIcon,
  AdjustmentsHorizontalIcon,
  LanguageIcon,
  SpeakerWaveIcon as VolumeUpIcon,
  SpeakerXMarkIcon as VolumeXIcon,
  ArrowPathIcon,
  SparklesIcon,
  SpeakerWaveIcon as WaveformIcon,
  ClockIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  SpeakerXMarkIcon
} from '@heroicons/react/24/outline'

interface VoiceSettings {
  sttEngine: 'browser' | 'azure' | 'openai-whisper' | 'google'
  ttsEngine: 'browser' | 'azure' | 'openai' | 'elevenlabs'
  language: string
  voice: string
  rate: number
  pitch: number
  volume: number
  autoSpeak: boolean
  continuousListening: boolean
  noiseReduction: boolean
  vadEnabled: boolean // Voice Activity Detection
  vadSensitivity: number
}

interface VoiceMessage {
  id: string
  type: 'user' | 'assistant'
  text: string
  audioUrl?: string
  timestamp: number
  duration?: number
  language: string
  confidence?: number
  isPlaying?: boolean
}

interface RecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  alternatives?: Array<{
    transcript: string
    confidence: number
  }>
}

const AdvancedVoiceInteraction: React.FC = () => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([])
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [recognition, setRecognition] = useState<any>(null)
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [audioLevel, setAudioLevel] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [settings, setSettings] = useState<VoiceSettings>({
    sttEngine: 'browser',
    ttsEngine: 'browser',
    language: 'zh-CN',
    voice: '',
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    autoSpeak: true,
    continuousListening: false,
    noiseReduction: true,
    vadEnabled: true,
    vadSensitivity: 0.5
  })

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number>()

  // 支持的语言列表
  const supportedLanguages = [
    { code: 'zh-CN', name: '中文（简体）' },
    { code: 'zh-TW', name: '中文（繁体）' },
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'ja-JP', name: '日本語' },
    { code: 'ko-KR', name: '한국어' },
    { code: 'es-ES', name: 'Español' },
    { code: 'fr-FR', name: 'Français' },
    { code: 'de-DE', name: 'Deutsch' },
    { code: 'it-IT', name: 'Italiano' },
    { code: 'pt-BR', name: 'Português (Brasil)' },
    { code: 'ru-RU', name: 'Русский' },
    { code: 'ar-SA', name: 'العربية' },
    { code: 'hi-IN', name: 'हिन्दी' }
  ]

  // TTS引擎配置
  const ttsEngines = [
    { id: 'browser', name: '浏览器内置', description: '使用浏览器原生TTS，免费但质量有限' },
    { id: 'azure', name: 'Azure Cognitive Services', description: '微软Azure TTS，高质量多语言支持' },
    { id: 'openai', name: 'OpenAI TTS', description: 'OpenAI的高质量语音合成' },
    { id: 'elevenlabs', name: 'ElevenLabs', description: '最先进的AI语音克隆技术' }
  ]

  // STT引擎配置
  const sttEngines = [
    { id: 'browser', name: '浏览器内置', description: '使用浏览器原生STT，免费但精度有限' },
    { id: 'azure', name: 'Azure Speech Services', description: '微软Azure STT，高精度识别' },
    { id: 'openai-whisper', name: 'OpenAI Whisper', description: '最先进的语音识别模型' },
    { id: 'google', name: 'Google Cloud Speech', description: 'Google的云端语音识别' }
  ]

  // 初始化语音功能
  useEffect(() => {
    initializeVoiceServices()
    return () => {
      cleanup()
    }
  }, [])

  const initializeVoiceServices = () => {
    try {
      // 初始化语音识别
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        const recognitionInstance = new SpeechRecognition()

        recognitionInstance.continuous = true
        recognitionInstance.interimResults = true
        recognitionInstance.lang = settings.language

        recognitionInstance.onstart = () => {
          setIsListening(true)
          setError(null)
        }

        recognitionInstance.onresult = (event: any) => {
          let finalTranscript = ''
          let interimTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcript
            } else {
              interimTranscript += transcript
            }
          }

          if (finalTranscript) {
            handleVoiceInput(finalTranscript, event.results[event.resultIndex][0].confidence)
          }

          setCurrentTranscript(interimTranscript)
        }

        recognitionInstance.onerror = (event: any) => {
          setError(`语音识别错误: ${event.error}`)
          setIsListening(false)
        }

        recognitionInstance.onend = () => {
          setIsListening(false)
          if (settings.continuousListening && !error) {
            setTimeout(() => startListening(), 100)
          }
        }

        setRecognition(recognitionInstance)
      } else {
        setError('您的浏览器不支持语音识别功能')
      }

      // 初始化语音合成
      if ('speechSynthesis' in window) {
        const synth = window.speechSynthesis
        setSynthesis(synth)

        const updateVoices = () => {
          const voices = synth.getVoices()
          setAvailableVoices(voices)

          // 自动选择适合当前语言的声音
          if (!settings.voice && voices.length > 0) {
            const defaultVoice = voices.find(voice =>
              voice.lang.startsWith(settings.language.split('-')[0])
            ) || voices[0]

            setSettings(prev => ({ ...prev, voice: defaultVoice.name }))
          }
        }

        updateVoices()
        synth.onvoiceschanged = updateVoices
      } else {
        setError('您的浏览器不支持语音合成功能')
      }

    } catch (err) {
      setError('初始化语音服务失败')
      console.error('Voice initialization error:', err)
    }
  }

  const cleanup = () => {
    if (recognition) {
      recognition.stop()
    }
    if (synthesis) {
      synthesis.cancel()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const startListening = async () => {
    try {
      if (!recognition) {
        throw new Error('语音识别未初始化')
      }

      setError(null)
      setCurrentTranscript('')

      // 初始化音频监控
      if (settings.vadEnabled) {
        await initializeAudioMonitoring()
      }

      recognition.lang = settings.language
      recognition.start()

    } catch (err) {
      setError('启动语音识别失败')
      console.error('Start listening error:', err)
    }
  }

  const stopListening = () => {
    if (recognition) {
      recognition.stop()
    }
    setIsListening(false)
    setCurrentTranscript('')
    stopAudioMonitoring()
  }

  const initializeAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: settings.noiseReduction,
          noiseSuppression: settings.noiseReduction,
          autoGainControl: true
        }
      })

      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      const microphone = audioContext.createMediaStreamSource(stream)
      microphone.connect(analyser)

      monitorAudioLevel()

    } catch (err) {
      console.error('Audio monitoring error:', err)
    }
  }

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const updateLevel = () => {
      if (!analyserRef.current) return

      analyserRef.current.getByteFrequencyData(dataArray)

      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      const normalizedLevel = average / 255

      setAudioLevel(normalizedLevel)

      animationFrameRef.current = requestAnimationFrame(updateLevel)
    }

    updateLevel()
  }

  const stopAudioMonitoring = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
    setAudioLevel(0)
  }

  const handleVoiceInput = (transcript: string, confidence: number) => {
    const message: VoiceMessage = {
      id: `voice-${Date.now()}`,
      type: 'user',
      text: transcript,
      timestamp: Date.now(),
      language: settings.language,
      confidence
    }

    setVoiceMessages(prev => [...prev, message])

    // 模拟AI回复
    setTimeout(() => {
      generateAIResponse(transcript)
    }, 1000)
  }

  const generateAIResponse = async (userInput: string) => {
    setIsProcessing(true)

    // 模拟AI处理时间
    await new Promise(resolve => setTimeout(resolve, 2000))

    const responses = [
      `好的，我理解了您的问题："${userInput}"。让我来为您详细解答。`,
      `关于"${userInput}"这个问题，我可以为您提供以下信息和建议。`,
      `感谢您的提问。对于"${userInput}"，我的回答是...`,
      `这是一个很好的问题。关于"${userInput}"，我建议您可以考虑以下几个方面。`
    ]

    const response = responses[Math.floor(Math.random() * responses.length)]

    const aiMessage: VoiceMessage = {
      id: `ai-${Date.now()}`,
      type: 'assistant',
      text: response,
      timestamp: Date.now(),
      language: settings.language
    }

    setVoiceMessages(prev => [...prev, aiMessage])
    setIsProcessing(false)

    // 自动播放回复
    if (settings.autoSpeak) {
      speakText(response)
    }
  }

  const speakText = async (text: string) => {
    if (!synthesis) return

    try {
      setIsSpeaking(true)
      synthesis.cancel() // 停止当前播放

      if (settings.ttsEngine === 'browser') {
        // 使用浏览器内置TTS
        const utterance = new SpeechSynthesisUtterance(text)

        const selectedVoice = availableVoices.find(voice => voice.name === settings.voice)
        if (selectedVoice) {
          utterance.voice = selectedVoice
        }

        utterance.rate = settings.rate
        utterance.pitch = settings.pitch
        utterance.volume = settings.volume
        utterance.lang = settings.language

        utterance.onend = () => {
          setIsSpeaking(false)
        }

        utterance.onerror = (event) => {
          setError(`语音合成错误: ${event.error}`)
          setIsSpeaking(false)
        }

        synthesis.speak(utterance)
      } else {
        // 其他TTS引擎的实现
        await handleAdvancedTTS(text)
      }

    } catch (err) {
      setError('语音播放失败')
      setIsSpeaking(false)
      console.error('Speak error:', err)
    }
  }

  const handleAdvancedTTS = async (text: string) => {
    // 这里可以集成各种高级TTS服务
    setIsProcessing(true)

    try {
      switch (settings.ttsEngine) {
        case 'azure':
          // Azure TTS实现
          break
        case 'openai':
          // OpenAI TTS实现
          break
        case 'elevenlabs':
          // ElevenLabs实现
          break
        default:
          throw new Error('不支持的TTS引擎')
      }
    } catch (err) {
      setError(`高级TTS服务错误: ${err}`)
    } finally {
      setIsProcessing(false)
      setIsSpeaking(false)
    }
  }

  const stopSpeaking = () => {
    if (synthesis) {
      synthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const clearMessages = () => {
    setVoiceMessages([])
    setCurrentTranscript('')
  }

  const VoiceMessageCard: React.FC<{ message: VoiceMessage }> = ({ message }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-md p-4 rounded-lg ${
        message.type === 'user'
          ? 'bg-blue-600 text-white'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            {message.type === 'user' ? (
              <MicrophoneIcon className="w-4 h-4" />
            ) : (
              <SpeakerWaveIcon className="w-4 h-4 text-blue-500" />
            )}
            <span className="text-sm font-medium">
              {message.type === 'user' ? '您说' : 'AI回复'}
            </span>
          </div>

          {message.confidence && (
            <span className="text-xs opacity-75">
              {(message.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>

        <p className={`text-sm ${message.type === 'user' ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
          {message.text}
        </p>

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs opacity-75">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>

          {message.type === 'assistant' && (
            <button
              onClick={() => speakText(message.text)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              disabled={isSpeaking}
            >
              <SpeakerWaveIcon className="w-4 h-4 text-blue-500" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            高级语音交互
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            支持多语言语音识别和合成，提供自然的语音对话体验
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              <span className="text-red-700 dark:text-red-300">{error}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 语音控制面板 */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  语音控制
                </h2>
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Cog6ToothIcon className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 音频可视化 */}
              <div className="mb-6">
                <div className="relative h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isListening && (
                      <div className="flex space-x-1">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div
                            key={i}
                            className="w-1 bg-blue-500 rounded-full transition-all duration-150"
                            style={{
                              height: `${Math.random() * 60 + 10}%`,
                              animationDelay: `${i * 0.1}s`
                            }}
                          />
                        ))}
                      </div>
                    )}
                    {!isListening && (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        音频波形
                      </span>
                    )}
                  </div>

                  {/* 音量指示器 */}
                  <div
                    className="absolute bottom-0 left-0 bg-blue-500 transition-all duration-150"
                    style={{
                      width: `${audioLevel * 100}%`,
                      height: '4px'
                    }}
                  />
                </div>
              </div>

              {/* 控制按钮 */}
              <div className="space-y-4">
                <button
                  onClick={toggleListening}
                  disabled={isProcessing}
                  className={`w-full flex items-center justify-center space-x-2 px-6 py-4 rounded-lg font-medium transition-all ${
                    isListening
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } disabled:opacity-50`}
                >
                  {isListening ? (
                    <>
                      <StopIcon className="w-5 h-5" />
                      <span>停止录音</span>
                    </>
                  ) : (
                    <>
                      <MicrophoneIcon className="w-5 h-5" />
                      <span>开始录音</span>
                    </>
                  )}
                </button>

                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <SpeakerXMarkIcon className="w-5 h-5" />
                    <span>停止播放</span>
                  </button>
                )}

                <button
                  onClick={clearMessages}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <DocumentTextIcon className="w-5 h-5" />
                  <span>清除对话</span>
                </button>
              </div>

              {/* 当前识别文本 */}
              {currentTranscript && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                    正在识别...
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300">
                    {currentTranscript}
                  </p>
                </div>
              )}

              {/* 状态指示 */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">语音识别:</span>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className={isListening ? 'text-green-600' : 'text-gray-500'}>
                      {isListening ? '活跃' : '待机'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">语音合成:</span>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-blue-500' : 'bg-gray-400'}`} />
                    <span className={isSpeaking ? 'text-blue-600' : 'text-gray-500'}>
                      {isSpeaking ? '播放中' : '空闲'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">AI处理:</span>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-orange-500' : 'bg-gray-400'}`} />
                    <span className={isProcessing ? 'text-orange-600' : 'text-gray-500'}>
                      {isProcessing ? '处理中' : '就绪'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 对话历史 */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-[600px] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  语音对话记录
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {voiceMessages.length} 条消息
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {voiceMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        开始语音对话
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        点击录音按钮开始与AI进行语音交互
                      </p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence>
                    {voiceMessages.map(message => (
                      <VoiceMessageCard key={message.id} message={message} />
                    ))}
                  </AnimatePresence>
                )}

                {isProcessing && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />
                        <span className="text-gray-600 dark:text-gray-400">AI正在思考...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 语音设置模态框 */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      语音设置
                    </h2>
                    <button
                      onClick={() => setShowSettings(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 语音识别设置 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        语音识别 (STT)
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            识别引擎
                          </label>
                          <select
                            value={settings.sttEngine}
                            onChange={(e) => setSettings({...settings, sttEngine: e.target.value as any})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            {sttEngines.map(engine => (
                              <option key={engine.id} value={engine.id}>
                                {engine.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {sttEngines.find(e => e.id === settings.sttEngine)?.description}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            识别语言
                          </label>
                          <select
                            value={settings.language}
                            onChange={(e) => setSettings({...settings, language: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            {supportedLanguages.map(lang => (
                              <option key={lang.code} value={lang.code}>
                                {lang.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings.continuousListening}
                              onChange={(e) => setSettings({...settings, continuousListening: e.target.checked})}
                              className="mr-2"
                            />
                            <label className="text-sm text-gray-700 dark:text-gray-300">
                              连续监听
                            </label>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings.noiseReduction}
                              onChange={(e) => setSettings({...settings, noiseReduction: e.target.checked})}
                              className="mr-2"
                            />
                            <label className="text-sm text-gray-700 dark:text-gray-300">
                              噪音抑制
                            </label>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings.vadEnabled}
                              onChange={(e) => setSettings({...settings, vadEnabled: e.target.checked})}
                              className="mr-2"
                            />
                            <label className="text-sm text-gray-700 dark:text-gray-300">
                              语音活动检测 (VAD)
                            </label>
                          </div>
                        </div>

                        {settings.vadEnabled && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              VAD敏感度: {settings.vadSensitivity}
                            </label>
                            <input
                              type="range"
                              min="0.1"
                              max="1"
                              step="0.1"
                              value={settings.vadSensitivity}
                              onChange={(e) => setSettings({...settings, vadSensitivity: parseFloat(e.target.value)})}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 语音合成设置 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        语音合成 (TTS)
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            合成引擎
                          </label>
                          <select
                            value={settings.ttsEngine}
                            onChange={(e) => setSettings({...settings, ttsEngine: e.target.value as any})}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          >
                            {ttsEngines.map(engine => (
                              <option key={engine.id} value={engine.id}>
                                {engine.name}
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {ttsEngines.find(e => e.id === settings.ttsEngine)?.description}
                          </p>
                        </div>

                        {settings.ttsEngine === 'browser' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              语音选择
                            </label>
                            <select
                              value={settings.voice}
                              onChange={(e) => setSettings({...settings, voice: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                              {availableVoices
                                .filter(voice => voice.lang.startsWith(settings.language.split('-')[0]))
                                .map(voice => (
                                  <option key={voice.name} value={voice.name}>
                                    {voice.name} ({voice.lang})
                                  </option>
                                ))}
                            </select>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            语速: {settings.rate}
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={settings.rate}
                            onChange={(e) => setSettings({...settings, rate: parseFloat(e.target.value)})}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            音调: {settings.pitch}
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="2"
                            step="0.1"
                            value={settings.pitch}
                            onChange={(e) => setSettings({...settings, pitch: parseFloat(e.target.value)})}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            音量: {settings.volume}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={settings.volume}
                            onChange={(e) => setSettings({...settings, volume: parseFloat(e.target.value)})}
                            className="w-full"
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={settings.autoSpeak}
                            onChange={(e) => setSettings({...settings, autoSpeak: e.target.checked})}
                            className="mr-2"
                          />
                          <label className="text-sm text-gray-700 dark:text-gray-300">
                            自动朗读AI回复
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowSettings(false)}
                      className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => {
                        // 重新初始化语音服务以应用新设置
                        cleanup()
                        initializeVoiceServices()
                        setShowSettings(false)
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      保存设置
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AdvancedVoiceInteraction
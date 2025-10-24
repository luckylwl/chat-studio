import React, { useState, useRef, useEffect } from 'react'
import {
  MicrophoneIcon,
  SpeakerWaveIcon,
  StopIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  MusicalNoteIcon,
  SignalIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { Button, Badge } from './ui'
import { cn } from '@/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface VoiceChatModeProps {
  onTranscript?: (text: string, isFinal: boolean) => void
  onSendMessage?: (text: string) => void
  onReceiveResponse?: (callback: (text: string) => void) => void
  className?: string
}

interface RecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  timestamp: number
}

interface VoiceSettings {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  voiceRate: number
  voicePitch: number
  voiceVolume: number
  voiceName: string
}

interface AudioVisualizerProps {
  analyser: AnalyserNode | null
  isActive: boolean
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!analyser || !canvasRef.current || !isActive) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)

      analyser.getByteFrequencyData(dataArray)

      // Clear canvas
      ctx.fillStyle = 'rgb(17, 24, 39)' // gray-900
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height

        // Gradient color
        const hue = (i / bufferLength) * 360
        ctx.fillStyle = `hsl(${hue}, 70%, 60%)`

        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
        x += barWidth + 1
      }
    }

    draw()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [analyser, isActive])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={200}
      className="w-full h-32 rounded-lg bg-gray-900"
    />
  )
}

const VoiceChatMode: React.FC<VoiceChatModeProps> = ({
  onTranscript,
  onSendMessage,
  onReceiveResponse,
  className
}) => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [finalTranscripts, setFinalTranscripts] = useState<RecognitionResult[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)

  const [settings, setSettings] = useState<VoiceSettings>({
    language: 'zh-CN',
    continuous: true,
    interimResults: true,
    maxAlternatives: 1,
    voiceRate: 1.0,
    voicePitch: 1.0,
    voiceVolume: 1.0,
    voiceName: 'default'
  })

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const hasSpeechRecognition = !!SpeechRecognition
    const hasSpeechSynthesis = 'speechSynthesis' in window

    if (!hasSpeechRecognition) {
      toast.error('您的浏览器不支持语音识别')
      return
    }

    if (!hasSpeechSynthesis) {
      toast.error('您的浏览器不支持语音合成')
      return
    }

    setIsInitialized(true)
    synthRef.current = window.speechSynthesis

    // Initialize Speech Recognition
    recognitionRef.current = new SpeechRecognition()
    const recognition = recognitionRef.current

    recognition.continuous = settings.continuous
    recognition.interimResults = settings.interimResults
    recognition.lang = settings.language
    recognition.maxAlternatives = settings.maxAlternatives

    recognition.onstart = () => {
      console.log('Speech recognition started')
    }

    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        const confidence = event.results[i][0].confidence

        if (event.results[i].isFinal) {
          finalTranscript += transcript
          const result: RecognitionResult = {
            transcript,
            confidence,
            isFinal: true,
            timestamp: Date.now()
          }
          setFinalTranscripts(prev => [...prev, result])
          onTranscript?.(transcript, true)
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        setCurrentTranscript('')
      } else if (interimTranscript) {
        setCurrentTranscript(interimTranscript)
        onTranscript?.(interimTranscript, false)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      if (event.error === 'no-speech') {
        toast.error('未检测到语音')
      } else if (event.error === 'audio-capture') {
        toast.error('无法访问麦克风')
      } else if (event.error === 'not-allowed') {
        toast.error('麦克风权限被拒绝')
      } else {
        toast.error(`语音识别错误: ${event.error}`)
      }
      handleStopListening()
    }

    recognition.onend = () => {
      console.log('Speech recognition ended')
      if (isListening) {
        // Restart if continuous mode
        try {
          recognition.start()
        } catch (error) {
          console.error('Failed to restart recognition:', error)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // Update recognition settings
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.continuous = settings.continuous
      recognitionRef.current.interimResults = settings.interimResults
      recognitionRef.current.lang = settings.language
      recognitionRef.current.maxAlternatives = settings.maxAlternatives
    }
  }, [settings])

  // Timer
  useEffect(() => {
    if (isListening) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      setElapsedTime(0)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isListening])

  const initAudioContext = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext

      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Monitor audio level
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const checkLevel = () => {
        if (!isListening) return

        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
        setAudioLevel(average)

        requestAnimationFrame(checkLevel)
      }

      checkLevel()

      return true
    } catch (error) {
      console.error('Failed to initialize audio:', error)
      toast.error('无法访问麦克风')
      return false
    }
  }

  const handleStartListening = async () => {
    if (!isInitialized) {
      toast.error('语音功能未初始化')
      return
    }

    const audioReady = await initAudioContext()
    if (!audioReady) return

    try {
      recognitionRef.current.start()
      setIsListening(true)
      toast.success('开始语音识别')
    } catch (error: any) {
      console.error('Failed to start recognition:', error)
      if (error.message.includes('already started')) {
        setIsListening(true)
      } else {
        toast.error('启动语音识别失败')
      }
    }
  }

  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    setIsListening(false)
    setCurrentTranscript('')
    toast.info('停止语音识别')
  }

  const handleSendCurrentTranscript = () => {
    const allTranscripts = finalTranscripts.map(r => r.transcript).join(' ')
    if (allTranscripts.trim()) {
      onSendMessage?.(allTranscripts)
      setFinalTranscripts([])
      toast.success('已发送消息')
    } else {
      toast.error('没有可发送的内容')
    }
  }

  const handleClearTranscripts = () => {
    setFinalTranscripts([])
    setCurrentTranscript('')
    toast.success('已清空')
  }

  const handleSpeak = (text: string) => {
    if (!synthRef.current) {
      toast.error('语音合成不可用')
      return
    }

    // Cancel any ongoing speech
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = settings.language
    utterance.rate = settings.voiceRate
    utterance.pitch = settings.voicePitch
    utterance.volume = settings.voiceVolume

    // Select voice
    if (settings.voiceName !== 'default') {
      const voices = synthRef.current.getVoices()
      const selectedVoice = voices.find(voice => voice.name === settings.voiceName)
      if (selectedVoice) {
        utterance.voice = selectedVoice
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      toast.error('语音播放错误')
      setIsSpeaking(false)
      setIsPaused(false)
    }

    synthRef.current.speak(utterance)
  }

  const handlePauseSpeech = () => {
    if (synthRef.current) {
      if (isPaused) {
        synthRef.current.resume()
        setIsPaused(false)
      } else {
        synthRef.current.pause()
        setIsPaused(true)
      }
    }
  }

  const handleStopSpeech = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
      setIsPaused(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getAudioLevelColor = () => {
    if (audioLevel > 150) return 'bg-red-500'
    if (audioLevel > 100) return 'bg-yellow-500'
    if (audioLevel > 50) return 'bg-green-500'
    return 'bg-gray-400'
  }

  return (
    <div className={cn('flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="flex items-center gap-3">
          <MusicalNoteIcon className="w-6 h-6" />
          <div>
            <h2 className="font-semibold">语音对话模式</h2>
            <p className="text-xs text-purple-100">
              {isListening ? '正在聆听...' : isSpeaking ? '正在播放...' : '准备就绪'}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="text-white hover:bg-white/20"
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </Button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  语言
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="zh-CN">中文（简体）</option>
                  <option value="zh-TW">中文（繁體）</option>
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="ja-JP">日本語</option>
                  <option value="ko-KR">한국어</option>
                  <option value="fr-FR">Français</option>
                  <option value="de-DE">Deutsch</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  语速: {settings.voiceRate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.voiceRate}
                  onChange={(e) => setSettings(prev => ({ ...prev, voiceRate: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  音调: {settings.voicePitch.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.voicePitch}
                  onChange={(e) => setSettings(prev => ({ ...prev, voicePitch: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  音量: {(settings.voiceVolume * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.voiceVolume}
                  onChange={(e) => setSettings(prev => ({ ...prev, voiceVolume: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="continuous"
                  checked={settings.continuous}
                  onChange={(e) => setSettings(prev => ({ ...prev, continuous: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="continuous" className="text-sm text-gray-700 dark:text-gray-300">
                  连续识别
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="interimResults"
                  checked={settings.interimResults}
                  onChange={(e) => setSettings(prev => ({ ...prev, interimResults: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="interimResults" className="text-sm text-gray-700 dark:text-gray-300">
                  显示临时结果
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Visualizer */}
      {isListening && (
        <div className="p-4 bg-gray-900">
          <AudioVisualizer analyser={analyserRef.current} isActive={isListening} />
        </div>
      )}

      {/* Status Bar */}
      {isListening && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-mono text-gray-900 dark:text-white">
                {formatTime(elapsedTime)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <SignalIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className={cn(
                      'w-1 h-3 rounded-full transition-colors',
                      audioLevel > i * 50 ? getAudioLevelColor() : 'bg-gray-300 dark:bg-gray-700'
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          <Badge variant={isListening ? 'default' : 'outline'} className="animate-pulse">
            {isListening ? '录音中' : '就绪'}
          </Badge>
        </div>
      )}

      {/* Transcripts */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[300px] max-h-[500px]">
        {finalTranscripts.length === 0 && !currentTranscript ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <MicrophoneIcon className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-sm">点击麦克风按钮开始语音识别</p>
            <p className="text-xs mt-2">支持中文、英文等多种语言</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Final transcripts */}
            {finalTranscripts.map((result, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-900 dark:text-white flex-1">
                    {result.transcript}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {(result.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
              </motion.div>
            ))}

            {/* Interim transcript */}
            {currentTranscript && (
              <motion.div
                key="interim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 border-dashed"
              >
                <p className="text-sm text-gray-600 dark:text-gray-300 italic">
                  {currentTranscript}
                </p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center gap-3">
          {/* Speech Recognition Controls */}
          {!isListening ? (
            <Button
              size="lg"
              onClick={handleStartListening}
              disabled={!isInitialized}
              className="px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <MicrophoneIcon className="w-5 h-5 mr-2" />
              开始识别
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleStopListening}
              variant="outline"
              className="px-8 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <StopIcon className="w-5 h-5 mr-2" />
              停止识别
            </Button>
          )}

          {/* Send & Clear */}
          {finalTranscripts.length > 0 && (
            <>
              <Button
                onClick={handleSendCurrentTranscript}
                className="px-6"
              >
                发送
              </Button>
              <Button
                variant="outline"
                onClick={handleClearTranscripts}
              >
                <ArrowPathIcon className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Speech Synthesis Controls */}
          {isSpeaking && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handlePauseSpeech}
              >
                {isPaused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
              </Button>
              <Button
                variant="outline"
                onClick={handleStopSpeech}
                className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <StopIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Test Speech Synthesis */}
        {!isSpeaking && !isListening && (
          <div className="mt-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSpeak('你好，我是AI语音助手。很高兴为您服务。')}
            >
              <SpeakerWaveIcon className="w-4 h-4 mr-2" />
              测试语音播放
            </Button>
          </div>
        )}
      </div>

      {/* Browser Support Warning */}
      {!isInitialized && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ 您的浏览器可能不支持语音功能。建议使用 Chrome、Edge 或 Safari 浏览器。
          </p>
        </div>
      )}
    </div>
  )
}

export default VoiceChatMode
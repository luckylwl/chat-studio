import React, { useState, useRef, useEffect } from 'react'
import { Button } from './ui'
import { cn } from '@/utils'
import {
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  StopIcon,
  PlayIcon,
  PauseIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface VoiceSettings {
  language: 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR'
  voiceRate: number // 0.1 - 2.0
  voicePitch: number // 0 - 2
  voiceVolume: number // 0 - 1
  autoPlay: boolean
  continuous: boolean // Continuous listening
  noiseReduction: boolean
}

interface RecognitionResult {
  text: string
  confidence: number
  isFinal: boolean
  timestamp: number
}

interface VoiceInteractionProps {
  onSpeechResult?: (text: string, confidence: number) => void
  onSpeakText?: (text: string) => void
  className?: string
  compact?: boolean
}

const VoiceInteraction: React.FC<VoiceInteractionProps> = ({
  onSpeechResult,
  onSpeakText,
  className,
  compact = false
}) => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [synthesisSupported, setSynthesisSupported] = useState(false)
  const [currentText, setCurrentText] = useState('')
  const [recognitionResults, setRecognitionResults] = useState<RecognitionResult[]>([])
  const [volumeLevel, setVolumeLevel] = useState(0)

  const recognitionRef = useRef<any>(null)
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const [settings, setSettings] = useState<VoiceSettings>({
    language: 'zh-CN',
    voiceRate: 1.0,
    voicePitch: 1.0,
    voiceVolume: 1.0,
    autoPlay: false,
    continuous: false,
    noiseReduction: true
  })

  // Check browser support
  useEffect(() => {
    const checkSupport = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      setSpeechSupported(!!SpeechRecognition)
      setSynthesisSupported('speechSynthesis' in window)
    }

    checkSupport()
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (!speechSupported) return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = settings.language
    recognition.continuous = settings.continuous
    recognition.interimResults = true
    recognition.maxAlternatives = 3

    recognition.onstart = () => {
      setIsListening(true)
      initializeAudioVisualizer()
    }

    recognition.onresult = (event: any) => {
      let interimText = ''
      let finalText = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        const confidence = result[0].confidence

        if (result.isFinal) {
          finalText += text
          setRecognitionResults(prev => [...prev.slice(-9), {
            text,
            confidence,
            isFinal: true,
            timestamp: Date.now()
          }])
          onSpeechResult?.(text, confidence)
        } else {
          interimText += text
        }
      }

      setCurrentText(finalText || interimText)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
      stopAudioVisualizer()
    }

    recognition.onend = () => {
      setIsListening(false)
      stopAudioVisualizer()

      // Restart if continuous mode is enabled
      if (settings.continuous && recognitionRef.current) {
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.start()
          }
        }, 100)
      }
    }

    recognitionRef.current = recognition
    return () => {
      recognition.stop()
    }
  }, [speechSupported, settings, onSpeechResult])

  // Audio visualizer for microphone
  const initializeAudioVisualizer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: settings.noiseReduction,
          noiseSuppression: settings.noiseReduction,
          autoGainControl: true
        }
      })

      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)

      analyserRef.current.fftSize = 256
      microphoneRef.current.connect(analyserRef.current)

      const updateVolumeLevel = () => {
        if (!analyserRef.current) return

        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserRef.current.getByteFrequencyData(dataArray)

        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
        setVolumeLevel(average / 255)

        animationFrameRef.current = requestAnimationFrame(updateVolumeLevel)
      }

      updateVolumeLevel()
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopAudioVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    setVolumeLevel(0)
  }

  // Voice synthesis
  const speakText = (text: string) => {
    if (!synthesisSupported || !text.trim()) return

    // Stop any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = settings.language
    utterance.rate = settings.voiceRate
    utterance.pitch = settings.voicePitch
    utterance.volume = settings.voiceVolume

    utterance.onstart = () => {
      setIsSpeaking(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      setIsPaused(false)
    }

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event)
      setIsSpeaking(false)
      setIsPaused(false)
    }

    utterance.onpause = () => {
      setIsPaused(true)
    }

    utterance.onresume = () => {
      setIsPaused(false)
    }

    synthesisRef.current = utterance
    window.speechSynthesis.speak(utterance)
    onSpeakText?.(text)
  }

  // Control functions
  const startListening = () => {
    if (!recognitionRef.current || isListening) return
    try {
      recognitionRef.current.start()
    } catch (error) {
      console.error('Error starting recognition:', error)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const pauseSpeech = () => {
    if (isSpeaking && !isPaused) {
      window.speechSynthesis.pause()
    }
  }

  const resumeSpeech = () => {
    if (isSpeaking && isPaused) {
      window.speechSynthesis.resume()
    }
  }

  const stopSpeech = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setIsPaused(false)
  }

  // Test speech
  const testSpeech = () => {
    const testTexts = {
      'zh-CN': '你好，这是语音合成测试。',
      'en-US': 'Hello, this is a speech synthesis test.',
      'ja-JP': 'こんにちは、これは音声合成のテストです。',
      'ko-KR': '안녕하세요, 이것은 음성 합성 테스트입니다.'
    }
    speakText(testTexts[settings.language])
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {speechSupported && (
          <Button
            variant="ghost"
            size="sm"
            onClick={isListening ? stopListening : startListening}
            className={cn(
              'relative',
              isListening && 'text-red-500 bg-red-50 dark:bg-red-900/20'
            )}
            title={isListening ? '停止听写' : '开始听写'}
          >
            {isListening ? (
              <StopIcon className="h-4 w-4" />
            ) : (
              <MicrophoneIcon className="h-4 w-4" />
            )}
            {isListening && (
              <div className="absolute -inset-1 rounded-full border-2 border-red-500 opacity-75 animate-pulse" />
            )}
          </Button>
        )}

        {synthesisSupported && (
          <Button
            variant="ghost"
            size="sm"
            onClick={isSpeaking ? (isPaused ? resumeSpeech : pauseSpeech) : testSpeech}
            className={cn(
              isSpeaking && 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
            )}
            title={isSpeaking ? (isPaused ? '继续朗读' : '暂停朗读') : '测试语音'}
          >
            {isSpeaking ? (
              isPaused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />
            ) : (
              <SpeakerWaveIcon className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <MicrophoneIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">语音交互</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">语音输入和朗读功能</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="rounded-full"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Support Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className={cn(
            'flex items-center gap-2 p-3 rounded-lg',
            speechSupported
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          )}>
            {speechSupported ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              语音识别 {speechSupported ? '已支持' : '不支持'}
            </span>
          </div>

          <div className={cn(
            'flex items-center gap-2 p-3 rounded-lg',
            synthesisSupported
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
          )}>
            {synthesisSupported ? (
              <CheckCircleIcon className="h-4 w-4" />
            ) : (
              <ExclamationTriangleIcon className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              语音合成 {synthesisSupported ? '已支持' : '不支持'}
            </span>
          </div>
        </div>
      </div>

      {/* Voice Controls */}
      <div className="p-6 space-y-6">
        {/* Speech Recognition */}
        {speechSupported && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MicrophoneIcon className="h-5 w-5" />
              语音输入
            </h3>

            <div className="flex items-center gap-4">
              <Button
                onClick={isListening ? stopListening : startListening}
                className={cn(
                  'flex items-center gap-2',
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                )}
              >
                {isListening ? (
                  <>
                    <StopIcon className="h-4 w-4" />
                    停止听写
                  </>
                ) : (
                  <>
                    <MicrophoneIcon className="h-4 w-4" />
                    开始听写
                  </>
                )}
              </Button>

              {isListening && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  正在监听...
                  <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-75"
                      style={{ width: `${volumeLevel * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {currentText && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">当前识别结果:</p>
                <p className="text-gray-900 dark:text-gray-100">{currentText}</p>
              </div>
            )}

            {recognitionResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">识别历史</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {recognitionResults.slice(-5).map((result, index) => (
                    <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-gray-700 dark:text-gray-300">{result.text}</span>
                      <span className="text-gray-500">
                        {(result.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Speech Synthesis */}
        {synthesisSupported && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <SpeakerWaveIcon className="h-5 w-5" />
              语音朗读
            </h3>

            <div className="flex items-center gap-2">
              <Button
                onClick={testSpeech}
                variant="outline"
                className="flex items-center gap-2"
              >
                <SpeakerWaveIcon className="h-4 w-4" />
                测试朗读
              </Button>

              {isSpeaking && (
                <>
                  <Button
                    onClick={isPaused ? resumeSpeech : pauseSpeech}
                    variant="outline"
                    size="sm"
                  >
                    {isPaused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
                  </Button>

                  <Button
                    onClick={stopSpeech}
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                  >
                    <StopIcon className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    {isPaused ? '已暂停' : '正在朗读...'}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Settings */}
        {isSettingsOpen && (
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">语音设置</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  语言
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="zh-CN">中文 (普通话)</option>
                  <option value="en-US">English (US)</option>
                  <option value="ja-JP">日本語</option>
                  <option value="ko-KR">한국어</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  语速: {settings.voiceRate.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={settings.voiceRate}
                  onChange={(e) => setSettings(prev => ({ ...prev, voiceRate: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  音调: {settings.voicePitch.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
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
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.continuous}
                  onChange={(e) => setSettings(prev => ({ ...prev, continuous: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">连续听写模式</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.noiseReduction}
                  onChange={(e) => setSettings(prev => ({ ...prev, noiseReduction: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">噪声抑制</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.autoPlay}
                  onChange={(e) => setSettings(prev => ({ ...prev, autoPlay: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">AI回复自动朗读</span>
              </label>
            </div>
          </div>
        )}

        {/* Usage Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">使用提示</h4>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>• 点击"开始听写"按钮开始语音输入</li>
            <li>• 支持多种语言的语音识别和合成</li>
            <li>• 可以调节语速、音调和音量</li>
            <li>• 启用连续模式可持续监听语音</li>
            <li>• 确保麦克风权限已授予</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default VoiceInteraction
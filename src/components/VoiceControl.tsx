import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MicrophoneIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  Cog6ToothIcon,
  StopIcon
} from '@heroicons/react/24/outline'
import { VoiceService, VoiceSettings, SpeechRecognitionResult } from '@/services/voiceService'

interface VoiceControlProps {
  onTranscript?: (text: string) => void
  onVoiceCommand?: (command: string) => void
  className?: string
}

const VoiceControl: React.FC<VoiceControlProps> = ({
  onTranscript,
  onVoiceCommand,
  className = ''
}) => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<VoiceSettings | null>(null)
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [capabilities, setCapabilities] = useState({
    speechSynthesis: false,
    speechRecognition: false,
    voiceCommands: false
  })

  const voiceService = VoiceService.getInstance()
  const transcriptTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const initializeVoice = () => {
      const caps = voiceService.getCapabilities()
      setCapabilities(caps)

      const voiceSettings = voiceService.getSettings()
      setSettings(voiceSettings)

      if (caps.speechSynthesis) {
        const voices = voiceService.getAvailableVoices()
        setAvailableVoices(voices)
      }
    }

    // 延迟初始化，等待语音API加载
    setTimeout(initializeVoice, 100)

    // 监听语音事件
    const handleSpeechResult = (result: SpeechRecognitionResult) => {
      setTranscript(result.transcript)

      if (result.isFinal) {
        onTranscript?.(result.transcript)
        // 清除临时显示的文本
        if (transcriptTimeoutRef.current) {
          clearTimeout(transcriptTimeoutRef.current)
        }
        transcriptTimeoutRef.current = setTimeout(() => {
          setTranscript('')
        }, 2000)
      }
    }

    const handleListeningStart = () => setIsListening(true)
    const handleListeningStop = () => setIsListening(false)
    const handleSpeakingStart = () => setIsSpeaking(true)
    const handleSpeakingEnd = () => setIsSpeaking(false)
    const handleVoiceCommand = (command: any) => onVoiceCommand?.(command.command)

    voiceService.addEventListener('speech_result', handleSpeechResult)
    voiceService.addEventListener('listening_started', handleListeningStart)
    voiceService.addEventListener('listening_stopped', handleListeningStop)
    voiceService.addEventListener('speaking_started', handleSpeakingStart)
    voiceService.addEventListener('speaking_ended', handleSpeakingEnd)
    voiceService.addEventListener('voice_command', handleVoiceCommand)

    return () => {
      voiceService.removeEventListener('speech_result', handleSpeechResult)
      voiceService.removeEventListener('listening_started', handleListeningStart)
      voiceService.removeEventListener('listening_stopped', handleListeningStop)
      voiceService.removeEventListener('speaking_started', handleSpeakingStart)
      voiceService.removeEventListener('speaking_ended', handleSpeakingEnd)
      voiceService.removeEventListener('voice_command', handleVoiceCommand)

      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current)
      }
    }
  }, [onTranscript, onVoiceCommand])

  const handleToggleListening = () => {
    try {
      if (!capabilities.speechRecognition) {
        alert('您的浏览器不支持语音识别功能')
        return
      }
      voiceService.toggleListening()
    } catch (error) {
      console.error('Toggle listening error:', error)
      alert('语音识别启动失败，请检查麦克风权限')
    }
  }

  const handleStopSpeaking = () => {
    voiceService.stopSpeaking()
  }

  const handleSettingsChange = (key: keyof VoiceSettings, value: any) => {
    if (settings) {
      const newSettings = { ...settings, [key]: value }
      setSettings(newSettings)
      voiceService.updateSettings({ [key]: value })
    }
  }

  const testVoice = () => {
    if (settings) {
      voiceService.speak('这是语音测试，您好！', settings)
    }
  }

  if (!capabilities.speechSynthesis && !capabilities.speechRecognition) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${className}`} style={{ position: 'relative' }}>
      {/* 语音识别按钮 */}
      {capabilities.speechRecognition && (
        <button
          onClick={handleToggleListening}
          className={`p-2 rounded-full transition-all duration-200 ${
            isListening
              ? 'bg-red-500 text-white shadow-lg animate-pulse'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          title={isListening ? '停止语音识别' : '开始语音识别'}
        >
          <MicrophoneIcon className="w-5 h-5" />
        </button>
      )}

      {/* 朗读控制按钮 */}
      {capabilities.speechSynthesis && (
        <button
          onClick={handleStopSpeaking}
          disabled={!isSpeaking}
          className={`p-2 rounded-full transition-all duration-200 ${
            isSpeaking
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isSpeaking ? '停止朗读' : '当前没有朗读'}
        >
          {isSpeaking ? (
            <SpeakerXMarkIcon className="w-5 h-5" />
          ) : (
            <SpeakerWaveIcon className="w-5 h-5" />
          )}
        </button>
      )}

      {/* 设置按钮 */}
      <button
        onClick={() => setShowSettings(true)}
        className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        title="语音设置"
      >
        <Cog6ToothIcon className="w-5 h-5" />
      </button>

      {/* 实时转录显示 */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-xs z-10"
          >
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">语音识别:</div>
            <div className="text-gray-900 dark:text-white">{transcript}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 设置面板 */}
      <AnimatePresence>
        {showSettings && settings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  语音设置
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {/* 语言设置 */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                    语言
                  </label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleSettingsChange('language', e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                  >
                    <option value="zh-CN">中文 (简体)</option>
                    <option value="zh-TW">中文 (繁体)</option>
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="ja-JP">日本語</option>
                    <option value="ko-KR">한국어</option>
                  </select>
                </div>

                {/* 声音选择 */}
                {availableVoices.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      声音
                    </label>
                    <select
                      value={settings.voice}
                      onChange={(e) => handleSettingsChange('voice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">默认声音</option>
                      {availableVoices
                        .filter(voice => voice.lang.startsWith(settings.language.split('-')[0]))
                        .map((voice, index) => (
                          <option key={index} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                {/* 语速 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    语速: {settings.rate.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.rate}
                    onChange={(e) => handleSettingsChange('rate', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* 音调 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    音调: {settings.pitch.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={settings.pitch}
                    onChange={(e) => handleSettingsChange('pitch', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* 音量 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    音量: {Math.round(settings.volume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.1"
                    value={settings.volume}
                    onChange={(e) => handleSettingsChange('volume', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* 开关选项 */}
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.autoSpeak}
                      onChange={(e) => handleSettingsChange('autoSpeak', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      自动朗读AI回复
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.voiceInput}
                      onChange={(e) => handleSettingsChange('voiceInput', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      启用语音输入
                    </span>
                  </label>
                </div>

                {/* 测试按钮 */}
                <button
                  onClick={testVoice}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  测试语音
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default VoiceControl
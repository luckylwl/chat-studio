import React, { useState, useRef, useEffect } from 'react'
import {
  MicrophoneIcon,
  StopIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'

interface VoiceRecorderProps {
  onTranscription?: (text: string) => void
  onAudioFile?: (file: File) => void
  className?: string
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscription,
  onAudioFile,
  className
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [volume, setVolume] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationRef = useRef<number>()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [audioUrl])

  // Volume monitoring
  const monitorVolume = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    setVolume(average / 255) // Normalize to 0-1

    if (isRecording && !isPaused) {
      animationRef.current = requestAnimationFrame(monitorVolume)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Set up audio context for volume monitoring
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream)
      microphoneRef.current.connect(analyserRef.current)
      analyserRef.current.fftSize = 256

      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setAudioBlob(audioBlob)

        // Create audio URL for playback
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)

        // Clean up stream
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      // Start volume monitoring
      monitorVolume()

      toast.success('开始录音')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('无法访问麦克风，请检查权限设置')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
      }

      setVolume(0)
      toast.success('录音完成')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) clearInterval(timerRef.current)
      toast.info('录音已暂停')
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume()
      setIsPaused(false)

      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      // Resume volume monitoring
      monitorVolume()

      toast.info('继续录音')
    }
  }

  const playAudio = () => {
    if (audioUrl && !isPlaying) {
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        setIsPlaying(false)
        audioRef.current = null
      }

      audio.play()
      setIsPlaying(true)
    }
  }

  const stopAudio = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      audioRef.current = null
    }
  }

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
      setAudioUrl(null)
    }
    setAudioBlob(null)
    setRecordingTime(0)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    toast.success('录音已删除')
  }

  const transcribeAudio = async () => {
    if (!audioBlob) {
      toast.error('没有录音文件')
      return
    }

    setIsTranscribing(true)
    try {
      // Mock transcription - would normally use Web Speech API or cloud service
      await new Promise(resolve => setTimeout(resolve, 2000))

      const mockTranscription = "这是一个模拟的语音转写结果。在实际应用中，这里会调用语音识别API来转写音频内容。"

      onTranscription?.(mockTranscription)
      toast.success('语音转写完成')
    } catch (error) {
      console.error('Transcription error:', error)
      toast.error('语音转写失败')
    } finally {
      setIsTranscribing(false)
    }
  }

  const sendAudioFile = () => {
    if (audioBlob) {
      const audioFile = new File([audioBlob], `recording_${Date.now()}.wav`, {
        type: 'audio/wav'
      })
      onAudioFile?.(audioFile)
      toast.success('音频文件已发送')
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getVolumeIndicator = () => {
    const bars = 5
    const activeBars = Math.ceil(volume * bars)

    return (
      <div className="flex items-end gap-0.5 h-4">
        {Array.from({ length: bars }, (_, i) => (
          <div
            key={i}
            className={cn(
              "w-1 rounded-full transition-all",
              i < activeBars
                ? "bg-green-500"
                : "bg-gray-300 dark:bg-gray-600",
              i === 0 && "h-2",
              i === 1 && "h-3",
              i === 2 && "h-4",
              i === 3 && "h-3",
              i === 4 && "h-2"
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Recording Controls */}
      <div className="flex items-center justify-center gap-3">
        {!isRecording ? (
          <Button
            onClick={startRecording}
            className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white"
            title="开始录音"
          >
            <MicrophoneIcon className="h-6 w-6" />
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              onClick={isPaused ? resumeRecording : pauseRecording}
              variant="outline"
              className="h-10 w-10 rounded-full"
              title={isPaused ? "继续录音" : "暂停录音"}
            >
              {isPaused ? (
                <PlayIcon className="h-5 w-5" />
              ) : (
                <PauseIcon className="h-5 w-5" />
              )}
            </Button>

            <Button
              onClick={stopRecording}
              className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white"
              title="停止录音"
            >
              <StopIcon className="h-6 w-6" />
            </Button>
          </div>
        )}
      </div>

      {/* Recording Status */}
      {isRecording && (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className={cn(
              "w-3 h-3 rounded-full",
              isPaused ? "bg-yellow-500" : "bg-red-500 animate-pulse"
            )} />
            <span className="text-lg font-mono">
              {formatTime(recordingTime)}
            </span>
            {getVolumeIndicator()}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isPaused ? '录音已暂停' : '正在录音...'}
          </p>
        </div>
      )}

      {/* Playback Controls */}
      {audioBlob && !isRecording && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              录音时长: {formatTime(recordingTime)}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={isPlaying ? stopAudio : playAudio}
                className="h-8 w-8 p-0"
                title={isPlaying ? "停止播放" : "播放录音"}
              >
                {isPlaying ? (
                  <StopIcon className="h-4 w-4" />
                ) : (
                  <PlayIcon className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={deleteRecording}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                title="删除录音"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={transcribeAudio}
              disabled={isTranscribing}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {isTranscribing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  转写中...
                </>
              ) : (
                '语音转文字'
              )}
            </Button>

            <Button
              onClick={sendAudioFile}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <CloudArrowUpIcon className="h-4 w-4 mr-1" />
              发送音频
            </Button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          点击红色按钮开始录音，支持暂停和播放功能
        </p>
      </div>
    </div>
  )
}

export default VoiceRecorder
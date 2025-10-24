import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnalytics } from './AnalyticsProvider'
import { useAppStore } from '@/store'
import { cn } from '@/utils'

interface MusicStyle {
  id: string
  name: string
  description: string
  icon: string
  characteristics: string[]
}

interface MusicGeneration {
  id: string
  title: string
  prompt: string
  style: string
  duration: number
  tempo: number
  key: string
  instruments: string[]
  mood: string
  genre: string
  structure: string
  generatedAt: number
  status: 'generating' | 'completed' | 'error'
  audioUrl?: string
  waveform?: number[]
  lyrics?: string
  chords?: string[]
  notes?: string
}

interface GenerationOptions {
  style: string
  genre: string
  mood: string
  tempo: number
  duration: number
  key: string
  instruments: string[]
  structure: string
  includeVocals: boolean
  includeLyrics: boolean
  complexity: 'simple' | 'medium' | 'complex'
  customPrompt?: string
}

const musicStyles: MusicStyle[] = [
  {
    id: 'classical',
    name: '古典音乐',
    description: '优雅的古典音乐风格',
    icon: '🎼',
    characteristics: ['优雅', '和谐', '复杂', '永恒']
  },
  {
    id: 'jazz',
    name: '爵士乐',
    description: '自由即兴的爵士风格',
    icon: '🎷',
    characteristics: ['即兴', '摇摆', '复杂和声', '表现力']
  },
  {
    id: 'pop',
    name: '流行音乐',
    description: '朗朗上口的流行风格',
    icon: '🎤',
    characteristics: ['朗朗上口', '节奏明快', '易记', '大众化']
  },
  {
    id: 'rock',
    name: '摇滚乐',
    description: '强劲有力的摇滚风格',
    icon: '🎸',
    characteristics: ['强劲', '叛逆', '电吉他', '节奏感强']
  },
  {
    id: 'electronic',
    name: '电子音乐',
    description: '现代电子音乐风格',
    icon: '🎹',
    characteristics: ['合成器', '节拍', '数字化', '未来感']
  },
  {
    id: 'folk',
    name: '民谣',
    description: '朴实自然的民谣风格',
    icon: '🪕',
    characteristics: ['朴实', '故事性', '吉他', '真诚']
  },
  {
    id: 'ambient',
    name: '氛围音乐',
    description: '宁静冥想的氛围风格',
    icon: '🌊',
    characteristics: ['宁静', '氛围', '冥想', '空间感']
  },
  {
    id: 'world',
    name: '世界音乐',
    description: '融合各种文化的世界音乐',
    icon: '🌍',
    characteristics: ['多元文化', '传统乐器', '民族特色', '融合']
  }
]

const genres = [
  'Pop', 'Rock', 'Jazz', 'Classical', 'Electronic', 'Hip-Hop', 'R&B', 'Country',
  'Folk', 'Blues', 'Reggae', 'Funk', 'Soul', 'Disco', 'House', 'Techno',
  'Trance', 'Dubstep', 'Ambient', 'New Age', 'World Music', 'Latin', 'Bossa Nova'
]

const moods = [
  '快乐', '悲伤', '激动', '平静', '浪漫', '神秘', '紧张', '轻松',
  '怀旧', '希望', '愤怒', '梦幻', '史诗', '温柔', '强劲', '优雅'
]

const instruments = [
  'Piano', 'Guitar', 'Violin', 'Cello', 'Drums', 'Bass', 'Saxophone', 'Trumpet',
  'Flute', 'Clarinet', 'Harp', 'Organ', 'Synthesizer', 'Voice', 'Strings', 'Brass'
]

const keys = [
  'C Major', 'G Major', 'D Major', 'A Major', 'E Major', 'B Major', 'F# Major',
  'C# Major', 'F Major', 'Bb Major', 'Eb Major', 'Ab Major', 'Db Major', 'Gb Major',
  'A Minor', 'E Minor', 'B Minor', 'F# Minor', 'C# Minor', 'G# Minor', 'D# Minor',
  'A# Minor', 'D Minor', 'G Minor', 'C Minor', 'F Minor', 'Bb Minor', 'Eb Minor'
]

const structures = [
  'Verse-Chorus-Verse-Chorus-Bridge-Chorus',
  'Intro-Verse-Chorus-Verse-Chorus-Outro',
  'A-B-A-B-C-B',
  'Theme-Variation-Theme',
  'Exposition-Development-Recapitulation',
  'Free Form'
]

interface SmartMusicGeneratorProps {
  className?: string
}

export const SmartMusicGenerator: React.FC<SmartMusicGeneratorProps> = ({ className }) => {
  const { t } = useTranslation()
  const { trackFeatureUsage, trackUserAction } = useAnalytics()
  const { user } = useAppStore()

  const [generations, setGenerations] = useState<MusicGeneration[]>([])
  const [options, setOptions] = useState<GenerationOptions>({
    style: 'pop',
    genre: 'Pop',
    mood: '快乐',
    tempo: 120,
    duration: 60,
    key: 'C Major',
    instruments: ['Piano', 'Guitar', 'Drums'],
    structure: 'Verse-Chorus-Verse-Chorus-Bridge-Chorus',
    includeVocals: false,
    includeLyrics: false,
    complexity: 'medium'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedGeneration, setSelectedGeneration] = useState<MusicGeneration | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    trackFeatureUsage('smart_music_generator')
  }, [trackFeatureUsage])

  const generateWaveform = useCallback((duration: number): number[] => {
    const samples = Math.floor(duration * 44100 / 1000)
    return Array.from({ length: samples }, () => Math.random() * 2 - 1)
  }, [])

  const generateMusic = useCallback(async () => {
    if (isGenerating) return

    setIsGenerating(true)
    trackUserAction('generate_music', 'button', { style: options.style, genre: options.genre })

    const generation: MusicGeneration = {
      id: `music_${Date.now()}`,
      title: `${options.style.charAt(0).toUpperCase() + options.style.slice(1)} ${options.genre} - ${options.mood}`,
      prompt: options.customPrompt || `Create a ${options.duration}s ${options.genre} track in ${options.mood} mood with ${options.instruments.join(', ')}`,
      style: options.style,
      duration: options.duration,
      tempo: options.tempo,
      key: options.key,
      instruments: options.instruments,
      mood: options.mood,
      genre: options.genre,
      structure: options.structure,
      generatedAt: Date.now(),
      status: 'generating',
      waveform: generateWaveform(options.duration * 1000)
    }

    setGenerations(prev => [generation, ...prev])

    try {
      await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000))

      const completedGeneration: MusicGeneration = {
        ...generation,
        status: 'completed',
        audioUrl: `data:audio/wav;base64,${btoa('fake_audio_data_' + generation.id)}`,
        lyrics: options.includeLyrics ? generateLyrics(options) : undefined,
        chords: generateChords(options),
        notes: `Generated in ${options.key} with ${options.tempo} BPM`
      }

      setGenerations(prev => prev.map(g => g.id === generation.id ? completedGeneration : g))
      setSelectedGeneration(completedGeneration)
    } catch (error) {
      setGenerations(prev => prev.map(g =>
        g.id === generation.id ? { ...g, status: 'error' } : g
      ))
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating, options, trackUserAction, generateWaveform])

  const generateLyrics = useCallback((options: GenerationOptions): string => {
    const templates = {
      '快乐': ['阳光洒向大地', '笑声填满心田', '快乐的时光永远不会结束'],
      '悲伤': ['雨滴敲打窗台', '思念如潮水般涌来', '泪水模糊了双眼'],
      '浪漫': ['月光下的约会', '你的微笑如花绽放', '爱情的旋律在心中回响'],
      '激动': ['热血沸腾的瞬间', '追逐梦想的脚步', '胜利就在前方']
    }

    const moodTemplates = templates[options.mood as keyof typeof templates] || templates['快乐']
    return moodTemplates.join('\n')
  }, [])

  const generateChords = useCallback((options: GenerationOptions): string[] => {
    const keyChords: Record<string, string[]> = {
      'C Major': ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
      'G Major': ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#dim'],
      'A Minor': ['Am', 'Bdim', 'C', 'Dm', 'Em', 'F', 'G']
    }

    const chords = keyChords[options.key] || keyChords['C Major']
    return chords.slice(0, 4)
  }, [])

  const playMusic = useCallback((generation: MusicGeneration) => {
    if (audioRef.current) {
      if (isPlaying && selectedGeneration?.id === generation.id) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        setSelectedGeneration(generation)
        setIsPlaying(true)

        const playbackDuration = generation.duration * 1000
        const startTime = Date.now()

        const updateProgress = () => {
          const elapsed = Date.now() - startTime
          setCurrentTime(elapsed)

          if (elapsed < playbackDuration) {
            animationFrameRef.current = requestAnimationFrame(updateProgress)
          } else {
            setIsPlaying(false)
            setCurrentTime(0)
          }
        }

        updateProgress()
      }
    }
  }, [isPlaying, selectedGeneration])

  const downloadMusic = useCallback((generation: MusicGeneration) => {
    if (generation.audioUrl) {
      const link = document.createElement('a')
      link.href = generation.audioUrl
      link.download = `${generation.title}.wav`
      link.click()
      trackUserAction('download_music', 'button', { title: generation.title })
    }
  }, [trackUserAction])

  const renderWaveform = useCallback((generation: MusicGeneration, width: number, height: number) => {
    if (!generation.waveform) return null

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    if (ctx) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'
      ctx.strokeStyle = 'rgb(59, 130, 246)'
      ctx.lineWidth = 1

      const samplesPerPixel = Math.floor(generation.waveform.length / width)

      for (let x = 0; x < width; x++) {
        const start = x * samplesPerPixel
        const end = start + samplesPerPixel
        const slice = generation.waveform.slice(start, end)
        const amplitude = slice.reduce((sum, val) => sum + Math.abs(val), 0) / slice.length
        const barHeight = amplitude * height / 2

        ctx.fillRect(x, (height - barHeight) / 2, 1, barHeight)
      }

      if (isPlaying && selectedGeneration?.id === generation.id) {
        const progress = currentTime / (generation.duration * 1000)
        const progressX = progress * width

        ctx.strokeStyle = 'rgb(239, 68, 68)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(progressX, 0)
        ctx.lineTo(progressX, height)
        ctx.stroke()
      }
    }

    return canvas.toDataURL()
  }, [isPlaying, selectedGeneration, currentTime])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <div className={cn("bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700", className)}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🎵</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                智能音乐生成器
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI驱动的音乐创作工具
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {showAdvancedOptions ? '简化设置' : '高级设置'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 音乐风格选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            音乐风格
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {musicStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setOptions(prev => ({ ...prev, style: style.id }))}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all",
                  options.style === style.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{style.icon}</span>
                  <span className="font-medium text-sm">{style.name}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {style.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {style.characteristics.slice(0, 2).map((char, index) => (
                    <span
                      key={index}
                      className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 基础设置 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              音乐类型
            </label>
            <select
              value={options.genre}
              onChange={(e) => setOptions(prev => ({ ...prev, genre: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              情绪
            </label>
            <select
              value={options.mood}
              onChange={(e) => setOptions(prev => ({ ...prev, mood: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {moods.map(mood => (
                <option key={mood} value={mood}>{mood}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              时长 (秒)
            </label>
            <input
              type="range"
              min="15"
              max="300"
              step="15"
              value={options.duration}
              onChange={(e) => setOptions(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full"
            />
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {Math.floor(options.duration / 60)}:{(options.duration % 60).toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {showAdvancedOptions && (
          <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  节拍 (BPM)
                </label>
                <input
                  type="range"
                  min="60"
                  max="200"
                  step="5"
                  value={options.tempo}
                  onChange={(e) => setOptions(prev => ({ ...prev, tempo: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {options.tempo} BPM
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  调性
                </label>
                <select
                  value={options.key}
                  onChange={(e) => setOptions(prev => ({ ...prev, key: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {keys.map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                乐器组合
              </label>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {instruments.map(instrument => (
                  <label key={instrument} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={options.instruments.includes(instrument)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setOptions(prev => ({
                            ...prev,
                            instruments: [...prev.instruments, instrument]
                          }))
                        } else {
                          setOptions(prev => ({
                            ...prev,
                            instruments: prev.instruments.filter(i => i !== instrument)
                          }))
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {instrument}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                歌曲结构
              </label>
              <select
                value={options.structure}
                onChange={(e) => setOptions(prev => ({ ...prev, structure: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {structures.map(structure => (
                  <option key={structure} value={structure}>{structure}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeVocals}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeVocals: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">包含人声</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeLyrics}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeLyrics: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">生成歌词</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                复杂度
              </label>
              <div className="flex gap-2">
                {(['simple', 'medium', 'complex'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setOptions(prev => ({ ...prev, complexity: level }))}
                    className={cn(
                      "px-3 py-2 rounded-md text-sm transition-colors",
                      options.complexity === level
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    {level === 'simple' ? '简单' : level === 'medium' ? '中等' : '复杂'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                自定义提示词（可选）
              </label>
              <textarea
                value={options.customPrompt || ''}
                onChange={(e) => setOptions(prev => ({ ...prev, customPrompt: e.target.value }))}
                placeholder="描述您想要的音乐风格和特点..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* 生成按钮 */}
        <div className="flex justify-center">
          <button
            onClick={generateMusic}
            disabled={isGenerating || options.instruments.length === 0}
            className={cn(
              "px-8 py-3 rounded-lg font-medium transition-all flex items-center gap-2",
              isGenerating || options.instruments.length === 0
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl"
            )}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                正在生成音乐...
              </>
            ) : (
              <>
                <span>🎵</span>
                生成音乐
              </>
            )}
          </button>
        </div>

        {/* 生成历史 */}
        {generations.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              生成历史
            </h4>
            <div className="space-y-4">
              {generations.map((generation) => (
                <div
                  key={generation.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {generation.title}
                      </h5>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                          {generation.genre}
                        </span>
                        <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded">
                          {generation.mood}
                        </span>
                        <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded">
                          {generation.key}
                        </span>
                        <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded">
                          {generation.tempo} BPM
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {generation.instruments.join(', ')}
                      </p>
                      {generation.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {generation.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {generation.status === 'generating' && (
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      )}
                      {generation.status === 'completed' && (
                        <>
                          <button
                            onClick={() => playMusic(generation)}
                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition-colors"
                          >
                            {isPlaying && selectedGeneration?.id === generation.id ? '⏸️' : '▶️'}
                          </button>
                          <button
                            onClick={() => downloadMusic(generation)}
                            className="p-2 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-950/50 rounded transition-colors"
                          >
                            📥
                          </button>
                        </>
                      )}
                      {generation.status === 'error' && (
                        <span className="text-red-500 text-sm">❌ 生成失败</span>
                      )}
                    </div>
                  </div>

                  {generation.status === 'completed' && generation.waveform && (
                    <div className="mb-3">
                      <img
                        src={renderWaveform(generation, 400, 80)}
                        alt="Waveform"
                        className="w-full h-20 object-cover bg-gray-50 dark:bg-gray-800 rounded cursor-pointer"
                        onClick={() => playMusic(generation)}
                      />
                    </div>
                  )}

                  {generation.lyrics && (
                    <div className="mb-3">
                      <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        歌词:
                      </h6>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        {generation.lyrics}
                      </p>
                    </div>
                  )}

                  {generation.chords && (
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        和弦进行:
                      </h6>
                      <div className="flex flex-wrap gap-2">
                        {generation.chords.map((chord, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded font-mono"
                          >
                            {chord}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  )
}

export default SmartMusicGenerator
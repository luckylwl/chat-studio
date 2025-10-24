import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnalytics } from './AnalyticsProvider'
import { useAppStore } from '@/store'
import { cn } from '@/utils'

interface MediaFile {
  id: string
  name: string
  type: 'video' | 'audio' | 'image' | 'text'
  url: string
  duration?: number
  size: number
  thumbnail?: string
  metadata: {
    width?: number
    height?: number
    fps?: number
    bitrate?: number
    sampleRate?: number
    channels?: number
    format: string
    createdAt: number
  }
}

interface TimelineTrack {
  id: string
  type: 'video' | 'audio' | 'subtitle' | 'effect'
  name: string
  clips: TimelineClip[]
  enabled: boolean
  volume?: number
  opacity?: number
  color: string
}

interface TimelineClip {
  id: string
  mediaId: string
  startTime: number
  endTime: number
  trimStart: number
  trimEnd: number
  effects: Effect[]
  properties: {
    position?: { x: number; y: number }
    scale?: { x: number; y: number }
    rotation?: number
    opacity?: number
    volume?: number
  }
}

interface Effect {
  id: string
  type: 'filter' | 'transition' | 'text' | 'animation' | 'audio'
  name: string
  category: string
  parameters: Record<string, any>
  enabled: boolean
  startTime?: number
  duration?: number
}

interface AIGenerationTask {
  id: string
  type: 'video' | 'audio' | 'image' | 'script' | 'voice'
  prompt: string
  style?: string
  duration?: number
  format?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  result?: MediaFile
  parameters: Record<string, any>
  createdAt: number
}

interface VideoTemplate {
  id: string
  name: string
  description: string
  category: string
  thumbnail: string
  duration: number
  tracks: Omit<TimelineTrack, 'clips'>[]
  placeholders: {
    type: 'video' | 'audio' | 'image' | 'text'
    name: string
    position: { x: number; y: number }
    size: { width: number; height: number }
  }[]
}

const videoTemplates: VideoTemplate[] = [
  {
    id: 'social_media_post',
    name: '社交媒体短视频',
    description: '适合抖音、小红书等平台的竖屏短视频模板',
    category: '社交媒体',
    thumbnail: 'template_social.jpg',
    duration: 15,
    tracks: [
      { id: 'video1', type: 'video', name: '主视频', enabled: true, color: '#3B82F6' },
      { id: 'audio1', type: 'audio', name: '背景音乐', enabled: true, volume: 0.7, color: '#10B981' },
      { id: 'text1', type: 'subtitle', name: '字幕', enabled: true, color: '#F59E0B' }
    ],
    placeholders: [
      { type: 'video', name: '主视频', position: { x: 0, y: 0 }, size: { width: 1080, height: 1920 } },
      { type: 'text', name: '标题', position: { x: 540, y: 200 }, size: { width: 800, height: 100 } },
      { type: 'audio', name: '背景音乐', position: { x: 0, y: 0 }, size: { width: 0, height: 0 } }
    ]
  },
  {
    id: 'product_showcase',
    name: '产品展示视频',
    description: '专业的产品展示视频模板，适合电商和营销',
    category: '营销',
    thumbnail: 'template_product.jpg',
    duration: 30,
    tracks: [
      { id: 'video1', type: 'video', name: '产品视频', enabled: true, color: '#8B5CF6' },
      { id: 'video2', type: 'video', name: '背景视频', enabled: true, opacity: 0.3, color: '#EC4899' },
      { id: 'audio1', type: 'audio', name: '解说音频', enabled: true, volume: 0.8, color: '#10B981' },
      { id: 'text1', type: 'subtitle', name: '产品信息', enabled: true, color: '#F59E0B' }
    ],
    placeholders: [
      { type: 'video', name: '产品视频', position: { x: 0, y: 0 }, size: { width: 1920, height: 1080 } },
      { type: 'text', name: '产品标题', position: { x: 100, y: 100 }, size: { width: 600, height: 80 } },
      { type: 'text', name: '产品描述', position: { x: 100, y: 900 }, size: { width: 800, height: 100 } }
    ]
  },
  {
    id: 'educational_content',
    name: '教育内容视频',
    description: '适合在线教育和知识分享的视频模板',
    category: '教育',
    thumbnail: 'template_edu.jpg',
    duration: 300,
    tracks: [
      { id: 'video1', type: 'video', name: '主讲视频', enabled: true, color: '#0EA5E9' },
      { id: 'video2', type: 'video', name: '屏幕录制', enabled: true, color: '#6366F1' },
      { id: 'audio1', type: 'audio', name: '讲解音频', enabled: true, volume: 1.0, color: '#10B981' },
      { id: 'text1', type: 'subtitle', name: '知识点', enabled: true, color: '#F59E0B' }
    ],
    placeholders: [
      { type: 'video', name: '讲师视频', position: { x: 1200, y: 100 }, size: { width: 640, height: 360 } },
      { type: 'video', name: '课件内容', position: { x: 80, y: 100 }, size: { width: 1000, height: 800 } },
      { type: 'text', name: '课程标题', position: { x: 80, y: 50 }, size: { width: 800, height: 60 } }
    ]
  }
]

const effectLibrary: Effect[] = [
  {
    id: 'fade_in',
    type: 'transition',
    name: '淡入',
    category: '转场',
    parameters: { duration: 1.0 },
    enabled: true
  },
  {
    id: 'fade_out',
    type: 'transition',
    name: '淡出',
    category: '转场',
    parameters: { duration: 1.0 },
    enabled: true
  },
  {
    id: 'blur',
    type: 'filter',
    name: '模糊',
    category: '滤镜',
    parameters: { intensity: 5 },
    enabled: true
  },
  {
    id: 'brightness',
    type: 'filter',
    name: '亮度',
    category: '滤镜',
    parameters: { value: 1.2 },
    enabled: true
  },
  {
    id: 'color_correction',
    type: 'filter',
    name: '色彩校正',
    category: '滤镜',
    parameters: {
      saturation: 1.1,
      contrast: 1.05,
      warmth: 0.02
    },
    enabled: true
  },
  {
    id: 'zoom_in',
    type: 'animation',
    name: '放大动画',
    category: '动画',
    parameters: {
      startScale: 1.0,
      endScale: 1.2,
      duration: 2.0
    },
    enabled: true
  },
  {
    id: 'slide_in_left',
    type: 'animation',
    name: '左侧滑入',
    category: '动画',
    parameters: {
      startX: -100,
      endX: 0,
      duration: 1.0
    },
    enabled: true
  },
  {
    id: 'voice_enhance',
    type: 'audio',
    name: '人声增强',
    category: '音频',
    parameters: {
      noiseReduction: 0.7,
      clarity: 1.3
    },
    enabled: true
  },
  {
    id: 'echo',
    type: 'audio',
    name: '回声',
    category: '音频',
    parameters: {
      delay: 0.3,
      decay: 0.5
    },
    enabled: true
  }
]

interface MultimediaFusionProps {
  className?: string
}

export const MultimediaFusion: React.FC<MultimediaFusionProps> = ({ className }) => {
  const { t } = useTranslation()
  const { trackFeatureUsage, trackUserAction } = useAnalytics()
  const { user } = useAppStore()

  const [currentView, setCurrentView] = useState<'library' | 'editor' | 'ai_generate' | 'templates'>('library')
  const [mediaLibrary, setMediaLibrary] = useState<MediaFile[]>([])
  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([])
  const [timelineTracks, setTimelineTracks] = useState<TimelineTrack[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [totalDuration, setTotalDuration] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [selectedClip, setSelectedClip] = useState<TimelineClip | null>(null)
  const [aiTasks, setAITasks] = useState<AIGenerationTask[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null)
  const [exportSettings, setExportSettings] = useState({
    format: 'mp4',
    quality: 'high',
    resolution: '1920x1080',
    fps: 30,
    bitrate: 8000
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    trackFeatureUsage('multimedia_fusion')
    loadMediaLibrary()
  }, [trackFeatureUsage])

  const loadMediaLibrary = useCallback(() => {
    // 模拟加载媒体库
    const sampleMedia: MediaFile[] = [
      {
        id: 'sample_video_1',
        name: '样例视频1.mp4',
        type: 'video',
        url: 'sample_video_1.mp4',
        duration: 30,
        size: 15 * 1024 * 1024, // 15MB
        thumbnail: 'thumb_video_1.jpg',
        metadata: {
          width: 1920,
          height: 1080,
          fps: 30,
          bitrate: 4000,
          format: 'mp4',
          createdAt: Date.now() - 86400000
        }
      },
      {
        id: 'sample_audio_1',
        name: '背景音乐.mp3',
        type: 'audio',
        url: 'sample_audio_1.mp3',
        duration: 180,
        size: 8 * 1024 * 1024, // 8MB
        metadata: {
          sampleRate: 44100,
          channels: 2,
          bitrate: 320,
          format: 'mp3',
          createdAt: Date.now() - 172800000
        }
      },
      {
        id: 'sample_image_1',
        name: '背景图片.jpg',
        type: 'image',
        url: 'sample_image_1.jpg',
        size: 2 * 1024 * 1024, // 2MB
        thumbnail: 'sample_image_1.jpg',
        metadata: {
          width: 1920,
          height: 1080,
          format: 'jpg',
          createdAt: Date.now() - 259200000
        }
      }
    ]
    setMediaLibrary(sampleMedia)
  }, [])

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      const mediaFile: MediaFile = {
        id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: getFileType(file.type),
        url: URL.createObjectURL(file),
        size: file.size,
        metadata: {
          format: file.type,
          createdAt: Date.now()
        }
      }

      // 获取媒体信息
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video')
        video.src = mediaFile.url
        video.addEventListener('loadedmetadata', () => {
          mediaFile.duration = video.duration
          mediaFile.metadata.width = video.videoWidth
          mediaFile.metadata.height = video.videoHeight
          mediaFile.metadata.fps = 30 // 假设值
        })
      } else if (file.type.startsWith('audio/')) {
        const audio = document.createElement('audio')
        audio.src = mediaFile.url
        audio.addEventListener('loadedmetadata', () => {
          mediaFile.duration = audio.duration
        })
      } else if (file.type.startsWith('image/')) {
        const img = new Image()
        img.src = mediaFile.url
        img.addEventListener('load', () => {
          mediaFile.metadata.width = img.width
          mediaFile.metadata.height = img.height
        })
      }

      setMediaLibrary(prev => [...prev, mediaFile])
    }

    trackUserAction('upload_media', 'file', { fileCount: files.length })
  }, [trackUserAction])

  const getFileType = (mimeType: string): 'video' | 'audio' | 'image' | 'text' => {
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    if (mimeType.startsWith('image/')) return 'image'
    return 'text'
  }

  const addToTimeline = useCallback((media: MediaFile) => {
    const trackType = media.type
    let targetTrack = timelineTracks.find(track => track.type === trackType && track.clips.length === 0)

    if (!targetTrack) {
      const newTrack: TimelineTrack = {
        id: `track_${Date.now()}`,
        type: trackType,
        name: `${trackType === 'video' ? '视频' : trackType === 'audio' ? '音频' : '图片'}轨道 ${timelineTracks.filter(t => t.type === trackType).length + 1}`,
        clips: [],
        enabled: true,
        volume: trackType === 'audio' ? 0.8 : undefined,
        opacity: trackType === 'video' || trackType === 'image' ? 1.0 : undefined,
        color: trackType === 'video' ? '#3B82F6' : trackType === 'audio' ? '#10B981' : '#F59E0B'
      }
      setTimelineTracks(prev => [...prev, newTrack])
      targetTrack = newTrack
    }

    const newClip: TimelineClip = {
      id: `clip_${Date.now()}`,
      mediaId: media.id,
      startTime: totalDuration,
      endTime: totalDuration + (media.duration || 5),
      trimStart: 0,
      trimEnd: media.duration || 5,
      effects: [],
      properties: {
        opacity: 1.0,
        volume: 1.0
      }
    }

    setTimelineTracks(prev =>
      prev.map(track =>
        track.id === targetTrack!.id
          ? { ...track, clips: [...track.clips, newClip] }
          : track
      )
    )

    setTotalDuration(prev => Math.max(prev, newClip.endTime))
    trackUserAction('add_to_timeline', 'media', { mediaType: media.type })
  }, [timelineTracks, totalDuration, trackUserAction])

  const removeFromTimeline = useCallback((trackId: string, clipId: string) => {
    setTimelineTracks(prev =>
      prev.map(track =>
        track.id === trackId
          ? { ...track, clips: track.clips.filter(clip => clip.id !== clipId) }
          : track
      )
    )
    trackUserAction('remove_from_timeline', 'clip')
  }, [trackUserAction])

  const applyEffect = useCallback((clipId: string, effect: Effect) => {
    setTimelineTracks(prev =>
      prev.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId
            ? { ...clip, effects: [...clip.effects, { ...effect, id: `${effect.id}_${Date.now()}` }] }
            : clip
        )
      }))
    )
    trackUserAction('apply_effect', 'effect', { effectType: effect.type, effectName: effect.name })
  }, [trackUserAction])

  const generateAIContent = useCallback(async (type: AIGenerationTask['type'], prompt: string, parameters: Record<string, any> = {}) => {
    const task: AIGenerationTask = {
      id: `ai_task_${Date.now()}`,
      type,
      prompt,
      status: 'pending',
      progress: 0,
      parameters,
      createdAt: Date.now()
    }

    setAITasks(prev => [...prev, task])
    trackUserAction('start_ai_generation', 'ai', { type, promptLength: prompt.length })

    // 模拟AI生成过程
    const updateProgress = async () => {
      task.status = 'processing'

      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
        task.progress = progress
        setAITasks(prev => prev.map(t => t.id === task.id ? { ...task } : t))
      }

      // 模拟生成结果
      const generatedMedia: MediaFile = {
        id: `ai_generated_${Date.now()}`,
        name: `AI生成_${type}_${Date.now()}.${type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'jpg'}`,
        type: type === 'script' || type === 'voice' ? 'text' : type,
        url: `ai_generated_${task.id}.${type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'jpg'}`,
        duration: type === 'video' ? parameters.duration || 30 : type === 'audio' ? parameters.duration || 60 : undefined,
        size: Math.random() * 20 * 1024 * 1024, // Random size up to 20MB
        thumbnail: type === 'image' ? `ai_generated_${task.id}.jpg` : `ai_thumb_${task.id}.jpg`,
        metadata: {
          width: type === 'video' || type === 'image' ? 1920 : undefined,
          height: type === 'video' || type === 'image' ? 1080 : undefined,
          fps: type === 'video' ? 30 : undefined,
          format: type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'jpg',
          createdAt: Date.now()
        }
      }

      task.status = 'completed'
      task.result = generatedMedia
      setAITasks(prev => prev.map(t => t.id === task.id ? { ...task } : t))
      setMediaLibrary(prev => [...prev, generatedMedia])
    }

    updateProgress()
  }, [trackUserAction])

  const exportProject = useCallback(async () => {
    setIsExporting(true)
    setExportProgress(0)
    trackUserAction('start_export', 'project', exportSettings)

    // 模拟导出过程
    for (let progress = 0; progress <= 100; progress += 5) {
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200))
      setExportProgress(progress)
    }

    setIsExporting(false)
    setExportProgress(0)

    // 模拟下载
    const link = document.createElement('a')
    link.href = '#'
    link.download = `exported_video_${Date.now()}.${exportSettings.format}`
    link.click()

    trackUserAction('complete_export', 'project')
  }, [exportSettings, trackUserAction])

  const applyTemplate = useCallback((template: VideoTemplate) => {
    // 清空当前轨道
    setTimelineTracks([])

    // 应用模板轨道
    const newTracks: TimelineTrack[] = template.tracks.map(track => ({
      ...track,
      clips: []
    }))

    setTimelineTracks(newTracks)
    setTotalDuration(template.duration)
    setSelectedTemplate(template)
    setCurrentView('editor')

    trackUserAction('apply_template', 'template', { templateId: template.id })
  }, [trackUserAction])

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  const renderMediaLibrary = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          媒体库 ({mediaLibrary.length})
        </h4>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <span>📁</span>
            上传文件
          </button>
          <button
            onClick={() => setCurrentView('ai_generate')}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
          >
            <span>🤖</span>
            AI生成
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*,image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {mediaLibrary.map((media) => (
          <div
            key={media.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
            onClick={() => {
              if (selectedMedia.includes(media)) {
                setSelectedMedia(prev => prev.filter(m => m.id !== media.id))
              } else {
                setSelectedMedia(prev => [...prev, media])
              }
            }}
          >
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 relative overflow-hidden">
              {media.type === 'video' ? (
                <video
                  src={media.url}
                  className="w-full h-full object-cover"
                  muted
                />
              ) : media.type === 'image' ? (
                <img
                  src={media.url}
                  alt={media.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  {media.type === 'audio' ? '🎵' : '📄'}
                </div>
              )}

              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    addToTimeline(media)
                  }}
                  className="opacity-0 group-hover:opacity-100 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-all"
                >
                  ➕
                </button>
              </div>

              {media.duration && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(media.duration)}
                </div>
              )}

              {selectedMedia.includes(media) && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                  ✓
                </div>
              )}
            </div>

            <div className="space-y-1">
              <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                {media.name}
              </h5>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{formatFileSize(media.size)}</span>
                {media.metadata.width && media.metadata.height && (
                  <span>{media.metadata.width}×{media.metadata.height}</span>
                )}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                {new Date(media.metadata.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedMedia.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            已选择 {selectedMedia.length} 个文件
          </span>
          <button
            onClick={() => {
              selectedMedia.forEach(media => addToTimeline(media))
              setSelectedMedia([])
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            添加到时间轴
          </button>
          <button
            onClick={() => setSelectedMedia([])}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            取消选择
          </button>
        </div>
      )}
    </div>
  )

  const renderTimeline = () => (
    <div className="space-y-4">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
          >
            {isPlaying ? '⏸️' : '▶️'}
          </button>
          <div className="text-sm font-mono">
            {formatDuration(currentTime)} / {formatDuration(totalDuration)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-400">缩放:</label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-24"
          />
          <span className="text-sm font-mono w-12">{zoom.toFixed(1)}x</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('templates')}
            className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
          >
            模板
          </button>
          <button
            onClick={exportProject}
            disabled={isExporting || timelineTracks.every(track => track.clips.length === 0)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              isExporting || timelineTracks.every(track => track.clips.length === 0)
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600"
            )}
          >
            {isExporting ? `导出中... ${exportProgress}%` : '导出'}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div
        ref={timelineRef}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
      >
        {/* Timeline Header */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <div className="w-48 p-3 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">轨道</span>
          </div>
          <div className="flex-1 p-2 bg-gray-50 dark:bg-gray-800 relative">
            {/* Time Ruler */}
            <div className="h-6 relative">
              {Array.from({ length: Math.ceil(totalDuration / 10) + 1 }, (_, i) => i * 10).map(time => (
                <div
                  key={time}
                  className="absolute top-0 bottom-0 border-l border-gray-300 dark:border-gray-600"
                  style={{ left: `${(time / totalDuration) * 100}%` }}
                >
                  <span className="absolute top-0 left-1 text-xs text-gray-500 dark:text-gray-400">
                    {formatDuration(time)}
                  </span>
                </div>
              ))}
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                style={{ left: `${(currentTime / totalDuration) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tracks */}
        {timelineTracks.map((track) => (
          <div key={track.id} className="flex border-b border-gray-100 dark:border-gray-800 last:border-b-0">
            <div className="w-48 p-3 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={track.enabled}
                  onChange={(e) => {
                    setTimelineTracks(prev =>
                      prev.map(t => t.id === track.id ? { ...t, enabled: e.target.checked } : t)
                    )
                  }}
                />
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: track.color }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {track.name}
                </span>
              </div>
              {track.type === 'audio' && track.volume !== undefined && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">音量:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={track.volume}
                    onChange={(e) => {
                      setTimelineTracks(prev =>
                        prev.map(t => t.id === track.id ? { ...t, volume: parseFloat(e.target.value) } : t)
                      )
                    }}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-8">{Math.round(track.volume * 100)}%</span>
                </div>
              )}
            </div>

            <div className="flex-1 p-2 relative min-h-[60px]">
              {track.clips.map((clip) => {
                const media = mediaLibrary.find(m => m.id === clip.mediaId)
                if (!media) return null

                const clipWidth = ((clip.endTime - clip.startTime) / totalDuration) * 100
                const clipLeft = (clip.startTime / totalDuration) * 100

                return (
                  <div
                    key={clip.id}
                    className={cn(
                      "absolute top-1 bottom-1 rounded border-2 cursor-pointer transition-all",
                      selectedClip?.id === clip.id
                        ? "border-blue-500 bg-blue-100 dark:bg-blue-950/50"
                        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500"
                    )}
                    style={{
                      left: `${clipLeft}%`,
                      width: `${clipWidth}%`,
                      backgroundColor: `${track.color}20`
                    }}
                    onClick={() => setSelectedClip(selectedClip?.id === clip.id ? null : clip)}
                  >
                    <div className="p-2 h-full flex items-center">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                          {media.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDuration(clip.endTime - clip.startTime)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromTimeline(track.id, clip.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 ml-2"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Effects indicator */}
                    {clip.effects.length > 0 && (
                      <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500 rounded-full" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {timelineTracks.length === 0 && (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-lg font-medium mb-2">时间轴为空</h3>
            <p className="text-sm mb-4">从媒体库拖拽文件到这里开始编辑</p>
            <button
              onClick={() => setCurrentView('library')}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              浏览媒体库
            </button>
          </div>
        )}
      </div>

      {/* Effects Panel */}
      {selectedClip && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
            特效和属性
          </h4>

          <div className="space-y-4">
            {/* Clip Properties */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">基本属性</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">不透明度</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={selectedClip.properties.opacity || 1}
                    onChange={(e) => {
                      const newOpacity = parseFloat(e.target.value)
                      setTimelineTracks(prev =>
                        prev.map(track => ({
                          ...track,
                          clips: track.clips.map(clip =>
                            clip.id === selectedClip.id
                              ? { ...clip, properties: { ...clip.properties, opacity: newOpacity } }
                              : clip
                          )
                        }))
                      )
                    }}
                    className="w-full"
                  />
                  <div className="text-xs text-center text-gray-500 mt-1">
                    {Math.round((selectedClip.properties.opacity || 1) * 100)}%
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">音量</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={selectedClip.properties.volume || 1}
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value)
                      setTimelineTracks(prev =>
                        prev.map(track => ({
                          ...track,
                          clips: track.clips.map(clip =>
                            clip.id === selectedClip.id
                              ? { ...clip, properties: { ...clip.properties, volume: newVolume } }
                              : clip
                          )
                        }))
                      )
                    }}
                    className="w-full"
                  />
                  <div className="text-xs text-center text-gray-500 mt-1">
                    {Math.round((selectedClip.properties.volume || 1) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Effects Library */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">添加特效</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {effectLibrary.map((effect) => (
                  <button
                    key={effect.id}
                    onClick={() => applyEffect(selectedClip.id, effect)}
                    className="p-2 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    {effect.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Applied Effects */}
            {selectedClip.effects.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  已应用的特效 ({selectedClip.effects.length})
                </h5>
                <div className="space-y-2">
                  {selectedClip.effects.map((effect, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                      <span className="text-sm text-gray-900 dark:text-gray-100">{effect.name}</span>
                      <button
                        onClick={() => {
                          setTimelineTracks(prev =>
                            prev.map(track => ({
                              ...track,
                              clips: track.clips.map(clip =>
                                clip.id === selectedClip.id
                                  ? { ...clip, effects: clip.effects.filter((_, i) => i !== index) }
                                  : clip
                              )
                            }))
                          )
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        移除
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const renderAIGenerate = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          AI内容生成
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          使用AI技术生成视频、音频、图片和脚本内容
        </p>
      </div>

      {/* AI Generation Forms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video Generation */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎥</span>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">AI视频生成</h4>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.target as HTMLFormElement)
            generateAIContent('video', formData.get('prompt') as string, {
              style: formData.get('style'),
              duration: parseInt(formData.get('duration') as string),
              resolution: formData.get('resolution')
            })
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  视频描述
                </label>
                <textarea
                  name="prompt"
                  placeholder="描述您想要生成的视频内容..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    风格
                  </label>
                  <select
                    name="style"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="realistic">写实</option>
                    <option value="cartoon">卡通</option>
                    <option value="anime">动漫</option>
                    <option value="documentary">纪录片</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    时长(秒)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    min="5"
                    max="300"
                    defaultValue="30"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                生成视频
              </button>
            </div>
          </form>
        </div>

        {/* Audio Generation */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🎵</span>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">AI音频生成</h4>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.target as HTMLFormElement)
            generateAIContent('audio', formData.get('prompt') as string, {
              type: formData.get('type'),
              duration: parseInt(formData.get('duration') as string),
              mood: formData.get('mood')
            })
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  音频描述
                </label>
                <textarea
                  name="prompt"
                  placeholder="描述您想要生成的音频内容..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    类型
                  </label>
                  <select
                    name="type"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="music">音乐</option>
                    <option value="voice">语音</option>
                    <option value="sfx">音效</option>
                    <option value="ambient">环境音</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    时长(秒)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    min="5"
                    max="600"
                    defaultValue="60"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                生成音频
              </button>
            </div>
          </form>
        </div>

        {/* Image Generation */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🖼️</span>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">AI图像生成</h4>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.target as HTMLFormData)
            generateAIContent('image', formData.get('prompt') as string, {
              style: formData.get('style'),
              resolution: formData.get('resolution'),
              aspectRatio: formData.get('aspectRatio')
            })
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  图像描述
                </label>
                <textarea
                  name="prompt"
                  placeholder="描述您想要生成的图像..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    风格
                  </label>
                  <select
                    name="style"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="photorealistic">写实照片</option>
                    <option value="digital_art">数字艺术</option>
                    <option value="oil_painting">油画</option>
                    <option value="watercolor">水彩画</option>
                    <option value="cartoon">卡通</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    宽高比
                  </label>
                  <select
                    name="aspectRatio"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="16:9">16:9 (横屏)</option>
                    <option value="9:16">9:16 (竖屏)</option>
                    <option value="1:1">1:1 (正方形)</option>
                    <option value="4:3">4:3 (标准)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition-colors font-medium"
              >
                生成图像
              </button>
            </div>
          </form>
        </div>

        {/* Script Generation */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📝</span>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">AI脚本生成</h4>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.target as HTMLFormElement)
            generateAIContent('script', formData.get('prompt') as string, {
              type: formData.get('type'),
              duration: parseInt(formData.get('duration') as string),
              tone: formData.get('tone')
            })
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  脚本主题
                </label>
                <textarea
                  name="prompt"
                  placeholder="描述视频脚本的主题和要点..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    类型
                  </label>
                  <select
                    name="type"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="educational">教育内容</option>
                    <option value="entertainment">娱乐内容</option>
                    <option value="marketing">营销推广</option>
                    <option value="documentary">纪录片</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    语调
                  </label>
                  <select
                    name="tone"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="professional">专业</option>
                    <option value="casual">轻松</option>
                    <option value="humorous">幽默</option>
                    <option value="serious">严肃</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
              >
                生成脚本
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* AI Generation Tasks */}
      {aiTasks.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            生成任务 ({aiTasks.length})
          </h4>
          <div className="space-y-3">
            {aiTasks.map((task) => (
              <div key={task.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {task.type === 'video' ? '🎥' : task.type === 'audio' ? '🎵' : task.type === 'image' ? '🖼️' : '📝'}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {task.type === 'video' ? 'AI视频生成' : task.type === 'audio' ? 'AI音频生成' : task.type === 'image' ? 'AI图像生成' : 'AI脚本生成'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {task.prompt.substring(0, 50)}...
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    task.status === 'pending' && 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
                    task.status === 'processing' && 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
                    task.status === 'completed' && 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400',
                    task.status === 'failed' && 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                  )}>
                    {task.status === 'pending' && '等待中'}
                    {task.status === 'processing' && '生成中'}
                    {task.status === 'completed' && '完成'}
                    {task.status === 'failed' && '失败'}
                  </div>
                </div>

                {task.status === 'processing' && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                )}

                {task.status === 'completed' && task.result && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        生成完成: {task.result.name}
                      </span>
                    </div>
                    <button
                      onClick={() => addToTimeline(task.result!)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                    >
                      添加到时间轴
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          视频模板
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          选择专业模板快速开始您的视频创作
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videoTemplates.map((template) => (
          <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
              <img
                src={template.thumbnail}
                alt={template.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbGUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiANCTx3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzMzMzMzMzIBa '
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                <button
                  onClick={() => applyTemplate(template)}
                  className="opacity-0 hover:opacity-100 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all"
                >
                  使用模板
                </button>
              </div>

              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {formatDuration(template.duration)}
              </div>

              <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                {template.category}
              </div>
            </div>

            <div className="p-4">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {template.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {template.description}
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>轨道数: {template.tracks.length}</span>
                  <span>•</span>
                  <span>占位符: {template.placeholders.length}</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.tracks.map((track) => (
                    <span
                      key={track.id}
                      className="px-2 py-1 text-xs rounded"
                      style={{
                        backgroundColor: `${track.color}20`,
                        color: track.color
                      }}
                    >
                      {track.name}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => applyTemplate(template)}
                className="w-full mt-3 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                使用此模板
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className={cn("bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700", className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🎬</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                多媒体融合工作室
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI驱动的视频音频创作平台
              </p>
            </div>
          </div>

          {/* View Navigation */}
          <div className="flex items-center gap-2">
            {[
              { id: 'library', name: '媒体库', icon: '📁' },
              { id: 'editor', name: '编辑器', icon: '✂️' },
              { id: 'ai_generate', name: 'AI生成', icon: '🤖' },
              { id: 'templates', name: '模板', icon: '📄' }
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id as any)}
                className={cn(
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  currentView === view.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                <span className="mr-1">{view.icon}</span>
                {view.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {currentView === 'library' && renderMediaLibrary()}
        {currentView === 'editor' && renderTimeline()}
        {currentView === 'ai_generate' && renderAIGenerate()}
        {currentView === 'templates' && renderTemplates()}
      </div>
    </div>
  )
}

export default MultimediaFusion
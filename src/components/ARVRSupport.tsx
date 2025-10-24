import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnalytics } from './AnalyticsProvider'
import { useAppStore } from '@/store'
import { cn } from '@/utils'

interface ARVRDevice {
  id: string
  name: string
  type: 'ar' | 'vr' | 'mixed'
  capabilities: string[]
  supported: boolean
  connected: boolean
  specifications: {
    resolution: string
    refreshRate: number
    fieldOfView: number
    tracking: string[]
    controllers: boolean
    handTracking: boolean
    eyeTracking: boolean
  }
}

interface ARVRExperience {
  id: string
  title: string
  description: string
  type: 'ar' | 'vr' | 'mixed'
  category: 'education' | 'entertainment' | 'productivity' | 'social' | 'training'
  thumbnail: string
  duration?: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  requirements: string[]
  features: string[]
  rating: number
  downloads: number
  createdAt: number
}

interface SpatialObject {
  id: string
  name: string
  type: '3d_model' | 'hologram' | 'ui_panel' | 'virtual_screen' | 'annotation'
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  properties: {
    visible: boolean
    interactive: boolean
    persistent: boolean
    physics: boolean
    color?: string
    opacity?: number
    material?: string
    texture?: string
  }
  animations: {
    type: 'rotation' | 'scale' | 'position' | 'opacity'
    duration: number
    loop: boolean
    autoStart: boolean
    keyframes: Record<string, any>[]
  }[]
  behaviors: {
    onGaze: string[]
    onClick: string[]
    onGesture: string[]
    onVoice: string[]
  }
}

interface ARVRSession {
  id: string
  experienceId: string
  startTime: number
  endTime?: number
  duration?: number
  deviceType: 'ar' | 'vr' | 'mixed'
  interactions: {
    type: 'gaze' | 'gesture' | 'voice' | 'controller' | 'hand'
    timestamp: number
    objectId?: string
    data: Record<string, any>
  }[]
  performance: {
    avgFPS: number
    minFPS: number
    maxFPS: number
    latency: number
    batteryUsage: number
  }
  spatialData: {
    roomScan?: ArrayBuffer
    anchors: { id: string; position: { x: number; y: number; z: number } }[]
    trackingQuality: 'poor' | 'fair' | 'good' | 'excellent'
  }
}

const supportedDevices: ARVRDevice[] = [
  {
    id: 'meta_quest_3',
    name: 'Meta Quest 3',
    type: 'mixed',
    capabilities: ['6dof_tracking', 'hand_tracking', 'passthrough', 'spatial_anchors'],
    supported: true,
    connected: false,
    specifications: {
      resolution: '2064x2208 per eye',
      refreshRate: 120,
      fieldOfView: 110,
      tracking: ['inside_out', 'hand_tracking'],
      controllers: true,
      handTracking: true,
      eyeTracking: false
    }
  },
  {
    id: 'apple_vision_pro',
    name: 'Apple Vision Pro',
    type: 'mixed',
    capabilities: ['eye_tracking', 'hand_tracking', 'spatial_computing', 'passthrough'],
    supported: true,
    connected: false,
    specifications: {
      resolution: '3660x3200 per eye',
      refreshRate: 90,
      fieldOfView: 120,
      tracking: ['inside_out', 'eye_tracking', 'hand_tracking'],
      controllers: false,
      handTracking: true,
      eyeTracking: true
    }
  },
  {
    id: 'hololens_2',
    name: 'Microsoft HoloLens 2',
    type: 'ar',
    capabilities: ['spatial_mapping', 'gesture_recognition', 'voice_commands'],
    supported: true,
    connected: false,
    specifications: {
      resolution: '2048x1080 per eye',
      refreshRate: 60,
      fieldOfView: 52,
      tracking: ['inside_out', 'hand_tracking'],
      controllers: false,
      handTracking: true,
      eyeTracking: true
    }
  },
  {
    id: 'webxr_browser',
    name: 'WebXR Browser',
    type: 'mixed',
    capabilities: ['web_based', 'cross_platform', 'progressive'],
    supported: true,
    connected: typeof navigator !== 'undefined' && 'xr' in navigator,
    specifications: {
      resolution: 'Device dependent',
      refreshRate: 60,
      fieldOfView: 90,
      tracking: ['device_dependent'],
      controllers: true,
      handTracking: false,
      eyeTracking: false
    }
  }
]

const arvrExperiences: ARVRExperience[] = [
  {
    id: 'ai_chat_space',
    title: 'AI对话空间',
    description: '在虚拟现实环境中与AI进行自然对话，体验沉浸式聊天',
    type: 'vr',
    category: 'social',
    thumbnail: 'ar_chat_space.jpg',
    duration: 30,
    difficulty: 'beginner',
    requirements: ['VR头显', '手部追踪'],
    features: ['3D环境', '语音识别', '手势交互', '个性化虚拟形象'],
    rating: 4.8,
    downloads: 15420,
    createdAt: Date.now() - 2592000000
  },
  {
    id: 'knowledge_ar',
    title: '知识增强现实',
    description: '通过AR技术将知识可视化，实现交互式学习体验',
    type: 'ar',
    category: 'education',
    thumbnail: 'knowledge_ar.jpg',
    duration: 45,
    difficulty: 'intermediate',
    requirements: ['AR设备', '摄像头'],
    features: ['实时标注', '3D模型', '交互式教学', '知识图谱'],
    rating: 4.6,
    downloads: 8730,
    createdAt: Date.now() - 1296000000
  },
  {
    id: 'virtual_workspace',
    title: '虚拟工作空间',
    description: '在VR中创建个人工作环境，提高生产力和专注度',
    type: 'vr',
    category: 'productivity',
    thumbnail: 'virtual_workspace.jpg',
    duration: 120,
    difficulty: 'advanced',
    requirements: ['VR头显', '控制器', '高性能PC'],
    features: ['多屏幕支持', '手势操作', '虚拟键盘', '文件管理'],
    rating: 4.7,
    downloads: 12350,
    createdAt: Date.now() - 864000000
  },
  {
    id: 'meditation_garden',
    title: '冥想花园',
    description: '在宁静的虚拟花园中进行冥想和放松练习',
    type: 'vr',
    category: 'entertainment',
    thumbnail: 'meditation_garden.jpg',
    duration: 20,
    difficulty: 'beginner',
    requirements: ['VR头显'],
    features: ['自然环境', '引导冥想', '放松音乐', '呼吸练习'],
    rating: 4.9,
    downloads: 25680,
    createdAt: Date.now() - 432000000
  },
  {
    id: 'skill_training_sim',
    title: '技能训练模拟器',
    description: '通过VR模拟进行各种技能训练，安全有效地提升能力',
    type: 'vr',
    category: 'training',
    thumbnail: 'skill_training.jpg',
    duration: 60,
    difficulty: 'intermediate',
    requirements: ['VR头显', '手部追踪', '足够的活动空间'],
    features: ['实时反馈', '进度跟踪', '多种场景', '技能评估'],
    rating: 4.5,
    downloads: 9840,
    createdAt: Date.now() - 1728000000
  }
]

interface ARVRSupportProps {
  className?: string
}

export const ARVRSupport: React.FC<ARVRSupportProps> = ({ className }) => {
  const { t } = useTranslation()
  const { trackFeatureUsage, trackUserAction } = useAnalytics()
  const { user } = useAppStore()

  const [currentView, setCurrentView] = useState<'dashboard' | 'experiences' | 'creator' | 'sessions' | 'settings'>('dashboard')
  const [connectedDevices, setConnectedDevices] = useState<ARVRDevice[]>([])
  const [isXRSupported, setIsXRSupported] = useState(false)
  const [currentSession, setCurrentSession] = useState<ARVRSession | null>(null)
  const [spatialObjects, setSpatialObjects] = useState<SpatialObject[]>([])
  const [selectedExperience, setSelectedExperience] = useState<ARVRExperience | null>(null)
  const [isInXR, setIsInXR] = useState(false)
  const [vrSettings, setVRSettings] = useState({
    comfort: 'moderate', // comfortable, moderate, intense
    teleportation: true,
    smoothTurning: false,
    hapticFeedback: true,
    audioPanning: true,
    ipd: 63, // interpupillary distance in mm
    playAreaBounds: true
  })
  const [arSettings, setARSettings] = useState({
    occlusion: true,
    lightEstimation: true,
    planeDetection: true,
    handTracking: true,
    eyeTracking: false,
    spatialAudio: true,
    environmentBlending: 'additive' // additive, alpha-blend, opaque
  })

  const xrSessionRef = useRef<any>(null)
  const animationFrameRef = useRef<number>()

  useEffect(() => {
    trackFeatureUsage('ar_vr_support')
    checkXRSupport()
    detectDevices()
  }, [trackFeatureUsage])

  const checkXRSupport = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      try {
        const vrSupported = await (navigator as any).xr.isSessionSupported('immersive-vr')
        const arSupported = await (navigator as any).xr.isSessionSupported('immersive-ar')
        setIsXRSupported(vrSupported || arSupported)
      } catch (error) {
        console.log('WebXR not fully supported:', error)
        setIsXRSupported(false)
      }
    }
  }, [])

  const detectDevices = useCallback(() => {
    // 模拟设备检测
    const detectedDevices = supportedDevices.map(device => ({
      ...device,
      connected: device.id === 'webxr_browser' && isXRSupported ? true : Math.random() > 0.7
    }))
    setConnectedDevices(detectedDevices.filter(d => d.connected))
  }, [isXRSupported])

  const startXRSession = useCallback(async (experienceId: string, mode: 'immersive-vr' | 'immersive-ar' = 'immersive-vr') => {
    if (!isXRSupported || !navigator.xr) {
      alert('您的设备不支持WebXR')
      return
    }

    try {
      const session = await (navigator as any).xr.requestSession(mode, {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['hand-tracking', 'hit-test', 'dom-overlay']
      })

      xrSessionRef.current = session

      // 创建会话记录
      const newSession: ARVRSession = {
        id: `session_${Date.now()}`,
        experienceId,
        startTime: Date.now(),
        deviceType: mode.includes('vr') ? 'vr' : 'ar',
        interactions: [],
        performance: {
          avgFPS: 0,
          minFPS: 0,
          maxFPS: 0,
          latency: 0,
          batteryUsage: 0
        },
        spatialData: {
          anchors: [],
          trackingQuality: 'good'
        }
      }

      setCurrentSession(newSession)
      setIsInXR(true)

      // 设置渲染循环
      const render = (time: number, frame: any) => {
        // 这里应该是WebXR渲染逻辑
        // 由于这是演示，我们只是更新性能数据
        if (newSession) {
          newSession.performance.avgFPS = 90 + Math.random() * 10
        }

        if (session && !session.ended) {
          session.requestAnimationFrame(render)
        }
      }

      session.requestAnimationFrame(render)

      session.addEventListener('end', () => {
        setIsInXR(false)
        setCurrentSession(null)
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      })

      trackUserAction('start_xr_session', 'session', { experienceId, mode })

    } catch (error) {
      console.error('Failed to start XR session:', error)
      alert('启动XR会话失败，请检查设备兼容性')
    }
  }, [isXRSupported, trackUserAction])

  const endXRSession = useCallback(() => {
    if (xrSessionRef.current && !xrSessionRef.current.ended) {
      xrSessionRef.current.end()
    }
  }, [])

  const createSpatialObject = useCallback((type: SpatialObject['type'], position: { x: number; y: number; z: number }) => {
    const newObject: SpatialObject = {
      id: `object_${Date.now()}`,
      name: `${type}_${spatialObjects.length + 1}`,
      type,
      position,
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      properties: {
        visible: true,
        interactive: true,
        persistent: false,
        physics: false,
        opacity: 1.0
      },
      animations: [],
      behaviors: {
        onGaze: [],
        onClick: [],
        onGesture: [],
        onVoice: []
      }
    }

    setSpatialObjects(prev => [...prev, newObject])
    trackUserAction('create_spatial_object', 'object', { type, objectId: newObject.id })
  }, [spatialObjects, trackUserAction])

  const launchExperience = useCallback((experience: ARVRExperience) => {
    setSelectedExperience(experience)

    if (experience.type === 'vr') {
      startXRSession(experience.id, 'immersive-vr')
    } else if (experience.type === 'ar') {
      startXRSession(experience.id, 'immersive-ar')
    }

    trackUserAction('launch_experience', 'experience', {
      experienceId: experience.id,
      type: experience.type,
      category: experience.category
    })
  }, [startXRSession, trackUserAction])

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}小时${mins}分钟`
    }
    return `${mins}分钟`
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* WebXR Support Status */}
      <div className={cn(
        "p-6 rounded-xl border",
        isXRSupported
          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
          : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
      )}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{isXRSupported ? '✅' : '❌'}</span>
          <div>
            <h4 className="font-semibold text-lg">
              {isXRSupported ? 'WebXR 已支持' : 'WebXR 不支持'}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isXRSupported
                ? '您的浏览器支持WebXR，可以体验AR/VR功能'
                : '您的浏览器不支持WebXR，请使用支持的浏览器或设备'}
            </p>
          </div>
        </div>

        {!isXRSupported && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
            <h5 className="font-medium mb-2">推荐的浏览器和设备:</h5>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Chrome 79+ (Android/Windows)</li>
              <li>• Edge 79+ (Windows Mixed Reality)</li>
              <li>• Firefox Reality (VR头显)</li>
              <li>• Oculus Browser (Quest系列)</li>
              <li>• Safari (iOS 14.3+，部分功能)</li>
            </ul>
          </div>
        )}
      </div>

      {/* Connected Devices */}
      {connectedDevices.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            已连接设备 ({connectedDevices.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectedDevices.map((device) => (
              <div key={device.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {device.type === 'vr' ? '🥽' : device.type === 'ar' ? '👓' : '🔮'}
                    </span>
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-gray-100">
                        {device.name}
                      </h5>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={cn(
                          'w-2 h-2 rounded-full',
                          device.connected ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                        <span className="text-gray-600 dark:text-gray-400">
                          {device.connected ? '已连接' : '未连接'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={cn(
                    'px-2 py-1 text-xs rounded-full',
                    device.type === 'vr' && 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
                    device.type === 'ar' && 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
                    device.type === 'mixed' && 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                  )}>
                    {device.type.toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">分辨率:</span>
                    <span className="text-gray-900 dark:text-gray-100">{device.specifications.resolution}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">刷新率:</span>
                    <span className="text-gray-900 dark:text-gray-100">{device.specifications.refreshRate}Hz</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">视场角:</span>
                    <span className="text-gray-900 dark:text-gray-100">{device.specifications.fieldOfView}°</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-1">
                    {device.capabilities.slice(0, 3).map((capability) => (
                      <span
                        key={capability}
                        className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                      >
                        {capability.replace('_', ' ')}
                      </span>
                    ))}
                    {device.capabilities.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        +{device.capabilities.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setCurrentView('experiences')}
          className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-center group"
        >
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🌟</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">体验库</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">浏览AR/VR体验</div>
        </button>

        <button
          onClick={() => setCurrentView('creator')}
          className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-center group"
        >
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🔧</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">创作工具</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">创建AR/VR内容</div>
        </button>

        <button
          onClick={() => setCurrentView('sessions')}
          className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-center group"
        >
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">📊</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">使用记录</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">查看使用数据</div>
        </button>

        <button
          onClick={() => setCurrentView('settings')}
          className="p-6 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-center group"
        >
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">⚙️</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">设置</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">配置AR/VR参数</div>
        </button>
      </div>

      {/* Current Session Status */}
      {currentSession && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-pulse">🔴</span>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  XR会话进行中
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedExperience?.title || '未知体验'}
                </p>
              </div>
            </div>
            <button
              onClick={endXRSession}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              结束会话
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {Math.round(currentSession.performance.avgFPS)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">FPS</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {Math.round((Date.now() - currentSession.startTime) / 1000 / 60)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">分钟</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {currentSession.interactions.length}
              </div>
              <div className="text-gray-600 dark:text-gray-400">交互</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {currentSession.spatialData.trackingQuality}
              </div>
              <div className="text-gray-600 dark:text-gray-400">追踪质量</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderExperiences = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            AR/VR 体验库
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            探索精心设计的沉浸式体验
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['all', 'ar', 'vr', 'mixed'].map((filter) => (
            <button
              key={filter}
              className={cn(
                'px-3 py-1 text-sm rounded-md transition-colors',
                filter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {filter === 'all' ? '全部' : filter.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {arvrExperiences.map((experience) => (
          <div key={experience.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
              <img
                src={experience.thumbnail}
                alt={experience.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE2MCIgeT0iOTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiPkFSL1ZSIEV4cGVyaWVuY2U8L3RleHQ+Cjwvc3ZnPg=='
                }}
              />

              <div className="absolute top-2 left-2 flex items-center gap-2">
                <span className={cn(
                  'px-2 py-1 text-xs rounded-full text-white font-medium',
                  experience.type === 'vr' && 'bg-blue-500',
                  experience.type === 'ar' && 'bg-green-500',
                  experience.type === 'mixed' && 'bg-purple-500'
                )}>
                  {experience.type.toUpperCase()}
                </span>
                <span className="px-2 py-1 text-xs bg-black bg-opacity-75 text-white rounded-full">
                  {experience.category}
                </span>
              </div>

              {experience.duration && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(experience.duration)}
                </div>
              )}

              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                <button
                  onClick={() => launchExperience(experience)}
                  disabled={!isXRSupported}
                  className={cn(
                    'opacity-0 hover:opacity-100 px-6 py-3 rounded-lg font-medium transition-all',
                    isXRSupported
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  )}
                >
                  {experience.type === 'vr' ? '进入VR' : '启动AR'}
                </button>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight">
                  {experience.title}
                </h4>
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-yellow-500">⭐</span>
                  <span className="text-sm font-medium">{experience.rating}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {experience.description}
              </p>

              <div className="flex items-center gap-2 mb-3">
                <span className={cn(
                  'px-2 py-1 text-xs rounded-full',
                  experience.difficulty === 'beginner' && 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
                  experience.difficulty === 'intermediate' && 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
                  experience.difficulty === 'advanced' && 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                )}>
                  {experience.difficulty === 'beginner' && '初级'}
                  {experience.difficulty === 'intermediate' && '中级'}
                  {experience.difficulty === 'advanced' && '高级'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {experience.downloads.toLocaleString()} 下载
                </span>
              </div>

              <div className="space-y-2">
                <details>
                  <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
                    功能特性
                  </summary>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {experience.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </details>

                <details>
                  <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-gray-100">
                    设备要求
                  </summary>
                  <ul className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {experience.requirements.map((req, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              </div>

              <button
                onClick={() => launchExperience(experience)}
                disabled={!isXRSupported}
                className={cn(
                  'w-full mt-4 py-3 px-4 rounded-lg font-medium transition-colors',
                  isXRSupported
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                )}
              >
                {isXRSupported ? '启动体验' : '设备不兼容'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderCreator = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          AR/VR 创作工具
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          创建您自己的沉浸式体验
        </p>
      </div>

      {/* Spatial Objects Management */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          空间对象 ({spatialObjects.length})
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { type: '3d_model', name: '3D模型', icon: '🗿' },
            { type: 'hologram', name: '全息图', icon: '✨' },
            { type: 'ui_panel', name: 'UI面板', icon: '📱' },
            { type: 'virtual_screen', name: '虚拟屏幕', icon: '📺' },
            { type: 'annotation', name: '标注', icon: '📝' }
          ].map(({ type, name, icon }) => (
            <button
              key={type}
              onClick={() => createSpatialObject(type as SpatialObject['type'], { x: 0, y: 0, z: -2 })}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-center"
            >
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{name}</div>
            </button>
          ))}
        </div>

        {spatialObjects.length > 0 && (
          <div className="space-y-3">
            <h5 className="font-medium text-gray-900 dark:text-gray-100">已创建的对象:</h5>
            {spatialObjects.map((object) => (
              <div key={object.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {object.type === '3d_model' ? '🗿' :
                       object.type === 'hologram' ? '✨' :
                       object.type === 'ui_panel' ? '📱' :
                       object.type === 'virtual_screen' ? '📺' : '📝'}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {object.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={object.properties.visible}
                        onChange={(e) => {
                          setSpatialObjects(prev =>
                            prev.map(obj =>
                              obj.id === object.id
                                ? { ...obj, properties: { ...obj.properties, visible: e.target.checked } }
                                : obj
                            )
                          )
                        }}
                        className="mr-1"
                      />
                      可见
                    </label>
                    <button
                      onClick={() => setSpatialObjects(prev => prev.filter(obj => obj.id !== object.id))}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">位置 (X)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={object.position.x}
                      onChange={(e) => {
                        setSpatialObjects(prev =>
                          prev.map(obj =>
                            obj.id === object.id
                              ? { ...obj, position: { ...obj.position, x: parseFloat(e.target.value) || 0 } }
                              : obj
                          )
                        )
                      }}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">位置 (Y)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={object.position.y}
                      onChange={(e) => {
                        setSpatialObjects(prev =>
                          prev.map(obj =>
                            obj.id === object.id
                              ? { ...obj, position: { ...obj.position, y: parseFloat(e.target.value) || 0 } }
                              : obj
                          )
                        )
                      }}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">位置 (Z)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={object.position.z}
                      onChange={(e) => {
                        setSpatialObjects(prev =>
                          prev.map(obj =>
                            obj.id === object.id
                              ? { ...obj, position: { ...obj.position, z: parseFloat(e.target.value) || 0 } }
                              : obj
                          )
                        )
                      }}
                      className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scene Export */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          场景导出
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          将创建的场景导出为可分享的AR/VR体验
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => {
              const sceneData = {
                objects: spatialObjects,
                metadata: {
                  title: '我的AR/VR场景',
                  createdAt: Date.now(),
                  version: '1.0.0'
                }
              }
              const blob = new Blob([JSON.stringify(sceneData, null, 2)], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'ar_vr_scene.json'
              a.click()
              URL.revokeObjectURL(url)
              trackUserAction('export_scene', 'scene', { objectCount: spatialObjects.length })
            }}
            disabled={spatialObjects.length === 0}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              spatialObjects.length > 0
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            )}
          >
            导出场景
          </button>

          <button
            onClick={() => {
              if (confirm('确定要清空所有对象吗？')) {
                setSpatialObjects([])
              }
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            清空场景
          </button>
        </div>
      </div>
    </div>
  )

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          AR/VR 设置
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          配置您的沉浸式体验参数
        </p>
      </div>

      {/* VR Settings */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span>🥽</span>
          VR 设置
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              舒适度设置
            </label>
            <select
              value={vrSettings.comfort}
              onChange={(e) => setVRSettings(prev => ({ ...prev, comfort: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="comfortable">舒适模式 (减少晕动症)</option>
              <option value="moderate">标准模式</option>
              <option value="intense">性能模式 (最大沉浸感)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              瞳距 (IPD): {vrSettings.ipd}mm
            </label>
            <input
              type="range"
              min="55"
              max="75"
              step="1"
              value={vrSettings.ipd}
              onChange={(e) => setVRSettings(prev => ({ ...prev, ipd: parseInt(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>55mm</span>
              <span>75mm</span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: 'teleportation', label: '传送移动', description: '使用传送而不是平滑移动' },
              { key: 'smoothTurning', label: '平滑转向', description: '启用平滑转向而不是快速转向' },
              { key: 'hapticFeedback', label: '触觉反馈', description: '启用控制器震动反馈' },
              { key: 'audioPanning', label: '3D音频', description: '启用空间音频定位' },
              { key: 'playAreaBounds', label: '游戏区域边界', description: '显示安全边界线' }
            ].map(({ key, label, description }) => (
              <label key={key} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={(vrSettings as any)[key]}
                  onChange={(e) => setVRSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* AR Settings */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h4 className="font-semibent text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <span>👓</span>
          AR 设置
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              环境混合模式
            </label>
            <select
              value={arSettings.environmentBlending}
              onChange={(e) => setARSettings(prev => ({ ...prev, environmentBlending: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="additive">添加模式 (透明叠加)</option>
              <option value="alpha-blend">混合模式 (半透明)</option>
              <option value="opaque">不透明模式 (完全遮挡)</option>
            </select>
          </div>

          <div className="space-y-3">
            {[
              { key: 'occlusion', label: '遮挡处理', description: '虚拟对象被真实物体遮挡' },
              { key: 'lightEstimation', label: '光照估计', description: '根据环境光照调整虚拟对象' },
              { key: 'planeDetection', label: '平面检测', description: '自动检测地面和墙面' },
              { key: 'handTracking', label: '手部追踪', description: '启用手势识别和交互' },
              { key: 'eyeTracking', label: '视线追踪', description: '启用眼球追踪技术' },
              { key: 'spatialAudio', label: '空间音频', description: '启用3D立体声定位' }
            ].map(({ key, label, description }) => (
              <label key={key} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={(arSettings as any)[key]}
                  onChange={(e) => setARSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                  className="mt-1"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Reset Settings */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            if (confirm('确定要重置所有设置吗？')) {
              setVRSettings({
                comfort: 'moderate',
                teleportation: true,
                smoothTurning: false,
                hapticFeedback: true,
                audioPanning: true,
                ipd: 63,
                playAreaBounds: true
              })
              setARSettings({
                occlusion: true,
                lightEstimation: true,
                planeDetection: true,
                handTracking: true,
                eyeTracking: false,
                spatialAudio: true,
                environmentBlending: 'additive'
              })
            }
          }}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          重置设置
        </button>
      </div>
    </div>
  )

  return (
    <div className={cn("bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700", className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl">🔮</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AR/VR 沉浸式体验
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                下一代增强现实和虚拟现实平台
              </p>
            </div>
          </div>

          {/* View Navigation */}
          <div className="flex items-center gap-2">
            {[
              { id: 'dashboard', name: '仪表盘', icon: '📊' },
              { id: 'experiences', name: '体验库', icon: '🌟' },
              { id: 'creator', name: '创作工具', icon: '🔧' },
              { id: 'settings', name: '设置', icon: '⚙️' }
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
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'experiences' && renderExperiences()}
        {currentView === 'creator' && renderCreator()}
        {currentView === 'settings' && renderSettings()}
      </div>
    </div>
  )
}

export default ARVRSupport
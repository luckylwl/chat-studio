import React, { useState, useEffect, useRef } from 'react'
import { Monitor, Smartphone, Tablet, Laptop, Globe, Wifi, Bluetooth, Usb, HardDrive, Settings, CheckCircle, XCircle, AlertTriangle, Info, RefreshCw as Refresh, Download, Upload, RefreshCw as Sync, Cloud, Database, Terminal, Code, FileText, Image, Video, Music, Archive, Shield, Key, Eye, EyeOff, Copy, ExternalLink, Play, Pause, Square, Volume2, VolumeX, Battery } from 'lucide-react'

interface PlatformInfo {
  name: string
  version: string
  architecture: string
  userAgent: string
  language: string
  timezone: string
  screen: {
    width: number
    height: number
    pixelRatio: number
    colorDepth: number
  }
  capabilities: {
    touchScreen: boolean
    geolocation: boolean
    notifications: boolean
    offline: boolean
    webGL: boolean
    webAssembly: boolean
    serviceWorkers: boolean
    indexedDB: boolean
    localStorage: boolean
    webRTC: boolean
    webAudio: boolean
    gamepad: boolean
    vibration: boolean
  }
}

interface CompatibilityTest {
  id: string
  name: string
  category: 'browser' | 'hardware' | 'network' | 'storage' | 'media' | 'security'
  description: string
  isSupported: boolean
  version?: string
  details?: string
  recommendation?: string
  isRequired: boolean
}

interface CrossPlatformFeature {
  id: string
  name: string
  description: string
  platforms: {
    web: boolean
    desktop: boolean
    mobile: boolean
    tablet: boolean
  }
  status: 'available' | 'limited' | 'unavailable'
  alternatives?: string[]
  implementation: string
}

const CrossPlatformCompat: React.FC = () => {
  const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null)
  const [compatibilityTests, setCompatibilityTests] = useState<CompatibilityTest[]>([])
  const [crossPlatformFeatures, setCrossPlatformFeatures] = useState<CrossPlatformFeature[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set())
  const [adaptiveSettings, setAdaptiveSettings] = useState({
    enableTouchOptimization: false,
    enableMobileLayout: false,
    enableOfflineMode: false,
    enableReducedMotion: false,
    enableHighContrast: false,
    enableLargeText: false,
    autoDetectPlatform: true
  })

  // Detect platform and capabilities
  useEffect(() => {
    const detectPlatform = async () => {
      setIsLoading(true)

      try {
        // Get basic platform info
        const info: PlatformInfo = {
          name: navigator.platform,
          version: navigator.appVersion,
          architecture: (navigator as any).cpuClass || 'unknown',
          userAgent: navigator.userAgent,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          screen: {
            width: screen.width,
            height: screen.height,
            pixelRatio: window.devicePixelRatio,
            colorDepth: screen.colorDepth
          },
          capabilities: {
            touchScreen: 'ontouchstart' in window,
            geolocation: 'geolocation' in navigator,
            notifications: 'Notification' in window,
            offline: 'onLine' in navigator,
            webGL: !!document.createElement('canvas').getContext('webgl'),
            webAssembly: 'WebAssembly' in window,
            serviceWorkers: 'serviceWorker' in navigator,
            indexedDB: 'indexedDB' in window,
            localStorage: 'localStorage' in window,
            webRTC: 'RTCPeerConnection' in window,
            webAudio: 'AudioContext' in window || 'webkitAudioContext' in window,
            gamepad: 'getGamepads' in navigator,
            vibration: 'vibrate' in navigator
          }
        }

        setPlatformInfo(info)

        // Run compatibility tests
        const tests = await runCompatibilityTests()
        setCompatibilityTests(tests)

        // Initialize cross-platform features
        const features = initializeCrossPlatformFeatures(info)
        setCrossPlatformFeatures(features)

        // Auto-apply adaptive settings
        if (adaptiveSettings.autoDetectPlatform) {
          applyAdaptiveSettings(info)
        }

      } catch (error) {
        console.error('Platform detection failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    detectPlatform()
  }, [adaptiveSettings.autoDetectPlatform])

  const runCompatibilityTests = async (): Promise<CompatibilityTest[]> => {
    const tests: CompatibilityTest[] = []

    // Browser tests
    tests.push({
      id: 'es6-support',
      name: 'ES6+ Support',
      category: 'browser',
      description: 'Modern JavaScript features support',
      isSupported: (() => {
        try {
          new Function('(a = 0) => a')
          return true
        } catch {
          return false
        }
      })(),
      isRequired: true,
      recommendation: 'Update to a modern browser that supports ES6+'
    })

    tests.push({
      id: 'css-grid',
      name: 'CSS Grid',
      category: 'browser',
      description: 'CSS Grid Layout support',
      isSupported: CSS.supports('display', 'grid'),
      isRequired: false,
      recommendation: 'Fallback to flexbox layout'
    })

    tests.push({
      id: 'css-variables',
      name: 'CSS Custom Properties',
      category: 'browser',
      description: 'CSS custom properties (variables)',
      isSupported: CSS.supports('color', 'var(--test-color)'),
      isRequired: false,
      recommendation: 'Use preprocessor variables as fallback'
    })

    // Storage tests
    tests.push({
      id: 'local-storage',
      name: 'Local Storage',
      category: 'storage',
      description: 'Browser local storage API',
      isSupported: (() => {
        try {
          localStorage.setItem('test', 'test')
          localStorage.removeItem('test')
          return true
        } catch {
          return false
        }
      })(),
      isRequired: true,
      recommendation: 'Enable local storage in browser settings'
    })

    tests.push({
      id: 'indexed-db',
      name: 'IndexedDB',
      category: 'storage',
      description: 'Browser database storage',
      isSupported: 'indexedDB' in window,
      isRequired: false,
      recommendation: 'Use localStorage as fallback'
    })

    // Network tests
    tests.push({
      id: 'fetch-api',
      name: 'Fetch API',
      category: 'network',
      description: 'Modern HTTP request API',
      isSupported: 'fetch' in window,
      isRequired: true,
      recommendation: 'Use XMLHttpRequest polyfill'
    })

    tests.push({
      id: 'websockets',
      name: 'WebSockets',
      category: 'network',
      description: 'Real-time communication support',
      isSupported: 'WebSocket' in window,
      isRequired: false,
      recommendation: 'Use polling as fallback'
    })

    tests.push({
      id: 'webrtc',
      name: 'WebRTC',
      category: 'network',
      description: 'Peer-to-peer communication',
      isSupported: 'RTCPeerConnection' in window,
      isRequired: false,
      recommendation: 'Voice features will be disabled'
    })

    // Media tests
    tests.push({
      id: 'web-audio',
      name: 'Web Audio API',
      category: 'media',
      description: 'Advanced audio processing',
      isSupported: 'AudioContext' in window || 'webkitAudioContext' in window,
      isRequired: false,
      recommendation: 'Basic audio playback only'
    })

    tests.push({
      id: 'media-recorder',
      name: 'MediaRecorder',
      category: 'media',
      description: 'Audio/video recording capability',
      isSupported: 'MediaRecorder' in window,
      isRequired: false,
      recommendation: 'Recording features will be disabled'
    })

    // Hardware tests
    tests.push({
      id: 'device-orientation',
      name: 'Device Orientation',
      category: 'hardware',
      description: 'Device rotation detection',
      isSupported: 'DeviceOrientationEvent' in window,
      isRequired: false,
      recommendation: 'Manual orientation controls'
    })

    tests.push({
      id: 'vibration',
      name: 'Vibration API',
      category: 'hardware',
      description: 'Device vibration control',
      isSupported: 'vibrate' in navigator,
      isRequired: false,
      recommendation: 'Visual feedback instead'
    })

    // Security tests
    tests.push({
      id: 'https',
      name: 'HTTPS Connection',
      category: 'security',
      description: 'Secure connection protocol',
      isSupported: location.protocol === 'https:' || location.hostname === 'localhost',
      isRequired: true,
      recommendation: 'Access the site via HTTPS'
    })

    tests.push({
      id: 'crypto-api',
      name: 'Crypto API',
      category: 'security',
      description: 'Cryptographic operations',
      isSupported: 'crypto' in window && 'subtle' in crypto,
      isRequired: false,
      recommendation: 'Use alternative encryption library'
    })

    return tests
  }

  const initializeCrossPlatformFeatures = (info: PlatformInfo): CrossPlatformFeature[] => {
    return [
      {
        id: 'file-management',
        name: '文件管理',
        description: '文件上传、下载和管理功能',
        platforms: {
          web: true,
          desktop: true,
          mobile: true,
          tablet: true
        },
        status: 'available',
        implementation: 'File API with drag-and-drop support'
      },
      {
        id: 'voice-interaction',
        name: '语音交互',
        description: '语音识别和合成功能',
        platforms: {
          web: info.capabilities.webAudio,
          desktop: true,
          mobile: true,
          tablet: true
        },
        status: info.capabilities.webAudio ? 'available' : 'limited',
        alternatives: ['Text input only'],
        implementation: 'Web Speech API with fallbacks'
      },
      {
        id: 'offline-mode',
        name: '离线模式',
        description: '离线数据同步和缓存',
        platforms: {
          web: info.capabilities.serviceWorkers && info.capabilities.indexedDB,
          desktop: true,
          mobile: true,
          tablet: true
        },
        status: info.capabilities.serviceWorkers ? 'available' : 'limited',
        alternatives: ['localStorage only'],
        implementation: 'Service Workers + IndexedDB'
      },
      {
        id: 'push-notifications',
        name: '推送通知',
        description: '实时消息推送',
        platforms: {
          web: info.capabilities.notifications && info.capabilities.serviceWorkers,
          desktop: true,
          mobile: true,
          tablet: true
        },
        status: info.capabilities.notifications ? 'available' : 'unavailable',
        alternatives: ['In-app notifications only'],
        implementation: 'Notification API + Push API'
      },
      {
        id: 'camera-access',
        name: '摄像头访问',
        description: '图片和视频拍摄',
        platforms: {
          web: 'mediaDevices' in navigator,
          desktop: true,
          mobile: true,
          tablet: true
        },
        status: 'mediaDevices' in navigator ? 'available' : 'unavailable',
        alternatives: ['File upload only'],
        implementation: 'getUserMedia API'
      },
      {
        id: 'geolocation',
        name: '地理位置',
        description: '用户位置获取',
        platforms: {
          web: info.capabilities.geolocation,
          desktop: false,
          mobile: true,
          tablet: true
        },
        status: info.capabilities.geolocation ? 'available' : 'unavailable',
        alternatives: ['Manual location input'],
        implementation: 'Geolocation API'
      },
      {
        id: 'biometric-auth',
        name: '生物识别认证',
        description: '指纹或面部识别',
        platforms: {
          web: 'credentials' in navigator,
          desktop: false,
          mobile: true,
          tablet: true
        },
        status: 'credentials' in navigator ? 'limited' : 'unavailable',
        alternatives: ['Password authentication'],
        implementation: 'WebAuthn API'
      },
      {
        id: 'background-sync',
        name: '后台同步',
        description: '数据后台同步',
        platforms: {
          web: info.capabilities.serviceWorkers,
          desktop: true,
          mobile: true,
          tablet: true
        },
        status: info.capabilities.serviceWorkers ? 'available' : 'unavailable',
        alternatives: ['Manual sync only'],
        implementation: 'Background Sync API'
      }
    ]
  }

  const applyAdaptiveSettings = (info: PlatformInfo) => {
    const newSettings = { ...adaptiveSettings }

    // Enable touch optimization on touch devices
    if (info.capabilities.touchScreen) {
      newSettings.enableTouchOptimization = true
    }

    // Enable mobile layout on small screens
    if (info.screen.width < 768) {
      newSettings.enableMobileLayout = true
    }

    // Enable offline mode if supported
    if (info.capabilities.serviceWorkers && info.capabilities.indexedDB) {
      newSettings.enableOfflineMode = true
    }

    // Check for accessibility preferences
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      newSettings.enableReducedMotion = true
    }

    if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
      newSettings.enableHighContrast = true
    }

    setAdaptiveSettings(newSettings)
  }

  const toggleDetail = (testId: string) => {
    setShowDetails(prev => {
      const newSet = new Set(prev)
      if (newSet.has(testId)) {
        newSet.delete(testId)
      } else {
        newSet.add(testId)
      }
      return newSet
    })
  }

  const getStatusIcon = (isSupported: boolean, isRequired: boolean) => {
    if (isSupported) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    } else if (isRequired) {
      return <XCircle className="w-5 h-5 text-red-500" />
    } else {
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    }
  }

  const getFeatureStatusIcon = (status: CrossPlatformFeature['status']) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'limited':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'unavailable':
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'web':
        return <Globe className="w-4 h-4" />
      case 'desktop':
        return <Monitor className="w-4 h-4" />
      case 'mobile':
        return <Smartphone className="w-4 h-4" />
      case 'tablet':
        return <Tablet className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  const filteredTests = compatibilityTests.filter(test =>
    selectedCategory === 'all' || test.category === selectedCategory
  )

  const categories = [
    { id: 'all', name: '全部', icon: '🔍' },
    { id: 'browser', name: '浏览器', icon: '🌐' },
    { id: 'hardware', name: '硬件', icon: '💻' },
    { id: 'network', name: '网络', icon: '📡' },
    { id: 'storage', name: '存储', icon: '💾' },
    { id: 'media', name: '媒体', icon: '🎵' },
    { id: 'security', name: '安全', icon: '🔒' }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Monitor className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">跨平台兼容性</h2>
              <p className="text-gray-600 dark:text-gray-400">检测平台能力和优化兼容性</p>
            </div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Refresh className="w-4 h-4" />
            <span>重新检测</span>
          </button>
        </div>

        {/* Platform Overview */}
        {platformInfo && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">平台信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">操作系统</div>
                <div className="font-medium text-gray-900 dark:text-white">{platformInfo.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">语言</div>
                <div className="font-medium text-gray-900 dark:text-white">{platformInfo.language}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">屏幕分辨率</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {platformInfo.screen.width} × {platformInfo.screen.height}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">像素比</div>
                <div className="font-medium text-gray-900 dark:text-white">{platformInfo.screen.pixelRatio}x</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Adaptive Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">自适应设置</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(adaptiveSettings).map(([key, value]) => (
            <label key={key} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setAdaptiveSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                className="rounded text-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {key === 'enableTouchOptimization' && '触摸优化'}
                {key === 'enableMobileLayout' && '移动端布局'}
                {key === 'enableOfflineMode' && '离线模式'}
                {key === 'enableReducedMotion' && '减少动画'}
                {key === 'enableHighContrast' && '高对比度'}
                {key === 'enableLargeText' && '大字体'}
                {key === 'autoDetectPlatform' && '自动检测平台'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Compatibility Tests */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">兼容性测试</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {compatibilityTests.filter(t => t.isSupported).length} / {compatibilityTests.length} 通过
            </span>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* Tests List */}
        <div className="space-y-3">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.isSupported, test.isRequired)}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{test.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{test.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {test.isRequired && (
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-xs rounded">
                      必需
                    </span>
                  )}
                  <button
                    onClick={() => toggleDetail(test.id)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  >
                    {showDetails.has(test.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {showDetails.has(test.id) && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">状态：</span>
                      <span className={`text-sm ml-1 ${
                        test.isSupported ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {test.isSupported ? '支持' : '不支持'}
                      </span>
                    </div>
                    {test.version && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">版本：</span>
                        <span className="text-sm ml-1 text-gray-600 dark:text-gray-400">{test.version}</span>
                      </div>
                    )}
                    {test.details && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">详情：</span>
                        <span className="text-sm ml-1 text-gray-600 dark:text-gray-400">{test.details}</span>
                      </div>
                    )}
                    {test.recommendation && !test.isSupported && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">建议：</span>
                        <span className="text-sm ml-1 text-gray-600 dark:text-gray-400">{test.recommendation}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cross-Platform Features */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">跨平台功能支持</h3>

        <div className="space-y-4">
          {crossPlatformFeatures.map((feature) => (
            <div
              key={feature.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getFeatureStatusIcon(feature.status)}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{feature.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </div>
                </div>

                <span className={`px-2 py-1 text-xs rounded ${
                  feature.status === 'available' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                  feature.status === 'limited' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                  'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                }`}>
                  {feature.status === 'available' ? '完全支持' :
                   feature.status === 'limited' ? '部分支持' : '不支持'}
                </span>
              </div>

              {/* Platform Support Grid */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {Object.entries(feature.platforms).map(([platform, supported]) => (
                  <div
                    key={platform}
                    className={`flex items-center gap-2 p-2 rounded text-sm ${
                      supported
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-500'
                    }`}
                  >
                    {getPlatformIcon(platform)}
                    <span className="capitalize">
                      {platform === 'web' ? 'Web' :
                       platform === 'desktop' ? '桌面' :
                       platform === 'mobile' ? '手机' : '平板'}
                    </span>
                    {supported ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-500">实现方式：</span>
                  <span className="text-xs text-gray-700 dark:text-gray-300 ml-1">{feature.implementation}</span>
                </div>

                {feature.alternatives && feature.alternatives.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-500">备选方案：</span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 ml-1">
                      {feature.alternatives.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary and Recommendations */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">兼容性总结</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              {compatibilityTests.filter(t => t.isSupported).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">支持的功能</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
              {compatibilityTests.filter(t => !t.isSupported && !t.isRequired).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">可选功能</div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
              {compatibilityTests.filter(t => !t.isSupported && t.isRequired).length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">缺失必需功能</div>
          </div>
        </div>

        {compatibilityTests.some(t => !t.isSupported && t.isRequired) && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">需要关注的问题：</h4>
            <ul className="space-y-1">
              {compatibilityTests
                .filter(t => !t.isSupported && t.isRequired)
                .map(test => (
                  <li key={test.id} className="text-sm text-red-700 dark:text-red-300">
                    • {test.name}: {test.recommendation}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default CrossPlatformCompat
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Zap, Monitor, Cpu, MemoryStick, HardDrive, Wifi, Battery, Settings, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, RefreshCw, Trash2, Archive, Database, Activity, BarChart3, PieChart, LineChart, Gauge, Zap as Optimize, Timer, Target, Rocket, ShieldCheck, Eye, EyeOff, Play, Pause, Square } from 'lucide-react'

interface PerformanceMetrics {
  cpu: {
    usage: number
    cores: number
    frequency: number
    temperature?: number
  }
  memory: {
    used: number
    total: number
    available: number
    percentage: number
  }
  gpu: {
    usage: number
    memory: number
    temperature?: number
  }
  network: {
    downloadSpeed: number
    uploadSpeed: number
    latency: number
    packetLoss: number
  }
  storage: {
    readSpeed: number
    writeSpeed: number
    usage: number
    available: number
  }
  battery?: {
    level: number
    isCharging: boolean
    timeRemaining: number
  }
  fps: number
  frameTime: number
  renderTime: number
  jsHeapSize: number
  domNodes: number
}

interface OptimizationRule {
  id: string
  category: 'performance' | 'memory' | 'network' | 'storage' | 'ui'
  name: string
  description: string
  isEnabled: boolean
  impact: 'low' | 'medium' | 'high'
  requirements: string[]
  action: () => Promise<void>
  riskLevel: 'safe' | 'moderate' | 'risky'
}

interface PerformanceProfile {
  id: string
  name: string
  description: string
  settings: {
    enableVirtualization: boolean
    enableLazyLoading: boolean
    enableCompression: boolean
    enableCaching: boolean
    maxConcurrentRequests: number
    memoryLimit: number
    gcThreshold: number
    animationLevel: 'none' | 'reduced' | 'normal' | 'enhanced'
    renderQuality: 'low' | 'medium' | 'high' | 'ultra'
  }
  isActive: boolean
  autoApply: boolean
  conditions: {
    batteryLevel?: number
    cpuUsage?: number
    memoryUsage?: number
    networkSpeed?: number
  }
}

const PerformanceOptimizer: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cpu: { usage: 0, cores: 8, frequency: 3200 },
    memory: { used: 0, total: 16 * 1024 * 1024 * 1024, available: 0, percentage: 0 },
    gpu: { usage: 0, memory: 0 },
    network: { downloadSpeed: 0, uploadSpeed: 0, latency: 0, packetLoss: 0 },
    storage: { readSpeed: 0, writeSpeed: 0, usage: 0, available: 0 },
    fps: 60,
    frameTime: 16.67,
    renderTime: 8.3,
    jsHeapSize: 0,
    domNodes: 0
  })

  const [isMonitoring, setIsMonitoring] = useState(false)
  const [optimizationRules, setOptimizationRules] = useState<OptimizationRule[]>([])
  const [performanceProfiles, setPerformanceProfiles] = useState<PerformanceProfile[]>([])
  const [activeProfile, setActiveProfile] = useState<string>('balanced')
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [autoOptimize, setAutoOptimize] = useState(true)
  const [performanceScore, setPerformanceScore] = useState(85)
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)

  const monitoringIntervalRef = useRef<NodeJS.Timeout>()
  const frameTimeRef = useRef<number[]>([])

  // Initialize optimization rules
  useEffect(() => {
    const rules: OptimizationRule[] = [
      {
        id: 'virtual-scrolling',
        category: 'performance',
        name: '虚拟滚动优化',
        description: '对长列表使用虚拟滚动技术，减少DOM节点数量',
        isEnabled: true,
        impact: 'high',
        requirements: ['React Virtual', 'Intersection Observer'],
        action: async () => {
          console.log('启用虚拟滚动优化')
          await new Promise(resolve => setTimeout(resolve, 1000))
        },
        riskLevel: 'safe'
      },
      {
        id: 'lazy-loading',
        category: 'performance',
        name: '懒加载组件',
        description: '延迟加载非关键组件，提升初始加载速度',
        isEnabled: true,
        impact: 'medium',
        requirements: ['React.lazy', 'Suspense'],
        action: async () => {
          console.log('启用懒加载优化')
          await new Promise(resolve => setTimeout(resolve, 800))
        },
        riskLevel: 'safe'
      },
      {
        id: 'memory-cleanup',
        category: 'memory',
        name: '内存清理',
        description: '清理未使用的对象和事件监听器',
        isEnabled: false,
        impact: 'medium',
        requirements: ['WeakMap', 'WeakSet'],
        action: async () => {
          console.log('执行内存清理')
          if ((window as any).gc) {
            (window as any).gc()
          }
          await new Promise(resolve => setTimeout(resolve, 1200))
        },
        riskLevel: 'moderate'
      },
      {
        id: 'image-optimization',
        category: 'performance',
        name: '图片优化',
        description: '自动压缩和转换图片格式',
        isEnabled: true,
        impact: 'high',
        requirements: ['WebP', 'AVIF'],
        action: async () => {
          console.log('优化图片资源')
          await new Promise(resolve => setTimeout(resolve, 2000))
        },
        riskLevel: 'safe'
      },
      {
        id: 'bundle-splitting',
        category: 'performance',
        name: '代码分割',
        description: '拆分代码包，实现按需加载',
        isEnabled: false,
        impact: 'high',
        requirements: ['Dynamic Import', 'Webpack'],
        action: async () => {
          console.log('重新分割代码包')
          await new Promise(resolve => setTimeout(resolve, 3000))
        },
        riskLevel: 'moderate'
      },
      {
        id: 'cache-optimization',
        category: 'storage',
        name: '缓存优化',
        description: '优化本地存储和HTTP缓存策略',
        isEnabled: true,
        impact: 'medium',
        requirements: ['Service Worker', 'Cache API'],
        action: async () => {
          console.log('优化缓存策略')
          await new Promise(resolve => setTimeout(resolve, 1500))
        },
        riskLevel: 'safe'
      },
      {
        id: 'network-optimization',
        category: 'network',
        name: '网络优化',
        description: '启用HTTP/2推送和预加载',
        isEnabled: false,
        impact: 'medium',
        requirements: ['HTTP/2', 'Resource Hints'],
        action: async () => {
          console.log('优化网络连接')
          await new Promise(resolve => setTimeout(resolve, 1000))
        },
        riskLevel: 'safe'
      },
      {
        id: 'animation-optimization',
        category: 'ui',
        name: '动画优化',
        description: '使用GPU加速的CSS动画',
        isEnabled: true,
        impact: 'medium',
        requirements: ['CSS Transforms', 'will-change'],
        action: async () => {
          console.log('优化动画性能')
          await new Promise(resolve => setTimeout(resolve, 800))
        },
        riskLevel: 'safe'
      }
    ]

    setOptimizationRules(rules)
  }, [])

  // Initialize performance profiles
  useEffect(() => {
    const profiles: PerformanceProfile[] = [
      {
        id: 'power-saver',
        name: '节能模式',
        description: '最大化电池寿命，降低性能需求',
        settings: {
          enableVirtualization: true,
          enableLazyLoading: true,
          enableCompression: true,
          enableCaching: true,
          maxConcurrentRequests: 2,
          memoryLimit: 512 * 1024 * 1024,
          gcThreshold: 50,
          animationLevel: 'reduced',
          renderQuality: 'low'
        },
        isActive: false,
        autoApply: true,
        conditions: {
          batteryLevel: 20,
          cpuUsage: 80
        }
      },
      {
        id: 'balanced',
        name: '平衡模式',
        description: '性能和效率的最佳平衡',
        settings: {
          enableVirtualization: true,
          enableLazyLoading: true,
          enableCompression: true,
          enableCaching: true,
          maxConcurrentRequests: 4,
          memoryLimit: 1024 * 1024 * 1024,
          gcThreshold: 70,
          animationLevel: 'normal',
          renderQuality: 'medium'
        },
        isActive: true,
        autoApply: false,
        conditions: {}
      },
      {
        id: 'performance',
        name: '性能模式',
        description: '最大化性能，适合高负载工作',
        settings: {
          enableVirtualization: true,
          enableLazyLoading: false,
          enableCompression: false,
          enableCaching: true,
          maxConcurrentRequests: 8,
          memoryLimit: 2048 * 1024 * 1024,
          gcThreshold: 90,
          animationLevel: 'enhanced',
          renderQuality: 'high'
        },
        isActive: false,
        autoApply: false,
        conditions: {}
      },
      {
        id: 'ultra-performance',
        name: '极致性能',
        description: '无限制性能，适合演示和展示',
        settings: {
          enableVirtualization: false,
          enableLazyLoading: false,
          enableCompression: false,
          enableCaching: false,
          maxConcurrentRequests: 16,
          memoryLimit: 4096 * 1024 * 1024,
          gcThreshold: 95,
          animationLevel: 'enhanced',
          renderQuality: 'ultra'
        },
        isActive: false,
        autoApply: false,
        conditions: {}
      }
    ]

    setPerformanceProfiles(profiles)
  }, [])

  // Performance monitoring
  const updateMetrics = useCallback(() => {
    // Simulate real performance metrics
    const newMetrics: PerformanceMetrics = {
      cpu: {
        usage: Math.random() * 100,
        cores: navigator.hardwareConcurrency || 4,
        frequency: 3200 + Math.random() * 800,
        temperature: 45 + Math.random() * 20
      },
      memory: {
        used: (performance as any).memory?.usedJSHeapSize || Math.random() * 1024 * 1024 * 1024,
        total: (performance as any).memory?.totalJSHeapSize || 2 * 1024 * 1024 * 1024,
        available: (performance as any).memory?.usedJSHeapSize ?
                   (performance as any).memory.totalJSHeapSize - (performance as any).memory.usedJSHeapSize :
                   1024 * 1024 * 1024,
        percentage: 0
      },
      gpu: {
        usage: Math.random() * 100,
        memory: Math.random() * 8 * 1024 * 1024 * 1024,
        temperature: 55 + Math.random() * 25
      },
      network: {
        downloadSpeed: 50 + Math.random() * 100,
        uploadSpeed: 10 + Math.random() * 40,
        latency: 10 + Math.random() * 50,
        packetLoss: Math.random() * 0.1
      },
      storage: {
        readSpeed: 500 + Math.random() * 200,
        writeSpeed: 300 + Math.random() * 150,
        usage: Math.random() * 1024 * 1024 * 1024 * 1024,
        available: 2 * 1024 * 1024 * 1024 * 1024
      },
      fps: 60 - Math.random() * 10,
      frameTime: 16.67 + Math.random() * 5,
      renderTime: 8 + Math.random() * 4,
      jsHeapSize: (performance as any).memory?.usedJSHeapSize || Math.random() * 100 * 1024 * 1024,
      domNodes: document.querySelectorAll('*').length
    }

    // Calculate memory percentage
    newMetrics.memory.percentage = (newMetrics.memory.used / newMetrics.memory.total) * 100

    // Add battery info if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        newMetrics.battery = {
          level: battery.level * 100,
          isCharging: battery.charging,
          timeRemaining: battery.dischargingTime
        }
      })
    }

    setMetrics(newMetrics)

    // Update metrics history
    setMetricsHistory(prev => {
      const newHistory = [...prev, newMetrics]
      return newHistory.slice(-50) // Keep last 50 entries
    })

    // Calculate performance score
    const score = calculatePerformanceScore(newMetrics)
    setPerformanceScore(score)

    // Generate recommendations
    const recs = generateRecommendations(newMetrics)
    setRecommendations(recs)
  }, [])

  const calculatePerformanceScore = (metrics: PerformanceMetrics): number => {
    let score = 100

    // CPU impact
    if (metrics.cpu.usage > 80) score -= 20
    else if (metrics.cpu.usage > 60) score -= 10

    // Memory impact
    if (metrics.memory.percentage > 90) score -= 25
    else if (metrics.memory.percentage > 70) score -= 15

    // FPS impact
    if (metrics.fps < 30) score -= 30
    else if (metrics.fps < 50) score -= 15

    // Network impact
    if (metrics.network.latency > 100) score -= 10
    if (metrics.network.packetLoss > 0.05) score -= 10

    return Math.max(score, 0)
  }

  const generateRecommendations = (metrics: PerformanceMetrics): string[] => {
    const recs: string[] = []

    if (metrics.cpu.usage > 80) {
      recs.push('CPU使用率过高，建议启用虚拟滚动和懒加载')
    }

    if (metrics.memory.percentage > 80) {
      recs.push('内存使用率过高，建议执行内存清理')
    }

    if (metrics.fps < 30) {
      recs.push('帧率过低，建议降低动画复杂度')
    }

    if (metrics.domNodes > 10000) {
      recs.push('DOM节点过多，建议启用虚拟滚动')
    }

    if (metrics.network.latency > 100) {
      recs.push('网络延迟较高，建议启用缓存优化')
    }

    if (metrics.battery && metrics.battery.level < 20 && !metrics.battery.isCharging) {
      recs.push('电池电量低，建议切换到节能模式')
    }

    return recs
  }

  // Start/stop monitoring
  useEffect(() => {
    if (isMonitoring) {
      updateMetrics() // Initial update
      monitoringIntervalRef.current = setInterval(updateMetrics, 1000)
    } else {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current)
      }
    }

    return () => {
      if (monitoringIntervalRef.current) {
        clearInterval(monitoringIntervalRef.current)
      }
    }
  }, [isMonitoring, updateMetrics])

  const handleOptimizationToggle = (ruleId: string) => {
    setOptimizationRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, isEnabled: !rule.isEnabled } : rule
    ))
  }

  const runOptimization = async (ruleId?: string) => {
    setIsOptimizing(true)

    const rulesToRun = ruleId
      ? optimizationRules.filter(rule => rule.id === ruleId)
      : optimizationRules.filter(rule => rule.isEnabled)

    for (const rule of rulesToRun) {
      try {
        await rule.action()
      } catch (error) {
        console.error(`优化规则 ${rule.name} 执行失败:`, error)
      }
    }

    setIsOptimizing(false)
  }

  const applyProfile = (profileId: string) => {
    setPerformanceProfiles(prev => prev.map(profile => ({
      ...profile,
      isActive: profile.id === profileId
    })))
    setActiveProfile(profileId)

    const profile = performanceProfiles.find(p => p.id === profileId)
    if (profile) {
      console.log('应用性能配置:', profile.settings)
      // Here you would actually apply the profile settings
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">性能优化器</h2>
              <p className="text-gray-600 dark:text-gray-400">监控和优化应用程序性能</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${getScoreColor(performanceScore)}`}>
                {performanceScore}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">性能评分</div>
            </div>

            <button
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isMonitoring
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isMonitoring ? '停止监控' : '开始监控'}</span>
            </button>

            <button
              onClick={() => runOptimization()}
              disabled={isOptimizing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <Rocket className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
              <span>{isOptimizing ? '优化中...' : '一键优化'}</span>
            </button>
          </div>
        </div>

        {/* Performance Score */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">整体性能</span>
            <span className={`text-sm font-medium ${getScoreColor(performanceScore)}`}>
              {performanceScore >= 80 ? '优秀' : performanceScore >= 60 ? '良好' : '需要优化'}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                performanceScore >= 80 ? 'bg-green-500' :
                performanceScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${performanceScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-gray-900 dark:text-white">CPU</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(metrics.cpu.usage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(metrics.cpu.usage)}`}
              style={{ width: `${metrics.cpu.usage}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {metrics.cpu.cores} 核心 · {Math.round(metrics.cpu.frequency)} MHz
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MemoryStick className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="font-medium text-gray-900 dark:text-white">内存</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(metrics.memory.percentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(metrics.memory.percentage)}`}
              style={{ width: `${metrics.memory.percentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)}
          </div>
        </div>

        {/* Network Speed */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="font-medium text-gray-900 dark:text-white">网络</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(metrics.network.downloadSpeed)}
            </span>
          </div>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div>下载: {Math.round(metrics.network.downloadSpeed)} Mbps</div>
            <div>上传: {Math.round(metrics.network.uploadSpeed)} Mbps</div>
            <div>延迟: {Math.round(metrics.network.latency)} ms</div>
          </div>
        </div>

        {/* FPS */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="font-medium text-gray-900 dark:text-white">帧率</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(metrics.fps)}
            </span>
          </div>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div>帧时间: {metrics.frameTime.toFixed(1)} ms</div>
            <div>渲染时间: {metrics.renderTime.toFixed(1)} ms</div>
            <div>DOM节点: {metrics.domNodes.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Performance Profiles */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">性能配置</h3>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoOptimize}
              onChange={(e) => setAutoOptimize(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">自动优化</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {performanceProfiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => applyProfile(profile.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                profile.isActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">{profile.name}</h4>
                {profile.isActive && <CheckCircle className="w-4 h-4 text-blue-500" />}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {profile.description}
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-500">
                <div>并发请求: {profile.settings.maxConcurrentRequests}</div>
                <div>内存限制: {formatBytes(profile.settings.memoryLimit)}</div>
                <div>渲染质量: {profile.settings.renderQuality}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Optimization Rules */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">优化规则</h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showAdvanced ? '隐藏高级' : '显示高级'}</span>
          </button>
        </div>

        <div className="space-y-4">
          {optimizationRules
            .filter(rule => showAdvanced || rule.riskLevel === 'safe')
            .map((rule) => (
            <div
              key={rule.id}
              className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={rule.isEnabled}
                    onChange={() => handleOptimizationToggle(rule.id)}
                    className="rounded text-blue-500"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{rule.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{rule.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    rule.impact === 'high' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' :
                    rule.impact === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                    'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                  }`}>
                    {rule.impact === 'high' ? '高效果' : rule.impact === 'medium' ? '中效果' : '低效果'}
                  </span>

                  <span className={`px-2 py-1 text-xs rounded-full ${
                    rule.riskLevel === 'safe' ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' :
                    rule.riskLevel === 'moderate' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' :
                    'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                  }`}>
                    {rule.riskLevel === 'safe' ? '安全' : rule.riskLevel === 'moderate' ? '中等风险' : '高风险'}
                  </span>

                  <button
                    onClick={() => runOptimization(rule.id)}
                    disabled={!rule.isEnabled || isOptimizing}
                    className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
                  >
                    立即执行
                  </button>
                </div>
              </div>

              {rule.requirements.length > 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  依赖: {rule.requirements.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">性能建议</h3>
          </div>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <div className="w-2 h-2 bg-yellow-600 dark:bg-yellow-400 rounded-full" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default PerformanceOptimizer

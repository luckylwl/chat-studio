import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { ArrowDownTrayIcon, WifiIcon, NoSymbolIcon } from '@heroicons/react/24/outline'

interface PWAContextType {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  installApp: () => Promise<void>
  updateApp: () => Promise<void>
  hasUpdate: boolean
  isUpdating: boolean
  cacheSize: number
  clearCache: () => Promise<void>
  enableNotifications: () => Promise<boolean>
  isNotificationEnabled: boolean
}

const PWAContext = createContext<PWAContextType | null>(null)

export const usePWA = (): PWAContextType => {
  const context = useContext(PWAContext)
  if (!context) {
    throw new Error('usePWA must be used within PWAProvider')
  }
  return context
}

interface PWAProviderProps {
  children: React.ReactNode
}

export const PWAProvider: React.FC<PWAProviderProps> = ({ children }) => {
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [hasUpdate, setHasUpdate] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [cacheSize, setCacheSize] = useState(0)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false)

  // 检查是否已安装
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://')
      setIsInstalled(isStandalone)
    }

    checkInstalled()
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkInstalled)

    return () => {
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkInstalled)
    }
  }, [])

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('网络连接已恢复')
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error('网络连接已断开，正在使用缓存数据')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 监听安装提示
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      console.log('PWA was installed')
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      toast.success('应用安装成功！')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // 注册 Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(reg => {
          console.log('Service Worker registered:', reg.scope)
          setRegistration(reg)

          // 检查更新
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setHasUpdate(true)
                  toast('发现新版本，点击更新', {
                    duration: 5000,
                    icon: '🆕'
                  })
                }
              })
            }
          })

          // 监听 Service Worker 消息
          navigator.serviceWorker.addEventListener('message', event => {
            console.log('Received message from SW:', event.data)

            if (event.data?.type === 'CACHE_UPDATED') {
              toast.success('缓存已更新')
            }
          })

          return reg
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  // 检查通知权限
  useEffect(() => {
    if ('Notification' in window) {
      setIsNotificationEnabled(Notification.permission === 'granted')
    }
  }, [])

  // 获取缓存大小
  useEffect(() => {
    if ('caches' in window) {
      const getCacheSize = async () => {
        try {
          const cacheNames = await caches.keys()
          let totalSize = 0

          for (const cacheName of cacheNames) {
            const cache = await caches.open(cacheName)
            const keys = await cache.keys()
            totalSize += keys.length
          }

          setCacheSize(totalSize)
        } catch (error) {
          console.error('Failed to get cache size:', error)
        }
      }

      getCacheSize()
    }
  }, [])

  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      toast.error('应用无法安装')
      return
    }

    try {
      const result = await deferredPrompt.prompt()
      console.log('Install prompt result:', result)

      if (result.outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }

      setDeferredPrompt(null)
      setIsInstallable(false)
    } catch (error) {
      console.error('Install failed:', error)
      toast.error('安装失败')
    }
  }, [deferredPrompt])

  const updateApp = useCallback(async () => {
    if (!registration || !registration.waiting) {
      return
    }

    setIsUpdating(true)

    try {
      // 通知 waiting service worker 跳过等待
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })

      // 监听控制变更
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })

      setHasUpdate(false)
      toast.success('应用将在刷新后更新')
    } catch (error) {
      console.error('Update failed:', error)
      toast.error('更新失败')
    } finally {
      setIsUpdating(false)
    }
  }, [registration])

  const clearCache = useCallback(async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
        setCacheSize(0)
        toast.success('缓存已清空')
      }
    } catch (error) {
      console.error('Clear cache failed:', error)
      toast.error('清空缓存失败')
    }
  }, [])

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast.error('浏览器不支持通知')
      return false
    }

    if (Notification.permission === 'granted') {
      setIsNotificationEnabled(true)
      return true
    }

    if (Notification.permission === 'denied') {
      toast.error('通知权限被拒绝，请在浏览器设置中启用')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      const granted = permission === 'granted'

      setIsNotificationEnabled(granted)

      if (granted) {
        toast.success('通知权限已启用')

        // 发送测试通知
        new Notification('AI Chat Studio', {
          body: '通知功能已启用！',
          icon: '/icon-192.png',
          badge: '/icon-192.png'
        })
      } else {
        toast.error('通知权限被拒绝')
      }

      return granted
    } catch (error) {
      console.error('Enable notifications failed:', error)
      toast.error('启用通知失败')
      return false
    }
  }, [])

  const value: PWAContextType = {
    isInstallable,
    isInstalled,
    isOnline,
    installApp,
    updateApp,
    hasUpdate,
    isUpdating,
    cacheSize,
    clearCache,
    enableNotifications,
    isNotificationEnabled
  }

  return (
    <PWAContext.Provider value={value}>
      {children}
      <PWAPrompts />
    </PWAContext.Provider>
  )
}

// PWA 提示组件
const PWAPrompts: React.FC = () => {
  const { isInstallable, installApp, hasUpdate, updateApp, isUpdating, isOnline } = usePWA()

  return (
    <>
      {/* 安装提示 */}
      {isInstallable && (
        <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-slide-up">
          <ArrowDownTrayIcon className="h-6 w-6 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium">安装 AI Chat Studio</h4>
            <p className="text-sm opacity-90">获得更好的使用体验</p>
          </div>
          <button
            onClick={installApp}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            安装
          </button>
        </div>
      )}

      {/* 更新提示 */}
      {hasUpdate && (
        <div className="fixed top-4 left-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-slide-down">
          <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
            🆕
          </div>
          <div className="flex-1">
            <h4 className="font-medium">新版本可用</h4>
            <p className="text-sm opacity-90">点击更新到最新版本</p>
          </div>
          <button
            onClick={updateApp}
            disabled={isUpdating}
            className="bg-white/20 hover:bg-white/30 disabled:opacity-50 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isUpdating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                更新中...
              </>
            ) : (
              '更新'
            )}
          </button>
        </div>
      )}

      {/* 离线提示 */}
      {!isOnline && (
        <div className="fixed top-20 left-4 right-4 bg-yellow-600 text-white p-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <NoSymbolIcon className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-medium">离线模式</span>
            <p className="text-xs opacity-90">正在使用缓存数据</p>
          </div>
        </div>
      )}

      {/* 在线恢复提示 */}
      {isOnline && (
        <div className="fixed top-20 left-4 right-4 bg-green-600 text-white p-3 rounded-lg shadow-lg z-50 flex items-center gap-3 animate-slide-down">
          <WifiIcon className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">网络已恢复</span>
        </div>
      )}
    </>
  )
}

export default {
  PWAProvider,
  usePWA
}
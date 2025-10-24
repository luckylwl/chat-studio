import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  WifiIcon,
  SignalIcon,
  SignalSlashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

export interface NetworkStatus {
  online: boolean
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown'
  downlink: number // Mbps
  rtt: number // 往返时间 ms
  saveData: boolean
}

interface NetworkStatusIndicatorProps {
  showDetails?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  autoHide?: boolean // 网络正常时自动隐藏
  autoHideDelay?: number // 自动隐藏延迟(ms)
  onNetworkChange?: (status: NetworkStatus) => void
}

/**
 * 网络状态指示器组件
 * 实时显示网络连接状态和质量
 */
const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showDetails = false,
  position = 'bottom-right',
  autoHide = true,
  autoHideDelay = 3000,
  onNetworkChange,
}) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    online: navigator.onLine,
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
  })
  const [isVisible, setIsVisible] = useState(true)
  const [showOfflineNotification, setShowOfflineNotification] = useState(false)

  // 获取网络信息
  const getNetworkInfo = (): NetworkStatus => {
    const connection = (navigator as any).connection ||
                       (navigator as any).mozConnection ||
                       (navigator as any).webkitConnection

    if (connection) {
      return {
        online: navigator.onLine,
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false,
      }
    }

    return {
      online: navigator.onLine,
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false,
    }
  }

  // 监听网络状态变化
  useEffect(() => {
    const updateNetworkStatus = () => {
      const status = getNetworkInfo()
      setNetworkStatus(status)
      onNetworkChange?.(status)

      // 如果从离线变为在线,显示通知
      if (status.online && !networkStatus.online) {
        setIsVisible(true)
        setShowOfflineNotification(false)
      }

      // 如果从在线变为离线,显示警告
      if (!status.online && networkStatus.online) {
        setIsVisible(true)
        setShowOfflineNotification(true)
      }
    }

    // 监听在线/离线事件
    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)

    // 监听网络信息变化
    const connection = (navigator as any).connection ||
                       (navigator as any).mozConnection ||
                       (navigator as any).webkitConnection

    if (connection) {
      connection.addEventListener('change', updateNetworkStatus)
    }

    // 初始检查
    updateNetworkStatus()

    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus)
      }
    }
  }, [networkStatus.online, onNetworkChange])

  // 自动隐藏逻辑
  useEffect(() => {
    if (!autoHide || !networkStatus.online) return

    const timer = setTimeout(() => {
      setIsVisible(false)
    }, autoHideDelay)

    return () => clearTimeout(timer)
  }, [autoHide, autoHideDelay, networkStatus])

  // 获取网络质量描述
  const getNetworkQuality = (): {
    label: string
    color: string
    icon: React.ComponentType<{ className?: string }>
  } => {
    if (!networkStatus.online) {
      return {
        label: '离线',
        color: 'text-red-600 dark:text-red-400',
        icon: SignalSlashIcon,
      }
    }

    switch (networkStatus.effectiveType) {
      case 'slow-2g':
      case '2g':
        return {
          label: '网络较慢',
          color: 'text-orange-600 dark:text-orange-400',
          icon: SignalIcon,
        }
      case '3g':
        return {
          label: '网络一般',
          color: 'text-yellow-600 dark:text-yellow-400',
          icon: SignalIcon,
        }
      case '4g':
      case 'wifi':
        return {
          label: '网络良好',
          color: 'text-green-600 dark:text-green-400',
          icon: WifiIcon,
        }
      default:
        return {
          label: '已连接',
          color: 'text-blue-600 dark:text-blue-400',
          icon: WifiIcon,
        }
    }
  }

  // 获取定位样式
  const getPositionClasses = () => {
    const positions = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4',
    }
    return positions[position]
  }

  const quality = getNetworkQuality()
  const Icon = quality.icon

  return (
    <>
      {/* 主指示器 */}
      <AnimatePresence>
        {(isVisible || !networkStatus.online) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed ${getPositionClasses()} z-50`}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 min-w-[200px]">
              {/* 基础状态 */}
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${quality.color}`} />
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${quality.color}`}>
                    {quality.label}
                  </div>
                  {networkStatus.online && networkStatus.effectiveType !== 'unknown' && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {networkStatus.effectiveType.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* 详细信息 */}
              {showDetails && networkStatus.online && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">下载速度</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {networkStatus.downlink.toFixed(1)} Mbps
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">延迟</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {networkStatus.rtt} ms
                    </span>
                  </div>
                  {networkStatus.saveData && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <ArrowPathIcon className="w-3 h-3" />
                      <span>省流量模式已开启</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 离线模式通知横幅 */}
      <AnimatePresence>
        {showOfflineNotification && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[100]"
          >
            <div className="bg-red-600 text-white py-3 px-4 shadow-lg">
              <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SignalSlashIcon className="w-6 h-6" />
                  <div>
                    <div className="font-semibold">网络连接已断开</div>
                    <div className="text-sm opacity-90">
                      你现在处于离线模式,部分功能可能不可用
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowOfflineNotification(false)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
                >
                  知道了
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default NetworkStatusIndicator
export type { NetworkStatus }

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheckIcon,
  ShieldExclamationIcon,
  LockClosedIcon,
  LockOpenIcon,
  KeyIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import securityService, { type SecurityPolicy, type SecuritySession, type SecurityThreat } from '@/services/securityService'
import encryptionService, { type EncryptionConfig, type SecurityAuditEvent } from '@/services/encryptionService'

interface SecurityDashboardProps {
  className?: string
}

interface SecurityMetric {
  label: string
  value: string | number
  status: 'good' | 'warning' | 'danger'
  icon: React.ReactNode
  description: string
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ className }) => {
  const [securityStatus, setSecurityStatus] = useState(securityService.getSecurityStatus())
  const [session, setSession] = useState<SecuritySession | null>(securityService.getSession())
  const [threats, setThreats] = useState<SecurityThreat[]>(securityService.getThreats())
  const [auditLog, setAuditLog] = useState<SecurityAuditEvent[]>(encryptionService.getSecurityAuditLog())
  const [policy, setPolicy] = useState<SecurityPolicy>(securityService.getPolicy())
  const [encryptionConfig, setEncryptionConfig] = useState<EncryptionConfig>(encryptionService.getConfig())
  const [activeTab, setActiveTab] = useState<'overview' | 'threats' | 'audit' | 'config'>('overview')
  const [showSensitiveData, setShowSensitiveData] = useState(false)

  useEffect(() => {
    // Set up event listeners
    const handleSecurityEvent = () => {
      setSecurityStatus(securityService.getSecurityStatus())
      setThreats(securityService.getThreats())
      setAuditLog(encryptionService.getSecurityAuditLog())
    }

    const handleSessionUpdate = (updatedSession: SecuritySession) => {
      setSession(updatedSession)
      setSecurityStatus(securityService.getSecurityStatus())
    }

    const handleThreatDetected = (threat: SecurityThreat) => {
      setThreats(securityService.getThreats())
      setSecurityStatus(securityService.getSecurityStatus())
    }

    const handlePolicyUpdate = (updatedPolicy: SecurityPolicy) => {
      setPolicy(updatedPolicy)
    }

    securityService.on('security_event', handleSecurityEvent)
    securityService.on('session_updated', handleSessionUpdate)
    securityService.on('threat_detected', handleThreatDetected)
    securityService.on('policy_updated', handlePolicyUpdate)
    encryptionService.on('security_event', handleSecurityEvent)

    // Cleanup
    return () => {
      securityService.off('security_event', handleSecurityEvent)
      securityService.off('session_updated', handleSessionUpdate)
      securityService.off('threat_detected', handleThreatDetected)
      securityService.off('policy_updated', handlePolicyUpdate)
      encryptionService.off('security_event', handleSecurityEvent)
    }
  }, [])

  const getSecurityMetrics = (): SecurityMetric[] => {
    const stats = encryptionService.getSecurityStats()

    return [
      {
        label: '安全等级',
        value: securityStatus.securityLevel === 'high' ? '高' : securityStatus.securityLevel === 'medium' ? '中' : '低',
        status: securityStatus.securityLevel === 'high' ? 'good' : securityStatus.securityLevel === 'medium' ? 'warning' : 'danger',
        icon: securityStatus.securityLevel === 'high' ? <ShieldCheckIcon className="h-5 w-5" /> : <ShieldExclamationIcon className="h-5 w-5" />,
        description: '当前系统整体安全水平'
      },
      {
        label: '会话状态',
        value: securityStatus.sessionActive ? (securityStatus.sessionLocked ? '已锁定' : '活跃') : '未激活',
        status: securityStatus.sessionActive && !securityStatus.sessionLocked ? 'good' : 'warning',
        icon: securityStatus.sessionLocked ? <LockClosedIcon className="h-5 w-5" /> : <LockOpenIcon className="h-5 w-5" />,
        description: '当前用户会话安全状态'
      },
      {
        label: '加密状态',
        value: securityStatus.encryptionEnabled ? '已启用' : '未启用',
        status: securityStatus.encryptionEnabled ? 'good' : 'danger',
        icon: <KeyIcon className="h-5 w-5" />,
        description: '数据加密保护状态'
      },
      {
        label: '未解决威胁',
        value: securityStatus.unresolvedThreats,
        status: securityStatus.unresolvedThreats === 0 ? 'good' : securityStatus.highSeverityThreats > 0 ? 'danger' : 'warning',
        icon: <ExclamationTriangleIcon className="h-5 w-5" />,
        description: '需要处理的安全威胁数量'
      },
      {
        label: '加密操作',
        value: stats.encryptionCount + stats.decryptionCount,
        status: 'good',
        icon: <DocumentTextIcon className="h-5 w-5" />,
        description: '累计执行的加密解密操作'
      },
      {
        label: '最后活动',
        value: securityStatus.lastActivity ? formatRelativeTime(securityStatus.lastActivity) : '无',
        status: 'good',
        icon: <ClockIcon className="h-5 w-5" />,
        description: '最近一次安全相关活动时间'
      }
    ]
  }

  const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    return `${diffDays}天前`
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300'
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'danger': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const getThreatSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-300 dark:bg-red-900/30 dark:text-red-300'
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300'
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'low': return 'text-blue-700 bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300'
      default: return 'text-gray-700 bg-gray-100 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300'
    }
  }

  const handleResolveThreat = (threatId: string): void => {
    securityService.resolveThreat(threatId)
  }

  const handleLockSession = (): void => {
    securityService.lockSession()
  }

  const handleUnlockSession = (): void => {
    securityService.unlockSession()
  }

  const handleRotateKeys = async (): Promise<void> => {
    try {
      await encryptionService.rotateKeys()
      setAuditLog(encryptionService.getSecurityAuditLog())
    } catch (error) {
      console.error('Key rotation failed:', error)
    }
  }

  const handleExportAuditLog = (): void => {
    try {
      const auditData = securityService.exportAuditLog()
      const blob = new Blob([auditData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `security-audit-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleUpdatePolicy = (updates: Partial<SecurityPolicy>): void => {
    securityService.updatePolicy(updates)
  }

  const securityMetrics = getSecurityMetrics()
  const unresolvedThreats = threats.filter(t => !t.resolved)
  const recentAuditEvents = auditLog.slice(-20).reverse()

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            安全仪表板
          </h2>
          <div className={cn(
            "px-2 py-1 rounded-full text-xs font-medium",
            getStatusColor(securityStatus.securityLevel)
          )}>
            {securityStatus.securityLevel === 'high' ? '安全' : securityStatus.securityLevel === 'medium' ? '警告' : '危险'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSensitiveData(!showSensitiveData)}
          >
            {showSensitiveData ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
            {showSensitiveData ? '隐藏' : '显示'}敏感数据
          </Button>

          {session && !session.isLocked && (
            <Button variant="outline" size="sm" onClick={handleLockSession}>
              <LockClosedIcon className="h-4 w-4 mr-1" />
              锁定会话
            </Button>
          )}

          {session && session.isLocked && (
            <Button variant="outline" size="sm" onClick={handleUnlockSession}>
              <LockOpenIcon className="h-4 w-4 mr-1" />
              解锁会话
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleRotateKeys}>
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            轮换密钥
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: '概览', icon: ShieldCheckIcon },
            { id: 'threats', name: '威胁', icon: ExclamationTriangleIcon },
            { id: 'audit', name: '审计日志', icon: DocumentTextIcon },
            { id: 'config', name: '配置', icon: KeyIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
              {tab.id === 'threats' && unresolvedThreats.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {unresolvedThreats.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Security Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {securityMetrics.map((metric, index) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={cn("p-2 rounded-lg", getStatusColor(metric.status))}>
                        {metric.icon}
                      </div>
                      <span className={cn(
                        "text-2xl font-bold",
                        metric.status === 'good' ? 'text-green-600' :
                        metric.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                      )}>
                        {metric.value}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{metric.label}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{metric.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* Session Information */}
              {session && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    当前会话
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">会话ID</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                        {showSensitiveData ? session.id : session.id.substring(0, 8) + '...'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">用户ID</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {showSensitiveData ? session.userId : '***'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">创建时间</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {session.createdAt.toLocaleString('zh-CN')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">最后活动</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {formatRelativeTime(session.lastActivity)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">IP地址</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {showSensitiveData ? session.ipAddress : '***'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">失败尝试</label>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {session.failedAttempts} / {policy.maxFailedAttempts}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">快速操作</h3>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" size="sm" onClick={handleExportAuditLog}>
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    导出审计日志
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => encryptionService.clearCache()}>
                    <TrashIcon className="h-4 w-4 mr-1" />
                    清除缓存
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => securityService.terminateSession()}>
                    <XCircleIcon className="h-4 w-4 mr-1" />
                    终止会话
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'threats' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  安全威胁 ({unresolvedThreats.length} 未解决)
                </h3>
              </div>

              {unresolvedThreats.length === 0 ? (
                <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">没有未解决的安全威胁</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unresolvedThreats.map((threat) => (
                    <motion.div
                      key={threat.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "p-4 rounded-lg border-l-4",
                        getThreatSeverityColor(threat.severity)
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium uppercase">
                              {threat.type.replace('_', ' ')}
                            </span>
                            <span className={cn(
                              "px-2 py-1 text-xs font-medium rounded-full",
                              getThreatSeverityColor(threat.severity)
                            )}>
                              {threat.severity}
                            </span>
                          </div>
                          <p className="text-gray-900 dark:text-gray-100 mb-2">{threat.description}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            检测时间: {threat.timestamp.toLocaleString('zh-CN')}
                          </p>
                          {threat.source && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              来源: {threat.source}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveThreat(threat.id)}
                        >
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          解决
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Resolved Threats */}
              {threats.filter(t => t.resolved).length > 0 && (
                <div className="mt-8">
                  <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
                    已解决威胁 ({threats.filter(t => t.resolved).length})
                  </h4>
                  <div className="space-y-2">
                    {threats.filter(t => t.resolved).slice(-5).map((threat) => (
                      <div
                        key={threat.id}
                        className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircleIcon className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-900 dark:text-gray-100">{threat.description}</span>
                          <span className="text-xs text-gray-500">
                            {threat.timestamp.toLocaleString('zh-CN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  安全审计日志 ({recentAuditEvents.length})
                </h3>
                <Button variant="outline" size="sm" onClick={handleExportAuditLog}>
                  <DocumentTextIcon className="h-4 w-4 mr-1" />
                  导出日志
                </Button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {recentAuditEvents.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      暂无审计日志
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {recentAuditEvents.map((event, index) => (
                        <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                  "w-2 h-2 rounded-full",
                                  event.success ? 'bg-green-500' : 'bg-red-500'
                                )} />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {event.type.replace('_', ' ').toUpperCase()}
                                </span>
                                {event.algorithm && (
                                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                    {event.algorithm}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {event.timestamp.toLocaleString('zh-CN')}
                              </p>
                              {event.dataSize && (
                                <p className="text-xs text-gray-500">
                                  数据大小: {event.dataSize} 字节
                                </p>
                              )}
                              {event.error && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  错误: {event.error}
                                </p>
                              )}
                            </div>
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-full",
                              event.success
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            )}>
                              {event.success ? '成功' : '失败'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Security Policy */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">安全策略</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={policy.enforceEncryption}
                        onChange={(e) => handleUpdatePolicy({ enforceEncryption: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">强制加密</span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      要求所有敏感数据必须加密存储
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={policy.enableTwoFactor}
                        onChange={(e) => handleUpdatePolicy({ enableTwoFactor: e.target.checked })}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">双因素认证</span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      启用额外的身份验证层
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      自动锁定时间 (分钟)
                    </label>
                    <input
                      type="number"
                      value={policy.autoLockTimeout}
                      onChange={(e) => handleUpdatePolicy({ autoLockTimeout: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="1"
                      max="1440"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      最大失败尝试次数
                    </label>
                    <input
                      type="number"
                      value={policy.maxFailedAttempts}
                      onChange={(e) => handleUpdatePolicy({ maxFailedAttempts: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
              </div>

              {/* Encryption Configuration */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">加密配置</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      加密算法
                    </label>
                    <select
                      value={encryptionConfig.algorithm}
                      onChange={(e) => encryptionService.updateConfig({ algorithm: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="AES-GCM">AES-GCM</option>
                      <option value="AES-CBC">AES-CBC</option>
                      <option value="AES-CTR">AES-CTR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      密钥长度 (位)
                    </label>
                    <select
                      value={encryptionConfig.keyLength}
                      onChange={(e) => encryptionService.updateConfig({ keyLength: parseInt(e.target.value) as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value={128}>128</option>
                      <option value={192}>192</option>
                      <option value={256}>256</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      PBKDF2 迭代次数
                    </label>
                    <input
                      type="number"
                      value={encryptionConfig.iterations}
                      onChange={(e) => encryptionService.updateConfig({ iterations: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="10000"
                      max="1000000"
                      step="10000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      盐值长度 (字节)
                    </label>
                    <select
                      value={encryptionConfig.saltLength}
                      onChange={(e) => encryptionService.updateConfig({ saltLength: parseInt(e.target.value) as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value={16}>16</option>
                      <option value={32}>32</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Password Policy */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">密码策略</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      最小长度
                    </label>
                    <input
                      type="number"
                      value={policy.passwordComplexity.minLength}
                      onChange={(e) => handleUpdatePolicy({
                        passwordComplexity: {
                          ...policy.passwordComplexity,
                          minLength: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      min="4"
                      max="64"
                    />
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'requireUppercase', label: '需要大写字母' },
                      { key: 'requireLowercase', label: '需要小写字母' },
                      { key: 'requireNumbers', label: '需要数字' },
                      { key: 'requireSpecialChars', label: '需要特殊字符' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={policy.passwordComplexity[item.key as keyof typeof policy.passwordComplexity]}
                          onChange={(e) => handleUpdatePolicy({
                            passwordComplexity: {
                              ...policy.passwordComplexity,
                              [item.key]: e.target.checked
                            }
                          })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default SecurityDashboard
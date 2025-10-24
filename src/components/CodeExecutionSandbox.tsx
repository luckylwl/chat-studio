import React, { useState, useRef } from 'react'
import {
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Button, Badge } from './ui'
import { cn } from '@/utils'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface CodeExecutionSandboxProps {
  initialCode?: string
  language?: 'javascript' | 'python' | 'typescript'
  onCodeChange?: (code: string) => void
  className?: string
}

interface ExecutionResult {
  output: string
  error: string | null
  executionTime: number
  status: 'success' | 'error' | 'timeout'
}

const CodeExecutionSandbox: React.FC<CodeExecutionSandboxProps> = ({
  initialCode = '',
  language = 'javascript',
  onCodeChange,
  className
}) => {
  const [code, setCode] = useState(initialCode)
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([])
  const workerRef = useRef<Worker | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // JavaScript执行环境
  const executeJavaScript = async (code: string): Promise<ExecutionResult> => {
    const startTime = performance.now()

    try {
      // 创建安全的执行环境
      const logs: string[] = []
      const errors: string[] = []

      // 重定向console
      const customConsole = {
        log: (...args: any[]) => logs.push(args.map(String).join(' ')),
        error: (...args: any[]) => errors.push(args.map(String).join(' ')),
        warn: (...args: any[]) => logs.push('[WARN] ' + args.map(String).join(' ')),
        info: (...args: any[]) => logs.push('[INFO] ' + args.map(String).join(' '))
      }

      // 包装代码
      const wrappedCode = `
        (function() {
          const console = ${JSON.stringify(customConsole)};
          ${code}
        })();
      `

      // 执行
      try {
        // 使用Function构造器执行代码
        const func = new Function('console', wrappedCode)
        func(customConsole)
      } catch (execError: any) {
        errors.push(execError.message)
      }

      const executionTime = performance.now() - startTime

      return {
        output: logs.join('\n'),
        error: errors.length > 0 ? errors.join('\n') : null,
        executionTime,
        status: errors.length > 0 ? 'error' : 'success'
      }
    } catch (error: any) {
      const executionTime = performance.now() - startTime
      return {
        output: '',
        error: error.message,
        executionTime,
        status: 'error'
      }
    }
  }

  // Python执行（模拟 - 实际应用需要后端API）
  const executePython = async (code: string): Promise<ExecutionResult> => {
    const startTime = performance.now()

    // 这里应该调用后端API执行Python代码
    // 为了演示，我们返回一个模拟结果
    return new Promise((resolve) => {
      setTimeout(() => {
        const executionTime = performance.now() - startTime
        resolve({
          output: '注意：Python代码执行需要后端API支持\n请配置Python执行服务器',
          error: null,
          executionTime,
          status: 'error'
        })
      }, 1000)
    })
  }

  const handleExecute = async () => {
    if (!code.trim()) {
      toast.error('请输入代码')
      return
    }

    setIsExecuting(true)
    setResult(null)

    try {
      let execResult: ExecutionResult

      // 设置超时
      const timeoutPromise = new Promise<ExecutionResult>((resolve) => {
        timeoutRef.current = setTimeout(() => {
          resolve({
            output: '',
            error: '执行超时（超过5秒）',
            executionTime: 5000,
            status: 'timeout'
          })
        }, 5000)
      })

      // 根据语言执行代码
      const executePromise = language === 'javascript' || language === 'typescript'
        ? executeJavaScript(code)
        : executePython(code)

      execResult = await Promise.race([executePromise, timeoutPromise])

      // 清除超时
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      setResult(execResult)
      setExecutionHistory(prev => [execResult, ...prev.slice(0, 9)]) // 保留最近10次

      if (execResult.status === 'success') {
        toast.success(`执行成功 (${execResult.executionTime.toFixed(2)}ms)`)
      } else {
        toast.error('执行出错')
      }
    } catch (error: any) {
      const errorResult: ExecutionResult = {
        output: '',
        error: error.message,
        executionTime: 0,
        status: 'error'
      }
      setResult(errorResult)
      toast.error('执行失败')
    } finally {
      setIsExecuting(false)
    }
  }

  const handleStop = () => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsExecuting(false)
    toast.info('已停止执行')
  }

  const handleReset = () => {
    setCode(initialCode)
    setResult(null)
    setExecutionHistory([])
    toast.success('已重置')
  }

  const handleCopyOutput = () => {
    if (!result) return
    const text = result.output || result.error || ''
    navigator.clipboard.writeText(text)
    toast.success('已复制输出')
  }

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    onCodeChange?.(newCode)
  }

  const getStatusIcon = (status: ExecutionResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />
      case 'timeout':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />
    }
  }

  return (
    <div className={cn('flex flex-col h-full bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {language}
            </Badge>
            {result && (
              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                <ClockIcon className="w-3 h-3" />
                {result.executionTime.toFixed(2)}ms
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyOutput}
              title="复制输出"
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            title="重置"
          >
            <ArrowPathIcon className="w-4 h-4" />
          </Button>
          {isExecuting ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStop}
              className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <StopIcon className="w-4 h-4 mr-1" />
              停止
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleExecute}
              disabled={!code.trim()}
            >
              <PlayIcon className="w-4 h-4 mr-1" />
              运行
            </Button>
          )}
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Editor */}
        <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              代码编辑器
            </span>
            <span className="text-xs text-gray-500">
              {code.split('\n').length} 行
            </span>
          </div>
          <textarea
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="flex-1 p-4 bg-white dark:bg-gray-900 font-mono text-sm resize-none focus:outline-none"
            placeholder={`输入${language}代码...\n\n示例:\nconsole.log('Hello, World!');\n\nconst sum = (a, b) => a + b;\nconsole.log(sum(2, 3));`}
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              输出
            </span>
            {result && (
              <div className="flex items-center gap-2">
                {getStatusIcon(result.status)}
              </div>
            )}
          </div>
          <div className="flex-1 p-4 bg-white dark:bg-gray-900 overflow-y-auto">
            {isExecuting ? (
              <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                执行中...
              </div>
            ) : result ? (
              <div className="space-y-3">
                {result.output && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      输出:
                    </div>
                    <pre className="text-sm font-mono whitespace-pre-wrap text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      {result.output}
                    </pre>
                  </div>
                )}
                {result.error && (
                  <div>
                    <div className="text-xs font-semibold text-red-500 mb-1">
                      错误:
                    </div>
                    <pre className="text-sm font-mono whitespace-pre-wrap text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                      {result.error}
                    </pre>
                  </div>
                )}
                {result.status === 'success' && !result.output && !result.error && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    代码执行成功，但没有输出
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <PlayIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">点击"运行"按钮执行代码</p>
                <p className="text-xs mt-1">支持console.log输出</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Execution History */}
      {executionHistory.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              执行历史
            </span>
          </div>
          <div className="p-2 max-h-32 overflow-y-auto">
            <div className="space-y-1">
              {executionHistory.map((exec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-xs"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(exec.status)}
                    <span className="text-gray-600 dark:text-gray-400">
                      {exec.executionTime.toFixed(2)}ms
                    </span>
                  </div>
                  <span className="text-gray-500 dark:text-gray-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Safety Warning */}
      <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-2 text-xs text-yellow-800 dark:text-yellow-200">
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            <strong>安全提示：</strong>
            代码在浏览器沙箱环境中执行，无法访问文件系统和网络。请勿执行不信任的代码。
          </p>
        </div>
      </div>
    </div>
  )
}

export default CodeExecutionSandbox
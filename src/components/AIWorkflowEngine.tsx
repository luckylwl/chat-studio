import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowRightIcon,
  CogIcon,
  LightBulbIcon,
  BoltIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'

interface WorkflowStep {
  id: string
  type: 'prompt' | 'transform' | 'analyze' | 'generate' | 'condition' | 'loop'
  name: string
  config: {
    prompt?: string
    model?: string
    temperature?: number
    maxTokens?: number
    condition?: string
    iterations?: number
    transformRule?: string
  }
  inputs: string[]
  outputs: string[]
  position: { x: number; y: number }
  status: 'pending' | 'running' | 'completed' | 'error'
  result?: any
  error?: string
  executionTime?: number
}

interface Workflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  connections: Array<{ from: string; to: string; fromPort: string; toPort: string }>
  variables: Record<string, any>
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error'
  createdAt: number
  lastRun?: number
  totalRuns: number
}

interface AIWorkflowEngineProps {
  onWorkflowRun?: (workflow: Workflow, result: any) => void
  className?: string
}

export const AIWorkflowEngine: React.FC<AIWorkflowEngineProps> = ({
  onWorkflowRun,
  className
}) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionLog, setExecutionLog] = useState<string[]>([])
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [draggedStep, setDraggedStep] = useState<WorkflowStep | null>(null)
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  // 创建新工作流
  const createWorkflow = useCallback(() => {
    const newWorkflow: Workflow = {
      id: `workflow_${Date.now()}`,
      name: '新工作流',
      description: '描述你的AI工作流程',
      steps: [],
      connections: [],
      variables: {},
      status: 'idle',
      createdAt: Date.now(),
      totalRuns: 0
    }

    setWorkflows(prev => [...prev, newWorkflow])
    setCurrentWorkflow(newWorkflow)
    toast.success('已创建新工作流')
  }, [])

  // 添加步骤模板
  const stepTemplates: Omit<WorkflowStep, 'id' | 'position' | 'status'>[] = [
    {
      type: 'prompt',
      name: 'AI对话',
      config: { prompt: '请输入提示词...', model: 'gpt-3.5-turbo', temperature: 0.7, maxTokens: 2000 },
      inputs: ['input'],
      outputs: ['response'],
      result: null
    },
    {
      type: 'transform',
      name: '文本转换',
      config: { transformRule: 'uppercase' },
      inputs: ['text'],
      outputs: ['transformedText'],
      result: null
    },
    {
      type: 'analyze',
      name: '情感分析',
      config: { prompt: '分析以下文本的情感色彩：' },
      inputs: ['text'],
      outputs: ['sentiment', 'confidence'],
      result: null
    },
    {
      type: 'generate',
      name: '内容生成',
      config: { prompt: '基于以下信息生成内容：', temperature: 0.8 },
      inputs: ['context'],
      outputs: ['generatedContent'],
      result: null
    },
    {
      type: 'condition',
      name: '条件判断',
      config: { condition: 'value > 0.5' },
      inputs: ['value'],
      outputs: ['true', 'false'],
      result: null
    },
    {
      type: 'loop',
      name: '循环处理',
      config: { iterations: 3 },
      inputs: ['items'],
      outputs: ['processedItems'],
      result: null
    }
  ]

  // 添加步骤到画布
  const addStep = useCallback((template: Omit<WorkflowStep, 'id' | 'position' | 'status'>) => {
    if (!currentWorkflow) return

    const newStep: WorkflowStep = {
      ...template,
      id: `step_${Date.now()}`,
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
      status: 'pending'
    }

    const updatedWorkflow = {
      ...currentWorkflow,
      steps: [...currentWorkflow.steps, newStep]
    }

    setCurrentWorkflow(updatedWorkflow)
    setWorkflows(prev => prev.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w))
  }, [currentWorkflow])

  // 删除步骤
  const deleteStep = useCallback((stepId: string) => {
    if (!currentWorkflow) return

    const updatedWorkflow = {
      ...currentWorkflow,
      steps: currentWorkflow.steps.filter(s => s.id !== stepId),
      connections: currentWorkflow.connections.filter(c => c.from !== stepId && c.to !== stepId)
    }

    setCurrentWorkflow(updatedWorkflow)
    setWorkflows(prev => prev.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w))
    setSelectedStep(null)
  }, [currentWorkflow])

  // 执行单个步骤
  const executeStep = async (step: WorkflowStep, inputs: Record<string, any>): Promise<any> => {
    const startTime = Date.now()

    try {
      let result: any

      switch (step.type) {
        case 'prompt':
          // 模拟AI API调用
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
          result = {
            response: `AI回复基于提示："${step.config.prompt}" 和输入："${inputs.input || ''}"`
          }
          break

        case 'transform':
          const text = inputs.text || ''
          const rule = step.config.transformRule || 'lowercase'
          result = {
            transformedText: rule === 'uppercase' ? text.toUpperCase() :
                           rule === 'lowercase' ? text.toLowerCase() :
                           rule === 'reverse' ? text.split('').reverse().join('') : text
          }
          break

        case 'analyze':
          await new Promise(resolve => setTimeout(resolve, 800))
          result = {
            sentiment: Math.random() > 0.5 ? 'positive' : 'negative',
            confidence: Math.random()
          }
          break

        case 'generate':
          await new Promise(resolve => setTimeout(resolve, 1500))
          result = {
            generatedContent: `基于上下文"${inputs.context || ''}"生成的内容`
          }
          break

        case 'condition':
          const value = parseFloat(inputs.value) || 0
          const condition = step.config.condition || 'value > 0.5'
          const conditionResult = eval(condition.replace('value', value.toString()))
          result = conditionResult ? { true: inputs } : { false: inputs }
          break

        case 'loop':
          const items = Array.isArray(inputs.items) ? inputs.items : [inputs.items]
          const iterations = step.config.iterations || 1
          const processedItems = []
          for (let i = 0; i < Math.min(iterations, items.length); i++) {
            processedItems.push(`处理项目 ${i + 1}: ${items[i]}`)
          }
          result = { processedItems }
          break

        default:
          result = inputs
      }

      const executionTime = Date.now() - startTime

      return { ...result, executionTime }

    } catch (error) {
      throw new Error(`步骤 ${step.name} 执行失败: ${error}`)
    }
  }

  // 执行工作流
  const executeWorkflow = useCallback(async () => {
    if (!currentWorkflow || isExecuting) return

    setIsExecuting(true)
    setExecutionLog(['开始执行工作流...'])

    const updatedWorkflow = { ...currentWorkflow, status: 'running' as const }
    setCurrentWorkflow(updatedWorkflow)

    try {
      const stepResults: Record<string, any> = {}
      const executionOrder = topologicalSort(updatedWorkflow.steps, updatedWorkflow.connections)

      for (const step of executionOrder) {
        setExecutionLog(prev => [...prev, `执行步骤: ${step.name}`])

        // 更新步骤状态
        step.status = 'running'
        setCurrentWorkflow(prev => prev ? {
          ...prev,
          steps: prev.steps.map(s => s.id === step.id ? step : s)
        } : null)

        // 收集输入数据
        const stepInputs: Record<string, any> = {}

        // 从连接中获取输入
        for (const connection of updatedWorkflow.connections) {
          if (connection.to === step.id) {
            const fromStepResult = stepResults[connection.from]
            if (fromStepResult && fromStepResult[connection.fromPort]) {
              stepInputs[connection.toPort] = fromStepResult[connection.fromPort]
            }
          }
        }

        try {
          const result = await executeStep(step, stepInputs)
          stepResults[step.id] = result

          step.status = 'completed'
          step.result = result
          step.executionTime = result.executionTime

          setExecutionLog(prev => [...prev, `✅ ${step.name} 完成`])

        } catch (error) {
          step.status = 'error'
          step.error = error instanceof Error ? error.message : String(error)
          setExecutionLog(prev => [...prev, `❌ ${step.name} 失败: ${step.error}`])
          throw error
        }

        setCurrentWorkflow(prev => prev ? {
          ...prev,
          steps: prev.steps.map(s => s.id === step.id ? step : s)
        } : null)
      }

      const finalWorkflow = {
        ...updatedWorkflow,
        status: 'completed' as const,
        lastRun: Date.now(),
        totalRuns: updatedWorkflow.totalRuns + 1
      }

      setCurrentWorkflow(finalWorkflow)
      setWorkflows(prev => prev.map(w => w.id === finalWorkflow.id ? finalWorkflow : w))
      setExecutionLog(prev => [...prev, '🎉 工作流执行完成'])

      onWorkflowRun?.(finalWorkflow, stepResults)
      toast.success('工作流执行完成')

    } catch (error) {
      const errorWorkflow = { ...updatedWorkflow, status: 'error' as const }
      setCurrentWorkflow(errorWorkflow)
      setWorkflows(prev => prev.map(w => w.id === errorWorkflow.id ? errorWorkflow : w))
      setExecutionLog(prev => [...prev, `💥 工作流执行失败: ${error}`])
      toast.error('工作流执行失败')
    } finally {
      setIsExecuting(false)
    }
  }, [currentWorkflow, isExecuting, onWorkflowRun])

  // 拓扑排序确定执行顺序
  const topologicalSort = (steps: WorkflowStep[], connections: Workflow['connections']): WorkflowStep[] => {
    const graph = new Map<string, string[]>()
    const inDegree = new Map<string, number>()

    // 初始化
    steps.forEach(step => {
      graph.set(step.id, [])
      inDegree.set(step.id, 0)
    })

    // 构建图
    connections.forEach(conn => {
      graph.get(conn.from)?.push(conn.to)
      inDegree.set(conn.to, (inDegree.get(conn.to) || 0) + 1)
    })

    // 拓扑排序
    const queue: string[] = []
    const result: WorkflowStep[] = []

    inDegree.forEach((degree, stepId) => {
      if (degree === 0) queue.push(stepId)
    })

    while (queue.length > 0) {
      const stepId = queue.shift()!
      const step = steps.find(s => s.id === stepId)
      if (step) result.push(step)

      graph.get(stepId)?.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1
        inDegree.set(neighbor, newDegree)
        if (newDegree === 0) queue.push(neighbor)
      })
    }

    return result
  }

  // 停止执行
  const stopExecution = useCallback(() => {
    setIsExecuting(false)
    if (currentWorkflow) {
      const stoppedWorkflow = { ...currentWorkflow, status: 'idle' as const }
      setCurrentWorkflow(stoppedWorkflow)
      setWorkflows(prev => prev.map(w => w.id === stoppedWorkflow.id ? stoppedWorkflow : w))
    }
    toast.info('工作流执行已停止')
  }, [currentWorkflow])

  // 复制工作流
  const cloneWorkflow = useCallback((workflow: Workflow) => {
    const cloned: Workflow = {
      ...workflow,
      id: `workflow_${Date.now()}`,
      name: `${workflow.name} (副本)`,
      createdAt: Date.now(),
      lastRun: undefined,
      totalRuns: 0,
      status: 'idle'
    }

    setWorkflows(prev => [...prev, cloned])
    toast.success('工作流已复制')
  }, [])

  return (
    <div className={cn("h-full flex flex-col bg-white dark:bg-gray-900", className)}>
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BoltIcon className="h-6 w-6 text-purple-500" />
            AI工作流引擎
          </h2>

          {currentWorkflow && (
            <div className="flex items-center gap-2">
              <Button
                onClick={executeWorkflow}
                disabled={isExecuting || !currentWorkflow.steps.length}
                className="gap-2"
                size="sm"
              >
                <PlayIcon className="h-4 w-4" />
                {isExecuting ? '执行中...' : '运行'}
              </Button>

              {isExecuting && (
                <Button
                  onClick={stopExecution}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <StopIcon className="h-4 w-4" />
                  停止
                </Button>
              )}

              <div className={cn(
                "px-2 py-1 rounded text-xs font-medium",
                currentWorkflow.status === 'idle' && "bg-gray-100 text-gray-700",
                currentWorkflow.status === 'running' && "bg-blue-100 text-blue-700",
                currentWorkflow.status === 'completed' && "bg-green-100 text-green-700",
                currentWorkflow.status === 'error' && "bg-red-100 text-red-700"
              )}>
                {currentWorkflow.status === 'idle' && '待运行'}
                {currentWorkflow.status === 'running' && '运行中'}
                {currentWorkflow.status === 'completed' && '已完成'}
                {currentWorkflow.status === 'error' && '执行错误'}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={createWorkflow} variant="outline" size="sm">
            <PlusIcon className="h-4 w-4" />
            新建工作流
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* 左侧工作流列表 */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">工作流列表</h3>

          <div className="space-y-2 mb-6">
            {workflows.map(workflow => (
              <div
                key={workflow.id}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-colors",
                  currentWorkflow?.id === workflow.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
                onClick={() => setCurrentWorkflow(workflow)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{workflow.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      cloneWorkflow(workflow)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">{workflow.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{workflow.steps.length} 步骤</span>
                  <span>{workflow.totalRuns} 次运行</span>
                </div>
              </div>
            ))}
          </div>

          {/* 步骤模板 */}
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">添加步骤</h3>
          <div className="space-y-1">
            {stepTemplates.map((template, index) => (
              <button
                key={index}
                onClick={() => addStep(template)}
                disabled={!currentWorkflow}
                className="w-full p-2 text-left text-sm border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        {/* 中间画布区域 */}
        <div className="flex-1 flex flex-col">
          {currentWorkflow ? (
            <>
              {/* 画布 */}
              <div
                ref={canvasRef}
                className="flex-1 relative bg-gray-50 dark:bg-gray-800 overflow-auto"
                style={{ transform: `scale(${zoom})` }}
              >
                {/* 步骤节点 */}
                {currentWorkflow.steps.map(step => (
                  <div
                    key={step.id}
                    className={cn(
                      "absolute w-48 p-3 rounded-lg border-2 bg-white dark:bg-gray-700 cursor-pointer select-none",
                      step.status === 'pending' && "border-gray-300",
                      step.status === 'running' && "border-blue-500 animate-pulse",
                      step.status === 'completed' && "border-green-500",
                      step.status === 'error' && "border-red-500",
                      selectedStep?.id === step.id && "ring-2 ring-blue-500"
                    )}
                    style={{
                      left: step.position.x,
                      top: step.position.y,
                    }}
                    onClick={() => setSelectedStep(step)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{step.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteStep(step.id)
                        }}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-xs text-gray-500 mb-2">{step.type}</div>

                    {step.executionTime && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <ClockIcon className="h-3 w-3" />
                        {step.executionTime}ms
                      </div>
                    )}

                    {step.error && (
                      <div className="text-xs text-red-500 mt-1">
                        错误: {step.error}
                      </div>
                    )}
                  </div>
                ))}

                {/* 连接线 */}
                <svg className="absolute inset-0 pointer-events-none">
                  {currentWorkflow.connections.map((conn, index) => {
                    const fromStep = currentWorkflow.steps.find(s => s.id === conn.from)
                    const toStep = currentWorkflow.steps.find(s => s.id === conn.to)

                    if (!fromStep || !toStep) return null

                    return (
                      <line
                        key={index}
                        x1={fromStep.position.x + 192}
                        y1={fromStep.position.y + 40}
                        x2={toStep.position.x}
                        y2={toStep.position.y + 40}
                        stroke="#3b82f6"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    )
                  })}

                  {/* 箭头标记 */}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#3b82f6"
                      />
                    </marker>
                  </defs>
                </svg>
              </div>

              {/* 底部执行日志 */}
              <div className="h-32 border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
                <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">执行日志</h4>
                <div className="text-xs font-mono text-gray-600 dark:text-gray-400 max-h-20 overflow-y-auto">
                  {executionLog.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <LightBulbIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">开始创建AI工作流</p>
                <p className="text-sm">点击"新建工作流"开始构建您的自动化流程</p>
              </div>
            </div>
          )}
        </div>

        {/* 右侧属性面板 */}
        {selectedStep && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
              步骤配置: {selectedStep.name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  步骤名称
                </label>
                <input
                  type="text"
                  value={selectedStep.name}
                  onChange={(e) => {
                    const updatedStep = { ...selectedStep, name: e.target.value }
                    setSelectedStep(updatedStep)
                    setCurrentWorkflow(prev => prev ? {
                      ...prev,
                      steps: prev.steps.map(s => s.id === updatedStep.id ? updatedStep : s)
                    } : null)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                />
              </div>

              {selectedStep.type === 'prompt' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      提示词
                    </label>
                    <textarea
                      value={selectedStep.config.prompt || ''}
                      onChange={(e) => {
                        const updatedStep = {
                          ...selectedStep,
                          config: { ...selectedStep.config, prompt: e.target.value }
                        }
                        setSelectedStep(updatedStep)
                        setCurrentWorkflow(prev => prev ? {
                          ...prev,
                          steps: prev.steps.map(s => s.id === updatedStep.id ? updatedStep : s)
                        } : null)
                      }}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      温度 ({selectedStep.config.temperature || 0.7})
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={selectedStep.config.temperature || 0.7}
                      onChange={(e) => {
                        const updatedStep = {
                          ...selectedStep,
                          config: { ...selectedStep.config, temperature: parseFloat(e.target.value) }
                        }
                        setSelectedStep(updatedStep)
                        setCurrentWorkflow(prev => prev ? {
                          ...prev,
                          steps: prev.steps.map(s => s.id === updatedStep.id ? updatedStep : s)
                        } : null)
                      }}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              {selectedStep.type === 'condition' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    条件表达式
                  </label>
                  <input
                    type="text"
                    value={selectedStep.config.condition || ''}
                    onChange={(e) => {
                      const updatedStep = {
                        ...selectedStep,
                        config: { ...selectedStep.config, condition: e.target.value }
                      }
                      setSelectedStep(updatedStep)
                      setCurrentWorkflow(prev => prev ? {
                        ...prev,
                        steps: prev.steps.map(s => s.id === updatedStep.id ? updatedStep : s)
                      } : null)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                  />
                </div>
              )}

              {selectedStep.result && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    执行结果
                  </label>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded border max-h-32 overflow-auto">
                    {JSON.stringify(selectedStep.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIWorkflowEngine
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiPlay, FiPause, FiSquare, FiEdit3, FiSave, FiTrash2, FiCopy, FiDownload, FiUpload, FiZap, FiCpu, FiGitBranch, FiSettings, FiPlus, FiArrowRight, FiCheck, FiAlertCircle, FiClock, FiActivity, FiTarget, FiLayers } from 'react-icons/fi'

interface WorkflowNode {
  id: string
  type: 'trigger' | 'ai_task' | 'condition' | 'action' | 'data_transform' | 'human_input' | 'delay' | 'loop'
  title: string
  description: string
  config: Record<string, any>
  position: { x: number; y: number }
  inputs: string[]
  outputs: string[]
  status: 'idle' | 'running' | 'completed' | 'error' | 'waiting'
  result?: any
  error?: string
  executionTime?: number
}

interface WorkflowEdge {
  id: string
  source: string
  target: string
  condition?: string
  label?: string
}

interface Workflow {
  id: string
  name: string
  description: string
  category: 'productivity' | 'content' | 'analysis' | 'automation' | 'custom'
  tags: string[]
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  status: 'draft' | 'active' | 'paused' | 'completed' | 'error'
  created: number
  updated: number
  lastRun?: number
  runCount: number
  isPublic: boolean
  triggers: {
    schedule?: string
    webhook?: boolean
    manual?: boolean
    fileWatch?: string
  }
}

interface AgentTemplate {
  id: string
  name: string
  description: string
  icon: string
  category: string
  nodes: Partial<WorkflowNode>[]
  edges: Partial<WorkflowEdge>[]
  config: Record<string, any>
}

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'content-pipeline',
    name: 'Content Creation Pipeline',
    description: 'Automated content generation, review, and publishing workflow',
    icon: '📝',
    category: 'content',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        title: 'Content Request',
        description: 'Manual trigger for content creation',
        config: { triggerType: 'manual' },
        position: { x: 100, y: 100 }
      },
      {
        id: 'ai-1',
        type: 'ai_task',
        title: 'Generate Content',
        description: 'AI generates initial content based on topic',
        config: {
          model: 'gpt-4',
          prompt: 'Generate high-quality content about: {topic}',
          maxTokens: 2000
        },
        position: { x: 300, y: 100 }
      },
      {
        id: 'ai-2',
        type: 'ai_task',
        title: 'Review & Edit',
        description: 'AI reviews and improves the content',
        config: {
          model: 'claude-3-opus',
          prompt: 'Review and improve this content for clarity and engagement: {content}',
          maxTokens: 2000
        },
        position: { x: 500, y: 100 }
      },
      {
        id: 'human-1',
        type: 'human_input',
        title: 'Human Approval',
        description: 'Human review and approval step',
        config: {
          approvalRequired: true,
          timeout: 3600000
        },
        position: { x: 700, y: 100 }
      },
      {
        id: 'action-1',
        type: 'action',
        title: 'Publish Content',
        description: 'Publish approved content to platforms',
        config: {
          platforms: ['blog', 'social'],
          schedule: false
        },
        position: { x: 900, y: 100 }
      }
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'ai-1' },
      { id: 'e2', source: 'ai-1', target: 'ai-2' },
      { id: 'e3', source: 'ai-2', target: 'human-1' },
      { id: 'e4', source: 'human-1', target: 'action-1', condition: 'approved' }
    ],
    config: {}
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis Pipeline',
    description: 'Automated data processing, analysis, and reporting',
    icon: '📊',
    category: 'analysis',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        title: 'Data Upload',
        description: 'Trigger when new data is uploaded',
        config: { triggerType: 'file_upload' },
        position: { x: 100, y: 100 }
      },
      {
        id: 'transform-1',
        type: 'data_transform',
        title: 'Clean Data',
        description: 'Clean and preprocess the data',
        config: {
          operations: ['remove_duplicates', 'handle_missing', 'normalize']
        },
        position: { x: 300, y: 100 }
      },
      {
        id: 'ai-1',
        type: 'ai_task',
        title: 'Analyze Data',
        description: 'AI analyzes data for insights',
        config: {
          model: 'gpt-4',
          prompt: 'Analyze this dataset and provide key insights: {data}',
          maxTokens: 1500
        },
        position: { x: 500, y: 100 }
      },
      {
        id: 'ai-2',
        type: 'ai_task',
        title: 'Generate Report',
        description: 'Create comprehensive analysis report',
        config: {
          model: 'claude-3-sonnet',
          prompt: 'Create a detailed analysis report based on these insights: {insights}',
          format: 'markdown'
        },
        position: { x: 700, y: 100 }
      },
      {
        id: 'action-1',
        type: 'action',
        title: 'Send Report',
        description: 'Send report via email',
        config: {
          recipients: ['analyst@company.com'],
          format: 'pdf'
        },
        position: { x: 900, y: 100 }
      }
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'transform-1' },
      { id: 'e2', source: 'transform-1', target: 'ai-1' },
      { id: 'e3', source: 'ai-1', target: 'ai-2' },
      { id: 'e4', source: 'ai-2', target: 'action-1' }
    ],
    config: {}
  },
  {
    id: 'code-review',
    name: 'Code Review Automation',
    description: 'Automated code review and improvement suggestions',
    icon: '🔍',
    category: 'productivity',
    nodes: [
      {
        id: 'trigger-1',
        type: 'trigger',
        title: 'Code Commit',
        description: 'Trigger on git commit or PR',
        config: { triggerType: 'webhook' },
        position: { x: 100, y: 100 }
      },
      {
        id: 'ai-1',
        type: 'ai_task',
        title: 'Code Analysis',
        description: 'Analyze code for bugs and improvements',
        config: {
          model: 'codellama-7b',
          prompt: 'Review this code for bugs, security issues, and improvements: {code}',
          maxTokens: 2000
        },
        position: { x: 300, y: 100 }
      },
      {
        id: 'condition-1',
        type: 'condition',
        title: 'Issues Found?',
        description: 'Check if issues were found',
        config: {
          condition: 'issues_count > 0'
        },
        position: { x: 500, y: 100 }
      },
      {
        id: 'ai-2',
        type: 'ai_task',
        title: 'Generate Fixes',
        description: 'Generate suggested code fixes',
        config: {
          model: 'gpt-4',
          prompt: 'Generate fixes for these code issues: {issues}',
          maxTokens: 2000
        },
        position: { x: 500, y: 250 }
      },
      {
        id: 'action-1',
        type: 'action',
        title: 'Create PR Comment',
        description: 'Add review comment to PR',
        config: {
          platform: 'github',
          action: 'comment'
        },
        position: { x: 700, y: 175 }
      }
    ],
    edges: [
      { id: 'e1', source: 'trigger-1', target: 'ai-1' },
      { id: 'e2', source: 'ai-1', target: 'condition-1' },
      { id: 'e3', source: 'condition-1', target: 'ai-2', condition: 'true', label: 'Issues found' },
      { id: 'e4', source: 'ai-2', target: 'action-1' },
      { id: 'e5', source: 'condition-1', target: 'action-1', condition: 'false', label: 'No issues' }
    ],
    config: {}
  }
]

export default function AgentWorkflowSystem() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'workflows' | 'templates' | 'running' | 'builder'>('workflows')
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null)
  const [runningWorkflows, setRunningWorkflows] = useState<Set<string>>(new Set())
  const [executionLogs, setExecutionLogs] = useState<Record<string, any[]>>({})
  const [filter, setFilter] = useState('')

  useEffect(() => {
    // Load sample workflows
    const sampleWorkflows: Workflow[] = [
      {
        id: 'workflow-1',
        name: 'Daily Content Creation',
        description: 'Automated daily content generation and scheduling',
        category: 'content',
        tags: ['content', 'social media', 'automation'],
        nodes: [],
        edges: [],
        status: 'active',
        created: Date.now() - 86400000,
        updated: Date.now() - 3600000,
        lastRun: Date.now() - 1800000,
        runCount: 45,
        isPublic: false,
        triggers: {
          schedule: '0 9 * * *',
          manual: true
        }
      },
      {
        id: 'workflow-2',
        name: 'Customer Support Automation',
        description: 'Automated customer inquiry processing and routing',
        category: 'automation',
        tags: ['support', 'automation', 'classification'],
        nodes: [],
        edges: [],
        status: 'active',
        created: Date.now() - 172800000,
        updated: Date.now() - 7200000,
        lastRun: Date.now() - 900000,
        runCount: 123,
        isPublic: true,
        triggers: {
          webhook: true,
          manual: true
        }
      },
      {
        id: 'workflow-3',
        name: 'Research Paper Summarizer',
        description: 'Automatically process and summarize research papers',
        category: 'analysis',
        tags: ['research', 'summarization', 'pdf'],
        nodes: [],
        edges: [],
        status: 'draft',
        created: Date.now() - 259200000,
        updated: Date.now() - 14400000,
        runCount: 0,
        isPublic: false,
        triggers: {
          manual: true,
          fileWatch: '/uploads/papers'
        }
      }
    ]

    setWorkflows(sampleWorkflows)
  }, [])

  const createWorkflowFromTemplate = (template: AgentTemplate) => {
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: `${template.name} - Copy`,
      description: template.description,
      category: template.category as any,
      tags: [template.category, 'template'],
      nodes: template.nodes.map((node, index) => ({
        id: node.id || `node-${index}`,
        type: node.type || 'ai_task',
        title: node.title || 'Untitled',
        description: node.description || '',
        config: node.config || {},
        position: node.position || { x: 100 + index * 200, y: 100 },
        inputs: node.inputs || [],
        outputs: node.outputs || [],
        status: 'idle'
      })) as WorkflowNode[],
      edges: template.edges.map((edge, index) => ({
        id: edge.id || `edge-${index}`,
        source: edge.source || '',
        target: edge.target || '',
        condition: edge.condition,
        label: edge.label
      })) as WorkflowEdge[],
      status: 'draft',
      created: Date.now(),
      updated: Date.now(),
      runCount: 0,
      isPublic: false,
      triggers: { manual: true }
    }

    setWorkflows([...workflows, newWorkflow])
    setSelectedWorkflow(newWorkflow)
    setActiveTab('builder')
    setIsEditing(true)
  }

  const runWorkflow = async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId)
    if (!workflow) return

    setRunningWorkflows(prev => new Set([...prev, workflowId]))

    // Simulate workflow execution
    const log: any[] = []

    try {
      // Update workflow status
      setWorkflows(prev => prev.map(w =>
        w.id === workflowId
          ? { ...w, status: 'active', lastRun: Date.now(), runCount: w.runCount + 1 }
          : w
      ))

      // Simulate node execution
      for (const node of workflow.nodes) {
        log.push({
          timestamp: Date.now(),
          nodeId: node.id,
          type: 'start',
          message: `Starting ${node.title}`
        })

        // Simulate execution time
        await new Promise(resolve => setTimeout(resolve, 1000))

        if (node.type === 'ai_task') {
          log.push({
            timestamp: Date.now(),
            nodeId: node.id,
            type: 'ai_response',
            message: `AI task completed: ${node.title}`,
            result: 'Mock AI response for ' + node.title
          })
        } else if (node.type === 'condition') {
          const result = Math.random() > 0.5
          log.push({
            timestamp: Date.now(),
            nodeId: node.id,
            type: 'condition',
            message: `Condition evaluated: ${result}`,
            result
          })
        } else {
          log.push({
            timestamp: Date.now(),
            nodeId: node.id,
            type: 'complete',
            message: `${node.title} completed successfully`
          })
        }
      }

      setExecutionLogs(prev => ({ ...prev, [workflowId]: log }))

      setWorkflows(prev => prev.map(w =>
        w.id === workflowId
          ? { ...w, status: 'completed' }
          : w
      ))

    } catch (error) {
      log.push({
        timestamp: Date.now(),
        type: 'error',
        message: 'Workflow execution failed',
        error: error?.toString()
      })

      setWorkflows(prev => prev.map(w =>
        w.id === workflowId
          ? { ...w, status: 'error' }
          : w
      ))
    } finally {
      setRunningWorkflows(prev => {
        const next = new Set(prev)
        next.delete(workflowId)
        return next
      })
    }
  }

  const stopWorkflow = (workflowId: string) => {
    setRunningWorkflows(prev => {
      const next = new Set(prev)
      next.delete(workflowId)
      return next
    })

    setWorkflows(prev => prev.map(w =>
      w.id === workflowId
        ? { ...w, status: 'paused' }
        : w
    ))
  }

  const deleteWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== workflowId))
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400'
      case 'completed': return 'text-blue-400'
      case 'paused': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <FiPlay className="w-4 h-4" />
      case 'completed': return <FiCheck className="w-4 h-4" />
      case 'paused': return <FiPause className="w-4 h-4" />
      case 'error': return <FiAlertCircle className="w-4 h-4" />
      default: return <FiCpu className="w-4 h-4" />
    }
  }

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(filter.toLowerCase()) ||
    workflow.description.toLowerCase().includes(filter.toLowerCase()) ||
    workflow.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
  )

  const activeWorkflows = workflows.filter(w => w.status === 'active')

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
              <FiGitBranch className="text-blue-400" />
              Agent Workflow System
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Build and orchestrate intelligent AI workflows
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <FiPlus className="w-4 h-4" />
              New Workflow
            </button>

            <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-colors">
              <FiUpload className="w-4 h-4" />
              Import
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
          {[
            { id: 'workflows', label: 'My Workflows', count: workflows.length },
            { id: 'templates', label: 'Templates', count: AGENT_TEMPLATES.length },
            { id: 'running', label: 'Running', count: runningWorkflows.size },
            { id: 'builder', label: 'Builder', icon: FiSettings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'workflows' && (
            <motion.div
              key="workflows"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-6 overflow-y-auto"
            >
              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search workflows..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Workflows Grid */}
              <div className="grid gap-4">
                {filteredWorkflows.map(workflow => (
                  <motion.div
                    key={workflow.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white">{workflow.name}</h3>
                          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${getStatusColor(workflow.status)}`}>
                            {getStatusIcon(workflow.status)}
                            {workflow.status}
                          </span>
                          {workflow.isPublic && (
                            <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                              Public
                            </span>
                          )}
                        </div>

                        <p className="text-gray-400 text-sm mb-3">{workflow.description}</p>

                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <FiActivity className="w-3 h-3" />
                            <span>{workflow.runCount} runs</span>
                          </div>
                          {workflow.lastRun && (
                            <div className="flex items-center gap-1">
                              <FiClock className="w-3 h-3" />
                              <span>Last run: {new Date(workflow.lastRun).toLocaleDateString()}</span>
                            </div>
                          )}
                          <span className="capitalize">{workflow.category}</span>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {workflow.tags.map(tag => (
                            <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {!runningWorkflows.has(workflow.id) ? (
                          <button
                            onClick={() => runWorkflow(workflow.id)}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <FiPlay className="w-4 h-4" />
                            Run
                          </button>
                        ) : (
                          <button
                            onClick={() => stopWorkflow(workflow.id)}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <FiSquare className="w-4 h-4" />
                            Stop
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedWorkflow(workflow)
                            setActiveTab('builder')
                          }}
                          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                          title="Edit workflow"
                        >
                          <FiEdit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => deleteWorkflow(workflow.id)}
                          className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400 hover:text-red-300"
                          title="Delete workflow"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'templates' && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-6 overflow-y-auto"
            >
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Workflow Templates</h3>
                <p className="text-gray-400 text-sm">
                  Choose from pre-built workflow templates to get started quickly
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {AGENT_TEMPLATES.map(template => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-3xl">{template.icon}</div>
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded capitalize">
                        {template.category}
                      </span>
                    </div>

                    <h3 className="font-semibold text-white mb-2">{template.name}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3">{template.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FiLayers className="w-3 h-3" />
                        <span>{template.nodes.length} nodes</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          createWorkflowFromTemplate(template)
                        }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <FiPlus className="w-4 h-4" />
                        Use Template
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'running' && (
            <motion.div
              key="running"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-6 overflow-y-auto"
            >
              {runningWorkflows.size === 0 ? (
                <div className="text-center py-12">
                  <FiZap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No Running Workflows</h3>
                  <p className="text-gray-500 mb-4">Start a workflow to see real-time execution logs</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Array.from(runningWorkflows).map(workflowId => {
                    const workflow = workflows.find(w => w.id === workflowId)
                    const logs = executionLogs[workflowId] || []

                    return (
                      <div key={workflowId} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            {workflow?.name}
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          </h3>
                          <button
                            onClick={() => stopWorkflow(workflowId)}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <FiSquare className="w-4 h-4" />
                            Stop
                          </button>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {logs.map((log, index) => (
                            <div key={index} className="flex items-start gap-3 text-sm">
                              <span className="text-gray-500 text-xs font-mono">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                log.type === 'error' ? 'bg-red-600/20 text-red-400' :
                                log.type === 'ai_response' ? 'bg-blue-600/20 text-blue-400' :
                                'bg-gray-700 text-gray-300'
                              }`}>
                                {log.type}
                              </span>
                              <span className="text-gray-300 flex-1">{log.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'builder' && (
            <motion.div
              key="builder"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center">
                <FiSettings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Workflow Builder</h3>
                <p className="text-gray-500 mb-4">
                  Visual workflow builder coming soon. Use templates to get started.
                </p>
                <button
                  onClick={() => setActiveTab('templates')}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Browse Templates
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Template Details Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelectedTemplate(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedTemplate.icon}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedTemplate.name}</h3>
                    <p className="text-gray-400">{selectedTemplate.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Workflow Steps</h4>
                <div className="space-y-3">
                  {selectedTemplate.nodes.map((node, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{node.title}</div>
                        <div className="text-sm text-gray-400">{node.description}</div>
                      </div>
                      <FiArrowRight className="w-4 h-4 text-gray-500" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {selectedTemplate.nodes.length} steps • {selectedTemplate.category} workflow
                </div>
                <button
                  onClick={() => {
                    createWorkflowFromTemplate(selectedTemplate)
                    setSelectedTemplate(null)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Workflow
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
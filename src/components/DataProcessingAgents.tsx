import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiDatabase, FiFileText, FiFilter, FiBarChart2, FiDownload, FiUpload, FiPlay, FiPause, FiSettings, FiTrash2, FiEdit3, FiCopy, FiRefreshCw, FiTable, FiPieChart, FiTrendingUp, FiGrid, FiLayers, FiTarget, FiZap, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi'

interface DataAgent {
  id: string
  name: string
  type: 'etl' | 'analysis' | 'cleaning' | 'transformation' | 'visualization' | 'validation' | 'migration'
  description: string
  status: 'idle' | 'running' | 'completed' | 'error' | 'paused'
  config: {
    inputFormat: string[]
    outputFormat: string[]
    operations: string[]
    schedule?: string
    autoRun?: boolean
    parallelProcessing?: boolean
    batchSize?: number
  }
  metrics: {
    recordsProcessed: number
    executionTime: number
    errorRate: number
    lastRun?: number
    totalRuns: number
  }
  created: number
  updated: number
}

interface DataOperation {
  id: string
  name: string
  category: 'cleaning' | 'transformation' | 'analysis' | 'validation' | 'aggregation'
  description: string
  parameters: Record<string, any>
  icon: string
}

interface ProcessingJob {
  id: string
  agentId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  startTime: number
  endTime?: number
  inputData: any
  outputData?: any
  logs: string[]
  errors: string[]
}

const DATA_OPERATIONS: DataOperation[] = [
  // Data Cleaning
  {
    id: 'remove_duplicates',
    name: 'Remove Duplicates',
    category: 'cleaning',
    description: 'Remove duplicate records based on specified columns',
    parameters: { columns: [], strategy: 'first' },
    icon: '🧹'
  },
  {
    id: 'handle_missing',
    name: 'Handle Missing Values',
    category: 'cleaning',
    description: 'Fill, drop, or interpolate missing values',
    parameters: { strategy: 'drop', fillValue: null },
    icon: '🔧'
  },
  {
    id: 'outlier_detection',
    name: 'Outlier Detection',
    category: 'cleaning',
    description: 'Identify and handle statistical outliers',
    parameters: { method: 'zscore', threshold: 3 },
    icon: '🎯'
  },

  // Data Transformation
  {
    id: 'normalize_data',
    name: 'Data Normalization',
    category: 'transformation',
    description: 'Normalize numerical data to standard scales',
    parameters: { method: 'minmax', range: [0, 1] },
    icon: '📏'
  },
  {
    id: 'encode_categorical',
    name: 'Categorical Encoding',
    category: 'transformation',
    description: 'Encode categorical variables for ML models',
    parameters: { method: 'onehot', dropFirst: false },
    icon: '🏷️'
  },
  {
    id: 'feature_engineering',
    name: 'Feature Engineering',
    category: 'transformation',
    description: 'Create new features from existing data',
    parameters: { operations: [], autoDetect: true },
    icon: '⚙️'
  },

  // Data Analysis
  {
    id: 'statistical_summary',
    name: 'Statistical Summary',
    category: 'analysis',
    description: 'Generate comprehensive statistical summaries',
    parameters: { includeCorrelation: true, confidence: 0.95 },
    icon: '📊'
  },
  {
    id: 'trend_analysis',
    name: 'Trend Analysis',
    category: 'analysis',
    description: 'Analyze trends and patterns in time series data',
    parameters: { timeColumn: '', aggregation: 'daily' },
    icon: '📈'
  },
  {
    id: 'clustering',
    name: 'Data Clustering',
    category: 'analysis',
    description: 'Group similar records using machine learning',
    parameters: { algorithm: 'kmeans', clusters: 3 },
    icon: '🎯'
  },

  // Data Validation
  {
    id: 'schema_validation',
    name: 'Schema Validation',
    category: 'validation',
    description: 'Validate data against predefined schema',
    parameters: { schema: {}, strictMode: true },
    icon: '✅'
  },
  {
    id: 'quality_check',
    name: 'Data Quality Check',
    category: 'validation',
    description: 'Comprehensive data quality assessment',
    parameters: { checks: ['completeness', 'accuracy', 'consistency'] },
    icon: '🔍'
  },

  // Data Aggregation
  {
    id: 'group_aggregate',
    name: 'Group & Aggregate',
    category: 'aggregation',
    description: 'Group data and apply aggregation functions',
    parameters: { groupBy: [], aggregations: {} },
    icon: '📦'
  },
  {
    id: 'pivot_table',
    name: 'Pivot Table',
    category: 'aggregation',
    description: 'Create pivot tables for data summarization',
    parameters: { rows: [], columns: [], values: [], aggFunc: 'sum' },
    icon: '🔄'
  }
]

const SAMPLE_AGENTS: DataAgent[] = [
  {
    id: 'agent-1',
    name: 'Customer Data ETL',
    type: 'etl',
    description: 'Extract, transform, and load customer data from multiple sources',
    status: 'idle',
    config: {
      inputFormat: ['csv', 'json', 'xml'],
      outputFormat: ['parquet', 'json'],
      operations: ['remove_duplicates', 'handle_missing', 'normalize_data'],
      schedule: '0 2 * * *',
      autoRun: true,
      parallelProcessing: true,
      batchSize: 10000
    },
    metrics: {
      recordsProcessed: 1250000,
      executionTime: 450000,
      errorRate: 0.02,
      lastRun: Date.now() - 3600000,
      totalRuns: 28
    },
    created: Date.now() - 2592000000,
    updated: Date.now() - 86400000
  },
  {
    id: 'agent-2',
    name: 'Sales Analytics Engine',
    type: 'analysis',
    description: 'Automated sales data analysis and reporting',
    status: 'running',
    config: {
      inputFormat: ['csv', 'excel'],
      outputFormat: ['json', 'pdf'],
      operations: ['statistical_summary', 'trend_analysis', 'pivot_table'],
      autoRun: false,
      parallelProcessing: false,
      batchSize: 5000
    },
    metrics: {
      recordsProcessed: 890000,
      executionTime: 180000,
      errorRate: 0.01,
      lastRun: Date.now() - 1800000,
      totalRuns: 15
    },
    created: Date.now() - 1296000000,
    updated: Date.now() - 3600000
  },
  {
    id: 'agent-3',
    name: 'Data Quality Monitor',
    type: 'validation',
    description: 'Continuous data quality monitoring and alerting',
    status: 'completed',
    config: {
      inputFormat: ['json', 'parquet'],
      outputFormat: ['json', 'html'],
      operations: ['schema_validation', 'quality_check', 'outlier_detection'],
      schedule: '0 */6 * * *',
      autoRun: true,
      parallelProcessing: true,
      batchSize: 50000
    },
    metrics: {
      recordsProcessed: 3200000,
      executionTime: 320000,
      errorRate: 0.005,
      lastRun: Date.now() - 21600000,
      totalRuns: 42
    },
    created: Date.now() - 5184000000,
    updated: Date.now() - 7200000
  }
]

export default function DataProcessingAgents() {
  const [agents, setAgents] = useState<DataAgent[]>(SAMPLE_AGENTS)
  const [selectedAgent, setSelectedAgent] = useState<DataAgent | null>(null)
  const [activeTab, setActiveTab] = useState<'agents' | 'operations' | 'jobs' | 'create'>('agents')
  const [runningJobs, setRunningJobs] = useState<ProcessingJob[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [filter, setFilter] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'status' | 'lastRun'>('lastRun')

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(filter.toLowerCase()) ||
    agent.description.toLowerCase().includes(filter.toLowerCase()) ||
    agent.type.toLowerCase().includes(filter.toLowerCase())
  ).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'type':
        return a.type.localeCompare(b.type)
      case 'status':
        return a.status.localeCompare(b.status)
      case 'lastRun':
        return (b.metrics.lastRun || 0) - (a.metrics.lastRun || 0)
      default:
        return 0
    }
  })

  const runAgent = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return

    // Create new job
    const job: ProcessingJob = {
      id: Date.now().toString(),
      agentId,
      status: 'running',
      progress: 0,
      startTime: Date.now(),
      inputData: { sample: 'data' },
      logs: ['Job started', 'Initializing agent...'],
      errors: []
    }

    setRunningJobs(prev => [...prev, job])

    // Update agent status
    setAgents(prev => prev.map(a =>
      a.id === agentId
        ? { ...a, status: 'running' }
        : a
    ))

    // Simulate job execution
    const progressInterval = setInterval(() => {
      setRunningJobs(prev => prev.map(j => {
        if (j.id === job.id && j.status === 'running') {
          const newProgress = Math.min(j.progress + Math.random() * 15, 100)
          const newLogs = [...j.logs]

          if (newProgress > 25 && !newLogs.includes('Data validation completed')) {
            newLogs.push('Data validation completed')
          }
          if (newProgress > 50 && !newLogs.includes('Processing data...')) {
            newLogs.push('Processing data...')
          }
          if (newProgress > 75 && !newLogs.includes('Generating output...')) {
            newLogs.push('Generating output...')
          }

          if (newProgress >= 100) {
            clearInterval(progressInterval)
            newLogs.push('Job completed successfully')

            // Update agent metrics
            setAgents(prev => prev.map(a =>
              a.id === agentId
                ? {
                    ...a,
                    status: 'completed',
                    metrics: {
                      ...a.metrics,
                      recordsProcessed: a.metrics.recordsProcessed + Math.floor(Math.random() * 10000),
                      lastRun: Date.now(),
                      totalRuns: a.metrics.totalRuns + 1,
                      executionTime: Date.now() - job.startTime
                    }
                  }
                : a
            ))

            return {
              ...j,
              status: 'completed' as const,
              progress: 100,
              endTime: Date.now(),
              logs: newLogs,
              outputData: { processed: 'sample result' }
            }
          }

          return { ...j, progress: newProgress, logs: newLogs }
        }
        return j
      }))
    }, 500)
  }

  const stopAgent = (agentId: string) => {
    setAgents(prev => prev.map(a =>
      a.id === agentId
        ? { ...a, status: 'paused' }
        : a
    ))

    setRunningJobs(prev => prev.map(j =>
      j.agentId === agentId && j.status === 'running'
        ? { ...j, status: 'failed', logs: [...j.logs, 'Job stopped by user'] }
        : j
    ))
  }

  const deleteAgent = (agentId: string) => {
    setAgents(prev => prev.filter(a => a.id !== agentId))
    if (selectedAgent?.id === agentId) {
      setSelectedAgent(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400'
      case 'completed': return 'text-blue-400'
      case 'paused': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <FiPlay className="w-4 h-4" />
      case 'completed': return <FiCheck className="w-4 h-4" />
      case 'paused': return <FiPause className="w-4 h-4" />
      case 'error': return <FiAlertCircle className="w-4 h-4" />
      default: return <FiDatabase className="w-4 h-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'etl': return <FiDatabase className="w-5 h-5" />
      case 'analysis': return <FiBarChart2 className="w-5 h-5" />
      case 'cleaning': return <FiFilter className="w-5 h-5" />
      case 'transformation': return <FiRefreshCw className="w-5 h-5" />
      case 'visualization': return <FiPieChart className="w-5 h-5" />
      case 'validation': return <FiCheck className="w-5 h-5" />
      case 'migration': return <FiUpload className="w-5 h-5" />
      default: return <FiGrid className="w-5 h-5" />
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
              <FiDatabase className="text-green-400" />
              Data Processing Agents
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Intelligent agents for automated data processing and analysis
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>{agents.filter(a => a.status === 'running').length} Running</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>{agents.filter(a => a.status === 'completed').length} Completed</span>
              </div>
            </div>

            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <FiZap className="w-4 h-4" />
              Create Agent
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
          {[
            { id: 'agents', label: 'Agents', count: agents.length },
            { id: 'operations', label: 'Operations', count: DATA_OPERATIONS.length },
            { id: 'jobs', label: 'Active Jobs', count: runningJobs.filter(j => j.status === 'running').length },
            { id: 'create', label: 'Create New', icon: FiZap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
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
          {activeTab === 'agents' && (
            <motion.div
              key="agents"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex"
            >
              {/* Agents List */}
              <div className="w-2/3 border-r border-gray-800 flex flex-col">
                {/* Filters */}
                <div className="p-4 border-b border-gray-800">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Search agents..."
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="lastRun">Sort by Last Run</option>
                      <option value="name">Sort by Name</option>
                      <option value="type">Sort by Type</option>
                      <option value="status">Sort by Status</option>
                    </select>
                  </div>
                </div>

                {/* Agents Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="grid gap-4">
                    {filteredAgents.map(agent => (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-gray-800/50 rounded-lg p-4 border cursor-pointer transition-all ${
                          selectedAgent?.id === agent.id
                            ? 'border-green-500 bg-green-600/10'
                            : 'border-gray-700 hover:border-gray-600'
                        }`}
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="text-green-400">
                              {getTypeIcon(agent.type)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{agent.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded capitalize">
                                  {agent.type}
                                </span>
                                <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${getStatusColor(agent.status)}`}>
                                  {getStatusIcon(agent.status)}
                                  {agent.status}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {agent.status === 'idle' || agent.status === 'completed' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  runAgent(agent.id)
                                }}
                                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                title="Run agent"
                              >
                                <FiPlay className="w-4 h-4" />
                              </button>
                            ) : agent.status === 'running' ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  stopAgent(agent.id)
                                }}
                                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                title="Stop agent"
                              >
                                <FiPause className="w-4 h-4" />
                              </button>
                            ) : null}

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                // Edit agent logic
                              }}
                              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                              title="Edit agent"
                            >
                              <FiEdit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteAgent(agent.id)
                              }}
                              className="p-2 hover:bg-red-600/20 rounded-lg transition-colors text-red-400"
                              title="Delete agent"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-gray-400 text-sm mb-3">{agent.description}</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="text-gray-500">Processed:</span>
                            <div className="text-white font-medium">
                              {formatNumber(agent.metrics.recordsProcessed)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Runs:</span>
                            <div className="text-white font-medium">{agent.metrics.totalRuns}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Error Rate:</span>
                            <div className="text-white font-medium">
                              {(agent.metrics.errorRate * 100).toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Last Run:</span>
                            <div className="text-white font-medium">
                              {agent.metrics.lastRun
                                ? new Date(agent.metrics.lastRun).toLocaleDateString()
                                : 'Never'
                              }
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Agent Details */}
              <div className="w-1/3 flex flex-col">
                {selectedAgent ? (
                  <div className="h-full overflow-y-auto p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="text-green-400">
                        {getTypeIcon(selectedAgent.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{selectedAgent.name}</h3>
                        <p className="text-gray-400 text-sm">{selectedAgent.description}</p>
                      </div>
                    </div>

                    {/* Configuration */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">Configuration</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs text-gray-500">Input Formats:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedAgent.config.inputFormat.map(format => (
                              <span key={format} className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                                {format}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs text-gray-500">Output Formats:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedAgent.config.outputFormat.map(format => (
                              <span key={format} className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">
                                {format}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-xs text-gray-500">Operations:</span>
                          <div className="space-y-1 mt-1">
                            {selectedAgent.config.operations.map(op => {
                              const operation = DATA_OPERATIONS.find(o => o.id === op)
                              return (
                                <div key={op} className="flex items-center gap-2 text-xs">
                                  <span>{operation?.icon || '⚙️'}</span>
                                  <span className="text-white">{operation?.name || op}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {selectedAgent.config.schedule && (
                          <div>
                            <span className="text-xs text-gray-500">Schedule:</span>
                            <div className="text-white text-sm font-mono mt-1">
                              {selectedAgent.config.schedule}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs text-gray-500">Batch Size:</span>
                            <div className="text-white text-sm">
                              {formatNumber(selectedAgent.config.batchSize || 0)}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Parallel:</span>
                            <div className="text-white text-sm">
                              {selectedAgent.config.parallelProcessing ? 'Yes' : 'No'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-300 mb-3">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Records Processed:</span>
                            <div className="text-white font-medium">
                              {formatNumber(selectedAgent.metrics.recordsProcessed)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Total Runs:</span>
                            <div className="text-white font-medium">{selectedAgent.metrics.totalRuns}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Avg. Execution:</span>
                            <div className="text-white font-medium">
                              {formatDuration(selectedAgent.metrics.executionTime)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Error Rate:</span>
                            <div className={`font-medium ${
                              selectedAgent.metrics.errorRate < 0.01 ? 'text-green-400' :
                              selectedAgent.metrics.errorRate < 0.05 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {(selectedAgent.metrics.errorRate * 100).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                      <button
                        onClick={() => runAgent(selectedAgent.id)}
                        disabled={selectedAgent.status === 'running'}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        <FiPlay className="w-4 h-4" />
                        {selectedAgent.status === 'running' ? 'Running...' : 'Run Agent'}
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-colors">
                          <FiCopy className="w-4 h-4" />
                          Clone
                        </button>
                        <button className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-sm transition-colors">
                          <FiDownload className="w-4 h-4" />
                          Export
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <FiDatabase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400">Select an agent to view details</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'operations' && (
            <motion.div
              key="operations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-6 overflow-y-auto"
            >
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Available Operations</h3>
                <p className="text-gray-400 text-sm">
                  Pre-built data processing operations for your agents
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(
                  DATA_OPERATIONS.reduce((acc, op) => {
                    if (!acc[op.category]) acc[op.category] = []
                    acc[op.category].push(op)
                    return acc
                  }, {} as Record<string, DataOperation[]>)
                ).map(([category, operations]) => (
                  <div key={category} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <h4 className="font-semibold text-white mb-3 capitalize flex items-center gap-2">
                      {category === 'cleaning' && <FiFilter className="w-4 h-4" />}
                      {category === 'transformation' && <FiRefreshCw className="w-4 h-4" />}
                      {category === 'analysis' && <FiBarChart2 className="w-4 h-4" />}
                      {category === 'validation' && <FiCheck className="w-4 h-4" />}
                      {category === 'aggregation' && <FiLayers className="w-4 h-4" />}
                      {category}
                    </h4>

                    <div className="space-y-2">
                      {operations.map(operation => (
                        <div key={operation.id} className="p-3 bg-gray-700/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{operation.icon}</span>
                            <span className="font-medium text-white text-sm">{operation.name}</span>
                          </div>
                          <p className="text-xs text-gray-400">{operation.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'jobs' && (
            <motion.div
              key="jobs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full p-6 overflow-y-auto"
            >
              {runningJobs.length === 0 ? (
                <div className="text-center py-12">
                  <FiTarget className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">No Active Jobs</h3>
                  <p className="text-gray-500 mb-4">Run an agent to see job progress here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {runningJobs.map(job => {
                    const agent = agents.find(a => a.id === job.agentId)
                    return (
                      <div key={job.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-white flex items-center gap-2">
                              {agent?.name}
                              <span className={`text-xs px-2 py-1 rounded ${
                                job.status === 'running' ? 'bg-green-600/20 text-green-400' :
                                job.status === 'completed' ? 'bg-blue-600/20 text-blue-400' :
                                job.status === 'failed' ? 'bg-red-600/20 text-red-400' :
                                'bg-gray-600/20 text-gray-400'
                              }`}>
                                {job.status}
                              </span>
                            </h3>
                            <p className="text-gray-400 text-sm">
                              Started: {new Date(job.startTime).toLocaleTimeString()}
                            </p>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">{Math.round(job.progress)}%</div>
                            <div className="text-xs text-gray-500">
                              {job.endTime ? formatDuration(job.endTime - job.startTime) : 'Running...'}
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Logs */}
                        <div className="bg-gray-900 rounded-lg p-3 max-h-32 overflow-y-auto">
                          <div className="space-y-1">
                            {job.logs.map((log, index) => (
                              <div key={index} className="text-xs text-gray-300 font-mono">
                                <span className="text-gray-500">
                                  [{new Date(job.startTime + index * 1000).toLocaleTimeString()}]
                                </span>{' '}
                                {log}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center">
                <FiZap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Agent Builder</h3>
                <p className="text-gray-500 mb-4">
                  Visual agent builder coming soon. Configure data processing workflows.
                </p>
                <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors">
                  Start Building
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
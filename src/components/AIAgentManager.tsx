/**
 * AI Agent Manager Component
 *
 * Comprehensive UI for managing AI agents, creating tasks, and monitoring execution
 */

import React, { useState, useEffect } from 'react'
import { aiAgentService } from '../services/aiAgentService'
import type { AIAgent, AgentTask, AgentCapability } from '../types/v4-types'

interface AIAgentManagerProps {
  userId: string
  onTaskComplete?: (task: AgentTask) => void
}

export const AIAgentManager: React.FC<AIAgentManagerProps> = ({ userId, onTaskComplete }) => {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'agents' | 'tasks' | 'create'>('agents')

  // Form states
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentDescription, setNewAgentDescription] = useState('')
  const [newAgentType, setNewAgentType] = useState<'autonomous' | 'assistant' | 'specialist'>('assistant')
  const [taskGoal, setTaskGoal] = useState('')
  const [taskInstructions, setTaskInstructions] = useState('')

  useEffect(() => {
    loadAgents()
    loadTasks()
  }, [userId])

  const loadAgents = async () => {
    try {
      const userAgents = await aiAgentService.getAllAgents(userId)
      setAgents(userAgents)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load agents:', error)
      setLoading(false)
    }
  }

  const loadTasks = async () => {
    try {
      const allTasks = await aiAgentService.getAllTasks()
      setTasks(allTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    }
  }

  const handleCreateAgent = async () => {
    if (!newAgentName) return

    try {
      const capabilities: AgentCapability[] = [
        {
          id: 'cap_general',
          name: 'General Assistance',
          description: 'General purpose assistance',
          enabled: true
        }
      ]

      const agent = await aiAgentService.createAgent({
        name: newAgentName,
        description: newAgentDescription,
        type: newAgentType,
        capabilities,
        tools: [],
        memory: {
          shortTerm: [],
          longTerm: [],
          workingMemory: {},
          episodic: []
        },
        persona: {
          name: newAgentName,
          role: 'Assistant',
          background: newAgentDescription,
          style: 'professional',
          tone: 'friendly',
          expertise: [],
          language: 'en'
        },
        userId,
        config: {
          autonomyLevel: 'medium',
          maxIterations: 10,
          timeout: 60000,
          requiresApproval: false,
          allowedTools: [],
          safetyChecks: true
        }
      })

      setAgents([...agents, agent])
      setNewAgentName('')
      setNewAgentDescription('')
      setActiveTab('agents')
    } catch (error) {
      console.error('Failed to create agent:', error)
    }
  }

  const handleCreateTask = async () => {
    if (!selectedAgent || !taskGoal) return

    try {
      const task = await aiAgentService.createTask(
        selectedAgent.id,
        taskGoal,
        taskInstructions,
        {}
      )

      setTasks([...tasks, task])
      setTaskGoal('')
      setTaskInstructions('')

      // Execute task in background
      executeTask(task.id)
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const executeTask = async (taskId: string) => {
    try {
      const completedTask = await aiAgentService.executeTask(taskId)

      // Update task in list
      setTasks(tasks.map(t => t.id === taskId ? completedTask : t))

      if (onTaskComplete) {
        onTaskComplete(completedTask)
      }
    } catch (error) {
      console.error('Failed to execute task:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return '#6B7280'
      case 'working': return '#3B82F6'
      case 'paused': return '#F59E0B'
      case 'error': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#6B7280'
      case 'running': return '#3B82F6'
      case 'completed': return '#10B981'
      case 'failed': return '#EF4444'
      case 'cancelled': return '#F59E0B'
      default: return '#6B7280'
    }
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading agents...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>AI Agent Manager</h2>
        <p style={styles.subtitle}>Create and manage AI agents to automate tasks</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'agents' ? styles.tabActive : {})
          }}
          onClick={() => setActiveTab('agents')}
        >
          Agents ({agents.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'tasks' ? styles.tabActive : {})
          }}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks ({tasks.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'create' ? styles.tabActive : {})
          }}
          onClick={() => setActiveTab('create')}
        >
          Create Agent
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div style={styles.agentsList}>
            {agents.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No agents yet. Create your first agent to get started!</p>
                <button
                  style={styles.primaryButton}
                  onClick={() => setActiveTab('create')}
                >
                  Create First Agent
                </button>
              </div>
            ) : (
              <div style={styles.grid}>
                {agents.map(agent => (
                  <div
                    key={agent.id}
                    style={styles.agentCard}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div style={styles.agentHeader}>
                      <h3 style={styles.agentName}>{agent.name}</h3>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: getStatusColor(agent.status)
                        }}
                      >
                        {agent.status}
                      </span>
                    </div>
                    <p style={styles.agentDescription}>{agent.description}</p>
                    <div style={styles.agentMeta}>
                      <span style={styles.metaItem}>
                        Type: {agent.type}
                      </span>
                      <span style={styles.metaItem}>
                        Capabilities: {agent.capabilities.length}
                      </span>
                    </div>
                    <div style={styles.agentStats}>
                      <div style={styles.stat}>
                        <span style={styles.statLabel}>Tasks</span>
                        <span style={styles.statValue}>
                          {tasks.filter(t => t.agentId === agent.id).length}
                        </span>
                      </div>
                      <div style={styles.stat}>
                        <span style={styles.statLabel}>Success Rate</span>
                        <span style={styles.statValue}>
                          {agent.performance?.successRate
                            ? `${(agent.performance.successRate * 100).toFixed(0)}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div style={styles.tasksList}>
            {selectedAgent && (
              <div style={styles.taskCreator}>
                <h3 style={styles.sectionTitle}>Create New Task</h3>
                <div style={styles.form}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Agent</label>
                    <select
                      style={styles.select}
                      value={selectedAgent.id}
                      onChange={(e) => {
                        const agent = agents.find(a => a.id === e.target.value)
                        setSelectedAgent(agent || null)
                      }}
                    >
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Goal</label>
                    <input
                      type="text"
                      style={styles.input}
                      placeholder="What should the agent accomplish?"
                      value={taskGoal}
                      onChange={(e) => setTaskGoal(e.target.value)}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Instructions</label>
                    <textarea
                      style={styles.textarea}
                      placeholder="Detailed instructions for the agent..."
                      value={taskInstructions}
                      onChange={(e) => setTaskInstructions(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <button
                    style={styles.primaryButton}
                    onClick={handleCreateTask}
                    disabled={!taskGoal}
                  >
                    Create & Execute Task
                  </button>
                </div>
              </div>
            )}

            <h3 style={styles.sectionTitle}>Recent Tasks</h3>
            {tasks.length === 0 ? (
              <div style={styles.emptyState}>
                <p>No tasks yet. Select an agent and create a task!</p>
              </div>
            ) : (
              <div style={styles.tasksGrid}>
                {tasks.map(task => (
                  <div key={task.id} style={styles.taskCard}>
                    <div style={styles.taskHeader}>
                      <h4 style={styles.taskGoal}>{task.goal}</h4>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: getTaskStatusColor(task.status)
                        }}
                      >
                        {task.status}
                      </span>
                    </div>
                    <p style={styles.taskInstructions}>{task.instructions}</p>
                    <div style={styles.taskProgress}>
                      <div style={styles.progressBar}>
                        <div
                          style={{
                            ...styles.progressFill,
                            width: `${task.progress}%`
                          }}
                        />
                      </div>
                      <span style={styles.progressText}>{task.progress}%</span>
                    </div>
                    {task.steps.length > 0 && (
                      <div style={styles.taskSteps}>
                        <p style={styles.stepsLabel}>Steps:</p>
                        <ul style={styles.stepsList}>
                          {task.steps.slice(-3).map((step, idx) => (
                            <li key={idx} style={styles.stepItem}>
                              {step.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Agent Tab */}
        {activeTab === 'create' && (
          <div style={styles.createAgent}>
            <h3 style={styles.sectionTitle}>Create New Agent</h3>
            <div style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Agent Name</label>
                <input
                  type="text"
                  style={styles.input}
                  placeholder="e.g., Research Assistant"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={styles.textarea}
                  placeholder="What does this agent do?"
                  value={newAgentDescription}
                  onChange={(e) => setNewAgentDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Agent Type</label>
                <select
                  style={styles.select}
                  value={newAgentType}
                  onChange={(e) => setNewAgentType(e.target.value as any)}
                >
                  <option value="assistant">Assistant - Helps with tasks</option>
                  <option value="autonomous">Autonomous - Works independently</option>
                  <option value="specialist">Specialist - Domain expert</option>
                </select>
              </div>
              <button
                style={styles.primaryButton}
                onClick={handleCreateAgent}
                disabled={!newAgentName}
              >
                Create Agent
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    color: '#1F2937'
  },
  subtitle: {
    fontSize: '16px',
    color: '#6B7280',
    margin: 0
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '2px solid #E5E7EB'
  },
  tab: {
    padding: '12px 24px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: '#6B7280',
    transition: 'all 0.2s'
  },
  tabActive: {
    color: '#3B82F6',
    borderBottomColor: '#3B82F6'
  },
  content: {
    minHeight: '400px'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #E5E7EB',
    borderTop: '4px solid #3B82F6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  agentsList: {
    width: '100%'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  agentCard: {
    background: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  agentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  agentName: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
    color: '#1F2937'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
    color: 'white',
    textTransform: 'uppercase'
  },
  agentDescription: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '16px',
    lineHeight: '1.5'
  },
  agentMeta: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #E5E7EB'
  },
  metaItem: {
    fontSize: '12px',
    color: '#6B7280'
  },
  agentStats: {
    display: 'flex',
    gap: '16px'
  },
  stat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  statLabel: {
    fontSize: '11px',
    color: '#9CA3AF',
    textTransform: 'uppercase'
  },
  statValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#1F2937'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#6B7280'
  },
  primaryButton: {
    padding: '12px 24px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  tasksList: {
    width: '100%'
  },
  taskCreator: {
    background: '#F9FAFB',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#1F2937'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    background: 'white'
  },
  tasksGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  taskCard: {
    background: 'white',
    border: '1px solid #E5E7EB',
    borderRadius: '12px',
    padding: '20px'
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  taskGoal: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: 0,
    color: '#1F2937'
  },
  taskInstructions: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '16px'
  },
  taskProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  },
  progressBar: {
    flex: 1,
    height: '8px',
    background: '#E5E7EB',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: '#3B82F6',
    transition: 'width 0.3s'
  },
  progressText: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#6B7280',
    minWidth: '40px'
  },
  taskSteps: {
    paddingTop: '16px',
    borderTop: '1px solid #E5E7EB'
  },
  stepsLabel: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#6B7280',
    marginBottom: '8px'
  },
  stepsList: {
    margin: 0,
    paddingLeft: '20px',
    fontSize: '13px',
    color: '#374151'
  },
  stepItem: {
    marginBottom: '4px'
  },
  createAgent: {
    maxWidth: '600px'
  }
}

export default AIAgentManager

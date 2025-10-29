/**
 * Agent Orchestration Studio Component
 *
 * Visual workflow designer for multi-agent orchestration
 */

import React, { useState, useEffect, useRef } from 'react'
import { multiAgentOrchestrationService } from '../services/v5CoreServices'
import type {
  AgentOrchestrator,
  OrchestrationAgent,
  WorkflowDefinition,
  WorkflowNode,
  OrchestrationExecution,
  ExecutionLog
} from '../types/v5-types'

interface AgentOrchestrationStudioProps {
  userId: string
}

export const AgentOrchestrationStudio: React.FC<AgentOrchestrationStudioProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<'orchestrators' | 'designer' | 'executions' | 'monitoring'>('orchestrators')
  const [orchestrators, setOrchestrators] = useState<AgentOrchestrator[]>([])
  const [selectedOrchestrator, setSelectedOrchestrator] = useState<AgentOrchestrator | null>(null)
  const [executions, setExecutions] = useState<OrchestrationExecution[]>([])
  const [selectedExecution, setSelectedExecution] = useState<OrchestrationExecution | null>(null)

  // Designer state
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([])
  const [agents, setAgents] = useState<OrchestrationAgent[]>([])
  const [newOrchestratorName, setNewOrchestratorName] = useState('')
  const [newOrchestratorDesc, setNewOrchestratorDesc] = useState('')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [userId])

  useEffect(() => {
    if (selectedOrchestrator && canvasRef.current) {
      drawWorkflow()
    }
  }, [selectedOrchestrator, workflowNodes])

  const loadData = async () => {
    try {
      setLoading(true)
      const orcList = await multiAgentOrchestrationService.listOrchestrators(userId)
      setOrchestrators(orcList)
      setLoading(false)
    } catch (error) {
      console.error('Failed to load orchestrators:', error)
      setLoading(false)
    }
  }

  const handleCreateOrchestrator = async () => {
    if (!newOrchestratorName.trim()) return

    const defaultAgents: OrchestrationAgent[] = [
      {
        id: 'agent_coordinator',
        name: 'Coordinator Agent',
        type: 'primary',
        capabilities: ['coordination', 'planning'],
        role: 'coordinator',
        priority: 1,
        status: 'ready'
      },
      {
        id: 'agent_executor_1',
        name: 'Executor Agent 1',
        type: 'secondary',
        capabilities: ['execution', 'processing'],
        role: 'executor',
        priority: 2,
        status: 'ready'
      },
      {
        id: 'agent_executor_2',
        name: 'Executor Agent 2',
        type: 'secondary',
        capabilities: ['execution', 'analysis'],
        role: 'executor',
        priority: 2,
        status: 'ready'
      }
    ]

    const defaultWorkflow: WorkflowDefinition = {
      id: `workflow_${Date.now()}`,
      name: 'Default Workflow',
      nodes: [
        {
          id: 'node_start',
          type: 'agent',
          agentId: 'agent_coordinator',
          config: {},
          position: { x: 100, y: 200 }
        },
        {
          id: 'node_parallel',
          type: 'parallel',
          config: {},
          position: { x: 300, y: 200 }
        },
        {
          id: 'node_exec1',
          type: 'agent',
          agentId: 'agent_executor_1',
          config: {},
          position: { x: 500, y: 150 }
        },
        {
          id: 'node_exec2',
          type: 'agent',
          agentId: 'agent_executor_2',
          config: {},
          position: { x: 500, y: 250 }
        },
        {
          id: 'node_merge',
          type: 'merge',
          config: {},
          position: { x: 700, y: 200 }
        }
      ],
      edges: [
        { id: 'edge1', source: 'node_start', target: 'node_parallel' },
        { id: 'edge2', source: 'node_parallel', target: 'node_exec1' },
        { id: 'edge3', source: 'node_parallel', target: 'node_exec2' },
        { id: 'edge4', source: 'node_exec1', target: 'node_merge' },
        { id: 'edge5', source: 'node_exec2', target: 'node_merge' }
      ],
      variables: {},
      triggers: []
    }

    const orchestrator = await multiAgentOrchestrationService.createOrchestrator(
      newOrchestratorName,
      newOrchestratorDesc,
      defaultAgents,
      defaultWorkflow,
      userId
    )

    setOrchestrators([...orchestrators, orchestrator])
    setNewOrchestratorName('')
    setNewOrchestratorDesc('')
    alert('Orchestrator created successfully!')
  }

  const handleSelectOrchestrator = (orc: AgentOrchestrator) => {
    setSelectedOrchestrator(orc)
    setWorkflowNodes(orc.workflow.nodes)
    setAgents(orc.agents)
    setActiveTab('designer')
  }

  const handleExecuteWorkflow = async () => {
    if (!selectedOrchestrator) return

    try {
      const execution = await multiAgentOrchestrationService.executeWorkflow(
        selectedOrchestrator.id,
        { input: 'test data' }
      )

      setExecutions([execution, ...executions])
      setSelectedExecution(execution)
      setActiveTab('executions')
      alert('Workflow execution started!')
    } catch (error: any) {
      alert(`Execution failed: ${error.message}`)
    }
  }

  const drawWorkflow = () => {
    const canvas = canvasRef.current
    if (!canvas || !selectedOrchestrator) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const { nodes, edges } = selectedOrchestrator.workflow

    // Draw edges first
    ctx.strokeStyle = '#3B82F6'
    ctx.lineWidth = 2
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source)
      const targetNode = nodes.find(n => n.id === edge.target)

      if (sourceNode && targetNode) {
        ctx.beginPath()
        ctx.moveTo(sourceNode.position.x + 60, sourceNode.position.y + 30)
        ctx.lineTo(targetNode.position.x, targetNode.position.y + 30)
        ctx.stroke()

        // Draw arrow
        const angle = Math.atan2(
          targetNode.position.y - sourceNode.position.y,
          targetNode.position.x - sourceNode.position.x
        )
        ctx.beginPath()
        ctx.moveTo(targetNode.position.x, targetNode.position.y + 30)
        ctx.lineTo(
          targetNode.position.x - 10 * Math.cos(angle - Math.PI / 6),
          targetNode.position.y + 30 - 10 * Math.sin(angle - Math.PI / 6)
        )
        ctx.moveTo(targetNode.position.x, targetNode.position.y + 30)
        ctx.lineTo(
          targetNode.position.x - 10 * Math.cos(angle + Math.PI / 6),
          targetNode.position.y + 30 - 10 * Math.sin(angle + Math.PI / 6)
        )
        ctx.stroke()
      }
    })

    // Draw nodes
    nodes.forEach(node => {
      const colors: Record<string, string> = {
        agent: '#10B981',
        decision: '#F59E0B',
        parallel: '#8B5CF6',
        sequential: '#3B82F6',
        merge: '#EC4899',
        transform: '#6B7280'
      }

      ctx.fillStyle = colors[node.type] || '#6B7280'
      ctx.fillRect(node.position.x, node.position.y, 120, 60)

      ctx.fillStyle = 'white'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(node.type.toUpperCase(), node.position.x + 60, node.position.y + 25)

      if (node.agentId) {
        ctx.font = '10px Arial'
        ctx.fillText(node.agentId, node.position.x + 60, node.position.y + 45)
      }
    })
  }

  const renderOrchestratorsTab = () => (
    <div style={styles.tabContent}>
      <div style={styles.createSection}>
        <h3>Create New Orchestrator</h3>
        <input
          type="text"
          style={styles.input}
          value={newOrchestratorName}
          onChange={(e) => setNewOrchestratorName(e.target.value)}
          placeholder="Orchestrator name..."
        />
        <input
          type="text"
          style={styles.input}
          value={newOrchestratorDesc}
          onChange={(e) => setNewOrchestratorDesc(e.target.value)}
          placeholder="Description..."
        />
        <button style={styles.primaryButton} onClick={handleCreateOrchestrator}>
          Create Orchestrator
        </button>
      </div>

      <div style={styles.orchestratorList}>
        <h3>My Orchestrators ({orchestrators.length})</h3>
        {orchestrators.map(orc => (
          <div key={orc.id} style={styles.orchestratorCard} onClick={() => handleSelectOrchestrator(orc)}>
            <div style={styles.cardHeader}>
              <h4>{orc.name}</h4>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: getStatusColor(orc.status)
              }}>
                {orc.status}
              </span>
            </div>
            <p style={styles.cardDesc}>{orc.description}</p>
            <div style={styles.cardStats}>
              <span>👥 {orc.agents.length} agents</span>
              <span>🔗 {orc.workflow.nodes.length} nodes</span>
              <span>📅 {new Date(orc.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderDesignerTab = () => (
    <div style={styles.tabContent}>
      {selectedOrchestrator ? (
        <>
          <div style={styles.designerHeader}>
            <h2>{selectedOrchestrator.name}</h2>
            <div style={styles.designerActions}>
              <button style={styles.primaryButton} onClick={handleExecuteWorkflow}>
                ▶ Execute Workflow
              </button>
              <button style={styles.secondaryButton}>
                💾 Save
              </button>
            </div>
          </div>

          <div style={styles.designerContainer}>
            <div style={styles.agentPanel}>
              <h3>Agents</h3>
              {agents.map(agent => (
                <div key={agent.id} style={styles.agentCard}>
                  <div style={styles.agentHeader}>
                    <strong>{agent.name}</strong>
                    <span style={{
                      ...styles.agentBadge,
                      backgroundColor: agent.type === 'primary' ? '#3B82F6' : '#6B7280'
                    }}>
                      {agent.type}
                    </span>
                  </div>
                  <p style={styles.agentRole}>{agent.role}</p>
                  <div style={styles.capabilities}>
                    {agent.capabilities.map(cap => (
                      <span key={cap} style={styles.capabilityTag}>{cap}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.canvasContainer}>
              <canvas
                ref={canvasRef}
                width={900}
                height={500}
                style={styles.canvas}
              />
            </div>

            <div style={styles.nodePanel}>
              <h3>Node Types</h3>
              <div style={styles.nodeTypes}>
                <div style={{...styles.nodeType, backgroundColor: '#10B981'}}>
                  <span>Agent</span>
                </div>
                <div style={{...styles.nodeType, backgroundColor: '#F59E0B'}}>
                  <span>Decision</span>
                </div>
                <div style={{...styles.nodeType, backgroundColor: '#8B5CF6'}}>
                  <span>Parallel</span>
                </div>
                <div style={{...styles.nodeType, backgroundColor: '#EC4899'}}>
                  <span>Merge</span>
                </div>
                <div style={{...styles.nodeType, backgroundColor: '#6B7280'}}>
                  <span>Transform</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={styles.emptyState}>
          <p>Select an orchestrator to design its workflow</p>
        </div>
      )}
    </div>
  )

  const renderExecutionsTab = () => (
    <div style={styles.tabContent}>
      <h3>Workflow Executions</h3>
      <div style={styles.executionsList}>
        {executions.map(exec => (
          <div
            key={exec.id}
            style={styles.executionCard}
            onClick={() => setSelectedExecution(exec)}
          >
            <div style={styles.executionHeader}>
              <span>Execution {exec.id}</span>
              <span style={{
                ...styles.statusBadge,
                backgroundColor: getStatusColor(exec.status)
              }}>
                {exec.status}
              </span>
            </div>
            <div style={styles.executionStats}>
              <span>⏱️ {exec.metrics.totalDuration}ms</span>
              <span>🤖 {exec.metrics.agentExecutions} executions</span>
              <span>✅ {(exec.metrics.successRate * 100).toFixed(0)}% success</span>
            </div>
            <p style={styles.executionTime}>
              {new Date(exec.startTime).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      {selectedExecution && (
        <div style={styles.executionDetails}>
          <h3>Execution Details</h3>
          <div style={styles.logsContainer}>
            {selectedExecution.logs.map((log, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.logEntry,
                  borderLeftColor: getLogColor(log.level)
                }}
              >
                <div style={styles.logHeader}>
                  <span style={styles.logLevel}>{log.level.toUpperCase()}</span>
                  <span style={styles.logTime}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p style={styles.logMessage}>{log.message}</p>
                {log.nodeId && <span style={styles.logNode}>Node: {log.nodeId}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderMonitoringTab = () => (
    <div style={styles.tabContent}>
      <h3>Real-time Monitoring</h3>
      <div style={styles.monitoringGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>🤖</div>
          <div>
            <p style={styles.metricLabel}>Active Orchestrators</p>
            <p style={styles.metricValue}>
              {orchestrators.filter(o => o.status === 'running').length}
            </p>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>▶</div>
          <div>
            <p style={styles.metricLabel}>Running Executions</p>
            <p style={styles.metricValue}>
              {executions.filter(e => e.status === 'running').length}
            </p>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>✅</div>
          <div>
            <p style={styles.metricLabel}>Success Rate</p>
            <p style={styles.metricValue}>
              {executions.length > 0
                ? ((executions.filter(e => e.status === 'completed').length / executions.length) * 100).toFixed(0)
                : 0}%
            </p>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>⚡</div>
          <div>
            <p style={styles.metricLabel}>Avg Response Time</p>
            <p style={styles.metricValue}>
              {executions.length > 0
                ? Math.round(executions.reduce((sum, e) => sum + (e.metrics.averageResponseTime || 0), 0) / executions.length)
                : 0}ms
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      idle: '#6B7280',
      running: '#3B82F6',
      paused: '#F59E0B',
      completed: '#10B981',
      failed: '#EF4444',
      pending: '#8B5CF6'
    }
    return colors[status] || '#6B7280'
  }

  const getLogColor = (level: string): string => {
    const colors: Record<string, string> = {
      debug: '#6B7280',
      info: '#3B82F6',
      warning: '#F59E0B',
      error: '#EF4444'
    }
    return colors[level] || '#6B7280'
  }

  if (loading) {
    return <div style={styles.loading}>Loading orchestration studio...</div>
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Agent Orchestration Studio</h1>
        <p style={styles.subtitle}>Design and execute multi-agent workflows</p>
      </div>

      <div style={styles.tabs}>
        <button
          style={activeTab === 'orchestrators' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('orchestrators')}
        >
          📋 Orchestrators
        </button>
        <button
          style={activeTab === 'designer' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('designer')}
        >
          🎨 Designer
        </button>
        <button
          style={activeTab === 'executions' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('executions')}
        >
          ▶ Executions
        </button>
        <button
          style={activeTab === 'monitoring' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('monitoring')}
        >
          📊 Monitoring
        </button>
      </div>

      {activeTab === 'orchestrators' && renderOrchestratorsTab()}
      {activeTab === 'designer' && renderDesignerTab()}
      {activeTab === 'executions' && renderExecutionsTab()}
      {activeTab === 'monitoring' && renderMonitoringTab()}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1600px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    marginBottom: '30px',
    textAlign: 'center'
  },
  title: {
    fontSize: '36px',
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
    marginBottom: '30px',
    borderBottom: '2px solid #E5E7EB',
    paddingBottom: '0'
  },
  tab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    fontSize: '16px',
    fontWeight: 500,
    color: '#6B7280',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  activeTab: {
    padding: '12px 24px',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid #3B82F6',
    fontSize: '16px',
    fontWeight: 600,
    color: '#3B82F6',
    cursor: 'pointer'
  },
  tabContent: {
    minHeight: '600px'
  },
  loading: {
    textAlign: 'center',
    padding: '100px',
    fontSize: '18px',
    color: '#6B7280'
  },
  // Orchestrators tab
  createSection: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    marginBottom: '24px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '12px'
  },
  primaryButton: {
    padding: '12px 24px',
    background: '#3B82F6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s'
  },
  secondaryButton: {
    padding: '12px 24px',
    background: '#F3F4F6',
    color: '#1F2937',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  orchestratorList: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  orchestratorCard: {
    padding: '20px',
    background: '#F9FAFB',
    borderRadius: '12px',
    marginTop: '16px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid #E5E7EB'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'white'
  },
  cardDesc: {
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '12px'
  },
  cardStats: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#6B7280'
  },
  // Designer tab
  designerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  designerActions: {
    display: 'flex',
    gap: '12px'
  },
  designerContainer: {
    display: 'grid',
    gridTemplateColumns: '250px 1fr 250px',
    gap: '20px',
    height: '600px'
  },
  agentPanel: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    overflowY: 'auto'
  },
  agentCard: {
    padding: '16px',
    background: '#F9FAFB',
    borderRadius: '8px',
    marginTop: '12px',
    border: '1px solid #E5E7EB'
  },
  agentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  agentBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'white'
  },
  agentRole: {
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '8px'
  },
  capabilities: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px'
  },
  capabilityTag: {
    padding: '2px 8px',
    background: '#DBEAFE',
    color: '#1E40AF',
    borderRadius: '4px',
    fontSize: '11px'
  },
  canvasContainer: {
    background: 'white',
    borderRadius: '12px',
    border: '2px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'auto'
  },
  canvas: {
    cursor: 'move'
  },
  nodePanel: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  nodeTypes: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '12px'
  },
  nodeType: {
    padding: '12px',
    borderRadius: '8px',
    color: 'white',
    textAlign: 'center',
    fontWeight: 600,
    cursor: 'grab'
  },
  // Executions tab
  executionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginTop: '16px'
  },
  executionCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    cursor: 'pointer',
    transition: 'border-color 0.2s'
  },
  executionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  executionStats: {
    display: 'flex',
    gap: '16px',
    fontSize: '14px',
    color: '#6B7280',
    marginBottom: '8px'
  },
  executionTime: {
    fontSize: '13px',
    color: '#9CA3AF'
  },
  executionDetails: {
    marginTop: '32px',
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB'
  },
  logsContainer: {
    marginTop: '16px',
    maxHeight: '400px',
    overflowY: 'auto'
  },
  logEntry: {
    padding: '12px',
    background: '#F9FAFB',
    borderRadius: '6px',
    borderLeft: '4px solid',
    marginBottom: '8px'
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  logLevel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#1F2937'
  },
  logTime: {
    fontSize: '12px',
    color: '#9CA3AF'
  },
  logMessage: {
    fontSize: '14px',
    color: '#374151',
    margin: '0 0 4px 0'
  },
  logNode: {
    fontSize: '12px',
    color: '#6B7280'
  },
  // Monitoring tab
  monitoringGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  metricCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  metricIcon: {
    fontSize: '32px'
  },
  metricLabel: {
    fontSize: '14px',
    color: '#6B7280',
    margin: '0 0 8px 0'
  },
  metricValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
    color: '#1F2937'
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    color: '#6B7280',
    fontSize: '16px'
  }
}

export default AgentOrchestrationStudio

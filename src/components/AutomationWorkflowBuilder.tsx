/**
 * AI Chat Studio v5.1 - Automation Workflow Builder
 *
 * Visual automation builder (Zapier-like) with:
 * - Drag-and-drop workflow designer
 * - Trigger configuration (time, webhook, event)
 * - Action nodes (API calls, emails, notifications)
 * - Conditional logic and branching
 * - Data mapping and transformation
 * - Template library with pre-built workflows
 * - Execution history and monitoring
 * - Error handling and retry logic
 */

import React, { useState, useEffect, useRef } from 'react'

interface AutomationWorkflowBuilderProps {
  userId: string
}

type TabType = 'workflows' | 'designer' | 'triggers' | 'actions' | 'templates' | 'history'
type NodeType = 'trigger' | 'action' | 'condition' | 'delay' | 'transform'
type TriggerType = 'schedule' | 'webhook' | 'event' | 'manual'
type ActionType = 'api_call' | 'email' | 'notification' | 'database' | 'slack' | 'webhook'

interface WorkflowNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  config: any
  connections: string[] // IDs of connected nodes
}

interface Workflow {
  id: string
  name: string
  description: string
  userId: string
  nodes: WorkflowNode[]
  status: 'active' | 'inactive' | 'error'
  trigger: TriggerConfig
  createdAt: Date
  lastRun?: Date
  runCount: number
  successRate: number
}

interface TriggerConfig {
  type: TriggerType
  config: any
}

interface ActionConfig {
  type: ActionType
  name: string
  config: any
}

interface WorkflowExecution {
  id: string
  workflowId: string
  startTime: Date
  endTime?: Date
  status: 'running' | 'completed' | 'failed'
  steps: ExecutionStep[]
  error?: string
}

interface ExecutionStep {
  nodeId: string
  nodeName: string
  startTime: Date
  endTime?: Date
  status: 'pending' | 'running' | 'completed' | 'failed'
  input: any
  output: any
  error?: string
}

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  nodes: WorkflowNode[]
  trigger: TriggerConfig
  popular: boolean
}

const AutomationWorkflowBuilder: React.FC<AutomationWorkflowBuilderProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('workflows')
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [nodes, setNodes] = useState<WorkflowNode[]>([])
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [isDesigning, setIsDesigning] = useState(false)
  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)

  // New workflow form
  const [newWorkflowName, setNewWorkflowName] = useState('')
  const [newWorkflowDesc, setNewWorkflowDesc] = useState('')

  useEffect(() => {
    loadWorkflowData()
  }, [])

  useEffect(() => {
    if (selectedWorkflow) {
      setNodes(selectedWorkflow.nodes)
    }
  }, [selectedWorkflow])

  const loadWorkflowData = () => {
    // Mock workflows
    const mockWorkflows: Workflow[] = [
      {
        id: 'wf_1',
        name: 'Customer Onboarding',
        description: 'Automated welcome email and account setup',
        userId,
        nodes: [],
        status: 'active',
        trigger: { type: 'event', config: { event: 'user.signup' } },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
        runCount: 245,
        successRate: 98.4
      },
      {
        id: 'wf_2',
        name: 'Daily Report Generator',
        description: 'Generate and email daily analytics report',
        userId,
        nodes: [],
        status: 'active',
        trigger: { type: 'schedule', config: { cron: '0 9 * * *' } },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000),
        runCount: 30,
        successRate: 100
      }
    ]
    setWorkflows(mockWorkflows)

    // Mock templates
    const mockTemplates: WorkflowTemplate[] = [
      {
        id: 'tpl_1',
        name: 'Welcome Email Sequence',
        description: 'Send a series of welcome emails to new users',
        category: 'Marketing',
        nodes: [],
        trigger: { type: 'event', config: { event: 'user.signup' } },
        popular: true
      },
      {
        id: 'tpl_2',
        name: 'Slack Notification on Error',
        description: 'Send Slack message when system error occurs',
        category: 'Monitoring',
        nodes: [],
        trigger: { type: 'event', config: { event: 'error.critical' } },
        popular: true
      },
      {
        id: 'tpl_3',
        name: 'Database Backup',
        description: 'Daily database backup to cloud storage',
        category: 'Operations',
        nodes: [],
        trigger: { type: 'schedule', config: { cron: '0 2 * * *' } },
        popular: false
      }
    ]
    setTemplates(mockTemplates)

    // Mock executions
    const mockExecutions: WorkflowExecution[] = [
      {
        id: 'exec_1',
        workflowId: 'wf_1',
        startTime: new Date(Date.now() - 10 * 60 * 1000),
        endTime: new Date(Date.now() - 9 * 60 * 1000),
        status: 'completed',
        steps: [
          {
            nodeId: 'node_1',
            nodeName: 'Send Welcome Email',
            startTime: new Date(Date.now() - 10 * 60 * 1000),
            endTime: new Date(Date.now() - 9 * 60 * 1000),
            status: 'completed',
            input: { email: 'user@example.com' },
            output: { messageId: 'msg_123' }
          }
        ]
      }
    ]
    setExecutions(mockExecutions)
  }

  const handleCreateWorkflow = () => {
    if (!newWorkflowName.trim()) {
      alert('Please enter workflow name')
      return
    }

    const newWorkflow: Workflow = {
      id: `wf_${Date.now()}`,
      name: newWorkflowName,
      description: newWorkflowDesc,
      userId,
      nodes: [],
      status: 'inactive',
      trigger: { type: 'manual', config: {} },
      createdAt: new Date(),
      runCount: 0,
      successRate: 0
    }

    setWorkflows([...workflows, newWorkflow])
    setSelectedWorkflow(newWorkflow)
    setActiveTab('designer')
    setNewWorkflowName('')
    setNewWorkflowDesc('')
  }

  const handleDeleteWorkflow = (workflowId: string) => {
    if (confirm('Delete this workflow? This action cannot be undone.')) {
      setWorkflows(workflows.filter(w => w.id !== workflowId))
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(null)
      }
    }
  }

  const handleToggleWorkflowStatus = (workflowId: string) => {
    setWorkflows(workflows.map(w =>
      w.id === workflowId
        ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' as any }
        : w
    ))
  }

  const handleNodeDragStart = (nodeType: NodeType) => {
    setDraggedNodeType(nodeType)
  }

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedNodeType || !canvasRef.current || !selectedWorkflow) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type: draggedNodeType,
      position: { x, y },
      config: getDefaultConfig(draggedNodeType),
      connections: []
    }

    setNodes([...nodes, newNode])
    setDraggedNodeType(null)
  }

  const getDefaultConfig = (nodeType: NodeType) => {
    switch (nodeType) {
      case 'trigger':
        return { type: 'schedule', cron: '0 9 * * *' }
      case 'action':
        return { type: 'api_call', url: '', method: 'POST' }
      case 'condition':
        return { field: '', operator: 'equals', value: '' }
      case 'delay':
        return { duration: 60, unit: 'seconds' }
      case 'transform':
        return { script: 'return data;' }
      default:
        return {}
    }
  }

  const handleNodeClick = (node: WorkflowNode) => {
    setSelectedNode(node)
  }

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId))
    if (selectedNode?.id === nodeId) {
      setSelectedNode(null)
    }
  }

  const handleConnectNodes = (sourceId: string, targetId: string) => {
    setNodes(nodes.map(n =>
      n.id === sourceId
        ? { ...n, connections: [...n.connections, targetId] }
        : n
    ))
  }

  const handleRunWorkflow = async (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId)
    if (!workflow) return

    alert(`Running workflow: ${workflow.name}`)

    // Simulate execution
    const execution: WorkflowExecution = {
      id: `exec_${Date.now()}`,
      workflowId,
      startTime: new Date(),
      status: 'running',
      steps: []
    }

    setExecutions([execution, ...executions])

    // Simulate completion
    setTimeout(() => {
      execution.status = 'completed'
      execution.endTime = new Date()
      setExecutions([...executions])
    }, 2000)
  }

  const handleUseTemplate = (template: WorkflowTemplate) => {
    const newWorkflow: Workflow = {
      id: `wf_${Date.now()}`,
      name: template.name,
      description: template.description,
      userId,
      nodes: template.nodes,
      status: 'inactive',
      trigger: template.trigger,
      createdAt: new Date(),
      runCount: 0,
      successRate: 0
    }

    setWorkflows([...workflows, newWorkflow])
    setSelectedWorkflow(newWorkflow)
    setActiveTab('designer')
  }

  const getNodeIcon = (type: NodeType) => {
    const icons = {
      trigger: '⚡',
      action: '⚙️',
      condition: '🔀',
      delay: '⏱️',
      transform: '🔄'
    }
    return icons[type]
  }

  const getNodeColor = (type: NodeType) => {
    const colors = {
      trigger: '#f59e0b',
      action: '#3b82f6',
      condition: '#8b5cf6',
      delay: '#6b7280',
      transform: '#10b981'
    }
    return colors[type]
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: '#10b981',
      inactive: '#6b7280',
      error: '#ef4444',
      running: '#f59e0b',
      completed: '#10b981',
      failed: '#ef4444'
    }
    return colors[status] || '#6b7280'
  }

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const duration = (endTime || new Date()).getTime() - startTime.getTime()
    const seconds = Math.floor(duration / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    return `${minutes}m ${seconds % 60}s`
  }

  const renderWorkflows = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>My Workflows</h2>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {workflows.length} workflows | {workflows.filter(w => w.status === 'active').length} active
        </div>
      </div>

      {/* Create Workflow Form */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Create New Workflow</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Workflow Name *
            </label>
            <input
              type="text"
              value={newWorkflowName}
              onChange={(e) => setNewWorkflowName(e.target.value)}
              placeholder="e.g., Customer Onboarding"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Description
            </label>
            <input
              type="text"
              value={newWorkflowDesc}
              onChange={(e) => setNewWorkflowDesc(e.target.value)}
              placeholder="Brief description of what this workflow does"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            />
          </div>
        </div>
        <button
          onClick={handleCreateWorkflow}
          style={{
            marginTop: '15px',
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Create Workflow
        </button>
      </div>

      {/* Workflows List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {workflows.map(workflow => (
          <div
            key={workflow.id}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => {
              setSelectedWorkflow(workflow)
              setActiveTab('designer')
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>{workflow.name}</h3>
                <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                  {workflow.description}
                </p>
              </div>
              <span style={{
                padding: '4px 10px',
                backgroundColor: `${getStatusColor(workflow.status)}20`,
                color: getStatusColor(workflow.status),
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {workflow.status}
              </span>
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              marginBottom: '15px',
              fontSize: '14px',
              color: '#666'
            }}>
              <div><strong>Trigger:</strong> {workflow.trigger.type}</div>
              <div><strong>Last run:</strong> {workflow.lastRun ? workflow.lastRun.toLocaleString() : 'Never'}</div>
              <div><strong>Total runs:</strong> {workflow.runCount}</div>
              <div><strong>Success rate:</strong> {workflow.successRate}%</div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleWorkflowStatus(workflow.id)
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: workflow.status === 'active' ? '#f59e0b' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                {workflow.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRunWorkflow(workflow.id)
                }}
                style={{
                  flex: 1,
                  padding: '8px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                ▶ Run
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteWorkflow(workflow.id)
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        {workflows.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '60px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚡</div>
            <h3>No Workflows Yet</h3>
            <p>Create your first automation workflow or use a template</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderDesigner = () => (
    <div style={{ padding: '20px' }}>
      {!selectedWorkflow ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f9fafb',
          borderRadius: '8px'
        }}>
          <h3>No Workflow Selected</h3>
          <p>Select a workflow from the Workflows tab or create a new one</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0 }}>{selectedWorkflow.name}</h2>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>{selectedWorkflow.description}</p>
            </div>
            <button
              onClick={() => handleRunWorkflow(selectedWorkflow.id)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ▶ Test Workflow
            </button>
          </div>

          {/* Node Palette */}
          <div style={{
            padding: '15px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Node Palette</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {(['trigger', 'action', 'condition', 'delay', 'transform'] as NodeType[]).map(type => (
                <div
                  key={type}
                  draggable
                  onDragStart={() => handleNodeDragStart(type)}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: 'white',
                    border: `2px dashed ${getNodeColor(type)}`,
                    borderRadius: '6px',
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textTransform: 'capitalize',
                    fontWeight: 'bold',
                    color: getNodeColor(type)
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{getNodeIcon(type)}</span>
                  <span>{type}</span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: '10px',
              fontSize: '13px',
              color: '#666',
              backgroundColor: '#dbeafe',
              padding: '8px 12px',
              borderRadius: '4px'
            }}>
              💡 Drag and drop nodes onto the canvas to build your workflow
            </div>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleCanvasDrop}
            style={{
              minHeight: '500px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              border: '2px dashed #cbd5e1',
              position: 'relative',
              padding: '20px'
            }}
          >
            {nodes.map(node => (
              <div
                key={node.id}
                onClick={() => handleNodeClick(node)}
                style={{
                  position: 'absolute',
                  left: `${node.position.x}px`,
                  top: `${node.position.y}px`,
                  padding: '15px 20px',
                  backgroundColor: 'white',
                  border: `3px solid ${selectedNode?.id === node.id ? '#3b82f6' : getNodeColor(node.type)}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  minWidth: '150px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <span style={{ fontSize: '24px' }}>{getNodeIcon(node.type)}</span>
                  <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {node.type}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Node ID: {node.id.substring(0, 8)}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteNode(node.id)
                  }}
                  style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px'
                  }}
                >
                  Delete
                </button>

                {/* Connection lines */}
                {node.connections.map(targetId => {
                  const targetNode = nodes.find(n => n.id === targetId)
                  if (!targetNode) return null

                  const startX = node.position.x + 75
                  const startY = node.position.y + 50
                  const endX = targetNode.position.x
                  const endY = targetNode.position.y + 25

                  return (
                    <svg
                      key={targetId}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: -1
                      }}
                    >
                      <line
                        x1={startX}
                        y1={startY}
                        x2={endX}
                        y2={endY}
                        stroke={getNodeColor(node.type)}
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    </svg>
                  )
                })}
              </div>
            ))}

            {nodes.length === 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '400px',
                color: '#666',
                fontSize: '18px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎨</div>
                  <h3>Empty Canvas</h3>
                  <p>Drag nodes from the palette above to start building your workflow</p>
                </div>
              </div>
            )}
          </div>

          {/* Node Configuration Panel */}
          {selectedNode && (
            <div style={{
              marginTop: '20px',
              padding: '20px',
              backgroundColor: 'white',
              border: '2px solid #3b82f6',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>
                  {getNodeIcon(selectedNode.type)} Configure {selectedNode.type}
                </h3>
                <button
                  onClick={() => setSelectedNode(null)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#e5e7eb',
                    color: '#666',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {selectedNode.type === 'action' && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                        Action Type
                      </label>
                      <select style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #ddd'
                      }}>
                        <option>API Call</option>
                        <option>Send Email</option>
                        <option>Send Notification</option>
                        <option>Database Query</option>
                        <option>Slack Message</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                        URL / Endpoint
                      </label>
                      <input
                        type="text"
                        placeholder="https://api.example.com/endpoint"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid #ddd',
                          fontFamily: 'monospace'
                        }}
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'condition' && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                        Field
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., user.email"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid #ddd'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                        Operator
                      </label>
                      <select style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #ddd'
                      }}>
                        <option>equals</option>
                        <option>not equals</option>
                        <option>contains</option>
                        <option>greater than</option>
                        <option>less than</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                        Value
                      </label>
                      <input
                        type="text"
                        placeholder="Comparison value"
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid #ddd'
                        }}
                      />
                    </div>
                  </>
                )}

                {selectedNode.type === 'delay' && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                        Duration
                      </label>
                      <input
                        type="number"
                        defaultValue={60}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '6px',
                          border: '1px solid #ddd'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                        Unit
                      </label>
                      <select style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #ddd'
                      }}>
                        <option>seconds</option>
                        <option>minutes</option>
                        <option>hours</option>
                        <option>days</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <button
                style={{
                  marginTop: '15px',
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Save Configuration
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )

  const renderTemplates = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Workflow Templates</h2>

      {/* Popular Templates */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Popular Templates</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {templates.filter(t => t.popular).map(template => (
            <div
              key={template.id}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                border: '2px solid #e5e7eb',
                borderRadius: '8px'
              }}
            >
              <div style={{
                display: 'inline-block',
                padding: '4px 10px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                marginBottom: '10px'
              }}>
                {template.category}
              </div>
              <h3 style={{ margin: '10px 0' }}>{template.name}</h3>
              <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>
                {template.description}
              </p>
              <button
                onClick={() => handleUseTemplate(template)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* All Templates */}
      <div>
        <h3>All Templates</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {templates.map(template => (
            <div
              key={template.id}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            >
              <div style={{
                display: 'inline-block',
                padding: '4px 10px',
                backgroundColor: '#f3f4f6',
                color: '#4b5563',
                borderRadius: '6px',
                fontSize: '12px',
                marginBottom: '10px'
              }}>
                {template.category}
              </div>
              <h4 style={{ margin: '10px 0' }}>{template.name}</h4>
              <p style={{ margin: '0 0 15px 0', fontSize: '13px', color: '#666' }}>
                {template.description}
              </p>
              <button
                onClick={() => handleUseTemplate(template)}
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: '#f9fafb',
                  color: '#666',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderHistory = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Execution History</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {executions.map(execution => {
          const workflow = workflows.find(w => w.id === execution.workflowId)
          return (
            <div
              key={execution.id}
              style={{
                padding: '20px',
                backgroundColor: 'white',
                border: `2px solid ${getStatusColor(execution.status)}`,
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>
                    {workflow?.name || 'Unknown Workflow'}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    Started: {execution.startTime.toLocaleString()}
                    {execution.endTime && ` • Duration: ${formatDuration(execution.startTime, execution.endTime)}`}
                  </div>
                </div>
                <span style={{
                  padding: '6px 12px',
                  backgroundColor: `${getStatusColor(execution.status)}20`,
                  color: getStatusColor(execution.status),
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {execution.status}
                </span>
              </div>

              {/* Execution Steps */}
              <div>
                <h4 style={{ marginBottom: '10px' }}>Steps</h4>
                {execution.steps.map((step, index) => (
                  <div
                    key={step.nodeId}
                    style={{
                      padding: '12px',
                      backgroundColor: '#f9fafb',
                      borderLeft: `4px solid ${getStatusColor(step.status)}`,
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 'bold' }}>
                        {index + 1}. {step.nodeName}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: getStatusColor(step.status),
                        fontWeight: 'bold'
                      }}>
                        {step.status}
                      </span>
                    </div>
                    {step.endTime && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Duration: {formatDuration(step.startTime, step.endTime)}
                      </div>
                    )}
                    {step.error && (
                      <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fee2e2', borderRadius: '4px', fontSize: '13px', color: '#991b1b' }}>
                        Error: {step.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {execution.error && (
                <div style={{
                  marginTop: '15px',
                  padding: '12px',
                  backgroundColor: '#fee2e2',
                  borderRadius: '6px',
                  color: '#991b1b',
                  fontSize: '14px'
                }}>
                  <strong>Workflow Error:</strong> {execution.error}
                </div>
              )}
            </div>
          )
        })}

        {executions.length === 0 && (
          <div style={{
            padding: '60px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
            <h3>No Execution History</h3>
            <p>Run a workflow to see execution history here</p>
          </div>
        )}
      </div>
    </div>
  )

  const tabs = [
    { id: 'workflows', label: 'Workflows', icon: '⚡' },
    { id: 'designer', label: 'Designer', icon: '🎨' },
    { id: 'templates', label: 'Templates', icon: '📋' },
    { id: 'history', label: 'History', icon: '📊' }
  ]

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1e293b',
        color: 'white',
        borderBottom: '3px solid #f59e0b'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>⚡ Automation Workflow Builder</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
          Build powerful automations with visual workflow designer
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            style={{
              padding: '15px 25px',
              backgroundColor: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#f59e0b' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #f59e0b' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'workflows' && renderWorkflows()}
      {activeTab === 'designer' && renderDesigner()}
      {activeTab === 'templates' && renderTemplates()}
      {activeTab === 'history' && renderHistory()}
    </div>
  )
}

export default AutomationWorkflowBuilder

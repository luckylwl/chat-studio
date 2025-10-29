/**
 * AI Chat Studio v5.0 - BI Dashboard Builder
 *
 * Comprehensive business intelligence dashboard builder with:
 * - Drag-and-drop dashboard designer
 * - Multiple widget types (charts, tables, metrics, etc.)
 * - Data source management
 * - Real-time data updates
 * - Custom query builder
 * - Export and sharing capabilities
 */

import React, { useState, useEffect, useRef } from 'react'
import { biDashboardService } from '../services/v5CoreServices'
import {
  BIDashboard,
  DashboardWidget,
  DataSource,
  DataQuery,
  VisualizationConfig,
  MetricCard
} from '../types/v5-types'

interface BIDashboardBuilderProps {
  userId: string
}

type TabType = 'dashboards' | 'designer' | 'datasources' | 'queries' | 'preview'
type WidgetType = 'chart' | 'table' | 'metric' | 'gauge' | 'map' | 'text'
type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter'

const BIDashboardBuilder: React.FC<BIDashboardBuilderProps> = ({ userId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboards')
  const [dashboards, setDashboards] = useState<BIDashboard[]>([])
  const [selectedDashboard, setSelectedDashboard] = useState<BIDashboard | null>(null)
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null)

  // Designer state
  const [isDesigning, setIsDesigning] = useState(false)
  const [draggedWidget, setDraggedWidget] = useState<WidgetType | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Widget form state
  const [newWidget, setNewWidget] = useState({
    type: 'chart' as WidgetType,
    title: '',
    dataSourceId: '',
    chartType: 'line' as ChartType,
    width: 6,
    height: 4
  })

  // Data source form state
  const [newDataSource, setNewDataSource] = useState({
    name: '',
    type: 'postgresql' as 'postgresql' | 'mysql' | 'mongodb' | 'api' | 'csv',
    host: '',
    port: '',
    database: '',
    username: ''
  })

  useEffect(() => {
    loadDashboards()
    loadDataSources()
  }, [])

  useEffect(() => {
    if (selectedDashboard) {
      loadDashboardWidgets()
    }
  }, [selectedDashboard])

  const loadDashboards = async () => {
    const allDashboards = await biDashboardService.getAllDashboards()
    setDashboards(allDashboards.filter(d => d.userId === userId))
  }

  const loadDataSources = async () => {
    const sources = await biDashboardService.getAllDataSources()
    setDataSources(sources.filter(s => s.userId === userId))
  }

  const loadDashboardWidgets = async () => {
    if (!selectedDashboard) return
    setWidgets(selectedDashboard.widgets)
  }

  const handleCreateDashboard = async () => {
    const name = prompt('Enter dashboard name:')
    if (!name) return

    const description = prompt('Enter dashboard description (optional):') || ''

    const dashboard = await biDashboardService.createDashboard(
      userId,
      name,
      description,
      []
    )
    setDashboards([...dashboards, dashboard])
    setSelectedDashboard(dashboard)
  }

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (confirm('Are you sure you want to delete this dashboard?')) {
      await biDashboardService.deleteDashboard(dashboardId)
      setDashboards(dashboards.filter(d => d.id !== dashboardId))
      if (selectedDashboard?.id === dashboardId) {
        setSelectedDashboard(null)
      }
    }
  }

  const handleAddWidget = async () => {
    if (!selectedDashboard || !newWidget.title || !newWidget.dataSourceId) {
      alert('Please fill all required fields')
      return
    }

    const widget: DashboardWidget = {
      id: `widget_${Date.now()}`,
      dashboardId: selectedDashboard.id,
      type: newWidget.type,
      title: newWidget.title,
      dataSourceId: newWidget.dataSourceId,
      query: {
        sql: 'SELECT * FROM table LIMIT 100',
        parameters: {},
        cache: false
      },
      visualization: {
        type: newWidget.chartType,
        options: {
          xAxis: 'date',
          yAxis: 'value',
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
        }
      },
      position: {
        x: 0,
        y: widgets.length * 4,
        width: newWidget.width,
        height: newWidget.height
      },
      refreshInterval: 60
    }

    await biDashboardService.addWidgetToDashboard(selectedDashboard.id, widget)
    setWidgets([...widgets, widget])

    // Reset form
    setNewWidget({
      type: 'chart',
      title: '',
      dataSourceId: '',
      chartType: 'line',
      width: 6,
      height: 4
    })
  }

  const handleRemoveWidget = async (widgetId: string) => {
    if (!selectedDashboard) return

    if (confirm('Remove this widget?')) {
      await biDashboardService.removeWidgetFromDashboard(selectedDashboard.id, widgetId)
      setWidgets(widgets.filter(w => w.id !== widgetId))
    }
  }

  const handleCreateDataSource = async () => {
    if (!newDataSource.name || !newDataSource.host) {
      alert('Please fill all required fields')
      return
    }

    const dataSource: DataSource = {
      id: `ds_${Date.now()}`,
      userId,
      name: newDataSource.name,
      type: newDataSource.type,
      connection: {
        host: newDataSource.host,
        port: parseInt(newDataSource.port) || 5432,
        database: newDataSource.database,
        username: newDataSource.username,
        password: '',
        ssl: false
      },
      schema: {},
      status: 'active',
      lastSync: new Date()
    }

    await biDashboardService.createDataSource(dataSource)
    setDataSources([...dataSources, dataSource])

    // Reset form
    setNewDataSource({
      name: '',
      type: 'postgresql',
      host: '',
      port: '',
      database: '',
      username: ''
    })
  }

  const handleTestDataSource = async (dataSourceId: string) => {
    const success = await biDashboardService.testDataSourceConnection(dataSourceId)
    alert(success ? 'Connection successful!' : 'Connection failed!')
  }

  const handleExecuteQuery = async (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId)
    if (!widget) return

    try {
      const result = await biDashboardService.executeQuery(
        widget.dataSourceId,
        widget.query
      )
      console.log('Query result:', result)
      alert(`Query executed successfully! ${result.rows.length} rows returned.`)
    } catch (error) {
      alert('Query execution failed: ' + error)
    }
  }

  const handleWidgetDragStart = (widgetType: WidgetType) => {
    setDraggedWidget(widgetType)
  }

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!draggedWidget || !canvasRef.current || !selectedDashboard) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / 100)
    const y = Math.floor((e.clientY - rect.top) / 100)

    const newWidgetInstance: DashboardWidget = {
      id: `widget_${Date.now()}`,
      dashboardId: selectedDashboard.id,
      type: draggedWidget,
      title: `New ${draggedWidget} widget`,
      dataSourceId: dataSources[0]?.id || '',
      query: {
        sql: 'SELECT * FROM table',
        parameters: {},
        cache: false
      },
      visualization: {
        type: 'line',
        options: {}
      },
      position: { x, y, width: 6, height: 4 },
      refreshInterval: 60
    }

    setWidgets([...widgets, newWidgetInstance])
    setDraggedWidget(null)
  }

  const renderWidgetPreview = (widget: DashboardWidget) => {
    const getWidgetIcon = (type: WidgetType) => {
      switch (type) {
        case 'chart': return '📊'
        case 'table': return '📋'
        case 'metric': return '🔢'
        case 'gauge': return '⏲️'
        case 'map': return '🗺️'
        case 'text': return '📝'
        default: return '📦'
      }
    }

    // Generate mock data visualization based on widget type
    const renderVisualization = () => {
      if (widget.type === 'chart') {
        return (
          <div style={{
            height: '150px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-around',
            padding: '10px',
            backgroundColor: '#f9fafb',
            borderRadius: '6px'
          }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: '10%',
                  height: `${Math.random() * 100 + 20}%`,
                  backgroundColor: '#3b82f6',
                  borderRadius: '2px 2px 0 0'
                }}
              />
            ))}
          </div>
        )
      } else if (widget.type === 'metric') {
        return (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#f0fdf4',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#10b981' }}>
              {Math.floor(Math.random() * 10000)}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              ↑ +{Math.floor(Math.random() * 20)}% vs last period
            </div>
          </div>
        )
      } else if (widget.type === 'table') {
        return (
          <div style={{ fontSize: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
                  <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                  <th style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{i + 1}</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Item {i + 1}</td>
                    <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                      ${Math.floor(Math.random() * 1000)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      } else if (widget.type === 'gauge') {
        const percentage = Math.floor(Math.random() * 100)
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '10px solid #e5e7eb',
              borderTopColor: percentage > 75 ? '#10b981' : percentage > 50 ? '#f59e0b' : '#ef4444',
              transform: 'rotate(-90deg)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(90deg)',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                {percentage}%
              </div>
            </div>
          </div>
        )
      }

      return (
        <div style={{
          height: '150px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          borderRadius: '6px',
          color: '#666'
        }}>
          {getWidgetIcon(widget.type)} Widget Preview
        </div>
      )
    }

    return (
      <div
        style={{
          padding: '15px',
          backgroundColor: 'white',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          gridColumn: `span ${Math.min(widget.position.width, 12)}`,
          gridRow: `span ${widget.position.height}`,
          cursor: 'pointer',
          transition: 'all 0.2s',
          position: 'relative'
        }}
        onClick={() => setSelectedWidget(widget)}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>
            {getWidgetIcon(widget.type)} {widget.title}
          </h3>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleExecuteQuery(widget.id)
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🔄
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveWidget(widget.id)
              }}
              style={{
                padding: '4px 8px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        </div>
        {renderVisualization()}
      </div>
    )
  }

  const renderDashboards = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>My Dashboards</h2>
        <button
          onClick={handleCreateDashboard}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          + New Dashboard
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {dashboards.map(dashboard => (
          <div
            key={dashboard.id}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onClick={() => {
              setSelectedDashboard(dashboard)
              setActiveTab('designer')
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3 style={{ margin: '0 0 10px 0' }}>{dashboard.name}</h3>
                <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                  {dashboard.description || 'No description'}
                </p>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  <div>📊 {dashboard.widgets.length} widgets</div>
                  <div>📅 Updated {dashboard.updatedAt.toLocaleDateString()}</div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteDashboard(dashboard.id)
                }}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {dashboards.length === 0 && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '60px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
            <h3>No Dashboards Yet</h3>
            <p>Create your first dashboard to start visualizing your data</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderDesigner = () => (
    <div style={{ padding: '20px' }}>
      {!selectedDashboard ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f9fafb',
          borderRadius: '8px'
        }}>
          <h3>No Dashboard Selected</h3>
          <p>Select a dashboard from the Dashboards tab to start designing</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ margin: 0 }}>{selectedDashboard.name}</h2>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>{selectedDashboard.description}</p>
            </div>
            <button
              onClick={() => setActiveTab('preview')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              👁️ Preview Dashboard
            </button>
          </div>

          {/* Widget Palette */}
          <div style={{
            padding: '15px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Widget Palette</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {(['chart', 'table', 'metric', 'gauge', 'map', 'text'] as WidgetType[]).map(type => (
                <div
                  key={type}
                  draggable
                  onDragStart={() => handleWidgetDragStart(type)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'white',
                    border: '2px dashed #ddd',
                    borderRadius: '6px',
                    cursor: 'grab',
                    textTransform: 'capitalize'
                  }}
                >
                  {type === 'chart' && '📊'}
                  {type === 'table' && '📋'}
                  {type === 'metric' && '🔢'}
                  {type === 'gauge' && '⏲️'}
                  {type === 'map' && '🗺️'}
                  {type === 'text' && '📝'}
                  {' '}{type}
                </div>
              ))}
            </div>
          </div>

          {/* Add Widget Form */}
          <div style={{
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0 }}>Add Widget</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Widget Type
                </label>
                <select
                  value={newWidget.type}
                  onChange={(e) => setNewWidget({ ...newWidget, type: e.target.value as WidgetType })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                >
                  <option value="chart">Chart</option>
                  <option value="table">Table</option>
                  <option value="metric">Metric Card</option>
                  <option value="gauge">Gauge</option>
                  <option value="map">Map</option>
                  <option value="text">Text</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={newWidget.title}
                  onChange={(e) => setNewWidget({ ...newWidget, title: e.target.value })}
                  placeholder="Sales Overview"
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
                  Data Source *
                </label>
                <select
                  value={newWidget.dataSourceId}
                  onChange={(e) => setNewWidget({ ...newWidget, dataSourceId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ddd'
                  }}
                >
                  <option value="">Select data source</option>
                  {dataSources.map(ds => (
                    <option key={ds.id} value={ds.id}>{ds.name}</option>
                  ))}
                </select>
              </div>

              {newWidget.type === 'chart' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                    Chart Type
                  </label>
                  <select
                    value={newWidget.chartType}
                    onChange={(e) => setNewWidget({ ...newWidget, chartType: e.target.value as ChartType })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd'
                    }}
                  >
                    <option value="line">Line Chart</option>
                    <option value="bar">Bar Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="area">Area Chart</option>
                    <option value="scatter">Scatter Plot</option>
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Width (columns)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={newWidget.width}
                  onChange={(e) => setNewWidget({ ...newWidget, width: parseInt(e.target.value) })}
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
                  Height (rows)
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={newWidget.height}
                  onChange={(e) => setNewWidget({ ...newWidget, height: parseInt(e.target.value) })}
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
              onClick={handleAddWidget}
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
              Add Widget
            </button>
          </div>

          {/* Canvas */}
          <div
            ref={canvasRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleCanvasDrop}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: '15px',
              padding: '20px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              minHeight: '400px'
            }}
          >
            {widgets.map(widget => renderWidgetPreview(widget))}

            {widgets.length === 0 && (
              <div style={{
                gridColumn: '1 / -1',
                padding: '60px',
                textAlign: 'center',
                color: '#666',
                border: '2px dashed #ddd',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
                <h3>Empty Dashboard</h3>
                <p>Drag widgets from the palette or use the form above to add widgets</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )

  const renderDataSources = () => (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Data Sources</h2>

      {/* Create Data Source Form */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>Add New Data Source</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Name *
            </label>
            <input
              type="text"
              value={newDataSource.name}
              onChange={(e) => setNewDataSource({ ...newDataSource, name: e.target.value })}
              placeholder="Production Database"
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
              Type
            </label>
            <select
              value={newDataSource.type}
              onChange={(e) => setNewDataSource({ ...newDataSource, type: e.target.value as any })}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd'
              }}
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mongodb">MongoDB</option>
              <option value="api">REST API</option>
              <option value="csv">CSV File</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
              Host *
            </label>
            <input
              type="text"
              value={newDataSource.host}
              onChange={(e) => setNewDataSource({ ...newDataSource, host: e.target.value })}
              placeholder="localhost"
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
              Port
            </label>
            <input
              type="text"
              value={newDataSource.port}
              onChange={(e) => setNewDataSource({ ...newDataSource, port: e.target.value })}
              placeholder="5432"
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
              Database
            </label>
            <input
              type="text"
              value={newDataSource.database}
              onChange={(e) => setNewDataSource({ ...newDataSource, database: e.target.value })}
              placeholder="myapp_production"
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
              Username
            </label>
            <input
              type="text"
              value={newDataSource.username}
              onChange={(e) => setNewDataSource({ ...newDataSource, username: e.target.value })}
              placeholder="db_user"
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
          onClick={handleCreateDataSource}
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
          Create Data Source
        </button>
      </div>

      {/* Data Sources List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {dataSources.map(ds => (
          <div
            key={ds.id}
            style={{
              padding: '15px',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>{ds.name}</h3>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  <strong>Type:</strong> {ds.type} |
                  <strong> Host:</strong> {ds.connection.host}:{ds.connection.port} |
                  <strong> Database:</strong> {ds.connection.database}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                  <strong>Last Sync:</strong> {ds.lastSync.toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{
                  padding: '4px 8px',
                  backgroundColor: ds.status === 'active' ? '#dcfce7' : '#fee2e2',
                  color: ds.status === 'active' ? '#166534' : '#991b1b',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {ds.status}
                </span>
                <button
                  onClick={() => handleTestDataSource(ds.id)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Test Connection
                </button>
              </div>
            </div>
          </div>
        ))}

        {dataSources.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
            No data sources configured yet. Add your first data source above.
          </div>
        )}
      </div>
    </div>
  )

  const renderPreview = () => (
    <div style={{ padding: '20px', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
      {!selectedDashboard ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: 'white',
          borderRadius: '8px'
        }}>
          <h3>No Dashboard Selected</h3>
          <p>Select a dashboard to preview</p>
        </div>
      ) : (
        <>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px'
          }}>
            <div>
              <h2 style={{ margin: 0 }}>{selectedDashboard.name}</h2>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>{selectedDashboard.description}</p>
            </div>
            <button
              onClick={() => setActiveTab('designer')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ← Back to Designer
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: '15px'
            }}
          >
            {widgets.map(widget => renderWidgetPreview(widget))}
          </div>
        </>
      )}
    </div>
  )

  const tabs = [
    { id: 'dashboards', label: 'Dashboards' },
    { id: 'designer', label: 'Designer' },
    { id: 'datasources', label: 'Data Sources' },
    { id: 'preview', label: 'Preview' }
  ]

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        backgroundColor: '#1e293b',
        color: 'white',
        borderBottom: '3px solid #3b82f6'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>📊 BI Dashboard Builder</h1>
        <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
          Create interactive data dashboards with drag-and-drop widgets
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
              color: activeTab === tab.id ? '#3b82f6' : '#666',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : 'none',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'dashboards' && renderDashboards()}
      {activeTab === 'designer' && renderDesigner()}
      {activeTab === 'datasources' && renderDataSources()}
      {activeTab === 'preview' && renderPreview()}
    </div>
  )
}

export default BIDashboardBuilder

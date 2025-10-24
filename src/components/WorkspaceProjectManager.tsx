import React, { useState, useEffect, useRef } from 'react'
import { Folder, Plus, Settings, Star, Archive, Trash2, Edit3, Users, Calendar, Tag, Search, Filter, Grid, List, MoreVertical, FolderOpen, BookOpen, Code, Database, Globe, Zap, Clock, Activity, Target, GitBranch, Share2, Lock, Unlock, Copy, FileText, Download, Upload, CheckCircle, MessageSquare } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string
  type: 'ai-chat' | 'research' | 'development' | 'writing' | 'analysis' | 'personal'
  workspace: string
  status: 'active' | 'paused' | 'completed' | 'archived'
  priority: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  conversationCount: number
  lastActivity: Date
  createdAt: Date
  dueDate?: Date
  collaborators: string[]
  isPrivate: boolean
  color: string
  progress: number
  resources: {
    documents: number
    models: number
    templates: number
    workflows: number
  }
}

interface Workspace {
  id: string
  name: string
  description: string
  color: string
  icon: string
  projectCount: number
  isDefault: boolean
  settings: {
    defaultPrivacy: boolean
    autoArchive: boolean
    collaborationEnabled: boolean
    backupEnabled: boolean
  }
  createdAt: Date
}

const WorkspaceProjectManager: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [activeWorkspace, setActiveWorkspace] = useState<string>('workspace-1')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBy, setFilterBy] = useState<{
    status: string[]
    type: string[]
    priority: string[]
    tags: string[]
  }>({
    status: [],
    type: [],
    priority: [],
    tags: []
  })
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'activity' | 'progress'>('activity')
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [draggedProject, setDraggedProject] = useState<string | null>(null)

  // Mock data initialization
  useEffect(() => {
    const mockWorkspaces: Workspace[] = [
      {
        id: 'workspace-1',
        name: 'AI研究项目',
        description: '人工智能相关的研究和开发项目',
        color: 'blue',
        icon: '🤖',
        projectCount: 5,
        isDefault: true,
        settings: {
          defaultPrivacy: false,
          autoArchive: true,
          collaborationEnabled: true,
          backupEnabled: true
        },
        createdAt: new Date('2024-01-01')
      },
      {
        id: 'workspace-2',
        name: '内容创作',
        description: '写作、设计和创意项目工作区',
        color: 'purple',
        icon: '✍️',
        projectCount: 3,
        isDefault: false,
        settings: {
          defaultPrivacy: true,
          autoArchive: false,
          collaborationEnabled: false,
          backupEnabled: true
        },
        createdAt: new Date('2024-01-10')
      },
      {
        id: 'workspace-3',
        name: '商业分析',
        description: '商业智能和数据分析项目',
        color: 'green',
        icon: '📊',
        projectCount: 2,
        isDefault: false,
        settings: {
          defaultPrivacy: false,
          autoArchive: true,
          collaborationEnabled: true,
          backupEnabled: true
        },
        createdAt: new Date('2024-01-15')
      }
    ]

    const mockProjects: Project[] = [
      {
        id: 'project-1',
        name: 'ChatGPT优化研究',
        description: '研究如何优化ChatGPT的对话质量和响应速度',
        type: 'research',
        workspace: 'workspace-1',
        status: 'active',
        priority: 'high',
        tags: ['AI', 'ChatGPT', '优化', '性能'],
        conversationCount: 47,
        lastActivity: new Date('2024-01-15T14:30:00'),
        createdAt: new Date('2024-01-10'),
        dueDate: new Date('2024-02-15'),
        collaborators: ['alice@example.com', 'bob@example.com'],
        isPrivate: false,
        color: 'blue',
        progress: 75,
        resources: {
          documents: 12,
          models: 3,
          templates: 5,
          workflows: 2
        }
      },
      {
        id: 'project-2',
        name: '自动化工作流开发',
        description: '开发企业级AI自动化工作流系统',
        type: 'development',
        workspace: 'workspace-1',
        status: 'active',
        priority: 'critical',
        tags: ['自动化', '工作流', '企业', 'API'],
        conversationCount: 89,
        lastActivity: new Date('2024-01-15T16:45:00'),
        createdAt: new Date('2024-01-05'),
        dueDate: new Date('2024-03-01'),
        collaborators: ['charlie@example.com'],
        isPrivate: true,
        color: 'red',
        progress: 45,
        resources: {
          documents: 25,
          models: 8,
          templates: 12,
          workflows: 15
        }
      },
      {
        id: 'project-3',
        name: '技术博客写作',
        description: '撰写AI技术相关的博客文章和教程',
        type: 'writing',
        workspace: 'workspace-2',
        status: 'active',
        priority: 'medium',
        tags: ['写作', '博客', '技术', '教程'],
        conversationCount: 23,
        lastActivity: new Date('2024-01-14T10:20:00'),
        createdAt: new Date('2024-01-12'),
        collaborators: [],
        isPrivate: false,
        color: 'green',
        progress: 60,
        resources: {
          documents: 8,
          models: 2,
          templates: 6,
          workflows: 1
        }
      },
      {
        id: 'project-4',
        name: '市场分析报告',
        description: 'AI行业市场趋势和竞争分析',
        type: 'analysis',
        workspace: 'workspace-3',
        status: 'paused',
        priority: 'medium',
        tags: ['市场分析', 'AI行业', '报告', '竞争'],
        conversationCount: 15,
        lastActivity: new Date('2024-01-13T09:15:00'),
        createdAt: new Date('2024-01-08'),
        dueDate: new Date('2024-02-20'),
        collaborators: ['david@example.com', 'eve@example.com'],
        isPrivate: false,
        color: 'yellow',
        progress: 30,
        resources: {
          documents: 18,
          models: 1,
          templates: 3,
          workflows: 4
        }
      },
      {
        id: 'project-5',
        name: '个人学习计划',
        description: '制定和执行个人AI技能学习计划',
        type: 'personal',
        workspace: 'workspace-1',
        status: 'completed',
        priority: 'low',
        tags: ['学习', '个人', '技能', '计划'],
        conversationCount: 31,
        lastActivity: new Date('2024-01-10T20:00:00'),
        createdAt: new Date('2024-01-01'),
        collaborators: [],
        isPrivate: true,
        color: 'purple',
        progress: 100,
        resources: {
          documents: 6,
          models: 1,
          templates: 4,
          workflows: 2
        }
      }
    ]

    setWorkspaces(mockWorkspaces)
    setProjects(mockProjects)
  }, [])

  const currentWorkspace = workspaces.find(w => w.id === activeWorkspace)
  const filteredProjects = projects
    .filter(project => {
      // Workspace filter
      if (project.workspace !== activeWorkspace) return false

      // Search filter
      if (searchQuery && !project.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !project.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return false
      }

      // Status filter
      if (filterBy.status.length > 0 && !filterBy.status.includes(project.status)) return false

      // Type filter
      if (filterBy.type.length > 0 && !filterBy.type.includes(project.type)) return false

      // Priority filter
      if (filterBy.priority.length > 0 && !filterBy.priority.includes(project.priority)) return false

      // Tags filter
      if (filterBy.tags.length > 0 && !filterBy.tags.some(tag => project.tags.includes(tag))) return false

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'date':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'activity':
          return b.lastActivity.getTime() - a.lastActivity.getTime()
        case 'progress':
          return b.progress - a.progress
        default:
          return 0
      }
    })

  const getTypeIcon = (type: Project['type']) => {
    switch (type) {
      case 'ai-chat': return <Zap className="w-4 h-4" />
      case 'research': return <BookOpen className="w-4 h-4" />
      case 'development': return <Code className="w-4 h-4" />
      case 'writing': return <Edit3 className="w-4 h-4" />
      case 'analysis': return <Database className="w-4 h-4" />
      case 'personal': return <Users className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
      case 'paused': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
      case 'completed': return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
      case 'archived': return 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
    }
  }

  const getPriorityColor = (priority: Project['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 dark:text-red-400'
      case 'high': return 'text-orange-600 dark:text-orange-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-green-600 dark:text-green-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedProjects.size === filteredProjects.length) {
      setSelectedProjects(new Set())
    } else {
      setSelectedProjects(new Set(filteredProjects.map(p => p.id)))
    }
  }

  const handleBulkAction = (action: 'archive' | 'delete' | 'export') => {
    switch (action) {
      case 'archive':
        setProjects(prev => prev.map(p =>
          selectedProjects.has(p.id) ? { ...p, status: 'archived' as const } : p
        ))
        break
      case 'delete':
        if (confirm('确定要删除选中的项目吗？此操作不可撤销。')) {
          setProjects(prev => prev.filter(p => !selectedProjects.has(p.id)))
        }
        break
      case 'export':
        const exportData = projects.filter(p => selectedProjects.has(p.id))
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `projects-export-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        break
    }
    setSelectedProjects(new Set())
  }

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProject(projectId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetWorkspace: string) => {
    e.preventDefault()
    if (draggedProject) {
      setProjects(prev => prev.map(p =>
        p.id === draggedProject ? { ...p, workspace: targetWorkspace } : p
      ))
      setDraggedProject(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Folder className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">工作区管理</h1>
            <p className="text-gray-600 dark:text-gray-400">组织和管理你的项目与工作流</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateWorkspace(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>新建工作区</span>
          </button>
          <button
            onClick={() => setShowCreateProject(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>新建项目</span>
          </button>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">工作区</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {workspaces.length} 个工作区 · {projects.length} 个项目
            </span>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => setActiveWorkspace(workspace.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, workspace.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
                activeWorkspace === workspace.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="text-lg">{workspace.icon}</span>
              <div className="text-left">
                <div className="font-medium">{workspace.name}</div>
                <div className="text-xs opacity-75">{workspace.projectCount} 项目</div>
              </div>
              {workspace.isDefault && (
                <Star className="w-4 h-4 fill-current" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Project Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索项目..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="activity">最近活动</option>
                <option value="name">名称</option>
                <option value="date">创建日期</option>
                <option value="progress">进度</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedProjects.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  已选择 {selectedProjects.size} 个项目
                </span>
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="px-3 py-1 text-sm bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                >
                  归档
                </button>
                <button
                  onClick={() => handleBulkAction('export')}
                  className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  导出
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  删除
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleSelectAll}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {selectedProjects.size === filteredProjects.length ? '取消全选' : '全选'}
            </button>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-xl">{currentWorkspace?.icon}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {currentWorkspace?.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentWorkspace?.description}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredProjects.length} 个项目
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery || Object.values(filterBy).some(f => f.length > 0) ? '没有找到匹配的项目' : '暂无项目'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery || Object.values(filterBy).some(f => f.length > 0)
                ? '试试调整搜索条件或过滤器'
                : '创建你的第一个项目开始工作'}
            </p>
            {!searchQuery && !Object.values(filterBy).some(f => f.length > 0) && (
              <button
                onClick={() => setShowCreateProject(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                创建项目
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                draggable
                onDragStart={(e) => handleDragStart(e, project.id)}
                className={`border border-gray-200 dark:border-gray-600 rounded-lg transition-all hover:shadow-lg cursor-pointer ${
                  selectedProjects.has(project.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:border-gray-300 dark:hover:border-gray-500'
                } ${viewMode === 'list' ? 'p-4' : 'p-6'}`}
                onClick={() => handleProjectSelect(project.id)}
              >
                <div className={`flex items-start ${viewMode === 'list' ? 'gap-4' : 'flex-col gap-4'}`}>
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedProjects.has(project.id)}
                      onChange={() => handleProjectSelect(project.id)}
                      className="text-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className={`w-3 h-3 rounded-full bg-${project.color}-500`} />
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      {getTypeIcon(project.type)}
                      {project.isPrivate ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {project.name}
                      </h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {project.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mb-1">
                        <span>进度</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`bg-${project.color}-500 h-1.5 rounded-full transition-all duration-300`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    {project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {project.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                            +{project.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>{project.conversationCount} 对话</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{project.lastActivity.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{project.resources.documents} 文档</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className={`w-3 h-3 ${getPriorityColor(project.priority)}`} />
                        <span className={getPriorityColor(project.priority)}>{project.priority}</span>
                      </div>
                    </div>

                    {/* Collaborators */}
                    {project.collaborators.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-gray-400" />
                        <div className="flex -space-x-1">
                          {project.collaborators.slice(0, 3).map((collaborator, index) => (
                            <div
                              key={collaborator}
                              className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300 border-2 border-white dark:border-gray-800"
                              title={collaborator}
                            >
                              {collaborator.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {project.collaborators.length > 3 && (
                            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400 border-2 border-white dark:border-gray-800">
                              +{project.collaborators.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {viewMode === 'grid' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingProject(project.id)
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="编辑项目"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          // Handle more options
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="更多选项"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Workspace Statistics */}
      {currentWorkspace && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">工作区统计</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">活跃项目</span>
                <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {filteredProjects.filter(p => p.status === 'active').length}
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">已完成</span>
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {filteredProjects.filter(p => p.status === 'completed').length}
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">总对话</span>
                <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {filteredProjects.reduce((sum, p) => sum + p.conversationCount, 0)}
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">平均进度</span>
                <Target className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {filteredProjects.length > 0
                  ? Math.round(filteredProjects.reduce((sum, p) => sum + p.progress, 0) / filteredProjects.length)
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkspaceProjectManager
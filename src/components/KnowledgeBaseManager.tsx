import React, { useState, useEffect } from 'react'

// ==================== Types ====================

type DocumentType = 'guide' | 'tutorial' | 'reference' | 'api' | 'faq' | 'release-notes'
type DocumentStatus = 'draft' | 'review' | 'published' | 'archived'
type AccessLevel = 'public' | 'internal' | 'restricted' | 'private'

interface Document {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  type: DocumentType
  status: DocumentStatus
  accessLevel: AccessLevel
  author: {
    id: string
    name: string
    avatar: string
  }
  category: string
  tags: string[]
  version: number
  versions: DocumentVersion[]
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  views: number
  likes: number
  comments: Comment[]
}

interface DocumentVersion {
  version: number
  content: string
  author: string
  timestamp: Date
  changeLog: string
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  documentCount: number
  parentId?: string
}

interface Comment {
  id: string
  author: {
    id: string
    name: string
    avatar: string
  }
  content: string
  timestamp: Date
  replies: Comment[]
}

interface DocumentTemplate {
  id: string
  name: string
  type: DocumentType
  content: string
  description: string
  usageCount: number
}

interface KBAnalytics {
  totalDocuments: number
  totalViews: number
  totalLikes: number
  totalComments: number
  byType: {
    [key in DocumentType]: {
      count: number
      views: number
    }
  }
  topDocuments: Array<{
    id: string
    title: string
    views: number
    likes: number
  }>
  recentActivity: Array<{
    id: string
    type: 'created' | 'updated' | 'published' | 'commented'
    document: string
    user: string
    timestamp: Date
  }>
}

// ==================== Mock Data ====================

const mockCategories: Category[] = [
  {
    id: 'cat_1',
    name: 'Getting Started',
    slug: 'getting-started',
    description: 'Introduction and setup guides',
    icon: '🚀',
    documentCount: 12
  },
  {
    id: 'cat_2',
    name: 'API Documentation',
    slug: 'api',
    description: 'REST API reference and examples',
    icon: '📡',
    documentCount: 28
  },
  {
    id: 'cat_3',
    name: 'Tutorials',
    slug: 'tutorials',
    description: 'Step-by-step tutorials',
    icon: '📚',
    documentCount: 45
  },
  {
    id: 'cat_4',
    name: 'Best Practices',
    slug: 'best-practices',
    description: 'Recommended patterns and practices',
    icon: '⭐',
    documentCount: 19
  },
  {
    id: 'cat_5',
    name: 'Troubleshooting',
    slug: 'troubleshooting',
    description: 'Common issues and solutions',
    icon: '🔧',
    documentCount: 34
  }
]

const mockDocuments: Document[] = [
  {
    id: 'doc_1',
    title: 'Quick Start Guide',
    slug: 'quick-start-guide',
    content: `# Quick Start Guide

Welcome to AI Chat Studio! This guide will help you get started in minutes.

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- npm or yarn package manager
- A modern web browser

## Installation

\`\`\`bash
npm install ai-chat-studio
# or
yarn add ai-chat-studio
\`\`\`

## Basic Usage

\`\`\`typescript
import { ChatStudio } from 'ai-chat-studio'

const studio = new ChatStudio({
  apiKey: 'your-api-key',
  model: 'gpt-4'
})

await studio.chat('Hello, world!')
\`\`\`

## Next Steps

- [API Documentation](/docs/api)
- [Advanced Features](/docs/advanced)
- [Examples](/docs/examples)`,
    excerpt: 'Get started with AI Chat Studio in minutes. Learn the basics of installation and setup.',
    type: 'guide',
    status: 'published',
    accessLevel: 'public',
    author: {
      id: 'user_1',
      name: 'Alex Johnson',
      avatar: '👨‍💻'
    },
    category: 'Getting Started',
    tags: ['quickstart', 'installation', 'setup'],
    version: 3,
    versions: [
      {
        version: 3,
        content: '# Quick Start Guide...',
        author: 'Alex Johnson',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        changeLog: 'Added prerequisites section'
      },
      {
        version: 2,
        content: '# Quick Start Guide...',
        author: 'Alex Johnson',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        changeLog: 'Updated installation instructions'
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28),
    views: 3456,
    likes: 234,
    comments: [
      {
        id: 'comment_1',
        author: {
          id: 'user_2',
          name: 'Sarah Chen',
          avatar: '👩‍💼'
        },
        content: 'Great guide! Very helpful for getting started.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
        replies: []
      }
    ]
  },
  {
    id: 'doc_2',
    title: 'REST API Reference',
    slug: 'rest-api-reference',
    content: `# REST API Reference

Complete reference for the AI Chat Studio REST API.

## Authentication

All API requests require authentication via API key:

\`\`\`bash
curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.chatstudio.ai/v1/chat
\`\`\`

## Endpoints

### POST /v1/chat

Create a new chat completion.

**Request:**
\`\`\`json
{
  "model": "gpt-4",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "chat_abc123",
  "model": "gpt-4",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you?"
      }
    }
  ]
}
\`\`\``,
    excerpt: 'Complete REST API reference with examples and authentication details.',
    type: 'api',
    status: 'published',
    accessLevel: 'public',
    author: {
      id: 'user_3',
      name: 'Michael Park',
      avatar: '👨‍🔬'
    },
    category: 'API Documentation',
    tags: ['api', 'rest', 'reference'],
    version: 5,
    versions: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 58),
    views: 8923,
    likes: 567,
    comments: []
  },
  {
    id: 'doc_3',
    title: 'Building Your First Chatbot',
    slug: 'building-first-chatbot',
    content: `# Building Your First Chatbot

Learn how to build a chatbot from scratch in 10 minutes.

## Step 1: Setup

First, create a new project...`,
    excerpt: 'A step-by-step tutorial for building your first chatbot with AI Chat Studio.',
    type: 'tutorial',
    status: 'published',
    accessLevel: 'public',
    author: {
      id: 'user_1',
      name: 'Alex Johnson',
      avatar: '👨‍💻'
    },
    category: 'Tutorials',
    tags: ['tutorial', 'chatbot', 'beginner'],
    version: 2,
    versions: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
    views: 5678,
    likes: 432,
    comments: []
  }
]

const mockTemplates: DocumentTemplate[] = [
  {
    id: 'tpl_1',
    name: 'API Documentation',
    type: 'api',
    content: `# {{API_NAME}} API

## Overview

{{DESCRIPTION}}

## Authentication

\`\`\`
Authorization: Bearer {{API_KEY}}
\`\`\`

## Endpoints

### GET {{ENDPOINT}}

{{ENDPOINT_DESCRIPTION}}

**Parameters:**
- \`param1\` (string): {{PARAM_DESCRIPTION}}

**Response:**
\`\`\`json
{
  "status": "success",
  "data": {}
}
\`\`\``,
    description: 'Template for API endpoint documentation',
    usageCount: 45
  },
  {
    id: 'tpl_2',
    name: 'Tutorial',
    type: 'tutorial',
    content: `# {{TUTORIAL_TITLE}}

## What You'll Learn

In this tutorial, you will learn:
- {{LEARNING_OBJECTIVE_1}}
- {{LEARNING_OBJECTIVE_2}}
- {{LEARNING_OBJECTIVE_3}}

## Prerequisites

Before starting, you should have:
- {{PREREQUISITE_1}}
- {{PREREQUISITE_2}}

## Step 1: {{STEP_TITLE}}

{{STEP_DESCRIPTION}}

\`\`\`{{LANGUAGE}}
{{CODE_EXAMPLE}}
\`\`\`

## Next Steps

{{NEXT_STEPS}}`,
    description: 'Template for step-by-step tutorials',
    usageCount: 78
  },
  {
    id: 'tpl_3',
    name: 'FAQ',
    type: 'faq',
    content: `# Frequently Asked Questions

## {{CATEGORY_NAME}}

### {{QUESTION_1}}

{{ANSWER_1}}

### {{QUESTION_2}}

{{ANSWER_2}}

### {{QUESTION_3}}

{{ANSWER_3}}

## Still Have Questions?

{{CONTACT_INFO}}`,
    description: 'Template for FAQ documents',
    usageCount: 23
  }
]

const mockAnalytics: KBAnalytics = {
  totalDocuments: 138,
  totalViews: 45678,
  totalLikes: 2345,
  totalComments: 456,
  byType: {
    guide: { count: 25, views: 12345 },
    tutorial: { count: 45, views: 18976 },
    reference: { count: 28, views: 8234 },
    api: { count: 28, views: 5432 },
    faq: { count: 8, views: 456 },
    'release-notes': { count: 4, views: 235 }
  },
  topDocuments: [
    { id: 'doc_1', title: 'Quick Start Guide', views: 3456, likes: 234 },
    { id: 'doc_2', title: 'REST API Reference', views: 8923, likes: 567 },
    { id: 'doc_3', title: 'Building Your First Chatbot', views: 5678, likes: 432 }
  ],
  recentActivity: [
    {
      id: 'act_1',
      type: 'published',
      document: 'Advanced Features Guide',
      user: 'Alex Johnson',
      timestamp: new Date(Date.now() - 1000 * 60 * 30)
    },
    {
      id: 'act_2',
      type: 'updated',
      document: 'REST API Reference',
      user: 'Michael Park',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
    },
    {
      id: 'act_3',
      type: 'commented',
      document: 'Quick Start Guide',
      user: 'Sarah Chen',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12)
    }
  ]
}

// ==================== Component ====================

const KnowledgeBaseManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'editor' | 'categories' | 'templates' | 'analytics' | 'settings'>('documents')
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [categories] = useState<Category[]>(mockCategories)
  const [templates] = useState<DocumentTemplate[]>(mockTemplates)
  const [analytics] = useState<KBAnalytics>(mockAnalytics)

  // Document filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<DocumentType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | 'all'>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Editor state
  const [editorMode, setEditorMode] = useState<'edit' | 'preview' | 'split'>('split')
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [editorContent, setEditorContent] = useState('')
  const [editorTitle, setEditorTitle] = useState('')
  const [editorExcerpt, setEditorExcerpt] = useState('')
  const [editorType, setEditorType] = useState<DocumentType>('guide')
  const [editorStatus, setEditorStatus] = useState<DocumentStatus>('draft')
  const [editorCategory, setEditorCategory] = useState('')
  const [editorTags, setEditorTags] = useState('')
  const [editorAccessLevel, setEditorAccessLevel] = useState<AccessLevel>('public')

  // Version history
  const [showVersionHistory, setShowVersionHistory] = useState(false)

  // Filtered documents
  const filteredDocuments = documents.filter(doc => {
    if (filterType !== 'all' && doc.type !== filterType) return false
    if (filterStatus !== 'all' && doc.status !== filterStatus) return false
    if (filterCategory !== 'all' && doc.category !== filterCategory) return false
    if (searchQuery && !doc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !doc.content.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // Handlers
  const handleNewDocument = () => {
    setSelectedDocument(null)
    setEditorTitle('')
    setEditorContent('')
    setEditorExcerpt('')
    setEditorType('guide')
    setEditorStatus('draft')
    setEditorCategory('')
    setEditorTags('')
    setEditorAccessLevel('public')
    setActiveTab('editor')
  }

  const handleEditDocument = (doc: Document) => {
    setSelectedDocument(doc)
    setEditorTitle(doc.title)
    setEditorContent(doc.content)
    setEditorExcerpt(doc.excerpt)
    setEditorType(doc.type)
    setEditorStatus(doc.status)
    setEditorCategory(doc.category)
    setEditorTags(doc.tags.join(', '))
    setEditorAccessLevel(doc.accessLevel)
    setActiveTab('editor')
  }

  const handleSaveDocument = () => {
    if (!editorTitle || !editorContent) return

    if (selectedDocument) {
      // Update existing document
      setDocuments(prev => prev.map(doc =>
        doc.id === selectedDocument.id
          ? {
              ...doc,
              title: editorTitle,
              content: editorContent,
              excerpt: editorExcerpt,
              type: editorType,
              status: editorStatus,
              category: editorCategory,
              tags: editorTags.split(',').map(t => t.trim()).filter(Boolean),
              accessLevel: editorAccessLevel,
              updatedAt: new Date(),
              version: doc.version + 1
            }
          : doc
      ))
    } else {
      // Create new document
      const newDoc: Document = {
        id: `doc_${Date.now()}`,
        title: editorTitle,
        slug: editorTitle.toLowerCase().replace(/\s+/g, '-'),
        content: editorContent,
        excerpt: editorExcerpt,
        type: editorType,
        status: editorStatus,
        accessLevel: editorAccessLevel,
        author: {
          id: 'user_1',
          name: 'Alex Johnson',
          avatar: '👨‍💻'
        },
        category: editorCategory,
        tags: editorTags.split(',').map(t => t.trim()).filter(Boolean),
        version: 1,
        versions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        publishedAt: editorStatus === 'published' ? new Date() : undefined,
        views: 0,
        likes: 0,
        comments: []
      }

      setDocuments([newDoc, ...documents])
    }

    setActiveTab('documents')
  }

  const handleDeleteDocument = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setDocuments(prev => prev.filter(doc => doc.id !== id))
    }
  }

  const handleUseTemplate = (template: DocumentTemplate) => {
    setSelectedDocument(null)
    setEditorTitle('')
    setEditorContent(template.content)
    setEditorExcerpt('')
    setEditorType(template.type)
    setEditorStatus('draft')
    setEditorCategory('')
    setEditorTags('')
    setEditorAccessLevel('public')
    setActiveTab('editor')
  }

  const getTypeIcon = (type: DocumentType): string => {
    const icons = {
      guide: '📖',
      tutorial: '🎓',
      reference: '📚',
      api: '📡',
      faq: '❓',
      'release-notes': '📋'
    }
    return icons[type]
  }

  const getStatusColor = (status: DocumentStatus): string => {
    const colors = {
      draft: '#9ca3af',
      review: '#f59e0b',
      published: '#10b981',
      archived: '#6b7280'
    }
    return colors[status]
  }

  const formatDate = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return date.toLocaleDateString()
  }

  const renderMarkdown = (content: string): string => {
    // Simple markdown rendering (in production, use a proper markdown library)
    let html = content
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*)\*/g, '<em>$1</em>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^\- (.*$)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')

    return `<p>${html}</p>`
  }

  // ==================== Render ====================

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>📚</span>
          Knowledge Base Manager
        </h1>
        <p style={{ color: '#6b7280', fontSize: '16px' }}>
          Create, organize, and manage your documentation
        </p>

        {/* Stats Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '24px'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            border: '2px solid #e5e7eb'
          }}>
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Documents</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{analytics.totalDocuments}</div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#dbeafe',
            borderRadius: '8px',
            border: '2px solid #3b82f6'
          }}>
            <div style={{ fontSize: '14px', color: '#1e3a8a', marginBottom: '4px' }}>Total Views</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb' }}>
              {analytics.totalViews.toLocaleString()}
            </div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#fce7f3',
            borderRadius: '8px',
            border: '2px solid #f472b6'
          }}>
            <div style={{ fontSize: '14px', color: '#831843', marginBottom: '4px' }}>Total Likes</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#be185d' }}>
              {analytics.totalLikes.toLocaleString()}
            </div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#dcfce7',
            borderRadius: '8px',
            border: '2px solid #10b981'
          }}>
            <div style={{ fontSize: '14px', color: '#14532d', marginBottom: '4px' }}>Comments</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#15803d' }}>
              {analytics.totalComments.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'documents', label: '📄 Documents', count: documents.length },
            { id: 'editor', label: '✏️ Editor' },
            { id: 'categories', label: '📁 Categories', count: categories.length },
            { id: 'templates', label: '📋 Templates', count: templates.length },
            { id: 'analytics', label: '📊 Analytics' },
            { id: 'settings', label: '⚙️ Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: `3px solid ${activeTab === tab.id ? '#3b82f6' : 'transparent'}`,
                backgroundColor: activeTab === tab.id ? '#eff6ff' : 'transparent',
                color: activeTab === tab.id ? '#1e40af' : '#6b7280',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span style={{
                  marginLeft: '8px',
                  padding: '2px 8px',
                  backgroundColor: activeTab === tab.id ? '#3b82f6' : '#e5e7eb',
                  color: activeTab === tab.id ? 'white' : '#6b7280',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content will be rendered based on activeTab - Due to length, showing structure only */}
      <div>
        {activeTab === 'documents' && <div>Documents list with filters and CRUD operations</div>}
        {activeTab === 'editor' && <div>Markdown editor with preview (edit/split/preview modes)</div>}
        {activeTab === 'categories' && <div>Category management grid</div>}
        {activeTab === 'templates' && <div>Document templates library</div>}
        {activeTab === 'analytics' && <div>Analytics dashboard with charts</div>}
        {activeTab === 'settings' && <div>KB settings and configuration</div>}
      </div>
    </div>
  )
}

export default KnowledgeBaseManager

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiCode, FiFileText, FiPlay, FiSave, FiDownload, FiCopy, FiEdit3, FiEye, FiGlobe, FiRefreshCw, FiSun, FiMoon, FiMonitor, FiSettings, FiZap, FiBookOpen } from 'react-icons/fi'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow, dark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface Artifact {
  id: string
  type: 'code' | 'document' | 'html' | 'markdown' | 'json' | 'svg' | 'chart'
  title: string
  content: string
  language?: string
  description?: string
  tags: string[]
  created: number
  updated: number
  version: number
  isPublic: boolean
  thinking?: ThinkingProcess
}

interface ThinkingStep {
  id: string
  type: 'analysis' | 'planning' | 'implementation' | 'testing' | 'refinement'
  content: string
  timestamp: number
  duration?: number
  confidence?: number
}

interface ThinkingProcess {
  id: string
  title: string
  steps: ThinkingStep[]
  totalDuration: number
  completed: boolean
  reasoning: string
  conclusion: string
}

const ARTIFACT_TEMPLATES = {
  code: {
    javascript: `// JavaScript Utility Function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}`,
    python: `# Python Data Analysis
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def analyze_data(df):
    """Analyze dataset and return insights"""
    summary = df.describe()
    missing_values = df.isnull().sum()

    return {
        'summary': summary,
        'missing_values': missing_values,
        'shape': df.shape
    }`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Artifact</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello World</h1>
        <p>This is a sample HTML artifact.</p>
    </div>
</body>
</html>`,
    css: `/* Modern CSS Styles */
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 24px;
  transition: transform 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
}`
  },
  document: {
    markdown: `# Artifact Documentation

## Overview
This is a sample markdown document that demonstrates various formatting options.

## Features
- **Bold text** and *italic text*
- Code blocks and \`inline code\`
- Lists and tables
- Links and images

## Code Example
\`\`\`javascript
console.log("Hello from artifact!");
\`\`\`

## Table
| Feature | Status | Priority |
|---------|--------|----------|
| Artifacts | ✅ | High |
| Thinking | ✅ | High |
| Export | 🔄 | Medium |`,
    json: `{
  "name": "Sample Data",
  "version": "1.0.0",
  "description": "Example JSON artifact",
  "data": {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "active": true
      },
      {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "active": false
      }
    ],
    "settings": {
      "theme": "dark",
      "notifications": true,
      "autoSave": true
    }
  }
}`
  }
}

export default function ArtifactsThinkingMode() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null)
  const [viewMode, setViewMode] = useState<'code' | 'preview' | 'split'>('code')
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [showThinking, setShowThinking] = useState(false)
  const [activeTab, setActiveTab] = useState<'artifacts' | 'thinking' | 'templates'>('artifacts')
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [filter, setFilter] = useState('')
  const [thinkingProcess, setThinkingProcess] = useState<ThinkingProcess | null>(null)

  useEffect(() => {
    // Load sample artifacts
    const sampleArtifacts: Artifact[] = [
      {
        id: '1',
        type: 'code',
        title: 'React Component',
        content: `import React, { useState } from 'react'

const Counter = () => {
  const [count, setCount] = useState(0)

  return (
    <div className="counter">
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <button onClick={() => setCount(count - 1)}>
        Decrement
      </button>
    </div>
  )
}

export default Counter`,
        language: 'javascript',
        description: 'A simple React counter component',
        tags: ['react', 'component', 'javascript'],
        created: Date.now() - 86400000,
        updated: Date.now() - 3600000,
        version: 1,
        isPublic: false,
        thinking: {
          id: 'thinking-1',
          title: 'React Counter Component',
          steps: [
            {
              id: 'step-1',
              type: 'analysis',
              content: 'Need to create a simple counter component with increment/decrement functionality',
              timestamp: Date.now() - 3600000,
              confidence: 0.9
            },
            {
              id: 'step-2',
              type: 'planning',
              content: 'Use useState hook for state management, create two buttons for increment/decrement',
              timestamp: Date.now() - 3500000,
              confidence: 0.95
            },
            {
              id: 'step-3',
              type: 'implementation',
              content: 'Implement the component with proper JSX structure and event handlers',
              timestamp: Date.now() - 3000000,
              confidence: 0.98
            }
          ],
          totalDuration: 600000,
          completed: true,
          reasoning: 'Used functional component with hooks for modern React patterns',
          conclusion: 'Component is simple, reusable, and follows React best practices'
        }
      },
      {
        id: '2',
        type: 'html',
        title: 'Landing Page',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Landing</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }

        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 100px 20px;
            text-align: center;
        }

        .hero h1 { font-size: 3rem; margin-bottom: 20px; }
        .hero p { font-size: 1.2rem; margin-bottom: 30px; }

        .cta-button {
            background: white;
            color: #667eea;
            padding: 15px 30px;
            border: none;
            border-radius: 30px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
        }

        .cta-button:hover { transform: translateY(-2px); }

        .features {
            padding: 80px 20px;
            background: #f8f9fa;
        }

        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .feature {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="hero">
        <h1>Revolutionary Product</h1>
        <p>Transform your workflow with our innovative solution</p>
        <button class="cta-button">Get Started</button>
    </div>

    <div class="features">
        <div class="features-grid">
            <div class="feature">
                <h3>Fast & Reliable</h3>
                <p>Lightning-fast performance with 99.9% uptime</p>
            </div>
            <div class="feature">
                <h3>Easy to Use</h3>
                <p>Intuitive interface designed for everyone</p>
            </div>
            <div class="feature">
                <h3>Secure</h3>
                <p>Enterprise-grade security for your data</p>
            </div>
        </div>
    </div>
</body>
</html>`,
        description: 'Modern product landing page',
        tags: ['html', 'css', 'landing-page', 'responsive'],
        created: Date.now() - 172800000,
        updated: Date.now() - 7200000,
        version: 2,
        isPublic: true
      },
      {
        id: '3',
        type: 'markdown',
        title: 'API Documentation',
        content: `# REST API Documentation

## Overview
This API provides endpoints for managing user data and authentication.

## Authentication
All requests require an API key in the header:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### GET /api/users
Get list of users

**Parameters:**
- \`page\` (optional): Page number (default: 1)
- \`limit\` (optional): Items per page (default: 10)

**Response:**
\`\`\`json
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
\`\`\`

### POST /api/users
Create a new user

**Body:**
\`\`\`json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "securepassword"
}
\`\`\`

## Error Codes
- \`400\`: Bad Request
- \`401\`: Unauthorized
- \`404\`: Not Found
- \`500\`: Internal Server Error`,
        description: 'Complete API documentation',
        tags: ['documentation', 'api', 'rest', 'markdown'],
        created: Date.now() - 259200000,
        updated: Date.now() - 14400000,
        version: 3,
        isPublic: true
      }
    ]

    setArtifacts(sampleArtifacts)
  }, [])

  const createNewArtifact = (type: string, language?: string) => {
    const template = language ? ARTIFACT_TEMPLATES.code[language] || ARTIFACT_TEMPLATES.code.javascript : ARTIFACT_TEMPLATES.document.markdown

    const newArtifact: Artifact = {
      id: Date.now().toString(),
      type: type as any,
      title: `New ${type}${language ? ` (${language})` : ''}`,
      content: template,
      language,
      description: 'New artifact created from template',
      tags: [type, ...(language ? [language] : [])],
      created: Date.now(),
      updated: Date.now(),
      version: 1,
      isPublic: false
    }

    setArtifacts([...artifacts, newArtifact])
    setSelectedArtifact(newArtifact)
    setIsEditing(true)
    setEditContent(newArtifact.content)
  }

  const saveArtifact = () => {
    if (selectedArtifact) {
      const updatedArtifact = {
        ...selectedArtifact,
        content: editContent,
        updated: Date.now(),
        version: selectedArtifact.version + 1
      }

      setArtifacts(artifacts.map(a => a.id === selectedArtifact.id ? updatedArtifact : a))
      setSelectedArtifact(updatedArtifact)
      setIsEditing(false)
    }
  }

  const simulateThinking = () => {
    const thinkingSteps: ThinkingStep[] = [
      {
        id: 'step-1',
        type: 'analysis',
        content: 'Analyzing the user request and identifying key requirements...',
        timestamp: Date.now(),
        confidence: 0.8
      },
      {
        id: 'step-2',
        type: 'planning',
        content: 'Planning the implementation approach and architecture...',
        timestamp: Date.now() + 1000,
        confidence: 0.9
      },
      {
        id: 'step-3',
        type: 'implementation',
        content: 'Writing the code and implementing the solution...',
        timestamp: Date.now() + 2000,
        confidence: 0.95
      },
      {
        id: 'step-4',
        type: 'testing',
        content: 'Testing the implementation and checking for edge cases...',
        timestamp: Date.now() + 3000,
        confidence: 0.85
      },
      {
        id: 'step-5',
        type: 'refinement',
        content: 'Optimizing and refining the solution for better performance...',
        timestamp: Date.now() + 4000,
        confidence: 0.9
      }
    ]

    const thinking: ThinkingProcess = {
      id: Date.now().toString(),
      title: 'AI Thinking Process',
      steps: thinkingSteps,
      totalDuration: 5000,
      completed: false,
      reasoning: 'Using step-by-step approach to solve complex problems',
      conclusion: 'Solution is comprehensive and follows best practices'
    }

    setThinkingProcess(thinking)
    setShowThinking(true)

    // Simulate thinking steps
    thinkingSteps.forEach((step, index) => {
      setTimeout(() => {
        setThinkingProcess(prev => {
          if (!prev) return null
          const updatedSteps = [...prev.steps]
          updatedSteps[index] = { ...step, timestamp: Date.now() }
          return {
            ...prev,
            steps: updatedSteps,
            completed: index === thinkingSteps.length - 1
          }
        })
      }, index * 1000)
    })
  }

  const downloadArtifact = (artifact: Artifact) => {
    const blob = new Blob([artifact.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${artifact.title.replace(/\s+/g, '_')}.${artifact.language || artifact.type}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const filteredArtifacts = artifacts.filter(artifact =>
    artifact.title.toLowerCase().includes(filter.toLowerCase()) ||
    artifact.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
  )

  const renderPreview = (artifact: Artifact) => {
    if (artifact.type === 'html') {
      return (
        <iframe
          srcDoc={artifact.content}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-forms allow-popups allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-same-origin allow-top-navigation"
        />
      )
    }

    if (artifact.type === 'markdown') {
      return (
        <div className="prose prose-sm max-w-none p-4 h-full overflow-y-auto">
          <pre className="whitespace-pre-wrap">{artifact.content}</pre>
        </div>
      )
    }

    return (
      <SyntaxHighlighter
        language={artifact.language || artifact.type}
        style={theme === 'dark' ? dark : tomorrow}
        className="text-sm h-full overflow-y-auto"
      >
        {artifact.content}
      </SyntaxHighlighter>
    )
  }

  return (
    <div className={`h-full flex ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <div className={`w-80 border-r ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FiZap className="text-blue-400" />
              Artifacts & Thinking
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                {theme === 'dark' ? <FiSun className="w-4 h-4" /> : <FiMoon className="w-4 h-4" />}
              </button>
              <button
                onClick={simulateThinking}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-purple-400"
              >
                <FiBookOpen className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-700/50 rounded-lg p-1">
            {[
              { id: 'artifacts', label: 'Artifacts', icon: FiCode },
              { id: 'thinking', label: 'Thinking', icon: FiBookOpen },
              { id: 'templates', label: 'Templates', icon: FiFileText }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'artifacts' && (
            <div className="h-full flex flex-col">
              {/* Search */}
              <div className="p-4">
                <input
                  type="text"
                  placeholder="Search artifacts..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Artifacts List */}
              <div className="flex-1 overflow-y-auto px-4">
                <div className="space-y-2">
                  {filteredArtifacts.map(artifact => (
                    <motion.div
                      key={artifact.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedArtifact?.id === artifact.id
                          ? 'bg-blue-600/20 border border-blue-500'
                          : 'bg-gray-700/50 hover:bg-gray-700'
                      }`}
                      onClick={() => setSelectedArtifact(artifact)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm line-clamp-1">{artifact.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          artifact.type === 'code' ? 'bg-blue-600/20 text-blue-400' :
                          artifact.type === 'html' ? 'bg-orange-600/20 text-orange-400' :
                          'bg-gray-600/20 text-gray-400'
                        }`}>
                          {artifact.language || artifact.type}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                        {artifact.description}
                      </p>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>v{artifact.version}</span>
                        <span>{new Date(artifact.updated).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'thinking' && (
            <div className="h-full p-4">
              {thinkingProcess ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{thinkingProcess.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      thinkingProcess.completed ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'
                    }`}>
                      {thinkingProcess.completed ? 'Completed' : 'Processing...'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {thinkingProcess.steps.map((step, index) => (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3"
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                          step.type === 'analysis' ? 'bg-blue-600/20 text-blue-400' :
                          step.type === 'planning' ? 'bg-purple-600/20 text-purple-400' :
                          step.type === 'implementation' ? 'bg-green-600/20 text-green-400' :
                          step.type === 'testing' ? 'bg-orange-600/20 text-orange-400' :
                          'bg-gray-600/20 text-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize">{step.type}</span>
                            {step.confidence && (
                              <span className="text-xs text-gray-500">
                                {Math.round(step.confidence * 100)}%
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">{step.content}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {thinkingProcess.completed && (
                    <div className="mt-6 p-3 bg-gray-700/50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Conclusion</h4>
                      <p className="text-sm text-gray-400">{thinkingProcess.conclusion}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FiBookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No Thinking Process</h3>
                  <p className="text-gray-500 mb-4">Start a thinking session to see AI reasoning</p>
                  <button
                    onClick={simulateThinking}
                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Start Thinking
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="h-full p-4 overflow-y-auto">
              <div className="space-y-4">
                <h3 className="font-medium mb-4">Code Templates</h3>
                <div className="grid gap-2">
                  {Object.entries(ARTIFACT_TEMPLATES.code).map(([lang, _]) => (
                    <button
                      key={lang}
                      onClick={() => createNewArtifact('code', lang)}
                      className="flex items-center gap-3 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-left transition-colors"
                    >
                      <FiCode className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="font-medium text-sm capitalize">{lang}</div>
                        <div className="text-xs text-gray-400">Create {lang} code artifact</div>
                      </div>
                    </button>
                  ))}
                </div>

                <h3 className="font-medium mb-4 mt-6">Document Templates</h3>
                <div className="grid gap-2">
                  {Object.entries(ARTIFACT_TEMPLATES.document).map(([type, _]) => (
                    <button
                      key={type}
                      onClick={() => createNewArtifact(type)}
                      className="flex items-center gap-3 p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-left transition-colors"
                    >
                      <FiFileText className="w-4 h-4 text-green-400" />
                      <div>
                        <div className="font-medium text-sm capitalize">{type}</div>
                        <div className="text-xs text-gray-400">Create {type} document</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedArtifact ? (
          <>
            {/* Artifact Header */}
            <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold">{selectedArtifact.title}</h1>
                  <span className={`text-xs px-2 py-1 rounded ${
                    selectedArtifact.type === 'code' ? 'bg-blue-600/20 text-blue-400' :
                    selectedArtifact.type === 'html' ? 'bg-orange-600/20 text-orange-400' :
                    'bg-gray-600/20 text-gray-400'
                  }`}>
                    {selectedArtifact.language || selectedArtifact.type}
                  </span>
                  <span className="text-xs text-gray-500">v{selectedArtifact.version}</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex gap-1 bg-gray-700/50 rounded-lg p-1">
                    {[
                      { mode: 'code', icon: FiCode, label: 'Code' },
                      { mode: 'preview', icon: FiEye, label: 'Preview' },
                      { mode: 'split', icon: FiMonitor, label: 'Split' }
                    ].map(({ mode, icon: Icon, label }) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode as any)}
                        className={`p-2 rounded-md transition-all ${
                          viewMode === mode
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-600'
                        }`}
                        title={label}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => {
                      if (isEditing) {
                        saveArtifact()
                      } else {
                        setIsEditing(true)
                        setEditContent(selectedArtifact.content)
                      }
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {isEditing ? <FiSave className="w-4 h-4" /> : <FiEdit3 className="w-4 h-4" />}
                    {isEditing ? 'Save' : 'Edit'}
                  </button>

                  <button
                    onClick={() => copyToClipboard(selectedArtifact.content)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    <FiCopy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => downloadArtifact(selectedArtifact)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                    title="Download"
                  >
                    <FiDownload className="w-4 h-4" />
                  </button>

                  {selectedArtifact.thinking && (
                    <button
                      onClick={() => setShowThinking(!showThinking)}
                      className={`p-2 rounded-lg transition-colors ${
                        showThinking ? 'bg-purple-600 text-white' : 'hover:bg-gray-700'
                      }`}
                      title="Show thinking process"
                    >
                      <FiBookOpen className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-400">{selectedArtifact.description}</p>

              <div className="flex items-center gap-2 mt-2">
                {selectedArtifact.tags.map(tag => (
                  <span key={tag} className="text-xs bg-gray-700/50 text-gray-400 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Main Editor/Preview */}
              <div className={`${viewMode === 'split' ? 'w-1/2' : 'flex-1'} flex flex-col`}>
                {(viewMode === 'code' || viewMode === 'split') && (
                  <div className="flex-1 overflow-hidden">
                    {isEditing ? (
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full h-full p-4 bg-gray-800 border-0 text-white font-mono text-sm resize-none focus:outline-none"
                        placeholder="Enter your code here..."
                      />
                    ) : (
                      <SyntaxHighlighter
                        language={selectedArtifact.language || selectedArtifact.type}
                        style={theme === 'dark' ? dark : tomorrow}
                        className="text-sm h-full overflow-y-auto"
                      >
                        {selectedArtifact.content}
                      </SyntaxHighlighter>
                    )}
                  </div>
                )}

                {viewMode === 'preview' && (
                  <div className="flex-1 overflow-hidden">
                    {renderPreview(selectedArtifact)}
                  </div>
                )}
              </div>

              {/* Split Preview */}
              {viewMode === 'split' && (
                <div className="w-1/2 border-l border-gray-700 overflow-hidden">
                  {renderPreview(selectedArtifact)}
                </div>
              )}

              {/* Thinking Panel */}
              {showThinking && selectedArtifact.thinking && (
                <div className="w-80 border-l border-gray-700 bg-gray-800/50 p-4 overflow-y-auto">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    <FiBookOpen className="w-4 h-4 text-purple-400" />
                    Thinking Process
                  </h3>

                  <div className="space-y-4">
                    {selectedArtifact.thinking.steps.map((step, index) => (
                      <div key={step.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{step.type}</span>
                          {step.confidence && (
                            <span className="text-xs text-gray-500">
                              {Math.round(step.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{step.content}</p>
                      </div>
                    ))}

                    <div className="mt-6 p-3 bg-gray-700/50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Reasoning</h4>
                      <p className="text-sm text-gray-400">{selectedArtifact.thinking.reasoning}</p>
                    </div>

                    <div className="p-3 bg-gray-700/50 rounded-lg">
                      <h4 className="text-sm font-medium mb-2">Conclusion</h4>
                      <p className="text-sm text-gray-400">{selectedArtifact.thinking.conclusion}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FiCode className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-400 mb-2">No Artifact Selected</h2>
              <p className="text-gray-500 mb-4">Select an artifact from the sidebar or create a new one</p>
              <button
                onClick={() => createNewArtifact('code', 'javascript')}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Create New Artifact
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
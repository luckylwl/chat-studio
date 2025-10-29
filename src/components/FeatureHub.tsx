import React, { useState } from 'react'
import {
  Database, Zap, Users, BarChart2, Brain, Workflow,
  Puzzle, Award, Settings, Sparkles, FileText, Palette,
  Code, Shield, Smartphone, ChevronRight, Search
} from 'lucide-react'
import { DocumentManager } from './DocumentManager'
import { BatchProcessor } from './BatchProcessor'
import { PromptEngineeringLab } from './PromptEngineeringLab'

interface Feature {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: string
  component?: React.ComponentType
  badge?: string
}

const features: Feature[] = [
  // RAG & Knowledge Base
  {
    id: 'documents',
    name: 'Document Manager',
    description: 'Upload documents, create knowledge bases, semantic search',
    icon: <Database size={24} />,
    category: 'RAG & Knowledge Base',
    component: DocumentManager,
    badge: 'New'
  },
  {
    id: 'rag',
    name: 'RAG Integration',
    description: 'Augment prompts with context from your documents',
    icon: <FileText size={24} />,
    category: 'RAG & Knowledge Base'
  },

  // AI Enhancement
  {
    id: 'ai-enhancement',
    name: 'AI Enhancement',
    description: 'Auto-summarization, sentiment analysis, keyword extraction',
    icon: <Brain size={24} />,
    category: 'AI Enhancement',
    badge: 'New'
  },
  {
    id: 'smart-recommendations',
    name: 'Smart Recommendations',
    description: 'AI-powered suggestions based on your usage patterns',
    icon: <Sparkles size={24} />,
    category: 'AI Enhancement'
  },

  // Workflow & Automation
  {
    id: 'batch-processor',
    name: 'Batch Processor',
    description: 'Process hundreds of prompts in parallel',
    icon: <Zap size={24} />,
    category: 'Workflow & Automation',
    component: BatchProcessor,
    badge: 'New'
  },
  {
    id: 'workflow-builder',
    name: 'Workflow Builder',
    description: 'Visual workflow automation with triggers and actions',
    icon: <Workflow size={24} />,
    category: 'Workflow & Automation',
    badge: 'New'
  },
  {
    id: 'scheduled-tasks',
    name: 'Scheduled Tasks',
    description: 'Cron-based automation for recurring workflows',
    icon: <Settings size={24} />,
    category: 'Workflow & Automation'
  },

  // Developer Tools
  {
    id: 'prompt-lab',
    name: 'Prompt Engineering Lab',
    description: 'A/B test prompts, optimize with automated scoring',
    icon: <Code size={24} />,
    category: 'Developer Tools',
    component: PromptEngineeringLab,
    badge: 'New'
  },
  {
    id: 'api-sandbox',
    name: 'API Sandbox',
    description: 'Test API calls without billing',
    icon: <Code size={24} />,
    category: 'Developer Tools'
  },

  // Analytics
  {
    id: 'analytics',
    name: 'Analytics Dashboard',
    description: 'Usage trends, cost tracking, quality metrics',
    icon: <BarChart2 size={24} />,
    category: 'Analytics & Insights',
    badge: 'New'
  },
  {
    id: 'ab-testing',
    name: 'A/B Testing',
    description: 'Run experiments and measure impact',
    icon: <BarChart2 size={24} />,
    category: 'Analytics & Insights'
  },

  // Collaboration
  {
    id: 'workspaces',
    name: 'Team Workspaces',
    description: 'Collaborate with team members in shared spaces',
    icon: <Users size={24} />,
    category: 'Collaboration',
    badge: 'New'
  },
  {
    id: 'comments',
    name: 'Comments & Discussions',
    description: 'Add comments and reactions to messages',
    icon: <Users size={24} />,
    category: 'Collaboration'
  },

  // Creative Tools
  {
    id: 'mind-maps',
    name: 'Mind Maps',
    description: 'Auto-generate mind maps from conversations',
    icon: <Palette size={24} />,
    category: 'Creative Tools'
  },
  {
    id: 'flowcharts',
    name: 'Flowcharts',
    description: 'Create flowcharts from text descriptions',
    icon: <Palette size={24} />,
    category: 'Creative Tools'
  },

  // Gamification
  {
    id: 'achievements',
    name: 'Achievements',
    description: 'Unlock achievements and earn points',
    icon: <Award size={24} />,
    category: 'Gamification',
    badge: 'New'
  },
  {
    id: 'leaderboard',
    name: 'Leaderboard',
    description: 'Compete with others on the leaderboard',
    icon: <Award size={24} />,
    category: 'Gamification'
  },

  // Enterprise
  {
    id: 'sso',
    name: 'SSO Integration',
    description: 'SAML, OAuth, and OpenID support',
    icon: <Shield size={24} />,
    category: 'Enterprise',
    badge: 'Enterprise'
  },
  {
    id: 'audit-logs',
    name: 'Audit Logs',
    description: 'Complete activity tracking and compliance',
    icon: <Shield size={24} />,
    category: 'Enterprise',
    badge: 'Enterprise'
  },

  // Plugins
  {
    id: 'plugin-marketplace',
    name: 'Plugin Marketplace',
    description: 'Browse and install community plugins',
    icon: <Puzzle size={24} />,
    category: 'Plugins & Extensions'
  },

  // Mobile
  {
    id: 'mobile-app',
    name: 'Mobile App',
    description: 'iOS and Android apps (Coming Soon)',
    icon: <Smartphone size={24} />,
    category: 'Mobile',
    badge: 'Coming Soon'
  }
]

export const FeatureHub: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  const categories = ['All', ...new Set(features.map(f => f.category))]

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || feature.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const FeatureComponent = selectedFeature?.component

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Feature Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Explore and access all 95+ features of AI Chat Studio v3.0
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search features..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {FeatureComponent ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Breadcrumb */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <button
                onClick={() => setSelectedFeature(null)}
                className="hover:text-blue-600 dark:hover:text-blue-400"
              >
                Feature Hub
              </button>
              <ChevronRight size={16} />
              <span className="text-gray-900 dark:text-white">{selectedFeature.name}</span>
            </div>
          </div>

          {/* Feature Component */}
          <div className="flex-1 overflow-hidden">
            <FeatureComponent />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFeatures.map(feature => (
                <div
                  key={feature.id}
                  onClick={() => feature.component && setSelectedFeature(feature)}
                  className={`bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all ${
                    feature.component ? 'cursor-pointer hover:border-blue-500' : 'opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                      {feature.icon}
                    </div>
                    {feature.badge && (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        feature.badge === 'New'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : feature.badge === 'Enterprise'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {feature.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.name}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {feature.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {feature.category}
                    </span>
                    {feature.component && (
                      <ChevronRight size={16} className="text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredFeatures.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No features found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FeatureHub

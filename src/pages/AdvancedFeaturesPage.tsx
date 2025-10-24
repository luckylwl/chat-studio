import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/utils'

// Import all the advanced components
import SmartMusicGenerator from '@/components/SmartMusicGenerator'
import VirtualEnvironment3D from '@/components/VirtualEnvironment3D'
import RealTimeTranslator from '@/components/RealTimeTranslator'
import AIPsychologicalCounselor from '@/components/AIPsychologicalCounselor'
import MultimediaFusion from '@/components/MultimediaFusion'
import ARVRSupport from '@/components/ARVRSupport'
import AIWorkflowEngine from '@/components/AIWorkflowEngine'
import SmartCodeGenerator from '@/components/SmartCodeGenerator'
import AIConversationDebugger from '@/components/AIConversationDebugger'
import ConversationAnalytics from '@/components/ConversationAnalytics'
import DataExportSystem from '@/components/DataExportSystem'
import RealTimeStatistics from '@/components/RealTimeStatistics'
import VoiceInteraction from '@/components/VoiceInteraction'
import CollaborativeEditing from '@/components/CollaborativeEditing'
import ContentSummarization from '@/components/ContentSummarization'
import AIModelManager from '@/components/AIModelManager'
import PluginSystem from '@/components/PluginSystem'
import AdvancedAutomation from '@/components/AdvancedAutomation'
import SmartDocumentManager from '@/components/SmartDocumentManager'
import ConversationTemplates from '@/components/ConversationTemplates'
import MultiModelChat from '@/components/MultiModelChat'
import AIAssistantLibrary from '@/components/AIAssistantLibrary'
import KnowledgeBaseRAG from '@/components/KnowledgeBaseRAG'
import AdvancedVoiceInteraction from '@/components/AdvancedVoiceInteraction'
import LocalLLMSupport from '@/components/LocalLLMSupport'
import ArtifactsThinkingMode from '@/components/ArtifactsThinkingMode'
import MCPMarketplace from '@/components/MCPMarketplace'
import AgentWorkflowSystem from '@/components/AgentWorkflowSystem'
import DataProcessingAgents from '@/components/DataProcessingAgents'
import PromptLibraryTemplates from '@/components/PromptLibraryTemplates'
import ChatExportImport from '@/components/ChatExportImport'
import CustomThemesUI from '@/components/CustomThemesUI'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import ConversationSearch from '@/components/ConversationSearch'
import SessionPersistence from '@/components/SessionPersistence'
import WorkspaceProjectManager from '@/components/WorkspaceProjectManager'
import WebDAVFileManager from '@/components/WebDAVFileManager'
import PerformanceOptimizer from '@/components/PerformanceOptimizer'
import CrossPlatformCompat from '@/components/CrossPlatformCompat'

interface FeatureTab {
  id: string
  name: string
  icon: string
  description: string
  component: React.ComponentType<any>
  category: 'ai-tools' | 'creative' | 'productivity' | 'wellness' | 'immersive'
  badge?: string
}

const features: FeatureTab[] = [
  // AI工具类
  {
    id: 'workflow-engine',
    name: 'AI工作流引擎',
    icon: '🔄',
    description: '可视化AI工作流程设计和自动化执行',
    component: AIWorkflowEngine,
    category: 'ai-tools',
    badge: 'Pro'
  },
  {
    id: 'code-generator',
    name: '智能代码生成',
    icon: '💻',
    description: '多语言代码生成和优化工具',
    component: SmartCodeGenerator,
    category: 'ai-tools',
    badge: 'New'
  },
  {
    id: 'conversation-debugger',
    name: 'AI对话调试',
    icon: '🔍',
    description: '提示词优化和对话质量分析',
    component: AIConversationDebugger,
    category: 'ai-tools'
  },

  // 创意类
  {
    id: 'music-generator',
    name: '智能音乐生成器',
    icon: '🎵',
    description: 'AI驱动的音乐创作和作曲工具',
    component: SmartMusicGenerator,
    category: 'creative',
    badge: 'Hot'
  },
  {
    id: 'multimedia-fusion',
    name: '多媒体融合',
    icon: '🎬',
    description: '视频音频创作和AI生成工作室',
    component: MultimediaFusion,
    category: 'creative',
    badge: 'Pro'
  },

  // 生产力工具
  {
    id: 'real-time-translator',
    name: '实时翻译器',
    icon: '🌐',
    description: '多语言实时翻译和语音转换',
    component: RealTimeTranslator,
    category: 'productivity'
  },

  // 健康与福祉
  {
    id: 'psychological-counselor',
    name: 'AI心理咨询师',
    icon: '🧠',
    description: '情绪支持和心理健康助手',
    component: AIPsychologicalCounselor,
    category: 'wellness'
  },

  // 沉浸式体验
  {
    id: 'virtual-environment',
    name: '3D虚拟环境',
    icon: '🌟',
    description: '沉浸式3D对话和交互体验',
    component: VirtualEnvironment3D,
    category: 'immersive',
    badge: 'Beta'
  },
  {
    id: 'ar-vr-support',
    name: 'AR/VR支持',
    icon: '🔮',
    description: '增强现实和虚拟现实体验平台',
    component: ARVRSupport,
    category: 'immersive',
    badge: 'New'
  },

  // 数据分析类
  {
    id: 'conversation-analytics',
    name: '对话分析报告',
    icon: '📊',
    description: '深入分析对话模式和使用习惯',
    component: ConversationAnalytics,
    category: 'productivity',
    badge: 'Pro'
  },
  {
    id: 'data-export-system',
    name: '数据导出备份',
    icon: '💾',
    description: '多格式数据导出和备份恢复系统',
    component: DataExportSystem,
    category: 'productivity'
  },
  {
    id: 'real-time-statistics',
    name: '实时统计面板',
    icon: '📈',
    description: '实时跟踪对话活动和使用模式',
    component: RealTimeStatistics,
    category: 'productivity',
    badge: 'New'
  },
  {
    id: 'voice-interaction',
    name: '语音交互系统',
    icon: '🎤',
    description: '语音输入识别和AI语音回复功能',
    component: VoiceInteraction,
    category: 'productivity',
    badge: 'Pro'
  },
  {
    id: 'collaborative-editing',
    name: '协作编辑平台',
    icon: '👥',
    description: '多人实时协作讨论和编辑功能',
    component: CollaborativeEditing,
    category: 'productivity',
    badge: 'Beta'
  },
  {
    id: 'content-summarization',
    name: '智能内容总结',
    icon: '📋',
    description: 'AI驱动的对话内容总结和关键信息提取',
    component: ContentSummarization,
    category: 'ai-tools',
    badge: 'Hot'
  },
  {
    id: 'ai-model-manager',
    name: 'AI模型管理中心',
    icon: '🖥️',
    description: '统一管理和监控所有AI模型的性能与使用情况',
    component: AIModelManager,
    category: 'ai-tools',
    badge: 'Pro'
  },
  {
    id: 'plugin-system',
    name: '插件扩展系统',
    icon: '🧩',
    description: '自定义插件开发和管理平台，扩展应用功能',
    component: PluginSystem,
    category: 'productivity',
    badge: 'New'
  },
  {
    id: 'advanced-automation',
    name: '高级自动化工作流',
    icon: '🔄',
    description: '智能工作流设计，自动化复杂任务和业务流程',
    component: AdvancedAutomation,
    category: 'productivity',
    badge: 'Pro'
  },
  {
    id: 'smart-document-manager',
    name: '智能文档管理',
    icon: '📁',
    description: 'AI驱动的文档管理系统，智能分析和高效组织',
    component: SmartDocumentManager,
    category: 'productivity',
    badge: 'Hot'
  },
  {
    id: 'conversation-templates',
    name: '智能对话模板',
    icon: '💬',
    description: 'AI驱动的对话模板系统，快速生成专业对话内容',
    component: ConversationTemplates,
    category: 'ai-tools',
    badge: 'New'
  },
  {
    id: 'multi-model-chat',
    name: '多模型对话比较',
    icon: '🔬',
    description: '同时与多个AI模型对话，实时比较响应质量和性能',
    component: MultiModelChat,
    category: 'ai-tools',
    badge: 'Hot'
  },
  {
    id: 'ai-assistant-library',
    name: 'AI助手库',
    icon: '👥',
    description: '300+专业AI助手，涵盖各行各业的专业需求',
    component: AIAssistantLibrary,
    category: 'ai-tools',
    badge: 'New'
  },
  {
    id: 'knowledge-base-rag',
    name: '知识库RAG',
    icon: '📚',
    description: '智能文档管理和检索增强生成，让AI基于你的知识库回答',
    component: KnowledgeBaseRAG,
    category: 'ai-tools',
    badge: 'Pro'
  },
  {
    id: 'advanced-voice-interaction',
    name: '高级语音交互',
    icon: '🎙️',
    description: '多语言语音识别和合成，支持多种TTS/STT引擎',
    component: AdvancedVoiceInteraction,
    category: 'productivity',
    badge: 'Hot'
  },
  {
    id: 'local-llm-support',
    name: '本地LLM支持',
    icon: '🖥️',
    description: 'Ollama集成，本地运行大语言模型，隐私保护和离线使用',
    component: LocalLLMSupport,
    category: 'ai-tools',
    badge: 'New'
  },
  {
    id: 'artifacts-thinking-mode',
    name: '智能工件与思维模式',
    icon: '⚡',
    description: '代码工件管理和AI思维过程可视化，像Claude Artifacts一样强大',
    component: ArtifactsThinkingMode,
    category: 'ai-tools',
    badge: 'Hot'
  },
  {
    id: 'mcp-marketplace',
    name: 'MCP扩展市场',
    icon: '📦',
    description: 'Model Context Protocol扩展市场，安装和管理各种AI增强插件',
    component: MCPMarketplace,
    category: 'ai-tools',
    badge: 'Pro'
  },
  {
    id: 'agent-workflow-system',
    name: '智能工作流引擎',
    icon: '🔄',
    description: '构建和编排智能AI工作流，自动化复杂任务和业务流程',
    component: AgentWorkflowSystem,
    category: 'productivity',
    badge: 'Hot'
  },
  {
    id: 'data-processing-agents',
    name: '数据处理代理',
    icon: '📊',
    description: '智能数据处理代理，自动化ETL、清洗、分析和转换',
    component: DataProcessingAgents,
    category: 'productivity',
    badge: 'New'
  },
  {
    id: 'prompt-library-templates',
    name: '智能提示词库',
    icon: '📚',
    description: '专业提示词模板库，支持变量替换和智能优化',
    component: PromptLibraryTemplates,
    category: 'ai-tools',
    badge: 'Hot'
  },
  {
    id: 'chat-export-import',
    name: '聊天导出导入',
    icon: '💾',
    description: '多格式聊天数据导出导入，自动备份和数据迁移',
    component: ChatExportImport,
    category: 'productivity',
    badge: 'Pro'
  },
  {
    id: 'custom-themes-ui',
    name: '自定义主题界面',
    icon: '🎨',
    description: '个性化主题定制，完全自定义UI外观和交互体验',
    component: CustomThemesUI,
    category: 'productivity',
    badge: 'Hot'
  },
  {
    id: 'keyboard-shortcuts',
    name: '键盘快捷键系统',
    icon: '⌨️',
    description: '高效键盘快捷键管理，支持自定义组合键和批量操作',
    component: KeyboardShortcuts,
    category: 'productivity',
    badge: 'New'
  },
  {
    id: 'conversation-search',
    name: '对话搜索引擎',
    icon: '🔍',
    description: '智能搜索所有对话内容，支持高级过滤和相关性排序',
    component: ConversationSearch,
    category: 'productivity',
    badge: 'Hot'
  },
  {
    id: 'session-persistence',
    name: '会话持久化恢复',
    icon: '💾',
    description: '自动保存和恢复系统，确保数据安全和会话连续性',
    component: SessionPersistence,
    category: 'productivity',
    badge: 'Pro'
  },
  {
    id: 'workspace-project-manager',
    name: '工作区项目管理',
    icon: '📁',
    description: '强大的工作区和项目管理系统，支持协作和多项目组织',
    component: WorkspaceProjectManager,
    category: 'productivity',
    badge: 'Hot'
  },
  {
    id: 'webdav-file-manager',
    name: 'WebDAV文件管理',
    icon: '☁️',
    description: 'WebDAV云端文件同步和备份系统，支持多种云存储服务',
    component: WebDAVFileManager,
    category: 'productivity',
    badge: 'Pro'
  },
  {
    id: 'performance-optimizer',
    name: '性能优化器',
    icon: '⚡',
    description: '实时监控系统性能，智能优化应用运行效率和资源使用',
    component: PerformanceOptimizer,
    category: 'productivity',
    badge: 'Hot'
  },
  {
    id: 'cross-platform-compat',
    name: '跨平台兼容性',
    icon: '🌐',
    description: '检测设备能力和平台兼容性，提供自适应优化方案',
    component: CrossPlatformCompat,
    category: 'productivity',
    badge: 'Pro'
  }
]

const categories = [
  { id: 'all', name: '全部功能', icon: '🚀' },
  { id: 'ai-tools', name: 'AI工具', icon: '🤖' },
  { id: 'creative', name: '创意工具', icon: '🎨' },
  { id: 'productivity', name: '生产力', icon: '⚡' },
  { id: 'wellness', name: '健康福祉', icon: '💚' },
  { id: 'immersive', name: '沉浸体验', icon: '🌌' }
]

const AdvancedFeaturesPage: React.FC = () => {
  const { t } = useTranslation()
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeFeature, setActiveFeature] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredFeatures = features.filter(feature => {
    const matchesCategory = activeCategory === 'all' || feature.category === activeCategory
    const matchesSearch = searchTerm === '' ||
      feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const activeFeatureData = features.find(f => f.id === activeFeature)

  if (activeFeature && activeFeatureData) {
    const Component = activeFeatureData.component
    return (
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Feature Header */}
        <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveFeature(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeFeatureData.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {activeFeatureData.name}
                  </h1>
                  {activeFeatureData.badge && (
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      activeFeatureData.badge === 'New' && 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
                      activeFeatureData.badge === 'Hot' && 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
                      activeFeatureData.badge === 'Pro' && 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
                      activeFeatureData.badge === 'Beta' && 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                    )}>
                      {activeFeatureData.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {activeFeatureData.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full p-6">
            <Component className="h-full max-w-none" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                🚀 高级功能中心
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                探索最前沿的AI技术和创新工具，释放无限可能
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="搜索功能..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors',
                  activeCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                )}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                  {category.id === 'all' ? features.length : features.filter(f => f.category === category.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {filteredFeatures.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                未找到相关功能
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                尝试调整搜索关键词或选择其他分类
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFeatures.map((feature) => (
                <div
                  key={feature.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => setActiveFeature(feature.id)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
                        {feature.icon}
                      </div>
                      {feature.badge && (
                        <span className={cn(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          feature.badge === 'New' && 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
                          feature.badge === 'Hot' && 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
                          feature.badge === 'Pro' && 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
                          feature.badge === 'Beta' && 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300'
                        )}>
                          {feature.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {feature.name}
                    </h3>

                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                      {feature.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        feature.category === 'ai-tools' && 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
                        feature.category === 'creative' && 'bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300',
                        feature.category === 'productivity' && 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
                        feature.category === 'wellness' && 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
                        feature.category === 'immersive' && 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                      )}>
                        {categories.find(c => c.id === feature.category)?.name}
                      </span>

                      <div className="flex items-center text-blue-500 font-medium text-sm group-hover:translate-x-1 transition-transform">
                        <span>启动</span>
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>{features.length} 个高级功能</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span>{categories.length - 1} 个功能分类</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span>持续更新中</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedFeaturesPage
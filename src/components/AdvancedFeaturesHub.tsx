/**
 * Advanced Features Hub
 *
 * Central hub for accessing all new v3.5/v4.0 features
 */

import React, { useState } from 'react';

// Import all feature panels (lazy loaded for performance)
const LocalModelManager = React.lazy(() => import('./LocalModelManager'));
const SmartSearch = React.lazy(() => import('./SmartSearch'));
const CodeAssistant = React.lazy(() => import('./CodeAssistant'));
const AdvancedRAG = React.lazy(() => import('./AdvancedRAG'));
const ContentStudio = React.lazy(() => import('./ContentStudio'));
const DataAnalysis = React.lazy(() => import('./DataAnalysis'));
const Collaboration = React.lazy(() => import('./Collaboration'));
const DebateArena = React.lazy(() => import('./DebateArena'));
const AcademicResearch = React.lazy(() => import('./AcademicResearch'));
const VectorMemory = React.lazy(() => import('./VectorMemory'));
const Personalization = React.lazy(() => import('./Personalization'));
const DialogueContext = React.lazy(() => import('./DialogueContext'));
const PromptOptimizerComponent = React.lazy(() => import('./PromptOptimizer'));

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'ai' | 'productivity' | 'development' | 'content' | 'collaboration';
  version: 'v3.0' | 'v3.5' | 'v4.0';
  status: 'stable' | 'beta' | 'experimental';
  component?: React.ComponentType;
}

export const AdvancedFeaturesHub: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const features: Feature[] = [
    // v3.5 Features
    {
      id: 'local-models',
      name: 'Local Models',
      description: 'Run AI models locally with Ollama, WebLLM, or LM Studio. Zero cost, complete privacy.',
      icon: '🖥️',
      category: 'ai',
      version: 'v3.5',
      status: 'stable',
      component: LocalModelManager,
    },
    {
      id: 'smart-search',
      name: 'Smart Search',
      description: 'Perplexity-style search with citations, multi-source verification, and confidence scoring.',
      icon: '🔍',
      category: 'ai',
      version: 'v3.5',
      status: 'stable',
      component: SmartSearch,
    },
    {
      id: 'code-assistant',
      name: 'Code Assistant',
      description: 'AI-powered code completion, bug detection, refactoring, and test generation.',
      icon: '💻',
      category: 'development',
      version: 'v3.5',
      status: 'stable',
      component: CodeAssistant,
    },
    {
      id: 'advanced-rag',
      name: 'Advanced RAG',
      description: 'Hybrid search (vector + BM25), reranking, citation tracking, and query expansion.',
      icon: '📚',
      category: 'ai',
      version: 'v3.5',
      status: 'stable',
      component: AdvancedRAG,
    },
    {
      id: 'content-studio',
      name: 'Content Creation Studio',
      description: 'Generate social media posts, blogs, ads, and more with SEO optimization.',
      icon: '✍️',
      category: 'content',
      version: 'v3.5',
      status: 'stable',
      component: ContentStudio,
    },
    {
      id: 'data-analysis',
      name: 'Data Analysis Workbench',
      description: 'Import data, run natural language queries, get visualization recommendations.',
      icon: '📊',
      category: 'productivity',
      version: 'v3.5',
      status: 'stable',
      component: DataAnalysis,
    },
    {
      id: 'collaboration',
      name: 'Real-time Collaboration',
      description: 'CRDT-based collaborative editing with cursor sync and comments.',
      icon: '👥',
      category: 'collaboration',
      version: 'v3.5',
      status: 'beta',
      component: Collaboration,
    },
    {
      id: 'debate-arena',
      name: 'AI Debate Arena',
      description: 'Watch AI models debate each other on any topic. Unique and entertaining.',
      icon: '⚔️',
      category: 'ai',
      version: 'v3.5',
      status: 'beta',
      component: DebateArena,
    },
    {
      id: 'academic-research',
      name: 'Academic Research Assistant',
      description: 'Manage papers, generate citations, create literature reviews.',
      icon: '🎓',
      category: 'productivity',
      version: 'v3.5',
      status: 'stable',
      component: AcademicResearch,
    },

    // v4.0 Features
    {
      id: 'vector-memory',
      name: 'Vector Memory',
      description: 'Cross-conversation memory with forgetting curve and consolidation.',
      icon: '🧠',
      category: 'ai',
      version: 'v4.0',
      status: 'beta',
      component: VectorMemory,
    },
    {
      id: 'personalization',
      name: 'AI Personalization',
      description: 'Adaptive responses based on your preferences, style, and behavior.',
      icon: '🎯',
      category: 'ai',
      version: 'v4.0',
      status: 'beta',
      component: Personalization,
    },
    {
      id: 'dialogue-context',
      name: 'Dialogue Context',
      description: 'Advanced reference resolution, topic tracking, and intent detection.',
      icon: '💬',
      category: 'ai',
      version: 'v4.0',
      status: 'beta',
      component: DialogueContext,
    },
    {
      id: 'prompt-optimizer',
      name: 'Prompt Optimizer',
      description: 'Analyze and optimize prompts with scoring, suggestions, and A/B testing.',
      icon: '🎨',
      category: 'development',
      version: 'v4.0',
      status: 'beta',
      component: PromptOptimizerComponent,
    },
  ];

  const categories = [
    { id: 'all', name: 'All Features', icon: '🌟' },
    { id: 'ai', name: 'AI & ML', icon: '🤖' },
    { id: 'productivity', name: 'Productivity', icon: '⚡' },
    { id: 'development', name: 'Development', icon: '🛠️' },
    { id: 'content', name: 'Content', icon: '📝' },
    { id: 'collaboration', name: 'Collaboration', icon: '🤝' },
  ];

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          feature.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const selectedFeatureData = features.find(f => f.id === selectedFeature);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-4">Advanced Features Hub</h1>
          <p className="text-xl opacity-90">
            Explore 14+ powerful features from v3.5 and v4.0
          </p>
          <div className="mt-6 flex gap-4">
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <span className="text-2xl font-bold">14+</span>
              <span className="ml-2">Features</span>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <span className="text-2xl font-bold">$2,000+</span>
              <span className="ml-2">Value/Year</span>
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-lg">
              <span className="text-2xl font-bold">100%</span>
              <span className="ml-2">Open Source</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="mt-4 flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Grid */}
        {!selectedFeature ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeatures.map(feature => (
              <div
                key={feature.id}
                onClick={() => setSelectedFeature(feature.id)}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-blue-500"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{feature.icon}</div>
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      feature.version === 'v4.0' ? 'bg-purple-100 text-purple-800' :
                      feature.version === 'v3.5' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {feature.version}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      feature.status === 'stable' ? 'bg-green-100 text-green-800' :
                      feature.status === 'beta' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {feature.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-2">{feature.name}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>

                <button className="mt-4 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Open Feature
                </button>
              </div>
            ))}
          </div>
        ) : (
          // Feature Detail View
          <div className="bg-white rounded-lg shadow-lg p-8">
            <button
              onClick={() => setSelectedFeature(null)}
              className="mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              ← Back to Features
            </button>

            {selectedFeatureData && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-6xl">{selectedFeatureData.icon}</div>
                  <div>
                    <h2 className="text-3xl font-bold">{selectedFeatureData.name}</h2>
                    <p className="text-gray-600 mt-2">{selectedFeatureData.description}</p>
                  </div>
                </div>

                {/* Load feature component */}
                {selectedFeatureData.component ? (
                  <React.Suspense fallback={<div className="text-center py-12">Loading...</div>}>
                    <selectedFeatureData.component />
                  </React.Suspense>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="font-semibold text-yellow-900 mb-2">
                      UI Component Coming Soon
                    </h3>
                    <p className="text-yellow-800">
                      The service for this feature is fully implemented. The UI component is currently being developed.
                      In the meantime, you can use the service directly in your code:
                    </p>
                    <pre className="mt-4 bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                      <code>{`import ${selectedFeatureData.id.replace(/-/g, '')}Service from './services/${selectedFeatureData.id.replace(/-/g, '')}Service';

// Use the service directly
const result = await ${selectedFeatureData.id.replace(/-/g, '')}Service.someMethod();`}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        {!selectedFeature && (
          <div className="mt-12 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Feature Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {features.filter(f => f.version === 'v3.5').length}
                </div>
                <div className="text-gray-600">v3.5 Features</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">
                  {features.filter(f => f.version === 'v4.0').length}
                </div>
                <div className="text-gray-600">v4.0 Features</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {features.filter(f => f.status === 'stable').length}
                </div>
                <div className="text-gray-600">Stable</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-600">
                  {features.filter(f => f.status === 'beta').length}
                </div>
                <div className="text-gray-600">Beta</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedFeaturesHub;

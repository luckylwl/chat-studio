import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiBookOpen, FiStar, FiCopy, FiEdit3, FiTrash2, FiPlus, FiSearch, FiFilter, FiDownload, FiUpload, FiPlay, FiSave, FiRefreshCw, FiTrendingUp, FiTarget, FiZap, FiTag, FiUser, FiClock, FiBarChart2, FiShare2, FiHeart, FiMessageSquare } from 'react-icons/fi'

interface PromptTemplate {
  id: string
  title: string
  description: string
  content: string
  category: 'writing' | 'coding' | 'analysis' | 'creative' | 'business' | 'education' | 'research' | 'personal' | 'technical' | 'marketing'
  tags: string[]
  variables: PromptVariable[]
  author: string
  isPublic: boolean
  isFavorite: boolean
  rating: number
  usageCount: number
  created: number
  updated: number
  examples?: PromptExample[]
  version: string
  language: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

interface PromptVariable {
  name: string
  type: 'text' | 'number' | 'select' | 'multiline' | 'date' | 'url' | 'email'
  description: string
  required: boolean
  defaultValue?: any
  options?: string[]
  placeholder?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

interface PromptExample {
  title: string
  variables: Record<string, any>
  expectedOutput: string
  context?: string
}

interface PromptCollection {
  id: string
  name: string
  description: string
  prompts: string[]
  isPublic: boolean
  created: number
  updated: number
  author: string
}

const SAMPLE_PROMPTS: PromptTemplate[] = [
  {
    id: 'code-review-prompt',
    title: 'Code Review Assistant',
    description: 'Comprehensive code review with best practices and improvement suggestions',
    content: `Please review the following {{language}} code and provide detailed feedback:

Code to review:
\`\`\`{{language}}
{{code}}
\`\`\`

Please analyze:
1. **Code Quality**: Structure, readability, and maintainability
2. **Performance**: Potential optimizations and efficiency improvements
3. **Security**: Vulnerabilities and security best practices
4. **Best Practices**: Adherence to {{language}} conventions and patterns
5. **Bugs & Issues**: Potential bugs or logical errors
6. **Suggestions**: Specific improvement recommendations

Focus areas: {{focusAreas}}
Experience level: {{experienceLevel}}

Provide actionable feedback with examples where possible.`,
    category: 'coding',
    tags: ['code-review', 'best-practices', 'debugging', 'optimization'],
    variables: [
      {
        name: 'language',
        type: 'select',
        description: 'Programming language',
        required: true,
        options: ['JavaScript', 'Python', 'Java', 'C++', 'TypeScript', 'Go', 'Rust', 'PHP', 'C#', 'Ruby'],
        defaultValue: 'JavaScript'
      },
      {
        name: 'code',
        type: 'multiline',
        description: 'Code to review',
        required: true,
        placeholder: 'Paste your code here...'
      },
      {
        name: 'focusAreas',
        type: 'text',
        description: 'Specific areas to focus on (optional)',
        required: false,
        placeholder: 'e.g., performance, security, readability',
        defaultValue: 'general review'
      },
      {
        name: 'experienceLevel',
        type: 'select',
        description: 'Your experience level',
        required: true,
        options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        defaultValue: 'Intermediate'
      }
    ],
    author: 'AI Systems',
    isPublic: true,
    isFavorite: false,
    rating: 4.8,
    usageCount: 2340,
    created: Date.now() - 2592000000,
    updated: Date.now() - 86400000,
    version: '2.1',
    language: 'en',
    difficulty: 'intermediate',
    examples: [
      {
        title: 'JavaScript Function Review',
        variables: {
          language: 'JavaScript',
          code: 'function findMax(arr) { let max = 0; for(let i = 0; i < arr.length; i++) { if(arr[i] > max) max = arr[i]; } return max; }',
          focusAreas: 'performance and edge cases',
          experienceLevel: 'Beginner'
        },
        expectedOutput: 'Detailed review focusing on handling negative numbers, empty arrays, and performance improvements',
        context: 'Beginner developer learning array manipulation'
      }
    ]
  },
  {
    id: 'business-analysis',
    title: 'Business Strategy Analyzer',
    description: 'Comprehensive business strategy analysis and recommendations',
    content: `As a senior business strategist, please analyze the following business scenario:

**Company/Project**: {{companyName}}
**Industry**: {{industry}}
**Market Stage**: {{marketStage}}

**Current Situation**:
{{currentSituation}}

**Objectives**:
{{objectives}}

**Constraints/Challenges**:
{{constraints}}

Please provide:

1. **Market Analysis**
   - Industry trends and opportunities
   - Competitive landscape assessment
   - Target market evaluation

2. **Strategic Recommendations**
   - Short-term tactics (0-6 months)
   - Medium-term strategies (6-18 months)
   - Long-term vision (18+ months)

3. **Risk Assessment**
   - Key risks and mitigation strategies
   - Scenario planning

4. **Success Metrics**
   - KPIs to track progress
   - Milestones and benchmarks

5. **Action Plan**
   - Priority initiatives
   - Resource requirements
   - Timeline recommendations

Focus on {{focusArea}} and consider {{additionalContext}}.`,
    category: 'business',
    tags: ['strategy', 'analysis', 'planning', 'business-development'],
    variables: [
      {
        name: 'companyName',
        type: 'text',
        description: 'Company or project name',
        required: true,
        placeholder: 'e.g., TechStartup Inc.'
      },
      {
        name: 'industry',
        type: 'select',
        description: 'Industry sector',
        required: true,
        options: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Entertainment', 'Other']
      },
      {
        name: 'marketStage',
        type: 'select',
        description: 'Market maturity stage',
        required: true,
        options: ['Startup/Pre-revenue', 'Early Stage', 'Growth Stage', 'Mature', 'Declining'],
        defaultValue: 'Growth Stage'
      },
      {
        name: 'currentSituation',
        type: 'multiline',
        description: 'Current business situation and challenges',
        required: true,
        placeholder: 'Describe current state, challenges, and opportunities...'
      },
      {
        name: 'objectives',
        type: 'multiline',
        description: 'Business objectives and goals',
        required: true,
        placeholder: 'What are you trying to achieve?'
      },
      {
        name: 'constraints',
        type: 'text',
        description: 'Budget, time, or other constraints',
        required: false,
        placeholder: 'e.g., Limited budget, tight timeline'
      },
      {
        name: 'focusArea',
        type: 'select',
        description: 'Primary focus area',
        required: true,
        options: ['Growth Strategy', 'Cost Optimization', 'Market Expansion', 'Digital Transformation', 'Competitive Positioning'],
        defaultValue: 'Growth Strategy'
      },
      {
        name: 'additionalContext',
        type: 'text',
        description: 'Additional context or specific requirements',
        required: false,
        placeholder: 'Any additional information...'
      }
    ],
    author: 'Business Experts',
    isPublic: true,
    isFavorite: true,
    rating: 4.9,
    usageCount: 1567,
    created: Date.now() - 1296000000,
    updated: Date.now() - 172800000,
    version: '1.5',
    language: 'en',
    difficulty: 'advanced'
  },
  {
    id: 'creative-writing',
    title: 'Creative Story Generator',
    description: 'Generate engaging stories with customizable characters and plots',
    content: `Create an engaging {{storyType}} story with the following elements:

**Setting**: {{setting}}
**Genre**: {{genre}}
**Tone**: {{tone}}
**Length**: {{length}}

**Main Character**:
- Name: {{characterName}}
- Age: {{characterAge}}
- Occupation/Role: {{characterRole}}
- Key trait: {{characterTrait}}

**Plot Elements**:
- Central conflict: {{conflict}}
- Key challenge: {{challenge}}
- Desired outcome: {{outcome}}

**Special Requirements**: {{specialRequirements}}

Please create a compelling story that:
1. Has a strong opening hook
2. Develops the character through the conflict
3. Includes vivid descriptions and dialogue
4. Builds to a satisfying resolution
5. Maintains the specified tone throughout

Target audience: {{targetAudience}}

Make it {{emotionalImpact}} and ensure it delivers {{keyMessage}}.`,
    category: 'creative',
    tags: ['storytelling', 'fiction', 'creative-writing', 'narrative'],
    variables: [
      {
        name: 'storyType',
        type: 'select',
        description: 'Type of story',
        required: true,
        options: ['Short Story', 'Flash Fiction', 'Chapter', 'Screenplay Scene', 'Monologue'],
        defaultValue: 'Short Story'
      },
      {
        name: 'genre',
        type: 'select',
        description: 'Story genre',
        required: true,
        options: ['Science Fiction', 'Fantasy', 'Mystery', 'Romance', 'Thriller', 'Drama', 'Comedy', 'Horror', 'Historical Fiction', 'Contemporary'],
        defaultValue: 'Science Fiction'
      },
      {
        name: 'setting',
        type: 'text',
        description: 'Story setting (time and place)',
        required: true,
        placeholder: 'e.g., Modern Tokyo, Medieval castle, Space station'
      },
      {
        name: 'tone',
        type: 'select',
        description: 'Story tone',
        required: true,
        options: ['Serious', 'Humorous', 'Dark', 'Uplifting', 'Mysterious', 'Romantic', 'Action-packed'],
        defaultValue: 'Serious'
      },
      {
        name: 'length',
        type: 'select',
        description: 'Approximate length',
        required: true,
        options: ['Very Short (100-300 words)', 'Short (300-800 words)', 'Medium (800-1500 words)', 'Long (1500+ words)'],
        defaultValue: 'Short (300-800 words)'
      },
      {
        name: 'characterName',
        type: 'text',
        description: 'Main character name',
        required: true,
        placeholder: 'Character name'
      },
      {
        name: 'characterAge',
        type: 'number',
        description: 'Character age',
        required: false,
        validation: { min: 1, max: 200 }
      },
      {
        name: 'characterRole',
        type: 'text',
        description: 'Character occupation or role',
        required: true,
        placeholder: 'e.g., Detective, Student, Engineer'
      },
      {
        name: 'characterTrait',
        type: 'text',
        description: 'Key character trait',
        required: true,
        placeholder: 'e.g., Brave but reckless, Intelligent but antisocial'
      },
      {
        name: 'conflict',
        type: 'text',
        description: 'Central conflict or problem',
        required: true,
        placeholder: 'What is the main challenge or conflict?'
      },
      {
        name: 'challenge',
        type: 'text',
        description: 'Specific challenge to overcome',
        required: true,
        placeholder: 'What obstacle must be overcome?'
      },
      {
        name: 'outcome',
        type: 'text',
        description: 'Desired story outcome',
        required: false,
        placeholder: 'How should the story resolve?'
      },
      {
        name: 'targetAudience',
        type: 'select',
        description: 'Target audience',
        required: true,
        options: ['Children (8-12)', 'Young Adult (13-17)', 'Adult (18+)', 'General Audience'],
        defaultValue: 'Adult (18+)'
      },
      {
        name: 'emotionalImpact',
        type: 'select',
        description: 'Desired emotional impact',
        required: true,
        options: ['Heartwarming', 'Thought-provoking', 'Exciting', 'Inspiring', 'Suspenseful', 'Moving'],
        defaultValue: 'Thought-provoking'
      },
      {
        name: 'keyMessage',
        type: 'text',
        description: 'Key message or theme',
        required: false,
        placeholder: 'What message should the story convey?'
      },
      {
        name: 'specialRequirements',
        type: 'text',
        description: 'Special requirements or constraints',
        required: false,
        placeholder: 'Any specific requirements...'
      }
    ],
    author: 'Creative Writers',
    isPublic: true,
    isFavorite: false,
    rating: 4.6,
    usageCount: 3421,
    created: Date.now() - 1728000000,
    updated: Date.now() - 259200000,
    version: '3.0',
    language: 'en',
    difficulty: 'beginner'
  },
  {
    id: 'research-analysis',
    title: 'Research Paper Analyzer',
    description: 'Comprehensive academic research paper analysis and summary',
    content: `Please analyze the following research paper and provide a comprehensive breakdown:

**Paper Title**: {{paperTitle}}
**Authors**: {{authors}}
**Publication**: {{publication}}
**Research Field**: {{researchField}}

**Paper Content/Abstract**:
{{paperContent}}

**Analysis Focus**: {{analysisFocus}}

Please provide:

1. **Executive Summary**
   - Main research question and hypothesis
   - Key findings and contributions
   - Significance to the field

2. **Methodology Analysis**
   - Research methods used
   - Data collection and analysis approaches
   - Strengths and limitations of methodology

3. **Key Findings**
   - Primary results and discoveries
   - Statistical significance and confidence levels
   - Unexpected or contradictory findings

4. **Critical Assessment**
   - Strengths of the research
   - Potential weaknesses or limitations
   - Bias assessment and reliability

5. **Implications**
   - Practical applications
   - Future research directions
   - Policy or industry implications

6. **Comparison with Related Work**
   - How it builds on existing research
   - Novel contributions
   - Contradictions with previous studies

**Target Audience**: {{targetAudience}}
**Complexity Level**: {{complexityLevel}}

Please ensure the analysis is {{analysisStyle}} and suitable for {{intendedUse}}.`,
    category: 'research',
    tags: ['academic', 'analysis', 'research', 'paper-review', 'scientific'],
    variables: [
      {
        name: 'paperTitle',
        type: 'text',
        description: 'Research paper title',
        required: true,
        placeholder: 'Enter the paper title'
      },
      {
        name: 'authors',
        type: 'text',
        description: 'Paper authors',
        required: false,
        placeholder: 'Author names (optional)'
      },
      {
        name: 'publication',
        type: 'text',
        description: 'Publication venue',
        required: false,
        placeholder: 'Journal, conference, etc.'
      },
      {
        name: 'researchField',
        type: 'select',
        description: 'Research field',
        required: true,
        options: ['Computer Science', 'Medicine', 'Psychology', 'Economics', 'Physics', 'Chemistry', 'Biology', 'Sociology', 'Engineering', 'Mathematics', 'Other'],
        defaultValue: 'Computer Science'
      },
      {
        name: 'paperContent',
        type: 'multiline',
        description: 'Paper content, abstract, or key sections',
        required: true,
        placeholder: 'Paste the paper content, abstract, or key sections here...'
      },
      {
        name: 'analysisFocus',
        type: 'select',
        description: 'Primary analysis focus',
        required: true,
        options: ['Methodology', 'Results & Findings', 'Literature Review', 'Practical Applications', 'Critical Assessment', 'Comprehensive Overview'],
        defaultValue: 'Comprehensive Overview'
      },
      {
        name: 'targetAudience',
        type: 'select',
        description: 'Target audience for analysis',
        required: true,
        options: ['Academic Researchers', 'Industry Professionals', 'Students', 'General Public', 'Policy Makers'],
        defaultValue: 'Academic Researchers'
      },
      {
        name: 'complexityLevel',
        type: 'select',
        description: 'Desired complexity level',
        required: true,
        options: ['Simplified/Accessible', 'Moderate', 'Technical/Detailed', 'Expert Level'],
        defaultValue: 'Moderate'
      },
      {
        name: 'analysisStyle',
        type: 'select',
        description: 'Analysis style',
        required: true,
        options: ['Objective and neutral', 'Critical and analytical', 'Supportive and positive', 'Balanced perspective'],
        defaultValue: 'Objective and neutral'
      },
      {
        name: 'intendedUse',
        type: 'select',
        description: 'Intended use of analysis',
        required: true,
        options: ['Literature review', 'Research proposal', 'Course assignment', 'Policy briefing', 'Business decision', 'Personal understanding'],
        defaultValue: 'Personal understanding'
      }
    ],
    author: 'Research Team',
    isPublic: true,
    isFavorite: true,
    rating: 4.7,
    usageCount: 892,
    created: Date.now() - 5184000000,
    updated: Date.now() - 604800000,
    version: '2.3',
    language: 'en',
    difficulty: 'advanced'
  }
]

const CATEGORIES = [
  { id: 'all', name: 'All Prompts', icon: '🚀', count: 0 },
  { id: 'writing', name: 'Writing', icon: '✍️', count: 0 },
  { id: 'coding', name: 'Coding', icon: '💻', count: 0 },
  { id: 'analysis', name: 'Analysis', icon: '📊', count: 0 },
  { id: 'creative', name: 'Creative', icon: '🎨', count: 0 },
  { id: 'business', name: 'Business', icon: '💼', count: 0 },
  { id: 'education', name: 'Education', icon: '🎓', count: 0 },
  { id: 'research', name: 'Research', icon: '🔬', count: 0 },
  { id: 'technical', name: 'Technical', icon: '⚙️', count: 0 },
  { id: 'marketing', name: 'Marketing', icon: '📢', count: 0 },
  { id: 'personal', name: 'Personal', icon: '👤', count: 0 }
]

export default function PromptLibraryTemplates() {
  const [prompts, setPrompts] = useState<PromptTemplate[]>(SAMPLE_PROMPTS)
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null)
  const [activeTab, setActiveTab] = useState<'library' | 'collections' | 'create' | 'preview'>('library')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'usage' | 'updated' | 'created'>('rating')
  const [filterBy, setFilterBy] = useState<'all' | 'favorites' | 'public' | 'private'>('all')
  const [isCreating, setIsCreating] = useState(false)
  const [variables, setVariables] = useState<Record<string, any>>({})
  const [generatedContent, setGeneratedContent] = useState('')

  // Update category counts
  useEffect(() => {
    CATEGORIES.forEach(cat => {
      if (cat.id === 'all') {
        cat.count = prompts.length
      } else {
        cat.count = prompts.filter(p => p.category === cat.id).length
      }
    })
  }, [prompts])

  const filteredPrompts = prompts.filter(prompt => {
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory
    const matchesSearch = searchTerm === '' ||
      prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFilter = filterBy === 'all' ||
      (filterBy === 'favorites' && prompt.isFavorite) ||
      (filterBy === 'public' && prompt.isPublic) ||
      (filterBy === 'private' && !prompt.isPublic)

    return matchesCategory && matchesSearch && matchesFilter
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title)
      case 'rating':
        return b.rating - a.rating
      case 'usage':
        return b.usageCount - a.usageCount
      case 'updated':
        return b.updated - a.updated
      case 'created':
        return b.created - a.created
      default:
        return 0
    }
  })

  const toggleFavorite = (promptId: string) => {
    setPrompts(prev => prev.map(p =>
      p.id === promptId
        ? { ...p, isFavorite: !p.isFavorite }
        : p
    ))
  }

  const copyPrompt = async (prompt: PromptTemplate) => {
    try {
      await navigator.clipboard.writeText(prompt.content)
    } catch (err) {
      console.error('Failed to copy prompt:', err)
    }
  }

  const usePrompt = (prompt: PromptTemplate) => {
    setSelectedPrompt(prompt)
    setActiveTab('preview')
    // Initialize variables with defaults
    const initialVariables: Record<string, any> = {}
    prompt.variables.forEach(variable => {
      initialVariables[variable.name] = variable.defaultValue || ''
    })
    setVariables(initialVariables)
  }

  const generateContent = () => {
    if (!selectedPrompt) return

    let content = selectedPrompt.content

    // Replace variables in content
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, value || `[${key}]`)
    })

    setGeneratedContent(content)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400'
      case 'intermediate': return 'text-yellow-400'
      case 'advanced': return 'text-orange-400'
      case 'expert': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const formatUsageCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none p-6 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
              <FiBookOpen className="text-purple-400" />
              Prompt Library & Templates
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Professional prompt templates for every use case
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FiStar className="w-4 h-4 text-yellow-400" />
                <span>{prompts.filter(p => p.isFavorite).length} Favorites</span>
              </div>
              <div className="flex items-center gap-2">
                <FiShare2 className="w-4 h-4 text-blue-400" />
                <span>{prompts.filter(p => p.isPublic).length} Public</span>
              </div>
            </div>

            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Create Prompt
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-800/50 rounded-lg p-1">
          {[
            { id: 'library', label: 'Prompt Library', count: prompts.length },
            { id: 'collections', label: 'Collections', count: 5 },
            { id: 'preview', label: 'Preview & Test', icon: FiPlay },
            { id: 'create', label: 'Create New', icon: FiPlus }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'library' && (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex"
            >
              {/* Sidebar */}
              <div className="w-80 border-r border-gray-800 flex flex-col">
                {/* Search and Filters */}
                <div className="p-4 border-b border-gray-800">
                  <div className="relative mb-4">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search prompts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="flex gap-2 mb-4">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="rating">Sort by Rating</option>
                      <option value="usage">Sort by Usage</option>
                      <option value="updated">Sort by Updated</option>
                      <option value="created">Sort by Created</option>
                      <option value="name">Sort by Name</option>
                    </select>

                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value as any)}
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Prompts</option>
                      <option value="favorites">Favorites</option>
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Categories</h3>
                    <div className="space-y-1">
                      {CATEGORIES.map(category => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                            selectedCategory === category.id
                              ? 'bg-purple-600/20 text-purple-400 border border-purple-600/50'
                              : 'hover:bg-gray-800 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span>{category.icon}</span>
                            <span className="text-sm">{category.name}</span>
                          </div>
                          <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">
                            {category.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Prompts List */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-4">
                  {filteredPrompts.map(prompt => (
                    <motion.div
                      key={prompt.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">{prompt.title}</h3>
                            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded capitalize">
                              {prompt.category}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(prompt.difficulty)}`}>
                              {prompt.difficulty}
                            </span>
                            {prompt.isPublic && (
                              <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded">
                                Public
                              </span>
                            )}
                          </div>

                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                            {prompt.description}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              <FiStar className="w-3 h-3 text-yellow-400" />
                              <span>{prompt.rating}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FiMessageSquare className="w-3 h-3" />
                              <span>{formatUsageCount(prompt.usageCount)} uses</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FiUser className="w-3 h-3" />
                              <span>{prompt.author}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FiClock className="w-3 h-3" />
                              <span>v{prompt.version}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                            {prompt.tags.slice(0, 4).map(tag => (
                              <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                #{tag}
                              </span>
                            ))}
                            {prompt.tags.length > 4 && (
                              <span className="text-xs text-gray-500">+{prompt.tags.length - 4} more</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => toggleFavorite(prompt.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              prompt.isFavorite
                                ? 'text-yellow-400 hover:bg-yellow-600/20'
                                : 'text-gray-400 hover:bg-gray-700 hover:text-yellow-400'
                            }`}
                            title={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            {prompt.isFavorite ? <FiHeart className="w-4 h-4 fill-current" /> : <FiHeart className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => copyPrompt(prompt)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                            title="Copy prompt"
                          >
                            <FiCopy className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => usePrompt(prompt)}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <FiPlay className="w-4 h-4" />
                            Use
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'preview' && selectedPrompt && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex"
            >
              {/* Variables Panel */}
              <div className="w-1/3 border-r border-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FiSettings className="w-5 h-5" />
                    {selectedPrompt.title}
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    Configure variables for this prompt
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {selectedPrompt.variables.map(variable => (
                      <div key={variable.name}>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          {variable.description}
                          {variable.required && <span className="text-red-400 ml-1">*</span>}
                        </label>

                        {variable.type === 'text' && (
                          <input
                            type="text"
                            value={variables[variable.name] || ''}
                            onChange={(e) => setVariables(prev => ({ ...prev, [variable.name]: e.target.value }))}
                            placeholder={variable.placeholder}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        )}

                        {variable.type === 'multiline' && (
                          <textarea
                            value={variables[variable.name] || ''}
                            onChange={(e) => setVariables(prev => ({ ...prev, [variable.name]: e.target.value }))}
                            placeholder={variable.placeholder}
                            rows={4}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-vertical"
                          />
                        )}

                        {variable.type === 'select' && (
                          <select
                            value={variables[variable.name] || variable.defaultValue || ''}
                            onChange={(e) => setVariables(prev => ({ ...prev, [variable.name]: e.target.value }))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            {variable.options?.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        )}

                        {variable.type === 'number' && (
                          <input
                            type="number"
                            value={variables[variable.name] || ''}
                            onChange={(e) => setVariables(prev => ({ ...prev, [variable.name]: parseInt(e.target.value) || 0 }))}
                            min={variable.validation?.min}
                            max={variable.validation?.max}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        )}

                        <p className="text-xs text-gray-500 mt-1">{variable.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 border-t border-gray-800">
                  <button
                    onClick={generateContent}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <FiZap className="w-4 h-4" />
                    Generate Content
                  </button>
                </div>
              </div>

              {/* Preview Panel */}
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Generated Prompt</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyPrompt({ ...selectedPrompt, content: generatedContent })}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Copy generated content"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveTab('library')}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                      >
                        Back to Library
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {generatedContent ? (
                    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                      <pre className="whitespace-pre-wrap text-sm text-gray-200 leading-relaxed">
                        {generatedContent}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FiTarget className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 mb-4">Configure variables and generate content</p>
                      <button
                        onClick={generateContent}
                        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Generate Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'collections' && (
            <motion.div
              key="collections"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center">
                <FiBookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Collections</h3>
                <p className="text-gray-500 mb-4">
                  Organize your prompts into collections. Coming soon!
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center">
                <FiPlus className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Create New Prompt</h3>
                <p className="text-gray-500 mb-4">
                  Advanced prompt builder with variable support. Coming soon!
                </p>
                <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium transition-colors">
                  Start Creating
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
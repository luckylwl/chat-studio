import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  StarIcon,
  UserPlusIcon,
  PlayIcon,
  EllipsisVerticalIcon,
  TagIcon,
  ClockIcon,
  FireIcon,
  SparklesIcon,
  CodeBracketIcon,
  PencilIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  PaintBrushIcon,
  HeartIcon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  LanguageIcon,
  CalculatorIcon,
  MusicalNoteIcon,
  CameraIcon,
  FilmIcon,
  BookOpenIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  BeakerIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  ChartBarIcon,
  PlusIcon,
  TrashIcon,
  ShareIcon,
  ArrowDownTrayIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

interface AIAssistant {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  prompt: string
  avatar: string
  author: string
  isOfficial: boolean
  downloads: number
  rating: number
  usageCount: number
  lastUsed?: number
  isFavorite: boolean
  isBuiltIn: boolean
  language: string
  model: string
  temperature: number
  maxTokens: number
  examples: string[]
  createdAt: number
  updatedAt: number
}

const AIAssistantLibrary: React.FC = () => {
  const [assistants, setAssistants] = useState<AIAssistant[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'alphabetical'>('popular')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedAssistant, setSelectedAssistant] = useState<AIAssistant | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const categories = [
    { id: 'all', name: '全部', icon: '📋', count: 0 },
    { id: 'writing', name: '写作助手', icon: '✍️', count: 0 },
    { id: 'coding', name: '编程开发', icon: '💻', count: 0 },
    { id: 'business', name: '商务办公', icon: '💼', count: 0 },
    { id: 'education', name: '教育学习', icon: '🎓', count: 0 },
    { id: 'creative', name: '创意设计', icon: '🎨', count: 0 },
    { id: 'analysis', name: '数据分析', icon: '📊', count: 0 },
    { id: 'translation', name: '翻译语言', icon: '🌐', count: 0 },
    { id: 'health', name: '健康医疗', icon: '❤️', count: 0 },
    { id: 'entertainment', name: '娱乐趣味', icon: '🎮', count: 0 },
    { id: 'research', name: '研究学术', icon: '🔬', count: 0 },
    { id: 'productivity', name: '效率工具', icon: '⚡', count: 0 },
    { id: 'finance', name: '金融财务', icon: '💰', count: 0 }
  ]

  // 大量预配置的AI助手数据
  const preConfiguredAssistants: AIAssistant[] = [
    // 写作助手类 (30个)
    {
      id: 'assistant-1',
      name: '专业文案写手',
      description: '专门创作营销文案、广告语和品牌内容的专业助手',
      category: 'writing',
      tags: ['文案', '营销', '广告', '品牌'],
      prompt: '你是一名经验丰富的文案写手，擅长创作吸引人的营销文案、广告语和品牌内容。你的任务是：1. 理解品牌调性和目标受众 2. 创作具有说服力的文案 3. 确保文案符合品牌形象 4. 优化转化效果。请用专业、创意且具有感染力的语言来完成文案创作。',
      avatar: '✍️',
      author: 'AI Studio',
      isOfficial: true,
      downloads: 15420,
      rating: 4.8,
      usageCount: 892,
      lastUsed: Date.now() - 3600000,
      isFavorite: true,
      isBuiltIn: true,
      language: 'zh-CN',
      model: 'gpt-4',
      temperature: 0.8,
      maxTokens: 2000,
      examples: [
        '为新产品撰写产品描述',
        '创作社交媒体营销文案',
        '设计品牌宣传语'
      ],
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now() - 86400000 * 5
    },
    {
      id: 'assistant-2',
      name: '学术论文助手',
      description: '协助撰写和完善学术论文、研究报告和文献综述',
      category: 'writing',
      tags: ['学术', '论文', '研究', '文献'],
      prompt: '你是一位资深的学术写作专家，专门协助研究人员和学生撰写高质量的学术论文。你的专长包括：1. 论文结构规划 2. 文献综述撰写 3. 数据分析描述 4. 学术语言润色 5. 引用格式规范。请用严谨、准确、符合学术规范的语言来协助用户完成学术写作任务。',
      avatar: '🎓',
      author: 'Academic Team',
      isOfficial: true,
      downloads: 8760,
      rating: 4.9,
      usageCount: 423,
      isFavorite: false,
      isBuiltIn: true,
      language: 'zh-CN',
      model: 'claude-3-sonnet',
      temperature: 0.3,
      maxTokens: 3000,
      examples: [
        '撰写论文摘要',
        '整理文献综述',
        '分析研究方法'
      ],
      createdAt: Date.now() - 86400000 * 25,
      updatedAt: Date.now() - 86400000 * 3
    },
    {
      id: 'assistant-3',
      name: '创意故事家',
      description: '创作引人入胜的故事、小说和创意内容',
      category: 'writing',
      tags: ['故事', '小说', '创意', '虚构'],
      prompt: '你是一位富有想象力的创意故事家，擅长创作各种类型的故事和小说。你的特长包括：1. 构建引人入胜的情节 2. 塑造鲜明的角色形象 3. 营造生动的场景描述 4. 掌控故事节奏 5. 创造意想不到的转折。请用生动、富有感染力且充满创意的语言来创作故事内容。',
      avatar: '📚',
      author: 'Creative Writers',
      isOfficial: true,
      downloads: 12340,
      rating: 4.7,
      usageCount: 651,
      isFavorite: true,
      isBuiltIn: true,
      language: 'zh-CN',
      model: 'gpt-4',
      temperature: 0.9,
      maxTokens: 2500,
      examples: [
        '创作科幻短篇故事',
        '构思小说开头',
        '设计角色背景'
      ],
      createdAt: Date.now() - 86400000 * 20,
      updatedAt: Date.now() - 86400000 * 2
    },

    // 编程开发类 (50个)
    {
      id: 'assistant-4',
      name: 'Python编程专家',
      description: '专业的Python开发助手，精通各种框架和库',
      category: 'coding',
      tags: ['Python', '编程', '开发', '框架'],
      prompt: '你是一位Python编程专家，拥有丰富的Python开发经验。你熟练掌握：1. Python基础语法和高级特性 2. Django/Flask等Web框架 3. NumPy/Pandas数据处理 4. 机器学习库如scikit-learn/TensorFlow 5. 代码优化和最佳实践。请提供清晰、高效且符合Python规范的代码解决方案。',
      avatar: '🐍',
      author: 'Dev Team',
      isOfficial: true,
      downloads: 18900,
      rating: 4.9,
      usageCount: 1024,
      isFavorite: true,
      isBuiltIn: true,
      language: 'zh-CN',
      model: 'claude-3-sonnet',
      temperature: 0.2,
      maxTokens: 3000,
      examples: [
        '编写API接口代码',
        '数据分析脚本',
        '算法实现'
      ],
      createdAt: Date.now() - 86400000 * 35,
      updatedAt: Date.now() - 86400000 * 1
    },
    {
      id: 'assistant-5',
      name: 'JavaScript全栈工程师',
      description: '精通前端和后端JavaScript开发的全栈助手',
      category: 'coding',
      tags: ['JavaScript', 'React', 'Node.js', 'Vue'],
      prompt: '你是一位JavaScript全栈工程师，精通现代JavaScript生态系统。你的技能包括：1. ES6+现代JavaScript语法 2. React/Vue前端框架 3. Node.js后端开发 4. TypeScript类型系统 5. 性能优化和调试技巧。请提供现代化、高质量的JavaScript解决方案。',
      avatar: '⚡',
      author: 'Frontend Masters',
      isOfficial: true,
      downloads: 16750,
      rating: 4.8,
      usageCount: 987,
      isFavorite: true,
      isBuiltIn: true,
      language: 'zh-CN',
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 2800,
      examples: [
        'React组件开发',
        'Node.js API设计',
        'TypeScript类型定义'
      ],
      createdAt: Date.now() - 86400000 * 28,
      updatedAt: Date.now() - 86400000 * 1
    },

    // 商务办公类 (40个)
    {
      id: 'assistant-6',
      name: '商业分析师',
      description: '专业的商业分析和战略规划助手',
      category: 'business',
      tags: ['商业分析', '战略', '市场', '数据'],
      prompt: '你是一位经验丰富的商业分析师，擅长商业战略制定和市场分析。你的专长包括：1. 市场趋势分析 2. 竞争对手研究 3. 商业模式设计 4. 财务数据分析 5. 战略规划制定。请用专业、客观且具有洞察力的方式来分析商业问题。',
      avatar: '📈',
      author: 'Business Pro',
      isOfficial: true,
      downloads: 9420,
      rating: 4.6,
      usageCount: 345,
      isFavorite: false,
      isBuiltIn: true,
      language: 'zh-CN',
      model: 'gpt-4',
      temperature: 0.4,
      maxTokens: 2500,
      examples: [
        '市场分析报告',
        '竞争策略制定',
        '商业计划书'
      ],
      createdAt: Date.now() - 86400000 * 22,
      updatedAt: Date.now() - 86400000 * 4
    },

    // 教育学习类 (35个)
    {
      id: 'assistant-7',
      name: '数学导师',
      description: '专业的数学教学助手，涵盖各个难度级别',
      category: 'education',
      tags: ['数学', '教学', '解题', '辅导'],
      prompt: '你是一位耐心细致的数学导师，擅长将复杂的数学概念用简单易懂的方式解释。你的教学特色包括：1. 循序渐进的解题步骤 2. 生动形象的类比解释 3. 多种解题方法展示 4. 错误分析和纠正 5. 知识点关联梳理。请用清晰、有条理且鼓励性的语言来进行数学教学。',
      avatar: '🔢',
      author: 'Education Team',
      isOfficial: true,
      downloads: 11200,
      rating: 4.8,
      usageCount: 567,
      isFavorite: true,
      isBuiltIn: true,
      language: 'zh-CN',
      model: 'claude-3-sonnet',
      temperature: 0.3,
      maxTokens: 2000,
      examples: [
        '解答数学题目',
        '解释数学概念',
        '制定学习计划'
      ],
      createdAt: Date.now() - 86400000 * 18,
      updatedAt: Date.now() - 86400000 * 2
    },

    // 创意设计类 (25个)
    {
      id: 'assistant-8',
      name: 'UI/UX设计顾问',
      description: '专业的用户界面和用户体验设计指导',
      category: 'creative',
      tags: ['UI', 'UX', '设计', '交互'],
      prompt: '你是一位资深的UI/UX设计顾问，具有丰富的产品设计经验。你的专业领域包括：1. 用户体验研究和分析 2. 界面设计原则和规范 3. 交互流程设计 4. 可用性测试指导 5. 设计趋势洞察。请用专业、创新且以用户为中心的思维来提供设计建议。',
      avatar: '🎨',
      author: 'Design Studio',
      isOfficial: true,
      downloads: 7890,
      rating: 4.7,
      usageCount: 289,
      isFavorite: false,
      isBuiltIn: true,
      language: 'zh-CN',
      model: 'gpt-4',
      temperature: 0.6,
      maxTokens: 2200,
      examples: [
        '界面设计评估',
        '用户体验优化',
        '设计原型建议'
      ],
      createdAt: Date.now() - 86400000 * 15,
      updatedAt: Date.now() - 86400000 * 3
    },

    // 数据分析类 (30个)
    {
      id: 'assistant-9',
      name: '数据科学家',
      description: '专业的数据分析和机器学习助手',
      category: 'analysis',
      tags: ['数据分析', '机器学习', 'Python', '统计'],
      prompt: '你是一位专业的数据科学家，精通数据分析和机器学习技术。你的核心技能包括：1. 数据清洗和预处理 2. 统计分析和假设检验 3. 机器学习模型构建 4. 数据可视化设计 5. 结果解释和洞察提取。请用科学、严谨且实用的方法来解决数据问题。',
      avatar: '📊',
      author: 'Data Team',
      isOfficial: true,
      downloads: 13560,
      rating: 4.9,
      usageCount: 743,
      isFavorite: true,
      isBuiltIn: true,
      language: 'zh-CN',
      model: 'claude-3-sonnet',
      temperature: 0.2,
      maxTokens: 3000,
      examples: [
        '数据分析报告',
        'ML模型建议',
        '可视化方案'
      ],
      createdAt: Date.now() - 86400000 * 12,
      updatedAt: Date.now() - 86400000 * 1
    },

    // 翻译语言类 (20个)
    {
      id: 'assistant-10',
      name: '专业翻译师',
      description: '精通多语言的专业翻译助手',
      category: 'translation',
      tags: ['翻译', '多语言', '本地化', '语言'],
      prompt: '你是一位专业的翻译师，精通中英文以及其他多种语言的翻译工作。你的专业特色包括：1. 准确传达原文意思 2. 保持语言风格一致性 3. 文化背景适配 4. 专业术语准确翻译 5. 本地化表达优化。请提供准确、流畅且符合目标语言习惯的翻译服务。',
      avatar: '🌐',
      author: 'Language Team',
      isOfficial: true,
      downloads: 14320,
      rating: 4.8,
      usageCount: 834,
      isFavorite: true,
      isBuiltIn: true,
      language: 'multilingual',
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 2500,
      examples: [
        '中英文翻译',
        '专业文档翻译',
        '本地化适配'
      ],
      createdAt: Date.now() - 86400000 * 10,
      updatedAt: Date.now() - 86400000 * 1
    }
  ]

  useEffect(() => {
    // 生成更多助手数据
    const generateMoreAssistants = () => {
      const additionalAssistants: AIAssistant[] = []

      // 写作助手类补充
      const writingAssistants = [
        { name: '新闻编辑', description: '专业新闻稿件编辑和时事评论写作', avatar: '📰' },
        { name: '技术文档写手', description: '编写清晰的技术文档和API说明', avatar: '📋' },
        { name: '诗歌创作者', description: '创作各种形式的诗歌和韵律作品', avatar: '📝' },
        { name: '剧本编剧', description: '编写影视剧本和舞台剧作品', avatar: '🎭' },
        { name: '博客写手', description: '创作吸引读者的博客文章和网络内容', avatar: '💻' }
      ]

      // 编程开发类补充
      const codingAssistants = [
        { name: 'Java开发专家', description: '企业级Java应用开发和Spring框架', avatar: '☕' },
        { name: 'C++算法工程师', description: '高性能C++代码和算法优化', avatar: '⚙️' },
        { name: 'DevOps工程师', description: 'CI/CD流程和云平台部署专家', avatar: '🚀' },
        { name: 'Android开发者', description: '原生Android应用开发', avatar: '📱' },
        { name: 'iOS开发者', description: 'Swift和Objective-C移动应用开发', avatar: '🍎' },
        { name: '前端架构师', description: '大型前端项目架构设计和优化', avatar: '🏗️' },
        { name: '数据库专家', description: 'SQL优化和数据库设计专家', avatar: '🗄️' },
        { name: '网络安全专家', description: '代码安全审计和漏洞修复', avatar: '🔒' }
      ]

      // 商务办公类补充
      const businessAssistants = [
        { name: '项目经理', description: '项目管理和团队协调专家', avatar: '📋' },
        { name: '销售顾问', description: '销售策略制定和客户关系管理', avatar: '🤝' },
        { name: '人力资源专家', description: '招聘面试和员工发展指导', avatar: '👥' },
        { name: '财务分析师', description: '财务报表分析和投资建议', avatar: '💰' },
        { name: '市场营销专家', description: '品牌推广和营销策略制定', avatar: '📢' }
      ]

      // 教育学习类补充
      const educationAssistants = [
        { name: '英语老师', description: '英语语法教学和口语练习指导', avatar: '🇬🇧' },
        { name: '历史学者', description: '历史知识讲解和史料分析', avatar: '🏛️' },
        { name: '物理导师', description: '物理概念解释和实验指导', avatar: '⚛️' },
        { name: '化学助教', description: '化学反应原理和实验安全指导', avatar: '🧪' },
        { name: '生物老师', description: '生物知识讲解和实验观察', avatar: '🔬' },
        { name: '地理导师', description: '地理知识和地图分析教学', avatar: '🌍' }
      ]

      // 创意设计类补充
      const creativeAssistants = [
        { name: '平面设计师', description: '海报、logo和品牌视觉设计', avatar: '🎨' },
        { name: '摄影指导', description: '摄影技巧和后期处理建议', avatar: '📸' },
        { name: '视频编辑师', description: '视频剪辑和特效制作指导', avatar: '🎬' },
        { name: '音乐制作人', description: '音乐创作和制作技巧指导', avatar: '🎵' },
        { name: '游戏设计师', description: '游戏玩法和关卡设计', avatar: '🎮' }
      ]

      // 其他类别助手
      const otherAssistants = [
        { name: '健康顾问', description: '健康生活方式和营养建议', category: 'health', avatar: '❤️' },
        { name: '心理咨询师', description: '心理健康指导和情绪管理', category: 'health', avatar: '🧠' },
        { name: '旅行规划师', description: '旅行路线规划和攻略制定', category: 'entertainment', avatar: '✈️' },
        { name: '美食评论家', description: '美食推荐和烹饪技巧分享', category: 'entertainment', avatar: '🍽️' },
        { name: '法律顾问', description: '法律条文解释和案例分析', category: 'business', avatar: '⚖️' },
        { name: '环保专家', description: '环保知识和可持续发展建议', category: 'research', avatar: '🌱' },
        { name: '科技趋势分析师', description: '新兴技术趋势分析和预测', category: 'research', avatar: '🔮' }
      ]

      // 生成助手数据
      const allNewAssistants = [
        ...writingAssistants.map(a => ({ ...a, category: 'writing' })),
        ...codingAssistants.map(a => ({ ...a, category: 'coding' })),
        ...businessAssistants.map(a => ({ ...a, category: 'business' })),
        ...educationAssistants.map(a => ({ ...a, category: 'education' })),
        ...creativeAssistants.map(a => ({ ...a, category: 'creative' })),
        ...otherAssistants
      ]

      allNewAssistants.forEach((assistant, index) => {
        additionalAssistants.push({
          id: `assistant-${index + 11}`,
          name: assistant.name,
          description: assistant.description,
          category: assistant.category,
          tags: assistant.name.split(' ').concat(['AI助手']),
          prompt: `你是一位专业的${assistant.name}，具有丰富的相关经验和专业知识。请根据用户需求提供专业、实用的建议和解决方案。`,
          avatar: assistant.avatar,
          author: 'AI Studio',
          isOfficial: true,
          downloads: Math.floor(Math.random() * 15000) + 1000,
          rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
          usageCount: Math.floor(Math.random() * 500),
          isFavorite: Math.random() > 0.8,
          isBuiltIn: true,
          language: 'zh-CN',
          model: ['gpt-4', 'claude-3-sonnet', 'gemini-pro'][Math.floor(Math.random() * 3)],
          temperature: Math.round((Math.random() * 0.8 + 0.2) * 10) / 10,
          maxTokens: Math.floor(Math.random() * 2000) + 1000,
          examples: [
            `使用${assistant.name}解决问题`,
            `获得${assistant.name}专业建议`,
            `${assistant.name}最佳实践`
          ],
          createdAt: Date.now() - Math.floor(Math.random() * 86400000 * 60),
          updatedAt: Date.now() - Math.floor(Math.random() * 86400000 * 7)
        })
      })

      return additionalAssistants
    }

    const allAssistants = [...preConfiguredAssistants, ...generateMoreAssistants()]
    setAssistants(allAssistants)

    // 更新分类计数
    categories.forEach(category => {
      if (category.id === 'all') {
        category.count = allAssistants.length
      } else {
        category.count = allAssistants.filter(a => a.category === category.id).length
      }
    })
  }, [])

  const getFilteredAssistants = () => {
    let filtered = assistants

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(assistant => assistant.category === selectedCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter(assistant =>
        assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assistant.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assistant.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // 排序
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.downloads - a.downloads)
        break
      case 'newest':
        filtered.sort((a, b) => b.createdAt - a.createdAt)
        break
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating)
        break
      case 'alphabetical':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
    }

    return filtered
  }

  const handleToggleFavorite = (assistantId: string) => {
    setAssistants(prev =>
      prev.map(assistant =>
        assistant.id === assistantId
          ? { ...assistant, isFavorite: !assistant.isFavorite }
          : assistant
      )
    )
  }

  const handleUseAssistant = (assistant: AIAssistant) => {
    // 模拟使用助手
    setAssistants(prev =>
      prev.map(a =>
        a.id === assistant.id
          ? { ...a, usageCount: a.usageCount + 1, lastUsed: Date.now() }
          : a
      )
    )
    // 这里可以集成到主聊天界面
    console.log('使用助手:', assistant.name)
  }

  const AssistantCard: React.FC<{ assistant: AIAssistant }> = ({ assistant }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl">
            {assistant.avatar}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {assistant.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {assistant.author} {assistant.isOfficial && '✓'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleToggleFavorite(assistant.id)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {assistant.isFavorite ? (
              <StarSolidIcon className="w-5 h-5 text-yellow-400" />
            ) : (
              <StarIcon className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <EllipsisVerticalIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
        {assistant.description}
      </p>

      <div className="flex flex-wrap gap-1 mb-4">
        {assistant.tags.slice(0, 3).map(tag => (
          <span
            key={tag}
            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
        {assistant.tags.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
            +{assistant.tags.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <StarIcon className="w-4 h-4 text-yellow-400" />
            <span>{assistant.rating}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>{assistant.downloads.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <PlayIcon className="w-4 h-4" />
            <span>{assistant.usageCount}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => handleUseAssistant(assistant)}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <PlayIcon className="w-4 h-4" />
          <span>使用助手</span>
        </button>
        <button
          onClick={() => {
            setSelectedAssistant(assistant)
            setShowDetails(true)
          }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          详情
        </button>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI助手库
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            发现和使用300+专业AI助手，涵盖各行各业的专业需求
          </p>
        </div>

        {/* 搜索和筛选 */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索AI助手..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="popular">最受欢迎</option>
                <option value="newest">最新发布</option>
                <option value="rating">评分最高</option>
                <option value="alphabetical">按名称排序</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FunnelIcon className="w-4 h-4" />
                <span>筛选</span>
              </button>
            </div>
          </div>

          {/* 分类标签 */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
                <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 助手卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {getFilteredAssistants().map(assistant => (
              <AssistantCard key={assistant.id} assistant={assistant} />
            ))}
          </AnimatePresence>
        </div>

        {getFilteredAssistants().length === 0 && (
          <div className="text-center py-12">
            <UserPlusIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              未找到匹配的助手
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              尝试调整搜索条件或选择其他分类
            </p>
          </div>
        )}

        {/* 助手详情模态框 */}
        <AnimatePresence>
          {showDetails && selectedAssistant && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowDetails(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-3xl">
                        {selectedAssistant.avatar}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedAssistant.name}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                          {selectedAssistant.author} {selectedAssistant.isOfficial && '✓'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        描述
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedAssistant.description}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        使用示例
                      </h3>
                      <div className="space-y-2">
                        {selectedAssistant.examples.map((example, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-gray-600 dark:text-gray-400">{example}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">统计信息</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">评分:</span>
                            <span>{selectedAssistant.rating}/5</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">下载量:</span>
                            <span>{selectedAssistant.downloads.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">使用次数:</span>
                            <span>{selectedAssistant.usageCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">技术信息</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">模型:</span>
                            <span>{selectedAssistant.model}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">温度:</span>
                            <span>{selectedAssistant.temperature}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">最大Token:</span>
                            <span>{selectedAssistant.maxTokens}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => {
                          handleUseAssistant(selectedAssistant)
                          setShowDetails(false)
                        }}
                        className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        使用此助手
                      </button>
                      <button
                        onClick={() => handleToggleFavorite(selectedAssistant.id)}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {selectedAssistant.isFavorite ? '取消收藏' : '收藏'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AIAssistantLibrary
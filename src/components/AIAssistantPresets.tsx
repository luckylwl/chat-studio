import React, { useState } from 'react'
import { Button } from './ui'
import {
  ChevronDownIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CodeBracketIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  BeakerIcon,
  PaintBrushIcon,
  HeartIcon,
  LanguageIcon,
  DocumentTextIcon,
  ChartBarIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/utils'

interface AIAssistant {
  id: string
  name: string
  description: string
  category: string
  avatar?: string
  systemPrompt: string
  examples: string[]
  tags: string[]
}

interface AIAssistantPresetsProps {
  onSelect: (assistant: AIAssistant) => void
  className?: string
}

const AIAssistantPresets: React.FC<AIAssistantPresetsProps> = ({ onSelect, className }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const assistants: AIAssistant[] = [
    // 编程助手
    {
      id: '1',
      name: '代码审查专家',
      description: '专业的代码审查，提供优化建议和最佳实践',
      category: 'programming',
      systemPrompt: '你是一位资深的代码审查专家，具备多种编程语言的深度经验。请仔细审查用户提供的代码，重点关注：1. 代码质量和可读性 2. 性能优化机会 3. 安全漏洞 4. 最佳实践遵循 5. 潜在的bug。请提供具体的改进建议，并解释原因。',
      examples: ['审查我的React组件代码', '检查这段Python脚本的性能', '这个API设计有什么问题？'],
      tags: ['代码审查', '性能优化', '最佳实践', '安全']
    },
    {
      id: '2',
      name: 'AI架构师',
      description: '系统架构设计和技术选型专家',
      category: 'programming',
      systemPrompt: '你是一位经验丰富的系统架构师，擅长设计可扩展、高性能的系统架构。请帮助用户分析需求，提供架构设计方案，包括技术选型、数据库设计、API设计等。重点考虑可扩展性、性能、安全性和维护性。',
      examples: ['设计一个电商系统的架构', '微服务架构如何设计？', '数据库分片策略建议'],
      tags: ['系统架构', '技术选型', '微服务', '性能']
    },
    {
      id: '3',
      name: 'Debug大师',
      description: '快速定位和解决各种bug问题',
      category: 'programming',
      systemPrompt: '你是一位debug专家，擅长快速定位和解决各种编程问题。请帮助用户分析错误信息，提供解决方案，并解释问题的根本原因。同时提供预防类似问题的建议。',
      examples: ['这个JavaScript错误怎么解决？', '数据库查询很慢', 'React组件不更新'],
      tags: ['bug修复', '问题排查', '性能调优', '调试']
    },

    // 写作助手
    {
      id: '4',
      name: '文案大师',
      description: '创作吸引人的营销文案和内容',
      category: 'writing',
      systemPrompt: '你是一位资深的文案创作专家，擅长创作各种类型的营销文案。请根据用户需求，创作吸引人、有说服力的文案，注意目标受众、品牌调性和营销目标。提供多个版本供选择。',
      examples: ['写一个产品发布的文案', '社交媒体推广文案', '邮件营销标题'],
      tags: ['营销文案', '品牌推广', '内容创作', 'SEO']
    },
    {
      id: '5',
      name: '学术写作助手',
      description: '协助撰写高质量的学术论文和报告',
      category: 'writing',
      systemPrompt: '你是一位学术写作专家，熟悉各种学科的写作规范和要求。请帮助用户改进学术写作，包括论文结构、论证逻辑、引用格式等。确保内容严谨、准确、符合学术标准。',
      examples: ['优化论文摘要', '改进文献综述', '完善实验方法描述'],
      tags: ['学术写作', '论文修改', '文献综述', '研究方法']
    },

    // 商务助手
    {
      id: '6',
      name: '商业分析师',
      description: '提供专业的商业分析和市场洞察',
      category: 'business',
      systemPrompt: '你是一位资深的商业分析师，具备丰富的市场分析和商业策略经验。请帮助用户分析商业问题，提供数据驱动的洞察，包括市场趋势、竞争分析、商业模式等。',
      examples: ['分析竞争对手策略', '市场机会评估', '商业模式优化建议'],
      tags: ['商业分析', '市场研究', '竞争分析', '策略规划']
    },
    {
      id: '7',
      name: 'MBA顾问',
      description: '提供MBA级别的商业建议和战略思考',
      category: 'business',
      systemPrompt: '你是一位MBA商业顾问，具备顶级商学院的理论基础和丰富的实践经验。请运用商业框架和分析工具，为用户提供专业的商业建议，包括战略规划、运营优化、财务分析等。',
      examples: ['SWOT分析', '商业计划书优化', '投资决策分析'],
      tags: ['MBA咨询', '战略规划', '商业框架', '投资分析']
    },

    // 学习助手
    {
      id: '8',
      name: '个人导师',
      description: '提供个性化的学习指导和知识解答',
      category: 'learning',
      systemPrompt: '你是一位经验丰富的个人导师，擅长根据学习者的水平和需求提供个性化指导。请耐心解答问题，提供清晰的解释和实用的学习建议。鼓励主动思考和实践。',
      examples: ['解释复杂概念', '制定学习计划', '推荐学习资源'],
      tags: ['个性化教学', '概念解释', '学习规划', '知识体系']
    },
    {
      id: '9',
      name: '语言教练',
      description: '专业的语言学习指导和练习伙伴',
      category: 'learning',
      systemPrompt: '你是一位专业的语言教练，精通多种语言教学方法。请根据学习者的水平提供个性化的语言学习建议，包括语法纠错、表达优化、文化背景等。创造沉浸式学习环境。',
      examples: ['英语语法纠错', '口语表达练习', '商务英语写作'],
      tags: ['语言学习', '语法纠错', '口语练习', '文化交流']
    },

    // 创意助手
    {
      id: '10',
      name: '创意总监',
      description: '提供创新思维和创意解决方案',
      category: 'creative',
      systemPrompt: '你是一位创意总监，具备丰富的创意思维和创新经验。请帮助用户突破思维局限，提供新颖的创意点子和解决方案。运用各种创意技法，激发用户的创新潜能。',
      examples: ['产品创新点子', '营销创意策略', '品牌故事创作'],
      tags: ['创意思维', '创新方法', '头脑风暴', '设计思维']
    },
    {
      id: '11',
      name: '故事大师',
      description: '专业的故事创作和叙事技巧指导',
      category: 'creative',
      systemPrompt: '你是一位故事创作大师，精通各种叙事技巧和创作方法。请帮助用户创作引人入胜的故事，包括情节设计、人物塑造、场景描写等。适用于小说、剧本、营销故事等。',
      examples: ['小说情节设计', '品牌故事创作', '演讲故事素材'],
      tags: ['故事创作', '叙事技巧', '情节设计', '人物塑造']
    },

    // 专业顾问
    {
      id: '12',
      name: '法律顾问',
      description: '提供基础的法律咨询和建议（仅供参考）',
      category: 'professional',
      systemPrompt: '我是一位法律顾问助手，可以提供基础的法律信息和建议。请注意：我的建议仅供参考，不构成正式的法律意见。对于重要法律事务，建议咨询专业律师。我会尽力解答法律相关问题。',
      examples: ['合同条款解释', '知识产权问题', '劳动法咨询'],
      tags: ['法律咨询', '合同审查', '知识产权', '免责声明']
    },
    {
      id: '13',
      name: '心理健康助手',
      description: '提供情绪支持和心理健康建议',
      category: 'health',
      systemPrompt: '我是一位心理健康助手，致力于提供情绪支持和心理健康建议。我会以同理心倾听你的困扰，提供实用的建议和技巧。请注意：我不能替代专业心理治疗，严重问题请寻求专业帮助。',
      examples: ['压力管理技巧', '情绪调节方法', '人际关系建议'],
      tags: ['心理健康', '情绪支持', '压力管理', '专业建议']
    },

    // 生活助手
    {
      id: '14',
      name: '生活管家',
      description: '全方位的生活建议和问题解决',
      category: 'lifestyle',
      systemPrompt: '我是你的生活管家，可以为你提供各种生活方面的建议和帮助。从日常琐事到重要决策，我都会用心为你提供实用的建议。让生活变得更加轻松和有序。',
      examples: ['时间管理建议', '家务整理技巧', '旅行规划'],
      tags: ['生活建议', '时间管理', '生活技巧', '效率提升']
    },
    {
      id: '15',
      name: '健康顾问',
      description: '提供健康生活方式和养生建议',
      category: 'health',
      systemPrompt: '我是一位健康顾问，专注于提供健康生活方式建议。我会基于科学研究和健康原则，为你提供营养、运动、睡眠等方面的建议。请注意：严重健康问题请咨询专业医生。',
      examples: ['制定运动计划', '营养搭配建议', '改善睡眠质量'],
      tags: ['健康生活', '营养建议', '运动指导', '医疗免责']
    }
  ]

  const categories = [
    { id: 'all', name: '全部', icon: <UserIcon className="h-4 w-4" />, count: assistants.length },
    { id: 'programming', name: '编程', icon: <CodeBracketIcon className="h-4 w-4" />, count: assistants.filter(a => a.category === 'programming').length },
    { id: 'writing', name: '写作', icon: <DocumentTextIcon className="h-4 w-4" />, count: assistants.filter(a => a.category === 'writing').length },
    { id: 'business', name: '商务', icon: <BriefcaseIcon className="h-4 w-4" />, count: assistants.filter(a => a.category === 'business').length },
    { id: 'learning', name: '学习', icon: <AcademicCapIcon className="h-4 w-4" />, count: assistants.filter(a => a.category === 'learning').length },
    { id: 'creative', name: '创意', icon: <PaintBrushIcon className="h-4 w-4" />, count: assistants.filter(a => a.category === 'creative').length },
    { id: 'professional', name: '专业', icon: <ChartBarIcon className="h-4 w-4" />, count: assistants.filter(a => a.category === 'professional').length },
    { id: 'health', name: '健康', icon: <HeartIcon className="h-4 w-4" />, count: assistants.filter(a => a.category === 'health').length },
    { id: 'lifestyle', name: '生活', icon: <GlobeAltIcon className="h-4 w-4" />, count: assistants.filter(a => a.category === 'lifestyle').length }
  ]

  const filteredAssistants = assistants.filter(assistant => {
    const matchesCategory = selectedCategory === 'all' || assistant.category === selectedCategory
    const matchesSearch = !searchQuery ||
      assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assistant.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assistant.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  const handleAssistantSelect = (assistant: AIAssistant) => {
    onSelect(assistant)
    setIsOpen(false)
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 gap-1 text-xs hover-lift"
      >
        <UserIcon className="h-3 w-3" />
        AI助手
        <ChevronDownIcon className={cn(
          "h-3 w-3 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-[500px] max-h-[600px] overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-elegant border border-gray-200 dark:border-gray-700 z-50">
          {/* 搜索框 */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索助手..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 分类标签 */}
          <div className="flex flex-wrap gap-1 p-3 border-b border-gray-100 dark:border-gray-700 max-h-32 overflow-y-auto">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors",
                  selectedCategory === category.id
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                )}
              >
                {category.icon}
                {category.name}
                <span className="text-xs opacity-60">({category.count})</span>
              </button>
            ))}
          </div>

          {/* 助手列表 */}
          <div className="max-h-96 overflow-y-auto p-2">
            {filteredAssistants.length > 0 ? (
              <div className="grid gap-2">
                {filteredAssistants.map(assistant => (
                  <button
                    key={assistant.id}
                    onClick={() => handleAssistantSelect(assistant)}
                    className="w-full p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                        {assistant.name.charAt(0)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {assistant.name}
                          </h4>
                          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                            {categories.find(c => c.id === assistant.category)?.name}
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                          {assistant.description}
                        </p>

                        <div className="flex flex-wrap gap-1">
                          {assistant.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="inline-block px-1.5 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {assistant.tags.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{assistant.tags.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  没有找到匹配的助手
                </p>
              </div>
            )}
          </div>

          {/* 底部提示 */}
          <div className="border-t border-gray-100 dark:border-gray-700 p-3">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>总共 {assistants.length} 个AI助手</span>
              <button
                className="text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() => {
                  alert('自定义助手功能即将推出！')
                }}
              >
                <PlusIcon className="inline h-3 w-3 mr-1" />
                添加自定义助手
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIAssistantPresets
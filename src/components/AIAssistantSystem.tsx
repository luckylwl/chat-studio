import React, { useState, useEffect } from 'react'
import { useAppStore } from '@/store'
import { Button, Input } from './ui'
import { cn } from '@/utils'
import {
  SparklesIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  AcademicCapIcon,
  HeartIcon,
  MusicalNoteIcon,
  ChatBubbleOvalLeftEllipsisIcon
} from '@heroicons/react/24/outline'

interface AIAssistant {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  specialties: string[]
  prompt: string
  color: string
  badge?: string
}

const aiAssistants: AIAssistant[] = [
  {
    id: 'general',
    name: '通用助手',
    description: '全能AI助手，可以帮助解决各种问题',
    icon: SparklesIcon,
    specialties: ['问答', '分析', '建议', '创意'],
    prompt: '你是一个专业、友好的AI助手，能够帮助用户解决各种问题。请提供准确、有用的信息和建议。',
    color: 'blue'
  },
  {
    id: 'programmer',
    name: '编程专家',
    description: '专业的编程和技术开发助手',
    icon: CodeBracketIcon,
    specialties: ['编程', '调试', '架构设计', '代码review'],
    prompt: '你是一位资深的软件工程师和编程专家，擅长多种编程语言和技术栈。请提供专业的技术建议、代码示例和最佳实践。',
    color: 'green',
    badge: 'Pro'
  },
  {
    id: 'writer',
    name: '写作助手',
    description: '专业的文案创作和写作指导',
    icon: DocumentTextIcon,
    specialties: ['写作', '文案', '润色', '翻译'],
    prompt: '你是一位专业的写作专家，擅长各种文体的创作和编辑。请帮助用户提升写作质量，提供创意灵感和语言优化建议。',
    color: 'purple'
  },
  {
    id: 'teacher',
    name: '学习导师',
    description: '专业的教学和学习指导助手',
    icon: AcademicCapIcon,
    specialties: ['教学', '解题', '知识梳理', '学习计划'],
    prompt: '你是一位经验丰富的教育专家，善于解释复杂概念，制定学习计划。请用循序渐进的方式帮助用户学习和理解知识。',
    color: 'orange'
  },
  {
    id: 'counselor',
    name: '心理顾问',
    description: '情感支持和心理健康指导',
    icon: HeartIcon,
    specialties: ['情感支持', '心理分析', '减压建议', '生活指导'],
    prompt: '你是一位专业的心理健康顾问，具有同理心和专业知识。请提供温暖的支持、实用的建议，帮助用户处理情感问题和心理压力。',
    color: 'pink',
    badge: 'New'
  },
  {
    id: 'creative',
    name: '创意大师',
    description: '艺术创作和创意设计指导',
    icon: MusicalNoteIcon,
    specialties: ['创意设计', '艺术指导', '灵感启发', '视觉创作'],
    prompt: '你是一位充满创意的艺术家和设计师，擅长激发灵感和提供创新想法。请帮助用户探索创意可能性，提供艺术指导和设计建议。',
    color: 'indigo'
  },
  {
    id: 'business',
    name: '商业顾问',
    description: '商业策略和管理咨询专家',
    icon: UserGroupIcon,
    specialties: ['商业策略', '市场分析', '管理咨询', '创业指导'],
    prompt: '你是一位经验丰富的商业顾问，熟悉市场分析、战略规划和企业管理。请提供专业的商业洞察和实用的管理建议。',
    color: 'yellow'
  }
]

const AIAssistantSystem: React.FC = () => {
  const [selectedAssistant, setSelectedAssistant] = useState<AIAssistant | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const { setSystemPrompt, systemPrompt } = useAppStore()

  const handleSelectAssistant = (assistant: AIAssistant) => {
    setSelectedAssistant(assistant)
    setSystemPrompt(assistant.prompt)
    setCustomPrompt('')
  }

  const handleCustomPrompt = () => {
    if (customPrompt.trim()) {
      setSystemPrompt(customPrompt.trim())
      setSelectedAssistant(null)
    }
  }

  const handleClearPrompt = () => {
    setSystemPrompt('')
    setSelectedAssistant(null)
    setCustomPrompt('')
  }

  const getColorClasses = (color: string, isSelected: boolean = false) => {
    const colorMap = {
      blue: isSelected
        ? 'bg-blue-500 text-white border-blue-500'
        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30',
      green: isSelected
        ? 'bg-green-500 text-white border-green-500'
        : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30',
      purple: isSelected
        ? 'bg-purple-500 text-white border-purple-500'
        : 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30',
      orange: isSelected
        ? 'bg-orange-500 text-white border-orange-500'
        : 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30',
      pink: isSelected
        ? 'bg-pink-500 text-white border-pink-500'
        : 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900/30',
      indigo: isSelected
        ? 'bg-indigo-500 text-white border-indigo-500'
        : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
      yellow: isSelected
        ? 'bg-yellow-500 text-white border-yellow-500'
        : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
          <ChatBubbleOvalLeftEllipsisIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">AI助手系统</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">选择专业AI助手或自定义角色提示词</p>
        </div>
      </div>

      {/* Current System Prompt */}
      {systemPrompt && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">当前系统角色</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {systemPrompt}
              </p>
            </div>
            <Button
              onClick={handleClearPrompt}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              清除
            </Button>
          </div>
        </div>
      )}

      {/* Assistant Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">专业AI助手</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {aiAssistants.map((assistant) => {
            const Icon = assistant.icon
            const isSelected = selectedAssistant?.id === assistant.id

            return (
              <button
                key={assistant.id}
                onClick={() => handleSelectAssistant(assistant)}
                className={cn(
                  'p-4 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md',
                  getColorClasses(assistant.color, isSelected)
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className="h-6 w-6 flex-shrink-0" />
                  {assistant.badge && (
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      isSelected
                        ? 'bg-white/20 text-white'
                        : assistant.badge === 'Pro'
                          ? 'bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/50 dark:to-blue-900/50 text-purple-700 dark:text-purple-300'
                          : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                    )}>
                      {assistant.badge}
                    </span>
                  )}
                </div>

                <h4 className="font-medium mb-2">{assistant.name}</h4>
                <p className={cn(
                  'text-xs mb-3 line-clamp-2',
                  isSelected ? 'text-white/90' : 'opacity-75'
                )}>
                  {assistant.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  {assistant.specialties.slice(0, 2).map((specialty) => (
                    <span
                      key={specialty}
                      className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-white/50 dark:bg-black/10'
                      )}
                    >
                      {specialty}
                    </span>
                  ))}
                  {assistant.specialties.length > 2 && (
                    <span className={cn(
                      'px-2 py-1 text-xs rounded-full',
                      isSelected ? 'bg-white/20 text-white' : 'bg-white/50 dark:bg-black/10'
                    )}>
                      +{assistant.specialties.length - 2}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Custom Prompt */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">自定义角色</h3>
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="描述你想要的AI助手角色和特点，例如：你是一位专业的产品经理，擅长需求分析和产品规划..."
              className="w-full min-h-[120px] p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {customPrompt.length}/500
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCustomPrompt}
              disabled={!customPrompt.trim()}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
            >
              应用自定义角色
            </Button>
            <Button
              onClick={() => setCustomPrompt('')}
              variant="outline"
              disabled={!customPrompt}
            >
              清空
            </Button>
          </div>
        </div>
      </div>

      {/* Usage Tips */}
      <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <SparklesIcon className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">使用提示</h4>
            <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
              <li>• 选择专业助手后，AI将根据该角色的专业知识回答问题</li>
              <li>• 自定义角色让你可以创建独特的AI助手，满足特定需求</li>
              <li>• 系统角色会影响整个对话会话，建议在开始新对话时设置</li>
              <li>• 可以随时更换角色或清除设置，恢复默认模式</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIAssistantSystem
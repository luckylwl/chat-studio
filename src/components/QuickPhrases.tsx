import React, { useState } from 'react'
import { Button } from './ui'
import {
  ChevronDownIcon,
  PlusIcon,
  BookmarkIcon,
  SparklesIcon,
  CodeBracketIcon,
  AcademicCapIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/utils'

interface QuickPhrase {
  id: string
  title: string
  content: string
  category: string
  variables?: string[]
}

interface QuickPhrasesProps {
  onInsert: (text: string) => void
  className?: string
}

const QuickPhrases: React.FC<QuickPhrasesProps> = ({ onInsert, className }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')

  const defaultPhrases: QuickPhrase[] = [
    // 写作助手
    {
      id: '1',
      title: '总结文档',
      content: '请帮我总结以下内容的要点：\n\n{{content}}',
      category: 'writing',
      variables: ['content']
    },
    {
      id: '2',
      title: '润色文本',
      content: '请帮我润色以下文字，使其更加专业和流畅：\n\n{{text}}',
      category: 'writing',
      variables: ['text']
    },
    {
      id: '3',
      title: '写邮件',
      content: '请帮我写一封关于{{topic}}的专业邮件，收件人是{{recipient}}。',
      category: 'writing',
      variables: ['topic', 'recipient']
    },

    // 编程助手
    {
      id: '4',
      title: '代码审查',
      content: '请审查以下代码，指出可能的问题和改进建议：\n\n```{{language}}\n{{code}}\n```',
      category: 'coding',
      variables: ['language', 'code']
    },
    {
      id: '5',
      title: '解释代码',
      content: '请详细解释以下代码的功能和实现原理：\n\n```{{language}}\n{{code}}\n```',
      category: 'coding',
      variables: ['language', 'code']
    },
    {
      id: '6',
      title: '优化代码',
      content: '请优化以下代码的性能和可读性：\n\n```{{language}}\n{{code}}\n```',
      category: 'coding',
      variables: ['language', 'code']
    },

    // 学习助手
    {
      id: '7',
      title: '解释概念',
      content: '请详细解释{{concept}}的概念，包括定义、应用场景和实例。',
      category: 'learning',
      variables: ['concept']
    },
    {
      id: '8',
      title: '学习计划',
      content: '请为我制定一个学习{{subject}}的详细计划，包括时间安排和学习资源推荐。',
      category: 'learning',
      variables: ['subject']
    },

    // 商务助手
    {
      id: '9',
      title: 'SWOT分析',
      content: '请对{{company_or_project}}进行SWOT分析，包括优势、劣势、机会和威胁。',
      category: 'business',
      variables: ['company_or_project']
    },
    {
      id: '10',
      title: '会议纪要',
      content: '请帮我整理以下会议内容的纪要：\n\n会议主题：{{topic}}\n参与人员：{{participants}}\n主要讨论：{{discussion}}',
      category: 'business',
      variables: ['topic', 'participants', 'discussion']
    },

    // 创意助手
    {
      id: '11',
      title: '头脑风暴',
      content: '关于{{topic}}，请提供10个创新的想法或解决方案。',
      category: 'creative',
      variables: ['topic']
    },
    {
      id: '12',
      title: '故事创作',
      content: '请写一个关于{{theme}}的{{length}}字故事，风格：{{style}}',
      category: 'creative',
      variables: ['theme', 'length', 'style']
    }
  ]

  const categories = [
    { id: 'all', name: '全部', icon: <BookmarkIcon className="h-4 w-4" /> },
    { id: 'writing', name: '写作', icon: <SparklesIcon className="h-4 w-4" /> },
    { id: 'coding', name: '编程', icon: <CodeBracketIcon className="h-4 w-4" /> },
    { id: 'learning', name: '学习', icon: <AcademicCapIcon className="h-4 w-4" /> },
    { id: 'business', name: '商务', icon: <BriefcaseIcon className="h-4 w-4" /> },
    { id: 'creative', name: '创意', icon: <SparklesIcon className="h-4 w-4" /> },
  ]

  const filteredPhrases = selectedCategory === 'all'
    ? defaultPhrases
    : defaultPhrases.filter(phrase => phrase.category === selectedCategory)

  const handlePhraseSelect = (phrase: QuickPhrase) => {
    let content = phrase.content

    // 处理变量替换
    if (phrase.variables && phrase.variables.length > 0) {
      phrase.variables.forEach(variable => {
        const placeholder = `{{${variable}}}`
        const userInput = prompt(`请输入${variable}:`) || `[${variable}]`
        content = content.replace(new RegExp(placeholder, 'g'), userInput)
      })
    }

    onInsert(content)
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
        <BookmarkIcon className="h-3 w-3" />
        快速短语
        <ChevronDownIcon className={cn(
          "h-3 w-3 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-96 max-h-96 overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-elegant border border-gray-200 dark:border-gray-700 z-50">
          {/* 分类标签 */}
          <div className="flex flex-wrap gap-1 p-3 border-b border-gray-100 dark:border-gray-700">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors",
                  selectedCategory === category.id
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                )}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>

          {/* 短语列表 */}
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredPhrases.map(phrase => (
              <button
                key={phrase.id}
                onClick={() => handlePhraseSelect(phrase)}
                className="w-full p-3 text-left rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {phrase.title}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {phrase.content.substring(0, 60)}...
                </div>
                {phrase.variables && phrase.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {phrase.variables.map(variable => (
                      <span
                        key={variable}
                        className="inline-block px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                      >
                        {variable}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* 添加自定义短语按钮 */}
          <div className="border-t border-gray-100 dark:border-gray-700 p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-xs"
              onClick={() => {
                // TODO: 实现自定义短语添加功能
                alert('自定义短语功能即将推出！')
              }}
            >
              <PlusIcon className="h-3 w-3" />
              添加自定义短语
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuickPhrases
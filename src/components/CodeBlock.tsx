import React, { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  ClipboardDocumentIcon,
  CheckIcon,
  PlayIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { useAppStore } from '@/store'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils'

interface CodeBlockProps {
  children: string
  language?: string
  filename?: string
  showLineNumbers?: boolean
  className?: string
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  language = 'javascript',
  filename,
  showLineNumbers = true,
  className
}) => {
  const [copied, setCopied] = useState(false)
  const { theme } = useAppStore()

  // Determine if we should use dark or light theme
  const isDark = theme === 'dark' || (theme === 'system' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches)

  const codeStyle = isDark ? oneDark : oneLight

  // Language mapping for better display names
  const languageNames: Record<string, string> = {
    'js': 'JavaScript',
    'jsx': 'React JSX',
    'ts': 'TypeScript',
    'tsx': 'React TSX',
    'py': 'Python',
    'java': 'Java',
    'cpp': 'C++',
    'c': 'C',
    'cs': 'C#',
    'php': 'PHP',
    'rb': 'Ruby',
    'go': 'Go',
    'rs': 'Rust',
    'swift': 'Swift',
    'kt': 'Kotlin',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'less': 'LESS',
    'sql': 'SQL',
    'json': 'JSON',
    'xml': 'XML',
    'yaml': 'YAML',
    'md': 'Markdown',
    'sh': 'Shell',
    'bash': 'Bash',
    'zsh': 'Zsh',
    'powershell': 'PowerShell',
    'dockerfile': 'Dockerfile',
    'nginx': 'Nginx',
    'apache': 'Apache',
    'makefile': 'Makefile'
  }

  const getLanguageDisplayName = (lang: string): string => {
    return languageNames[lang.toLowerCase()] || lang.toUpperCase()
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      toast.success('代码已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
      toast.error('复制失败')
    }
  }

  const handleRun = () => {
    // This would integrate with a code execution service
    toast.info('代码执行功能开发中...')
  }

  const handleCreateSnippet = () => {
    // This would save the code as a reusable snippet
    toast.info('代码片段功能开发中...')
  }

  // Check if the language is executable (for demo purposes)
  const isExecutable = ['javascript', 'js', 'python', 'py', 'node'].includes(language.toLowerCase())

  return (
    <div className={cn("relative group", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 text-gray-300 text-sm rounded-t-lg">
        <div className="flex items-center gap-2">
          {filename && (
            <span className="font-medium">{filename}</span>
          )}
          <span className="px-2 py-0.5 bg-gray-700 dark:bg-gray-800 rounded text-xs">
            {getLanguageDisplayName(language)}
          </span>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isExecutable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRun}
              className="h-7 px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700"
              title="运行代码"
            >
              <PlayIcon className="h-3 w-3" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCreateSnippet}
            className="h-7 px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700"
            title="保存为代码片段"
          >
            <DocumentDuplicateIcon className="h-3 w-3" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs text-gray-300 hover:text-white hover:bg-gray-700"
            title="复制代码"
          >
            {copied ? (
              <>
                <CheckIcon className="h-3 w-3" />
                <span className="ml-1">已复制</span>
              </>
            ) : (
              <>
                <ClipboardDocumentIcon className="h-3 w-3" />
                <span className="ml-1">复制</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Code Content */}
      <div className="relative overflow-hidden rounded-b-lg">
        <SyntaxHighlighter
          language={language}
          style={codeStyle}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            backgroundColor: isDark ? '#1f2937' : '#f8fafc'
          }}
          codeTagProps={{
            style: {
              fontSize: '0.875rem',
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
            }
          }}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: isDark ? '#6b7280' : '#9ca3af',
            backgroundColor: 'transparent'
          }}
        >
          {children.trim()}
        </SyntaxHighlighter>

        {/* Copy overlay for mobile */}
        <div className="absolute top-2 right-2 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-8 w-8 p-0 bg-black/20 backdrop-blur-sm text-white hover:bg-black/40"
          >
            {copied ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <ClipboardDocumentIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Footer with code stats */}
      <div className="px-4 py-1 bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span>
            {children.trim().split('\n').length} 行 · {children.length} 字符
          </span>
          <div className="flex items-center gap-2">
            {filename && (
              <span className="opacity-70">{filename}</span>
            )}
            <span className="opacity-70">UTF-8</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodeBlock
import React from 'react'

interface SkipLink {
  id: string
  label: string
  targetId: string
}

const defaultSkipLinks: SkipLink[] = [
  { id: 'skip-to-main', label: '跳转到主要内容', targetId: 'main-content' },
  { id: 'skip-to-chat', label: '跳转到对话区域', targetId: 'chat-messages' },
  { id: 'skip-to-input', label: '跳转到输入框', targetId: 'chat-input' },
  { id: 'skip-to-sidebar', label: '跳转到侧边栏', targetId: 'sidebar' },
  { id: 'skip-to-settings', label: '跳转到设置', targetId: 'settings' },
]

interface SkipLinksProps {
  links?: SkipLink[]
  className?: string
}

/**
 * 跳转链接组件
 * 为键盘用户提供快速导航到页面主要区域的能力
 */
const SkipLinks: React.FC<SkipLinksProps> = ({
  links = defaultSkipLinks,
  className = '',
}) => {
  const handleSkip = (targetId: string) => {
    const target = document.getElementById(targetId)
    if (target) {
      target.focus()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav
      aria-label="跳转导航"
      className={`skip-links ${className}`}
    >
      <ul className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-4 focus-within:left-4 focus-within:z-[9999] focus-within:flex focus-within:flex-col focus-within:gap-2 focus-within:bg-white focus-within:dark:bg-gray-800 focus-within:p-4 focus-within:rounded-lg focus-within:shadow-2xl focus-within:border focus-within:border-gray-200 focus-within:dark:border-gray-700">
        {links.map((link) => (
          <li key={link.id}>
            <a
              href={`#${link.targetId}`}
              onClick={(e) => {
                e.preventDefault()
                handleSkip(link.targetId)
              }}
              className="block px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default SkipLinks
export type { SkipLink }

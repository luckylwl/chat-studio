import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

// ChatMessage component (example implementation)
interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
  model?: string
  tokens?: number
  isStreaming?: boolean
  onCopy?: () => void
  onRegenerate?: () => void
  onDelete?: () => void
}

const ChatMessage = ({
  role,
  content,
  timestamp,
  model,
  tokens,
  isStreaming = false,
  onCopy,
  onRegenerate,
  onDelete,
}: ChatMessageProps) => {
  const isUser = role === 'user'
  const isSystem = role === 'system'

  return (
    <div
      className={`flex gap-3 p-4 ${
        isUser ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20' : 'bg-white dark:bg-gray-800'
      } ${isSystem ? 'opacity-70 text-sm' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
            : isSystem
            ? 'bg-gray-400 text-white'
            : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
        }`}
      >
        {isUser ? '=d' : isSystem ? '9' : '>'}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white">
            {isUser ? 'You' : isSystem ? 'System' : 'AI Assistant'}
          </span>
          {model && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {model}
            </span>
          )}
          {timestamp && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {timestamp}
            </span>
          )}
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {content}
            {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-gray-400 animate-pulse" />}
          </p>
        </div>

        {tokens && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {tokens} tokens
          </div>
        )}

        {/* Actions */}
        {!isSystem && !isUser && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={onCopy}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              =Ë Copy
            </button>
            <button
              onClick={onRegenerate}
              className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              = Regenerate
            </button>
            <button
              onClick={onDelete}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors"
            >
              =Ñ Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Storybook metadata
const meta = {
  title: 'Chat/ChatMessage',
  component: ChatMessage,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A message component for displaying chat conversations with users and AI assistants.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    role: {
      control: 'select',
      options: ['user', 'assistant', 'system'],
      description: 'Message sender role',
    },
    content: {
      control: 'text',
      description: 'Message content',
    },
    timestamp: {
      control: 'text',
      description: 'Message timestamp',
    },
    model: {
      control: 'text',
      description: 'AI model used (for assistant messages)',
    },
    tokens: {
      control: 'number',
      description: 'Token count',
    },
    isStreaming: {
      control: 'boolean',
      description: 'Show streaming indicator',
    },
  },
  args: {
    onCopy: fn(),
    onRegenerate: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof ChatMessage>

export default meta
type Story = StoryObj<typeof meta>

// Stories
export const UserMessage: Story = {
  args: {
    role: 'user',
    content: 'What is the capital of France?',
    timestamp: '10:30 AM',
  },
}

export const AssistantMessage: Story = {
  args: {
    role: 'assistant',
    content: 'The capital of France is Paris. It is not only the capital but also the largest city in France, known for its art, fashion, gastronomy, and culture.',
    timestamp: '10:31 AM',
    model: 'GPT-4',
    tokens: 42,
  },
}

export const SystemMessage: Story = {
  args: {
    role: 'system',
    content: 'New conversation started with GPT-4 model.',
    timestamp: '10:30 AM',
  },
}

export const StreamingMessage: Story = {
  args: {
    role: 'assistant',
    content: 'The capital of France is',
    timestamp: '10:31 AM',
    model: 'GPT-4',
    isStreaming: true,
  },
}

export const LongMessage: Story = {
  args: {
    role: 'assistant',
    content: `Here's a detailed explanation of React hooks:

1. **useState**: Manages state in functional components
   - Returns current state and updater function
   - Can accept initial state or function

2. **useEffect**: Handles side effects
   - Runs after render
   - Can clean up with return function
   - Dependencies array controls when it runs

3. **useContext**: Accesses context values
   - Avoids prop drilling
   - Provides global state management

4. **useReducer**: Complex state logic
   - Alternative to useState
   - Works like Redux reducers

5. **useMemo**: Memoizes expensive computations
   - Only recomputes when dependencies change
   - Performance optimization

6. **useCallback**: Memoizes functions
   - Prevents unnecessary re-renders
   - Useful for child component optimization`,
    timestamp: '10:31 AM',
    model: 'GPT-4',
    tokens: 156,
  },
}

export const CodeMessage: Story = {
  args: {
    role: 'assistant',
    content: `Here's a simple React component:

\`\`\`jsx
import React, { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}

export default Counter
\`\`\`

This component demonstrates the useState hook for managing state.`,
    timestamp: '10:31 AM',
    model: 'GPT-4',
    tokens: 89,
  },
}

export const Conversation: Story = {
  render: () => (
    <div className="space-y-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <ChatMessage
        role="system"
        content="New conversation started"
        timestamp="10:30 AM"
      />
      <ChatMessage
        role="user"
        content="Explain React hooks in simple terms"
        timestamp="10:30 AM"
      />
      <ChatMessage
        role="assistant"
        content="React hooks are functions that let you use state and other React features in functional components. The most common hooks are useState (for state management) and useEffect (for side effects like API calls)."
        timestamp="10:31 AM"
        model="GPT-4"
        tokens: 56
      />
      <ChatMessage
        role="user"
        content="Can you give an example?"
        timestamp="10:32 AM"
      />
      <ChatMessage
        role="assistant"
        content="Sure! Here's a simple counter example..."
        timestamp="10:32 AM"
        model="GPT-4"
        isStreaming={true}
      />
    </div>
  ),
}

/**
 * Demo Data for AI Chat Studio
 * Provides sample conversations and messages for testing and demonstration
 */

import type { Conversation, Message } from '../types'

export const demoMessages: Message[] = [
  {
    id: '1',
    conversationId: 'demo-1',
    role: 'user',
    content: 'What is React and why should I use it?',
    timestamp: new Date('2024-01-15T10:00:00'),
  },
  {
    id: '2',
    conversationId: 'demo-1',
    role: 'assistant',
    content: `React is a popular JavaScript library for building user interfaces, particularly single-page applications. Here are the key reasons to use React:

**1. Component-Based Architecture**
- Build encapsulated components that manage their own state
- Compose components to create complex UIs
- Reusable components save time and ensure consistency

**2. Virtual DOM**
- React uses a virtual DOM for efficient updates
- Only re-renders components that actually changed
- Results in better performance

**3. Large Ecosystem**
- Huge community support
- Thousands of libraries and tools
- Easy to find solutions and resources

**4. Easy to Learn**
- Simple concepts: components, props, state
- Great documentation and tutorials
- JSX makes templates intuitive

**5. React Hooks**
- Modern way to use state and lifecycle features
- Cleaner, more readable code
- Better code reusability

Would you like to learn more about any specific aspect of React?`,
    timestamp: new Date('2024-01-15T10:00:15'),
  },
  {
    id: '3',
    conversationId: 'demo-1',
    role: 'user',
    content: 'Can you show me a simple React component example?',
    timestamp: new Date('2024-01-15T10:01:00'),
  },
  {
    id: '4',
    conversationId: 'demo-1',
    role: 'assistant',
    content: `Sure! Here's a simple React component example:

\`\`\`jsx
import React, { useState } from 'react'

function Counter() {
  // State hook to manage count
  const [count, setCount] = useState(0)

  // Event handlers
  const increment = () => setCount(count + 1)
  const decrement = () => setCount(count - 1)
  const reset = () => setCount(0)

  return (
    <div className="counter">
      <h2>Counter: {count}</h2>
      <div className="buttons">
        <button onClick={decrement}>-</button>
        <button onClick={reset}>Reset</button>
        <button onClick={increment}>+</button>
      </div>
    </div>
  )
}

export default Counter
\`\`\`

This component demonstrates:
- **useState Hook**: Managing component state
- **Event Handlers**: Responding to button clicks
- **JSX**: HTML-like syntax in JavaScript
- **Props & State**: The core concepts of React

You can use this component in your app like:
\`\`\`jsx
<Counter />
\`\`\`

Want to see more advanced examples?`,
    timestamp: new Date('2024-01-15T10:01:20'),
  },
]

export const demoConversations: Conversation[] = [
  {
    id: 'demo-1',
    title: 'Learning React Basics',
    model: 'gpt-4',
    provider: 'openai',
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-15T10:01:20'),
    messageCount: 4,
  },
  {
    id: 'demo-2',
    title: 'Python Data Analysis Tips',
    model: 'claude-3-opus',
    provider: 'anthropic',
    createdAt: new Date('2024-01-14T15:30:00'),
    updatedAt: new Date('2024-01-14T15:45:00'),
    messageCount: 6,
  },
  {
    id: 'demo-3',
    title: 'Writing Better Git Commit Messages',
    model: 'gpt-3.5-turbo',
    provider: 'openai',
    createdAt: new Date('2024-01-13T09:15:00'),
    updatedAt: new Date('2024-01-13T09:30:00'),
    messageCount: 8,
  },
]

// Additional demo messages for other conversations
export const getAllDemoMessages = (): Record<string, Message[]> => {
  return {
    'demo-1': [
      {
        id: '1',
        conversationId: 'demo-1',
        role: 'user',
        content: 'What is React and why should I use it?',
        timestamp: new Date('2024-01-15T10:00:00'),
      },
      {
        id: '2',
        conversationId: 'demo-1',
        role: 'assistant',
        content: `React is a popular JavaScript library for building user interfaces. Key benefits include component-based architecture, virtual DOM for performance, large ecosystem, and easy learning curve.`,
        timestamp: new Date('2024-01-15T10:00:15'),
      },
      {
        id: '3',
        conversationId: 'demo-1',
        role: 'user',
        content: 'Can you show me a simple React component example?',
        timestamp: new Date('2024-01-15T10:01:00'),
      },
      {
        id: '4',
        conversationId: 'demo-1',
        role: 'assistant',
        content: `Here's a simple counter component using useState hook...`,
        timestamp: new Date('2024-01-15T10:01:20'),
      },
    ],
    'demo-2': [
      {
        id: '5',
        conversationId: 'demo-2',
        role: 'user',
        content: 'How do I analyze CSV files with pandas?',
        timestamp: new Date('2024-01-14T15:30:00'),
      },
      {
        id: '6',
        conversationId: 'demo-2',
        role: 'assistant',
        content: `To analyze CSV files with pandas:

\`\`\`python
import pandas as pd

# Read CSV file
df = pd.read_csv('data.csv')

# Basic analysis
print(df.head())          # First 5 rows
print(df.describe())      # Statistical summary
print(df.info())          # Data types and nulls

# Filter data
filtered = df[df['age'] > 25]

# Group by operations
grouped = df.groupby('category')['value'].mean()
\`\`\``,
        timestamp: new Date('2024-01-14T15:30:30'),
      },
    ],
    'demo-3': [
      {
        id: '7',
        conversationId: 'demo-3',
        role: 'user',
        content: 'What makes a good git commit message?',
        timestamp: new Date('2024-01-13T09:15:00'),
      },
      {
        id: '8',
        conversationId: 'demo-3',
        role: 'assistant',
        content: `Good commit messages should:

1. **Use imperative mood**: "Add feature" not "Added feature"
2. **Be concise**: 50 chars or less for subject line
3. **Explain why**: Not just what changed
4. **Separate subject from body**: Blank line between
5. **Reference issues**: Include issue numbers

Example:
\`\`\`
Fix login validation bug (#123)

The email validation regex was incorrect, allowing invalid
email formats. Updated to use standard RFC 5322 pattern.

Fixes #123
\`\`\``,
        timestamp: new Date('2024-01-13T09:15:45'),
      },
    ],
  }
}

// System messages for demo mode
export const demoSystemMessages = {
  welcome: `👋 Welcome to AI Chat Studio Demo Mode!

You're currently using the app without an API key. This demo shows you how the app works with pre-loaded conversations.

**To start using real AI:**
1. Click Settings (⚙️)
2. Go to API Settings
3. Enter your API key from OpenAI, Anthropic, or Google
4. Start chatting!

**Demo features:**
- Browse sample conversations
- Explore the interface
- Try keyboard shortcuts
- Export demo conversations

Ready to get started?`,

  noApiKey: `⚠️ No API key configured

To chat with AI, you need to add an API key:
1. Settings → API Settings
2. Choose your provider (OpenAI, Anthropic, or Google)
3. Enter your API key
4. Save and start chatting!

Don't have an API key? Get one from:
- OpenAI: https://platform.openai.com
- Anthropic: https://console.anthropic.com
- Google: https://makersuite.google.com`,

  demoModeActive: `🎮 Demo Mode Active

You're viewing a sample conversation. To chat with real AI:
1. Configure your API key in Settings
2. Create a new conversation
3. Start chatting!`,
}

// Helper to check if in demo mode
export const isDemoMode = (): boolean => {
  // Check if any API key is configured
  const hasOpenAI = !!localStorage.getItem('openai_api_key')
  const hasAnthropic = !!localStorage.getItem('anthropic_api_key')
  const hasGoogle = !!localStorage.getItem('google_api_key')

  return !hasOpenAI && !hasAnthropic && !hasGoogle
}

// Load demo data into storage
export const loadDemoData = (): void => {
  try {
    // Only load if no conversations exist
    const existingConversations = localStorage.getItem('conversations')
    if (existingConversations) {
      const parsed = JSON.parse(existingConversations)
      if (parsed && parsed.length > 0) {
        return // Don't overwrite existing data
      }
    }

    // Load demo conversations
    localStorage.setItem('conversations', JSON.stringify(demoConversations))

    // Load demo messages
    const allMessages = getAllDemoMessages()
    localStorage.setItem('messages', JSON.stringify(allMessages))

    console.log('✅ Demo data loaded')
  } catch (error) {
    console.error('Failed to load demo data:', error)
  }
}

// Clear demo data
export const clearDemoData = (): void => {
  try {
    const conversations = localStorage.getItem('conversations')
    if (conversations) {
      const parsed = JSON.parse(conversations)
      const nonDemo = parsed.filter((c: Conversation) => !c.id.startsWith('demo-'))
      localStorage.setItem('conversations', JSON.stringify(nonDemo))
    }

    console.log('✅ Demo data cleared')
  } catch (error) {
    console.error('Failed to clear demo data:', error)
  }
}

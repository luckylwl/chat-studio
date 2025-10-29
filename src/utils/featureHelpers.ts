/**
 * AI Chat Studio v3.0 - Feature Helper Functions
 *
 * Utility functions for working with v3.0 features
 */

import { Message, Conversation } from '../types'
import toast from 'react-hot-toast'

// ===================================
// TOKEN & COST UTILITIES
// ===================================

/**
 * Estimate token count for text
 * Simple approximation: ~4 characters per token
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

/**
 * Calculate cost for tokens
 */
export function calculateCost(tokens: number, model: string, type: 'input' | 'output' = 'output'): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 0.03, output: 0.06 },
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'claude-3-opus': { input: 0.015, output: 0.075 },
    'claude-3-sonnet': { input: 0.003, output: 0.015 },
    'claude-3-haiku': { input: 0.00025, output: 0.00125 },
    'gemini-pro': { input: 0.00025, output: 0.0005 }
  }

  const modelPricing = pricing[model] || { input: 0.001, output: 0.002 }
  return (tokens / 1000) * modelPricing[type]
}

/**
 * Format cost as currency
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`
}

/**
 * Format token count
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`
  }
  return tokens.toString()
}

// ===================================
// CONVERSATION UTILITIES
// ===================================

/**
 * Get conversation statistics
 */
export function getConversationStats(conversation: Conversation) {
  const totalMessages = conversation.messages.length
  const userMessages = conversation.messages.filter(m => m.role === 'user').length
  const assistantMessages = conversation.messages.filter(m => m.role === 'assistant').length
  const totalTokens = conversation.messages.reduce((sum, m) => sum + (m.tokens || 0), 0)
  const totalCost = calculateCost(totalTokens, conversation.model)

  return {
    totalMessages,
    userMessages,
    assistantMessages,
    totalTokens,
    totalCost,
    averageTokensPerMessage: totalMessages > 0 ? totalTokens / totalMessages : 0
  }
}

/**
 * Generate conversation title from messages
 */
export function generateConversationTitle(messages: Message[]): string {
  if (messages.length === 0) return 'New Conversation'

  const firstUserMessage = messages.find(m => m.role === 'user')
  if (!firstUserMessage) return 'New Conversation'

  // Take first 50 characters
  let title = firstUserMessage.content.slice(0, 50)
  if (firstUserMessage.content.length > 50) {
    title += '...'
  }

  return title
}

/**
 * Export conversation as markdown
 */
export function exportConversationAsMarkdown(conversation: Conversation): string {
  const lines = [
    `# ${conversation.title}`,
    ``,
    `**Model**: ${conversation.model}`,
    `**Created**: ${new Date(conversation.createdAt).toLocaleString()}`,
    `**Messages**: ${conversation.messages.length}`,
    ``,
    `---`,
    ``
  ]

  conversation.messages.forEach((message, index) => {
    const role = message.role === 'user' ? '**User**' : '**Assistant**'
    lines.push(`### ${role} (${index + 1})`)
    lines.push(``)
    lines.push(message.content)
    lines.push(``)
    lines.push(`---`)
    lines.push(``)
  })

  return lines.join('\n')
}

// ===================================
// FILE UTILITIES
// ===================================

/**
 * Download content as file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Read file as text
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

/**
 * Read file as data URL
 */
export async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// ===================================
// DATE & TIME UTILITIES
// ===================================

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (seconds > 10) return `${seconds} seconds ago`
  return 'Just now'
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
  return `${(ms / 3600000).toFixed(1)}h`
}

// ===================================
// STRING UTILITIES
// ===================================

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Convert camelCase to Title Case
 */
export function camelToTitle(text: string): string {
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

/**
 * Highlight text matching query
 */
export function highlightText(text: string, query: string): string {
  if (!query) return text

  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// ===================================
// VALIDATION UTILITIES
// ===================================

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * Validate URL
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validate API key format
 */
export function isValidAPIKey(key: string): boolean {
  // Basic validation: non-empty, reasonable length
  return key.length >= 20 && key.length <= 200
}

// ===================================
// COPY & CLIPBOARD
// ===================================

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
    return true
  } catch (error) {
    console.error('Failed to copy:', error)
    toast.error('Failed to copy to clipboard')
    return false
  }
}

/**
 * Share content (Web Share API)
 */
export async function shareContent(data: { title?: string; text?: string; url?: string }): Promise<boolean> {
  if (!navigator.share) {
    toast.error('Sharing not supported on this device')
    return false
  }

  try {
    await navigator.share(data)
    return true
  } catch (error) {
    if ((error as Error).name !== 'AbortError') {
      console.error('Share failed:', error)
      toast.error('Failed to share')
    }
    return false
  }
}

// ===================================
// LOCAL STORAGE UTILITIES
// ===================================

/**
 * Save to local storage with error handling
 */
export function saveToLocalStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error('Failed to save to localStorage:', error)
    return false
  }
}

/**
 * Load from local storage with error handling
 */
export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
    return defaultValue
  }
}

/**
 * Clear specific key from local storage
 */
export function removeFromLocalStorage(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Failed to remove from localStorage:', error)
    return false
  }
}

// ===================================
// ARRAY UTILITIES
// ===================================

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key])
    if (!result[groupKey]) {
      result[groupKey] = []
    }
    result[groupKey].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Sort array by multiple keys
 */
export function sortBy<T>(array: T[], keys: (keyof T)[]): T[] {
  return [...array].sort((a, b) => {
    for (const key of keys) {
      if (a[key] < b[key]) return -1
      if (a[key] > b[key]) return 1
    }
    return 0
  })
}

/**
 * Remove duplicates from array
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// ===================================
// DEBOUNCE & THROTTLE
// ===================================

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// ===================================
// RANDOM & GENERATION
// ===================================

/**
 * Generate random ID
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`
}

/**
 * Generate random color
 */
export function generateRandomColor(): string {
  const colors = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B',
    '#10B981', '#06B6D4', '#6366F1', '#A855F7', '#F43F5E'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Generate avatar initials
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')
}

// ===================================
// EXPORTS
// ===================================

export default {
  // Token & Cost
  estimateTokens,
  calculateCost,
  formatCost,
  formatTokens,

  // Conversation
  getConversationStats,
  generateConversationTitle,
  exportConversationAsMarkdown,

  // File
  downloadFile,
  readFileAsText,
  readFileAsDataURL,
  formatFileSize,

  // Date & Time
  formatRelativeTime,
  formatDuration,

  // String
  truncate,
  capitalize,
  camelToTitle,
  highlightText,

  // Validation
  isValidEmail,
  isValidURL,
  isValidAPIKey,

  // Clipboard
  copyToClipboard,
  shareContent,

  // Storage
  saveToLocalStorage,
  loadFromLocalStorage,
  removeFromLocalStorage,

  // Array
  groupBy,
  sortBy,
  unique,
  chunk,

  // Performance
  debounce,
  throttle,

  // Random
  generateId,
  generateRandomColor,
  getInitials
}

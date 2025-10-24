import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders, mockMessage, mockNetworkRequest } from '@/utils/testUtils'
import ChatInput from '../ChatInput'

// Mock the hooks and services
jest.mock('@/hooks/useVoice', () => ({
  useVoice: () => ({
    isListening: false,
    isSupported: true,
    startListening: jest.fn(),
    stopListening: jest.fn(),
    transcript: '',
    confidence: 0
  })
}))

jest.mock('@/services/aiService', () => ({
  sendMessage: jest.fn().mockResolvedValue(mockMessage)
}))

const mockProps = {
  onSendMessage: jest.fn(),
  disabled: false,
  placeholder: 'Type your message...',
  conversation: {
    id: 'test-conv-1',
    title: 'Test Conversation',
    messages: [],
    model: 'gpt-3.5-turbo',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: {
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 1000
    }
  }
}

describe('ChatInput Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    renderWithProviders(<ChatInput {...mockProps} />)

    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('handles text input correctly', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)
    const input = screen.getByPlaceholderText('Type your message...')

    await user.type(input, 'Hello, AI!')

    expect(input).toHaveValue('Hello, AI!')
  })

  it('sends message when send button is clicked', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Hello, AI!')
    await user.click(sendButton)

    expect(mockProps.onSendMessage).toHaveBeenCalledWith('Hello, AI!')
    expect(input).toHaveValue('')
  })

  it('sends message when Enter is pressed', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)
    const input = screen.getByPlaceholderText('Type your message...')

    await user.type(input, 'Hello, AI!')
    await user.keyboard('{Enter}')

    expect(mockProps.onSendMessage).toHaveBeenCalledWith('Hello, AI!')
  })

  it('adds new line when Shift+Enter is pressed', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)
    const input = screen.getByPlaceholderText('Type your message...')

    await user.type(input, 'Line 1')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    await user.type(input, 'Line 2')

    expect(input).toHaveValue('Line 1\nLine 2')
  })

  it('disables input when disabled prop is true', () => {
    renderWithProviders(<ChatInput {...mockProps} disabled={true} />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    expect(input).toBeDisabled()
    expect(sendButton).toBeDisabled()
  })

  it('does not send empty messages', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.click(sendButton)

    expect(mockProps.onSendMessage).not.toHaveBeenCalled()
  })

  it('trims whitespace from messages', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, '   Hello, AI!   ')
    await user.click(sendButton)

    expect(mockProps.onSendMessage).toHaveBeenCalledWith('Hello, AI!')
  })

  it('shows character count when approaching limit', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)
    const input = screen.getByPlaceholderText('Type your message...')

    // Type a long message (assuming limit is around 4000 characters)
    const longMessage = 'a'.repeat(3800)
    await user.type(input, longMessage)

    // Should show character count warning
    expect(screen.getByText(/characters/i)).toBeInTheDocument()
  })

  it('handles file upload', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)

    // Look for file upload button or input
    const fileInput = screen.getByLabelText(/attach file/i) ||
                     screen.getByRole('button', { name: /upload/i })

    expect(fileInput).toBeInTheDocument()

    // Test file upload
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })

    if (fileInput.tagName === 'INPUT') {
      await user.upload(fileInput as HTMLInputElement, file)
    } else {
      // If it's a button, simulate click and file selection
      await user.click(fileInput)
    }

    // Verify file was processed (exact implementation depends on component)
    // This might show a file preview or trigger some callback
  })

  it('handles voice input toggle', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)

    const voiceButton = screen.getByRole('button', { name: /voice/i }) ||
                       screen.getByLabelText(/voice input/i)

    await user.click(voiceButton)

    // Voice functionality should be triggered
    // Exact assertions depend on the voice hook implementation
  })

  it('shows typing indicator during API call', async () => {
    const slowMockResponse = mockNetworkRequest('/api/chat', mockMessage, 1000)

    const { user } = renderWithProviders(<ChatInput {...mockProps} />)
    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    await user.type(input, 'Hello, AI!')
    await user.click(sendButton)

    // Should show loading state
    expect(sendButton).toBeDisabled()

    await waitFor(() => {
      expect(sendButton).not.toBeDisabled()
    }, { timeout: 2000 })

    slowMockResponse() // Cleanup
  })

  it('handles keyboard shortcuts', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)
    const input = screen.getByPlaceholderText('Type your message...')

    await user.type(input, 'Hello, AI!')

    // Test Ctrl+Enter shortcut (if implemented)
    await user.keyboard('{Control>}{Enter}{/Control}')

    expect(mockProps.onSendMessage).toHaveBeenCalledWith('Hello, AI!')
  })

  it('maintains focus after sending message', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)
    const input = screen.getByPlaceholderText('Type your message...')

    await user.type(input, 'Hello, AI!')
    await user.keyboard('{Enter}')

    expect(input).toHaveFocus()
  })

  it('handles paste events correctly', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)
    const input = screen.getByPlaceholderText('Type your message...')

    await user.click(input)

    // Simulate pasting text
    const pasteText = 'Pasted content'
    await user.paste(pasteText)

    expect(input).toHaveValue(pasteText)
  })

  it('auto-resizes textarea based on content', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)
    const input = screen.getByPlaceholderText('Type your message...')

    const initialHeight = input.style.height || input.clientHeight

    // Type multiple lines
    const multilineText = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5'
    await user.type(input, multilineText)

    // Height should have increased
    const newHeight = input.style.height || input.clientHeight
    expect(newHeight).not.toBe(initialHeight)
  })

  it('handles mobile responsive behavior', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    })

    renderWithProviders(<ChatInput {...mockProps} />)

    // Component should adapt to mobile layout
    const container = screen.getByPlaceholderText('Type your message...').closest('div')
    expect(container).toHaveClass(/mobile|sm:/) // Depending on your CSS classes
  })

  it('prevents XSS in user input', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)
    const input = screen.getByPlaceholderText('Type your message...')

    const maliciousScript = '<script>alert("XSS")</script>'
    await user.type(input, maliciousScript)
    await user.keyboard('{Enter}')

    // Should send the raw text, not execute script
    expect(mockProps.onSendMessage).toHaveBeenCalledWith(maliciousScript)

    // Script should not be executed
    expect(window.alert).not.toHaveBeenCalled()
  })

  it('handles emoji input correctly', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)
    const input = screen.getByPlaceholderText('Type your message...')

    await user.type(input, 'Hello! 😊🎉')
    await user.keyboard('{Enter}')

    expect(mockProps.onSendMessage).toHaveBeenCalledWith('Hello! 😊🎉')
  })
})

// Performance tests
describe('ChatInput Performance', () => {
  it('renders within performance budget', async () => {
    const renderTime = await import('@/utils/testUtils').then(utils =>
      utils.measureRenderTime(<ChatInput {...mockProps} />)
    )

    // Should render within 100ms
    expect(renderTime).toBeLessThan(100)
  })

  it('handles rapid typing without lag', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)
    const input = screen.getByPlaceholderText('Type your message...')

    const startTime = performance.now()

    // Type rapidly
    await user.type(input, 'The quick brown fox jumps over the lazy dog', { delay: 1 })

    const endTime = performance.now()
    const typingTime = endTime - startTime

    // Should handle rapid typing smoothly
    expect(typingTime).toBeLessThan(1000) // Less than 1 second
  })

  it('does not cause memory leaks', async () => {
    const { detectMemoryLeaks } = await import('@/utils/testUtils')

    const hasMemoryLeak = await detectMemoryLeaks(() => {
      const { unmount } = renderWithProviders(<ChatInput {...mockProps} />)
      unmount()
    })

    expect(hasMemoryLeak).toBe(false)
  })
})

// Accessibility tests
describe('ChatInput Accessibility', () => {
  it('meets accessibility guidelines', async () => {
    const { container } = renderWithProviders(<ChatInput {...mockProps} />)
    const { getAccessibilityViolations } = await import('@/utils/testUtils')

    const violations = await getAccessibilityViolations(container)
    expect(violations).toHaveLength(0)
  })

  it('supports keyboard navigation', async () => {
    const { user } = renderWithProviders(<ChatInput {...mockProps} />)

    // Tab through interactive elements
    await user.tab()
    expect(screen.getByPlaceholderText('Type your message...')).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: /send/i })).toHaveFocus()
  })

  it('has proper ARIA labels', () => {
    renderWithProviders(<ChatInput {...mockProps} />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByRole('button', { name: /send/i })

    expect(input).toHaveAttribute('aria-label')
    expect(sendButton).toHaveAttribute('aria-label')
  })

  it('supports screen readers', () => {
    renderWithProviders(<ChatInput {...mockProps} />)

    // Check for proper semantic markup
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState, NoConversationsEmpty, NoSearchResultsEmpty } from '../EmptyState'
import { Inbox } from 'lucide-react'

describe('EmptyState', () => {
  it('renders with title', () => {
    render(<EmptyState title="No data" />)
    expect(screen.getByText('No data')).toBeInTheDocument()
  })

  it('renders with description', () => {
    render(<EmptyState title="No data" description="Add some data to get started" />)
    expect(screen.getByText('Add some data to get started')).toBeInTheDocument()
  })

  it('renders with action button', () => {
    const mockAction = vi.fn()
    render(
      <EmptyState
        title="No data"
        action={{
          label: 'Create new',
          onClick: mockAction,
        }}
      />
    )

    const button = screen.getByText('Create new')
    expect(button).toBeInTheDocument()
  })

  it('calls action onClick', async () => {
    const user = userEvent.setup()
    const mockAction = vi.fn()

    render(
      <EmptyState
        title="No data"
        action={{
          label: 'Create',
          onClick: mockAction,
        }}
      />
    )

    await user.click(screen.getByText('Create'))
    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('renders with custom icon', () => {
    const { container } = render(<EmptyState icon={Inbox} title="Empty" />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

describe('NoConversationsEmpty', () => {
  it('renders preset empty state', () => {
    const mockCreate = vi.fn()
    render(<NoConversationsEmpty onCreate={mockCreate} />)

    expect(screen.getByText('No conversations yet')).toBeInTheDocument()
    expect(screen.getByText(/Start a new conversation/)).toBeInTheDocument()
  })

  it('calls onCreate when button clicked', async () => {
    const user = userEvent.setup()
    const mockCreate = vi.fn()

    render(<NoConversationsEmpty onCreate={mockCreate} />)

    await user.click(screen.getByText('New Conversation'))
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })
})

describe('NoSearchResultsEmpty', () => {
  it('displays search query in message', () => {
    render(<NoSearchResultsEmpty query="test query" />)
    expect(screen.getByText(/test query/)).toBeInTheDocument()
  })
})

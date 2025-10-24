import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner, PulseLoader, DotsLoader, Skeleton } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />)
    expect(document.querySelector('.border-4')).toBeInTheDocument()
  })

  it('renders with label', () => {
    render(<LoadingSpinner label="Loading data..." />)
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { container } = render(<LoadingSpinner size="lg" />)
    expect(container.querySelector('.w-12.h-12')).toBeInTheDocument()
  })

  it('applies correct color classes', () => {
    const { container } = render(<LoadingSpinner color="primary" />)
    expect(container.querySelector('.border-blue-500')).toBeInTheDocument()
  })
})

describe('PulseLoader', () => {
  it('renders with custom className', () => {
    const { container } = render(<PulseLoader className="custom-class" />)
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })
})

describe('DotsLoader', () => {
  it('renders three dots', () => {
    const { container } = render(<DotsLoader />)
    const dots = container.querySelectorAll('.bg-current.rounded-full')
    expect(dots.length).toBe(3)
  })

  it('applies correct size', () => {
    const { container } = render(<DotsLoader size="lg" />)
    expect(container.querySelector('.w-3.h-3')).toBeInTheDocument()
  })
})

describe('Skeleton', () => {
  it('renders text variant', () => {
    const { container } = render(<Skeleton variant="text" />)
    expect(container.querySelector('.rounded.h-4')).toBeInTheDocument()
  })

  it('renders rect variant', () => {
    const { container } = render(<Skeleton variant="rect" />)
    expect(container.querySelector('.rounded-lg')).toBeInTheDocument()
  })

  it('renders circle variant', () => {
    const { container } = render(<Skeleton variant="circle" />)
    expect(container.querySelector('.rounded-full')).toBeInTheDocument()
  })

  it('applies custom width and height', () => {
    const { container } = render(<Skeleton width="200px" height="100px" />)
    const element = container.firstChild as HTMLElement
    expect(element.style.width).toBe('200px')
    expect(element.style.height).toBe('100px')
  })
})

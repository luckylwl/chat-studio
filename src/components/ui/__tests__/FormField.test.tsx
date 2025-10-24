import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { render, screen } from '@testing-library/react'
import { useFormValidation, FormField, Input } from '../FormField'

describe('useFormValidation', () => {
  it('initializes with default values', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: '', password: '' })
    )

    expect(result.current.values).toEqual({ email: '', password: '' })
    expect(result.current.errors).toEqual({})
    expect(result.current.touched).toEqual({})
  })

  it('updates value', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: '' })
    )

    act(() => {
      result.current.setValue('email', 'test@example.com')
    })

    expect(result.current.values.email).toBe('test@example.com')
  })

  it('validates required field', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: '' })
    )

    const rules = {
      email: {
        required: { value: true, message: 'Email is required' },
      },
    }

    act(() => {
      result.current.validate(rules)
    })

    expect(result.current.errors.email).toBe('Email is required')
  })

  it('validates pattern', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: 'invalid' })
    )

    const rules = {
      email: {
        pattern: {
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Invalid email',
        },
      },
    }

    act(() => {
      result.current.validate(rules)
    })

    expect(result.current.errors.email).toBe('Invalid email')
  })

  it('validates min length', () => {
    const { result } = renderHook(() =>
      useFormValidation({ password: '123' })
    )

    const rules = {
      password: {
        minLength: { value: 8, message: 'Too short' },
      },
    }

    act(() => {
      result.current.validate(rules)
    })

    expect(result.current.errors.password).toBe('Too short')
  })

  it('clears errors on valid input', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: '' })
    )

    const rules = {
      email: {
        required: { value: true, message: 'Required' },
      },
    }

    act(() => {
      result.current.validate(rules)
    })

    expect(result.current.errors.email).toBe('Required')

    act(() => {
      result.current.setValue('email', 'test@example.com')
      result.current.validate(rules)
    })

    expect(result.current.errors.email).toBeUndefined()
  })

  it('resets form', () => {
    const { result } = renderHook(() =>
      useFormValidation({ email: '', password: '' })
    )

    act(() => {
      result.current.setValue('email', 'test@example.com')
      result.current.setError('email', 'Some error')
    })

    expect(result.current.values.email).toBe('test@example.com')
    expect(result.current.errors.email).toBe('Some error')

    act(() => {
      result.current.reset()
    })

    expect(result.current.values).toEqual({ email: '', password: '' })
    expect(result.current.errors).toEqual({})
  })
})

describe('FormField', () => {
  it('renders label', () => {
    render(
      <FormField label="Email">
        <Input />
      </FormField>
    )

    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('shows required indicator', () => {
    render(
      <FormField label="Email" required>
        <Input />
      </FormField>
    )

    expect(screen.getByText('*')).toBeInTheDocument()
  })

  it('displays error message', () => {
    render(
      <FormField label="Email" error="Invalid email">
        <Input />
      </FormField>
    )

    expect(screen.getByText('Invalid email')).toBeInTheDocument()
  })

  it('displays helper text when no error', () => {
    render(
      <FormField label="Email" helperText="We'll never share your email">
        <Input />
      </FormField>
    )

    expect(screen.getByText("We'll never share your email")).toBeInTheDocument()
  })

  it('hides helper text when error is shown', () => {
    render(
      <FormField
        label="Email"
        error="Invalid"
        helperText="Helper text"
      >
        <Input />
      </FormField>
    )

    expect(screen.queryByText('Helper text')).not.toBeInTheDocument()
    expect(screen.getByText('Invalid')).toBeInTheDocument()
  })
})

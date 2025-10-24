import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

// Button component (creating a simple example)
interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
}

const Button = ({
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
}: ButtonProps) => {
  const baseClasses = 'rounded-lg font-medium transition-all duration-200 inline-flex items-center justify-center'

  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const disabledClasses = 'opacity-50 cursor-not-allowed'

  return (
    <button
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled || loading ? disabledClasses : ''}
      `}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {label}
    </button>
  )
}

// Storybook metadata
const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A versatile button component with multiple variants, sizes, and states.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable button interaction',
    },
    loading: {
      control: 'boolean',
      description: 'Show loading spinner',
    },
    onClick: {
      action: 'clicked',
      description: 'Click event handler',
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Stories
export const Primary: Story = {
  args: {
    label: 'Primary Button',
    variant: 'primary',
    size: 'md',
  },
}

export const Secondary: Story = {
  args: {
    label: 'Secondary Button',
    variant: 'secondary',
    size: 'md',
  },
}

export const Danger: Story = {
  args: {
    label: 'Delete',
    variant: 'danger',
    size: 'md',
  },
}

export const Ghost: Story = {
  args: {
    label: 'Ghost Button',
    variant: 'ghost',
    size: 'md',
  },
}

export const Small: Story = {
  args: {
    label: 'Small Button',
    variant: 'primary',
    size: 'sm',
  },
}

export const Large: Story = {
  args: {
    label: 'Large Button',
    variant: 'primary',
    size: 'lg',
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Button',
    variant: 'primary',
    size: 'md',
    disabled: true,
  },
}

export const Loading: Story = {
  args: {
    label: 'Loading...',
    variant: 'primary',
    size: 'md',
    loading: true,
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button label="Primary" variant="primary" />
        <Button label="Secondary" variant="secondary" />
        <Button label="Danger" variant="danger" />
        <Button label="Ghost" variant="ghost" />
      </div>
      <div className="flex gap-2">
        <Button label="Small" variant="primary" size="sm" />
        <Button label="Medium" variant="primary" size="md" />
        <Button label="Large" variant="primary" size="lg" />
      </div>
      <div className="flex gap-2">
        <Button label="Disabled" variant="primary" disabled />
        <Button label="Loading" variant="primary" loading />
      </div>
    </div>
  ),
}

import React from 'react'
import { cn } from '@/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  errorMessage?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, errorMessage, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            'flex h-11 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg',
            'dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400 dark:focus-visible:ring-primary-400',
            error && 'border-red-500 focus-visible:ring-red-500 dark:border-red-400',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && errorMessage && (
          <p className="mt-2 text-sm text-red-500 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
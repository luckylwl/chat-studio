import React from 'react'
import { cn } from '@/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  errorMessage?: string
  autoResize?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, errorMessage, autoResize, onChange, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    React.useImperativeHandle(ref, () => textareaRef.current!)

    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current
      if (textarea && autoResize) {
        textarea.style.height = 'auto'
        textarea.style.height = `${textarea.scrollHeight}px`
      }
    }, [autoResize])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight()
      onChange?.(e)
    }

    React.useEffect(() => {
      if (autoResize) {
        adjustHeight()
      }
    }, [adjustHeight, autoResize])

    return (
      <div className="w-full">
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-200 shadow-sm hover:shadow-md focus:shadow-lg',
            'dark:border-gray-800 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-400 dark:focus-visible:ring-primary-400',
            error && 'border-red-500 focus-visible:ring-red-500 dark:border-red-400',
            autoResize && 'overflow-hidden',
            className
          )}
          ref={textareaRef}
          onChange={handleChange}
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

Textarea.displayName = 'Textarea'

export { Textarea }
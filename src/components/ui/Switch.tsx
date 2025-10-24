import React from 'react'
import { cn } from '@/utils'

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, ...props }, ref) => {
    return (
      <div className="flex items-center justify-between">
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        )}
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            ref={ref}
            {...props}
          />
          <div
            className={cn(
              'relative w-12 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-gradient-to-r peer-checked:from-primary-500 peer-checked:to-primary-600 shadow-inner',
              className
            )}
          />
        </label>
      </div>
    )
  }
)

Switch.displayName = 'Switch'

export { Switch }
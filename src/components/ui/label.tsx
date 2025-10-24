import React from 'react'
import { cn } from '@/utils'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export const Label: React.FC<LabelProps> = ({
  className,
  children,
  required,
  ...props
}) => {
  return (
    <label
      className={cn(
        'text-sm font-medium text-gray-700 dark:text-gray-300',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}

export default Label
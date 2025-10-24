import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

export interface FieldError {
  message: string
  type?: 'error' | 'warning' | 'info'
}

interface FormFieldProps {
  label?: string
  error?: FieldError | string
  helperText?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  id?: string
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  required = false,
  children,
  className = '',
  id,
}) => {
  const fieldId = id || React.useId()
  const errorMessage = typeof error === 'string' ? error : error?.message
  const errorType = typeof error === 'object' ? error.type : 'error'

  const Icon = errorType === 'error' ? AlertCircle : errorType === 'warning' ? AlertCircle : CheckCircle

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {React.cloneElement(children as React.ReactElement, {
        id: fieldId,
        'aria-invalid': !!errorMessage,
        'aria-describedby': errorMessage
          ? `${fieldId}-error`
          : helperText
          ? `${fieldId}-helper`
          : undefined,
        'aria-required': required,
      })}

      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            id={`${fieldId}-error`}
            className={`flex items-start gap-2 text-sm ${
              errorType === 'error'
                ? 'text-red-600 dark:text-red-400'
                : errorType === 'warning'
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}
            role="alert"
          >
            <Icon size={16} className="mt-0.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {!errorMessage && helperText && (
        <div
          id={`${fieldId}-helper`}
          className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400"
        >
          <Info size={16} className="mt-0.5 flex-shrink-0" />
          <span>{helperText}</span>
        </div>
      )}
    </div>
  )
}

// Enhanced Input with validation
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, success, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`
          w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-800
          text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${
            error
              ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
              : success
              ? 'border-green-500 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
          }
          ${className}
        `}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

// Form validation hook
export interface ValidationRule {
  required?: { value: boolean; message: string }
  minLength?: { value: number; message: string }
  maxLength?: { value: number; message: string }
  pattern?: { value: RegExp; message: string }
  validate?: (value: any) => boolean | string
}

export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T
) => {
  const [values, setValues] = React.useState<T>(initialValues)
  const [errors, setErrors] = React.useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = React.useState<Partial<Record<keyof T, boolean>>>({})

  const validateField = (
    name: keyof T,
    value: any,
    rules?: ValidationRule
  ): string | undefined => {
    if (!rules) return undefined

    if (rules.required?.value && !value) {
      return rules.required.message
    }

    if (rules.minLength && value.length < rules.minLength.value) {
      return rules.minLength.message
    }

    if (rules.maxLength && value.length > rules.maxLength.value) {
      return rules.maxLength.message
    }

    if (rules.pattern && !rules.pattern.value.test(value)) {
      return rules.pattern.message
    }

    if (rules.validate) {
      const result = rules.validate(value)
      if (typeof result === 'string') return result
      if (result === false) return 'Validation failed'
    }

    return undefined
  }

  const setValue = (name: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const setError = (name: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const clearError = (name: keyof T) => {
    setErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }

  const setFieldTouched = (name: keyof T) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  const handleChange = (
    name: keyof T,
    value: any,
    rules?: ValidationRule
  ) => {
    setValue(name, value)
    if (touched[name]) {
      const error = validateField(name, value, rules)
      if (error) {
        setError(name, error)
      } else {
        clearError(name)
      }
    }
  }

  const handleBlur = (name: keyof T, rules?: ValidationRule) => {
    setFieldTouched(name)
    const error = validateField(name, values[name], rules)
    if (error) {
      setError(name, error)
    } else {
      clearError(name)
    }
  }

  const validate = (validationRules: Partial<Record<keyof T, ValidationRule>>) => {
    const newErrors: Partial<Record<keyof T, string>> = {}
    let isValid = true

    Object.keys(validationRules).forEach((key) => {
      const name = key as keyof T
      const rules = validationRules[name]
      const error = validateField(name, values[name], rules)
      if (error) {
        newErrors[name] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const reset = () => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    clearError,
    handleChange,
    handleBlur,
    validate,
    reset,
  }
}

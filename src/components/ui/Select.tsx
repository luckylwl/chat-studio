import React from 'react'
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Listbox, Transition } from '@headlessui/react'
import { cn } from '@/utils'

export interface SelectOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  error?: boolean
  errorMessage?: string
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ options, value, onChange, placeholder, disabled, className, error, errorMessage }, ref) => {
    const selectedOption = options.find(option => option.value === value)

    return (
      <div className="w-full" ref={ref}>
        <Listbox value={value} onChange={onChange} disabled={disabled}>
          <div className="relative">
            <Listbox.Button
              className={cn(
                'relative w-full cursor-default rounded-xl border border-gray-200 bg-white py-3 pl-4 pr-10 text-left shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 hover:shadow-md focus:shadow-lg',
                'dark:border-gray-800 dark:bg-gray-900 dark:text-white',
                error && 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400',
                disabled && 'cursor-not-allowed opacity-50',
                className
              )}
            >
              <span className="flex items-center">
                <span className={cn(
                  'block truncate text-sm',
                  !selectedOption && 'text-gray-500 dark:text-gray-400'
                )}>
                  {selectedOption ? selectedOption.label : placeholder || 'Select an option'}
                </span>
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronDownIcon
                  className="h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Listbox.Button>

            <Transition
              as={React.Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white py-2 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-900 dark:ring-gray-800">
                {options.map((option) => (
                  <Listbox.Option
                    key={option.value}
                    className={({ active, disabled: optionDisabled }) =>
                      cn(
                        'relative cursor-default select-none py-3 pl-10 pr-4 text-sm',
                        active ? 'bg-primary-50 text-primary-900 dark:bg-primary-950 dark:text-primary-100' : 'text-gray-900 dark:text-gray-100',
                        optionDisabled && 'cursor-not-allowed opacity-50'
                      )
                    }
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {({ selected }) => (
                      <>
                        <div className="flex flex-col">
                          <span className={cn(
                            'block truncate',
                            selected ? 'font-medium' : 'font-normal'
                          )}>
                            {option.label}
                          </span>
                          {option.description && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {option.description}
                            </span>
                          )}
                        </div>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600 dark:text-primary-400">
                            <CheckIcon className="h-4 w-4" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </Listbox>
        {error && errorMessage && (
          <p className="mt-2 text-sm text-red-500 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
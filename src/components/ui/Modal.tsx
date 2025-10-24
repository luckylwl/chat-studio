import React from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw]'
}

const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className
}) => {
  return (
    <Transition appear show={open} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeOnOverlayClick ? onClose : () => {}}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={cn(
                  'w-full transform overflow-hidden rounded-2xl bg-white/95 backdrop-blur-xl p-6 text-left align-middle shadow-2xl transition-all border border-white/20 dark:bg-gray-900/95 dark:border-gray-800/20',
                  sizeClasses[size],
                  className
                )}
              >
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      {title && (
                        <Dialog.Title
                          as="h3"
                          className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100"
                        >
                          {title}
                        </Dialog.Title>
                      )}
                      {description && (
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {description}
                        </p>
                      )}
                    </div>
                    {showCloseButton && (
                      <button
                        type="button"
                        className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                        onClick={onClose}
                      >
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-4">
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export { Modal }
import React, { Fragment } from 'react'
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/utils'

interface DialogProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  children,
  className
}) => {
  return (
    <Transition show={open} as={Fragment}>
      <HeadlessDialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </Transition.Child>

        {/* Full-screen container */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <HeadlessDialog.Panel
              className={cn(
                'w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all',
                className
              )}
            >
              {children}
            </HeadlessDialog.Panel>
          </Transition.Child>
        </div>
      </HeadlessDialog>
    </Transition>
  )
}

interface DialogTitleProps {
  children: React.ReactNode
  className?: string
  onClose?: () => void
}

export const DialogTitle: React.FC<DialogTitleProps> = ({
  children,
  className,
  onClose
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <HeadlessDialog.Title
        className={cn(
          'text-lg font-semibold text-gray-900 dark:text-white',
          className
        )}
      >
        {children}
      </HeadlessDialog.Title>
      {onClose && (
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

interface DialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

export const DialogDescription: React.FC<DialogDescriptionProps> = ({
  children,
  className
}) => {
  return (
    <HeadlessDialog.Description
      className={cn(
        'text-sm text-gray-600 dark:text-gray-400 mb-4',
        className
      )}
    >
      {children}
    </HeadlessDialog.Description>
  )
}

interface DialogFooterProps {
  children: React.ReactNode
  className?: string
}

export const DialogFooter: React.FC<DialogFooterProps> = ({
  children,
  className
}) => {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 mt-6',
        className
      )}
    >
      {children}
    </div>
  )
}

export default Dialog
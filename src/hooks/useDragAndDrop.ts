import { useState, useCallback, useRef, DragEvent } from 'react'

interface UseDragAndDropOptions {
  onFilesDrop?: (files: File[]) => void
  accept?: string[]
  maxFiles?: number
  maxSize?: number // in bytes
}

export const useDragAndDrop = (options: UseDragAndDropOptions = {}) => {
  const {
    onFilesDrop,
    accept = ['image/*', 'text/*', '.pdf', '.doc', '.docx'],
    maxFiles = 5,
    maxSize = 10 * 1024 * 1024 // 10MB
  } = options

  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dragCounter = useRef(0)

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize) {
      return `File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / (1024 * 1024))}MB.`
    }

    // Check file type
    const isValidType = accept.some(acceptType => {
      if (acceptType.startsWith('.')) {
        return file.name.toLowerCase().endsWith(acceptType.toLowerCase())
      }
      if (acceptType.includes('*')) {
        const [type] = acceptType.split('/')
        return file.type.startsWith(type)
      }
      return file.type === acceptType
    })

    if (!isValidType) {
      return `File type "${file.type || 'unknown'}" is not supported.`
    }

    return null
  }, [accept, maxSize])

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files)

    // Check number of files
    if (fileArray.length > maxFiles) {
      setError(`Too many files. Maximum is ${maxFiles} files.`)
      return
    }

    // Validate each file
    const errors: string[] = []
    const validFiles: File[] = []

    fileArray.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      setError(errors.join('\n'))
      return
    }

    setError(null)
    if (validFiles.length > 0 && onFilesDrop) {
      setIsUploading(true)
      try {
        onFilesDrop(validFiles)
      } finally {
        setIsUploading(false)
      }
    }
  }, [maxFiles, validateFile, onFilesDrop])

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    dragCounter.current += 1
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    dragCounter.current -= 1
    if (dragCounter.current === 0) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsDragOver(false)
    dragCounter.current = 0

    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const dragProps = {
    onDragEnter: handleDragEnter,
    onDragLeave: handleDragLeave,
    onDragOver: handleDragOver,
    onDrop: handleDrop
  }

  return {
    dragProps,
    isDragOver,
    isUploading,
    error,
    clearError,
    handleFiles
  }
}
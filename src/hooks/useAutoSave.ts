import { useEffect, useRef, useCallback } from 'react'
import { debounce } from 'lodash-es'

interface UseAutoSaveOptions {
  data: any
  saveFunction: (data: any) => Promise<void> | void
  delay?: number
  enabled?: boolean
  deps?: any[]
}

export const useAutoSave = ({
  data,
  saveFunction,
  delay = 2000,
  enabled = true,
  deps = []
}: UseAutoSaveOptions) => {
  const lastSavedDataRef = useRef<string>('')
  const savePromiseRef = useRef<Promise<void> | null>(null)

  const debouncedSave = useCallback(
    debounce(async (dataToSave: any) => {
      const currentDataString = JSON.stringify(dataToSave)

      // Only save if data has actually changed
      if (currentDataString === lastSavedDataRef.current) {
        return
      }

      try {
        savePromiseRef.current = Promise.resolve(saveFunction(dataToSave))
        await savePromiseRef.current
        lastSavedDataRef.current = currentDataString
      } catch (error) {
        console.error('Auto-save error:', error)
      } finally {
        savePromiseRef.current = null
      }
    }, delay),
    [saveFunction, delay]
  )

  useEffect(() => {
    if (!enabled || !data) return

    debouncedSave(data)

    return () => {
      debouncedSave.cancel()
    }
  }, [data, enabled, debouncedSave, ...deps])

  // Force save immediately
  const forceSave = useCallback(async () => {
    debouncedSave.cancel() // Cancel any pending debounced save

    if (savePromiseRef.current) {
      await savePromiseRef.current // Wait for any ongoing save
    }

    const currentDataString = JSON.stringify(data)
    if (currentDataString !== lastSavedDataRef.current) {
      try {
        await saveFunction(data)
        lastSavedDataRef.current = currentDataString
      } catch (error) {
        console.error('Force save error:', error)
        throw error
      }
    }
  }, [data, saveFunction, debouncedSave])

  // Check if there are unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    return JSON.stringify(data) !== lastSavedDataRef.current
  }, [data])

  return {
    forceSave,
    hasUnsavedChanges
  }
}

// Hook for auto-saving on browser close/refresh
export const useBeforeUnload = (hasUnsavedChanges: () => boolean, forceSave: () => Promise<void>) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        event.preventDefault()
        event.returnValue = ''

        // Try to save (though this might not work in all browsers)
        forceSave().catch(console.error)

        return ''
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges()) {
        forceSave().catch(console.error)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [hasUnsavedChanges, forceSave])
}
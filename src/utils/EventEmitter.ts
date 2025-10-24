/**
 * Browser-compatible EventEmitter implementation
 * Replaces Node.js 'events' module for browser environments
 */
export class EventEmitter {
  private events: Map<string, Function[]> = new Map()

  on(event: string, listener: Function): void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(listener)
  }

  once(event: string, listener: Function): void {
    const onceWrapper = (...args: any[]) => {
      listener(...args)
      this.removeListener(event, onceWrapper)
    }
    this.on(event, onceWrapper)
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event)
    if (listeners && listeners.length > 0) {
      listeners.forEach(listener => {
        try {
          listener(...args)
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error)
        }
      })
      return true
    }
    return false
  }

  removeListener(event: string, listener: Function): void {
    const listeners = this.events.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
      if (listeners.length === 0) {
        this.events.delete(event)
      }
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
  }

  listenerCount(event: string): number {
    const listeners = this.events.get(event)
    return listeners ? listeners.length : 0
  }

  eventNames(): string[] {
    return Array.from(this.events.keys())
  }
}

export default EventEmitter
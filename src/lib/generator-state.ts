/**
 * Global state management for generators
 * Persists state across tab switches and page refreshes
 */

export interface GeneratorState {
  [generatorType: string]: {
    form: unknown
    isGenerating: boolean
    result: unknown
    error: string | null
    queueStatus: string
    generationStatus: unknown
    timestamp: number
  }
}

class GeneratorStateManager {
  private static instance: GeneratorStateManager
  private state: GeneratorState = {}
  private listeners: Map<string, Set<() => void>> = new Map()
  private saveTimeout: Map<string, NodeJS.Timeout> = new Map()
  private listenerTimeout: Map<string, NodeJS.Timeout> = new Map()
  private isLoaded = false

  static getInstance(): GeneratorStateManager {
    if (!GeneratorStateManager.instance) {
      GeneratorStateManager.instance = new GeneratorStateManager()
    }
    return GeneratorStateManager.instance
  }

  // Load state from localStorage (only once)
  private loadState(): void {
    if (this.isLoaded) return
    
    try {
      const saved = localStorage.getItem('generatorStates')
      if (saved) {
        this.state = JSON.parse(saved)
      }
      this.isLoaded = true
    } catch (error) {
      console.error('Error loading generator states:', error)
    }
  }

  // Save state to localStorage with debouncing
  private saveState(generatorType?: string): void {
    try {
      localStorage.setItem('generatorStates', JSON.stringify(this.state))
    } catch (error) {
      console.error('Error saving generator states:', error)
    }
  }

  // Debounced save for form updates
  private debouncedSave(generatorType: string): void {
    // Clear existing timeout
    if (this.saveTimeout.has(generatorType)) {
      clearTimeout(this.saveTimeout.get(generatorType)!)
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.saveState()
      this.saveTimeout.delete(generatorType)
    }, 500) // 500ms debounce

    this.saveTimeout.set(generatorType, timeout)
  }

  // Get state for a specific generator
  getState(generatorType: string) {
    this.loadState()
    try {
      return this.state[generatorType] || null
    } catch (error) {
      console.error('Error getting state for', generatorType, ':', error)
      return null
    }
  }

  // Update state for a specific generator
  updateState(generatorType: string, updates: Partial<GeneratorState[string]>, debounce = false) {
    this.loadState()
    
    try {
      if (!this.state[generatorType]) {
        this.state[generatorType] = {
          form: {},
          isGenerating: false,
          result: null,
          error: null,
          queueStatus: '',
          generationStatus: null,
          timestamp: Date.now()
        }
      }

      this.state[generatorType] = {
        ...this.state[generatorType],
        ...updates,
        timestamp: Date.now()
      }

      // Use debounced save for form updates to prevent performance issues
      if (debounce) {
        this.debouncedSave(generatorType)
      } else {
        this.saveState()
      }

      // Notify listeners
      this.notifyListeners(generatorType)
    } catch (error) {
      console.error('Error updating state for', generatorType, ':', error)
    }
  }

  // Update form state with debouncing (for typing performance)
  updateFormState(generatorType: string, formUpdates: unknown) {
    this.loadState()
    
    if (!this.state[generatorType]) {
      this.state[generatorType] = {
        form: {},
        isGenerating: false,
        result: null,
        error: null,
        queueStatus: '',
        generationStatus: null,
        timestamp: Date.now()
      }
    }

    this.state[generatorType] = {
      ...this.state[generatorType],
      form: formUpdates,
      timestamp: Date.now()
    }

    // Always debounce form updates to localStorage only
    this.debouncedSave(generatorType)

    // Do NOT notify listeners for form updates to avoid typing lag
  }

  // Clear state for a specific generator
  clearState(generatorType: string) {
    this.loadState()
    delete this.state[generatorType]
    this.saveState()
    this.notifyListeners(generatorType)
  }

  // Clear all states
  clearAllStates() {
    this.state = {}
    this.saveState()
    this.notifyListeners('*')
  }

  // Subscribe to state changes
  subscribe(generatorType: string, callback: () => void) {
    if (!this.listeners.has(generatorType)) {
      this.listeners.set(generatorType, new Set())
    }
    this.listeners.get(generatorType)!.add(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(generatorType)
      if (callbacks) {
        callbacks.delete(callback)
      }
    }
  }

  // Notify listeners of state changes
  private notifyListeners(generatorType: string) {
    const callbacks = this.listeners.get(generatorType)
    if (callbacks) {
      callbacks.forEach(callback => callback())
    }

    // Also notify global listeners
    const globalCallbacks = this.listeners.get('*')
    if (globalCallbacks) {
      globalCallbacks.forEach(callback => callback())
    }
  }

  // Check if a generator is currently running
  isGenerating(generatorType: string): boolean {
    const state = this.getState(generatorType)
    return state?.isGenerating || false
  }

  // Get all active generations
  getActiveGenerations(): string[] {
    this.loadState()
    return Object.entries(this.state)
      .filter(([, state]) => state.isGenerating)
      .map(([type]) => type)
  }

  // Clean up old states (older than 24 hours)
  cleanupOldStates() {
    this.loadState()
    const now = Date.now()
    const oneDay = 24 * 60 * 60 * 1000

    Object.keys(this.state).forEach(key => {
      const state = this.state[key]
      if (now - state.timestamp > oneDay) {
        delete this.state[key]
      }
    })

    this.saveState()
  }

  // Clean up stale generation states (generations that have been running for more than 10 minutes)
  cleanupStaleGenerations() {
    this.loadState()
    const now = Date.now()
    const tenMinutes = 10 * 60 * 1000

    Object.keys(this.state).forEach(key => {
      const state = this.state[key]
      if (state.isGenerating && (now - state.timestamp > tenMinutes)) {
        // If a generation has been running for more than 10 minutes, mark it as failed
        this.state[key] = {
          ...state,
          isGenerating: false,
          error: 'Generation timed out. Please try again.',
          generationStatus: {
            status: 'Generation timed out',
            estimatedTime: 0,
            progress: 0,
            stage: 'error'
          }
        }
      }
    })

    this.saveState()
  }
}

// Export singleton instance
export const generatorStateManager = GeneratorStateManager.getInstance()

// Auto-cleanup old states on import
if (typeof window !== 'undefined') {
  generatorStateManager.cleanupOldStates()
  generatorStateManager.cleanupStaleGenerations()
} 
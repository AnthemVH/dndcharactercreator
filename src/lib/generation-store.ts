import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface GenerationJob {
  id: string
  type: 'character' | 'npc' | 'item' | 'quest' | 'encounter' | 'world' | 'campaign'
  prompt: string
  status: 'pending' | 'generating' | 'content-complete' | 'image-generating' | 'complete' | 'error'
  progress: number
  estimatedTime: number
  startTime: number
  content?: unknown
  image?: string
  error?: string
  formData?: unknown
}

export interface GenerationStore {
  // Active jobs
  activeJobs: Map<string, GenerationJob>
  
  // Completed generations (for quick access)
  completedGenerations: Map<string, GenerationJob>
  
  // Actions
  createJob: (job: Omit<GenerationJob, 'id' | 'startTime'>) => string
  updateJob: (id: string, updates: Partial<GenerationJob>) => void
  completeJob: (id: string, content: unknown, image?: string) => void
  failJob: (id: string, error: string) => void
  removeJob: (id: string) => void
  
  // Queries
  getJob: (id: string) => GenerationJob | undefined
  getActiveJobs: () => GenerationJob[]
  getCompletedJobs: () => GenerationJob[]
  getJobsByType: (type: GenerationJob['type']) => GenerationJob[]
  isGenerating: (type?: GenerationJob['type']) => boolean
  
  // Cleanup
  cleanupOldJobs: () => void
  cleanupStaleJobs: () => void
  resetStore: () => void
}

export const useGenerationStore = create<GenerationStore>()(
  persist(
    (set, get) => ({
      activeJobs: new Map(),
      completedGenerations: new Map(),

      createJob: (jobData) => {
        const id = crypto.randomUUID()
        const job: GenerationJob = {
          ...jobData,
          id,
          startTime: Date.now(),
          progress: 0,
          estimatedTime: 0,
        }
        
        set((state) => {
          const newActiveJobs = new Map(state.activeJobs)
          newActiveJobs.set(id, job)
          return { activeJobs: newActiveJobs }
        })
        
        return id
      },

      updateJob: (id, updates) => {
        set((state) => {
          const job = state.activeJobs.get(id)
          if (!job) return state

          const updatedJob = { ...job, ...updates }
          const newActiveJobs = new Map(state.activeJobs)
          newActiveJobs.set(id, updatedJob)
          
          return { activeJobs: newActiveJobs }
        })
      },

      completeJob: (id, content, image) => {
        set((state) => {
          const job = state.activeJobs.get(id)
          if (!job) return state

          const completedJob: GenerationJob = {
            ...job,
            status: 'complete',
            progress: 100,
            content,
            image,
            estimatedTime: Date.now() - job.startTime,
          }

          const newActiveJobs = new Map(state.activeJobs)
          newActiveJobs.delete(id)
          
          const newCompletedGenerations = new Map(state.completedGenerations)
          newCompletedGenerations.set(id, completedJob)
          
          return {
            activeJobs: newActiveJobs,
            completedGenerations: newCompletedGenerations,
          }
        })
      },

      failJob: (id, error) => {
        set((state) => {
          const job = state.activeJobs.get(id)
          if (!job) return state

          const failedJob: GenerationJob = {
            ...job,
            status: 'error',
            error,
            estimatedTime: Date.now() - job.startTime,
          }

          const newActiveJobs = new Map(state.activeJobs)
          newActiveJobs.delete(id)
          
          const newCompletedGenerations = new Map(state.completedGenerations)
          newCompletedGenerations.set(id, failedJob)
          
          return {
            activeJobs: newActiveJobs,
            completedGenerations: newCompletedGenerations,
          }
        })
      },

      removeJob: (id) => {
        set((state) => {
          const newActiveJobs = new Map(state.activeJobs)
          const newCompletedGenerations = new Map(state.completedGenerations)
          
          newActiveJobs.delete(id)
          newCompletedGenerations.delete(id)
          
          return {
            activeJobs: newActiveJobs,
            completedGenerations: newCompletedGenerations,
          }
        })
      },

      getJob: (id) => {
        const state = get()
        return state.activeJobs.get(id) || state.completedGenerations.get(id)
      },

      getActiveJobs: () => {
        const state = get()
        if (!state.activeJobs || typeof state.activeJobs.values !== 'function') {
          console.warn('activeJobs is not a Map, resetting to empty Map')
          return []
        }
        return Array.from(state.activeJobs.values())
      },

      getCompletedJobs: () => {
        const state = get()
        if (!state.completedGenerations || typeof state.completedGenerations.values !== 'function') {
          console.warn('completedGenerations is not a Map, resetting to empty Map')
          return []
        }
        return Array.from(state.completedGenerations.values())
      },

      getJobsByType: (type) => {
        const state = get()
        const activeJobs = state.activeJobs && typeof state.activeJobs.values === 'function' 
          ? Array.from(state.activeJobs.values()).filter(job => job.type === type)
          : []
        const completedJobs = state.completedGenerations && typeof state.completedGenerations.values === 'function'
          ? Array.from(state.completedGenerations.values()).filter(job => job.type === type)
          : []
        return [...activeJobs, ...completedJobs]
      },

      isGenerating: (type) => {
        const state = get()
        if (!state.activeJobs || typeof state.activeJobs.values !== 'function') {
          return false
        }
        if (type) {
          return Array.from(state.activeJobs.values()).some(job => job.type === type)
        }
        return state.activeJobs.size > 0
      },

      cleanupOldJobs: () => {
        const now = Date.now()
        const oneDay = 24 * 60 * 60 * 1000
        
        set((state) => {
          const newCompletedGenerations = new Map(state.completedGenerations)
          
          for (const [id, job] of newCompletedGenerations.entries()) {
            if (now - job.startTime > oneDay) {
              newCompletedGenerations.delete(id)
            }
          }
          
          return { completedGenerations: newCompletedGenerations }
        })
      },

      cleanupStaleJobs: () => {
        const now = Date.now()
        const tenMinutes = 10 * 60 * 1000
        
        set((state) => {
          const newActiveJobs = new Map(state.activeJobs)
          const newCompletedGenerations = new Map(state.completedGenerations)
          
          for (const [id, job] of newActiveJobs.entries()) {
            if (now - job.startTime > tenMinutes) {
              const staleJob: GenerationJob = {
                ...job,
                status: 'error',
                error: 'Generation timed out. Please try again.',
                estimatedTime: now - job.startTime,
              }
              
              newActiveJobs.delete(id)
              newCompletedGenerations.set(id, staleJob)
            }
          }
          
          return {
            activeJobs: newActiveJobs,
            completedGenerations: newCompletedGenerations,
          }
        })
      },

      resetStore: () => {
        set({
          activeJobs: new Map(),
          completedGenerations: new Map(),
        })
      },
    }),
    {
      name: 'generation-store',
      // Custom serialization for Map objects
      serialize: (state) => {
        return JSON.stringify({
          activeJobs: Array.from(state.activeJobs.entries()),
          completedGenerations: Array.from(state.completedGenerations.entries()),
        })
      },
                        deserialize: (str) => {
                    try {
                      const data = JSON.parse(str)
                      return {
                        activeJobs: new Map(Array.isArray(data.activeJobs) ? data.activeJobs : []),
                        completedGenerations: new Map(Array.isArray(data.completedGenerations) ? data.completedGenerations : []),
                      }
                    } catch (error) {
                      console.warn('Failed to deserialize generation store, using defaults:', error)
                      return {
                        activeJobs: new Map(),
                        completedGenerations: new Map(),
                      }
                    }
                  },
    }
  )
)

// Auto-cleanup on store initialization
if (typeof window !== 'undefined') {
  // Clear any corrupted localStorage data
  try {
    const store = useGenerationStore.getState()
    
    // Check if Maps are valid
    if (!store.activeJobs || typeof store.activeJobs.values !== 'function' ||
        !store.completedGenerations || typeof store.completedGenerations.values !== 'function') {
      console.warn('Store Maps are corrupted, resetting store')
      store.resetStore()
    } else {
      store.cleanupOldJobs()
      store.cleanupStaleJobs()
    }
  } catch (error) {
    console.warn('Error initializing generation store, clearing localStorage:', error)
    localStorage.removeItem('generation-store')
    const store = useGenerationStore.getState()
    store.resetStore()
  }
}

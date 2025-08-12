import { useEffect, useCallback, useMemo } from 'react'
import { useGenerationStore, GenerationJob } from './generation-store'
import { backgroundGenerator, GenerationRequest } from './background-generator'

export interface UseGenerationOptions {
  type: GenerationJob['type']
  userId: string
  onComplete?: (job: GenerationJob) => void
  onError?: (job: GenerationJob) => void
}

export function useGeneration(options: UseGenerationOptions) {
  const { type, userId, onComplete, onError } = options
  
  const store = useGenerationStore()
  
  // Get jobs for this type
  const jobs = useMemo(() => store.getJobsByType(type), [store, type])
  const activeJobs = useMemo(() => jobs.filter(job => job.status !== 'complete' && job.status !== 'error'), [jobs])
  const completedJobs = useMemo(() => jobs.filter(job => job.status === 'complete'), [jobs])
  const failedJobs = useMemo(() => jobs.filter(job => job.status === 'error'), [jobs])
  
  // Check if currently generating
  const isGenerating = useMemo(() => store.isGenerating(type), [store, type])
  
  // Start a new generation
  const startGeneration = useCallback(async (request: Omit<GenerationRequest, 'type' | 'userId'>) => {
    const jobId = await backgroundGenerator.startGeneration({
      ...request,
      type,
      userId,
    })
    return jobId
  }, [type, userId])
  
  // Cancel a job
  const cancelJob = useCallback((jobId: string) => {
    backgroundGenerator.cancelJob(jobId)
  }, [])
  
  // Retry a failed job
  const retryJob = useCallback(async (jobId: string) => {
    await backgroundGenerator.retryJob(jobId)
  }, [])
  
  // Get the most recent completed job
  const latestResult = useMemo(() => {
    if (completedJobs.length === 0) return null
    return completedJobs.sort((a, b) => b.startTime - a.startTime)[0]
  }, [completedJobs])
  
  // Get the most recent failed job
  const latestError = useMemo(() => {
    if (failedJobs.length === 0) return null
    return failedJobs.sort((a, b) => b.startTime - a.startTime)[0]
  }, [failedJobs])
  
  // Get the currently active job (if any)
  const currentJob = useMemo(() => {
    if (activeJobs.length === 0) return null
    return activeJobs[0] // For now, just return the first active job
  }, [activeJobs])
  
  // Callbacks for job completion/error
  useEffect(() => {
    if (latestResult && onComplete) {
      onComplete(latestResult)
    }
  }, [latestResult, onComplete])
  
  useEffect(() => {
    if (latestError && onError) {
      onError(latestError)
    }
  }, [latestError, onError])
  
  return {
    // State
    jobs,
    activeJobs,
    completedJobs,
    failedJobs,
    currentJob,
    latestResult,
    latestError,
    isGenerating,
    
    // Actions
    startGeneration,
    cancelJob,
    retryJob,
    
    // Store access
    store,
  }
}

// Hook for getting all active generations (for the ActiveGenerations component)
export function useActiveGenerations() {
  const store = useGenerationStore()
  
  const activeJobs = useMemo(() => store.getActiveJobs(), [store])
  const completedJobs = useMemo(() => store.getCompletedJobs(), [store])
  
  const totalActive = useMemo(() => activeJobs.length, [activeJobs])
  const totalCompleted = useMemo(() => completedJobs.length, [completedJobs])
  
  return {
    activeJobs,
    completedJobs,
    totalActive,
    totalCompleted,
    hasActiveJobs: totalActive > 0,
  }
}

'use client'

import { useState } from 'react'
import { Clock, CheckCircle, AlertCircle, Loader2, Eye, X, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useGenerationStore, GenerationJob } from '@/lib/generation-store'
import { Card } from '@/components/ui/card'

export default function ActiveGenerations() {
  const { removeJob } = useGenerationStore()
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const { getActiveJobs, getCompletedJobs, isGenerating } = useGenerationStore()
  
  const activeJobs = getActiveJobs()
  const completedJobs = getCompletedJobs()
  const hasActiveJobs = isGenerating()

  const getGeneratorDisplayName = (type: string) => {
    const names: { [key: string]: string } = {
      'character': 'Character Generator',
      'npc': 'NPC Generator',
      'world': 'World Builder',
      'item': 'Item Generator',
      'quest': 'Quest Builder',
      'campaign': 'Campaign Generator',
      'encounter': 'Encounter Creator'
    }
    return names[type] || type
  }

  const getStatusIcon = (status: GenerationJob['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-slate-500" />
      case 'generating':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'content-complete':
        return <Clock className="w-4 h-4 text-slate-500" />
      case 'image-generating':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-slate-500" />
    }
  }

  const getStatusText = (job: GenerationJob) => {
    switch (job.status) {
      case 'pending':
        return 'Queued...'
      case 'generating':
        return 'Generating content...'
      case 'content-complete':
        return 'Content complete'
      case 'image-generating':
        return 'Generating image...'
      case 'complete':
        return 'Complete'
      case 'error':
        return job.error || 'Error'
      default:
        return 'Processing...'
    }
  }

  const handleGenerationClick = async (job: GenerationJob) => {
    if (isNavigating) return // Prevent multiple navigation attempts
    
    try {
      setIsNavigating(true)
      
      // Navigate to the appropriate generator page immediately
      const routes: { [key: string]: string } = {
        'character': '/dashboard/character-generator',
        'npc': '/dashboard/npc-generator',
        'world': '/dashboard/world-lore-builder',
        'item': '/dashboard/item-generator',
        'quest': '/dashboard/quest-generator',
        'campaign': '/dashboard/campaign-generator',
        'encounter': '/dashboard/encounter-creator'
      }
      
      const route = routes[job.type]
      if (route) {
        // Navigate immediately, don't wait for generation status
        router.replace(route)
        
        // If completed, scroll to result section after navigation
        if (job.status === 'complete' && job.content) {
          setTimeout(() => {
            const resultId = `${job.type}-result`
            const resultElement = document.getElementById(resultId)
            if (resultElement) {
              resultElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }, 500) // Increased delay to ensure page is loaded
        }
      }
    } catch (error) {
      console.error('Navigation error:', error)
    } finally {
      // Reset navigation state after a delay
      setTimeout(() => setIsNavigating(false), 1000)
    }
  }

  const removeCompletedJob = (jobId: string) => {
    removeJob(jobId)
  }

  const allJobs = [...activeJobs, ...completedJobs]

  if (allJobs.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="fantasy-card bg-slate-50 border border-slate-200 shadow-lg p-4 max-w-sm">
        <h3 className="fantasy-title text-sm font-semibold mb-3">
          Active Generations ({allJobs.length})
        </h3>
        <div className="space-y-3">
          {allJobs.map((job) => (
            <div
              key={job.id}
              className={`flex items-center space-x-3 p-2 rounded-lg transition-all duration-200 ${
                isNavigating ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              } ${
                job.status === 'complete'
                  ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                  : job.status === 'error'
                  ? 'bg-red-50 border border-red-200 hover:bg-red-100'
                  : 'bg-white border border-slate-200 hover:bg-slate-50'
              }`}
              onClick={() => !isNavigating && handleGenerationClick(job)}
            >
              {getStatusIcon(job.status)}
              <div className="flex-1 min-w-0">
                <p className="fantasy-title text-sm font-medium truncate">
                  {getGeneratorDisplayName(job.type)}
                </p>
                <p className="fantasy-text text-xs text-gray-600 truncate">
                  {getStatusText(job)}
                </p>
                {job.progress > 0 && job.status !== 'complete' && job.status !== 'error' && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-slate-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                {job.status === 'complete' ? (
                  <div className="mt-1 flex items-center space-x-2">
                    <Eye className="w-3 h-3 text-green-500" />
                    <span className="fantasy-text text-xs text-green-600">
                      {isNavigating ? 'Navigating...' : 'Click to view'}
                    </span>
                  </div>
                ) : job.status === 'error' ? (
                  <div className="mt-1 flex items-center space-x-2">
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span className="fantasy-text text-xs text-red-600">
                      {isNavigating ? 'Navigating...' : 'Click to retry'}
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center space-x-2">
                    <Eye className="w-3 h-3 text-slate-500" />
                    <span className="fantasy-text text-xs text-slate-600">
                      {isNavigating ? 'Navigating...' : 'Click to monitor'}
                    </span>
                  </div>
                )}
              </div>
              {(job.status === 'complete' || job.status === 'error') && !isNavigating && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeCompletedJob(job.id)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 
export interface GenerationStatus {
  status: string
  estimatedTime: number
  progress: number
  stage: 'queued' | 'processing' | 'generating' | 'portrait' | 'complete' | 'error'
}

export const getStatusMessage = (stage: GenerationStatus['stage'], queuePosition?: number, estimatedTime?: number): string => {
  switch (stage) {
    case 'queued':
      return queuePosition ? `Position ${queuePosition} in queue...` : 'Submitting to queue...'
    case 'processing':
      return 'Processing request...'
    case 'generating':
      return 'Generating content with AI...'
    case 'portrait':
      return 'Generating portrait image with AI...'
    case 'complete':
      return 'Generation complete!'
    case 'error':
      return 'Generation failed'
    default:
      return 'Preparing generation...'
  }
}

export const getEstimatedTime = (stage: GenerationStatus['stage'], queuePosition: number = 0, baseTime: number = 30): number => {
  switch (stage) {
    case 'queued':
      return queuePosition * baseTime
    case 'processing':
      return 15
    case 'generating':
      return 45
    case 'portrait':
      return 120
    case 'complete':
      return 0
    case 'error':
      return 0
    default:
      return 30
  }
}

export const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

export const getProgressPercentage = (stage: GenerationStatus['stage']): number => {
  switch (stage) {
    case 'queued':
      return 10
    case 'processing':
      return 25
    case 'generating':
      return 60
    case 'portrait':
      return 80
    case 'complete':
      return 100
    case 'error':
      return 0
    default:
      return 0
  }
} 
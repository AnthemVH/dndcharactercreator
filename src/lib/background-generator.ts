import { useGenerationStore, GenerationJob } from './generation-store'

export interface BackgroundForm {
  characterName?: string
  race: string
  class: string
  background: string
  personalityType?: string
  customPrompt?: string
}

export interface GeneratedBackground {
  characterName: string
  race: string
  class: string
  background: string
  backstory: string
  personalityTraits: string[]
  ideals: string[]
  bonds: string[]
  flaws: string[]
  quote: string
  uniqueTrait: string
  portrait?: string
  portraitUrl?: string
}

class BackgroundGenerator {
  private static instance: BackgroundGenerator
  private workers: Map<string, Worker> = new Map()

  static getInstance(): BackgroundGenerator {
    if (!BackgroundGenerator.instance) {
      BackgroundGenerator.instance = new BackgroundGenerator()
    }
    return BackgroundGenerator.instance
  }

  async startGeneration(request: GenerationRequest): Promise<string> {
    const store = useGenerationStore.getState()
    
    // Create job in store
    const jobId = store.createJob({
      type: request.type,
      prompt: request.prompt,
      formData: request.formData,
      status: 'pending',
      progress: 0,
      estimatedTime: 0,
    })

    // Start background generation
    this.runGeneration(jobId, request)
    
    return jobId
  }

  private async runGeneration(jobId: string, request: GenerationRequest) {
    const store = useGenerationStore.getState()
    
    try {
      // Update status to generating
      store.updateJob(jobId, {
        status: 'generating',
        progress: 10,
      })

      // Generate content
      const content = await this.generateContent(request)
      
      // Update with content
      store.updateJob(jobId, {
        status: 'content-complete',
        progress: 70,
        content,
      })

      // Generate image if needed
      if (!request.skipImage && this.supportsImageGeneration(request.type)) {
        store.updateJob(jobId, {
          status: 'image-generating',
          progress: 80,
        })

        const image = await this.generateImage(request, content)
        
        // Complete job with image
        store.completeJob(jobId, content, image)
      } else {
        // Complete job without image
        store.completeJob(jobId, content)
      }
    } catch (error) {
      console.error('Generation failed:', error)
      store.failJob(jobId, error instanceof Error ? error.message : 'Generation failed')
    }
  }

  private async generateContent(request: GenerationRequest): Promise<Record<string, unknown>> {
    const apiEndpoint = this.getApiEndpoint(request.type)
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request.formData,
        customPrompt: request.prompt,
        userId: request.userId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    return await response.json()
  }

  private async generateImage(request: GenerationRequest, content: Record<string, unknown>): Promise<string> {
    // For now, we'll use the existing image generation logic
    // This could be enhanced to use web workers in the future
    
    const imageResponse = await fetch('/api/generate-portrait', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: this.buildImagePrompt(request.type, content),
        userId: request.userId,
      }),
    })

    if (!imageResponse.ok) {
      throw new Error('Image generation failed')
    }

    const imageData = await imageResponse.json()
    return imageData.imageUrl || imageData.portrait
  }

  private getApiEndpoint(type: GenerationJob['type']): string {
    const endpoints = {
      character: '/api/character-generator',
      npc: '/api/npc-generator',
      item: '/api/item-generator',
      quest: '/api/quest-generator',
      encounter: '/api/encounter-generator',
      world: '/api/world-lore-builder',
      campaign: '/api/campaign-generator',
    }
    
    return endpoints[type]
  }

  private supportsImageGeneration(type: GenerationJob['type']): boolean {
    return ['character', 'npc', 'item'].includes(type)
  }

  private buildImagePrompt(type: GenerationJob['type'], content: Record<string, unknown>): string {
    switch (type) {
      case 'character':
        return `D&D character portrait: ${content.name}, ${content.race} ${content.class}, ${content.appearance || 'fantasy character'}`
      case 'npc':
        return `D&D NPC portrait: ${content.name}, ${content.appearance || 'fantasy NPC'}`
      case 'item':
        return `D&D magical item: ${content.name}, ${content.description || 'fantasy magical item'}`
      default:
        return 'D&D fantasy art'
    }
  }

  // Cancel a generation job
  cancelJob(jobId: string): void {
    const store = useGenerationStore.getState()
    store.removeJob(jobId)
  }

  // Retry a failed job
  async retryJob(jobId: string): Promise<void> {
    const store = useGenerationStore.getState()
    const job = store.getJob(jobId)
    
    if (!job || job.status !== 'error') {
      return
    }

    // Remove the failed job
    store.removeJob(jobId)
    
    // Start a new generation with the same parameters
    await this.startGeneration({
      type: job.type,
      prompt: job.prompt,
      formData: job.formData,
      userId: '', // This should be retrieved from context
      skipImage: !job.image,
    })
  }
}

export const backgroundGenerator = BackgroundGenerator.getInstance()

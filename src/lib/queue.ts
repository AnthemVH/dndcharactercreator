interface QueueItem<T = unknown> {
  id: string
  userId: string
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
  timestamp: Date
  retryCount: number
  priority: number // Higher number = higher priority
}

class OpenRouterQueue {
  private queue: QueueItem[] = []
  private processing = false
  private concurrencyLimit = 5 // Increased from 3 to 5 for better performance
  private activeRequests = 0
  private maxRetries = 3
  private retryDelay = 1000 // Base delay in ms for retries

  async add<T>(execute: () => Promise<T>, userId: string, priority: number = 0): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const item: QueueItem<T> = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId,
        execute,
        resolve,
        reject,
        timestamp: new Date(),
        retryCount: 0,
        priority
      }

      // Insert item based on priority (higher priority first)
      const insertIndex = this.queue.findIndex(queueItem => queueItem.priority < priority)
      if (insertIndex === -1) {
        this.queue.push(item as QueueItem)
      } else {
        this.queue.splice(insertIndex, 0, item as QueueItem)
      }
      
      this.process()
    })
  }

  private async process() {
    if (this.processing) {
      return
    }

    this.processing = true

    while (this.queue.length > 0 && this.activeRequests < this.concurrencyLimit) {
      const item = this.queue.shift()
      if (!item) continue

      this.activeRequests++
      // Don't await - process in parallel
      this.processItem(item).catch(() => {
        // Error already handled in processItem
      })
    }

    this.processing = false
  }

  private async processItem(item: QueueItem) {
    try {
      const result = await item.execute()
      item.resolve(result)
    } catch (error) {
      // Check if it's a rate limit error (429) or server error (5xx)
      if (error instanceof Error && (
        error.message.includes('429') || 
        error.message.includes('503') ||
        error.message.includes('502') ||
        error.message.includes('500')
      )) {
        // Retry with exponential backoff if we haven't exceeded max retries
        if (item.retryCount < this.maxRetries) {
          item.retryCount++
          const delay = this.retryDelay * Math.pow(2, item.retryCount - 1) // Exponential backoff
          
          setTimeout(() => {
            // Put the item back at the front of the queue for retry
            this.queue.unshift(item)
            this.process()
          }, delay)
        } else {
          item.reject(new Error(`Max retries exceeded: ${error.message}`))
        }
      } else {
        item.reject(error)
      }
    } finally {
      this.activeRequests--
      
      // Continue processing if there are more items and we have capacity
      if (this.queue.length > 0 && this.activeRequests < this.concurrencyLimit) {
        setTimeout(() => this.process(), 100) // Small delay to prevent overwhelming
      }
    }
  }

  getQueueLength(): number {
    return this.queue.length
  }

  isProcessing(): boolean {
    return this.processing || this.activeRequests > 0
  }

  getUserPosition(userId: string): number {
    const position = this.queue.findIndex(item => item.userId === userId)
    return position >= 0 ? position + 1 : 0
  }

  getQueueInfo(): { length: number; processing: boolean; activeRequests: number; items: Array<{ id: string; userId: string; timestamp: Date }> } {
    return {
      length: this.queue.length,
      processing: this.processing,
      activeRequests: this.activeRequests,
      items: this.queue.map(item => ({
        id: item.id,
        userId: item.userId,
        timestamp: item.timestamp
      }))
    }
  }
}

// Export a singleton instance
export const openRouterQueue = new OpenRouterQueue() 
interface QueueItem<T = unknown> {
  id: string
  userId: string
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
  timestamp: Date
}

class OpenRouterQueue {
  private queue: QueueItem[] = []
  private processing = false
  private concurrencyLimit = 3 // Increased from 1 to 3
  private activeRequests = 0

  async add<T>(execute: () => Promise<T>, userId: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const item: QueueItem<T> = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId,
        execute,
        resolve,
        reject,
        timestamp: new Date()
      }

      this.queue.push(item as QueueItem)
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
      this.processItem(item)
    }

    this.processing = false
  }

  private async processItem(item: QueueItem) {
    try {
      const result = await item.execute()
      item.resolve(result)
    } catch (error) {
      // Check if it's a rate limit error (429)
      if (error instanceof Error && error.message.includes('429')) {
        // Put the item back at the front of the queue for retry
        this.queue.unshift(item)
      } else {
        item.reject(error)
      }
    } finally {
      this.activeRequests--
      
      // Continue processing if there are more items and we have capacity
      if (this.queue.length > 0 && this.activeRequests < this.concurrencyLimit) {
        this.process()
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
const { cleanupExpiredContent } = require('../src/lib/auto-save')

async function runCleanup() {
  try {
    console.log('Starting cleanup of expired auto-saved content...')
    const deletedCount = await cleanupExpiredContent()
    console.log(`Cleanup completed. Deleted ${deletedCount} expired items.`)
  } catch (error) {
    console.error('Cleanup failed:', error)
  }
}

runCleanup() 
# Global State Management Migration Guide

## Overview

This document outlines the new persistent background generation system using Zustand for global state management. This system replaces the previous `generatorStateManager` with a more robust, navigation-resilient solution.

## Key Features

### 1. Global State Management (Zustand)
- **Centralized Store**: All generation jobs are tracked in a single Zustand store
- **Persistence**: State persists across page navigations and browser refreshes
- **Real-time Updates**: Components automatically update when store state changes
- **Job Tracking**: Each generation has a unique ID and tracks progress independently

### 2. Background Generation
- **Non-blocking**: Generations run in the background without blocking the UI
- **Progress Tracking**: Real-time progress updates for content and image generation
- **Navigation Resilience**: Generations continue even if user navigates away
- **Auto-resume**: When returning to a page, completed jobs are displayed immediately

### 3. Enhanced UI Synchronization
- **Active Generations Tile**: Shows live status of all jobs across the app
- **Real-time Progress**: Progress bars and status updates in real-time
- **Error Handling**: Failed jobs can be retried from the store
- **Job Management**: Cancel, retry, and remove jobs from the global store

## Architecture

### Core Files

1. **`/src/lib/generation-store.ts`** - Zustand store for global state
2. **`/src/lib/background-generator.ts`** - Background generation service
3. **`/src/lib/use-generation.ts`** - React hooks for components
4. **`/src/components/ActiveGenerations.tsx`** - Updated to use global store

### Store Structure

```typescript
interface GenerationJob {
  id: string
  type: 'character' | 'npc' | 'item' | 'quest' | 'encounter' | 'world' | 'campaign'
  prompt: string
  status: 'pending' | 'generating' | 'content-complete' | 'image-generating' | 'complete' | 'error'
  progress: number
  estimatedTime: number
  startTime: number
  content?: any
  image?: string
  error?: string
  formData?: any
}
```

## Migration Steps

### Step 1: Update Component Imports

Replace the old state management imports:

```typescript
// OLD
import { generatorStateManager } from '@/lib/generator-state'

// NEW
import { useGeneration } from '@/lib/use-generation'
```

### Step 2: Replace State Management Logic

Replace the old state management with the new hook:

```typescript
// OLD
const [isGenerating, setIsGenerating] = useState(false)
const [result, setResult] = useState(null)
const [error, setError] = useState(null)

// NEW
const {
  currentJob,
  latestResult,
  latestError,
  isGenerating,
  startGeneration,
  retryJob,
} = useGeneration({
  type: 'character', // or 'npc', 'item', etc.
  userId: 'user-id', // from auth context
  onComplete: (job) => {
    // Handle completion
    setResult(job.content)
  },
  onError: (job) => {
    // Handle error
    setError(job.error)
  },
})
```

### Step 3: Update Generation Function

Replace the old generation logic:

```typescript
// OLD
const generateCharacter = async () => {
  setIsGenerating(true)
  try {
    const response = await fetch('/api/character-generator', {
      method: 'POST',
      body: JSON.stringify(formData),
    })
    const result = await response.json()
    setResult(result)
  } catch (error) {
    setError(error.message)
  } finally {
    setIsGenerating(false)
  }
}

// NEW
const generateCharacter = async () => {
  try {
    await startGeneration({
      prompt: form.customPrompt || 'Generate character',
      formData: form,
      skipImage: form.skipPortrait,
    })
  } catch (error) {
    setError(error.message)
  }
}
```

### Step 4: Update UI Components

Replace status displays with job-based status:

```typescript
// OLD
{isGenerating && <div>Generating...</div>}

// NEW
{currentJob && (
  <div>
    <div>Status: {currentJob.status}</div>
    <div>Progress: {currentJob.progress}%</div>
    <div className="progress-bar">
      <div style={{ width: `${currentJob.progress}%` }} />
    </div>
  </div>
)}
```

### Step 5: Handle Results

Update result handling to use the latest result:

```typescript
// OLD
{result && <div>Result: {JSON.stringify(result)}</div>}

// NEW
{latestResult && (
  <div>
    <h2>{latestResult.content.name}</h2>
    {/* Display result content */}
  </div>
)}
```

## API Integration

### Background Generator Service

The background generator automatically handles:
- Job creation in the global store
- API calls to generation endpoints
- Progress updates
- Image generation (if applicable)
- Error handling and retry logic

### API Endpoints

The system works with existing API endpoints:
- `/api/character-generator`
- `/api/npc-generator`
- `/api/item-generator`
- `/api/quest-generator`
- `/api/encounter-generator`
- `/api/world-lore-builder`
- `/api/campaign-generator`
- `/api/generate-portrait` (new)

## Benefits

### 1. Navigation Resilience
- Generations continue when navigating away
- Results are immediately available when returning
- No lost progress due to navigation

### 2. Real-time Updates
- Progress updates across all components
- Active generations tile shows live status
- Automatic UI synchronization

### 3. Better Error Handling
- Failed jobs can be retried
- Error states persist across navigation
- Clear error messages and recovery options

### 4. Improved User Experience
- No blocking UI during generation
- Background processing
- Persistent state across sessions

## Testing

### Test Page
Visit `/dashboard/test-generation` to test the new system:
- Start multiple generations
- Navigate away and back
- Test error handling and retry functionality
- Monitor global state updates

### Migration Checklist

- [ ] Update component imports
- [ ] Replace state management logic
- [ ] Update generation functions
- [ ] Update UI status displays
- [ ] Test navigation resilience
- [ ] Test error handling
- [ ] Verify ActiveGenerations tile updates
- [ ] Test background generation
- [ ] Verify persistence across sessions

## Troubleshooting

### Common Issues

1. **Jobs not appearing in ActiveGenerations**
   - Check that the job type matches the expected types
   - Verify the store is properly initialized

2. **Progress not updating**
   - Ensure the background generator is updating job progress
   - Check that components are subscribed to store changes

3. **Results not displaying**
   - Verify the `onComplete` callback is properly set
   - Check that the job content is being set correctly

4. **Navigation not preserving state**
   - Ensure Zustand persistence is working
   - Check browser storage permissions

### Debug Tools

- Use the test page to monitor global state
- Check browser console for store updates
- Monitor network requests for API calls
- Use React DevTools to inspect component state

## Future Enhancements

### Planned Features

1. **Web Workers**: Move generation to web workers for true background processing
2. **Queue Management**: Advanced job queuing and prioritization
3. **Batch Operations**: Support for generating multiple items at once
4. **Advanced Retry Logic**: Exponential backoff and smart retry strategies
5. **Job History**: Persistent history of all generations
6. **Export/Import**: Save and restore generation states

### Performance Optimizations

1. **Lazy Loading**: Load job history on demand
2. **Memory Management**: Clean up old completed jobs
3. **Debounced Updates**: Reduce store update frequency
4. **Selective Subscriptions**: Only subscribe to relevant job types

## Conclusion

The new global state management system provides a robust foundation for persistent background generation. It decouples generation from UI components, ensures state survives navigation, and provides real-time updates across all views.

The migration process is straightforward and maintains backward compatibility while providing significant improvements in user experience and system reliability.

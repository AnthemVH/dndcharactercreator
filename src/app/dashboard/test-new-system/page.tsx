'use client'

import { useGenerationStore } from '@/lib/generation-store'
import { backgroundGenerator } from '@/lib/background-generator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TestNewSystem() {
  const { 
    getActiveJobs, 
    getCompletedJobs, 
    isGenerating, 
    removeJob 
  } = useGenerationStore()

  const activeJobs = getActiveJobs()
  const completedJobs = getCompletedJobs()
  const hasActiveJobs = isGenerating()

  const testGeneration = async () => {
    try {
      const jobId = await backgroundGenerator.startGeneration({
        type: 'character',
        prompt: 'Test character generation',
        userId: 'test-user',
        skipImage: true,
      })
      console.log('Test generation started with ID:', jobId)
    } catch (error) {
      console.error('Test generation failed:', error)
    }
  }

  const clearAllJobs = () => {
    activeJobs.forEach(job => removeJob(job.id))
    completedJobs.forEach(job => removeJob(job.id))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Test New Generation System</h1>
        <Badge variant={hasActiveJobs ? "default" : "secondary"}>
          {hasActiveJobs ? 'Active' : 'Idle'}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testGeneration}>
              Start Test Generation
            </Button>
            <Button onClick={clearAllJobs} variant="outline">
              Clear All Jobs
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Jobs ({activeJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activeJobs.length === 0 ? (
            <p className="text-gray-500">No active jobs</p>
          ) : (
            <div className="space-y-2">
              {activeJobs.map(job => (
                <div key={job.id} className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{job.type}</span>
                    <span className="text-sm text-gray-500">{job.status}</span>
                  </div>
                  <p className="text-sm text-gray-600">{job.prompt}</p>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completed Jobs ({completedJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {completedJobs.length === 0 ? (
            <p className="text-gray-500">No completed jobs</p>
          ) : (
            <div className="space-y-2">
              {completedJobs.map(job => (
                <div key={job.id} className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{job.type}</span>
                    <span className="text-sm text-green-500">{job.status}</span>
                  </div>
                  <p className="text-sm text-gray-600">{job.prompt}</p>
                  {job.content && (
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(job.content, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

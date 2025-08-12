'use client'

import { useState } from 'react'
import { useGeneration } from '@/lib/use-generation'
import { useActiveGenerations } from '@/lib/use-generation'
import { GenerationJob } from '@/lib/generation-store'

export default function TestGenerationPage() {
  const [userId] = useState('test-user-123')
  
  // Test character generation
  const characterGen = useGeneration({
    type: 'character',
    userId,
    onComplete: (job) => {
      console.log('Character generation completed:', job)
    },
    onError: (job) => {
      console.error('Character generation failed:', job.error)
    },
  })

  // Test NPC generation
  const npcGen = useGeneration({
    type: 'npc',
    userId,
    onComplete: (job) => {
      console.log('NPC generation completed:', job)
    },
    onError: (job) => {
      console.error('NPC generation failed:', job.error)
    },
  })

  // Get all active generations
  const { activeJobs, completedJobs, hasActiveJobs } = useActiveGenerations()

  const startCharacterGeneration = () => {
    characterGen.startGeneration({
      prompt: 'A wise old wizard who lives in a tower',
      formData: {
        race: 'Human',
        class: 'Wizard',
        background: 'Sage',
        skipPortrait: false,
      },
      skipImage: false,
    })
  }

  const startNPCGeneration = () => {
    npcGen.startGeneration({
      prompt: 'A mysterious merchant in the marketplace',
      formData: {
        name: 'Mysterious Merchant',
        location: 'Market',
        role: 'Merchant',
        mood: 'Suspicious',
        skipPortrait: false,
      },
      skipImage: false,
    })
  }

  const cancelAllJobs = () => {
    activeJobs.forEach(job => {
      characterGen.cancelJob(job.id)
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="fantasy-title text-3xl font-bold mb-8">Global State Management Test</h1>
        
        {/* Controls */}
        <div className="fantasy-card bg-white border border-gray-200 shadow-lg p-6 mb-8">
          <h2 className="fantasy-title text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex space-x-4">
            <button
              onClick={startCharacterGeneration}
              disabled={characterGen.isGenerating}
              className="fantasy-button bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {characterGen.isGenerating ? 'Generating Character...' : 'Start Character Generation'}
            </button>
            
            <button
              onClick={startNPCGeneration}
              disabled={npcGen.isGenerating}
              className="fantasy-button bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            >
              {npcGen.isGenerating ? 'Generating NPC...' : 'Start NPC Generation'}
            </button>
            
            <button
              onClick={cancelAllJobs}
              className="fantasy-button bg-red-600 hover:bg-red-700"
            >
              Cancel All Jobs
            </button>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="fantasy-card bg-white border border-gray-200 shadow-lg p-6 mb-8">
          <h2 className="fantasy-title text-xl font-semibold mb-4">Active Jobs ({activeJobs.length})</h2>
          {activeJobs.length === 0 ? (
            <p className="text-gray-500">No active jobs</p>
          ) : (
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <div key={job.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="fantasy-title font-medium">{job.type} Generation</h3>
                    <span className="text-sm text-gray-500">{job.progress}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{job.prompt}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Status: {job.status} | Started: {new Date(job.startTime).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed Jobs */}
        <div className="fantasy-card bg-white border border-gray-200 shadow-lg p-6 mb-8">
          <h2 className="fantasy-title text-xl font-semibold mb-4">Completed Jobs ({completedJobs.length})</h2>
          {completedJobs.length === 0 ? (
            <p className="text-gray-500">No completed jobs</p>
          ) : (
            <div className="space-y-4">
              {completedJobs.slice(0, 5).map((job) => (
                <div key={job.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="fantasy-title font-medium">{job.type} Generation</h3>
                    <span className={`text-sm ${job.status === 'complete' ? 'text-green-600' : 'text-red-600'}`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{job.prompt}</p>
                  {job.content && (
                    <div className="text-xs text-gray-500">
                      Content: {JSON.stringify(job.content).substring(0, 100)}...
                    </div>
                  )}
                  {job.image && (
                    <div className="mt-2">
                      <img src={job.image} alt="Generated" className="w-16 h-16 object-cover rounded" />
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    Completed: {new Date(job.startTime + job.estimatedTime).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Character Generation Status */}
        <div className="fantasy-card bg-white border border-gray-200 shadow-lg p-6 mb-8">
          <h2 className="fantasy-title text-xl font-semibold mb-4">Character Generation Status</h2>
          <div className="space-y-2">
            <p><strong>Is Generating:</strong> {characterGen.isGenerating ? 'Yes' : 'No'}</p>
            <p><strong>Current Job:</strong> {characterGen.currentJob ? characterGen.currentJob.id : 'None'}</p>
            <p><strong>Latest Result:</strong> {characterGen.latestResult ? 'Available' : 'None'}</p>
            <p><strong>Latest Error:</strong> {characterGen.latestError ? characterGen.latestError.error : 'None'}</p>
          </div>
        </div>

        {/* NPC Generation Status */}
        <div className="fantasy-card bg-white border border-gray-200 shadow-lg p-6 mb-8">
          <h2 className="fantasy-title text-xl font-semibold mb-4">NPC Generation Status</h2>
          <div className="space-y-2">
            <p><strong>Is Generating:</strong> {npcGen.isGenerating ? 'Yes' : 'No'}</p>
            <p><strong>Current Job:</strong> {npcGen.currentJob ? npcGen.currentJob.id : 'None'}</p>
            <p><strong>Latest Result:</strong> {npcGen.latestResult ? 'Available' : 'None'}</p>
            <p><strong>Latest Error:</strong> {npcGen.latestError ? npcGen.latestError.error : 'None'}</p>
          </div>
        </div>

        {/* Global Status */}
        <div className="fantasy-card bg-white border border-gray-200 shadow-lg p-6">
          <h2 className="fantasy-title text-xl font-semibold mb-4">Global Status</h2>
          <div className="space-y-2">
            <p><strong>Has Active Jobs:</strong> {hasActiveJobs ? 'Yes' : 'No'}</p>
            <p><strong>Total Active Jobs:</strong> {activeJobs.length}</p>
            <p><strong>Total Completed Jobs:</strong> {completedJobs.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

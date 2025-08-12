'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useGenerationStore } from '@/lib/generation-store'
import { backgroundGenerator } from '@/lib/background-generator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  User, 
  Sparkles, 
  Image, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  X,
  CheckCircle,
  Play
} from 'lucide-react'

export default function CharacterGeneratorNew() {
  const { data: session } = useSession()
  const [customPrompt, setCustomPrompt] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [formData, setFormData] = useState({
    race: '',
    class: '',
    background: '',
    alignment: '',
    personality: '',
    appearance: '',
  })
  const [skipPortrait, setSkipPortrait] = useState(false)

  const {
    activeJobs,
    completedGenerations,
    createJob,
    updateJob,
    completeJob,
    failJob,
    removeJob,
    getJob,
    getActiveJobs,
    getCompletedJobs,
    getJobsByType,
    isGenerating,
  } = useGenerationStore()

  // Get character-specific jobs
  const characterJobs = getJobsByType('character')
  const isCharacterGenerating = isGenerating('character')

  const handleGenerate = async () => {
    if (!session?.user?.id) {
      alert('Please log in to generate characters')
      return
    }

    if (!customPrompt.trim()) {
      alert('Please enter a custom prompt')
      return
    }

    try {
      const jobId = await backgroundGenerator.startGeneration({
        type: 'character',
        prompt: customPrompt,
        formData: {
          ...formData,
          skipPortrait,
        },
        userId: session.user.id,
        skipImage: skipPortrait,
      })

      console.log('Started generation with job ID:', jobId)
    } catch (error) {
      console.error('Failed to start generation:', error)
      alert('Failed to start generation. Please try again.')
    }
  }

  const handleCancelJob = (jobId: string) => {
    backgroundGenerator.cancelJob(jobId)
  }

  const handleRetryJob = async (jobId: string) => {
    await backgroundGenerator.retryJob(jobId)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'generating':
        return <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'content-complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'image-generating':
        return <Image className="h-4 w-4 text-purple-500 animate-pulse" />
      case 'complete':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending'
      case 'generating':
        return 'Generating Content'
      case 'content-complete':
        return 'Content Complete'
      case 'image-generating':
        return 'Generating Image'
      case 'complete':
        return 'Complete'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Character Generator
        </h1>
        <Badge variant={isCharacterGenerating ? "default" : "secondary"}>
          {isCharacterGenerating ? 'Generating...' : 'Ready'}
        </Badge>
      </div>

      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Generate Character
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label htmlFor="customPrompt">Custom Prompt</Label>
            <Textarea
              id="customPrompt"
              placeholder="Describe the character you want to generate..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Advanced Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="showAdvanced"
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
            <Label htmlFor="showAdvanced">Show Advanced Options</Label>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="space-y-2">
                <Label htmlFor="race">Race</Label>
                <Input
                  id="race"
                  placeholder="e.g., Elf, Human, Dwarf"
                  value={formData.race}
                  onChange={(e) => setFormData(prev => ({ ...prev, race: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Input
                  id="class"
                  placeholder="e.g., Fighter, Wizard, Rogue"
                  value={formData.class}
                  onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="background">Background</Label>
                <Input
                  id="background"
                  placeholder="e.g., Soldier, Sage, Criminal"
                  value={formData.background}
                  onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alignment">Alignment</Label>
                <Input
                  id="alignment"
                  placeholder="e.g., Lawful Good, Chaotic Neutral"
                  value={formData.alignment}
                  onChange={(e) => setFormData(prev => ({ ...prev, alignment: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="personality">Personality Traits</Label>
                <Textarea
                  id="personality"
                  placeholder="Describe the character's personality..."
                  value={formData.personality}
                  onChange={(e) => setFormData(prev => ({ ...prev, personality: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="appearance">Appearance</Label>
                <Textarea
                  id="appearance"
                  placeholder="Describe the character's appearance..."
                  value={formData.appearance}
                  onChange={(e) => setFormData(prev => ({ ...prev, appearance: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Skip Portrait Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="skipPortrait"
              checked={skipPortrait}
              onCheckedChange={setSkipPortrait}
            />
            <Label htmlFor="skipPortrait">Skip Portrait Generation</Label>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isCharacterGenerating || !customPrompt.trim()}
            className="w-full"
          >
            {isCharacterGenerating ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Generate Character
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Active Jobs */}
      {characterJobs.filter(job => job.status !== 'complete' && job.status !== 'error').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Generations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {characterJobs
              .filter(job => job.status !== 'complete' && job.status !== 'error')
              .map((job) => (
                <div key={job.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <span className="font-medium">{getStatusText(job.status)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetryJob(job.id)}
                        disabled={job.status !== 'error'}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelJob(job.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {job.prompt}
                  </div>
                  <Progress value={job.progress} className="w-full" />
                  {job.error && (
                    <div className="text-sm text-red-600 dark:text-red-400">
                      Error: {job.error}
                    </div>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Generations */}
      {characterJobs.filter(job => job.status === 'complete').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Completed Generations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {characterJobs
              .filter(job => job.status === 'complete')
              .map((job) => (
                <div key={job.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <span className="font-medium">Complete</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelJob(job.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {job.prompt}
                  </div>
                  {job.content && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Generated Character:</h4>
                      <pre className="text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-auto">
                        {JSON.stringify(job.content, null, 2)}
                      </pre>
                    </div>
                  )}
                  {job.image && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Generated Portrait:</h4>
                      <img
                        src={job.image}
                        alt="Generated character portrait"
                        className="w-32 h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Error Jobs */}
      {characterJobs.filter(job => job.status === 'error').length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Failed Generations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {characterJobs
              .filter(job => job.status === 'error')
              .map((job) => (
                <div key={job.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <span className="font-medium">Failed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetryJob(job.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelJob(job.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {job.prompt}
                  </div>
                  {job.error && (
                    <div className="text-sm text-red-600 dark:text-red-400">
                      Error: {job.error}
                    </div>
                  )}
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

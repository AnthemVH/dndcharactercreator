'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, Sparkles, User, Shield, Heart, Zap, Target, Brain, Crown, Save, Sword, BookOpen, Map } from 'lucide-react'
import { GenerationStatus, getStatusMessage, getEstimatedTime, getProgressPercentage } from '@/lib/generation-status'
import { clearLocalStorageState, saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils'
import { generatorStateManager } from '@/lib/generator-state'
import FantasyToggle from '@/components/FantasyToggle'
import GenerationStatusPanel from '@/components/GenerationStatusPanel'

interface QuestForm {
  name?: string
  type: string
  difficulty: string
  customPrompt?: string
}

interface GeneratedQuest {
  name: string
  type: string
  difficulty: string
  description: string
  objectives: string[]
  rewards: string[]
  challenges: string[]
  npcs: string[]
  locations: string[]
  timeline: string
  consequences: string[]
  quote: string
  uniqueTrait: string
  portrait?: string
  portraitUrl?: string
}

const questTypes = [
  'Rescue', 'Escort', 'Investigation', 'Combat', 'Exploration', 'Diplomacy', 'Stealth', 'Survival', 'Crafting', 'Trading', 'Racing', 'Puzzle', 'Hunting', 'Gathering', 'Escalation', 'Defense', 'Assassination', 'Theft', 'Sabotage', 'Infiltration'
]

const difficulties = [
  'Easy', 'Medium', 'Hard', 'Deadly', 'Epic', 'Legendary'
]

const GENERATOR_TYPE = 'quest'

export default function QuestGenerator() {
  const [form, setForm] = useState<QuestForm>({
    name: '',
    type: '',
    difficulty: '',
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [quest, setQuest] = useState<GeneratedQuest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [useCustomPrompt, setUseCustomPrompt] = useState(true)
  const [useAdvanced, setUseAdvanced] = useState(false)
  const [queueStatus, setQueueStatus] = useState<string>('')
  const [tokenBalance, setTokenBalance] = useState<number>(0)
  const [queuePosition, setQueuePosition] = useState<number>(0)
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<number>(0)
  const [queueLength, setQueueLength] = useState<number>(0)
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
    status: '',
    estimatedTime: 0,
    progress: 0,
    stage: 'complete'
  })
  const [isUpdatingFromState, setIsUpdatingFromState] = useState(false)
  const [isPortraitLoading, setIsPortraitLoading] = useState(false)

  // Load state from global state manager on component mount
  useEffect(() => {
    const savedState = generatorStateManager.getState(GENERATOR_TYPE)
    if (savedState) {
      setIsUpdatingFromState(true)
      
      const restoreState = () => {
        try {
          // Do not apply form updates from subscription to avoid overwriting live typing
          if (savedState.result) setQuest(savedState.result as GeneratedQuest)
          if (savedState.queueStatus) setQueueStatus(savedState.queueStatus)
          if (savedState.error) setError(savedState.error)
          if (savedState.generationStatus) setGenerationStatus(savedState.generationStatus as GenerationStatus)
          
          if (savedState.result && savedState.isGenerating) {
            setIsGenerating(false)
            setGenerationStatus({
              status: getStatusMessage('complete'),
              estimatedTime: 0,
              progress: 100,
              stage: 'complete'
            })
          } else if (savedState.isGenerating) {
            const now = Date.now()
            const generationStartTime = savedState.timestamp || now
            const timeSinceStart = now - generationStartTime
            
            if (timeSinceStart > 10 * 60 * 1000) {
              setIsGenerating(false)
              setError('Generation timed out. Please try again.')
              setGenerationStatus({
                status: getStatusMessage('error'),
                estimatedTime: 0,
                progress: 0,
                stage: 'error'
              })
            } else {
              setIsGenerating(savedState.isGenerating)
            }
          }
        } catch (error) {
          console.error('Error restoring state:', error)
          clearSavedState()
        }
      }
      
      requestAnimationFrame(() => {
        restoreState()
        setTimeout(() => setIsUpdatingFromState(false), 100)
      })
    }
  }, [])

  // Save state to global state manager whenever it changes
  useEffect(() => {
    if (!isUpdatingFromState) {
      const stateToSave = {
        result: quest,
        isGenerating,
        queueStatus,
        error,
        generationStatus,
      }
      generatorStateManager.updateState(GENERATOR_TYPE, stateToSave)
    }
  }, [quest, isGenerating, queueStatus, error, generationStatus, isUpdatingFromState])

  // Handle form updates separately with debouncing
  useEffect(() => {
    if (!isUpdatingFromState) {
      // Add a small delay to prevent excessive updates during typing
      const timeoutId = setTimeout(() => {
        generatorStateManager.updateFormState(GENERATOR_TYPE, form)
      }, 300) // Increased debounce time for better performance

      return () => clearTimeout(timeoutId)
    }
  }, [form, isUpdatingFromState])

  // Subscribe to state changes from other tabs
  useEffect(() => {
    const unsubscribe = generatorStateManager.subscribe(GENERATOR_TYPE, () => {
      const savedState = generatorStateManager.getState(GENERATOR_TYPE)
      if (savedState && !isUpdatingFromState) {
        setIsUpdatingFromState(true)
        
        const restoreState = () => {
          try {
            // Do not apply form updates from subscription to avoid overwriting live typing
            if (savedState.result) setQuest(savedState.result as GeneratedQuest)
            if (savedState.queueStatus) setQueueStatus(savedState.queueStatus)
            if (savedState.error) setError(savedState.error)
            if (savedState.generationStatus) setGenerationStatus(savedState.generationStatus as GenerationStatus)
            
            if (savedState.result && savedState.isGenerating) {
              setIsGenerating(false)
              setGenerationStatus({
                status: getStatusMessage('complete'),
                estimatedTime: 0,
                progress: 100,
                stage: 'complete'
              })
            } else if (savedState.isGenerating) {
              const now = Date.now()
              const generationStartTime = savedState.timestamp || now
              const timeSinceStart = now - generationStartTime
              
              if (timeSinceStart > 10 * 60 * 1000) {
                setIsGenerating(false)
                setError('Generation timed out. Please try again.')
                setGenerationStatus({
                  status: getStatusMessage('error'),
                  estimatedTime: 0,
                  progress: 0,
                  stage: 'error'
                })
              } else {
                setIsGenerating(savedState.isGenerating)
              }
            }
          } catch (error) {
            console.error('Error restoring state from subscription:', error)
          }
        }
        
        requestAnimationFrame(() => {
          restoreState()
          setTimeout(() => setIsUpdatingFromState(false), 100)
        })
      }
    })

    return unsubscribe
  }, [isUpdatingFromState])

  const handleInputChange = (field: keyof QuestForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const clearSavedState = () => {
    generatorStateManager.clearState(GENERATOR_TYPE)
    setForm({
      name: '',
      type: '',
      difficulty: '',
    })
    setQuest(null)
    setIsGenerating(false)
    setError(null)
    setQueueStatus('')
    setUseCustomPrompt(true)
    setUseAdvanced(false)
    setGenerationStatus({
      status: '',
      estimatedTime: 0,
      progress: 0,
      stage: 'complete'
    })
  }

  // Load token balance on component mount
  useEffect(() => {
    const loadTokenBalance = async () => {
      try {
        const response = await fetch('/api/tokens/balance')
        if (response.ok) {
          const data = await response.json()
          setTokenBalance(data.tokens)
        }
      } catch (error) {
        console.error('Failed to load token balance:', error)
      }
    }

    loadTokenBalance()
  }, [])

  const generateQuest = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      setQuest(null)
      
      setGenerationStatus({
        status: getStatusMessage('queued'),
        estimatedTime: getEstimatedTime('queued'),
        progress: getProgressPercentage('queued'),
        stage: 'queued'
      })
      
      const queueResponse = await fetch('/api/queue-status')
      if (queueResponse.ok) {
        const queueData = await queueResponse.json()
        setQueuePosition(queueData.userPosition || 0)
        setQueueLength(queueData.queueLength || 0)
        
        if (queueData.userPosition > 0) {
          const estimatedTime = getEstimatedTime('queued', queueData.userPosition)
          setGenerationStatus({
            status: getStatusMessage('queued', queueData.userPosition),
            estimatedTime,
            progress: getProgressPercentage('queued'),
            stage: 'queued'
          })
        } else if (queueData.isProcessing) {
          setGenerationStatus({
            status: getStatusMessage('processing'),
            estimatedTime: getEstimatedTime('processing'),
            progress: getProgressPercentage('processing'),
            stage: 'processing'
          })
        }
      }

      setGenerationStatus({
        status: getStatusMessage('generating'),
        estimatedTime: getEstimatedTime('generating'),
        progress: getProgressPercentage('generating'),
        stage: 'generating'
      })

      const response = await fetch('/api/quest-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 429) {
          throw new Error('AI service is busy. Please wait a moment and try again.')
        }
        if (response.status === 408) {
          throw new Error('AI request timed out. Please try again with a simpler prompt.')
        }
        if (response.status === 402) {
          throw new Error('Insufficient tokens. Please purchase more tokens to continue.')
        }
        throw new Error(errorData.error || 'Failed to generate quest')
      }

      const data = await response.json()
      
      setQuest(data.quest)
      
      setGenerationStatus({
        status: getStatusMessage('complete'),
        estimatedTime: 0,
        progress: 100,
        stage: 'complete'
      })
      
      setError(null)
      
      if (data.portraitPending) {
        console.log('Starting portrait generation for quest:', data.quest.name)
        generatePortrait(data.quest)
      } else {
        console.log('Portrait generation skipped:', {
          portraitPending: data.portraitPending
        })
      }
      
    } catch (error) {
      console.error('Quest generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate quest. Please try again.')
      setGenerationStatus({
        status: getStatusMessage('error'),
        estimatedTime: 0,
        progress: 0,
        stage: 'error'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePortrait = async (questData: GeneratedQuest) => {
    console.log('generatePortrait called with quest:', questData.name)
    try {
      setIsPortraitLoading(true)
      setGenerationStatus({
        status: 'Generating portrait...',
        estimatedTime: getEstimatedTime('portrait'),
        progress: getProgressPercentage('portrait'),
        stage: 'portrait'
      })
      
      const response = await fetch('/api/portrait-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterData: questData,
          contentType: 'quest'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Portrait generation failed:', errorData.error)
        return
      }

      const data = await response.json()
      
      console.log('Portrait generation response:', data)
      
      if (data.portrait) {
        const updatedQuest = {
          ...questData,
          portrait: data.portrait,
          portraitUrl: data.portrait
        }
        
        console.log('Updating quest with portrait data:', {
          originalQuest: questData,
          updatedQuest: updatedQuest,
          portrait: data.portrait
        })
        
        setQuest(updatedQuest)
        
        generatorStateManager.updateState(GENERATOR_TYPE, {
          result: updatedQuest,
          isGenerating: false,
          queueStatus: '',
          error: null,
          generationStatus: {
            status: getStatusMessage('complete'),
            estimatedTime: 0,
            progress: 100,
            stage: 'complete'
          }
        })
        
        console.log('Quest updated with portrait:', updatedQuest)
        
        setGenerationStatus(prev => ({ ...prev }))
        
        setTimeout(() => {
          console.log('Quest state after delay:', updatedQuest)
        }, 100)
      } else {
        console.log('No portrait data received from API')
      }
      
      setGenerationStatus({
        status: getStatusMessage('complete'),
        estimatedTime: 0,
        progress: 100,
        stage: 'complete'
      })
      
    } catch (error) {
      console.error('Portrait generation error:', error)
      setGenerationStatus({
        status: getStatusMessage('complete'),
        estimatedTime: 0,
        progress: 100,
        stage: 'complete'
      })
    } finally {
      setIsPortraitLoading(false)
    }
  }

  const downloadPDF = async () => {
    if (!quest) return

    try {
      const response = await fetch('/api/quest-generator/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quest }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${quest.name.replace(/\s+/g, '_')}_Quest_Sheet.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('PDF generation error:', error)
      setError('Failed to generate PDF. Please try again.')
    }
  }

  const saveQuest = async () => {
    if (!quest) {
      setError('No quest to save')
      return
    }

    try {
      const questToSave = {
        ...quest,
        portrait: quest.portrait || quest.portraitUrl,
        portraitUrl: quest.portraitUrl || quest.portrait
      }
      
      console.log('Saving quest with portrait data:', {
        name: questToSave.name,
        hasPortrait: !!questToSave.portrait,
        hasPortraitUrl: !!questToSave.portraitUrl,
        portrait: questToSave.portrait,
        portraitUrl: questToSave.portraitUrl,
        fullQuest: questToSave
      })
      
      console.log('Current quest state:', {
        name: quest?.name,
        hasPortrait: !!quest?.portrait,
        hasPortraitUrl: !!quest?.portraitUrl,
        portrait: quest?.portrait,
        portraitUrl: quest?.portraitUrl
      })
      
      const response = await fetch('/api/quests/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quest: questToSave }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save quest')
      }

      const result = await response.json()
      alert('Quest saved successfully!')
    } catch (error) {
      console.error('Quest saving error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save quest. Please try again.'
      setError(errorMessage)
      alert(`Error saving quest: ${errorMessage}`)
    }
  }

  return (
    <div className="min-h-screen fantasy-main">
      <GenerationStatusPanel />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="fantasy-title text-3xl font-bold mb-2">AI Quest Generator</h1>
              <p className="fantasy-text">Create unique D&D quests with detailed objectives and rewards</p>
            </div>
            <div className="text-right">
              <div className="fantasy-card p-4">
                <div className="fantasy-text text-sm mb-1">Token Balance</div>
                <div className="fantasy-title text-2xl font-bold">{tokenBalance}</div>
                <button
                  onClick={() => window.location.href = '/dashboard/tokens'}
                  className="mt-2 text-xs fantasy-button-secondary px-3 py-1"
                >
                  Buy Tokens
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Parameters Section - Horizontal Layout */}
        <div className="fantasy-card p-6 mb-8">
          <h2 className="fantasy-title text-xl font-semibold mb-6 flex items-center">
            <BookOpen className="h-5 w-5 mr-2 text-yellow-600" />
            Quest Parameters
          </h2>
          
          {/* Custom Prompt - Default View */}
          <div className="mb-6">
            <label className="block fantasy-text text-sm font-medium mb-2">
              Quest Description *
            </label>
            <textarea
              value={form.customPrompt || ''}
              onChange={(e) => handleInputChange('customPrompt', e.target.value)}
              placeholder="Describe the quest you want to generate (e.g., 'A rescue mission to save a kidnapped noble')"
              className="w-full h-32 fantasy-input fantasy-text"
              required
            />
          </div>

          {/* Advanced Options Toggle */}
          <div className="flex items-center justify-between mb-6">
            <FantasyToggle
              checked={useAdvanced}
              onChange={setUseAdvanced}
              label="Advanced Options"
              id="advancedOptions"
            />
          </div>

          {/* Advanced Options Panel */}
          {useAdvanced && (
            <div className="fantasy-card p-4 mb-6 border border-yellow-600 bg-yellow-50/20">
              <h3 className="fantasy-title text-lg font-semibold mb-4 flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-yellow-600" />
                Advanced Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    Quest Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter quest name or leave blank for AI to generate"
                    className="w-full fantasy-input fantasy-text"
                  />
                </div>

                <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    Quest Type (Optional)
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full fantasy-input fantasy-text"
                  >
                    <option value="">Select a quest type (optional)</option>
                    {questTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    Difficulty (Optional)
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={(e) => handleInputChange('difficulty', e.target.value)}
                    className="w-full fantasy-input fantasy-text"
                  >
                    <option value="">Select difficulty (optional)</option>
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>{difficulty}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={generateQuest}
              disabled={isGenerating || !form.customPrompt}
              className="fantasy-button-primary px-8 py-3"
            >
              {isGenerating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {generationStatus.status}
                </div>
              ) : (
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Quest
                </div>
              )}
            </button>
            <button
              onClick={clearSavedState}
              className="fantasy-button-secondary px-6 py-3"
            >
              Clear Form
            </button>
          </div>
        </div>

        {/* Generated Quest Section */}
        {quest && (
          <div id="quest-result" className="fantasy-card">
            {/* Top Row - Buttons in corners */}
            <div className="flex space-x-4">
              <button
                onClick={saveQuest}
                disabled={isGenerating}
                className="flex-1 fantasy-button-accent shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4 mr-2" />
                {isGenerating ? 'Saving...' : 'Save Quest'}
              </button>
              <button
                onClick={downloadPDF}
                className="flex-1 fantasy-button-secondary shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              <button
                onClick={() => quest && generatePortrait(quest)}
                disabled={isPortraitLoading}
                className="flex-1 fantasy-button-secondary shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {isPortraitLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Map className="h-4 w-4 mr-2" />
                )}
                {isPortraitLoading ? 'Generating...' : 'Generate Portrait'}
              </button>
            </div>

            {/* Quest Name - Centered */}
            <div className="text-center mb-6">
              <h3 className="fantasy-title text-3xl font-bold mb-2">{quest.name}</h3>
              <p className="fantasy-text text-lg">
                {quest.type} • {quest.difficulty}
              </p>
            </div>

            {/* Portrait */}
            {isPortraitLoading ? (
              <div className="mb-6">
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center justify-center">
                  <Map className="h-4 w-4 mr-2" />
                  Loading Portrait...
                </h4>
                <div className="flex justify-center">
                  <div className="w-48 h-48 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ) : quest.portrait || quest.portraitUrl ? (
              <div className="mb-6">
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center justify-center">
                  <Map className="h-4 w-4 mr-2" />
                  Quest Portrait
                </h4>
                <div className="flex justify-center">
                  <Image
                    src={quest.portrait || quest.portraitUrl || '/placeholder-portrait.jpg'}
                    alt={`Portrait of ${quest.name}`}
                    width={192}
                    height={192}
                    className="w-48 h-48 object-cover rounded-lg border-4 border-yellow-700 shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      console.error('Portrait image failed to load:', target.src)
                      target.style.display = 'none'
                    }}
                    onLoad={() => {
                      console.log('Portrait image loaded successfully')
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center justify-center">
                  <Map className="h-4 w-4 mr-2" />
                  No Portrait Available
                </h4>
              </div>
            )}

            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center">
                  <Brain className="h-4 w-4 mr-2" />
                  Description
                </h4>
                <div className="fantasy-card p-4">
                  <p className="fantasy-text leading-relaxed text-base">{quest.description}</p>
                </div>
              </div>

              {/* Objectives & Rewards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Objectives</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {quest.objectives.map((objective, index) => (
                      <div key={index} className="fantasy-text text-sm">• {objective}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Rewards</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {quest.rewards.map((reward, index) => (
                      <div key={index} className="fantasy-text text-sm">• {reward}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Challenges & NPCs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Challenges</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {quest.challenges.map((challenge, index) => (
                      <div key={index} className="fantasy-text text-sm">• {challenge}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">NPCs</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {quest.npcs.map((npc, index) => (
                      <div key={index} className="fantasy-text text-sm">• {npc}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Locations & Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Locations</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {quest.locations.map((location, index) => (
                      <div key={index} className="fantasy-text text-sm">• {location}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Timeline</h4>
                  <div className="fantasy-card p-4">
                    <p className="fantasy-text text-sm">{quest.timeline}</p>
                  </div>
                </div>
              </div>

              {/* Consequences */}
              <div>
                <h4 className="fantasy-title text-lg font-semibold mb-3">Consequences</h4>
                <div className="fantasy-card p-4 space-y-1">
                  {quest.consequences.map((consequence, index) => (
                    <div key={index} className="fantasy-text text-sm">• {consequence}</div>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="fantasy-card p-4 border-l-4 border-yellow-500">
                <p className="fantasy-text italic text-base">&quot;{quest.quote}&quot;</p>
                <p className="fantasy-text text-sm text-gray-400 mt-2">— {quest.name}</p>
              </div>

              {/* Unique Trait */}
              <div className="fantasy-card p-4 border-l-4 border-purple-500">
                <h4 className="fantasy-title text-lg font-semibold mb-2 flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-purple-600" />
                  Unique Trait
                </h4>
                <p className="fantasy-text text-base">{quest.uniqueTrait}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
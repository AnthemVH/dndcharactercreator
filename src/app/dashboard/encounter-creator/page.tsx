'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, Sparkles, User, Shield, Heart, Zap, Target, Brain, Crown, Save, Sword, Map } from 'lucide-react'
import { GenerationStatus, getStatusMessage, getEstimatedTime, getProgressPercentage } from '@/lib/generation-status'
import { clearLocalStorageState, saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils'
import { generatorStateManager } from '@/lib/generator-state'
import FantasyToggle from '@/components/FantasyToggle'
import GenerationStatusPanel from '@/components/GenerationStatusPanel'
import { showSuccess, showError } from '@/components/FantasyNotification'

interface EncounterForm {
  name?: string
  type: string
  difficulty: string
  customPrompt?: string
}

interface GeneratedEncounter {
  name: string
  type: string
  difficulty: string
  description: string
  enemies: string[]
  allies: string[]
  environment: string[]
  objectives: string[]
  rewards: string[]
  challenges: string[]
  tactics: string[]
  hazards: string[]
  timeline: string
  consequences: string[]
  quote: string
  uniqueTrait: string
  portrait?: string
  portraitUrl?: string
}

const encounterTypes = [
  'Combat', 'Social', 'Exploration', 'Puzzle', 'Stealth', 'Chase', 'Rescue', 'Escort', 'Infiltration', 'Defense', 'Assassination', 'Negotiation', 'Investigation', 'Survival', 'Ritual', 'Trial', 'Festival', 'Ceremony', 'Tournament', 'Auction'
]

const difficulties = [
  'Easy', 'Medium', 'Hard', 'Deadly', 'Epic', 'Legendary'
]

const GENERATOR_TYPE = 'encounter'

// Helper functions for data normalization
const splitToArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string' && value.includes(',')) return value.split(',').map(s => s.trim()).filter(Boolean);
  return value == null ? [] : [String(value)].filter(Boolean);
};

const ensureString = (value: unknown, fallback: string = ''): string => (value == null ? fallback : String(value));

export default function EncounterCreator() {
  const [form, setForm] = useState<EncounterForm>({
    type: '',
    difficulty: '',
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [encounter, setEncounter] = useState<GeneratedEncounter | null>(null)
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
          if (savedState.result) {
            const savedEncounter = savedState.result as GeneratedEncounter;
            // Normalize the saved encounter data to ensure all fields are in the expected format
            const normalizedSavedEncounter: GeneratedEncounter = {
              ...savedEncounter,
              enemies: splitToArray(savedEncounter.enemies),
              allies: splitToArray(savedEncounter.allies),
              environment: splitToArray(savedEncounter.environment),
              objectives: splitToArray(savedEncounter.objectives),
              rewards: splitToArray(savedEncounter.rewards),
              challenges: splitToArray(savedEncounter.challenges),
              tactics: splitToArray(savedEncounter.tactics),
              hazards: splitToArray(savedEncounter.hazards),
              consequences: splitToArray(savedEncounter.consequences),
              name: ensureString(savedEncounter.name, 'Unnamed Encounter'),
              type: ensureString(savedEncounter.type, 'Combat'),
              difficulty: ensureString(savedEncounter.difficulty, 'Medium'),
              description: ensureString(savedEncounter.description, 'No description provided.'),
              timeline: ensureString(savedEncounter.timeline, 'No timeline provided.'),
              quote: ensureString(savedEncounter.quote, 'No quote.'),
              uniqueTrait: ensureString(savedEncounter.uniqueTrait, 'No unique trait.'),
              portrait: savedEncounter.portrait || savedEncounter.portraitUrl || undefined,
              portraitUrl: savedEncounter.portraitUrl || savedEncounter.portrait || undefined,
            };
            setEncounter(normalizedSavedEncounter);
          }
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
        result: encounter,
        isGenerating,
        queueStatus,
        error,
        generationStatus,
      }
      generatorStateManager.updateState(GENERATOR_TYPE, stateToSave)
    }
  }, [encounter, isGenerating, queueStatus, error, generationStatus, isUpdatingFromState])

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
            if (savedState.result) {
              const savedEncounter = savedState.result as GeneratedEncounter;
              // Normalize the saved encounter data to ensure all fields are in the expected format
              const normalizedSavedEncounter: GeneratedEncounter = {
                ...savedEncounter,
                enemies: splitToArray(savedEncounter.enemies),
                allies: splitToArray(savedEncounter.allies),
                environment: splitToArray(savedEncounter.environment),
                objectives: splitToArray(savedEncounter.objectives),
                rewards: splitToArray(savedEncounter.rewards),
                challenges: splitToArray(savedEncounter.challenges),
                tactics: splitToArray(savedEncounter.tactics),
                hazards: splitToArray(savedEncounter.hazards),
                consequences: splitToArray(savedEncounter.consequences),
                name: ensureString(savedEncounter.name, 'Unnamed Encounter'),
                type: ensureString(savedEncounter.type, 'Combat'),
                difficulty: ensureString(savedEncounter.difficulty, 'Medium'),
                description: ensureString(savedEncounter.description, 'No description provided.'),
                timeline: ensureString(savedEncounter.timeline, 'No timeline provided.'),
                quote: ensureString(savedEncounter.quote, 'No quote.'),
                uniqueTrait: ensureString(savedEncounter.uniqueTrait, 'No unique trait.'),
                portrait: savedEncounter.portrait || savedEncounter.portraitUrl || undefined,
                portraitUrl: savedEncounter.portraitUrl || savedEncounter.portrait || undefined,
              };
              setEncounter(normalizedSavedEncounter);
            }
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

  const handleInputChange = (field: keyof EncounterForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const clearSavedState = () => {
    generatorStateManager.clearState(GENERATOR_TYPE)
    setForm({
      type: '',
      difficulty: '',
    })
    setEncounter(null)
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

  const generateEncounter = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      setEncounter(null)
      // Persist generation start immediately for cross-page stability
      generatorStateManager.updateState(GENERATOR_TYPE, {
        result: null,
        isGenerating: true,
        queueStatus: '',
        error: null,
        generationStatus: {
          status: getStatusMessage('queued'),
          estimatedTime: getEstimatedTime('queued'),
          progress: getProgressPercentage('queued'),
          stage: 'queued'
        },
      })
      
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
          generatorStateManager.updateState(GENERATOR_TYPE, {
            generationStatus: {
              status: getStatusMessage('queued', queueData.userPosition),
              estimatedTime,
              progress: getProgressPercentage('queued'),
              stage: 'queued'
            }
          })
        } else if (queueData.isProcessing) {
          setGenerationStatus({
            status: getStatusMessage('processing'),
            estimatedTime: getEstimatedTime('processing'),
            progress: getProgressPercentage('processing'),
            stage: 'processing'
          })
          generatorStateManager.updateState(GENERATOR_TYPE, {
            generationStatus: {
              status: getStatusMessage('processing'),
              estimatedTime: getEstimatedTime('processing'),
              progress: getProgressPercentage('processing'),
              stage: 'processing'
            }
          })
        }
      }

      setGenerationStatus({
        status: getStatusMessage('generating'),
        estimatedTime: getEstimatedTime('generating'),
        progress: getProgressPercentage('generating'),
        stage: 'generating'
      })
      generatorStateManager.updateState(GENERATOR_TYPE, {
        generationStatus: {
          status: getStatusMessage('generating'),
          estimatedTime: getEstimatedTime('generating'),
          progress: getProgressPercentage('generating'),
          stage: 'generating'
        }
      })

      const response = await fetch('/api/encounter-generator', {
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
        throw new Error(errorData.error || 'Failed to generate encounter')
      }

      const data = await response.json()
      
      // Normalize the encounter data to ensure all fields are in the expected format
      const normalizedEncounter: GeneratedEncounter = {
        ...data.encounter,
        enemies: splitToArray(data.encounter.enemies),
        allies: splitToArray(data.encounter.allies),
        environment: splitToArray(data.encounter.environment),
        objectives: splitToArray(data.encounter.objectives),
        rewards: splitToArray(data.encounter.rewards),
        challenges: splitToArray(data.encounter.challenges),
        tactics: splitToArray(data.encounter.tactics),
        hazards: splitToArray(data.encounter.hazards),
        consequences: splitToArray(data.encounter.consequences),
        name: ensureString(data.encounter.name, 'Unnamed Encounter'),
        type: ensureString(data.encounter.type, 'Combat'),
        difficulty: ensureString(data.encounter.difficulty, 'Medium'),
        description: ensureString(data.encounter.description, 'No description provided.'),
        timeline: ensureString(data.encounter.timeline, 'No timeline provided.'),
        quote: ensureString(data.encounter.quote, 'No quote.'),
        uniqueTrait: ensureString(data.encounter.uniqueTrait, 'No unique trait.'),
        portrait: data.encounter.portrait || data.encounter.portraitUrl || undefined,
        portraitUrl: data.encounter.portraitUrl || data.encounter.portrait || undefined,
      };
      
      setEncounter(normalizedEncounter)
      generatorStateManager.updateState(GENERATOR_TYPE, {
        result: normalizedEncounter,
        isGenerating: false,
        error: null,
        generationStatus: {
          status: getStatusMessage('complete'),
          estimatedTime: 0,
          progress: 100,
          stage: 'complete'
        }
      })
      
      setGenerationStatus({
        status: getStatusMessage('complete'),
        estimatedTime: 0,
        progress: 100,
        stage: 'complete'
      })
      
      setError(null)
      
      if (data.portraitPending) {
        console.log('Starting portrait generation for encounter:', data.encounter.name)
        generatePortrait(data.encounter)
      } else {
        console.log('Portrait generation skipped:', {
          portraitPending: data.portraitPending
        })
      }
      
    } catch (error) {
      console.error('Encounter generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate encounter. Please try again.')
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

  const generatePortrait = async (encounterData: GeneratedEncounter) => {
    console.log('generatePortrait called with encounter:', encounterData.name)
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
          characterData: encounterData,
          contentType: 'encounter'
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
        const updatedEncounter = {
          ...encounterData,
          portrait: data.portrait,
          portraitUrl: data.portrait
        }
        
        console.log('Updating encounter with portrait data:', {
          originalEncounter: encounterData,
          updatedEncounter: updatedEncounter,
          portrait: data.portrait
        })
        
        // Normalize the updated encounter data to ensure all fields are in the expected format
        const normalizedUpdatedEncounter: GeneratedEncounter = {
          ...updatedEncounter,
          enemies: splitToArray(updatedEncounter.enemies),
          allies: splitToArray(updatedEncounter.allies),
          environment: splitToArray(updatedEncounter.environment),
          objectives: splitToArray(updatedEncounter.objectives),
          rewards: splitToArray(updatedEncounter.rewards),
          challenges: splitToArray(updatedEncounter.challenges),
          tactics: splitToArray(updatedEncounter.tactics),
          hazards: splitToArray(updatedEncounter.hazards),
          consequences: splitToArray(updatedEncounter.consequences),
          name: ensureString(updatedEncounter.name, 'Unnamed Encounter'),
          type: ensureString(updatedEncounter.type, 'Combat'),
          difficulty: ensureString(updatedEncounter.difficulty, 'Medium'),
          description: ensureString(updatedEncounter.description, 'No description provided.'),
          timeline: ensureString(updatedEncounter.timeline, 'No timeline provided.'),
          quote: ensureString(updatedEncounter.quote, 'No quote.'),
          uniqueTrait: ensureString(updatedEncounter.uniqueTrait, 'No unique trait.'),
          portrait: updatedEncounter.portrait || updatedEncounter.portraitUrl || undefined,
          portraitUrl: updatedEncounter.portraitUrl || updatedEncounter.portrait || undefined,
        };
        
        setEncounter(normalizedUpdatedEncounter)
        
        generatorStateManager.updateState(GENERATOR_TYPE, {
          result: normalizedUpdatedEncounter,
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
        
        console.log('Encounter updated with portrait:', updatedEncounter)
        
        setGenerationStatus(prev => ({ ...prev }))
        
        setTimeout(() => {
          console.log('Encounter state after delay:', updatedEncounter)
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
    if (!encounter) return

    try {
      const response = await fetch('/api/encounter-generator/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encounter }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${encounter.name.replace(/\s+/g, '_')}_Encounter_Sheet.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('PDF generation error:', error)
      setError('Failed to generate PDF. Please try again.')
    }
  }

  const saveEncounter = async () => {
    if (!encounter) {
      setError('No encounter to save')
      return
    }

    try {
      const encounterToSave = {
        ...encounter,
        portrait: encounter.portrait || encounter.portraitUrl,
        portraitUrl: encounter.portraitUrl || encounter.portrait
      }
      
      console.log('Saving encounter with portrait data:', {
        name: encounterToSave.name,
        hasPortrait: !!encounterToSave.portrait,
        hasPortraitUrl: !!encounterToSave.portraitUrl,
        portrait: encounterToSave.portrait,
        portraitUrl: encounterToSave.portraitUrl,
        fullEncounter: encounterToSave
      })
      
      console.log('Current encounter state:', {
        name: encounter?.name,
        hasPortrait: !!encounter?.portrait,
        hasPortraitUrl: !!encounter?.portraitUrl,
        portrait: encounter?.portrait,
        portraitUrl: encounter?.portraitUrl
      })
      
      const response = await fetch('/api/encounters/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ encounter: encounterToSave }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save encounter')
      }

      const result = await response.json()
      showSuccess('Encounter Saved!', 'Your encounter has been saved successfully.')
    } catch (error) {
      console.error('Encounter saving error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save encounter. Please try again.'
      setError(errorMessage)
      showError('Save Failed', errorMessage)
    }
  }

  return (
    <div className="min-h-screen fantasy-main">
      <GenerationStatusPanel />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="fantasy-title text-3xl font-bold mb-2">AI Encounter Creator</h1>
              <p className="fantasy-text">Create dynamic D&D encounters with detailed challenges and rewards</p>
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
            <Target className="h-5 w-5 mr-2 text-yellow-600" />
            Encounter Parameters
          </h2>
          
          {/* Custom Prompt - Default View */}
          <div className="mb-6">
            <label className="block fantasy-text text-sm font-medium mb-2">
              Encounter Description *
            </label>
            <textarea
              value={form.customPrompt || ''}
              onChange={(e) => handleInputChange('customPrompt', e.target.value)}
              placeholder="Describe the encounter you want to generate (e.g., 'A tense negotiation with a dragon')"
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
                <Target className="h-4 w-4 mr-2 text-yellow-600" />
                Advanced Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    Encounter Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter encounter name or leave blank for AI to generate"
                    className="w-full fantasy-input fantasy-text"
                  />
                </div>

                <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    Type (Optional)
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full fantasy-input fantasy-text"
                  >
                    <option value="">Select an encounter type (optional)</option>
                    {encounterTypes.map(type => (
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
              onClick={generateEncounter}
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
                  Generate Encounter
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

        {/* Generated Encounter Section */}
        {encounter && (
          <div id="encounter-result" className="fantasy-card">
            {/* Top Row - Buttons in corners */}
            <div className="flex space-x-4">
              <button
                onClick={saveEncounter}
                disabled={isGenerating}
                className="flex-1 fantasy-button-accent shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4 mr-2" />
                {isGenerating ? 'Saving...' : 'Save Encounter'}
              </button>
              <button
                onClick={downloadPDF}
                className="flex-1 fantasy-button-secondary shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              <button
                onClick={() => encounter && generatePortrait(encounter)}
                disabled={isPortraitLoading}
                className="flex-1 fantasy-button-secondary shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {isPortraitLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Target className="h-4 w-4 mr-2" />
                )}
                {isPortraitLoading ? 'Generating...' : 'Generate Portrait'}
              </button>
            </div>

            {/* Encounter Name - Centered */}
            <div className="text-center mb-6">
              <h3 className="fantasy-title text-3xl font-bold mb-2">{encounter.name}</h3>
              <p className="fantasy-text text-lg">
                {encounter.type} • {encounter.difficulty}
              </p>
            </div>

            {/* Portrait */}
            {isPortraitLoading ? (
              <div className="mb-6">
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center justify-center">
                  <Target className="h-4 w-4 mr-2" />
                  Loading Portrait...
                </h4>
                <div className="flex justify-center">
                  <div className="w-48 h-48 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ) : encounter.portrait || encounter.portraitUrl ? (
              <div className="mb-6">
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center justify-center">
                  <Target className="h-4 w-4 mr-2" />
                  Encounter Portrait
                </h4>
                <div className="flex justify-center">
                  <Image
                    src={encounter.portrait || encounter.portraitUrl || '/placeholder-portrait.jpg'}
                    alt={`Portrait of ${encounter.name}`}
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
                  <Target className="h-4 w-4 mr-2" />
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
                  <p className="fantasy-text leading-relaxed text-base">{encounter.description}</p>
                </div>
              </div>

              {/* Enemies & Allies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Enemies</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {encounter.enemies.map((enemy, index) => (
                      <div key={index} className="fantasy-text text-sm">• {enemy}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Allies</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {encounter.allies.map((ally, index) => (
                      <div key={index} className="fantasy-text text-sm">• {ally}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Environment & Objectives */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Environment</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {encounter.environment.map((feature, index) => (
                      <div key={index} className="fantasy-text text-sm">• {feature}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Objectives</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {encounter.objectives.map((objective, index) => (
                      <div key={index} className="fantasy-text text-sm">• {objective}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rewards & Challenges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Rewards</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {encounter.rewards.map((reward, index) => (
                      <div key={index} className="fantasy-text text-sm">• {reward}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Challenges</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {encounter.challenges.map((challenge, index) => (
                      <div key={index} className="fantasy-text text-sm">• {challenge}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tactics & Hazards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Tactics</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {encounter.tactics.map((tactic, index) => (
                      <div key={index} className="fantasy-text text-sm">• {tactic}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Hazards</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {encounter.hazards.map((hazard, index) => (
                      <div key={index} className="fantasy-text text-sm">• {hazard}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline & Consequences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Timeline</h4>
                  <div className="fantasy-card p-4">
                    <p className="fantasy-text text-sm">{encounter.timeline}</p>
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Consequences</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {encounter.consequences.map((consequence, index) => (
                      <div key={index} className="fantasy-text text-sm">• {consequence}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="fantasy-card p-4 border-l-4 border-yellow-500">
                <p className="fantasy-text italic text-base">&quot;{encounter.quote}&quot;</p>
                <p className="fantasy-text text-sm text-gray-400 mt-2">— {encounter.name}</p>
              </div>

              {/* Unique Trait */}
              <div className="fantasy-card p-4 border-l-4 border-purple-500">
                <h4 className="fantasy-title text-lg font-semibold mb-2 flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-purple-600" />
                  Unique Trait
                </h4>
                <p className="fantasy-text text-base">{encounter.uniqueTrait}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
'use client'

import { useState, useEffect } from 'react'
import { Download, Sparkles, User, Shield, Heart, Zap, Target, Brain, Crown, Save, Sword, Map, BookOpen, Scroll, Globe } from 'lucide-react'
import { GenerationStatus, getStatusMessage, getEstimatedTime, getProgressPercentage } from '@/lib/generation-status'
import { clearLocalStorageState, saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils'
import { generatorStateManager } from '@/lib/generator-state'
import FantasyToggle from '@/components/FantasyToggle'
import GenerationStatusPanel from '@/components/GenerationStatusPanel'

interface WorldLoreForm {
  name?: string
  type: string
  theme: string
  customPrompt?: string
}

interface GeneratedWorldLore {
  name: string
  type: string
  theme: string
  description: string
  history: string
  culture: string[]
  geography: string[]
  politics: string[]
  religion: string[]
  magic: string[]
  economy: string[]
  conflicts: string[]
  legends: string[]
  quote: string
  uniqueTrait: string
}

const loreTypes = [
  'Kingdom', 'Empire', 'City-State', 'Tribe', 'Guild', 'Religion', 'Academy', 'Mystical Site', 'Ancient Ruins', 'Natural Wonder', 'Underworld', 'Floating Island', 'Underground City', 'Astral Realm', 'Elemental Plane', 'Fey Realm', 'Shadow Realm', 'Dragon Territory', 'Giant Kingdom', 'Underdark'
]

const themes = [
  'Ancient', 'Mystical', 'Warrior', 'Scholarly', 'Merchant', 'Religious', 'Magical', 'Political', 'Isolated', 'Expansionist', 'Decadent', 'Ascetic', 'Militaristic', 'Diplomatic', 'Secretive', 'Open', 'Hierarchical', 'Egalitarian', 'Traditional', 'Progressive'
]

const GENERATOR_TYPE = 'world'

export default function WorldLoreBuilder() {
  const [form, setForm] = useState<WorldLoreForm>({
    type: '',
    theme: '',
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [worldLore, setWorldLore] = useState<GeneratedWorldLore | null>(null)
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

  // Load state from global state manager on component mount
  useEffect(() => {
    const savedState = generatorStateManager.getState(GENERATOR_TYPE)
    if (savedState) {
      setIsUpdatingFromState(true)
      
      const restoreState = () => {
        try {
          // Do not apply form updates from subscription to avoid overwriting live typing
          if (savedState.result) setWorldLore(savedState.result as GeneratedWorldLore)
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
        result: worldLore,
        isGenerating,
        queueStatus,
        error,
        generationStatus,
      }
      generatorStateManager.updateState(GENERATOR_TYPE, stateToSave)
    }
  }, [worldLore, isGenerating, queueStatus, error, generationStatus, isUpdatingFromState])

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
            if (savedState.result) setWorldLore(savedState.result as GeneratedWorldLore)
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

  const handleInputChange = (field: keyof WorldLoreForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const clearSavedState = () => {
    generatorStateManager.clearState(GENERATOR_TYPE)
    setForm({
      type: '',
      theme: '',
    })
    setWorldLore(null)
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

  const generateWorldLore = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      setWorldLore(null)
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

      const response = await fetch('/api/world-lore-builder', {
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
        throw new Error(errorData.error || 'Failed to generate world lore')
      }

      const data = await response.json()

      // Normalize API response to match GeneratedWorldLore expectations
      const world = data.world
      const ensureArray = (value: unknown): string[] => Array.isArray(value) ? value : (value ? [String(value)] : [])

      const normalizedWorld: GeneratedWorldLore = {
        name: world?.name || 'Unknown World',
        type: world?.type || form.type || '',
        theme: world?.theme || form.theme || 'Fantasy',
        description: world?.description || '',
        history: world?.history || '',
        culture: ensureArray(world?.culture),
        geography: ensureArray(world?.geography),
        politics: ensureArray(world?.politics),
        religion: ensureArray(world?.religion),
        magic: ensureArray(world?.magic),
        economy: ensureArray(world?.economy),
        conflicts: ensureArray(world?.conflicts),
        legends: ensureArray(world?.legends),
        quote: world?.quote || '',
        uniqueTrait: world?.uniqueTrait || world?.uniqueFeature || '',
      }

      setWorldLore(normalizedWorld)
      generatorStateManager.updateState(GENERATOR_TYPE, {
        result: normalizedWorld,
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
      
    } catch (error) {
      console.error('World lore generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate world lore. Please try again.')
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



  const downloadPDF = async () => {
    if (!worldLore) return

    try {
      const response = await fetch('/api/world-lore-builder/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ worldLore }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${worldLore.name.replace(/\s+/g, '_')}_World_Lore_Sheet.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('PDF generation error:', error)
      setError('Failed to generate PDF. Please try again.')
    }
  }

  const saveWorldLore = async () => {
    if (!worldLore) {
      setError('No world lore to save')
      return
    }

    try {
      const worldLoreToSave = {
        ...worldLore
      }
      
      console.log('Saving world lore:', {
        name: worldLoreToSave.name,
        fullWorldLore: worldLoreToSave
      })
      
      console.log('Current world lore state:', {
        name: worldLore?.name
      })
      
      const response = await fetch('/api/worlds/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ worldLore: worldLoreToSave }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save world lore')
      }

      const result = await response.json()
      alert('World lore saved successfully!')
    } catch (error) {
      console.error('World lore saving error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save world lore. Please try again.'
      setError(errorMessage)
      alert(`Error saving world lore: ${errorMessage}`)
    }
  }

  return (
    <div className="min-h-screen fantasy-main">
      <GenerationStatusPanel />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="fantasy-title text-3xl font-bold mb-2">AI World Lore Builder</h1>
              <p className="fantasy-text">Create rich D&D worlds with detailed lore and history</p>
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
            <Globe className="h-5 w-5 mr-2 text-yellow-600" />
            World Lore Parameters
          </h2>
          
          {/* Custom Prompt - Default View */}
          <div className="mb-6">
            <label className="block fantasy-text text-sm font-medium mb-2">
              World Description *
            </label>
            <textarea
              value={form.customPrompt || ''}
              onChange={(e) => handleInputChange('customPrompt', e.target.value)}
              placeholder="Describe the world you want to generate (e.g., 'A mystical kingdom ruled by ancient dragons')"
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
                <Globe className="h-4 w-4 mr-2 text-yellow-600" />
                Advanced Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    World Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter world name or leave blank for AI to generate"
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
                    <option value="">Select a type (optional)</option>
                    {loreTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    Theme (Optional)
                  </label>
                  <select
                    value={form.theme}
                    onChange={(e) => handleInputChange('theme', e.target.value)}
                    className="w-full fantasy-input fantasy-text"
                  >
                    <option value="">Select a theme (optional)</option>
                    {themes.map(theme => (
                      <option key={theme} value={theme}>{theme}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={generateWorldLore}
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
                  Generate World Lore
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

        {/* Generated World Lore Section */}
        {worldLore && (
          <div id="world-lore-result" className="fantasy-card">
            {/* Top Row - Buttons in corners */}
            <div className="flex space-x-4">
              <button
                onClick={saveWorldLore}
                disabled={isGenerating}
                className="flex-1 fantasy-button-accent shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4 mr-2" />
                {isGenerating ? 'Saving...' : 'Save World Lore'}
              </button>
              <button
                onClick={downloadPDF}
                className="flex-1 fantasy-button-secondary shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>

            </div>

            {/* World Lore Name - Centered */}
            <div className="text-center mb-6">
              <h3 className="fantasy-title text-3xl font-bold mb-2">{worldLore.name}</h3>
              <p className="fantasy-text text-lg">
                {worldLore.type} • {worldLore.theme}
              </p>
            </div>



            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center">
                  <Brain className="h-4 w-4 mr-2" />
                  Description
                </h4>
                <div className="fantasy-card p-4">
                  <p className="fantasy-text leading-relaxed text-base">{worldLore.description}</p>
                </div>
              </div>

              {/* History */}
              <div>
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center">
                  <Scroll className="h-4 w-4 mr-2" />
                  History
                </h4>
                <div className="fantasy-card p-4">
                  <p className="fantasy-text leading-relaxed text-base">{worldLore.history}</p>
                </div>
              </div>

              {/* Culture & Geography */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Culture</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {worldLore.culture.map((aspect, index) => (
                      <div key={index} className="fantasy-text text-sm">• {aspect}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Geography</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {worldLore.geography.map((feature, index) => (
                      <div key={index} className="fantasy-text text-sm">• {feature}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Politics & Religion */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Politics</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {worldLore.politics.map((aspect, index) => (
                      <div key={index} className="fantasy-text text-sm">• {aspect}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Religion</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {worldLore.religion.map((belief, index) => (
                      <div key={index} className="fantasy-text text-sm">• {belief}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Magic & Economy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Magic</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {worldLore.magic.map((aspect, index) => (
                      <div key={index} className="fantasy-text text-sm">• {aspect}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Economy</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {worldLore.economy.map((aspect, index) => (
                      <div key={index} className="fantasy-text text-sm">• {aspect}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conflicts & Legends */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Conflicts</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {worldLore.conflicts.map((conflict, index) => (
                      <div key={index} className="fantasy-text text-sm">• {conflict}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Legends</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {worldLore.legends.map((legend, index) => (
                      <div key={index} className="fantasy-text text-sm">• {legend}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="fantasy-card p-4 border-l-4 border-yellow-500">
                <p className="fantasy-text italic text-base">&quot;{worldLore.quote}&quot;</p>
                <p className="fantasy-text text-sm text-gray-400 mt-2">— {worldLore.name}</p>
              </div>

              {/* Unique Trait */}
              <div className="fantasy-card p-4 border-l-4 border-purple-500">
                <h4 className="fantasy-title text-lg font-semibold mb-2 flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-purple-600" />
                  Unique Trait
                </h4>
                <p className="fantasy-text text-base">{worldLore.uniqueTrait}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
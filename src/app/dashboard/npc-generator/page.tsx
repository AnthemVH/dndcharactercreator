'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, Sparkles, User, Shield, Heart, Zap, Target, Brain, Crown, Save, Sword, Users, Scroll } from 'lucide-react'
import { GenerationStatus, getStatusMessage, getEstimatedTime, getProgressPercentage } from '@/lib/generation-status'
import { clearLocalStorageState, saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils'
import { generatorStateManager } from '@/lib/generator-state'
import FantasyToggle from '@/components/FantasyToggle'
import GenerationStatusPanel from '@/components/GenerationStatusPanel'
import { showSuccess, showError } from '@/components/FantasyNotification'
import { useUnitSystem } from '@/components/UnitToggle'

interface NpcForm {
  name?: string
  race: string
  class: string
  role: string
  customPrompt?: string
  skipPortrait?: boolean
}

interface GeneratedNpc {
  name: string
  race: string
  class: string
  role: string
  description: string
  personality: string[]
  appearance: string[]
  background: string
  motivations: string[]
  relationships: string[]
  abilities: string[]
  equipment: string[]
  secrets: string[]
  goals: string[]
  fears: string[]
  quote: string
  uniqueTrait: string
  portrait?: string
  portraitUrl?: string
}

const races = [
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling', 'Dragonborn', 'Aarakocra', 'Genasi', 'Goliath', 'Aasimar', 'Firbolg', 'Kenku', 'Lizardfolk', 'Tabaxi', 'Triton', 'Bugbear', 'Goblin', 'Hobgoblin', 'Kobold', 'Orc', 'Yuan-ti'
]

const classes = [
  'Fighter', 'Wizard', 'Cleric', 'Rogue', 'Ranger', 'Paladin', 'Barbarian', 'Bard', 'Druid', 'Monk', 'Sorcerer', 'Warlock', 'Artificer', 'Blood Hunter'
]

const roles = [
  'Villain', 'Ally', 'Mentor', 'Quest Giver', 'Merchant', 'Innkeeper', 'Guard', 'Noble', 'Scholar', 'Criminal', 'Religious Leader', 'Military Officer', 'Artisan', 'Farmer', 'Entertainer', 'Healer', 'Guide', 'Spy', 'Assassin', 'Diplomat'
]

const GENERATOR_TYPE = 'npc'

export default function NpcGenerator() {
  const toArray = (value: unknown): string[] => Array.isArray(value) ? value : (value == null ? [] : [String(value)])
  const unitSystem = useUnitSystem()
  const [form, setForm] = useState<NpcForm>({
    race: '',
    class: '',
    role: '',
    skipPortrait: false,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [npc, setNpc] = useState<GeneratedNpc | null>(null)
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
          // Do not apply form updates from subscription to avoid typing lag
          if (savedState.result) setNpc(savedState.result as GeneratedNpc)
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
        result: npc,
    isGenerating,
        queueStatus,
        error,
        generationStatus,
      }
      generatorStateManager.updateState(GENERATOR_TYPE, stateToSave)
    }
  }, [npc, isGenerating, queueStatus, error, generationStatus, isUpdatingFromState])

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
            // Do not apply form updates from subscription to avoid typing lag
            if (savedState.result) setNpc(savedState.result as GeneratedNpc)
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

  const handleInputChange = (field: keyof NpcForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const clearSavedState = () => {
    generatorStateManager.clearState(GENERATOR_TYPE)
    setForm({
      race: '',
      class: '',
      role: '',
      skipPortrait: false,
    })
    setNpc(null)
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

  const generateNpc = async () => {
    try {
      setIsGenerating(true)
          setError(null)
      setNpc(null)
      
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

      const response = await fetch('/api/npc-generator', {
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
        throw new Error(errorData.error || 'Failed to generate NPC')
      }

      const data = await response.json()

      // Normalize NPC shape so text renders immediately
      const splitToArray = (val: unknown): string[] => {
        if (Array.isArray(val)) return val.map(v => String(v))
        if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean)
        if (val == null) return []
        return [String(val)]
      }
      const ensureArray = (value: unknown): string[] => Array.isArray(value) ? value : (value == null ? [] : [String(value)])
      const ensureString = (value: unknown, fallback = ''): string => (value == null ? fallback : String(value))

      const normalizedNpc: GeneratedNpc = {
        name: ensureString(data.npc?.name),
        race: ensureString(data.npc?.race),
        class: ensureString(data.npc?.class),
        role: ensureString(data.npc?.role),
        // Many models return backstory instead of description
        description: ensureString(data.npc?.description ?? data.npc?.backstory ?? data.npc?.background),
        // Fall back to personalityTraits when personality isn't provided
        personality: splitToArray(data.npc?.personality ?? (data.npc as Record<string, unknown>)?.personalityTraits),
        appearance: splitToArray(data.npc?.appearance),
        background: ensureString(data.npc?.background ?? data.npc?.backstory),
        motivations: splitToArray(data.npc?.motivations),
        relationships: splitToArray(data.npc?.relationships),
        // Abilities often map to skills in NPC payloads
        abilities: splitToArray((data.npc as Record<string, unknown>)?.abilities ?? data.npc?.skills),
        equipment: splitToArray(data.npc?.equipment),
        secrets: splitToArray(data.npc?.secrets),
        goals: splitToArray(data.npc?.goals),
        fears: splitToArray((data.npc as Record<string, unknown>)?.fears),
        quote: ensureString(data.npc?.quote),
        uniqueTrait: ensureString(data.npc?.uniqueTrait),
        portrait: data.npc?.portrait,
        portraitUrl: data.npc?.portraitUrl,
      }

      setNpc(normalizedNpc)
      
      setGenerationStatus({
        status: getStatusMessage('complete'),
        estimatedTime: 0,
        progress: 100,
        stage: 'complete'
      })
      
      setError(null)
      
      if (data.portraitPending && !form.skipPortrait) {
        console.log('Starting portrait generation for NPC:', normalizedNpc.name)
        generatePortrait(normalizedNpc)
      } else {
        console.log('Portrait generation skipped:', {
          portraitPending: data.portraitPending,
          skipPortrait: form.skipPortrait
        })
      }
      
    } catch (error) {
      console.error('NPC generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate NPC. Please try again.')
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

  const generatePortrait = async (npcData: GeneratedNpc) => {
    console.log('generatePortrait called with NPC:', npcData.name)
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
          characterData: npcData,
          contentType: 'npc'
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
        const portraitUrl = typeof window !== 'undefined' && typeof data.portrait === 'string'
          ? (data.portrait.startsWith('http') ? data.portrait : `${window.location.origin}${data.portrait}`)
          : data.portrait
        const updatedNpc = {
          ...npcData,
          portrait: portraitUrl,
          portraitUrl: portraitUrl
        }
        
        console.log('Updating NPC with portrait data:', {
          originalNpc: npcData,
          updatedNpc: updatedNpc,
          portrait: data.portrait
        })
        
        setNpc(updatedNpc)
        
        generatorStateManager.updateState(GENERATOR_TYPE, {
          result: updatedNpc,
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
        
        console.log('NPC updated with portrait:', updatedNpc)
        
        setGenerationStatus(prev => ({ ...prev }))
        
        setTimeout(() => {
          console.log('NPC state after delay:', updatedNpc)
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
    if (!npc) return

    try {
      const response = await fetch('/api/npc-generator/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ npc }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
      a.download = `${npc.name.replace(/\s+/g, '_')}_NPC_Sheet.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    } catch (error) {
      console.error('PDF generation error:', error)
      setError('Failed to generate PDF. Please try again.')
    }
  }

  const saveNpc = async () => {
    if (!npc) {
      setError('No NPC to save')
      return
    }

    try {
      const npcToSave = {
        ...npc,
        portrait: npc.portrait || npc.portraitUrl,
        portraitUrl: npc.portraitUrl || npc.portrait
      }
      
      console.log('Saving NPC with portrait data:', {
        name: npcToSave.name,
        hasPortrait: !!npcToSave.portrait,
        hasPortraitUrl: !!npcToSave.portraitUrl,
        portrait: npcToSave.portrait,
        portraitUrl: npcToSave.portraitUrl,
        fullNpc: npcToSave
      })
      
      console.log('Current NPC state:', {
        name: npc?.name,
        hasPortrait: !!npc?.portrait,
        hasPortraitUrl: !!npc?.portraitUrl,
        portrait: npc?.portrait,
        portraitUrl: npc?.portraitUrl
      })
      
      const response = await fetch('/api/npcs/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ npc: npcToSave }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save NPC')
      }

      const result = await response.json()
      showSuccess('NPC Saved!', 'Your NPC has been saved successfully.')
    } catch (error) {
      console.error('NPC saving error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save NPC. Please try again.'
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
              <h1 className="fantasy-title text-3xl font-bold mb-2">AI NPC Generator</h1>
              <p className="fantasy-text">Create unique D&D NPCs with detailed personalities and backstories</p>
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
            <Users className="h-5 w-5 mr-2 text-yellow-600" />
            NPC Parameters
          </h2>
          
          {/* Custom Prompt - Default View */}
          <div className="mb-6">
            <label className="block fantasy-text text-sm font-medium mb-2">
              NPC Description *
            </label>
                <textarea
              value={form.customPrompt || ''}
              onChange={(e) => handleInputChange('customPrompt', e.target.value)}
              placeholder="Describe the NPC you want to generate (e.g., 'A wise old dwarf cleric who has seen too many wars')"
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
            <FantasyToggle
              checked={form.skipPortrait || false}
              onChange={(checked) => handleInputChange('skipPortrait', checked)}
              label="Skip portrait generation"
              id="skipPortrait"
            />
              </div>

          {/* Advanced Options Panel */}
              {useAdvanced && (
            <div className="fantasy-card p-4 mb-6 border border-yellow-600 bg-yellow-50/20">
              <h3 className="fantasy-title text-lg font-semibold mb-4 flex items-center">
                <Users className="h-4 w-4 mr-2 text-yellow-600" />
                Advanced Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    NPC Name (Optional)
                  </label>
                    <input
                      type="text"
                      value={form.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter NPC name or leave blank for AI to generate"
                    className="w-full fantasy-input fantasy-text"
                    />
                  </div>

                  <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    Race (Optional)
                  </label>
                    <select
                      value={form.race}
                      onChange={(e) => handleInputChange('race', e.target.value)}
                    className="w-full fantasy-input fantasy-text"
                    >
                    <option value="">Select a race (optional)</option>
                    {races.map(race => (
                        <option key={race} value={race}>{race}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    Class (Optional)
                  </label>
                    <select
                      value={form.class}
                      onChange={(e) => handleInputChange('class', e.target.value)}
                    className="w-full fantasy-input fantasy-text"
                  >
                    <option value="">Select a class (optional)</option>
                    {classes.map(className => (
                      <option key={className} value={className}>{className}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    Role (Optional)
                  </label>
                    <select
                      value={form.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full fantasy-input fantasy-text"
                    >
                    <option value="">Select a role (optional)</option>
                    {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>

                
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={generateNpc}
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
                  Generate NPC
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

        {/* Generated NPC Section */}
        {npc && (
          <div id="npc-result" className="fantasy-card">
            {/* Top Row - Buttons in corners */}
            <div className="flex space-x-4">
              <button
                onClick={saveNpc}
                disabled={isGenerating}
                className="flex-1 fantasy-button-accent shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4 mr-2" />
                {isGenerating ? 'Saving...' : 'Save NPC'}
              </button>
              <button
                onClick={downloadPDF}
                className="flex-1 fantasy-button-secondary shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              <button
                onClick={() => npc && generatePortrait(npc)}
                disabled={isPortraitLoading}
                className="flex-1 fantasy-button-secondary shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {isPortraitLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <User className="h-4 w-4 mr-2" />
                )}
                {isPortraitLoading ? 'Generating...' : 'Generate Portrait'}
              </button>
            </div>

            {/* NPC Name - Centered */}
            <div className="text-center mb-6">
              <h3 className="fantasy-title text-3xl font-bold mb-2">{npc.name}</h3>
              <p className="fantasy-text text-lg">
                {npc.race} {npc.class} • {npc.role}
              </p>
            </div>

            {/* Portrait */}
            {isPortraitLoading ? (
              <div className="mb-6">
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center justify-center">
                  <User className="h-4 w-4 mr-2" />
                  Loading Portrait...
                </h4>
                <div className="flex justify-center">
                  <div className="w-48 h-48 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ) : npc.portrait || npc.portraitUrl ? (
              <div className="mb-6">
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center justify-center">
                  <User className="h-4 w-4 mr-2" />
                  NPC Portrait
                </h4>
                <div className="flex justify-center">
                  <Image
                    src={npc.portrait || npc.portraitUrl || '/placeholder-portrait.jpg'}
                    alt={`Portrait of ${npc.name}`}
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
                  <User className="h-4 w-4 mr-2" />
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
                  <p className="fantasy-text leading-relaxed text-base">{npc.description}</p>
                </div>
              </div>

              {/* Personality & Appearance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Personality</h4>
                  <div className="flex flex-wrap gap-2">
                    {toArray(npc.personality).map((trait, index) => (
                      <span
                        key={index}
                        className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium fantasy-text"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                    </div>
                    <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Appearance</h4>
                  <div className="flex flex-wrap gap-2">
                    {toArray(npc.appearance).map((trait, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium fantasy-text"
                      >
                        {trait}
                      </span>
                        ))}
                      </div>
                    </div>
                  </div>

              {/* Background */}
              <div>
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center">
                  <Scroll className="h-4 w-4 mr-2" />
                  Background
                </h4>
                <div className="fantasy-card p-4">
                  <p className="fantasy-text leading-relaxed text-base">{npc.background}</p>
                    </div>
                  </div>

              {/* Motivations & Goals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Motivations</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {toArray(npc.motivations).map((motivation, index) => (
                      <div key={index} className="fantasy-text text-sm">• {motivation}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Goals</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {toArray(npc.goals).map((goal, index) => (
                      <div key={index} className="fantasy-text text-sm">• {goal}</div>
                    ))}
                  </div>
                    </div>
                  </div>

              {/* Relationships & Fears */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Relationships</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {toArray(npc.relationships).map((relationship, index) => (
                        <div key={index} className="fantasy-text text-sm">• {relationship}</div>
                      ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Fears</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {toArray(npc.fears).map((fear, index) => (
                      <div key={index} className="fantasy-text text-sm">• {fear}</div>
                    ))}
                  </div>
                    </div>
                  </div>

              {/* Abilities & Equipment */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Abilities</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {toArray(npc.abilities).map((ability, index) => (
                        <div key={index} className="fantasy-text text-sm">• {ability}</div>
                      ))}
                    </div>
                  </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Equipment</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {toArray(npc.equipment).map((item, index) => (
                        <div key={index} className="fantasy-text text-sm">• {item}</div>
                      ))}
                  </div>
                    </div>
                  </div>

              {/* Secrets */}
              <div>
                <h4 className="fantasy-title text-lg font-semibold mb-3">Secrets</h4>
                <div className="fantasy-card p-4 space-y-1">
                  {toArray(npc.secrets).map((secret, index) => (
                        <div key={index} className="fantasy-text text-sm">• {secret}</div>
                      ))}
                    </div>
                  </div>

              {/* Quote */}
              <div className="fantasy-card p-4 border-l-4 border-yellow-500">
                <p className="fantasy-text italic text-base">&quot;{npc.quote}&quot;</p>
                <p className="fantasy-text text-sm text-gray-400 mt-2">— {npc.name}</p>
                  </div>

              {/* Unique Trait */}
              <div className="fantasy-card p-4 border-l-4 border-purple-500">
                <h4 className="fantasy-title text-lg font-semibold mb-2 flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-purple-600" />
                  Unique Trait
                </h4>
                <p className="fantasy-text text-base">{npc.uniqueTrait}</p>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
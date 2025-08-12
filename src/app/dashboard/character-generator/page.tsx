'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, Sparkles, User, Shield, Heart, Zap, Target, Brain, Crown, Save, Sword } from 'lucide-react'
import { GenerationStatus, getStatusMessage, getEstimatedTime, getProgressPercentage } from '@/lib/generation-status'
import { getModifier, getStatColor } from '@/lib/utils'
import { generatorStateManager } from '@/lib/generator-state'
import { useUnitSystem, convertDistance } from '@/components/UnitToggle'
import FantasyToggle from '@/components/FantasyToggle'
import GenerationStatusPanel from '@/components/GenerationStatusPanel'
import { showSuccess, showError } from '@/components/FantasyNotification'

interface CharacterForm {
  name?: string
  race: string
  class: string
  background: string
  personalityType?: string
  customPrompt?: string
  skipPortrait?: boolean
}

interface GeneratedCharacter {
  name: string
  race: string
  class: string
  background: string
  backstory: string
  personalityTraits: string[]
  stats: {
    STR: number
    DEX: number
    CON: number
    INT: number
    WIS: number
    CHA: number
  }
  quote: string
  uniqueTrait: string
  level: number
  hitPoints: number
  armorClass: number
  initiative: number
  speed: number
  proficiencies: string[]
  features: string[]
  portrait?: string
  portraitUrl?: string
}

const races = [
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Tiefling', 'Half-Elf', 'Half-Orc', 'Gnome', 'Aarakocra', 'Genasi', 'Goliath', 'Triton', 'Yuan-Ti Pureblood'
]

const classes = [
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard', 'Artificer', 'Blood Hunter'
]

const backgrounds = [
  'Acolyte', 'Criminal', 'Folk Hero', 'Noble', 'Sage', 'Soldier', 'Urchin', 'Entertainer', 'Guild Artisan', 'Hermit', 'Outlander', 'Charlatan', 'City Watch', 'Clan Crafter', 'Cloistered Scholar', 'Courtier', 'Faction Agent', 'Far Traveler', 'Inheritor', 'Knight of the Order', 'Mercenary Veteran', 'Urban Bounty Hunter', 'Uthgardt Tribe Member', 'Waterdhavian Noble'
]

const personalityTypes = [
  'Adventurous', 'Cautious', 'Charismatic', 'Intellectual', 'Mysterious', 'Honorable', 'Chaotic', 'Loyal', 'Ambitious', 'Compassionate', 'Sarcastic', 'Wise', 'Fierce', 'Gentle', 'Calculating', 'Impulsive'
]

const GENERATOR_TYPE = 'character'

export default function CharacterGenerator() {
  const unitSystem = useUnitSystem()
  const [form, setForm] = useState<CharacterForm>({
    race: '',
    class: '',
    background: '',
    skipPortrait: false,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [character, setCharacter] = useState<GeneratedCharacter | null>(null)
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
      
      // Use a more robust state restoration approach
      const restoreState = () => {
        try {
          if (savedState.form) setForm(savedState.form as CharacterForm)
          if (savedState.result) setCharacter(savedState.result as GeneratedCharacter)
          if (savedState.queueStatus) setQueueStatus(savedState.queueStatus)
          if (savedState.error) setError(savedState.error)
          if (savedState.generationStatus) setGenerationStatus(savedState.generationStatus as GenerationStatus)
          
          // If we have a result but isGenerating is true, the generation has completed
          if (savedState.result && savedState.isGenerating) {
            setIsGenerating(false)
            setGenerationStatus({
              status: getStatusMessage('complete'),
              estimatedTime: 0,
              progress: 100,
              stage: 'complete'
            })
          } else if (savedState.isGenerating) {
            // Check if the generation is actually still running by checking the timestamp
            const now = Date.now()
            const generationStartTime = savedState.timestamp || now
            const timeSinceStart = now - generationStartTime
            
            // If the generation has been running for more than 10 minutes, mark it as failed
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
          // If state restoration fails, clear the state
          clearSavedState()
        }
      }
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        restoreState()
        // Reset the flag after a longer delay to ensure all state updates are complete
        setTimeout(() => setIsUpdatingFromState(false), 100)
      })
    }
  }, [])

  // Save state to global state manager whenever it changes (with debouncing for form updates)
  useEffect(() => {
    if (!isUpdatingFromState) {
      const stateToSave = {
        result: character,
        isGenerating,
        queueStatus,
        error,
        generationStatus,
      }
      generatorStateManager.updateState(GENERATOR_TYPE, stateToSave)
    }
  }, [character, isGenerating, queueStatus, error, generationStatus, isUpdatingFromState])

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

  // Monitor character state changes
  useEffect(() => {
    console.log('Character state changed:', {
      hasCharacter: !!character,
      hasPortrait: !!character?.portrait,
      hasPortraitUrl: !!character?.portraitUrl,
      portrait: character?.portrait,
      portraitUrl: character?.portraitUrl
    })
  }, [character])

  // Subscribe to state changes from other tabs
  useEffect(() => {
    const unsubscribe = generatorStateManager.subscribe(GENERATOR_TYPE, () => {
      const savedState = generatorStateManager.getState(GENERATOR_TYPE)
      if (savedState && !isUpdatingFromState) {
        setIsUpdatingFromState(true)
        
        // Use a more robust state restoration approach
        const restoreState = () => {
          try {
            // Do not apply form updates from subscription to avoid typing lag
            if (savedState.result) setCharacter(savedState.result as GeneratedCharacter)
            if (savedState.queueStatus) setQueueStatus(savedState.queueStatus)
            if (savedState.error) setError(savedState.error)
            if (savedState.generationStatus) setGenerationStatus(savedState.generationStatus as GenerationStatus)
            
            // If we have a result but isGenerating is true, the generation has completed
            if (savedState.result && savedState.isGenerating) {
              setIsGenerating(false)
              setGenerationStatus({
                status: getStatusMessage('complete'),
                estimatedTime: 0,
                progress: 100,
                stage: 'complete'
              })
            } else if (savedState.isGenerating) {
              // Check if the generation is actually still running by checking the timestamp
              const now = Date.now()
              const generationStartTime = savedState.timestamp || now
              const timeSinceStart = now - generationStartTime
              
              // If the generation has been running for more than 10 minutes, mark it as failed
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
            // Don't clear state on subscription errors, just log them
          }
        }
        
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          restoreState()
          // Reset the flag after a longer delay to ensure all state updates are complete
          setTimeout(() => setIsUpdatingFromState(false), 100)
        })
      }
    })

    return unsubscribe
  }, [isUpdatingFromState])

  const handleInputChange = (field: keyof CharacterForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const clearSavedState = () => {
    generatorStateManager.clearState(GENERATOR_TYPE)
    setForm({
      race: '',
      class: '',
      background: '',
      skipPortrait: false,
    })
    setCharacter(null)
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

  const generateCharacter = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      setCharacter(null) // Clear previous result immediately
      
      // Initialize status
      setGenerationStatus({
        status: getStatusMessage('queued'),
        estimatedTime: getEstimatedTime('queued'),
        progress: getProgressPercentage('queued'),
        stage: 'queued'
      })
      
      // Check queue status first
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

      // Update status to generating
      setGenerationStatus({
        status: getStatusMessage('generating'),
        estimatedTime: getEstimatedTime('generating'),
        progress: getProgressPercentage('generating'),
        stage: 'generating'
      })

      const response = await fetch('/api/character-generator', {
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
        throw new Error(errorData.error || 'Failed to generate character')
      }

      const data = await response.json()
      
      // Set character data immediately
      setCharacter(data.character)
      
      // Update status to complete for character generation
      setGenerationStatus({
        status: getStatusMessage('complete'),
        estimatedTime: 0,
        progress: 100,
        stage: 'complete'
      })
      
      // Clear any previous errors on successful generation
      setError(null)
      
      // If portrait is pending, generate it separately
      if (data.portraitPending && !form.skipPortrait) {
        console.log('Starting portrait generation for character:', data.character.name)
        generatePortrait(data.character)
      } else {
        console.log('Portrait generation skipped:', {
          portraitPending: data.portraitPending,
          skipPortrait: form.skipPortrait
        })
      }
      
    } catch (error) {
      console.error('Character generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate character. Please try again.')
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

  const generatePortrait = async (characterData: GeneratedCharacter) => {
    console.log('generatePortrait called with character:', characterData.name)
    try {
      setIsPortraitLoading(true)
      // Update status to show portrait generation
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
          characterData,
          contentType: 'character'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Portrait generation failed:', errorData.error)
        // Don't throw error - just log it and continue without portrait
        return
      }

      const data = await response.json()
      
      console.log('Portrait generation response:', data)
      
      // Update character with portrait and stable URL
      if (data.portrait) {
        const updatedCharacter = {
          ...characterData,
          portrait: data.portrait,
          portraitUrl: data.portrait // Store the stable URL
        }
        
        console.log('Updating character with portrait data:', {
          originalCharacter: characterData,
          updatedCharacter: updatedCharacter,
          portrait: data.portrait
        })
        
        // Update the character state
        setCharacter(updatedCharacter)
        
        // Also update the global state manager to ensure consistency
        generatorStateManager.updateState(GENERATOR_TYPE, {
          result: updatedCharacter,
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
        
        console.log('Character updated with portrait:', updatedCharacter)
        
        // Force a re-render by updating a dummy state
        setGenerationStatus(prev => ({ ...prev }))
        
        // Force a small delay to ensure state is properly updated
        setTimeout(() => {
          console.log('Character state after delay:', updatedCharacter)
        }, 100)
      } else {
        console.log('No portrait data received from API')
      }
      
      // Update status to complete
      setGenerationStatus({
        status: getStatusMessage('complete'),
        estimatedTime: 0,
        progress: 100,
        stage: 'complete'
      })
      
    } catch (error) {
      console.error('Portrait generation error:', error)
      // Don't show error to user - just log it and continue without portrait
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
    if (!character) return

    try {
      const response = await fetch('/api/character-generator/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ character, unitSystem }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${character.name.replace(/\s+/g, '_')}_Character_Sheet.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('PDF generation error:', error)
      setError('Failed to generate PDF. Please try again.')
    }
  }

  const saveCharacter = async () => {
    if (!character) {
      setError('No character to save')
      return
    }

    try {
      // Ensure we have the most up-to-date character data
      const characterToSave = {
        ...character,
        // Make sure portrait and portraitUrl are included
        portrait: character.portrait || character.portraitUrl,
        portraitUrl: character.portraitUrl || character.portrait
      }
      
      console.log('Saving character with portrait data:', {
        name: characterToSave.name,
        hasPortrait: !!characterToSave.portrait,
        hasPortraitUrl: !!characterToSave.portraitUrl,
        portrait: characterToSave.portrait,
        portraitUrl: characterToSave.portraitUrl,
        fullCharacter: characterToSave
      })
      
      // Also log the current character state for comparison
      console.log('Current character state:', {
        name: character?.name,
        hasPortrait: !!character?.portrait,
        hasPortraitUrl: !!character?.portraitUrl,
        portrait: character?.portrait,
        portraitUrl: character?.portraitUrl
      })
      
      const response = await fetch('/api/characters/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ character: characterToSave }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save character')
      }

      const result = await response.json()
      showSuccess('Character Saved!', 'Your character has been saved successfully.')
    } catch (error) {
      console.error('Character saving error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save character. Please try again.'
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
              <h1 className="fantasy-title text-3xl font-bold mb-2">AI Character Generator</h1>
              <p className="fantasy-text">Create unique D&D characters with detailed backstories and stats</p>
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
            <Sword className="h-5 w-5 mr-2 text-yellow-600" />
            Character Parameters
          </h2>
          
          {/* Custom Prompt - Default View */}
          <div className="mb-6">
            <label className="block fantasy-text text-sm font-medium mb-2">
              Character Description *
            </label>
            <textarea
              value={form.customPrompt || ''}
              onChange={(e) => handleInputChange('customPrompt', e.target.value)}
              placeholder="Describe the character you want to generate (e.g., 'A wise old dwarf cleric who has seen too many wars')"
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
                <Sword className="h-4 w-4 mr-2 text-yellow-600" />
                Advanced Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    Character Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter character name or leave blank for AI to generate"
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
                    Background (Optional)
                  </label>
                  <select
                    value={form.background}
                    onChange={(e) => handleInputChange('background', e.target.value)}
                    className="w-full fantasy-input fantasy-text"
                  >
                    <option value="">Select a background (optional)</option>
                    {backgrounds.map(background => (
                      <option key={background} value={background}>{background}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    Personality Type (Optional)
                  </label>
                  <select
                    value={form.personalityType || ''}
                    onChange={(e) => handleInputChange('personalityType', e.target.value)}
                    className="w-full fantasy-input fantasy-text"
                  >
                    <option value="">Select personality type (optional)</option>
                    {personalityTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={generateCharacter}
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
                  Generate Character
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

        {/* Generated Character Section */}
        {character && (
          <div id="character-result" className="fantasy-card">
            {/* Top Row - Buttons in corners */}
            <div className="flex space-x-4">
              <button
                onClick={saveCharacter}
                disabled={isGenerating}
                className="flex-1 fantasy-button-accent shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4 mr-2" />
                {isGenerating ? 'Saving...' : 'Save Character'}
              </button>
              <button
                onClick={downloadPDF}
                className="flex-1 fantasy-button-secondary shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              <button
                onClick={() => character && generatePortrait(character)}
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

            {/* Character Name - Centered */}
            <div className="text-center mb-6">
              <h3 className="fantasy-title text-3xl font-bold mb-2">{character.name}</h3>
              <p className="fantasy-text text-lg">
                Level {character.level} {character.race} {character.class} • {character.background}
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
            ) : character.portrait || character.portraitUrl ? (
              <div className="mb-6">
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center justify-center">
                  <User className="h-4 w-4 mr-2" />
                  Character Portrait
                </h4>
                <div className="flex justify-center">
                  <Image
                    src={character.portrait || character.portraitUrl || '/placeholder-portrait.jpg'}
                    alt={`Portrait of ${character.name}`}
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
              {/* Stats Grid */}
              <div>
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Ability Scores
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(character.stats).map(([stat, value]) => (
                    <div key={stat} className="fantasy-card p-3 text-center">
                      <div className="fantasy-text text-sm font-medium">{stat}</div>
                      <div className={`fantasy-title text-xl font-bold ${getStatColor(value)}`}>{value}</div>
                      <div className="fantasy-text text-sm text-gray-400">{getModifier(value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Combat Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="fantasy-card p-4">
                  <div className="flex items-center mb-2">
                    <Heart className="h-4 w-4 mr-2 text-red-600" />
                    <span className="fantasy-text font-medium">Hit Points</span>
                  </div>
                  <div className="fantasy-title text-2xl font-bold text-red-600">{character.hitPoints}</div>
                </div>
                <div className="fantasy-card p-4">
                  <div className="flex items-center mb-2">
                    <Shield className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="fantasy-text font-medium">Armor Class</span>
                  </div>
                  <div className="fantasy-title text-2xl font-bold text-blue-600">{character.armorClass}</div>
                </div>
                <div className="fantasy-card p-4">
                  <div className="flex items-center mb-2">
                    <Zap className="h-4 w-4 mr-2 text-yellow-600" />
                    <span className="fantasy-text font-medium">Initiative</span>
                  </div>
                  <div className="fantasy-title text-2xl font-bold text-yellow-600">{getModifier(character.stats.DEX)}</div>
                </div>
                <div className="fantasy-card p-4">
                  <div className="flex items-center mb-2">
                    <Target className="h-4 w-4 mr-2 text-green-600" />
                    <span className="fantasy-text font-medium">Speed</span>
                  </div>
                  <div className="fantasy-title text-2xl font-bold text-green-600">
                    {convertDistance(`${character.speed} ft`, unitSystem)}
                  </div>
                </div>
              </div>

              {/* Backstory */}
              <div>
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center">
                  <Brain className="h-4 w-4 mr-2" />
                  Backstory
                </h4>
                <div className="fantasy-card p-4">
                  <p className="fantasy-text leading-relaxed text-base">{character.backstory}</p>
                </div>
              </div>

              {/* Personality Traits */}
              <div>
                <h4 className="fantasy-title text-lg font-semibold mb-3">Personality Traits</h4>
                <div className="flex flex-wrap gap-2">
                  {character.personalityTraits.map((trait, index) => (
                    <span
                      key={index}
                      className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium fantasy-text"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="fantasy-card p-4 border-l-4 border-yellow-500">
                                  <p className="fantasy-text italic text-base">&quot;{character.quote}&quot;</p>
                <p className="fantasy-text text-sm text-gray-400 mt-2">— {character.name}</p>
              </div>

              {/* Unique Trait */}
              <div className="fantasy-card p-4 border-l-4 border-purple-500">
                <h4 className="fantasy-title text-lg font-semibold mb-2 flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-purple-600" />
                  Unique Trait
                </h4>
                <p className="fantasy-text text-base">{character.uniqueTrait}</p>
              </div>

              {/* Proficiencies & Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Proficiencies</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {character.proficiencies.map((prof, index) => (
                      <div key={index} className="fantasy-text text-sm">• {prof}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Features</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {character.features.map((feature, index) => (
                      <div key={index} className="fantasy-text text-sm">• {feature}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
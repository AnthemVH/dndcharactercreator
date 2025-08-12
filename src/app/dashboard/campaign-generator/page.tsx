'use client'

import { useState, useEffect } from 'react'
import { Download, Sparkles, Brain, Crown, Save, Map, Scroll } from 'lucide-react'
import { GenerationStatus, getStatusMessage, getEstimatedTime, getProgressPercentage } from '@/lib/generation-status'
import { generatorStateManager } from '@/lib/generator-state'
import FantasyToggle from '@/components/FantasyToggle'
import GenerationStatusPanel from '@/components/GenerationStatusPanel'
import { showSuccess, showError } from '@/components/FantasyNotification'

interface CampaignForm {
  name?: string
  theme: string
  setting: string
  customPrompt?: string
}

interface GeneratedCampaign {
  name: string
  theme: string
  setting: string
  description: string
  plot: string
  characters: string[]
  locations: string[]
  quests: string[]
  encounters: string[]
  rewards: string[]
  challenges: string[]
  timeline: string
  consequences: string[]
  quote: string
  uniqueTrait: string
  portrait?: string
  portraitUrl?: string
  mainPlot: string
  subPlots: string[]
  notes: string
}

const themes = [
  'Epic Fantasy', 'Dark Fantasy', 'High Magic', 'Low Magic', 'Political Intrigue', 'War', 'Exploration', 'Mystery', 'Horror', 'Comedy', 'Romance', 'Revenge', 'Redemption', 'Discovery', 'Survival', 'Conquest', 'Diplomacy', 'Trade', 'Religion', 'Technology'
]

const settings = [
  'Medieval Kingdom', 'Ancient Empire', 'Floating Islands', 'Underground City', 'Desert Oasis', 'Frozen Wasteland', 'Tropical Paradise', 'Mystical Forest', 'Underwater Kingdom', 'Astral Plane', 'Elemental Realm', 'Fey Realm', 'Shadow Realm', 'Dragon Territory', 'Giant Kingdom', 'Underdark', 'Floating Continent', 'Time-Lost City', 'Dimensional Nexus', 'Post-Apocalyptic'
]

const GENERATOR_TYPE = 'campaign'

export default function CampaignGenerator() {
  const [form, setForm] = useState<CampaignForm>({
    theme: '',
    setting: '',
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [campaign, setCampaign] = useState<GeneratedCampaign | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [useCustomPrompt, setUseCustomPrompt] = useState(true)
  const [useAdvanced, setUseAdvanced] = useState(false)
  const [queueStatus, setQueueStatus] = useState<string>('')
  const [tokenBalance, setTokenBalance] = useState<number>(0)
  const [queuePosition, setQueuePosition] = useState<number>(0)

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
          // Do not apply form updates from subscription to avoid overwriting live typing/state
          if (savedState.result) setCampaign(savedState.result as GeneratedCampaign)
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
        try {
          if (generatorStateManager.getState(GENERATOR_TYPE)?.result) {
            document.getElementById('campaign-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        } catch {}
      })
    }
  }, [])

  // Save state to global state manager whenever it changes
  useEffect(() => {
    if (!isUpdatingFromState) {
      const stateToSave = {
        result: campaign,
        isGenerating,
        queueStatus,
        error,
        generationStatus,
      }
      generatorStateManager.updateState(GENERATOR_TYPE, stateToSave)
    }
  }, [campaign, isGenerating, queueStatus, error, generationStatus, isUpdatingFromState])

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
            // Do not apply form updates from subscription to avoid overwriting live typing/state
            if (savedState.result) setCampaign(savedState.result as GeneratedCampaign)
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

  const handleInputChange = (field: keyof CampaignForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const clearSavedState = () => {
    generatorStateManager.clearState(GENERATOR_TYPE)
    setForm({
      theme: '',
      setting: '',
    })
    setCampaign(null)
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

  const generateCampaign = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      setCampaign(null)
      
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

      const response = await fetch('/api/campaign-generator', {
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
        throw new Error(errorData.error || 'Failed to generate campaign')
      }

      const data = await response.json()

      // Normalize campaign to ensure array fields exist
      const normalizedCampaign: GeneratedCampaign = {
        ...data.campaign,
        characters: Array.isArray(data.campaign?.characters) ? data.campaign.characters : [],
        locations: Array.isArray(data.campaign?.locations) ? data.campaign.locations : [],
        quests: Array.isArray(data.campaign?.quests) ? data.campaign.quests : [],
        encounters: Array.isArray(data.campaign?.encounters) ? data.campaign.encounters : [],
        rewards: Array.isArray(data.campaign?.rewards) ? data.campaign.rewards : [],
        challenges: Array.isArray(data.campaign?.challenges) ? data.campaign.challenges : [],
        consequences: Array.isArray(data.campaign?.consequences) ? data.campaign.consequences : [],
        timeline: data.campaign?.timeline || '',
        mainPlot: data.campaign?.mainPlot || '',
        subPlots: Array.isArray(data.campaign?.subPlots) ? data.campaign.subPlots : [],
        notes: data.campaign?.notes || ''
      }

      setCampaign(normalizedCampaign)
      // Persist immediately so navigating away/back shows the result
      generatorStateManager.updateState(GENERATOR_TYPE, {
        result: normalizedCampaign,
        isGenerating: false,
        error: null,
        generationStatus: {
          status: getStatusMessage('complete'),
          estimatedTime: 0,
          progress: 100,
          stage: 'complete'
        }
      })
      
      setError(null)
      
    } catch (error) {
      console.error('Campaign generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate campaign. Please try again.')
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
    if (!campaign) return

    try {
      const response = await fetch('/api/campaign-generator/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaign }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${campaign.name.replace(/\s+/g, '_')}_Campaign_Sheet.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('PDF generation error:', error)
      setError('Failed to generate PDF. Please try again.')
    }
  }

  const saveCampaign = async () => {
    if (!campaign) {
      setError('No campaign to save')
      return
    }

    try {
      const campaignToSave = {
        ...campaign,
        portrait: campaign.portrait || campaign.portraitUrl,
        portraitUrl: campaign.portraitUrl || campaign.portrait
      }
      
      console.log('Saving campaign with portrait data:', {
        name: campaignToSave.name,
        hasPortrait: !!campaignToSave.portrait,
        hasPortraitUrl: !!campaignToSave.portraitUrl,
        portrait: campaignToSave.portrait,
        portraitUrl: campaignToSave.portraitUrl,
        fullCampaign: campaignToSave
      })
      
      console.log('Current campaign state:', {
        name: campaign?.name,
        hasPortrait: !!campaign?.portrait,
        hasPortraitUrl: !!campaign?.portraitUrl,
        portrait: campaign?.portrait,
        portraitUrl: campaign?.portraitUrl
      })
      
      const response = await fetch('/api/campaigns/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaign: campaignToSave }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save campaign')
      }

      await response.json()
      showSuccess('Campaign Saved!', 'Your campaign has been saved successfully.')
    } catch (error) {
      console.error('Campaign saving error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save campaign. Please try again.'
      setError(errorMessage)
      showError('Save Failed', errorMessage)
    }
  }

  const toDisplayText = (value: unknown, fallback: string = ''): string => {
    if (value == null) return fallback
    const valueType = typeof value
    if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
      return String(value)
    }
    if (valueType === 'object' && value !== null) {
      // Prefer common fields
      // title for quests, name for characters/locations/items/encounters
      const obj = value as Record<string, unknown>
      if ('title' in obj && typeof obj.title === 'string') return obj.title
      if ('name' in obj && typeof obj.name === 'string') return obj.name
      if ('description' in obj && typeof obj.description === 'string') return obj.description
      // Fallback to a compact JSON string
      try {
        return JSON.stringify(value)
      } catch {
        return fallback
      }
    }
    return fallback
  }

  return (
    <div className="min-h-screen fantasy-main">
      <GenerationStatusPanel />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="fantasy-title text-3xl font-bold mb-2">AI Campaign Generator</h1>
              <p className="fantasy-text">Create epic D&D campaigns with detailed plots and storylines</p>
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
            <Map className="h-5 w-5 mr-2 text-yellow-600" />
            Campaign Parameters
          </h2>
          
          {/* Custom Prompt - Default View */}
          <div className="mb-6">
            <label className="block fantasy-text text-sm font-medium mb-2">
              Campaign Description *
            </label>
            <textarea
              value={form.customPrompt || ''}
              onChange={(e) => handleInputChange('customPrompt', e.target.value)}
              placeholder="Describe the campaign you want to generate (e.g., 'An epic quest to save the world from an ancient evil')"
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
                <Map className="h-4 w-4 mr-2 text-yellow-600" />
                Advanced Options
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    Campaign Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter campaign name or leave blank for AI to generate"
                    className="w-full fantasy-input fantasy-text"
                  />
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

                <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    Setting (Optional)
                  </label>
                  <select
                    value={form.setting}
                    onChange={(e) => handleInputChange('setting', e.target.value)}
                    className="w-full fantasy-input fantasy-text"
                  >
                    <option value="">Select a setting (optional)</option>
                    {settings.map(setting => (
                      <option key={setting} value={setting}>{setting}</option>
                    ))}
                  </select>
                </div>

                
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={generateCampaign}
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
                  Generate Campaign
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

        {/* Generated Campaign Section */}
        {campaign && (
          <div id="campaign-result" className="fantasy-card">
            {/* Top Row - Buttons in corners */}
            <div className="flex space-x-4">
              <button
                onClick={saveCampaign}
                disabled={isGenerating}
                className="flex-1 fantasy-button-accent shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4 mr-2" />
                {isGenerating ? 'Saving...' : 'Save Campaign'}
              </button>
              <button
                onClick={downloadPDF}
                className="flex-1 fantasy-button-secondary shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              
            </div>

            {/* Campaign Name - Centered */}
            <div className="text-center mb-6">
              <h3 className="fantasy-title text-3xl font-bold mb-2">{campaign.name}</h3>
              <p className="fantasy-text text-lg">
                {campaign.theme} • {campaign.setting}
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
                  <p className="fantasy-text leading-relaxed text-base">{campaign.description}</p>
                </div>
              </div>

              {/* Main Plot */}
              <div>
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center">
                  <Scroll className="h-4 w-4 mr-2" />
                  Main Plot
                </h4>
                <div className="fantasy-card p-4">
                  <p className="fantasy-text leading-relaxed text-base">{campaign.mainPlot}</p>
                </div>
              </div>

              {/* Characters & Locations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Characters</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {(campaign.characters || []).map((character, index) => (
                      <div key={index} className="fantasy-text text-sm">• {toDisplayText(character, 'Character')}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Locations</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {(campaign.locations || []).map((location, index) => (
                      <div key={index} className="fantasy-text text-sm">• {toDisplayText(location, 'Location')}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quests & Encounters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Quests</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {(campaign.quests || []).map((quest, index) => (
                      <div key={index} className="fantasy-text text-sm">• {toDisplayText(quest, 'Quest')}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Encounters</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {(campaign.encounters || []).map((encounter, index) => (
                      <div key={index} className="fantasy-text text-sm">• {toDisplayText(encounter, 'Encounter')}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sub-plots */}
              <div>
                <h4 className="fantasy-title text-lg font-semibold mb-3">Sub-plots</h4>
                <div className="fantasy-card p-4 space-y-1">
                  {(campaign.subPlots || []).map((sp, index) => (
                    <div key={index} className="fantasy-text text-sm">• {toDisplayText(sp, 'Sub-plot')}</div>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="fantasy-card p-4 border-l-4 border-yellow-500">
                <p className="fantasy-text italic text-base">&quot;{campaign.quote}&quot;</p>
                <p className="fantasy-text text-sm text-gray-400 mt-2">— {campaign.name}</p>
              </div>

              {/* Unique Trait */}
              <div className="fantasy-card p-4 border-l-4 border-purple-500">
                <h4 className="fantasy-title text-lg font-semibold mb-2 flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-purple-600" />
                  Unique Trait
                </h4>
                <p className="fantasy-text text-base">{campaign.uniqueTrait}</p>
              </div>

              {/* Notes */}
              <div>
                <h4 className="fantasy-title text-lg font-semibold mb-3">Notes</h4>
                <div className="fantasy-card p-4">
                  <p className="fantasy-text text-sm">{campaign.notes}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
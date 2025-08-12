'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Download, Sparkles, User, Shield, Heart, Zap, Target, Brain, Crown, Save, Sword, Hammer, Coins, Scroll } from 'lucide-react'
import { GenerationStatus, getStatusMessage, getEstimatedTime, getProgressPercentage } from '@/lib/generation-status'
import { clearLocalStorageState, saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils'
import { generatorStateManager } from '@/lib/generator-state'
import { useUnitSystem, convertWeight } from '@/components/UnitToggle'
import FantasyToggle from '@/components/FantasyToggle'
import GenerationStatusPanel from '@/components/GenerationStatusPanel'
import { showSuccess, showError } from '@/components/FantasyNotification'

interface ItemForm {
  name?: string
  itemType: string
  theme: string
  customPrompt?: string
  skipPortrait?: boolean
}

interface GeneratedItem {
  name: string
  itemType: string
  theme: string
  rarity: string
  description: string
  properties: string[]
  magicalEffects: string[]
  history: string
  value: string
  weight: string
  requirements: string[]
  attunement: boolean
  quote: string
  uniqueTrait: string
  craftingMaterials: string[]
  enchantments: string[]
  restrictions: string[]
  portrait?: string
  portraitUrl?: string
}

const itemTypes = [
  'Weapon', 'Armor', 'Shield', 'Ring', 'Amulet', 'Boots', 'Gloves', 'Cloak', 'Belt', 'Helmet', 'Potion', 'Scroll', 'Wand', 'Staff', 'Rod', 'Gem', 'Crystal', 'Talisman', 'Relic', 'Artifact'
]

const themes = [
  'Ancient', 'Celestial', 'Infernal', 'Elemental', 'Necromantic', 'Divine', 'Arcane', 'Primal', 'Shadow', 'Light', 'Chaos', 'Order', 'Nature', 'Technology', 'Cosmic', 'Temporal', 'Spatial', 'Mental', 'Physical', 'Spiritual'
]

const GENERATOR_TYPE = 'item'

export default function ItemGenerator() {
  const unitSystem = useUnitSystem()
  const [form, setForm] = useState<ItemForm>({
    itemType: '',
    theme: '',
    skipPortrait: false,
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [item, setItem] = useState<GeneratedItem | null>(null)
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
          if (savedState.result) setItem(savedState.result as GeneratedItem)
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
        result: item,
        isGenerating,
        queueStatus,
        error,
        generationStatus,
      }
      generatorStateManager.updateState(GENERATOR_TYPE, stateToSave)
    }
  }, [item, isGenerating, queueStatus, error, generationStatus, isUpdatingFromState])

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
            if (savedState.result) setItem(savedState.result as GeneratedItem)
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

  const handleInputChange = (field: keyof ItemForm, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const clearSavedState = () => {
    generatorStateManager.clearState(GENERATOR_TYPE)
    setForm({
      itemType: '',
      theme: '',
      skipPortrait: false,
    })
    setItem(null)
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

  const generateItem = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      setItem(null)
      
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

      const response = await fetch('/api/item-generator', {
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
        throw new Error(errorData.error || 'Failed to generate item')
      }

      const data = await response.json()

      // Normalize API response to match GeneratedItem expectations
      const splitToArray = (val: unknown): string[] => {
        if (Array.isArray(val)) return val.map(v => String(v))
        if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean)
        if (val == null) return []
        return [String(val)]
      }
      const ensureString = (val: unknown, fallback = ''): string => (val == null ? fallback : String(val))
      const ensureBoolean = (val: unknown, fallback = false): boolean => {
        if (typeof val === 'boolean') return val
        if (typeof val === 'string') return val.toLowerCase() === 'true'
        return fallback
      }

      const apiItem = data.item || {}
      const normalizedItem: GeneratedItem = {
        name: ensureString(apiItem.name),
        itemType: ensureString(apiItem.itemType || form.itemType),
        theme: ensureString(apiItem.theme || form.theme),
        rarity: ensureString(apiItem.rarity || 'Common'),
        description: ensureString(apiItem.description),
        properties: splitToArray(apiItem.properties),
        magicalEffects: splitToArray(apiItem.magicalEffects),
        history: ensureString(apiItem.history),
        value: ensureString(apiItem.value),
        weight: ensureString(apiItem.weight),
        requirements: splitToArray(apiItem.requirements),
        attunement: ensureBoolean(apiItem.attunement, false),
        quote: ensureString(apiItem.quote),
        uniqueTrait: ensureString(apiItem.uniqueTrait),
        craftingMaterials: splitToArray(apiItem.craftingMaterials),
        enchantments: splitToArray(apiItem.enchantments),
        restrictions: splitToArray(apiItem.restrictions),
        portrait: apiItem.portrait,
        portraitUrl: apiItem.portraitUrl,
      }

      setItem(normalizedItem)
      
      setGenerationStatus({
        status: getStatusMessage('complete'),
        estimatedTime: 0,
        progress: 100,
        stage: 'complete'
      })
      
      setError(null)
      
      if (data.portraitPending && !form.skipPortrait) {
        console.log('Starting portrait generation for item:', normalizedItem.name)
        generatePortrait(normalizedItem)
      } else {
        console.log('Portrait generation skipped:', {
          portraitPending: data.portraitPending,
          skipPortrait: form.skipPortrait
        })
      }
      
    } catch (error) {
      console.error('Item generation error:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate item. Please try again.')
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

  const generatePortrait = async (itemData: GeneratedItem) => {
    console.log('generatePortrait called with item:', itemData.name)
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
          characterData: itemData,
          contentType: 'item'
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
        const updatedItem = {
          ...itemData,
          portrait: data.portrait,
          portraitUrl: data.portrait
        }
        
        console.log('Updating item with portrait data:', {
          originalItem: itemData,
          updatedItem: updatedItem,
          portrait: data.portrait
        })
        
        setItem(updatedItem)
        
        generatorStateManager.updateState(GENERATOR_TYPE, {
          result: updatedItem,
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
        
        console.log('Item updated with portrait:', updatedItem)
        
        setGenerationStatus(prev => ({ ...prev }))
        
        setTimeout(() => {
          console.log('Item state after delay:', updatedItem)
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
    if (!item) return

    try {
      const response = await fetch('/api/item-generator/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item, unitSystem }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${item.name.replace(/\s+/g, '_')}_Item_Sheet.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('PDF generation error:', error)
      setError('Failed to generate PDF. Please try again.')
    }
  }

  const saveItem = async () => {
    if (!item) {
      setError('No item to save')
      return
    }

    try {
      const itemToSave = {
        ...item,
        portrait: item.portrait || item.portraitUrl,
        portraitUrl: item.portraitUrl || item.portrait
      }
      
      console.log('Saving item with portrait data:', {
        name: itemToSave.name,
        hasPortrait: !!itemToSave.portrait,
        hasPortraitUrl: !!itemToSave.portraitUrl,
        portrait: itemToSave.portrait,
        portraitUrl: itemToSave.portraitUrl,
        fullItem: itemToSave
      })
      
      console.log('Current item state:', {
        name: item?.name,
        hasPortrait: !!item?.portrait,
        hasPortraitUrl: !!item?.portraitUrl,
        portrait: item?.portrait,
        portraitUrl: item?.portraitUrl
      })
      
      const response = await fetch('/api/items/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ item: itemToSave }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save item')
      }

      const result = await response.json()
      showSuccess('Item Saved!', 'Your item has been saved successfully.')
    } catch (error) {
      console.error('Item saving error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save item. Please try again.'
      setError(errorMessage)
      showError('Save Failed', errorMessage)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return 'text-gray-600'
      case 'uncommon': return 'text-green-600'
      case 'rare': return 'text-blue-600'
      case 'very rare': return 'text-purple-600'
      case 'legendary': return 'text-orange-600'
      case 'artifact': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen fantasy-main">
      <GenerationStatusPanel />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="fantasy-title text-3xl font-bold mb-2">AI Item Generator</h1>
              <p className="fantasy-text">Create unique D&D items with magical properties and detailed descriptions</p>
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
            Item Parameters
          </h2>
          
          {/* Custom Prompt - Default View */}
          <div className="mb-6">
            <label className="block fantasy-text text-sm font-medium mb-2">
              Item Description *
            </label>
            <textarea
              value={form.customPrompt || ''}
              onChange={(e) => handleInputChange('customPrompt', e.target.value)}
              placeholder="Describe the item you want to generate (e.g., 'A flaming sword that burns enemies')"
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
                    Item Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter item name or leave blank for AI to generate"
                    className="w-full fantasy-input fantasy-text"
                  />
                </div>

                <div>
                  <label className="block fantasy-text text-sm font-medium mb-2">
                    Item Type (Optional)
                  </label>
                  <select
                    value={form.itemType}
                    onChange={(e) => handleInputChange('itemType', e.target.value)}
                    className="w-full fantasy-input fantasy-text"
                  >
                    <option value="">Select an item type (optional)</option>
                    {itemTypes.map(type => (
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
              onClick={generateItem}
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
                  Generate Item
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

        {/* Generated Item Section */}
        {item && (
          <div id="item-result" className="fantasy-card">
            {/* Top Row - Buttons in corners */}
            <div className="flex space-x-4">
              <button
                onClick={saveItem}
                disabled={isGenerating}
                className="flex-1 fantasy-button-accent shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4 mr-2" />
                {isGenerating ? 'Saving...' : 'Save Item'}
              </button>
              <button
                onClick={downloadPDF}
                className="flex-1 fantasy-button-secondary shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
              <button
                onClick={() => item && generatePortrait(item)}
                disabled={isPortraitLoading}
                className="flex-1 fantasy-button-secondary shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {isPortraitLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Sword className="h-4 w-4 mr-2" />
                )}
                {isPortraitLoading ? 'Generating...' : 'Generate Portrait'}
              </button>
            </div>

            {/* Item Name - Centered */}
            <div className="text-center mb-6">
              <h3 className="fantasy-title text-3xl font-bold mb-2">{item.name}</h3>
              <p className="fantasy-text text-lg">
                {item.itemType} • {item.theme} • <span className={getRarityColor(item.rarity)}>{item.rarity}</span>
              </p>
            </div>

            {/* Portrait */}
            {isPortraitLoading ? (
              <div className="mb-6">
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center justify-center">
                  <Sword className="h-4 w-4 mr-2" />
                  Loading Portrait...
                </h4>
                <div className="flex justify-center">
                  <div className="w-48 h-48 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ) : item.portrait || item.portraitUrl ? (
              <div className="mb-6">
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center justify-center">
                  <Sword className="h-4 w-4 mr-2" />
                  Item Portrait
                </h4>
                <div className="flex justify-center">
                  <Image
                    src={item.portrait || item.portraitUrl || '/placeholder-portrait.jpg'}
                    alt={`Portrait of ${item.name}`}
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
                  <Sword className="h-4 w-4 mr-2" />
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
                  <p className="fantasy-text leading-relaxed text-base">{item.description}</p>
                </div>
              </div>

              {/* Properties & Magical Effects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Properties</h4>
                  <div className="flex flex-wrap gap-2">
                    {item.properties.map((property, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium fantasy-text"
                      >
                        {property}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Magical Effects</h4>
                  <div className="flex flex-wrap gap-2">
                    {item.magicalEffects.map((effect, index) => (
                      <span
                        key={index}
                        className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium fantasy-text"
                      >
                        {effect}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* History */}
              <div>
                <h4 className="fantasy-title text-lg font-semibold mb-3 flex items-center">
                  <Scroll className="h-4 w-4 mr-2" />
                  History
                </h4>
                <div className="fantasy-card p-4">
                  <p className="fantasy-text leading-relaxed text-base">{item.history}</p>
                </div>
              </div>

              {/* Value & Weight */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="fantasy-card p-4">
                  <div className="flex items-center mb-2">
                    <Coins className="h-4 w-4 mr-2 text-yellow-600" />
                    <span className="fantasy-text font-medium">Value</span>
                  </div>
                  <div className="fantasy-title text-2xl font-bold text-yellow-600">{item.value}</div>
                </div>
                <div className="fantasy-card p-4">
                  <div className="flex items-center mb-2">
                    <Target className="h-4 w-4 mr-2 text-green-600" />
                    <span className="fantasy-text font-medium">Weight</span>
                  </div>
                  <div className="fantasy-title text-2xl font-bold text-green-600">
                    {convertWeight(item.weight, unitSystem)}
                  </div>
                </div>
              </div>

              {/* Requirements & Attunement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Requirements</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {item.requirements.map((requirement, index) => (
                      <div key={index} className="fantasy-text text-sm">• {requirement}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Attunement</h4>
                  <div className="fantasy-card p-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.attunement}
                        disabled
                        className="rounded border-yellow-700 bg-yellow-50 text-yellow-600 focus:ring-yellow-500"
                      />
                      <label className="fantasy-text text-sm ml-2">
                        Requires attunement
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crafting Materials & Enchantments */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Crafting Materials</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {item.craftingMaterials.map((material, index) => (
                      <div key={index} className="fantasy-text text-sm">• {material}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="fantasy-title text-lg font-semibold mb-3">Enchantments</h4>
                  <div className="fantasy-card p-4 space-y-1">
                    {item.enchantments.map((enchantment, index) => (
                      <div key={index} className="fantasy-text text-sm">• {enchantment}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Restrictions */}
              <div>
                <h4 className="fantasy-title text-lg font-semibold mb-3">Restrictions</h4>
                <div className="fantasy-card p-4 space-y-1">
                  {item.restrictions.map((restriction, index) => (
                    <div key={index} className="fantasy-text text-sm">• {restriction}</div>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="fantasy-card p-4 border-l-4 border-yellow-500">
                <p className="fantasy-text italic text-base">&quot;{item.quote}&quot;</p>
                <p className="fantasy-text text-sm text-gray-400 mt-2">— {item.name}</p>
              </div>

              {/* Unique Trait */}
              <div className="fantasy-card p-4 border-l-4 border-purple-500">
                <h4 className="fantasy-title text-lg font-semibold mb-2 flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-purple-600" />
                  Unique Trait
                </h4>
                <p className="fantasy-text text-base">{item.uniqueTrait}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 
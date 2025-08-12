'use client'

import { useState, useEffect } from 'react'
import { Plus, Folder, Download, Trash2, X, Search, Edit } from 'lucide-react'
import { showSuccess, showError } from '@/components/FantasyNotification'

const themes = [
  'Adventure', 'Mystery', 'Horror', 'Political', 'War', 'Exploration', 
  'Survival', 'Heist', 'Romance', 'Comedy', 'Epic Fantasy', 'Dark Fantasy'
]

interface Campaign {
  id: string
  name: string
  description: string
  theme: string
  difficulty: string
  playerCount: number
  characterSlots?: number
  levelRange: string
  estimatedDuration: string
  setting: string
  mainPlot: string
  subPlots: string
  majorNPCs: string
  locations: string
  items: string
  quests: string
  encounters: string
  characters: string
  notes: string
  status: string
  createdAt: string
}

interface ContentItem {
  id: string
  name: string
  type: 'character' | 'world' | 'item' | 'quest' | 'encounter'
  campaignId?: string | null
}

interface CreateCampaignForm {
  name: string
  description: string
  theme: string
  difficulty: string
  playerCount: number
  characterSlots: number
  levelRange: string
  estimatedDuration: string
  setting: string
  mainPlot: string
  subPlots: string
  majorNPCs: string
  locations: string
  items: string
  quests: string
  encounters: string
  characters: string
  notes: string
  status: string
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [characters, setCharacters] = useState<ContentItem[]>([])
  const [worlds, setWorlds] = useState<ContentItem[]>([])
  const [items, setItems] = useState<ContentItem[]>([])
  const [quests, setQuests] = useState<ContentItem[]>([])
  const [encounters, setEncounters] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  const [searchTerm, setSearchTerm] = useState<string>('')
  const [filterTheme, setFilterTheme] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('dateCreated')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [tokenBalance, setTokenBalance] = useState<number>(0)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    theme: '',
    description: ''
  })
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null)
  const [createForm, setCreateForm] = useState<CreateCampaignForm>({
    name: '',
    description: '',
    theme: '',
    difficulty: '',
    playerCount: 4,
    characterSlots: 4,
    levelRange: '',
    estimatedDuration: '',
    setting: '',
    mainPlot: '',
    subPlots: '',
    majorNPCs: '',
    locations: '',
    items: '',
    quests: '',
    encounters: '',
    characters: '',
    notes: '',
    status: 'Active'
  })

  useEffect(() => {
    loadData()
  }, [])

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (showCreateModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showCreateModal])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load campaigns
      const campaignsResponse = await fetch('/api/campaigns')
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json()
        setCampaigns(campaignsData.campaigns || [])
      }

      // Load token balance
      const tokenResponse = await fetch('/api/tokens/balance')
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json()
        setTokenBalance(tokenData.tokens)
      }

      // Load all content
      const [charactersRes, worldsRes, itemsRes, questsRes, encountersRes] = await Promise.all([
        fetch('/api/characters'),
        fetch('/api/worlds'),
        fetch('/api/items'),
        fetch('/api/quests'),
        fetch('/api/encounters')
      ])

      if (charactersRes.ok) {
        const data = await charactersRes.json()
        setCharacters(data.characters?.map((c: { id: string; name: string; campaignId?: string | null }) => ({ 
          id: c.id, 
          name: c.name, 
          type: 'character' as const,
          campaignId: c.campaignId
        })) || [])
      }

      if (worldsRes.ok) {
        const data = await worldsRes.json()
        setWorlds(data.worlds?.map((w: { id: string; name: string; campaignId?: string | null }) => ({ 
          id: w.id, 
          name: w.name, 
          type: 'world' as const,
          campaignId: w.campaignId
        })) || [])
      }

      if (itemsRes.ok) {
        const data = await itemsRes.json()
        setItems(data.items?.map((i: { id: string; name: string; campaignId?: string | null }) => ({ 
          id: i.id, 
          name: i.name, 
          type: 'item' as const,
          campaignId: i.campaignId
        })) || [])
      }

      if (questsRes.ok) {
        const data = await questsRes.json()
        setQuests(data.quests?.map((q: { id: string; title: string; campaignId?: string | null }) => ({ 
          id: q.id, 
          name: q.title, 
          type: 'quest' as const,
          campaignId: q.campaignId
        })) || [])
      }

      if (encountersRes.ok) {
        const data = await encountersRes.json()
        setEncounters(data.encounters?.map((e: { id: string; name: string; campaignId?: string | null }) => ({ 
          id: e.id, 
          name: e.name, 
          type: 'encounter' as const,
          campaignId: e.campaignId
        })) || [])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }



  const deleteCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadData()
        if (selectedCampaign?.id === campaignId) {
          setSelectedCampaign(null)
        }
      } else {
        console.error('Failed to delete campaign')
      }
    } catch (error) {
      console.error('Failed to delete campaign:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getContentByType = (type: string) => {
    if (!selectedCampaign) return []
    
    switch (type) {
      case 'character': return characters.filter(char => char.campaignId === selectedCampaign.id)
      case 'world': return worlds.filter(world => world.campaignId === selectedCampaign.id)
      case 'item': return items.filter(item => item.campaignId === selectedCampaign.id)
      case 'quest': return quests.filter(quest => quest.campaignId === selectedCampaign.id)
      case 'encounter': return encounters.filter(encounter => encounter.campaignId === selectedCampaign.id)
      default: return []
    }
  }

  const getAllContent = () => {
    return [
      ...characters.map(c => ({ ...c, displayName: c.name })),
      ...worlds.map(w => ({ ...w, displayName: w.name })),
      ...items.map(i => ({ ...i, displayName: i.name })),
      ...quests.map(q => ({ ...q, displayName: q.name })),
      ...encounters.map(e => ({ ...e, displayName: e.name }))
    ]
  }

  const getAvailableContent = () => {
    let content = getAllContent().filter(item => !item.campaignId)
    
    // Filter by type
    if (contentFilter !== 'all') {
      content = content.filter(item => item.type === contentFilter)
    }
    
    // Filter by search term
    if (searchTerm) {
      content = content.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Sort content
    content.sort((a, b) => {
      switch (contentSortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'type':
          return a.type.localeCompare(b.type)
        case 'date':
          // For now, sort by name since we don't have date info
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })
    
    return content
  }

  // Filter and sort campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.theme.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTheme = !filterTheme || campaign.theme === filterTheme
    return matchesSearch && matchesTheme
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'theme':
        return a.theme.localeCompare(b.theme)
      case 'lastModified':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  const clearFilters = () => {
    setSearchTerm('')
    setFilterTheme('')
    setSortBy('dateCreated')
  }

          const handleEdit = (campaign: Campaign) => {
      setEditCampaign(campaign)
      setShowEditModal(true)
    }

  const handleDelete = async (campaignId: string) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      await deleteCampaign(campaignId)
    }
  }

  const handleView = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
  }

  const handleDownload = (campaign: Campaign) => {
    // Implementation for downloading campaign
    console.log('Download campaign:', campaign)
  }

     const handleCreateCampaign = async () => {
     if (!newCampaign.name || !newCampaign.theme) {
       showError('Missing Fields', 'Please fill in all required fields')
       return
     }
     
     setIsCreating(true)
     try {
       if (selectedCampaign) {
         // Update existing campaign
         const response = await fetch(`/api/campaigns/${selectedCampaign.id}`, {
           method: 'PUT',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({
             name: newCampaign.name,
             theme: newCampaign.theme,
             description: newCampaign.description
           }),
         })
         
         if (response.ok) {
           await loadData()
           setShowCreateModal(false)
           setSelectedCampaign(null)
           setNewCampaign({ name: '', theme: '', description: '' })
           showSuccess('Campaign Updated!', 'Your campaign has been updated successfully.')
         } else {
           const errorData = await response.json().catch(() => ({}))
           console.error('Failed to update campaign:', errorData)
           showError('Update Failed', 'Failed to update campaign. Please try again.')
         }
       } else {
         // Create new campaign
         const response = await fetch('/api/campaigns', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({
             name: newCampaign.name,
             theme: newCampaign.theme,
             description: newCampaign.description
           }),
         })
         
         if (response.ok) {
           await loadData()
           setShowCreateModal(false)
           setNewCampaign({ name: '', theme: '', description: '' })
           showSuccess('Campaign Created!', 'Your campaign has been created successfully.')
         } else {
           const errorData = await response.json().catch(() => ({}))
           console.error('Failed to create campaign:', errorData)
           showError('Creation Failed', 'Failed to create campaign. Please try again.')
         }
       }
     } catch (error) {
       console.error('Failed to save campaign:', error)
       showError('Save Failed', 'An error occurred while saving the campaign. Please try again.')
           } finally {
        setIsCreating(false)
      }
    }

    const generateCampaignContent = async (type: string, campaignId: string) => {
      if (tokenBalance < 1) {
        showError('Insufficient Tokens', 'Please purchase more tokens to generate content.')
        return
      }

      setIsGenerating(true)
      try {
        let prompt = ''
        let endpoint = ''

        // Build context from existing campaign data
        const context = {
          theme: editCampaign?.theme || '',
          setting: editCampaign?.setting || '',
          mainPlot: editCampaign?.mainPlot || '',
          levelRange: editCampaign?.levelRange || '',
          difficulty: editCampaign?.difficulty || '',
          existingNPCs: editCampaign?.majorNPCs || '',
          existingLocations: editCampaign?.locations || '',
          existingQuests: editCampaign?.quests || '',
          existingEncounters: editCampaign?.encounters || ''
        }

        switch (type) {
          case 'mainPlot':
            prompt = `Generate a compelling main plot for a D&D campaign with theme: ${context.theme}, setting: ${context.setting}, difficulty: ${context.difficulty}, and level range: ${context.levelRange}. The plot should be engaging and suitable for the specified levels.`
            endpoint = '/api/campaign-generator'
            break
          case 'subPlots':
            prompt = `Generate 2-3 interesting sub-plots for a D&D campaign with theme: ${context.theme}. These should complement the main story: "${context.mainPlot}". Consider the setting: ${context.setting} and difficulty: ${context.difficulty}.`
            endpoint = '/api/campaign-generator'
            break
          case 'majorNPCs':
            prompt = `Generate 3-5 major NPCs for a D&D campaign with theme: ${context.theme}, setting: ${context.setting}, and main plot: "${context.mainPlot}". Include their names, roles, motivations, and brief descriptions. These NPCs should be integral to the story and work together cohesively.`
            endpoint = '/api/npc-generator'
            break
          case 'locations':
            prompt = `Generate 4-6 key locations for a D&D campaign with theme: ${context.theme}, setting: ${context.setting}, and main plot: "${context.mainPlot}". Include their names, descriptions, and significance to the story. These locations should be interconnected and relevant to the campaign's narrative.`
            endpoint = '/api/world-lore-builder'
            break
          case 'quests':
            prompt = `Generate 3-5 quests for a D&D campaign with theme: ${context.theme}, setting: ${context.setting}, and main plot: "${context.mainPlot}". Include quest names, objectives, and brief descriptions. These quests should advance the main story and be appropriate for the difficulty: ${context.difficulty}.`
            endpoint = '/api/quest-generator'
            break
          case 'encounters':
            prompt = `Generate 2-3 combat encounters for a D&D campaign with theme: ${context.theme}, setting: ${context.setting}, and main plot: "${context.mainPlot}". Include encounter descriptions and difficulty levels appropriate for level range: ${context.levelRange}.`
            endpoint = '/api/encounter-creator'
            break
          case 'items':
            prompt = `Generate 5-8 unique items and rewards for a D&D campaign with theme: ${context.theme}, setting: ${context.setting}, and main plot: "${context.mainPlot}". Include item names, descriptions, and rarity appropriate for the campaign's difficulty and level range.`
            endpoint = '/api/item-generator'
            break
          default:
            return
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customPrompt: prompt,
            useCustomPrompt: true,
            campaignContext: context // Pass context to the API
          }),
        })

        if (response.ok) {
          const data = await response.json()
          let generatedContent = ''

          // Extract content based on the type
          switch (type) {
            case 'mainPlot':
              generatedContent = data.campaign?.mainPlot || data.mainPlot || data.content || 'Generated main plot content'
              break
            case 'subPlots':
              generatedContent = data.campaign?.subPlots || data.subPlots || data.content || 'Generated sub-plots content'
              break
            case 'majorNPCs':
              generatedContent = data.npc?.description || data.description || data.content || 'Generated NPCs content'
              break
            case 'locations':
              generatedContent = data.world?.description || data.description || data.content || 'Generated locations content'
              break
            case 'quests':
              generatedContent = data.quest?.description || data.description || data.content || 'Generated quests content'
              break
            case 'encounters':
              generatedContent = data.encounter?.description || data.description || data.content || 'Generated encounters content'
              break
            case 'items':
              generatedContent = data.item?.description || data.description || data.content || 'Generated items content'
              break
          }

          // Update the campaign with generated content
          if (editCampaign) {
            const updatedCampaign = { ...editCampaign }
            switch (type) {
              case 'mainPlot':
                updatedCampaign.mainPlot = generatedContent
                break
              case 'subPlots':
                updatedCampaign.subPlots = generatedContent
                break
              case 'majorNPCs':
                updatedCampaign.majorNPCs = generatedContent
                break
              case 'locations':
                updatedCampaign.locations = generatedContent
                break
              case 'quests':
                updatedCampaign.quests = generatedContent
                break
              case 'encounters':
                updatedCampaign.encounters = generatedContent
                break
              case 'items':
                updatedCampaign.items = generatedContent
                break
            }
            setEditCampaign(updatedCampaign)
            showSuccess('Content Generated!', `${type} content has been generated successfully.`)
          }

          // Update token balance
          setTokenBalance(prev => prev - 1)
        } else {
          showError('Generation Failed', 'Failed to generate content. Please try again.')
        }
      } catch (error) {
        console.error('Failed to generate content:', error)
        showError('Generation Error', 'An error occurred while generating content. Please try again.')
      } finally {
        setIsGenerating(false)
      }
    }

    // New integrated generation function that generates related content together
    const generateIntegratedContent = async (contentTypes: string[]) => {
      if (tokenBalance < contentTypes.length) {
        showError('Insufficient Tokens', `You need ${contentTypes.length} tokens to generate this content.`)
        return
      }

      setIsGenerating(true)
      try {
        const context = {
          theme: editCampaign?.theme || '',
          setting: editCampaign?.setting || '',
          mainPlot: editCampaign?.mainPlot || '',
          levelRange: editCampaign?.levelRange || '',
          difficulty: editCampaign?.difficulty || '',
          existingNPCs: editCampaign?.majorNPCs || '',
          existingLocations: editCampaign?.locations || '',
          existingQuests: editCampaign?.quests || '',
          existingEncounters: editCampaign?.encounters || ''
        }

        // Create a comprehensive prompt for integrated generation
        const integratedPrompt = `Generate integrated D&D campaign content for a campaign with:
- Theme: ${context.theme}
- Setting: ${context.setting}
- Main Plot: ${context.mainPlot}
- Level Range: ${context.levelRange}
- Difficulty: ${context.difficulty}

Generate the following content types: ${contentTypes.join(', ')}. All content should work together cohesively and reference each other where appropriate.

CRITICAL: Respond with ONLY a valid JSON object containing all requested content types.`

        const response = await fetch('/api/campaign-generator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customPrompt: integratedPrompt,
            useCustomPrompt: true,
            campaignContext: context,
            generateTypes: contentTypes
          }),
        })

        if (response.ok) {
          const data = await response.json()
          
          // Update the campaign with all generated content
          if (editCampaign) {
            const updatedCampaign = { ...editCampaign }
            
            contentTypes.forEach(type => {
              switch (type) {
                case 'mainPlot':
                  updatedCampaign.mainPlot = data.campaign?.mainPlot || data.mainPlot || 'Generated main plot content'
                  break
                case 'subPlots':
                  updatedCampaign.subPlots = data.campaign?.subPlots || data.subPlots || 'Generated sub-plots content'
                  break
                case 'majorNPCs':
                  updatedCampaign.majorNPCs = data.campaign?.majorNPCs || data.majorNPCs || 'Generated NPCs content'
                  break
                case 'locations':
                  updatedCampaign.locations = data.campaign?.locations || data.locations || 'Generated locations content'
                  break
                case 'quests':
                  updatedCampaign.quests = data.campaign?.quests || data.quests || 'Generated quests content'
                  break
                case 'encounters':
                  updatedCampaign.encounters = data.campaign?.encounters || data.encounters || 'Generated encounters content'
                  break
                case 'items':
                  updatedCampaign.items = data.campaign?.items || data.items || 'Generated items content'
                  break
              }
            })
            
            setEditCampaign(updatedCampaign)
            showSuccess('Content Generated!', `${contentTypes.join(', ')} content has been generated successfully.`)
          }

          // Update token balance (deduct one token per content type)
          setTokenBalance(prev => prev - contentTypes.length)
        } else {
          showError('Generation Failed', 'Failed to generate integrated content. Please try again.')
        }
      } catch (error) {
        console.error('Failed to generate integrated content:', error)
        showError('Generation Error', 'An error occurred while generating integrated content. Please try again.')
      } finally {
        setIsGenerating(false)
      }
    }

    const handleUpdateCampaign = async () => {
      if (!editCampaign) return

      setIsCreating(true)
      try {
        const response = await fetch(`/api/campaigns/${editCampaign.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editCampaign),
        })

        if (response.ok) {
          await loadData()
          setShowEditModal(false)
          setEditCampaign(null)
          showSuccess('Campaign Updated!', 'Your campaign has been updated successfully.')
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('Failed to update campaign:', errorData)
          showError('Update Failed', 'Failed to update campaign. Please try again.')
        }
      } catch (error) {
        console.error('Failed to update campaign:', error)
        showError('Update Error', 'An error occurred while updating the campaign. Please try again.')
      } finally {
        setIsCreating(false)
      }
    }

  if (loading) {
    return (
      <div className="min-h-screen fantasy-main">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-700"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen fantasy-main">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="fantasy-title text-3xl font-bold mb-2">Campaigns</h1>
              <p className="fantasy-text">Manage and organize your saved campaigns</p>
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

        {/* Search and Filter Section */}
        <div className="fantasy-card p-6 mb-8">
          <h2 className="fantasy-title text-xl font-semibold mb-6 flex items-center">
            <Search className="h-5 w-5 mr-2 text-yellow-600" />
            Search & Filter
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block fantasy-text text-sm font-medium mb-2">
                Search Campaigns
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, theme, or description..."
                className="w-full fantasy-input fantasy-text"
              />
            </div>
            <div>
              <label className="block fantasy-text text-sm font-medium mb-2">
                Filter by Theme
              </label>
              <select
                value={filterTheme}
                onChange={(e) => setFilterTheme(e.target.value)}
                className="w-full fantasy-input fantasy-text"
              >
                <option value="">All Themes</option>
                {themes.map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block fantasy-text text-sm font-medium mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full fantasy-input fantasy-text"
              >
                <option value="dateCreated">Date Created</option>
                <option value="name">Name</option>
                <option value="theme">Theme</option>
                <option value="lastModified">Last Modified</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
                                       <button
                onClick={() => {
                  setSelectedCampaign(null)
                  setNewCampaign({ name: '', theme: '', description: '' })
                  setIsCreating(false)
                  setShowCreateModal(true)
                }}
                className="fantasy-button-primary px-8 py-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Campaign
              </button>
            <button
              onClick={clearFilters}
              className="fantasy-button-secondary px-6 py-3"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Campaigns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="fantasy-card p-6 hover:shadow-lg transition-shadow">
                                            {/* Header with action buttons */}
               <div className="flex justify-end mb-3">
                 <div className="flex gap-1">
                   <button
                     onClick={() => handleEdit(campaign)}
                     className="fantasy-button-secondary p-1.5 rounded-md hover:bg-yellow-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 active:scale-95"
                     title="Edit Campaign"
                     aria-label={`Edit campaign: ${campaign.name}`}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' || e.key === ' ') {
                         e.preventDefault()
                         handleEdit(campaign)
                       }
                     }}
                   >
                     <Edit className="h-3 w-3" />
                   </button>
                   <button
                     onClick={() => handleDelete(campaign.id)}
                     className="fantasy-button-secondary p-1.5 rounded-md text-red-600 hover:bg-red-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-95"
                     title="Delete Campaign"
                     aria-label={`Delete campaign: ${campaign.name}`}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter' || e.key === ' ') {
                         e.preventDefault()
                         handleDelete(campaign.id)
                       }
                     }}
                   >
                     <Trash2 className="h-3 w-3" />
                   </button>
                 </div>
               </div>

               {/* Campaign title */}
               <div className="mb-4">
                 <h3 className="fantasy-title text-lg font-semibold break-words">{campaign.name}</h3>
               </div>
              
                             {/* Campaign details */}
               <div className="space-y-3 mb-4">
                 <div className="flex justify-between items-start">
                   <span className="fantasy-text text-sm font-medium flex-shrink-0">Theme:</span>
                   <span className="fantasy-text text-sm text-right ml-2 break-words max-w-[60%]">{campaign.theme}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="fantasy-text text-sm font-medium">Difficulty:</span>
                   <span className="fantasy-text text-sm text-right">{campaign.difficulty}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="fantasy-text text-sm font-medium">Level Range:</span>
                   <span className="fantasy-text text-sm text-right">{campaign.levelRange}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="fantasy-text text-sm font-medium">Duration:</span>
                   <span className="fantasy-text text-sm text-right">{campaign.estimatedDuration}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="fantasy-text text-sm font-medium">Players:</span>
                   <span className="fantasy-text text-sm text-right">{campaign.playerCount}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="fantasy-text text-sm font-medium">Created:</span>
                   <span className="fantasy-text text-sm text-right">{new Date(campaign.createdAt).toLocaleDateString()}</span>
                 </div>
                 {campaign.setting && (
                   <div className="flex justify-between items-start">
                     <span className="fantasy-text text-sm font-medium flex-shrink-0">Setting:</span>
                     <span className="fantasy-text text-sm text-right ml-2 break-words max-w-[60%]">{campaign.setting}</span>
                   </div>
                 )}
               </div>

                             {/* Description */}
               <div className="mb-4 pt-3 border-t border-yellow-700">
                 <div className="flex justify-between items-center mb-2">
                   <span className="fantasy-text text-xs font-medium text-yellow-600">Description</span>
                   <span className="fantasy-text text-xs text-yellow-600">{campaign.description.length} characters</span>
                 </div>
                 <p className="fantasy-text text-sm leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">{campaign.description}</p>
               </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-3 border-t border-yellow-700">
                <button
                  onClick={() => handleView(campaign)}
                  className="fantasy-button-accent flex-1 py-2.5 px-4 text-sm font-medium rounded-md hover:bg-yellow-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 active:scale-95"
                  aria-label={`View details for campaign: ${campaign.name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleView(campaign)
                    }
                  }}
                >
                  View Details
                </button>
                <button
                  onClick={() => handleDownload(campaign)}
                  className="fantasy-button-secondary py-2.5 px-4 text-sm font-medium rounded-md hover:bg-yellow-700 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 active:scale-95 flex items-center justify-center min-w-[44px]"
                  title="Download Campaign"
                  aria-label={`Download campaign: ${campaign.name}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleDownload(campaign)
                    }
                  }}
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredCampaigns.length === 0 && (
          <div className="text-center fantasy-card p-12">
            <Folder className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="fantasy-title text-xl mb-2">No Campaigns Found</h3>
            <p className="fantasy-text">Create your first campaign to get started</p>
                         <button
               onClick={() => {
                 setSelectedCampaign(null)
                 setNewCampaign({ name: '', theme: '', description: '' })
                 setIsCreating(false)
                 setShowCreateModal(true)
               }}
               className="fantasy-button-primary mt-4"
             >
               Create Campaign
             </button>
          </div>
        )}
      </div>

                           {/* Create/Edit Campaign Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ overflow: 'hidden' }}>
            <div className="fantasy-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-600 scrollbar-track-yellow-100" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
             <div className="flex justify-between items-start mb-4">
               <h2 className="fantasy-title text-xl font-semibold">
                 {selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}
               </h2>
                               <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setSelectedCampaign(null)
                    setNewCampaign({ name: '', theme: '', description: '' })
                    setIsCreating(false)
                  }}
                  className="fantasy-button-secondary p-2 rounded-md hover:bg-yellow-600 hover:text-white transition-all duration-200"
                  aria-label="Close modal"
                >
                  <X className="h-4 w-4" />
                </button>
             </div>
             
             <div className="space-y-4 min-h-[400px]">
               <div>
                 <label className="block fantasy-text text-sm font-medium mb-2">
                   Campaign Name *
                 </label>
                 <input
                   type="text"
                   value={newCampaign.name}
                   onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                   placeholder="Enter campaign name"
                   className="w-full fantasy-input fantasy-text"
                   required
                 />
               </div>
               
               <div>
                 <label className="block fantasy-text text-sm font-medium mb-2">
                   Theme *
                 </label>
                 <select
                   value={newCampaign.theme}
                   onChange={(e) => setNewCampaign({...newCampaign, theme: e.target.value})}
                   className="w-full fantasy-input fantasy-text"
                   required
                 >
                   <option value="">Select theme</option>
                   {themes.map(theme => (
                     <option key={theme} value={theme}>{theme}</option>
                   ))}
                 </select>
               </div>
               
               <div>
                 <label className="block fantasy-text text-sm font-medium mb-2">
                   Description
                 </label>
                 <textarea
                   value={newCampaign.description}
                   onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                   placeholder="Enter campaign description"
                   rows={8}
                   className="w-full fantasy-input fantasy-text resize-none"
                 />
               </div>
               
               {/* Spacer to ensure content is tall enough to scroll */}
               <div className="h-20"></div>
             </div>
             
             <div className="flex gap-3 mt-6 pt-4 border-t border-yellow-700">
               <button
                 onClick={handleCreateCampaign}
                 disabled={isCreating || !newCampaign.name || !newCampaign.theme}
                 className="fantasy-button-primary flex-1 py-2.5 px-4 font-medium rounded-md hover:bg-yellow-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                 aria-label={isCreating ? 'Processing...' : (selectedCampaign ? 'Update campaign' : 'Create new campaign')}
                 onKeyDown={(e) => {
                   if ((e.key === 'Enter' || e.key === ' ') && !isCreating && newCampaign.name && newCampaign.theme) {
                     e.preventDefault()
                     handleCreateCampaign()
                   }
                 }}
               >
                 {isCreating ? (selectedCampaign ? 'Updating...' : 'Creating...') : (selectedCampaign ? 'Update Campaign' : 'Create Campaign')}
               </button>
                               <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setSelectedCampaign(null)
                    setNewCampaign({ name: '', theme: '', description: '' })
                    setIsCreating(false)
                  }}
                  className="fantasy-button-secondary flex-1 py-2.5 px-4 font-medium rounded-md hover:bg-yellow-700 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 active:scale-95"
                  aria-label="Cancel campaign creation"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setShowCreateModal(false)
                      setSelectedCampaign(null)
                      setNewCampaign({ name: '', theme: '', description: '' })
                      setIsCreating(false)
                    }
                  }}
                >
                  Cancel
                </button>
             </div>
           </div>
         </div>
       )}

      {/* View Campaign Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="fantasy-card p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="fantasy-title text-xl font-semibold">{selectedCampaign.name}</h2>
              <button
                onClick={() => setSelectedCampaign(null)}
                className="fantasy-button-secondary p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
                         <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <h3 className="fantasy-title text-lg font-semibold mb-3">Campaign Details</h3>
                   <div className="space-y-3">
                     <div className="flex justify-between items-start">
                       <span className="fantasy-text font-semibold">Theme:</span>
                       <span className="fantasy-text text-right ml-4 break-words">{selectedCampaign.theme}</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="fantasy-text font-semibold">Difficulty:</span>
                       <span className="fantasy-text">{selectedCampaign.difficulty}</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="fantasy-text font-semibold">Level Range:</span>
                       <span className="fantasy-text">{selectedCampaign.levelRange}</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="fantasy-text font-semibold">Duration:</span>
                       <span className="fantasy-text">{selectedCampaign.estimatedDuration}</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="fantasy-text font-semibold">Players:</span>
                       <span className="fantasy-text">{selectedCampaign.playerCount}</span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="fantasy-text font-semibold">Setting:</span>
                       <span className="fantasy-text text-right ml-4 break-words">{selectedCampaign.setting || 'Not specified'}</span>
                     </div>
                   </div>
                 </div>
                 <div>
                   <h3 className="fantasy-title text-lg font-semibold mb-3">Description</h3>
                   <p className="fantasy-text leading-relaxed whitespace-pre-wrap">{selectedCampaign.description}</p>
                 </div>
               </div>
               
               {selectedCampaign.mainPlot && (
                 <div>
                   <h3 className="fantasy-title text-lg font-semibold mb-3">Main Plot</h3>
                   <div className="fantasy-card p-4">
                     <p className="fantasy-text leading-relaxed whitespace-pre-wrap">{selectedCampaign.mainPlot}</p>
                   </div>
                 </div>
               )}
               
               {selectedCampaign.subPlots && (
                 <div>
                   <h3 className="fantasy-title text-lg font-semibold mb-3">Sub Plots</h3>
                   <div className="fantasy-card p-4">
                     <p className="fantasy-text leading-relaxed whitespace-pre-wrap">{selectedCampaign.subPlots}</p>
                   </div>
                 </div>
               )}

               {selectedCampaign.majorNPCs && (
                 <div>
                   <h3 className="fantasy-title text-lg font-semibold mb-3">Major NPCs</h3>
                   <div className="fantasy-card p-4">
                     <p className="fantasy-text leading-relaxed whitespace-pre-wrap">{selectedCampaign.majorNPCs}</p>
                   </div>
                 </div>
               )}

               {selectedCampaign.locations && (
                 <div>
                   <h3 className="fantasy-title text-lg font-semibold mb-3">Locations</h3>
                   <div className="fantasy-card p-4">
                     <p className="fantasy-text leading-relaxed whitespace-pre-wrap">{selectedCampaign.locations}</p>
                   </div>
                 </div>
               )}

               {selectedCampaign.quests && (
                 <div>
                   <h3 className="fantasy-title text-lg font-semibold mb-3">Quests</h3>
                   <div className="fantasy-card p-4">
                     <p className="fantasy-text leading-relaxed whitespace-pre-wrap">{selectedCampaign.quests}</p>
                   </div>
                 </div>
               )}

               {selectedCampaign.encounters && (
                 <div>
                   <h3 className="fantasy-title text-lg font-semibold mb-3">Encounters</h3>
                   <div className="fantasy-card p-4">
                     <p className="fantasy-text leading-relaxed whitespace-pre-wrap">{selectedCampaign.encounters}</p>
                   </div>
                 </div>
               )}

               {selectedCampaign.items && (
                 <div>
                   <h3 className="fantasy-title text-lg font-semibold mb-3">Items & Rewards</h3>
                   <div className="fantasy-card p-4">
                     <p className="fantasy-text leading-relaxed whitespace-pre-wrap">{selectedCampaign.items}</p>
                   </div>
                 </div>
               )}

               {selectedCampaign.notes && (
                 <div>
                   <h3 className="fantasy-title text-lg font-semibold mb-3">Notes</h3>
                   <div className="fantasy-card p-4">
                     <p className="fantasy-text leading-relaxed whitespace-pre-wrap">{selectedCampaign.notes}</p>
                   </div>
                 </div>
               )}
             </div>
            
                         <div className="flex gap-3 mt-6">
               <button
                 onClick={() => handleEdit(selectedCampaign)}
                 className="fantasy-button-accent flex-1 py-2.5 px-4 font-medium rounded-md hover:bg-yellow-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 active:scale-95"
                 aria-label={`Edit campaign: ${selectedCampaign.name}`}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault()
                     handleEdit(selectedCampaign)
                   }
                 }}
               >
                 Edit Campaign
               </button>
               <button
                 onClick={() => handleDownload(selectedCampaign)}
                 className="fantasy-button-secondary flex-1 py-2.5 px-4 font-medium rounded-md hover:bg-yellow-700 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 active:scale-95"
                 aria-label={`Download campaign: ${selectedCampaign.name}`}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' || e.key === ' ') {
                     e.preventDefault()
                     handleDownload(selectedCampaign)
                   }
                 }}
               >
                 Download
               </button>
             </div>
          </div>
                 </div>
       )}

       {/* Comprehensive Edit Campaign Modal */}
       {showEditModal && editCampaign && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style={{ overflow: 'hidden' }}>
           <div className="fantasy-card p-4 max-w-7xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-600 scrollbar-track-yellow-100" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
             <div className="flex justify-between items-start mb-4">
               <h2 className="fantasy-title text-xl font-semibold">
                 Edit Campaign: {editCampaign.name}
               </h2>
               <button
                 onClick={() => {
                   setShowEditModal(false)
                   setEditCampaign(null)
                 }}
                 className="fantasy-button-secondary p-2 rounded-md hover:bg-yellow-600 hover:text-white transition-all duration-200"
                 aria-label="Close modal"
               >
                 <X className="h-4 w-4" />
               </button>
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
               {/* Basic Campaign Info */}
               <div className="space-y-3">
                 <div>
                   <h3 className="fantasy-title text-md font-semibold mb-3">Basic Information</h3>
                   <div className="space-y-3">
                     <div>
                       <label className="block fantasy-text text-xs font-medium mb-1">Campaign Name *</label>
                       <input
                         type="text"
                         value={editCampaign.name}
                         onChange={(e) => setEditCampaign({...editCampaign, name: e.target.value})}
                         className="w-full fantasy-input fantasy-text text-sm"
                         required
                       />
                     </div>
                     
                     <div className="grid grid-cols-2 gap-2">
                       <div>
                         <label className="block fantasy-text text-xs font-medium mb-1">Theme *</label>
                         <select
                           value={editCampaign.theme}
                           onChange={(e) => setEditCampaign({...editCampaign, theme: e.target.value})}
                           className="w-full fantasy-input fantasy-text text-sm"
                           required
                         >
                           <option value="">Select theme</option>
                           {themes.map(theme => (
                             <option key={theme} value={theme}>{theme}</option>
                           ))}
                         </select>
                       </div>
                       <div>
                         <label className="block fantasy-text text-xs font-medium mb-1">Difficulty</label>
                         <select
                           value={editCampaign.difficulty}
                           onChange={(e) => setEditCampaign({...editCampaign, difficulty: e.target.value})}
                           className="w-full fantasy-input fantasy-text text-sm"
                         >
                           <option value="">Select difficulty</option>
                           <option value="Easy">Easy</option>
                           <option value="Medium">Medium</option>
                           <option value="Hard">Hard</option>
                           <option value="Very Hard">Very Hard</option>
                         </select>
                       </div>
                     </div>

                     <div className="grid grid-cols-2 gap-2">
                       <div>
                         <label className="block fantasy-text text-xs font-medium mb-1">Player Count</label>
                         <input
                           type="number"
                           value={editCampaign.playerCount}
                           onChange={(e) => setEditCampaign({...editCampaign, playerCount: parseInt(e.target.value) || 4})}
                           className="w-full fantasy-input fantasy-text text-sm"
                           min="1"
                           max="10"
                         />
                       </div>
                       <div>
                         <label className="block fantasy-text text-xs font-medium mb-1">Level Range</label>
                         <input
                           type="text"
                           value={editCampaign.levelRange}
                           onChange={(e) => setEditCampaign({...editCampaign, levelRange: e.target.value})}
                           placeholder="e.g., 1-10"
                           className="w-full fantasy-input fantasy-text text-sm"
                         />
                       </div>
                     </div>

                     <div>
                       <label className="block fantasy-text text-xs font-medium mb-1">Estimated Duration</label>
                       <input
                         type="text"
                         value={editCampaign.estimatedDuration}
                         onChange={(e) => setEditCampaign({...editCampaign, estimatedDuration: e.target.value})}
                         placeholder="e.g., 3-6 months"
                         className="w-full fantasy-input fantasy-text text-sm"
                       />
                     </div>

                     <div>
                       <label className="block fantasy-text text-xs font-medium mb-1">Setting</label>
                       <textarea
                         value={editCampaign.setting}
                         onChange={(e) => setEditCampaign({...editCampaign, setting: e.target.value})}
                         placeholder="Describe the campaign setting..."
                         rows={2}
                         className="w-full fantasy-input fantasy-text text-sm resize-none"
                       />
                     </div>

                     <div>
                       <label className="block fantasy-text text-xs font-medium mb-1">Description</label>
                       <textarea
                         value={editCampaign.description}
                         onChange={(e) => setEditCampaign({...editCampaign, description: e.target.value})}
                         placeholder="Describe the campaign..."
                         rows={3}
                         className="w-full fantasy-input fantasy-text text-sm resize-none"
                       />
                     </div>
                   </div>
                 </div>
               </div>

               {/* Campaign Content - Left Column */}
               <div className="space-y-3">
                 <div>
                   <h3 className="fantasy-title text-md font-semibold mb-3">Story Elements</h3>
                   
                   {/* Integrated Generation Buttons */}
                   <div className="mb-3 p-3 fantasy-card bg-yellow-50 border border-yellow-200 rounded-lg">
                     <h4 className="fantasy-title text-sm font-semibold mb-2 text-yellow-800">Quick Generation</h4>
                     <div className="grid grid-cols-1 gap-2">
                       <button
                         onClick={() => generateIntegratedContent(['mainPlot', 'subPlots', 'majorNPCs'])}
                         disabled={isGenerating || tokenBalance < 3}
                         className="fantasy-button-secondary text-xs px-2 py-1 hover:bg-yellow-600 hover:text-white transition-all duration-200 disabled:opacity-50"
                       >
                         {isGenerating ? 'Generating...' : 'Story & NPCs (3 tokens)'}
                       </button>
                       <button
                         onClick={() => generateIntegratedContent(['mainPlot', 'subPlots', 'majorNPCs', 'locations', 'quests', 'encounters', 'items'])}
                         disabled={isGenerating || tokenBalance < 7}
                         className="fantasy-button-secondary text-xs px-2 py-1 hover:bg-yellow-600 hover:text-white transition-all duration-200 disabled:opacity-50"
                       >
                         {isGenerating ? 'Generating...' : 'Complete Campaign (7 tokens)'}
                       </button>
                     </div>
                   </div>
                   
                   <div className="space-y-3">
                     {/* Main Plot */}
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block fantasy-text text-xs font-medium">Main Plot</label>
                         <button
                           onClick={() => generateCampaignContent('mainPlot', editCampaign.id)}
                           disabled={isGenerating || tokenBalance < 1}
                           className="fantasy-button-secondary text-xs px-2 py-1 hover:bg-yellow-600 hover:text-white transition-all duration-200 disabled:opacity-50"
                         >
                           {isGenerating ? 'Gen...' : 'Gen (1)'}
                         </button>
                       </div>
                       <textarea
                         value={editCampaign.mainPlot}
                         onChange={(e) => setEditCampaign({...editCampaign, mainPlot: e.target.value})}
                         placeholder="Describe the main plot..."
                         rows={3}
                         className="w-full fantasy-input fantasy-text text-sm resize-none"
                       />
                     </div>

                     {/* Sub Plots */}
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block fantasy-text text-xs font-medium">Sub Plots</label>
                         <button
                           onClick={() => generateCampaignContent('subPlots', editCampaign.id)}
                           disabled={isGenerating || tokenBalance < 1}
                           className="fantasy-button-secondary text-xs px-2 py-1 hover:bg-yellow-600 hover:text-white transition-all duration-200 disabled:opacity-50"
                         >
                           {isGenerating ? 'Gen...' : 'Gen (1)'}
                         </button>
                       </div>
                       <textarea
                         value={editCampaign.subPlots}
                         onChange={(e) => setEditCampaign({...editCampaign, subPlots: e.target.value})}
                         placeholder="Describe sub-plots..."
                         rows={3}
                         className="w-full fantasy-input fantasy-text text-sm resize-none"
                       />
                     </div>

                     {/* Major NPCs */}
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block fantasy-text text-xs font-medium">Major NPCs</label>
                         <button
                           onClick={() => generateCampaignContent('majorNPCs', editCampaign.id)}
                           disabled={isGenerating || tokenBalance < 1}
                           className="fantasy-button-secondary text-xs px-2 py-1 hover:bg-yellow-600 hover:text-white transition-all duration-200 disabled:opacity-50"
                         >
                           {isGenerating ? 'Gen...' : 'Gen (1)'}
                         </button>
                       </div>
                       <textarea
                         value={editCampaign.majorNPCs}
                         onChange={(e) => setEditCampaign({...editCampaign, majorNPCs: e.target.value})}
                         placeholder="Describe major NPCs..."
                         rows={3}
                         className="w-full fantasy-input fantasy-text text-sm resize-none"
                       />
                     </div>
                   </div>
                 </div>
               </div>

               {/* Campaign Content - Right Column */}
               <div className="space-y-3">
                 <div>
                   <h3 className="fantasy-title text-md font-semibold mb-3">World & Content</h3>
                   
                   <div className="space-y-3">
                     {/* Locations */}
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block fantasy-text text-xs font-medium">Locations</label>
                         <button
                           onClick={() => generateCampaignContent('locations', editCampaign.id)}
                           disabled={isGenerating || tokenBalance < 1}
                           className="fantasy-button-secondary text-xs px-2 py-1 hover:bg-yellow-600 hover:text-white transition-all duration-200 disabled:opacity-50"
                         >
                           {isGenerating ? 'Gen...' : 'Gen (1)'}
                         </button>
                       </div>
                       <textarea
                         value={editCampaign.locations}
                         onChange={(e) => setEditCampaign({...editCampaign, locations: e.target.value})}
                         placeholder="Describe key locations..."
                         rows={3}
                         className="w-full fantasy-input fantasy-text text-sm resize-none"
                       />
                     </div>

                     {/* Quests */}
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block fantasy-text text-xs font-medium">Quests</label>
                         <button
                           onClick={() => generateCampaignContent('quests', editCampaign.id)}
                           disabled={isGenerating || tokenBalance < 1}
                           className="fantasy-button-secondary text-xs px-2 py-1 hover:bg-yellow-600 hover:text-white transition-all duration-200 disabled:opacity-50"
                         >
                           {isGenerating ? 'Gen...' : 'Gen (1)'}
                         </button>
                       </div>
                       <textarea
                         value={editCampaign.quests}
                         onChange={(e) => setEditCampaign({...editCampaign, quests: e.target.value})}
                         placeholder="Describe quests..."
                         rows={3}
                         className="w-full fantasy-input fantasy-text text-sm resize-none"
                       />
                     </div>

                     {/* Encounters */}
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block fantasy-text text-xs font-medium">Encounters</label>
                         <button
                           onClick={() => generateCampaignContent('encounters', editCampaign.id)}
                           disabled={isGenerating || tokenBalance < 1}
                           className="fantasy-button-secondary text-xs px-2 py-1 hover:bg-yellow-600 hover:text-white transition-all duration-200 disabled:opacity-50"
                         >
                           {isGenerating ? 'Gen...' : 'Gen (1)'}
                         </button>
                       </div>
                       <textarea
                         value={editCampaign.encounters}
                         onChange={(e) => setEditCampaign({...editCampaign, encounters: e.target.value})}
                         placeholder="Describe encounters..."
                         rows={3}
                         className="w-full fantasy-input fantasy-text text-sm resize-none"
                       />
                     </div>

                     {/* Items & Rewards */}
                     <div>
                       <div className="flex justify-between items-center mb-1">
                         <label className="block fantasy-text text-xs font-medium">Items & Rewards</label>
                         <button
                           onClick={() => generateCampaignContent('items', editCampaign.id)}
                           disabled={isGenerating || tokenBalance < 1}
                           className="fantasy-button-secondary text-xs px-2 py-1 hover:bg-yellow-600 hover:text-white transition-all duration-200 disabled:opacity-50"
                         >
                           {isGenerating ? 'Gen...' : 'Gen (1)'}
                         </button>
                       </div>
                       <textarea
                         value={editCampaign.items}
                         onChange={(e) => setEditCampaign({...editCampaign, items: e.target.value})}
                         placeholder="Describe items and rewards..."
                         rows={3}
                         className="w-full fantasy-input fantasy-text text-sm resize-none"
                       />
                     </div>

                     {/* Notes */}
                     <div>
                       <label className="block fantasy-text text-xs font-medium mb-1">Notes</label>
                       <textarea
                         value={editCampaign.notes}
                         onChange={(e) => setEditCampaign({...editCampaign, notes: e.target.value})}
                         placeholder="Additional notes..."
                         rows={3}
                         className="w-full fantasy-input fantasy-text text-sm resize-none"
                       />
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             {/* Action Buttons */}
             <div className="flex gap-3 mt-6 pt-4 border-t border-yellow-700">
               <button
                 onClick={handleUpdateCampaign}
                 disabled={isCreating || !editCampaign.name || !editCampaign.theme}
                 className="fantasy-button-primary flex-1 py-2.5 px-4 font-medium rounded-md hover:bg-yellow-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 {isCreating ? 'Updating...' : 'Update Campaign'}
               </button>
               <button
                 onClick={() => {
                   setShowEditModal(false)
                   setEditCampaign(null)
                 }}
                 className="fantasy-button-secondary flex-1 py-2.5 px-4 font-medium rounded-md hover:bg-yellow-700 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 active:scale-95"
               >
                 Cancel
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   )
 } 
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Shield, Map, Sword, BookOpen, Target, Users, Download, Trash2, Eye, Scroll, X } from 'lucide-react'

import { parseArrayField } from '@/lib/utils'

interface SavedCharacter {
  id: string
  name: string
  race: string
  class: string
  level: number
  background: string
  autoSave: boolean
  expiresAt?: string
  createdAt: string
  type?: string
  portrait?: string
  alignment?: string
  backstory?: string
  personalityTraits?: string
  quote?: string
}

interface SavedWorld {
  id: string
  name: string
  theme: string
  landName: string
  autoSave: boolean
  expiresAt?: string
  createdAt: string
  type?: string
  description?: string
  lore?: string
}

interface SavedItem {
  id: string
  name: string
  itemType: string
  rarity: string
  autoSave: boolean
  expiresAt?: string
  createdAt: string
  type?: string
  portrait?: string
  description?: string
}

interface SavedQuest {
  id: string
  title: string
  questType: string
  difficulty: string
  autoSave: boolean
  expiresAt?: string
  createdAt: string
  type?: string
  description?: string
  objectives?: string
  rewards?: string
}

interface SavedEncounter {
  id: string
  title: string
  encounterType: string
  difficulty: string
  autoSave: boolean
  expiresAt?: string
  createdAt: string
  type?: string
  name?: string
  enemies?: string
  environment?: string
  objectives?: string
  rewards?: string
}

interface SavedCampaign {
  id: string
  name: string
  theme: string
  difficulty: string
  playerCount: number
  autoSave: boolean
  expiresAt?: string
  createdAt: string
  type?: string
  description?: string
  setting?: string
  mainPlot?: string
}

interface SavedNPC {
  id: string
  name: string
  race: string
  role: string
  autoSave: boolean
  expiresAt?: string
  createdAt: string
  type?: string
  portrait?: string
  personality?: string
  appearance?: string
  backstory?: string
  quote?: string
}

type SavedItemUnion = SavedCharacter | SavedWorld | SavedItem | SavedQuest | SavedEncounter | SavedCampaign | SavedNPC

export default function Library() {
  const [characters, setCharacters] = useState<SavedCharacter[]>([])
  const [worlds, setWorlds] = useState<SavedWorld[]>([])
  const [items, setItems] = useState<SavedItem[]>([])
  const [quests, setQuests] = useState<SavedQuest[]>([])
  const [encounters, setEncounters] = useState<SavedEncounter[]>([])
  const [campaigns, setCampaigns] = useState<SavedCampaign[]>([])
  const [npcs, setNpcs] = useState<SavedNPC[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('characters')
  const [selectedItem, setSelectedItem] = useState<SavedItemUnion | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'type'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterType, setFilterType] = useState<'all' | 'permanent' | 'temporary'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  useEffect(() => {
    loadLibraryContent()
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        const searchInput = document.querySelector('input[placeholder="Search by name, type, or description..."]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      }
      if (e.key === 'Escape') {
        setShowViewModal(false)
        setSelectedItem(null)
        setSelectedItems(new Set())
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Set loading when search changes
  useEffect(() => {
    if (searchQuery) {
      setSearchLoading(true)
    }
  }, [searchQuery])

  const loadLibraryContent = async () => {
    try {
      setLoading(true)

      
      // Load characters
      const charactersResponse = await fetch('/api/characters')
      console.log('🔍 Characters response:', charactersResponse.status, charactersResponse.ok)
      if (charactersResponse.ok) {
        const charactersData = await charactersResponse.json()
        console.log('🔍 Characters data:', charactersData)
        setCharacters(charactersData.characters || [])
      } else {
        const errorData = await charactersResponse.text()
        console.error('🔍 Characters error:', errorData)
        if (charactersResponse.status === 401) {
          console.error('🔍 Authentication failed for characters API')
        } else if (charactersResponse.status === 500) {
          console.error('🔍 Server error for characters API')
        }
      }

      // Load worlds
      const worldsResponse = await fetch('/api/worlds')
      console.log('🔍 Worlds response:', worldsResponse.status, worldsResponse.ok)
      if (worldsResponse.ok) {
        const worldsData = await worldsResponse.json()
        console.log('🔍 Worlds data:', worldsData)
        setWorlds(worldsData.worlds || [])
      } else {
        const errorData = await worldsResponse.text()
        console.error('🔍 Worlds error:', errorData)
        if (worldsResponse.status === 401) {
          console.error('🔍 Authentication failed for worlds API')
        } else if (worldsResponse.status === 500) {
          console.error('🔍 Server error for worlds API')
        }
      }

      // Load items
      const itemsResponse = await fetch('/api/items')
      console.log('🔍 Items response:', itemsResponse.status, itemsResponse.ok)
      if (itemsResponse.ok) {
        const itemsData = await itemsResponse.json()
        console.log('🔍 Items data:', itemsData)
        setItems(itemsData.items || [])
      } else {
        const errorData = await itemsResponse.text()
        console.error('🔍 Items error:', errorData)
        if (itemsResponse.status === 401) {
          console.error('🔍 Authentication failed for items API')
        } else if (itemsResponse.status === 500) {
          console.error('🔍 Server error for items API')
        }
      }

      // Load quests
      const questsResponse = await fetch('/api/quests')
      console.log('🔍 Quests response:', questsResponse.status, questsResponse.ok)
      if (questsResponse.ok) {
        const questsData = await questsResponse.json()
        console.log('🔍 Quests data:', questsData)
        setQuests(questsData.quests || [])
      } else {
        const errorData = await questsResponse.text()
        console.error('🔍 Quests error:', errorData)
        if (questsResponse.status === 401) {
          console.error('🔍 Authentication failed for quests API')
        } else if (questsResponse.status === 500) {
          console.error('🔍 Server error for quests API')
        }
      }

      // Load encounters
      const encountersResponse = await fetch('/api/encounters')
      console.log('🔍 Encounters response:', encountersResponse.status, encountersResponse.ok)
      if (encountersResponse.ok) {
        const encountersData = await encountersResponse.json()
        console.log('🔍 Encounters data:', encountersData)
        setEncounters(encountersData.encounters || [])
      } else {
        const errorData = await encountersResponse.text()
        console.error('🔍 Encounters error:', errorData)
        if (encountersResponse.status === 401) {
          console.error('🔍 Authentication failed for encounters API')
        } else if (encountersResponse.status === 500) {
          console.error('🔍 Server error for encounters API')
        }
      }

      // Load NPCs
      const npcsResponse = await fetch('/api/npcs')
      console.log('🔍 NPCs response:', npcsResponse.status, npcsResponse.ok)
      if (npcsResponse.ok) {
        const npcsData = await npcsResponse.json()
        console.log('🔍 NPCs data:', npcsData)
        setNpcs(npcsData.npcs || [])
      } else {
        const errorData = await npcsResponse.text()
        console.error('🔍 NPCs error:', errorData)
        if (npcsResponse.status === 401) {
          console.error('🔍 Authentication failed for npcs API')
        } else if (npcsResponse.status === 500) {
          console.error('🔍 Server error for npcs API')
        }
      }

      // Load campaigns
      const campaignsResponse = await fetch('/api/campaigns')
      console.log('🔍 Campaigns response:', campaignsResponse.status, campaignsResponse.ok)
      if (campaignsResponse.ok) {
        const campaignsData = await campaignsResponse.json()
        console.log('🔍 Campaigns data:', campaignsData)
        setCampaigns(campaignsData.campaigns || [])
      } else {
        const errorData = await campaignsResponse.text()
        console.error('🔍 Campaigns error:', errorData)
        if (campaignsResponse.status === 401) {
          console.error('🔍 Authentication failed for campaigns API')
        } else if (campaignsResponse.status === 500) {
          console.error('🔍 Server error for campaigns API')
        }
      }
    } catch (error) {
      console.error('Failed to load library content:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (type: string, id: string) => {
    try {
      const response = await fetch(`/api/${type}/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Reload the content
        loadLibraryContent()
      }
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error)
    }
  }

  const downloadItem = async (type: string, id: string) => {
    try {
      const response = await fetch(`/api/${type}/${id}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${type}-${id}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error(`Failed to download ${type}:`, error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const viewItem = async (type: string, id: string) => {
    try {
      const response = await fetch(`/api/${type}/${id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedItem({ ...data, type })
        setShowViewModal(true)
      }
    } catch (error) {
      console.error(`Failed to fetch ${type}:`, error)
    }
  }

  const convertToPermanent = async (type: string, id: string) => {
    try {
      const response = await fetch(`/api/content/convert-to-permanent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, id }),
      })

      if (response.ok) {
        alert('Content converted to permanent successfully!')
        loadLibraryContent() // Reload the content
      } else {
        const errorData = await response.json()
        alert(`Error converting content: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error converting to permanent:', error)
      alert('Failed to convert content to permanent')
    }
  }

  const getDaysUntilExpiry = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt)
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Utility functions for filtering and sorting
  const filterContent = (content: SavedItemUnion[]) => {
    let filtered = content

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        ('name' in item && item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        ('title' in item && item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filter by type (permanent vs temporary)
    if (filterType === 'permanent') {
      filtered = filtered.filter(item => !item.autoSave)
    } else if (filterType === 'temporary') {
      filtered = filtered.filter(item => item.autoSave)
    }

    return filtered
  }

  const sortContent = (content: SavedItemUnion[]) => {
    return [...content].sort((a, b) => {
      let aValue: string | number | Date
      let bValue: string | number | Date

      switch (sortBy) {
        case 'name':
          aValue = 'name' in a ? a.name : 'title' in a ? a.title : ''
          bValue = 'name' in b ? b.name : 'title' in b ? b.title : ''
          break
        case 'createdAt':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        case 'type':
          aValue = 'class' in a ? (a.class || '') : 'itemType' in a ? (a.itemType || '') : 'questType' in a ? (a.questType || '') : 'encounterType' in a ? (a.encounterType || '') : 'role' in a ? (a.role || '') : ''
          bValue = 'class' in b ? (b.class || '') : 'itemType' in b ? (b.itemType || '') : 'questType' in b ? (b.questType || '') : 'encounterType' in b ? (b.encounterType || '') : 'role' in b ? (b.role || '') : ''
          break
        default:
          return 0
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }

  const getCurrentContent = () => {
    let content: SavedItemUnion[] = []
    
    switch (activeTab) {
      case 'characters':
        content = characters
        break
      case 'worlds':
        content = worlds
        break
      case 'items':
        content = items
        break
      case 'quests':
        content = quests
        break
      case 'encounters':
        content = encounters
        break
      case 'campaigns':
        content = campaigns
        break
      case 'npcs':
        content = npcs
        break
      default:
        content = []
    }

    const filtered = filterContent(content)
    return sortContent(filtered)
  }

    // Enhanced render functions for different view modes
  const renderContentCard = (item: SavedItemUnion) => {
    const isTemporary = item.autoSave
    const itemName = 'name' in item ? item.name : 'title' in item ? item.title : 'Unknown'
    const itemType = 'class' in item ? `${item.level} ${item.race} ${item.class}` :
                    'itemType' in item ? item.itemType :
                    'questType' in item ? item.questType :
                    'encounterType' in item ? item.encounterType :
                    'role' in item ? item.role : ''
    
    const getItemIcon = () => {
      if ('class' in item) return Shield
      if ('itemType' in item) return Sword
      if ('questType' in item) return BookOpen
      if ('encounterType' in item) return Target
      if ('role' in item) return Users
      if ('playerCount' in item) return Scroll
      if ('landName' in item) return Map
      return BookOpen
    }
    
    const getItemColor = () => {
      if ('class' in item) return 'from-blue-500 to-blue-600'
      if ('itemType' in item) return 'from-yellow-500 to-yellow-600'
      if ('questType' in item) return 'from-red-500 to-red-600'
      if ('encounterType' in item) return 'from-orange-500 to-orange-600'
      if ('role' in item) return 'from-green-500 to-green-600'
      if ('playerCount' in item) return 'from-purple-500 to-purple-600'
      if ('landName' in item) return 'from-indigo-500 to-indigo-600'
      return 'from-gray-500 to-gray-600'
    }

    const ItemIcon = getItemIcon()

    return (
      <div key={item.id} className={`group relative fantasy-card overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
        isTemporary 
          ? 'border-2 border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100' 
          : 'border-2 border-yellow-700 bg-gradient-to-br from-yellow-100 to-orange-100 hover:from-yellow-200 hover:to-orange-200'
      }`}>
        {/* Enhanced Header with icon and status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-r ${getItemColor()} text-white shadow-lg group-hover:shadow-xl transition-all duration-300`}>
              <ItemIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="fantasy-title text-xl font-bold text-gray-800 truncate group-hover:text-yellow-800 transition-colors duration-300">
                {itemName}
              </h3>
              <p className="fantasy-text text-sm text-gray-600 font-medium mt-1">{itemType}</p>
            </div>
          </div>
          
          {/* Enhanced Status badge */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all duration-300 ${
            isTemporary 
              ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-yellow-200' 
              : 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-green-200'
          }`}>
            {isTemporary ? '⏰ Temp' : '🛡️ Perm'}
          </div>
        </div>

        {/* Enhanced Content preview */}
        <div className="mb-4">
          {('background' in item && item.background) && (
            <p className="fantasy-text text-sm text-gray-700 line-clamp-2 mb-2 leading-relaxed">
              {item.background}
            </p>
          )}
          {('description' in item && item.description) && (
            <p className="fantasy-text text-sm text-gray-700 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Enhanced Footer with metadata and actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-full">
              <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(item.createdAt)}
            </span>
            
            {isTemporary && item.expiresAt && (
              <span className="flex items-center gap-1.5 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {getDaysUntilExpiry(item.expiresAt)}d
              </span>
            )}
          </div>

          {/* Enhanced Action buttons with better UX */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
            {/* View Button */}
            <button
              onClick={() => viewItem(getItemType(item), item.id)}
              className="group/btn relative p-2.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="View Details"
            >
              <Eye className="h-5 w-5" />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                View Details
              </span>
            </button>

            {/* Download Button */}
            <button
              onClick={() => downloadItem(getItemType(item), item.id)}
              className="group/btn relative p-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="Download PDF"
            >
              <Download className="h-5 w-5" />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Download PDF
              </span>
            </button>

            {/* Convert to Permanent Button (Temporary items only) */}
            {isTemporary && (
              <button
                onClick={() => convertToPermanent(getItemType(item), item.id)}
                className="group/btn relative p-2.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
                title="Convert to Permanent"
              >
                <Shield className="h-5 w-5" />
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  Make Permanent
                </span>
              </button>
            )}

            {/* Delete Button */}
            <button
              onClick={() => deleteItem(getItemType(item), item.id)}
              className="group/btn relative p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="Delete"
            >
              <Trash2 className="h-5 w-5" />
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Delete Item
              </span>
            </button>
          </div>
        </div>

        {/* Enhanced Hover overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        {/* Quick action indicator */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="px-2 py-1 bg-black/70 text-white text-xs rounded-full backdrop-blur-sm">
            Quick Actions
          </div>
        </div>

        {/* Enhanced hover state indicator */}
        <div className="absolute inset-0 border-2 border-yellow-400/0 group-hover:border-yellow-400/30 transition-all duration-500 rounded-lg pointer-events-none" />
        
        {/* Floating action hint */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
          <div className="px-3 py-1.5 bg-yellow-500 text-white text-xs font-medium rounded-full shadow-lg">
            Hover for actions
          </div>
        </div>
      </div>
    )
  }

  const renderContentRow = (item: SavedItemUnion) => {
    const isTemporary = item.autoSave
    const itemName = 'name' in item ? item.name : 'title' in item ? item.title : 'Unknown'
    const itemType = 'class' in item ? `${item.level} ${item.race} ${item.class}` :
                    'itemType' in item ? item.itemType :
                    'questType' in item ? item.questType :
                    'encounterType' in item ? item.encounterType :
                    'role' in item ? item.role : ''
    
    const getItemIcon = () => {
      if ('class' in item) return Shield
      if ('itemType' in item) return Sword
      if ('questType' in item) return BookOpen
      if ('encounterType' in item) return Target
      if ('role' in item) return Users
      if ('playerCount' in item) return Scroll
      if ('landName' in item) return Map
      return BookOpen
    }
    
    const getItemColor = () => {
      if ('class' in item) return 'from-blue-500 to-blue-600'
      if ('itemType' in item) return 'from-yellow-500 to-yellow-600'
      if ('questType' in item) return 'from-red-500 to-red-600'
      if ('encounterType' in item) return 'from-orange-500 to-orange-600'
      if ('role' in item) return 'from-green-500 to-green-600'
      if ('playerCount' in item) return 'from-purple-500 to-purple-600'
      if ('landName' in item) return 'from-indigo-500 to-indigo-600'
      return 'from-gray-500 to-gray-600'
    }

    const ItemIcon = getItemIcon()

    return (
      <div key={item.id} className={`group fantasy-card p-6 border-l-4 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${
        isTemporary 
          ? 'border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100' 
          : 'border-l-yellow-700 bg-gradient-to-r from-yellow-100 to-orange-100 hover:from-yellow-200 hover:to-orange-200'
      }`}>
        <div className="flex items-center gap-6">
          {/* Enhanced Icon and main content */}
          <div className="flex items-center gap-5 flex-1 min-w-0">
            <div className={`p-4 rounded-2xl bg-gradient-to-r ${getItemColor()} text-white shadow-lg group-hover:shadow-xl transition-all duration-300 flex-shrink-0`}>
              <ItemIcon className="h-7 w-7" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-3">
                <h3 className="fantasy-title text-2xl font-bold text-gray-800 truncate group-hover:text-yellow-800 transition-colors duration-300">
                  {itemName}
                </h3>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm transition-all duration-300 ${
                  isTemporary 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-yellow-200' 
                    : 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-green-200'
                }`}>
                  {isTemporary ? '⏰ Temporary' : '🛡️ Permanent'}
                </span>
              </div>
              
              <p className="fantasy-text text-base text-gray-600 font-medium mb-3">{itemType}</p>
              
              {/* Enhanced Content preview */}
              {('background' in item && item.background) && (
                <p className="fantasy-text text-sm text-gray-700 line-clamp-2 mb-3 leading-relaxed">
                  {item.background}
                </p>
              )}
              {('description' in item && item.description) && (
                <p className="fantasy-text text-sm text-gray-700 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              )}
              
              {/* Enhanced Metadata */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-3">
                <span className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Created: {formatDate(item.createdAt)}
                </span>
                
                {isTemporary && item.expiresAt && (
                  <span className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Expires in {getDaysUntilExpiry(item.expiresAt)} days
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Enhanced Action buttons with better UX */}
          <div className="flex gap-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
            {/* View Button */}
            <button
              onClick={() => viewItem(getItemType(item), item.id)}
              className="group/btn relative p-3 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="View Details"
            >
              <Eye className="h-6 w-6" />
              <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                View Details
              </span>
            </button>

            {/* Download Button */}
            <button
              onClick={() => downloadItem(getItemType(item), item.id)}
              className="group/btn relative p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="Download PDF"
            >
              <Download className="h-6 w-6" />
              <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Download PDF
              </span>
            </button>

            {/* Convert to Permanent Button (Temporary items only) */}
            {isTemporary && (
              <button
                onClick={() => convertToPermanent(getItemType(item), item.id)}
                className="group/btn relative p-3 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
                title="Convert to Permanent"
              >
                <Shield className="h-6 w-6" />
                <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  Make Permanent
                </span>
              </button>
            )}

            {/* Delete Button */}
            <button
              onClick={() => deleteItem(getItemType(item), item.id)}
              className="group/btn relative p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="Delete"
            >
              <Trash2 className="h-6 w-6" />
              <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/btn:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                Delete Item
              </span>
            </button>
          </div>
        </div>

        {/* Quick action indicator */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="px-3 py-1.5 bg-black/70 text-white text-sm rounded-full backdrop-blur-sm">
            Quick Actions
          </div>
        </div>

        {/* Enhanced hover state indicator */}
        <div className="absolute inset-0 border-l-4 border-yellow-400/0 group-hover:border-yellow-400/50 transition-all duration-500 pointer-events-none" />
        
        {/* Floating action hint */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
          <div className="px-3 py-1.5 bg-yellow-500 text-white text-xs font-medium rounded-full shadow-lg">
            Hover for actions
          </div>
        </div>
      </div>
    )
  }

  const getItemType = (item: SavedItemUnion): string => {
    if ('class' in item) return 'characters'
    if ('itemType' in item) return 'items'
    if ('questType' in item) return 'quests'
    if ('encounterType' in item) return 'encounters'
    if ('role' in item) return 'npcs'
    if ('playerCount' in item) return 'campaigns'
    if ('landName' in item) return 'worlds'
    return 'unknown'
  }

  const tabs = [
    { id: 'characters', name: 'Characters', icon: Shield, count: characters.length },
    { id: 'worlds', name: 'Worlds', icon: Map, count: worlds.length },
    { id: 'items', name: 'Items', icon: Sword, count: items.length },
    { id: 'npcs', name: 'NPCs', icon: Users, count: npcs.length },
    { id: 'quests', name: 'Quests', icon: BookOpen, count: quests.length },
    { id: 'encounters', name: 'Encounters', icon: Target, count: encounters.length },
    { id: 'campaigns', name: 'Campaigns', icon: Scroll, count: campaigns.length },
  ]

  if (loading) {
    return (
      <div className="min-h-screen fantasy-main flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-700 mb-4"></div>
          <div className="fantasy-title text-xl">Loading Library...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen fantasy-main">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="fantasy-title text-4xl font-bold mb-4">Library</h1>
          <p className="fantasy-text text-lg">View and manage all your D&D content</p>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700">
                {characters.length + worlds.length + items.length + quests.length + encounters.length + campaigns.length + npcs.length} Total Items
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 rounded-full">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm font-medium text-yellow-700">
                {characters.filter(c => c.autoSave).length + worlds.filter(w => w.autoSave).length + items.filter(i => i.autoSave).length + quests.filter(q => q.autoSave).length + encounters.filter(e => e.autoSave).length + campaigns.filter(c => c.autoSave).length + npcs.filter(n => n.autoSave).length} Temporary
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-700">
                {characters.filter(c => !c.autoSave).length + worlds.filter(w => !w.autoSave).length + items.filter(i => !i.autoSave).length + quests.filter(q => !q.autoSave).length + encounters.filter(e => !e.autoSave).length + campaigns.filter(c => !c.autoSave).length + npcs.filter(n => !n.autoSave).length} Permanent
              </span>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'fantasy-button-primary'
                  : 'fantasy-button-secondary'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name} ({tab.count})
            </button>
          ))}
        </div>

        {/* Enhanced Fantasy-Themed Search and Filter Controls */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8 p-8 fantasy-card bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-300 shadow-lg">
          {/* Enhanced Search Section */}
          <div className="flex-1">
            <label className="block text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
              <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Content
            </label>
            <div className="relative group">
              <input
                type="text"
                placeholder="Search by name, type, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-16 py-4 border-2 border-amber-300 rounded-2xl focus:ring-4 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 text-lg bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:bg-white"
              />
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              {/* Enhanced Loading indicator or clear search button */}
              {searchLoading ? (
                <div className="absolute inset-y-0 right-0 pr-5 flex items-center">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-500 border-t-transparent"></div>
                  </div>
                </div>
              ) : searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 hover:text-red-700 transition-all duration-200"
                  title="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              ) : null}
              
              {/* Enhanced Keyboard shortcut hint */}
              {!searchQuery && (
                <div className="absolute inset-y-0 right-0 pr-5 flex items-center">
                  <div className="hidden group-hover:block">
                    <div className="px-4 py-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white text-sm rounded-xl shadow-2xl border border-gray-600">
                      <kbd className="font-mono bg-gray-700 px-2 py-1 rounded">Ctrl</kbd> + <kbd className="font-mono bg-gray-700 px-2 py-1 rounded">F</kbd> to search
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Filters Section */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Content Type Filter */}
            <div className="group">
              <label className="block text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Content Type
              </label>
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'permanent' | 'temporary')}
                  className="appearance-none px-5 py-4 border-2 border-amber-300 rounded-2xl focus:ring-4 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:bg-white pr-12 cursor-pointer"
                >
                  <option value="all">✨ All Content</option>
                  <option value="permanent">🛡️ Permanent</option>
                  <option value="temporary">⏰ Temporary</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Sort By Filter */}
            <div className="group">
              <label className="block text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Sort By
              </label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'createdAt' | 'type')}
                  className="appearance-none px-5 py-4 border-2 border-amber-300 rounded-2xl focus:ring-4 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:bg-white pr-12 cursor-pointer"
                >
                  <option value="createdAt">📅 Date Created</option>
                  <option value="name">📝 Name</option>
                  <option value="type">🏷️ Type</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Order Toggle */}
            <div className="group">
              <label className="block text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Order
              </label>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-6 py-4 border-2 border-amber-300 rounded-2xl hover:bg-amber-50 focus:ring-4 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:bg-white min-w-[80px] group-hover:scale-105"
                title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
              >
                <span className="text-2xl font-bold text-amber-600 group-hover:text-amber-700 transition-colors">
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="group">
              <label className="block text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
                <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                View Mode
              </label>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-6 py-4 border-2 border-amber-300 rounded-2xl hover:bg-amber-50 focus:ring-4 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl hover:bg-white min-w-[80px] group-hover:scale-105"
                title={`Switch to ${viewMode === 'grid' ? 'List' : 'Grid'} View`}
              >
                <span className="text-2xl font-bold text-amber-600 group-hover:text-amber-700 transition-colors">
                  {viewMode === 'grid' ? '⊞' : '☰'}
                </span>
              </button>
            </div>
          </div>
        </div>
        {/* Enhanced Content Summary */}
        <div className="mb-6 p-6 fantasy-card bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50 border-2 border-yellow-400 shadow-lg">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  {(() => {
                    switch (activeTab) {
                      case 'characters': return <Shield className="h-5 w-5" />
                      case 'worlds': return <Map className="h-5 w-5" />
                      case 'items': return <Sword className="h-5 w-5" />
                      case 'quests': return <BookOpen className="h-5 w-5" />
                      case 'encounters': return <Target className="h-5 w-5" />
                      case 'campaigns': return <Scroll className="h-5 w-5" />
                      case 'npcs': return <Users className="h-5 w-5" />
                      default: return <BookOpen className="h-5 w-5" />
                    }
                  })()}
                </div>
                <h3 className="fantasy-title text-2xl font-bold text-gray-800">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h3>
              </div>
              <p className="fantasy-text text-gray-600">
                Showing <span className="font-semibold text-yellow-700">{getCurrentContent().length}</span> of{' '}
                <span className="font-semibold text-gray-800">{(() => {
                  switch (activeTab) {
                    case 'characters': return characters.length
                    case 'worlds': return worlds.length
                    case 'items': return items.length
                    case 'quests': return quests.length
                    case 'encounters': return encounters.length
                    case 'campaigns': return campaigns.length
                    case 'npcs': return npcs.length
                    default: return 0
                  }
                })()}</span> items
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchQuery}
                  </span>
                )}
                {filterType !== 'all' && (
                  <span className="inline-flex items-center gap-1 ml-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                    </svg>
                    {filterType} only
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/70 rounded-lg border border-yellow-300">
                <span className="text-gray-600">Sorted by:</span>
                <span className="font-semibold text-yellow-700">
                  {sortBy === 'createdAt' ? 'Date Created' : sortBy === 'name' ? 'Name' : 'Type'}
                </span>
                <span className="text-yellow-600 text-lg font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="fantasy-card p-6">
          {activeTab === 'characters' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((character) => (
                <div key={character.id} className={`fantasy-card p-4 border-2 ${
                  character.autoSave 
                    ? 'border-yellow-600 bg-yellow-50/50' 
                    : 'border-yellow-700 bg-yellow-100/30'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="fantasy-title text-lg font-semibold">{character.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewItem('characters', character.id)}
                        className="p-1 text-green-600 hover:text-green-700 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadItem('characters', character.id)}
                        className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {character.autoSave && (
                        <button
                          onClick={() => convertToPermanent('character', character.id)}
                          className="p-1 text-purple-600 hover:text-purple-700 transition-colors"
                          title="Convert to Permanent"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteItem('characters', character.id)}
                        className="p-1 text-red-600 hover:text-red-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="fantasy-text text-sm mb-2">
                    Level {character.level} {character.race} {character.class}
                  </p>
                  <p className="fantasy-text text-xs text-gray-600">{character.background}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="fantasy-text text-xs text-gray-500">
                      Created: {formatDate(character.createdAt)}
                    </p>
                    {character.autoSave && character.expiresAt && (
                      <span className="fantasy-text text-xs text-yellow-600 font-medium">
                        Expires in {getDaysUntilExpiry(character.expiresAt)} days
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'worlds' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {worlds.map((world) => (
                <div key={world.id} className={`fantasy-card p-4 border-2 ${
                  world.autoSave 
                    ? 'border-yellow-600 bg-yellow-50/50' 
                    : 'border-yellow-700 bg-yellow-100/30'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="fantasy-title text-lg font-semibold">{world.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewItem('worlds', world.id)}
                        className="p-1 text-green-600 hover:text-green-700 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadItem('worlds', world.id)}
                        className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteItem('worlds', world.id)}
                        className="p-1 text-red-600 hover:text-red-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="fantasy-text text-sm mb-2">{world.theme}</p>
                  <p className="fantasy-text text-xs text-gray-600">{world.landName}</p>
                  <p className="fantasy-text text-xs text-gray-500 mt-2">
                    Created: {formatDate(world.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'items' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div key={item.id} className={`fantasy-card p-4 border-2 ${
                  item.autoSave 
                    ? 'border-yellow-600 bg-yellow-50/50' 
                    : 'border-yellow-700 bg-yellow-100/30'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="fantasy-title text-lg font-semibold">{item.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewItem('items', item.id)}
                        className="p-1 text-green-600 hover:text-green-700 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadItem('items', item.id)}
                        className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteItem('items', item.id)}
                        className="p-1 text-red-600 hover:text-red-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="fantasy-text text-sm mb-2">{item.itemType}</p>
                  <p className="fantasy-text text-xs text-gray-600">{item.rarity}</p>
                  <p className="fantasy-text text-xs text-gray-500 mt-2">
                    Created: {formatDate(item.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'npcs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {npcs.map((npc) => (
                <div key={npc.id} className={`fantasy-card p-4 border-2 ${
                  npc.autoSave 
                    ? 'border-yellow-600 bg-yellow-50/50' 
                    : 'border-yellow-700 bg-yellow-100/30'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="fantasy-title text-lg font-semibold">{npc.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewItem('npcs', npc.id)}
                        className="p-1 text-green-600 hover:text-green-700 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadItem('npcs', npc.id)}
                        className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteItem('npcs', npc.id)}
                        className="p-1 text-red-600 hover:text-red-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="fantasy-text text-sm mb-2">{npc.race}</p>
                  <p className="fantasy-text text-xs text-gray-600">{npc.role}</p>
                  <p className="fantasy-text text-xs text-gray-500 mt-2">
                    Created: {formatDate(npc.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'quests' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quests.map((quest) => (
                <div key={quest.id} className={`fantasy-card p-4 border-2 ${
                  quest.autoSave 
                    ? 'border-yellow-600 bg-yellow-50/50' 
                    : 'border-yellow-700 bg-yellow-100/30'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="fantasy-title text-lg font-semibold">{quest.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewItem('quests', quest.id)}
                        className="p-1 text-green-600 hover:text-green-700 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadItem('quests', quest.id)}
                        className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteItem('quests', quest.id)}
                        className="p-1 text-red-600 hover:text-red-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="fantasy-text text-sm mb-2">{quest.questType}</p>
                  <p className="fantasy-text text-xs text-gray-600">{quest.difficulty}</p>
                  <p className="fantasy-text text-xs text-gray-500 mt-2">
                    Created: {formatDate(quest.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'encounters' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {encounters.map((encounter) => (
                <div key={encounter.id} className={`fantasy-card p-4 border-2 ${
                  encounter.autoSave 
                    ? 'border-yellow-600 bg-yellow-50/50' 
                    : 'border-yellow-700 bg-yellow-100/30'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="fantasy-title text-lg font-semibold">{encounter.title}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewItem('encounters', encounter.id)}
                        className="p-1 text-green-600 hover:text-green-700 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadItem('encounters', encounter.id)}
                        className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteItem('encounters', encounter.id)}
                        className="p-1 text-red-600 hover:text-red-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="fantasy-text text-sm mb-2">{encounter.encounterType}</p>
                  <p className="fantasy-text text-xs text-gray-600">{encounter.difficulty}</p>
                  <p className="fantasy-text text-xs text-gray-500 mt-2">
                    Created: {formatDate(encounter.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className={`fantasy-card p-4 border-2 ${
                  campaign.autoSave 
                    ? 'border-yellow-600 bg-yellow-50/50' 
                    : 'border-yellow-700 bg-yellow-100/30'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="fantasy-title text-lg font-semibold">{campaign.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewItem('campaigns', campaign.id)}
                        className="p-1 text-green-600 hover:text-green-700 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadItem('campaigns', campaign.id)}
                        className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteItem('campaigns', campaign.id)}
                        className="p-1 text-red-600 hover:text-red-700 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="fantasy-text text-sm mb-2">{campaign.theme}</p>
                  <p className="fantasy-text text-xs text-gray-600">{campaign.difficulty} • {campaign.playerCount} players</p>
                  <p className="fantasy-text text-xs text-gray-500 mt-2">
                    Created: {formatDate(campaign.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {(() => {
            const contentMap = {
              characters,
              worlds,
              items,
              npcs,
              quests,
              encounters,
              campaigns
            }
            const currentItems = contentMap[activeTab as keyof typeof contentMap] || []
            
            if (currentItems.length === 0) {
              return (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Shield className="h-12 w-12 mx-auto mb-4" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No content yet</h3>
                  <p className="text-gray-400">
                    Generate some content and save it to see it here!
                  </p>
                </div>
              )
            }
            return null
          })()}
        </div>
      </div>

      {/* Enhanced View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="fantasy-card max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl border-2 border-yellow-500">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    {(() => {
                      if ('class' in selectedItem) return <Shield className="h-8 w-8" />
                      if ('itemType' in selectedItem) return <Sword className="h-8 w-8" />
                      if ('questType' in selectedItem) return <BookOpen className="h-8 w-8" />
                      if ('encounterType' in selectedItem) return <Target className="h-8 w-8" />
                      if ('role' in selectedItem) return <Users className="h-8 w-8" />
                      if ('playerCount' in selectedItem) return <Scroll className="h-8 w-8" />
                      if ('landName' in selectedItem) return <Map className="h-8 w-8" />
                      return <BookOpen className="h-8 w-8" />
                    })()}
                  </div>
                  <div>
                    <h2 className="fantasy-title text-3xl font-bold">
                      {'name' in selectedItem ? selectedItem.name : selectedItem.title}
                    </h2>
                    <p className="text-yellow-100 text-lg mt-1">
                      {(() => {
                        if ('class' in selectedItem) return `${selectedItem.level} ${selectedItem.race} ${selectedItem.class}`
                        if ('itemType' in selectedItem) return selectedItem.itemType
                        if ('questType' in selectedItem) return selectedItem.questType
                        if ('encounterType' in selectedItem) return selectedItem.encounterType
                        if ('role' in selectedItem) return `${selectedItem.race} ${selectedItem.role}`
                        if ('playerCount' in selectedItem) return `Campaign for ${selectedItem.playerCount} players`
                        if ('landName' in selectedItem) return `World: ${selectedItem.landName}`
                        return 'Content Details'
                      })()}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedItem(null)
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
                  title="Close"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">

              <div className="space-y-6">
                {'type' in selectedItem && selectedItem.type === 'characters' && (
                  <div className="space-y-6">
                    {/* Character Portrait */}
                    {'portrait' in selectedItem && selectedItem.portrait && (
                      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-xl border border-gray-600">
                        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                          <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Character Portrait
                        </h3>
                        <div className="flex justify-center">
                          <Image
                            src={selectedItem.portrait}
                            alt={`Portrait of ${selectedItem.name}`}
                            width={300}
                            height={300}
                            className="rounded-xl shadow-2xl border-2 border-yellow-500"
                            style={{ maxHeight: '300px', objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Basic Info Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                        <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
                          <Shield className="h-5 w-5 text-blue-600" />
                          Basic Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-blue-200">
                            <span className="text-blue-700 font-medium">Name:</span>
                            <span className="text-blue-900 font-semibold">{('name' in selectedItem ? selectedItem.name : selectedItem.title)}</span>
                          </div>
                          {'race' in selectedItem && (
                            <div className="flex justify-between items-center py-2 border-b border-blue-200">
                              <span className="text-blue-700 font-medium">Race:</span>
                              <span className="text-blue-900 font-semibold">{selectedItem.race}</span>
                            </div>
                          )}
                          {'class' in selectedItem && (
                            <div className="flex justify-between items-center py-2 border-b border-blue-200">
                              <span className="text-blue-700 font-medium">Class:</span>
                              <span className="text-blue-900 font-semibold">{selectedItem.class}</span>
                            </div>
                          )}
                          {'level' in selectedItem && (
                            <div className="flex justify-between items-center py-2 border-b border-blue-200">
                              <span className="text-blue-700 font-medium">Level:</span>
                              <span className="text-blue-900 font-semibold">{selectedItem.level}</span>
                            </div>
                          )}
                          {'alignment' in selectedItem && selectedItem.alignment && (
                            <div className="flex justify-between items-center py-2 border-b border-blue-200">
                              <span className="text-blue-700 font-medium">Alignment:</span>
                              <span className="text-blue-900 font-semibold">{selectedItem.alignment}</span>
                            </div>
                          )}
                          {'background' in selectedItem && (
                            <div className="flex justify-between items-center py-2 border-b border-blue-200">
                              <span className="text-blue-700 font-medium">Background:</span>
                              <span className="text-blue-900 font-semibold">{selectedItem.background}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Details Card */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                        <h3 className="text-xl font-semibold text-green-900 mb-4 flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-green-600" />
                          Character Details
                        </h3>
                        <div className="space-y-4">
                          {'backstory' in selectedItem && selectedItem.backstory && (
                            <div>
                              <p className="text-green-700 font-medium mb-2">Backstory:</p>
                              <p className="text-green-900 text-sm leading-relaxed bg-white/50 p-3 rounded-lg border border-green-200">
                                {selectedItem.backstory}
                              </p>
                            </div>
                          )}
                          {'personalityTraits' in selectedItem && selectedItem.personalityTraits && (
                            <div>
                              <p className="text-green-700 font-medium mb-2">Personality Traits:</p>
                              <div className="flex flex-wrap gap-2">
                                {parseArrayField(selectedItem.personalityTraits).map((trait, index) => (
                                  <span key={index} className="inline-block bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-300">
                                    {trait}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {'quote' in selectedItem && selectedItem.quote && (
                            <div>
                              <p className="text-green-700 font-medium mb-2">Quote:</p>
                              <p className="text-green-900 text-sm italic bg-white/50 p-3 rounded-lg border border-green-200">
                                &quot;{selectedItem.quote}&quot;
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {'type' in selectedItem && selectedItem.type === 'npcs' && (
                  <div className="space-y-4">
                                   {/* NPC Portrait */}
               {'portrait' in selectedItem && selectedItem.portrait && (
                 <div>
                   <h3 className="text-lg font-semibold text-white mb-3">NPC Portrait</h3>
                   <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                     <Image
                       src={selectedItem.portrait}
                       alt={`Portrait of ${selectedItem.name}`}
                       width={400}
                       height={400}
                       className="w-full h-auto rounded-lg shadow-lg"
                       style={{ maxHeight: '400px', objectFit: 'contain' }}
                     />
                   </div>
                 </div>
               )}

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">NPC Details</h3>
                      <div className="space-y-2">
                        <p><span className="text-gray-400">Name:</span> <span className="text-white">{('name' in selectedItem ? selectedItem.name : selectedItem.title)}</span></p>
                        {'race' in selectedItem && (
                          <p><span className="text-gray-400">Race:</span> <span className="text-white">{selectedItem.race}</span></p>
                        )}
                        {'role' in selectedItem && (
                          <p><span className="text-gray-400">Role:</span> <span className="text-white">{selectedItem.role}</span></p>
                        )}
                        {'personality' in selectedItem && selectedItem.personality && (
                          <div>
                            <p className="text-gray-400 mb-1">Personality:</p>
                            <p className="text-white text-sm">{selectedItem.personality}</p>
                          </div>
                        )}
                        {'appearance' in selectedItem && selectedItem.appearance && (
                          <div>
                            <p className="text-gray-400 mb-1">Appearance:</p>
                            <p className="text-white text-sm">{selectedItem.appearance}</p>
                          </div>
                        )}
                        {'backstory' in selectedItem && selectedItem.backstory && (
                          <div>
                            <p className="text-gray-400 mb-1">Backstory:</p>
                            <p className="text-white text-sm">{selectedItem.backstory}</p>
                          </div>
                        )}
                        {'quote' in selectedItem && selectedItem.quote && (
                          <div>
                            <p className="text-gray-400 mb-1">Quote:</p>
                            <p className="text-white text-sm italic">&quot;{selectedItem.quote}&quot;</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {'type' in selectedItem && selectedItem.type === 'worlds' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">World Details</h3>
                      <div className="space-y-2">
                        <p><span className="text-gray-400">Name:</span> <span className="text-white">{('name' in selectedItem ? selectedItem.name : selectedItem.title)}</span></p>
                        {'description' in selectedItem && selectedItem.description && (
                          <div>
                            <p className="text-gray-400 mb-1">Description:</p>
                            <p className="text-white text-sm">{selectedItem.description}</p>
                          </div>
                        )}
                        {'lore' in selectedItem && selectedItem.lore && (
                          <div>
                            <p className="text-gray-400 mb-1">Lore:</p>
                            <p className="text-white text-sm">{selectedItem.lore}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {'type' in selectedItem && selectedItem.type === 'items' && (
                  <div className="space-y-4">
                    {/* Item Portrait */}
                    {'portrait' in selectedItem && selectedItem.portrait && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Item Portrait</h3>
                        <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                          <Image 
                            src={selectedItem.portrait} 
                            alt={`Portrait of ${selectedItem.name}`}
                            width={400}
                            height={400}
                            className="w-full h-auto rounded-lg shadow-lg"
                            style={{ maxHeight: '400px', objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Item Details</h3>
                      <div className="space-y-2">
                        <p><span className="text-gray-400">Name:</span> <span className="text-white">{('name' in selectedItem ? selectedItem.name : selectedItem.title)}</span></p>
                        {'itemType' in selectedItem && (
                          <p><span className="text-gray-400">Type:</span> <span className="text-white">{selectedItem.itemType}</span></p>
                        )}
                        {'rarity' in selectedItem && selectedItem.rarity && (
                          <p><span className="text-gray-400">Rarity:</span> <span className="text-white">{selectedItem.rarity}</span></p>
                        )}
                        {'description' in selectedItem && selectedItem.description && (
                          <div>
                            <p className="text-gray-400 mb-1">Description:</p>
                            <p className="text-white text-sm">{selectedItem.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {'type' in selectedItem && selectedItem.type === 'quests' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Quest Details</h3>
                      <div className="space-y-2">
                        <p><span className="text-gray-400">Title:</span> <span className="text-white">{('title' in selectedItem ? selectedItem.title : selectedItem.name)}</span></p>
                        {'questType' in selectedItem && selectedItem.questType && (
                          <p><span className="text-gray-400">Type:</span> <span className="text-white">{selectedItem.questType}</span></p>
                        )}
                        {'difficulty' in selectedItem && selectedItem.difficulty && (
                          <p><span className="text-gray-400">Difficulty:</span> <span className="text-white">{selectedItem.difficulty}</span></p>
                        )}
                        {'description' in selectedItem && selectedItem.description && (
                          <div>
                            <p className="text-gray-400 mb-1">Description:</p>
                            <p className="text-white text-sm">{selectedItem.description}</p>
                          </div>
                        )}
                        {'objectives' in selectedItem && selectedItem.objectives && (
                          <div>
                            <p className="text-gray-400 mb-1">Objectives:</p>
                            <p className="text-white text-sm">{selectedItem.objectives}</p>
                          </div>
                        )}
                        {'rewards' in selectedItem && selectedItem.rewards && (
                          <div>
                            <p className="text-gray-400 mb-1">Rewards:</p>
                            <p className="text-white text-sm">{selectedItem.rewards}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {'type' in selectedItem && selectedItem.type === 'encounters' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Encounter Details</h3>
                      <div className="space-y-2">
                        <p><span className="text-gray-400">Name:</span> <span className="text-white">{('name' in selectedItem ? selectedItem.name : selectedItem.title)}</span></p>
                        {'difficulty' in selectedItem && selectedItem.difficulty && (
                          <p><span className="text-gray-400">Difficulty:</span> <span className="text-white">{selectedItem.difficulty}</span></p>
                        )}
                        {'enemies' in selectedItem && selectedItem.enemies && (
                          <div>
                            <p className="text-gray-400 mb-1">Enemies:</p>
                            <p className="text-white text-sm">{selectedItem.enemies}</p>
                          </div>
                        )}
                        {'environment' in selectedItem && selectedItem.environment && (
                          <div>
                            <p className="text-gray-400 mb-1">Environment:</p>
                            <p className="text-white text-sm">{selectedItem.environment}</p>
                          </div>
                        )}
                        {'objectives' in selectedItem && selectedItem.objectives && (
                          <div>
                            <p className="text-gray-400 mb-1">Objectives:</p>
                            <p className="text-white text-sm">{selectedItem.objectives}</p>
                          </div>
                        )}
                        {'rewards' in selectedItem && selectedItem.rewards && (
                          <div>
                            <p className="text-gray-400 mb-1">Rewards:</p>
                            <p className="text-white text-sm">{selectedItem.rewards}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {'type' in selectedItem && selectedItem.type === 'campaigns' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Campaign Details</h3>
                      <div className="space-y-2">
                        <p><span className="text-gray-400">Name:</span> <span className="text-white">{('name' in selectedItem ? selectedItem.name : selectedItem.title)}</span></p>
                        {'theme' in selectedItem && selectedItem.theme && (
                          <p><span className="text-gray-400">Theme:</span> <span className="text-white">{selectedItem.theme}</span></p>
                        )}
                        {'difficulty' in selectedItem && selectedItem.difficulty && (
                          <p><span className="text-gray-400">Difficulty:</span> <span className="text-white">{selectedItem.difficulty}</span></p>
                        )}
                        {'playerCount' in selectedItem && selectedItem.playerCount && (
                          <p><span className="text-gray-400">Player Count:</span> <span className="text-white">{selectedItem.playerCount}</span></p>
                        )}
                        {'description' in selectedItem && selectedItem.description && (
                          <div>
                            <p className="text-gray-400 mb-1">Description:</p>
                            <p className="text-white text-sm">{selectedItem.description}</p>
                          </div>
                        )}
                        {'setting' in selectedItem && selectedItem.setting && (
                          <div>
                            <p className="text-gray-400 mb-1">Setting:</p>
                            <p className="text-white text-sm">{selectedItem.setting}</p>
                          </div>
                        )}
                        {'mainPlot' in selectedItem && selectedItem.mainPlot && (
                          <div>
                            <p className="text-gray-400 mb-1">Main Plot:</p>
                            <p className="text-white text-sm">{selectedItem.mainPlot}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
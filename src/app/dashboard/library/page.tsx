'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Shield, Map, Sword, BookOpen, Target, Users, Download, Trash2, Eye, Scroll, X } from 'lucide-react'

import { parseArrayField } from '@/lib/utils'
import { formatArrayField, formatTextField } from '@/lib/content-formatter'
import { makeContentPermanent } from '@/lib/content-manager'
import { useNotifications } from '@/components/FantasyNotification'
import FantasyNotification from '@/components/FantasyNotification'

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
  const { notifications, showSuccess, showError, removeNotification } = useNotifications()
  const router = useRouter()
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
  const [modalTab, setModalTab] = useState<'details' | 'pdf'>('details')

  
  const [pdfUrl, setPdfUrl] = useState<string>('')
  const [pdfLoading, setPdfLoading] = useState<boolean>(false)
  const [pdfError, setPdfError] = useState<string>('')
  const [editMode, setEditMode] = useState<boolean>(false)
  const [editedItem, setEditedItem] = useState<any>(null)
  const [saving, setSaving] = useState<boolean>(false)
  const [saveOk, setSaveOk] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'type'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [filterType, setFilterType] = useState<'all' | 'permanent' | 'temporary'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Lock background scroll when modal open
  useEffect(() => {
    if (!isMounted) return
    if (showViewModal) {
      const original = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = original }
    }
  }, [showViewModal, isMounted])

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
      


      
      // Fetch all endpoints in parallel to reduce total wait time
      const requests: Promise<Response>[] = [
        fetch('/api/characters', { credentials: 'include' }),
        fetch('/api/worlds', { credentials: 'include' }),
        fetch('/api/items', { credentials: 'include' }),
        fetch('/api/quests', { credentials: 'include' }),
        fetch('/api/encounters', { credentials: 'include' }),
        fetch('/api/npcs', { credentials: 'include' }),
        fetch('/api/campaigns', { credentials: 'include' }),
      ]

      const [
        charactersResponse,
        worldsResponse,
        itemsResponse,
        questsResponse,
        encountersResponse,
        npcsResponse,
        campaignsResponse,
      ] = await Promise.all(requests)

      // Parse JSON in parallel for successful responses
      const jsonPromises = [
        charactersResponse.ok ? charactersResponse.json() : null,
        worldsResponse.ok ? worldsResponse.json() : null,
        itemsResponse.ok ? itemsResponse.json() : null,
        questsResponse.ok ? questsResponse.json() : null,
        encountersResponse.ok ? encountersResponse.json() : null,
        npcsResponse.ok ? npcsResponse.json() : null,
        campaignsResponse.ok ? campaignsResponse.json() : null,
      ].map(p => (p instanceof Promise ? p : Promise.resolve(null)))

      const [
        charactersData,
        worldsData,
        itemsData,
        questsData,
        encountersData,
        npcsData,
        campaignsData
      ] = await Promise.all(jsonPromises)

      const normalize = (x: any, type: string) => ({
        ...x,
        type,
        // Normalize snake_case fields from Supabase to camelCase used in UI
        autoSave: x.autoSave ?? x.auto_save ?? false,
        createdAt: x.createdAt ?? x.created_at ?? null,
        expiresAt: x.expiresAt ?? x.expires_at ?? null,
      })

      if (charactersData) setCharacters((charactersData.characters || []).map((c: any) => normalize(c, 'characters')))
      if (worldsData) setWorlds((worldsData.worlds || []).map((w: any) => normalize(w, 'worlds')))
      if (itemsData) setItems((itemsData.items || []).map((i: any) => normalize(i, 'items')))
      if (questsData) setQuests((questsData.quests || []).map((q: any) => normalize(q, 'quests')))
      if (encountersData) setEncounters((encountersData.encounters || []).map((e: any) => normalize(e, 'encounters')))
      if (npcsData) setNpcs((npcsData.npcs || []).map((n: any) => normalize(n, 'npcs')))
      if (campaignsData) setCampaigns((campaignsData.campaigns || []).map((c: any) => normalize(c, 'campaigns')))
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
        credentials: 'include'
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
      const response = await fetch(`/api/${type}/${id}/pdf`, {
        credentials: 'include'
      })
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—'
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString()
  }

  const viewItem = async (type: string, id: string) => {
    try {
      // Fallback to infer type if not provided
      let resolvedType = type
      if (!resolvedType || resolvedType === 'unknown') {
        resolvedType = (activeTab as string) || 'characters'
      }

      const response = await fetch(`/api/${resolvedType}/${id}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setSelectedItem({ ...data, type: resolvedType } as any)
        setEditedItem({ ...data, type: resolvedType } as any)
        setShowViewModal(true)
        setModalTab('details')
        setPdfUrl('')
        setPdfError('')
        setEditMode(false)
      }
    } catch (error) {
      console.error(`Failed to fetch ${type || 'unknown'}:`, error)
    }
  }

  const openPdfPreview = async () => {
    if (!selectedItem || !(selectedItem as any).id) return
    try {
      setPdfLoading(true)
      setPdfError('')
      const response = await fetch(`/api/${(selectedItem as any).type}/${(selectedItem as any).id}/pdf`, {
        credentials: 'include'
      })
      if (!response.ok) {
        const txt = await response.text()
        throw new Error(txt || 'PDF generation failed')
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (err: any) {
      setPdfError(err?.message || 'Failed to load PDF preview')
    } finally {
      setPdfLoading(false)
    }
  }

  const goToEdit = () => {
    if (!selectedItem || !(selectedItem as any).id) return
    const type = (selectedItem as any).type as string
    const id = (selectedItem as any).id as string
    let path = '/dashboard'
    switch (type) {
      case 'characters': path = '/dashboard/character-generator'; break
      case 'worlds': path = '/dashboard/world-lore-builder'; break
      case 'items': path = '/dashboard/item-generator'; break
      case 'quests': path = '/dashboard/quest-generator'; break
      case 'encounters': path = '/dashboard/encounter-creator'; break
      case 'npcs': path = '/dashboard/npc-generator'; break
      case 'campaigns': path = '/dashboard/campaigns'; break
      default: path = '/dashboard';
    }
    router.push(`${path}?edit=${encodeURIComponent(id)}`)
  }

  const exportPdf = () => {
    if (!selectedItem || !(selectedItem as any).id) return
    downloadItem((selectedItem as any).type, (selectedItem as any).id)
  }

  const exportJson = () => {
    if (!selectedItem) return
    const data = { ...selectedItem }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(selectedItem as any).type}-${(selectedItem as any).id || 'item'}.json`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const getFieldsForType = (item: any): Array<{ key: string; label: string; type?: 'text'|'number'|'textarea' }> => {
    if (!item) return []
    if (item.type === 'characters') {
      return [
        { key: 'name', label: 'Name' },
        { key: 'race', label: 'Race' },
        { key: 'class', label: 'Class' },
        { key: 'level', label: 'Level', type: 'number' },
        { key: 'alignment', label: 'Alignment' },
        { key: 'background', label: 'Background', type: 'textarea' },
        { key: 'backstory', label: 'Backstory', type: 'textarea' },
        { key: 'personalityTraits', label: 'Personality Traits', type: 'textarea' },
        { key: 'quote', label: 'Quote', type: 'textarea' },
      ]
    }
    if (item.type === 'items') {
      return [
        { key: 'name', label: 'Name' },
        { key: 'itemType', label: 'Type' },
        { key: 'rarity', label: 'Rarity' },
        { key: 'description', label: 'Description', type: 'textarea' },
      ]
    }
    if (item.type === 'npcs') {
      return [
        { key: 'name', label: 'Name' },
        { key: 'race', label: 'Race' },
        { key: 'role', label: 'Role' },
        { key: 'personality', label: 'Personality', type: 'textarea' },
        { key: 'appearance', label: 'Appearance', type: 'textarea' },
        { key: 'backstory', label: 'Backstory', type: 'textarea' },
        { key: 'quote', label: 'Quote', type: 'textarea' },
      ]
    }
    if (item.type === 'worlds') {
      return [
        { key: 'name', label: 'Name' },
        { key: 'landName', label: 'Land Name' },
        { key: 'theme', label: 'Theme' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'lore', label: 'Lore', type: 'textarea' },
      ]
    }
    if (item.type === 'quests') {
      return [
        { key: 'title', label: 'Title' },
        { key: 'questType', label: 'Type' },
        { key: 'difficulty', label: 'Difficulty' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'objectives', label: 'Objectives', type: 'textarea' },
        { key: 'rewards', label: 'Rewards', type: 'textarea' },
      ]
    }
    if (item.type === 'encounters') {
      return [
        { key: 'title', label: 'Title' },
        { key: 'encounterType', label: 'Type' },
        { key: 'difficulty', label: 'Difficulty' },
        { key: 'enemies', label: 'Enemies', type: 'textarea' },
        { key: 'environment', label: 'Environment', type: 'textarea' },
        { key: 'objectives', label: 'Objectives', type: 'textarea' },
        { key: 'rewards', label: 'Rewards', type: 'textarea' },
      ]
    }
    if (item.type === 'campaigns') {
      return [
        { key: 'name', label: 'Name' },
        { key: 'theme', label: 'Theme' },
        { key: 'difficulty', label: 'Difficulty' },
        { key: 'playerCount', label: 'Player Count', type: 'number' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'setting', label: 'Setting', type: 'textarea' },
        { key: 'mainPlot', label: 'Main Plot', type: 'textarea' },
      ]
    }
    return []
  }

  const saveEdits = async () => {
    if (!editedItem) return
    const type = editedItem.type as string
    const id = editedItem.id as string | undefined
    const endpoint = `/api/${type}/save`
    const payloadKey = type === 'characters' ? 'character' :
      type === 'items' ? 'item' :
      type === 'worlds' ? 'world' :
      type === 'npcs' ? 'npc' :
      type === 'quests' ? 'quest' :
      type === 'encounters' ? 'encounter' :
      type === 'campaigns' ? 'campaign' : 'data'
    try {
      setSaving(true)
      setSaveOk(false)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [payloadKey]: { id, ...editedItem } }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Save failed')
      }
      const data = await res.json()
      const saved = (data.character || data.item || data.world || data.npc || data.quest || data.encounter || data.campaign || editedItem)
      setSelectedItem({ ...saved, type })
      setEditedItem({ ...saved, type })
      setEditMode(false)
      setSaveOk(true)
      // refresh tiles so user sees the update immediately
      loadLibraryContent()
    } catch (e) {
      alert('Failed to save. Please try again.')
    }
    finally {
      setSaving(false)
      setTimeout(() => setSaveOk(false), 1500)
    }
  }

  const handleMakePermanent = async (item: any) => {
    try {
      setIsMounted(true)
      
      const response = await fetch('/api/content/convert-to-permanent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: item.id,
          type: item.type,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to make item permanent')
      }

      // Update the item in the correct state variable based on type
      const updateState = (prevItems: any[]) => 
        prevItems.map(contentItem => 
          contentItem.id === item.id 
            ? { ...contentItem, auto_save: false, expires_at: null }
            : contentItem
        )

      switch (item.type) {
        case 'character':
          setCharacters(updateState(characters))
          break
        case 'npc':
          setNpcs(updateState(npcs))
          break
        case 'world':
          setWorlds(updateState(worlds))
          break
        case 'item':
          setItems(updateState(items))
          break
        case 'quest':
          setQuests(updateState(quests))
          break
        case 'encounter':
          setEncounters(updateState(encounters))
          break
        case 'campaign':
          setCampaigns(updateState(campaigns))
          break
      }

      // Close the modal
      setSelectedItem(null)
      setViewMode('grid')
      
      // Show success message
      showSuccess('Item made permanent successfully!')
      
      // Refresh the library content to show updated data
      await loadLibraryContent()
    } catch (error) {
      console.error('Make permanent error:', error)
      showError('Failed to make item permanent. Please try again.')
    } finally {
      setIsMounted(false)
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

    // Filter by search query across common fields per type
    if (searchQuery) {
      const raw = searchQuery.toLowerCase().trim()
      const q = raw
        .replace(/\btemp(?:orary)?\b/g, '')
        .replace(/\bperm(?:anent)?\b/g, '')
        .trim()
      
      if (q) { // Only filter by content if there's a query after removing temp/perm keywords
        const includesQ = (val: unknown) => String(val ?? '').toLowerCase().includes(q)
        const includesAny = (arr: unknown) => {
          const values = parseArrayField(arr as unknown)
          return values.some(v => v.toLowerCase().includes(q))
        }

        filtered = filtered.filter(item => {
          // name/title always
          if ('name' in item && includesQ(item.name)) return true
          if ('title' in item && includesQ((item as any).title)) return true
          // type-ish identifiers
          if ('class' in item && (includesQ((item as any).class) || includesQ((item as any).race))) return true
          if ('itemType' in item && includesQ((item as any).itemType)) return true
          if ('questType' in item && includesQ((item as any).questType)) return true
          if ('encounterType' in item && includesQ((item as any).encounterType)) return true
          if ('role' in item && includesQ((item as any).role)) return true
          if ('theme' in item && includesQ((item as any).theme)) return true
          if ('landName' in item && includesQ((item as any).landName)) return true
          // descriptive fields
          if ('background' in item && includesQ((item as any).background)) return true
          if ('description' in item && includesQ((item as any).description)) return true
          if ('lore' in item && includesQ((item as any).lore)) return true
          if ('history' in item && includesQ((item as any).history)) return true
          if ('quote' in item && includesQ((item as any).quote)) return true
          if ('uniqueTrait' in item && includesQ((item as any).uniqueTrait)) return true
          // array-like fields
          if ('personalityTraits' in (item as any) && includesAny((item as any).personalityTraits)) return true
          if ('proficiencies' in (item as any) && includesAny((item as any).proficiencies)) return true
          if ('features' in (item as any) && includesAny((item as any).features)) return true
          if ('objectives' in (item as any) && includesAny((item as any).objectives)) return true
          if ('rewards' in (item as any) && includesAny((item as any).rewards)) return true
          if ('enemies' in (item as any) && includesAny((item as any).enemies)) return true
          if ('environment' in (item as any) && includesAny((item as any).environment)) return true
          if ('challenges' in (item as any) && includesAny((item as any).challenges)) return true
          if ('tactics' in (item as any) && includesAny((item as any).tactics)) return true
          if ('hazards' in (item as any) && includesAny((item as any).hazards)) return true
          if ('locations' in (item as any) && includesAny((item as any).locations)) return true
          if ('npcs' in (item as any) && includesAny((item as any).npcs)) return true
          if ('properties' in (item as any) && includesAny((item as any).properties)) return true
          if ('magicalEffects' in (item as any) && includesAny((item as any).magicalEffects)) return true
          if ('requirements' in (item as any) && includesAny((item as any).requirements)) return true
          if ('craftingMaterials' in (item as any) && includesAny((item as any).craftingMaterials)) return true
          if ('enchantments' in (item as any) && includesAny((item as any).enchantments)) return true
          if ('restrictions' in (item as any) && includesAny((item as any).restrictions)) return true
          if ('culture' in (item as any) && includesAny((item as any).culture)) return true
          if ('geography' in (item as any) && includesAny((item as any).geography)) return true
          if ('politics' in (item as any) && includesAny((item as any).politics)) return true
          if ('religion' in (item as any) && includesAny((item as any).religion)) return true
          if ('magic' in (item as any) && includesAny((item as any).magic)) return true
          if ('economy' in (item as any) && includesAny((item as any).economy)) return true
          if ('notableEvents' in (item as any) && includesAny((item as any).notableEvents)) return true
          if ('majorFactions' in (item as any) && includesAny((item as any).majorFactions)) return true
          if ('landmarks' in (item as any) && includesAny((item as any).landmarks)) return true
          if ('resources' in (item as any) && includesAny((item as any).resources)) return true
          if ('conflicts' in (item as any) && includesAny((item as any).conflicts)) return true
          if ('legends' in (item as any) && includesAny((item as any).legends)) return true
          // id fallback
          if ((item as any).id && includesQ((item as any).id)) return true
          return false
        })
      }

      // Respect explicit query keywords regardless of dropdown
      if (/\btemp(?:orary)?\b/i.test(raw)) {
        filtered = filtered.filter(item => item.autoSave)
      } else if (/\bperm(?:anent)?\b/i.test(raw)) {
        filtered = filtered.filter(item => !item.autoSave)
      }
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
          aValue = 'name' in a ? (a.name || '') : 'title' in a ? (a.title || '') : ''
          bValue = 'name' in b ? (b.name || '') : 'title' in b ? (b.title || '') : ''
          break
        case 'createdAt':
          aValue = new Date((a as any).createdAt ?? (a as any).created_at)
          bValue = new Date((b as any).createdAt ?? (b as any).created_at)
          break
        case 'type':
          aValue = 'class' in a ? (a.class || '')
            : 'itemType' in a ? (a.itemType || '')
            : 'questType' in a ? (a.questType || '')
            : 'encounterType' in a ? (a.encounterType || '')
            : 'role' in a ? (a.role || '')
            : 'landName' in (a as any) ? ((a as any).landName || '')
            : ''
          bValue = 'class' in b ? (b.class || '')
            : 'itemType' in b ? (b.itemType || '')
            : 'questType' in b ? (b.questType || '')
            : 'encounterType' in b ? (b.encounterType || '')
            : 'role' in b ? (b.role || '')
            : 'landName' in (b as any) ? ((b as any).landName || '')
            : ''
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
    const portraitUrl = (item as any).portrait || (item as any).portraitUrl || (item as any).portrait_url || (item as any).data?.portrait || (item as any).data?.portraitUrl || (item as any).data?.portrait_url

    return (
      <div key={item.id} className={`group relative fantasy-card flex flex-col min-h-[240px] overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
        isTemporary 
          ? 'border-2 border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100' 
          : 'border-2 border-yellow-700 bg-gradient-to-br from-yellow-100 to-orange-100 hover:from-yellow-200 hover:to-orange-200'
      }`}>
        {/* Enhanced Header with icon and status */}
          <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {portraitUrl ? (
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-200 bg-white shadow-sm flex-shrink-0">
                <Image src={portraitUrl} alt={`${itemName} portrait`} width={48} height={48} className="w-full h-full object-cover" unoptimized />
              </div>
            ) : (
              <div className={`p-3 rounded-xl bg-gradient-to-r ${getItemColor()} text-white shadow-lg transition-all duration-300`}>
                <ItemIcon className="h-6 w-6" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="fantasy-title text-xl font-semibold text-slate-900 truncate max-w-[calc(100%-64px)]">
                {itemName}
              </h3>
              <p className="fantasy-text text-sm text-gray-600 font-medium mt-1">{itemType}</p>
            </div>
          </div>
          
          {/* Enhanced Status badge */}
          <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all duration-300 absolute top-2 right-2 z-10 ${
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
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-200 gap-3">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-full">
              <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate((item as any).createdAt ?? (item as any).created_at)}
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
          <div className="flex gap-2">
            {/* View Button */}
            <button
              onClick={() => viewItem(getItemType(item), item.id)}
              className="group/btn relative p-2.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="View Details"
            >
              <Eye className="h-5 w-5" />
              
            </button>

            {/* Download Button */}
            <button
              onClick={() => downloadItem(getItemType(item), item.id)}
              className="group/btn relative p-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="Download PDF"
            >
              <Download className="h-5 w-5" />
              
            </button>

            {/* Convert to Permanent Button (Temporary items only) */}
            {isTemporary && (
              <button
                onClick={() => handleMakePermanent(item)}
                className="group/btn relative p-2.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
                title="Convert to Permanent"
              >
                <Shield className="h-5 w-5" />
                
              </button>
            )}

            {/* Delete Button */}
            <button
              onClick={() => deleteItem(getItemType(item), item.id)}
              className="group/btn relative p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="Delete"
            >
              <Trash2 className="h-5 w-5" />
              
            </button>
          </div>
        </div>

        {/* Enhanced Hover overlay effect */}
        
        
        {/* Quick action indicator */}
        

        {/* Enhanced hover state indicator */}
        
        
        {/* Removed floating action hint in grid view */}
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
    const portraitUrl = (item as any).portrait || (item as any).portraitUrl || (item as any).portrait_url || (item as any).data?.portrait || (item as any).data?.portraitUrl || (item as any).data?.portrait_url

    return (
      <div key={item.id} className={`group fantasy-card p-6 border-l-4 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${
        isTemporary 
          ? 'border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100' 
          : 'border-l-yellow-700 bg-gradient-to-r from-yellow-100 to-orange-100 hover:from-yellow-200 hover:to-orange-200'
      }`}>
        <div className="flex items-center gap-6">
          {/* Enhanced Icon and main content */}
          <div className="flex items-center gap-5 flex-1 min-w-0">
            {portraitUrl ? (
              <div className="w-14 h-14 rounded-2xl overflow-hidden border border-amber-200 bg-white shadow-sm flex-shrink-0">
                <Image src={portraitUrl} alt={`${itemName} portrait`} width={56} height={56} className="w-full h-full object-cover" unoptimized />
              </div>
            ) : (
              <div className={`p-4 rounded-2xl bg-gradient-to-r ${getItemColor()} text-white shadow-lg transition-all duration-300 flex-shrink-0`}>
                <ItemIcon className="h-7 w-7" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-4 mb-3">
                <h3 className="fantasy-title text-2xl font-bold text-gray-800 truncate">
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
                  Created: {formatDate((item as any).createdAt ?? (item as any).created_at)}
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
          <div className="flex gap-3 flex-shrink-0">
            {/* View Button */}
            <button
              onClick={() => viewItem(getItemType(item), item.id)}
              className="group/btn relative p-3 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="View Details"
            >
              <Eye className="h-6 w-6" />
              
            </button>

            {/* Download Button */}
            <button
              onClick={() => downloadItem(getItemType(item), item.id)}
              className="group/btn relative p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="Download PDF"
            >
              <Download className="h-6 w-6" />
              
            </button>

            {/* Convert to Permanent Button (Temporary items only) */}
            {isTemporary && (
              <button
                onClick={() => handleMakePermanent(item)}
                className="group/btn relative p-3 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
                title="Convert to Permanent"
              >
                <Shield className="h-6 w-6" />
                
              </button>
            )}

            {/* Delete Button */}
            <button
              onClick={() => deleteItem(getItemType(item), item.id)}
              className="group/btn relative p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110 hover:shadow-md"
              title="Delete"
            >
              <Trash2 className="h-6 w-6" />
              
            </button>
          </div>
        </div>

        {/* Quick action indicator */}
        

        {/* Enhanced hover state indicator */}
        
        
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
    const anyItem: any = item as any
    if (anyItem?.type) return anyItem.type
    if ('class' in item) return 'characters'
    if ('itemType' in item) return 'items'
    if ('questType' in item) return 'quests'
    if ('encounterType' in item) return 'encounters'
    if ('role' in item) return 'npcs'
    if ('playerCount' in item) return 'campaigns'
    if ('landName' in item) return 'worlds'
    return activeTab || 'characters'
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
      <div className="max-w-7xl mx-auto px-4">
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
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 md:gap-4 xl:gap-6 mb-8 p-4 md:p-6 xl:p-8 fantasy-card bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border border-amber-300 shadow-lg rounded-lg">
          {/* Enhanced Search Section */}
          <div className="xl:col-span-6 flex flex-col justify-center">
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
                className="w-full h-12 md:h-14 pl-4 md:pl-5 pr-12 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 text-sm md:text-base bg-white text-slate-800 placeholder:text-slate-500 shadow hover:shadow-md"
              />
              
              {/* Enhanced Loading indicator or clear search button */}
              {searchLoading ? (
                <div className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center">
                  <div className="p-2 rounded-md bg-amber-100">
                    <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-2 border-amber-500 border-t-transparent"></div>
                  </div>
                </div>
              ) : searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-all duration-150"
                  title="Clear search"
                >
                  <X className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              ) : (
                <div className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center">
                  <div className="hidden md:block">
                    <div className="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-lg border border-amber-200">
                      <kbd className="font-mono bg-amber-200 px-1.5 py-0.5 rounded text-xs">Ctrl</kbd> + <kbd className="font-mono bg-amber-200 px-1.5 py-0.5 rounded text-xs">F</kbd>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Filters Section */}
          <div className="xl:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 items-end">
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
                  className="appearance-none w-full h-12 md:h-14 px-4 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white text-slate-800 shadow hover:shadow-md pr-10 cursor-pointer"
                >
                  <option value="all" className="bg-white text-slate-800">✨ All Content</option>
                  <option value="permanent" className="bg-white text-slate-800">🛡️ Permanent</option>
                  <option value="temporary" className="bg-white text-slate-800">⏰ Temporary</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 md:h-5 md:w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className="appearance-none w-full h-12 md:h-14 px-4 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white text-slate-800 shadow hover:shadow-md pr-10 cursor-pointer"
                >
                  <option value="createdAt" className="bg-white text-slate-800">📅 Date Created</option>
                  <option value="name" className="bg-white text-slate-800">📝 Name</option>
                  <option value="type" className="bg-white text-slate-800">🏷️ Type</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 md:h-5 md:w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="w-full h-12 md:h-14 px-4 border-2 border-amber-300 rounded-lg hover:bg-amber-50 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white shadow hover:shadow-md min-w-[64px]"
                title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
              >
                <span className="text-lg md:text-2xl font-bold text-amber-600 transition-colors">
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
                className="w-full h-12 md:h-14 px-4 border-2 border-amber-300 rounded-lg hover:bg-amber-50 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all duration-200 bg-white shadow hover:shadow-md min-w-[64px]"
                title={`Switch to ${viewMode === 'grid' ? 'List' : 'Grid'} View`}
              >
                <span className="text-lg md:text-2xl font-bold text-amber-600 transition-colors">
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
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getCurrentContent().map((item) => renderContentCard(item as any))}
            </div>
          ) : (
            <div className="space-y-4">
              {getCurrentContent().map((item) => renderContentRow(item as any))}
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
      {isMounted && showViewModal && selectedItem && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 p-4 overflow-y-auto overscroll-contain">
          <div className="max-w-5xl mx-auto mt-[10vh]">
            <div className="fantasy-card w-full max-h-[80vh] rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 shadow-2xl border border-amber-300">
            {/* Modal Header */}
            <div className="bg-amber-50 border-b border-amber-200 p-5 text-amber-900">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-100">
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
                  <div className="min-w-0">
                    <h2 className="fantasy-title text-3xl font-bold text-slate-900">
                      {'name' in selectedItem ? selectedItem.name : selectedItem.title}
                    </h2>
                    <p className="text-amber-700 text-base mt-1">
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
                
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditMode((v)=>!v)} className="px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-sm font-medium" title="Toggle Edit">
                    {editMode ? 'Done' : 'Edit'}
                  </button>
                  {editMode && (
                    <button onClick={saveEdits} disabled={saving} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${saving ? 'bg-emerald-400 cursor-not-allowed text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`} title="Save">
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  )}
                  {!editMode && saveOk && (
                    <span className="px-2 py-1 text-emerald-700 bg-emerald-100 rounded text-xs">Saved</span>
                  )}
                  <button onClick={exportPdf} className="px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-black text-sm font-medium" title="Export PDF">
                    Export PDF
                  </button>
                  <button onClick={exportJson} className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-900 hover:bg-slate-300 text-sm font-medium" title="Export JSON">
                    Export JSON
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      setSelectedItem(null)
                    }}
                    className="p-2 rounded-lg text-amber-700 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-colors duration-200"
                    title="Close"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 md:p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* Modal Tabs */}
              <div className="flex items-center gap-2 mb-5 border-b border-amber-100">
                <button
                  onClick={() => setModalTab('details')}
                  className={`${modalTab==='details' ? 'text-amber-700 border-b-2 border-amber-600' : 'text-slate-600 hover:text-slate-900'} px-3 py-2 text-sm font-medium`}
                >
                  Details
                </button>
                <button
                  onClick={() => { setModalTab('pdf'); if (!pdfUrl) openPdfPreview() }}
                  className={`${modalTab==='pdf' ? 'text-amber-700 border-b-2 border-amber-600' : 'text-slate-600 hover:text-slate-900'} px-3 py-2 text-sm font-medium`}
                >
                  PDF
                </button>
              </div>

              {modalTab === 'details' && (
                <div className="space-y-6">
                {'type' in selectedItem && selectedItem.type === 'characters' && (
                  <div className="space-y-6">
                    {/* Character Portrait */}
                    {('portrait' in selectedItem && selectedItem.portrait) || ('portraitUrl' in selectedItem && selectedItem.portraitUrl) || (selectedItem as any).portrait_url ? (
                      <div className="bg-amber-50 p-6 rounded-xl border border-amber-200">
                        <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                          <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Character Portrait
                        </h3>
                        <div className="flex justify-center">
                          <Image
                            src={(selectedItem as any).portrait || (selectedItem as any).portraitUrl || (selectedItem as any).portrait_url}
                            alt={`Portrait of ${'name' in selectedItem ? selectedItem.name : 'Character'}`}
                            width={300}
                            height={300}
                            unoptimized
                            className="rounded-xl shadow-2xl border border-amber-300"
                            style={{ maxHeight: '300px', objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Basic Info Card */}
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                        <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                          <Shield className="h-5 w-5 text-amber-600" />
                          Basic Information
                        </h3>
                        <div className="space-y-1 divide-y divide-amber-100">
                          {getFieldsForType(editedItem || selectedItem).map((f) => (
                            <div key={f.key} className="flex justify-between items-center py-2.5 gap-4">
                              <span className="text-slate-600 flex-shrink-0">{f.label}:</span>
                              {editMode ? (
                                f.type === 'textarea' ? (
                                  <textarea
                                    className="w-full min-h-[80px] p-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-md text-slate-900"
                                    placeholder={`Enter ${f.label.toLowerCase()}...`}
                                    value={(editedItem as any)?.[f.key] || ''}
                                    onChange={(e) => setEditedItem((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                                  />
                                ) : (
                                  <input
                                    type={f.type === 'number' ? 'number' : 'text'}
                                    className="w-full p-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-md text-slate-900"
                                    placeholder={`Enter ${f.label.toLowerCase()}...`}
                                    value={(editedItem as any)?.[f.key] || ''}
                                    onChange={(e) => setEditedItem((prev: any) => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                                  />
                                )
                              ) : (
                                <span className="text-slate-900 font-semibold truncate">
                                  {(''+((selectedItem as any)?.[f.key] ?? (editedItem as any)?.[f.key] ?? ''))}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Details Card */}
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                        <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-amber-600" />
                          Character Details
                        </h3>
                        <div className="space-y-4">
                          {/* Rich fields rendered from editedItem if present */}
                          {(() => {
                            const fields = getFieldsForType(editedItem || selectedItem)
                            const longKeys = ['backstory','personalityTraits','quote','description','objectives','rewards','enemies','environment','lore','setting','mainPlot']
                            return fields
                              .filter(f => longKeys.includes(f.key))
                              .map(f => (
                                <div key={f.key}>
                                  <p className="text-slate-600 mb-2">{f.label}:</p>
                                  {editMode ? (
                                    <textarea
                                      className="w-full min-h-[120px] p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-md text-slate-900"
                                      placeholder={`Enter ${f.label.toLowerCase()}...`}
                                      value={(editedItem as any)?.[f.key] || ''}
                                      onChange={(e) => setEditedItem((prev: any) => ({ ...prev, [f.key]: e.target.value }))}
                                    />
                                  ) : (
                                    <p className="text-slate-900 text-sm leading-relaxed bg-gradient-to-r from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-100 whitespace-pre-wrap">
                                      {f.key === 'personalityTraits' ? parseArrayField((selectedItem as any)?.[f.key]).join(', ') : ((selectedItem as any)?.[f.key] || '')}
                                    </p>
                                  )}
                                </div>
                              ))
                          })()}
                          {/* Stats grid if available */}
                          {parseArrayField((selectedItem as any).stats).length > 0 && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                              <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Target className="h-5 w-5 text-amber-600" />
                                Stats
                              </h3>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {parseArrayField((selectedItem as any).stats).map((stat, i) => (
                                  <div key={`stats-${i}-${stat}`} className="bg-gradient-to-r from-amber-100 to-orange-100 p-3 rounded border border-amber-200 text-center">
                                    <div className="text-2xl font-bold text-amber-700">{stat}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {(('hitPoints' in selectedItem && (selectedItem as any).hitPoints) || ('armorClass' in selectedItem && (selectedItem as any).armorClass) || ('speed' in selectedItem && (selectedItem as any).speed)) && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                              <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-amber-600" />
                                Combat Stats
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {('hitPoints' in selectedItem && (selectedItem as any).hitPoints) && (
                                  <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-3 rounded border border-amber-200"><span className="text-slate-600 text-sm">Hit Points:</span> <span className="font-semibold text-slate-900">{(selectedItem as any).hitPoints}</span></div>
                                )}
                                {('armorClass' in selectedItem && (selectedItem as any).armorClass) && (
                                  <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-3 rounded border border-amber-200"><span className="text-slate-600 text-sm">Armor Class:</span> <span className="font-semibold text-slate-900">{(selectedItem as any).armorClass}</span></div>
                                )}
                                {('speed' in selectedItem && (selectedItem as any).speed) && (
                                  <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-3 rounded border border-amber-200"><span className="text-slate-600 text-sm">Speed:</span> <span className="font-semibold text-slate-900">{(selectedItem as any).speed} ft</span></div>
                                )}
                              </div>
                            </div>
                          )}
                          {/* Proficiencies and Features */}
                          {parseArrayField((selectedItem as any).proficiencies).length > 0 && (
                            <div>
                              <p className="text-slate-600 mb-2">Proficiencies:</p>
                              <div className="flex flex-wrap gap-2">
                                {parseArrayField((selectedItem as any).proficiencies).map((p, idx) => (
                                  <span key={`proficiencies-${idx}-${p}`} className="bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium">{p}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {parseArrayField((selectedItem as any).features).length > 0 && (
                            <div>
                              <p className="text-slate-600 mb-2">Features:</p>
                              <div className="space-y-1">
                                {parseArrayField((selectedItem as any).features).map((f, idx) => (
                                  <div key={`features-${idx}-${f}`} className="text-slate-900 text-sm">• {f}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          {/* Quote and Unique Trait */}
                          {('quote' in (selectedItem as any)) && (selectedItem as any).quote && (
                            <div className="border-l-4 border-amber-400 bg-amber-50 p-3 rounded">
                              <p className="italic text-slate-800">"{(selectedItem as any).quote}"</p>
                            </div>
                          )}
                          {('uniqueTrait' in (selectedItem as any)) && (selectedItem as any).uniqueTrait && (
                            <div className="border-l-4 border-purple-400 bg-purple-50 p-3 rounded">
                              <p className="italic text-slate-800"><span className="font-semibold">Unique Trait:</span> {(selectedItem as any).uniqueTrait}</p>
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
                    {('portrait' in selectedItem && selectedItem.portrait) || ('portraitUrl' in selectedItem && selectedItem.portraitUrl) || (selectedItem as any).portrait_url ? (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">NPC Portrait</h3>
                        <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                          <Image
                            src={(selectedItem as any).portrait || (selectedItem as any).portraitUrl || (selectedItem as any).portrait_url}
                            alt={`Portrait of ${'name' in selectedItem ? selectedItem.name : 'NPC'}`}
                            width={400}
                            height={400}
                            unoptimized
                            className="w-full h-auto rounded-lg shadow-lg"
                            style={{ maxHeight: '400px', objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    ) : null}

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
                        {parseArrayField((selectedItem as any).motivations).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Motivations:</p>
                            <div className="space-y-1">
                              {parseArrayField((selectedItem as any).motivations).map((m, i) => (
                                <div key={`motivations-${i}-${m}`} className="text-white text-sm">• {m}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).goals).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Goals:</p>
                            <div className="space-y-1">
                              {parseArrayField((selectedItem as any).goals).map((g, i) => (
                                <div key={`goals-${i}-${g}`} className="text-white text-sm">• {g}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).relationships).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Relationships:</p>
                            <div className="space-y-1">
                              {parseArrayField((selectedItem as any).relationships).map((r, i) => (
                                <div key={`relationships-${i}-${r}`} className="text-white text-sm">• {r}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).abilities).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Abilities:</p>
                            <div className="space-y-1">
                              {parseArrayField((selectedItem as any).abilities).map((a, i) => (
                                <div key={`abilities-${i}-${a}`} className="text-white text-sm">• {a}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).equipment).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Equipment:</p>
                            <div className="space-y-1">
                              {parseArrayField((selectedItem as any).equipment).map((eq, i) => (
                                <div key={`equipment-${i}-${eq}`} className="text-white text-sm">• {eq}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).secrets).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Secrets:</p>
                            <div className="space-y-1">
                              {parseArrayField((selectedItem as any).secrets).map((s, i) => (
                                <div key={`secrets-${i}-${s}`} className="text-white text-sm">• {s}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).fears).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Fears:</p>
                            <div className="space-y-1">
                              {parseArrayField((selectedItem as any).fears).map((s, i) => (
                                <div key={`fears-${i}-${s}`} className="text-white text-sm">• {s}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        {('uniqueTrait' in selectedItem) && (selectedItem as any).uniqueTrait && (
                          <div>
                            <p className="text-gray-400 mb-1">Unique Trait:</p>
                            <p className="text-white text-sm">{String((selectedItem as any).uniqueTrait)}</p>
                          </div>
                        )}
                        {'personality' in selectedItem && (selectedItem as any).personality && (
                          <div>
                            <p className="text-gray-400 mb-1">Personality:</p>
                            <p className="text-white text-sm">{String((selectedItem as any).personality)}</p>
                          </div>
                        )}
                        {'appearance' in selectedItem && (selectedItem as any).appearance && (
                          <div>
                            <p className="text-gray-400 mb-1">Appearance:</p>
                            <p className="text-white text-sm">{String((selectedItem as any).appearance)}</p>
                          </div>
                        )}
                        {'backstory' in selectedItem && (selectedItem as any).backstory && (
                          <div>
                            <p className="text-gray-400 mb-1">Backstory:</p>
                            <p className="text-white text-sm">{String((selectedItem as any).backstory)}</p>
                          </div>
                        )}
                        {'quote' in selectedItem && (selectedItem as any).quote && (
                          <div>
                            <p className="text-gray-400 mb-1">Quote:</p>
                            <p className="text-white text-sm italic">&quot;{String((selectedItem as any).quote)}&quot;</p>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {'landName' in selectedItem && (selectedItem as any).landName && (
                            <div className="text-white text-sm"><span className="text-gray-400">Land:</span> {String((selectedItem as any).landName)}</div>
                          )}
                          {'climate' in selectedItem && (selectedItem as any).climate && (
                            <div className="text-white text-sm"><span className="text-gray-400">Climate:</span> {String((selectedItem as any).climate)}</div>
                          )}
                          {'population' in selectedItem && (selectedItem as any).population && (
                            <div className="text-white text-sm"><span className="text-gray-400">Population:</span> {String((selectedItem as any).population)}</div>
                          )}
                          {'government' in selectedItem && (selectedItem as any).government && (
                            <div className="text-white text-sm"><span className="text-gray-400">Government:</span> {String((selectedItem as any).government)}</div>
                          )}
                        </div>
                        {'description' in selectedItem && (selectedItem as any).description && (
                          <div>
                            <p className="text-gray-400 mb-1">Description:</p>
                            <p className="text-white text-sm">{String((selectedItem as any).description)}</p>
                          </div>
                        )}
                        {'lore' in selectedItem && (selectedItem as any).lore && (
                          <div>
                            <p className="text-gray-400 mb-1">Lore:</p>
                            <p className="text-white text-sm">{String((selectedItem as any).lore)}</p>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).culture).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Culture:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).culture).map((v,i)=> <div key={`culture-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).geography).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Geography:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).geography).map((v,i)=> <div key={`geography-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).politics).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Politics:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).politics).map((v,i)=> <div key={`politics-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).religion).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Religion:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).religion).map((v,i)=> <div key={`religion-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).magic).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Magic:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).magic).map((v,i)=> <div key={`magic-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).economy).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Economy:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).economy).map((v,i)=> <div key={`economy-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).notableEvents).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Notable Events:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).notableEvents).map((v,i)=> <div key={`notableEvents-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).majorFactions).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Major Factions:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).majorFactions).map((v,i)=> <div key={`majorFactions-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).landmarks).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Landmarks:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).landmarks).map((v,i)=> <div key={`landmarks-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).resources).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Resources:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).resources).map((v,i)=> <div key={`resources-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).conflicts).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Conflicts:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).conflicts).map((v,i)=> <div key={`conflicts-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).legends).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Legends:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).legends).map((v,i)=> <div key={`legends-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {('quote' in selectedItem) && (selectedItem as any).quote && (
                          <div className="border-l-4 border-amber-400 bg-amber-50 p-3 rounded">
                            <p className="italic text-slate-800">"{String((selectedItem as any).quote)}"</p>
                          </div>
                        )}
                        {((selectedItem as any).uniqueTrait || (selectedItem as any).uniqueFeature) && (
                          <div className="border-l-4 border-purple-400 bg-purple-50 p-3 rounded">
                            <p className="text-slate-800"><span className="font-semibold">Unique Trait:</span> {(selectedItem as any).uniqueTrait || (selectedItem as any).uniqueFeature}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {'type' in selectedItem && selectedItem.type === 'items' && (
                  <div className="space-y-4">
                    {/* Item Portrait */}
                    {('portrait' in selectedItem && selectedItem.portrait) || ('portraitUrl' in selectedItem && selectedItem.portraitUrl) || (selectedItem as any).portrait_url ? (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">Item Portrait</h3>
                        <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                          <Image 
                            src={(selectedItem as any).portrait || (selectedItem as any).portraitUrl || (selectedItem as any).portrait_url} 
                            alt={`Portrait of ${'name' in selectedItem ? selectedItem.name : 'Item'}`}
                            width={400}
                            height={400}
                            unoptimized
                            className="w-full h-auto rounded-lg shadow-lg"
                            style={{ maxHeight: '400px', objectFit: 'contain' }}
                          />
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-3">Item Details</h3>
                      <div className="space-y-2">
                        <p><span className="text-gray-400">Name:</span> <span className="text-white">{('name' in selectedItem ? selectedItem.name : selectedItem.title)}</span></p>
                        {'itemType' in selectedItem && (
                          <p><span className="text-gray-400">Type:</span> <span className="text-white">{selectedItem.itemType}</span></p>
                        )}
                        {'rarity' in selectedItem && selectedItem.rarity && (
                          <p><span className="text-gray-400">Rarity:</span> <span className="text-white">{String((selectedItem as any).rarity)}</span></p>
                        )}
                        {'description' in selectedItem && selectedItem.description && (
                          <div>
                            <p className="text-gray-400 mb-1">Description:</p>
                            <p className="text-white text-sm">{String((selectedItem as any).description)}</p>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).properties).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Properties:</p>
                            <div className="flex flex-wrap gap-2">
                                                              {parseArrayField((selectedItem as any).properties).map((prop, idx) => (
                                  <span key={`properties-${idx}-${prop}`} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">{prop}</span>
                                ))}
                            </div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).magicalEffects).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Magical Effects:</p>
                            <div className="flex flex-wrap gap-2">
                                                              {parseArrayField((selectedItem as any).magicalEffects).map((eff, idx) => (
                                  <span key={`magicalEffects-${idx}-${eff}`} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">{eff}</span>
                                ))}
                            </div>
                          </div>
                        )}
                        {'history' in selectedItem && (selectedItem as any).history && (
                          <div>
                            <p className="text-gray-400 mb-1">History:</p>
                            <p className="text-white text-sm">{String((selectedItem as any).history)}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {'value' in selectedItem && (selectedItem as any).value && (
                            <div className="text-white text-sm"><span className="text-gray-400">Value:</span> {String((selectedItem as any).value)}</div>
                          )}
                          {'weight' in selectedItem && (selectedItem as any).weight && (
                            <div className="text-white text-sm"><span className="text-gray-400">Weight:</span> {String((selectedItem as any).weight)}</div>
                          )}
                        </div>
                        {parseArrayField((selectedItem as any).requirements).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Requirements:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).requirements).map((v,i)=> <div key={`requirements-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {('attunement' in selectedItem) && (
                          <div className="text-white text-sm"><span className="text-gray-400">Attunement:</span> {(selectedItem as any).attunement ? 'Required' : 'Not required'}</div>
                        )}
                        {parseArrayField((selectedItem as any).craftingMaterials).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Crafting Materials:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).craftingMaterials).map((v,i)=> <div key={`craftingMaterials-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).enchantments).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Enchantments:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).enchantments).map((v,i)=> <div key={`enchantments-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).restrictions).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Restrictions:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).restrictions).map((v,i)=> <div key={`restrictions-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {('quote' in selectedItem) && (selectedItem as any).quote && (
                          <div className="border-l-4 border-amber-400 bg-amber-50 p-3 rounded">
                            <p className="italic text-slate-800">"{String((selectedItem as any).quote)}"</p>
                          </div>
                        )}
                        {('uniqueTrait' in selectedItem) && (selectedItem as any).uniqueTrait && (
                          <div className="border-l-4 border-purple-400 bg-purple-50 p-3 rounded">
                            <p className="text-slate-800"><span className="font-semibold">Unique Trait:</span> {String((selectedItem as any).uniqueTrait)}</p>
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
                        {'description' in selectedItem && (selectedItem as any).description && (
                          <div>
                            <p className="text-gray-400 mb-1">Description:</p>
                            <p className="text-white text-sm">{String((selectedItem as any).description)}</p>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).objectives).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Objectives:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).objectives).map((v,i)=> <div key={`objectives-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).rewards).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Rewards:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).rewards).map((v,i)=> <div key={`rewards-quests-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).challenges).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Challenges:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).challenges).map((v,i)=> <div key={`challenges-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).npcs).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">NPCs:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).npcs).map((v,i)=> <div key={`npcs-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).locations).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Locations:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).locations).map((v,i)=> <div key={`locations-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {'timeline' in selectedItem && (selectedItem as any).timeline && (
                          <div>
                            <p className="text-gray-400 mb-1">Timeline:</p>
                            <p className="text-white text-sm">{String((selectedItem as any).timeline)}</p>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).consequences).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Consequences:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).consequences).map((v,i)=> <div key={`consequences-quests-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {('quote' in selectedItem) && (selectedItem as any).quote && (
                          <div className="border-l-4 border-amber-400 bg-amber-50 p-3 rounded">
                            <p className="italic text-slate-800">"{String((selectedItem as any).quote)}"</p>
                          </div>
                        )}
                        {('uniqueTrait' in selectedItem) && (selectedItem as any).uniqueTrait && (
                          <div className="border-l-4 border-purple-400 bg-purple-50 p-3 rounded">
                            <p className="text-slate-800"><span className="font-semibold">Unique Trait:</span> {String((selectedItem as any).uniqueTrait)}</p>
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
                        {parseArrayField((selectedItem as any).enemies).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Enemies:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).enemies).map((v,i)=> <div key={`enemies-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).allies).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Allies:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).allies).map((v,i)=> <div key={`allies-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).environment).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Environment:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).environment).map((v,i)=> <div key={`environment-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).objectives).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Objectives:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).objectives).map((v,i)=> <div key={`objectives-encounters-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).rewards).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Rewards:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).rewards).map((v,i)=> <div key={`rewards-encounters-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).challenges).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Challenges:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).challenges).map((v,i)=> <div key={`challenges-encounters-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).tactics).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Tactics:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).tactics).map((v,i)=> <div key={`tactics-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).hazards).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Hazards:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).hazards).map((v,i)=> <div key={`hazards-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {'timeline' in selectedItem && (selectedItem as any).timeline && (
                          <div>
                            <p className="text-gray-400 mb-1">Timeline:</p>
                            <p className="text-white text-sm">{String((selectedItem as any).timeline)}</p>
                          </div>
                        )}
                        {parseArrayField((selectedItem as any).consequences).length > 0 && (
                          <div>
                            <p className="text-gray-400 mb-1">Consequences:</p>
                            <div className="space-y-1">{parseArrayField((selectedItem as any).consequences).map((v,i)=> <div key={`consequences-encounters-${i}-${v}`} className="text-white text-sm">• {v}</div>)}</div>
                          </div>
                        )}
                        {('quote' in selectedItem) && (selectedItem as any).quote && (
                          <div className="border-l-4 border-amber-400 bg-amber-50 p-3 rounded">
                            <p className="italic text-slate-800">"{String((selectedItem as any).quote)}"</p>
                          </div>
                        )}
                        {('uniqueTrait' in selectedItem) && (selectedItem as any).uniqueTrait && (
                          <div className="border-l-4 border-purple-400 bg-purple-50 p-3 rounded">
                            <p className="text-slate-800"><span className="font-semibold">Unique Trait:</span> {String((selectedItem as any).uniqueTrait)}</p>
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
                        {'description' in selectedItem && (selectedItem as any).description && (
                          <div>
                            <p className="text-gray-400 mb-1">Description:</p>
                            <p className="text-white text-sm">{String((selectedItem as any).description)}</p>
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
              )}

              {modalTab === 'pdf' && (
                <div className="min-h-[60vh]">
                  {pdfLoading && (
                    <div className="flex items-center justify-center h-[60vh]">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-amber-600"></div>
                    </div>
                  )}
                  {!pdfLoading && pdfError && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{pdfError}</div>
                  )}
                  {!pdfLoading && !pdfError && pdfUrl && (
                    <object data={pdfUrl} type="application/pdf" className="w-full h-[70vh] rounded-lg border border-amber-200">
                      <iframe src={pdfUrl} className="w-full h-full" />
                    </object>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      , document.body
      )}

      {/* Notifications */}
      <FantasyNotification 
        notifications={notifications} 
        onDismiss={removeNotification} 
      />
    </div>
  )
} 
'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Shield, Users, Map, Sword, BookOpen, Target, Plus, Coins, Scroll, Folder } from 'lucide-react'

const tools = [
  {
    name: 'Campaign Generator',
    description: 'Create complete campaigns with characters, quests, and encounters',
    href: '/dashboard/campaign-generator',
    icon: Scroll,
    color: 'bg-purple-500',
  },
  {
    name: 'Character Generator',
    description: 'Create detailed characters with balanced stats and backgrounds',
    href: '/dashboard/character-generator',
    icon: Shield,
    color: 'bg-blue-500',
  },
  {
    name: 'NPC Generator',
    description: 'Generate memorable NPCs with personalities and motivations',
    href: '/dashboard/npc-generator',
    icon: Users,
    color: 'bg-green-500',
  },
  {
    name: 'Item Generator',
    description: 'Create unique weapons, armor, and magical items',
    href: '/dashboard/item-generator',
    icon: Sword,
    color: 'bg-yellow-500',
  },
  {
    name: 'World Lore Builder',
    description: 'Build rich worlds with detailed lore and geography',
    href: '/dashboard/world-lore-builder',
    icon: Map,
    color: 'bg-indigo-500',
  },
  {
    name: 'Quest Builder',
    description: 'Design engaging quests with objectives and rewards',
    href: '/dashboard/quest-builder',
    icon: BookOpen,
    color: 'bg-red-500',
  },
  {
    name: 'Encounter Creator',
    description: 'Build balanced encounters with appropriate challenges',
    href: '/dashboard/encounter-creator',
    icon: Target,
    color: 'bg-orange-500',
  },

]

export default function DashboardPage() {
  const [tokenBalance, setTokenBalance] = useState<number>(0)
  const [characterCount, setCharacterCount] = useState<number>(0)
  const [npcCount, setNpcCount] = useState<number>(0)
  const [worldCount, setWorldCount] = useState<number>(0)
  const [questCount, setQuestCount] = useState<number>(0)
  const [campaignCount, setCampaignCount] = useState<number>(0)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load token balance
        const tokenResponse = await fetch('/api/tokens/balance')
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json()
          setTokenBalance(tokenData.tokens)
        }

        // Load counts
        const countsResponse = await fetch('/api/dashboard/counts')
        if (countsResponse.ok) {
          const countsData = await countsResponse.json()
          setCharacterCount(countsData.characters || 0)
          setNpcCount(countsData.npcs || 0)
          setWorldCount(countsData.worlds || 0)
          setQuestCount(countsData.quests || 0)
          setCampaignCount(countsData.campaigns || 0)
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      }
    }

    loadData()
  }, [])

  return (
    <div className="min-h-screen fantasy-main">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="fantasy-title text-5xl font-bold mb-4">
            Let&apos;s make your <span className="text-yellow-700 fantasy-title">dream campaign</span> a reality.
          </h1>
          <p className="fantasy-text text-xl max-w-3xl mx-auto">
            AI-powered D&D tools to help you create amazing characters, worlds, and adventures. 
            No coding necessary.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
          <div className="fantasy-card p-4">
            <div className="flex flex-col items-center text-center">
              <div className="fantasy-icon bg-blue-500 mb-2">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <p className="fantasy-text text-xs sm:text-sm font-medium truncate w-full hidden sm:block">Characters</p>
              <p className="fantasy-title text-lg sm:text-xl lg:text-2xl font-semibold">{characterCount}</p>
            </div>
          </div>

          <div className="fantasy-card p-4">
            <div className="flex flex-col items-center text-center">
              <div className="fantasy-icon bg-green-500 mb-2">
                <Users className="h-6 w-6 text-white" />
              </div>
              <p className="fantasy-text text-xs sm:text-sm font-medium truncate w-full hidden sm:block">NPCs</p>
              <p className="fantasy-title text-lg sm:text-xl lg:text-2xl font-semibold">{npcCount}</p>
            </div>
          </div>

          <div className="fantasy-card p-4">
            <div className="flex flex-col items-center text-center">
              <div className="fantasy-icon bg-purple-500 mb-2">
                <Map className="h-6 w-6 text-white" />
              </div>
              <p className="fantasy-text text-xs sm:text-sm font-medium truncate w-full hidden sm:block">Worlds</p>
              <p className="fantasy-title text-lg sm:text-xl lg:text-2xl font-semibold">{worldCount}</p>
            </div>
          </div>

          <div className="fantasy-card p-4">
            <div className="flex flex-col items-center text-center">
              <div className="fantasy-icon bg-red-500 mb-2">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <p className="fantasy-text text-xs sm:text-sm font-medium truncate w-full hidden sm:block">Quests</p>
              <p className="fantasy-title text-lg sm:text-xl lg:text-2xl font-semibold">{questCount}</p>
            </div>
          </div>

          <div className="fantasy-card p-4">
            <div className="flex flex-col items-center text-center">
              <div className="fantasy-icon bg-purple-500 mb-2">
                <Scroll className="h-6 w-6 text-white" />
              </div>
              <p className="fantasy-text text-xs sm:text-sm font-medium truncate w-full hidden sm:block">Campaigns</p>
              <p className="fantasy-title text-lg sm:text-xl lg:text-2xl font-semibold">{campaignCount}</p>
            </div>
          </div>

          <div className="fantasy-card p-4">
            <div className="flex flex-col items-center text-center">
              <div className="fantasy-icon bg-yellow-500 mb-2">
                <Coins className="h-6 w-6 text-white" />
              </div>
              <p className="fantasy-text text-xs sm:text-sm font-medium truncate w-full hidden sm:block">Tokens</p>
              <p className="fantasy-title text-lg sm:text-xl lg:text-2xl font-semibold">{tokenBalance}</p>
            </div>
          </div>
        </div>

      {/* Tools Grid */}
      <div className="mb-12">
        <h2 className="fantasy-title text-3xl font-bold mb-8 text-center">
          What do you want to build?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.name}
              href={tool.href}
              className="group relative fantasy-card hover:scale-105 transition-all duration-300"
            >
              <div className="text-center">
                <div className={`inline-flex p-4 rounded-2xl ${tool.color} text-white mb-6 group-hover:scale-110 transition-transform duration-300 fantasy-icon`}>
                  <tool.icon className="h-8 w-8" />
                </div>
                <h3 className="fantasy-title text-xl font-semibold mb-3 group-hover:text-yellow-700 transition-colors">
                  {tool.name}
                </h3>
                <p className="fantasy-text mb-6 leading-relaxed">{tool.description}</p>
                <div className="flex items-center justify-center text-yellow-700 group-hover:text-yellow-800 font-medium">
                  {tool.name === 'Account & Tokens' ? (
                    <>
                      <Coins className="h-4 w-4 mr-2" />
                      <span>Manage Tokens</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      <span>Start Building</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* My Content Section */}
      <div className="mb-12">
        <h2 className="fantasy-title text-3xl font-bold mb-8 text-center">
          My Content
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/dashboard/library"
            className="group relative fantasy-card hover:scale-105 transition-all duration-300"
          >
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-blue-500 text-white mb-6 group-hover:scale-110 transition-transform duration-300 fantasy-icon">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="fantasy-title text-xl font-semibold mb-3 group-hover:text-yellow-700 transition-colors">
                My Characters
              </h3>
              <p className="fantasy-text mb-6 leading-relaxed">
                View and manage your saved characters
              </p>
              <div className="flex items-center justify-center text-yellow-700 group-hover:text-yellow-800 font-medium">
                <span>{characterCount} characters</span>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/campaigns"
            className="group relative fantasy-card hover:scale-105 transition-all duration-300"
          >
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-purple-500 text-white mb-6 group-hover:scale-110 transition-transform duration-300 fantasy-icon">
                <Folder className="h-8 w-8" />
              </div>
              <h3 className="fantasy-title text-xl font-semibold mb-3 group-hover:text-yellow-700 transition-colors">
                Campaigns
              </h3>
              <p className="fantasy-text mb-6 leading-relaxed">
                Organize content into campaigns
              </p>
              <div className="flex items-center justify-center text-yellow-700 group-hover:text-yellow-800 font-medium">
                <span>{campaignCount} campaigns</span>
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/library"
            className="group relative fantasy-card hover:scale-105 transition-all duration-300"
          >
            <div className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-green-500 text-white mb-6 group-hover:scale-110 transition-transform duration-300 fantasy-icon">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="fantasy-title text-xl font-semibold mb-3 group-hover:text-yellow-800 transition-colors">
                Library
              </h3>
              <p className="fantasy-text mb-6 leading-relaxed">View and manage all your D&D content</p>
              <div className="flex items-center justify-center text-yellow-700 group-hover:text-yellow-800 font-medium">
                <span>View Library</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
      </div>
    </div>
  )
} 
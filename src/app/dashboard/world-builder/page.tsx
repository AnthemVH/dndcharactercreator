'use client'

import { useState } from 'react'
import { Map, Save, Download } from 'lucide-react'

export default function WorldBuilderPage() {
  const [world, setWorld] = useState({
    name: '',
    description: '',
    geography: '',
    history: '',
    cultures: '',
    religions: '',
    politics: '',
    magic: '',
    conflicts: '',
  })

  const [isGenerating, setIsGenerating] = useState(false)

  const worldTypes = [
    'High Fantasy', 'Low Fantasy', 'Steampunk', 'Post-Apocalyptic', 'Medieval', 'Ancient', 'Modern', 'Sci-Fi'
  ]

  const generateRandomWorld = () => {
    setIsGenerating(true)
    
    setTimeout(() => {
      const worldNames = ['Eldoria', 'Mystara', 'Azeroth', 'Faerûn', 'Krynn', 'Golarion', 'Eberron', 'Ravenloft']
      const randomName = worldNames[Math.floor(Math.random() * worldNames.length)]
      const randomType = worldTypes[Math.floor(Math.random() * worldTypes.length)]
      
      setWorld({
        name: randomName,
        description: `A ${randomType.toLowerCase()} world filled with magic and mystery.`,
        geography: 'Rolling hills, dense forests, and ancient mountains dominate the landscape.',
        history: 'Centuries of conflict and cooperation have shaped this world.',
        cultures: 'Diverse cultures coexist, each with their own traditions and beliefs.',
        religions: 'Multiple faiths compete for followers across the land.',
        politics: 'Complex political systems govern the various nations and city-states.',
        magic: 'Magic flows freely through the world, affecting daily life.',
        conflicts: 'Ongoing tensions between nations and factions create constant drama.',
      })
      
      setIsGenerating(false)
    }, 1000)
  }

  const handleSave = () => {
    alert('World saved! (This would save to database in a real app)')
  }

  const handleDownload = () => {
    const worldData = JSON.stringify(world, null, 2)
    const blob = new Blob([worldData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${world.name || 'world'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Map className="h-8 w-8 text-purple-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">World Lore Builder</h1>
        </div>
        <p className="text-gray-600">
          Build rich worlds with detailed lore, history, and geography for your campaign.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* World Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">World Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                World Name
              </label>
              <input
                type="text"
                value={world.name}
                onChange={(e) => setWorld(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter world name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={world.description}
                onChange={(e) => setWorld(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief overview of the world"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geography
              </label>
              <textarea
                value={world.geography}
                onChange={(e) => setWorld(prev => ({ ...prev, geography: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the physical landscape"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                History
              </label>
              <textarea
                value={world.history}
                onChange={(e) => setWorld(prev => ({ ...prev, history: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Key historical events and periods"
              />
            </div>

            <div className="pt-4">
              <button
                onClick={generateRandomWorld}
                disabled={isGenerating}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate Random World'}
              </button>
            </div>
          </div>
        </div>

        {/* World Details */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-6">World Lore</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cultures
              </label>
              <textarea
                value={world.cultures}
                onChange={(e) => setWorld(prev => ({ ...prev, cultures: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the various cultures and societies"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Religions
              </label>
              <textarea
                value={world.religions}
                onChange={(e) => setWorld(prev => ({ ...prev, religions: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the religious beliefs and practices"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Politics
              </label>
              <textarea
                value={world.politics}
                onChange={(e) => setWorld(prev => ({ ...prev, politics: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the political systems and power structures"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Magic
              </label>
              <textarea
                value={world.magic}
                onChange={(e) => setWorld(prev => ({ ...prev, magic: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe how magic works in this world"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conflicts
              </label>
              <textarea
                value={world.conflicts}
                onChange={(e) => setWorld(prev => ({ ...prev, conflicts: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe ongoing conflicts and tensions"
              />
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save World
              </button>
              
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 
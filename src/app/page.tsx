'use client'

import Link from 'next/link'
import { Shield, Users, Map, Sword, BookOpen, Target, Crown } from 'lucide-react'

export default function Home() {
  const handleMainAction = () => {
    window.location.href = '/dashboard'
  }

  const handleGeneratorClick = (path: string) => {
    window.location.href = path
  }

  return (
    <div className="min-h-screen fantasy-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 fantasy-overlay"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="fantasy-title text-6xl font-bold mb-6">
              D&D Master Tools
            </h1>
            <p className="fantasy-text text-2xl mb-8 max-w-3xl mx-auto">
              AI-powered tools to help you create amazing D&D campaigns, characters, and worlds.
            </p>
            
            <button
              onClick={handleMainAction}
              className="fantasy-button-primary"
            >
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Begin Your Quest
              </div>
            </button>
          </div>

          {/* Suggestions */}
          <div className="mb-12 flex flex-col items-center">
            <p className="fantasy-text text-lg font-medium mb-4 text-center">Choose your path, brave adventurer:</p>
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { name: 'Character Generator', path: '/dashboard/character-generator' },
                { name: 'NPC Generator', path: '/dashboard/npc-generator' },
                { name: 'World Builder', path: '/dashboard/world-lore-builder' },
                { name: 'Quest Creator', path: '/dashboard/quest-generator' },
                { name: 'Item Generator', path: '/dashboard/item-generator' }
              ].map((suggestion) => (
                <button
                  key={suggestion.name}
                  onClick={() => handleGeneratorClick(suggestion.path)}
                  className="fantasy-button-secondary"
                >
                  {suggestion.name}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Campaign Generator */}
          <div className="text-center">
            <div className="fantasy-card-featured">
              <h2 className="fantasy-title text-3xl font-bold mb-4">Forge Your Legendary Campaign</h2>
              <p className="fantasy-text text-xl mb-6">
                Summon complete D&D campaigns with AI-powered storytelling, unique characters, and immersive worlds.
              </p>
              <button
                onClick={() => handleGeneratorClick('/dashboard/campaign-generator')}
                className="fantasy-button-accent"
              >
                Begin the Adventure
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="fantasy-title text-4xl font-bold mb-4">
              What shall you create today?
            </h2>
            <p className="fantasy-text text-xl max-w-3xl mx-auto">
              From character creation to world building, our arcane tools help you craft 
              immersive campaigns with mystical ease.
            </p>
          </div>

          <div className="responsive-grid">
            <button
              onClick={() => handleGeneratorClick('/dashboard/character-generator')}
              className="fantasy-card"
            >
              <div className="fantasy-icon bg-blue-500">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="fantasy-title text-xl font-semibold mb-3">Character Generator</h3>
              <p className="fantasy-text">
                Forge detailed characters with balanced stats, backgrounds, and equipment.
              </p>
            </button>

            <button
              onClick={() => handleGeneratorClick('/dashboard/npc-generator')}
              className="fantasy-card"
            >
              <div className="fantasy-icon bg-green-500">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="fantasy-title text-xl font-semibold mb-3">NPC Generator</h3>
              <p className="fantasy-text">
                Summon memorable NPCs with personalities, motivations, and backstories.
              </p>
            </button>

            <button
              onClick={() => handleGeneratorClick('/dashboard/world-lore-builder')}
              className="fantasy-card"
            >
              <div className="fantasy-icon bg-purple-500">
                <Map className="w-6 h-6 text-white" />
              </div>
              <h3 className="fantasy-title text-xl font-semibold mb-3">World Lore Builder</h3>
              <p className="fantasy-text">
                Craft rich worlds with detailed lore, history, and geography.
              </p>
            </button>

            <button
              onClick={() => handleGeneratorClick('/dashboard/item-generator')}
              className="fantasy-card"
            >
              <div className="fantasy-icon bg-slate-600">
                <Sword className="w-6 h-6 text-white" />
              </div>
              <h3 className="fantasy-title text-xl font-semibold mb-3">Item Generator</h3>
              <p className="fantasy-text">
                Enchant unique weapons, armor, and magical items for your campaign.
              </p>
            </button>

            <button
              onClick={() => handleGeneratorClick('/dashboard/quest-generator')}
              className="fantasy-card"
            >
              <div className="fantasy-icon bg-red-500">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="fantasy-title text-xl font-semibold mb-3">Quest Builder</h3>
              <p className="fantasy-text">
                Design engaging quests with objectives, rewards, and branching paths.
              </p>
            </button>

            <button
              onClick={() => handleGeneratorClick('/dashboard/campaign-generator')}
              className="fantasy-card"
            >
              <div className="fantasy-icon bg-indigo-500">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h3 className="fantasy-title text-xl font-semibold mb-3">Campaign Generator</h3>
              <p className="fantasy-text">
                Weave complete campaigns with storylines, characters, and encounters.
              </p>
            </button>

            <button
              onClick={() => handleGeneratorClick('/dashboard/encounter-creator')}
              className="fantasy-card"
            >
              <div className="fantasy-icon bg-orange-500">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="fantasy-title text-xl font-semibold mb-3">Encounter Creator</h3>
              <p className="fantasy-text">
                Forge balanced encounters with appropriate challenges and rewards.
              </p>
            </button>
          </div>
        </div>
      </section>

      {/* Trust Indicator */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="fantasy-card-large">
            <h2 className="fantasy-title text-3xl font-bold mb-4">
              Ready to Forge Your Legend?
            </h2>
            <p className="fantasy-text text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of Dungeon Masters who are already using our arcane tools to create 
              unforgettable adventures for their players.
            </p>
            <Link 
              href="/register" 
              className="fantasy-button-primary"
            >
              Begin Your Journey
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="fantasy-footer py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="fantasy-logo mr-3"></div>
              <h3 className="fantasy-title text-2xl font-bold">D&D Master Tools</h3>
            </div>
            <p className="fantasy-text">
              © 2024 D&D Master Tools. All rights reserved.
            </p>
            <p className="fantasy-text-sm mt-2">
              Signed in the year of the Dragon, 1489 DR
            </p>
          </div>
        </div>
      </footer>

      {/* Custom CSS for Fantasy Theme */}
      <style jsx>{`
        .fantasy-bg {
          background: linear-gradient(rgba(244,232,208,0.95), rgba(228,207,171,0.95)), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="parchment" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="%23f4e8d0"/><circle cx="10" cy="10" r="1" fill="%23d4c4a8"/></pattern></defs><rect width="100" height="100" fill="url(%23parchment)"/></svg>');
          min-height: 100vh;
          position: relative;
        }
        .fantasy-overlay {
          background: linear-gradient(135deg, rgba(139,69,19,0.1) 0%, rgba(160,82,45,0.1) 100%);
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
        .fantasy-bg.fantasy-light {
          background: linear-gradient(rgba(244,232,208,0.95), rgba(228,207,171,0.95)), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="parchment" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="%23f4e8d0"/><circle cx="10" cy="10" r="1" fill="%23d4c4a8"/></pattern></defs><rect width="100" height="100" fill="url(%23parchment)"/></svg>');
        }
        .fantasy-bg.fantasy-dark {
          background: linear-gradient(rgba(26,26,26,0.97), rgba(31,31,31,0.97)), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><rect width="40" height="40" fill="%232a2a2a"/><circle cx="20" cy="20" r="2" fill="%23404040"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
        }
        .fantasy-title {
          color: #5D3A1A;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(255, 215, 0, 0.3);
          font-family: 'Cinzel', serif;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .fantasy-dark .fantasy-title {
          color: #f59e0b;
          text-shadow: 2px 2px 8px #000;
        }
        .fantasy-text {
          color: #2F1B14;
          font-family: 'Lora', serif;
          font-weight: 500;
          text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
          line-height: 1.6;
        }
        .fantasy-dark .fantasy-text {
          color: #f1f5f9;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
        }
        .fantasy-card {
          background: linear-gradient(135deg, rgba(244, 232, 208, 0.9), rgba(228, 207, 171, 0.9));
          border: 3px solid #8B4513;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 8px 16px rgba(139, 69, 19, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .fantasy-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(139, 69, 19, 0.4);
        }
        .fantasy-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="ornate" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M25,0 L30,20 L50,25 L30,30 L25,50 L20,30 L0,25 L20,20 Z" fill="%238B4513" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23ornate)"/></svg>');
          opacity: 0.3;
          pointer-events: none;
        }
        .fantasy-card-featured {
          background: linear-gradient(135deg, rgba(139, 69, 19, 0.9), rgba(160, 82, 45, 0.9));
          border: 4px solid #D2691E;
          border-radius: 20px;
          padding: 2.5rem;
          box-shadow: 0 12px 24px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .fantasy-card-featured::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="runes" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="3" fill="%23FFD700" opacity="0.2"/><path d="M20,10 L20,30 M10,20 L30,20" stroke="%23FFD700" stroke-width="1" opacity="0.3"/></pattern></defs><rect width="100" height="100" fill="url(%23runes)"/></svg>');
          opacity: 0.4;
          pointer-events: none;
        }
        .fantasy-card-featured:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 32px rgba(139, 69, 19, 0.5);
        }
        .fantasy-card-large {
          background: linear-gradient(135deg, rgba(244, 232, 208, 0.95), rgba(228, 207, 171, 0.95));
          border: 4px solid #8B4513;
          border-radius: 20px;
          padding: 3rem;
          box-shadow: 0 12px 32px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
          transition: all 0.4s ease;
        }
        .fantasy-card-large::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="scroll" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M10,10 L50,10 L50,50 L10,50 Z M15,15 L45,15 L45,45 L15,45 Z" fill="%238B4513" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23scroll)"/></svg>');
          opacity: 0.2;
          pointer-events: none;
        }
        .fantasy-card-large:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(139, 69, 19, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        .fantasy-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
          padding: 1rem;
        }
        .fantasy-footer {
          background: linear-gradient(135deg, #8B4513, #2F4F2F);
          border-top: 3px solid #CD853F;
          color: #FFF8DC;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
          font-family: 'Lora', serif;
          font-weight: 500;
          text-align: center;
          padding: 2rem 0;
        }
        .fantasy-logo {
          width: 60px;
          height: 60px;
          background: radial-gradient(circle, #FFD700, #DAA520);
          border: 3px solid #CD853F;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: 1.5rem;
          color: #8B4513;
          text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
        }
        .fantasy-text-sm {
          color: #A0522D;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  )
}

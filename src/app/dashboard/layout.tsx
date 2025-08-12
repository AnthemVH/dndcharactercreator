'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Shield, 
  Users, 
  Map, 
  Sword, 
  BookOpen, 
  Target, 
  LogOut,
  Menu,
  X,
  Coins,
  Archive,
  Scroll,
  Folder,
  Crown,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  MessageSquare
} from 'lucide-react'
import GenerationStatusPanel from '@/components/GenerationStatusPanel'
import UnitToggle from '@/components/UnitToggle'
// Removed duplicate FantasyNotification here; it's already included in `src/app/layout.tsx`

const tools = [
  { name: 'Campaign Generator', href: '/dashboard/campaign-generator', icon: Scroll },
  { name: 'Character Generator', href: '/dashboard/character-generator', icon: Shield },
  { name: 'NPC Generator', href: '/dashboard/npc-generator', icon: Users },
  { name: 'Item Generator', href: '/dashboard/item-generator', icon: Sword },
  { name: 'World Lore Builder', href: '/dashboard/world-lore-builder', icon: Map },
  { name: 'Quest Builder', href: '/dashboard/quest-builder', icon: BookOpen },
  { name: 'Encounter Creator', href: '/dashboard/encounter-creator', icon: Target },
]

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: Folder },
  { name: 'Tools', href: '#', icon: Crown, isCollapsible: true, children: tools },
  { name: 'Library', href: '/dashboard/library', icon: Archive },
  { name: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
  { name: 'Admin Feedback', href: '/dashboard/admin/feedback', icon: MessageSquare, adminOnly: true },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [fantasyMode, setFantasyMode] = useState('light')
  const [toolsExpanded, setToolsExpanded] = useState(false)
  const [userRole, setUserRole] = useState<string>('user')
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    // Get user role from session or API
    getUserRole()
  }, [])

  const getUserRole = async () => {
    try {
      console.log('🔍 Fetching user role...')
      
      // Use your existing auth system instead of NextAuth
      const response = await fetch('/api/auth/me', {
        credentials: 'include' // Include cookies
      })
      console.log('📡 Response status:', response.status)
      
      if (response.ok) {
        const user = await response.json()
        console.log('👤 User data received:', user)
        console.log('🎭 User role:', user.role)
        setUserRole(user.role || 'user')
      } else {
        console.error('❌ Failed to get user role:', response.status)
        // Fallback: try to get role from token
        const token = document.cookie.split('; ').find(row => row.startsWith('token='))
        if (token) {
          console.log('🔑 Token found, setting role to admin temporarily')
          setUserRole('admin')
        }
      }
    } catch (error) {
      console.error('💥 Error getting user role:', error)
      // Fallback: try to get role from token
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))
      if (token) {
        console.log('🔑 Token found, setting role to admin temporarily')
        setUserRole('admin')
      }
    }
  }

  const handleLogout = async () => {
    try {
      console.log('🔍 Logging out...')
      
      // Call the logout API
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        console.log('✅ Logout API successful')
      } else {
        console.log('⚠️ Logout API failed, clearing cookies anyway')
      }
      
      // Clear cookies on client side as fallback
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      // Redirect to home page
      window.location.href = '/'
      
    } catch (error) {
      console.error('💥 Logout error:', error)
      
      // Clear cookies on client side as fallback
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      // Redirect to home page anyway
      window.location.href = '/'
    }
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const renderNavigationItem = (item: typeof navigation[0]) => {
    // Skip admin-only items for non-admin users
    if (item.adminOnly && userRole !== 'admin') {
      console.log(`🚫 Skipping admin item "${item.name}" - userRole: ${userRole}`)
      return null
    }

    if (item.adminOnly) {
      console.log(`✅ Showing admin item "${item.name}" - userRole: ${userRole}`)
    }

    if (item.isCollapsible) {
      const hasActiveChild = item.children?.some((child: typeof tools[0]) => isActive(child.href))
      return (
        <div key={item.name}>
          <button
            onClick={() => setToolsExpanded(!toolsExpanded)}
            className={`group flex items-center justify-between w-full px-2 py-2 text-sm font-medium rounded-md transition-colors ${
              hasActiveChild ? 'fantasy-nav-active' : 'fantasy-nav'
            }`}
          >
            <div className="flex items-center">
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </div>
            {toolsExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {toolsExpanded && (
            <div className="ml-6 space-y-1">
              {item.children.map((child: typeof tools[0]) => {
                const isChildActive = isActive(child.href)
                return (
                  <Link
                    key={child.name}
                    href={child.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isChildActive ? 'fantasy-nav-active' : 'fantasy-nav'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <child.icon className="mr-3 h-4 w-4" />
                    {child.name}
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    const isItemActive = isActive(item.href)
    return (
      <Link
        key={item.name}
        href={item.href}
        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
          isItemActive ? 'fantasy-nav-active' : 'fantasy-nav'
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <item.icon className="mr-3 h-5 w-5" />
        {item.name}
      </Link>
    )
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen fantasy-bg fantasy-light">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-700"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen fantasy-bg ${fantasyMode === 'dark' ? 'fantasy-dark' : 'fantasy-light'}`}>
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-60" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-full max-w-xs flex-1 flex-col fantasy-sidebar pb-4 pt-5">
          <div className="absolute right-0 top-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-400"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-yellow-100" />
            </button>
          </div>
          <div className="flex flex-shrink-0 items-center px-4">
            <h1 className="fantasy-title text-xl font-bold">D&D Master Tools</h1>
          </div>
          <nav className="mt-5 h-full flex-1 space-y-1 px-2">
            {navigation.map((item) => renderNavigationItem(item))}
          </nav>
          <div className="border-t border-yellow-900 p-4">
            <button
              onClick={handleLogout}
              className="group flex items-center px-2 py-2 text-sm font-medium fantasy-nav w-full transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow fantasy-sidebar border-r border-yellow-900">
          <div className="flex items-center h-16 px-4 border-b border-yellow-900">
            <h1 className="fantasy-title text-xl font-bold">D&D Master Tools</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => renderNavigationItem(item))}
          </nav>
          <div className="border-t border-yellow-900 p-4">
            <button
              onClick={handleLogout}
              className="group flex items-center px-2 py-2 text-sm font-medium fantasy-nav w-full transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-yellow-900 fantasy-header px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 fantasy-nav lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <UnitToggle />
              <button
                aria-label="Toggle dark/light mode"
                className="fantasy-toggle"
                onClick={() => setFantasyMode(fantasyMode === 'dark' ? 'light' : 'dark')}
              >
                {fantasyMode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <Link
                href="/dashboard/tokens"
                className="text-sm font-medium fantasy-nav flex items-center transition-colors"
              >
                <Coins className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Tokens</span>
              </Link>
            </div>
          </div>
        </div>

        <main className="py-6 fantasy-main min-h-screen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Generation Status Panel */}
      <GenerationStatusPanel />

      {/* Notifications provided globally in `src/app/layout.tsx` */}

      {/* Fantasy Theme CSS */}
      <style jsx global>{`
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
        .fantasy-nav {
          color: #5D3A1A;
          background: none;
          font-family: 'Lora', serif;
          font-weight: 600;
          text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.6);
        }
        .fantasy-dark .fantasy-nav {
          color: #d1d5db;
          text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.8);
        }
        .fantasy-nav-active {
          background: linear-gradient(90deg, #D2691E 60%, #FFD700 100%);
          color: #fff;
          font-weight: bold;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
        }
        .fantasy-dark .fantasy-nav-active {
          background: linear-gradient(90deg, #404040 60%, #505050 100%);
          color: #f1f5f9;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
          border: 1px solid #606060;
        }
        .fantasy-sidebar {
          background: linear-gradient(135deg, #f4e8d0 80%, #d4c4a8 100%);
        }
        .fantasy-dark .fantasy-sidebar {
          background: linear-gradient(135deg, #1a1a1a 80%, #2a2a2a 100%);
        }
        .fantasy-header {
          background: linear-gradient(90deg, #f4e8d0 80%, #d4c4a8 100%);
        }
        .fantasy-dark .fantasy-header {
          background: linear-gradient(90deg, #2a2a2a 80%, #404040 100%);
        }
        .fantasy-main {
          background: none;
        }
        .fantasy-toggle {
          background: none;
          border: 2px solid #D2691E;
          border-radius: 9999px;
          padding: 0.5rem;
          color: #5D3A1A;
          margin-right: 0.5rem;
          transition: background 0.2s, color 0.2s;
          font-weight: 600;
        }
        .fantasy-toggle:hover {
          background: #FFD70022;
          color: #A0522D;
        }
        .fantasy-dark .fantasy-toggle {
          border-color: #f59e0b;
          color: #f59e0b;
        }
        .fantasy-dark .fantasy-toggle:hover {
          background: rgba(245, 158, 11, 0.2);
          color: #fbbf24;
        }
        .fantasy-card {
          background: linear-gradient(135deg, rgba(244, 232, 208, 0.95), rgba(228, 207, 171, 0.95));
          border: 3px solid #8B4513;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 8px 16px rgba(139, 69, 19, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .fantasy-dark .fantasy-card {
          background: linear-gradient(135deg, rgba(42, 42, 42, 0.95), rgba(47, 47, 47, 0.95));
          border: 3px solid #505050;
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
        .fantasy-input {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(244, 232, 208, 0.9));
          border: 2px solid #8B4513;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-family: 'Lora', serif;
          transition: all 0.3s ease;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .fantasy-input:focus {
          outline: none;
          border-color: #D2691E;
          box-shadow: 0 0 0 3px rgba(210, 105, 30, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .fantasy-dark .fantasy-input {
          background: linear-gradient(135deg, rgba(42, 42, 42, 0.9), rgba(47, 47, 47, 0.9));
          border: 2px solid #505050;
          color: #f1f5f9;
        }
        .fantasy-dark .fantasy-input:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2), inset 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .fantasy-button-primary {
          background: linear-gradient(135deg, #D2691E, #FFD700);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          font-family: 'Lora', serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 8px rgba(139, 69, 19, 0.3);
        }
        .fantasy-button-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(139, 69, 19, 0.4);
        }
        .fantasy-dark .fantasy-button-primary {
          background: linear-gradient(135deg, #404040, #505050);
          color: #f1f5f9;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        .fantasy-dark .fantasy-button-primary:hover {
          background: linear-gradient(135deg, #505050, #606060);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
        }
        .fantasy-button-secondary {
          background: linear-gradient(135deg, #8B4513, #CD853F);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          font-family: 'Lora', serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 8px rgba(139, 69, 19, 0.3);
        }
        .fantasy-button-secondary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(139, 69, 19, 0.4);
        }
        .fantasy-dark .fantasy-button-secondary {
          background: linear-gradient(135deg, #2a2a2a, #404040);
          color: #d1d5db;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        .fantasy-dark .fantasy-button-secondary:hover {
          background: linear-gradient(135deg, #404040, #505050);
          color: #f1f5f9;
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
        }
        .fantasy-button-accent {
          background: linear-gradient(135deg, #D2691E, #FFD700);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.75rem 1.5rem;
          font-family: 'Lora', serif;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 8px rgba(139, 69, 19, 0.3);
        }
        .fantasy-button-accent:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(139, 69, 19, 0.4);
        }
        .fantasy-dark .fantasy-button-accent {
          background: linear-gradient(135deg, #f59e0b, #fbbf24);
          color: #1a1a1a;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        .fantasy-dark .fantasy-button-accent:hover {
          background: linear-gradient(135deg, #fbbf24, #fcd34d);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Lora:wght@400;500;600&display=swap');
      `}</style>
    </div>
  )
}
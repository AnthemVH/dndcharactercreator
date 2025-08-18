'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react'

export interface NotificationConfig {
  id?: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number // in milliseconds, default 5000
  persistent?: boolean // if true, won't auto-hide
}

interface FantasyNotificationProps {
  notifications?: NotificationConfig[]
  onDismiss: (id: string) => void
}

export default function FantasyNotification({ notifications, onDismiss }: FantasyNotificationProps) {
  const getIcon = (type: NotificationConfig['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getStyles = (type: NotificationConfig['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {(notifications || []).map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
          getIcon={getIcon}
          getStyles={getStyles}
        />
      ))}
    </div>
  )
}

interface NotificationItemProps {
  notification: NotificationConfig
  onDismiss: (id: string) => void
  getIcon: (type: NotificationConfig['type']) => JSX.Element
  getStyles: (type: NotificationConfig['type']) => string
}

function NotificationItem({ notification, onDismiss, getIcon, getStyles }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    setIsVisible(true)

    // Auto-dismiss after duration (unless persistent)
    if (!notification.persistent) {
      const duration = notification.duration || 5000
      const timer = setTimeout(() => {
        handleDismiss()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleDismiss = () => {
    setIsVisible(false)
    // Wait for animation to complete before calling onDismiss
    setTimeout(() => {
      if (notification.id) {
        onDismiss(notification.id)
      }
    }, 300)
  }

  return (
    <div
      className={`
        ${getStyles(notification.type)}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        transform transition-all duration-300 ease-in-out
        border rounded-lg shadow-lg p-4 flex items-start gap-3
        backdrop-blur-sm
      `}
    >
      {getIcon(notification.type)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-5">
          {notification.message}
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationConfig[]>([])

  const addNotification = (config: Omit<NotificationConfig, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const notification: NotificationConfig = {
      ...config,
      id,
    }
    setNotifications(prev => [...prev, notification])
    return id
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  // Convenience methods
  const showSuccess = (message: string, duration?: number) => 
    addNotification({ message, type: 'success', duration })

  const showError = (message: string, persistent?: boolean) => 
    addNotification({ message, type: 'error', persistent })

  const showInfo = (message: string, duration?: number) => 
    addNotification({ message, type: 'info', duration })

  const showWarning = (message: string, duration?: number) => 
    addNotification({ message, type: 'warning', duration })

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  }
}
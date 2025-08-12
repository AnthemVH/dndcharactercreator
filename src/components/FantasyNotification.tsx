'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export interface NotificationProps {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  duration?: number
  onClose?: () => void
}

interface NotificationState extends NotificationProps {
  isVisible: boolean
}

// Create a global notification manager
class NotificationManager {
  private listeners: ((notifications: NotificationState[]) => void)[] = []
  private notifications: NotificationState[] = []
  private nextId = 1

  subscribe(listener: (notifications: NotificationState[]) => void) {
    this.listeners.push(listener)
    listener(this.notifications)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.notifications))
  }

  show(notification: Omit<NotificationProps, 'id'>) {
    const id = `notification-${this.nextId++}`
    const newNotification: NotificationState = {
      ...notification,
      id,
      isVisible: true,
      duration: notification.duration ?? 5000
    }

    this.notifications.push(newNotification)
    this.notify()

    // Auto-hide after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.hide(id)
      }, newNotification.duration)
    }
  }

  hide(id: string) {
    const notification = this.notifications.find(n => n.id === id)
    if (notification) {
      notification.isVisible = false
      this.notify()

      // Remove from array after animation
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n.id !== id)
        this.notify()
      }, 300)
    }
  }

  clear() {
    this.notifications = []
    this.notify()
  }
}

export const notificationManager = new NotificationManager()

// Hook to use notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationState[]>([])

  useEffect(() => {
    return notificationManager.subscribe(setNotifications)
  }, [])

  const showNotification = (notification: Omit<NotificationProps, 'id'>) => {
    notificationManager.show(notification)
  }

  const hideNotification = (id: string) => {
    notificationManager.hide(id)
  }

  return { notifications, showNotification, hideNotification }
}

// Individual notification component
const NotificationItem = ({ notification, onClose }: { notification: NotificationState; onClose: () => void }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-600 bg-green-50/20'
      case 'error':
        return 'border-red-600 bg-red-50/20'
      case 'warning':
        return 'border-yellow-600 bg-yellow-50/20'
      case 'info':
        return 'border-blue-600 bg-blue-50/20'
      default:
        return 'border-blue-600 bg-blue-50/20'
    }
  }

  return (
    <div
      className={`fantasy-card p-4 mb-4 border-2 ${getBorderColor()} transition-all duration-300 transform ${
        notification.isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="fantasy-title text-sm font-semibold mb-1">
            {notification.title}
          </h4>
          <p className="fantasy-text text-sm">
            {notification.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-gray-200/50 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </div>
  )
}

// Main notification container
export default function FantasyNotification() {
  const { notifications, hideNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full space-y-2">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </div>
  )
}

// Utility functions for easy usage
export const showSuccess = (title: string, message: string, duration?: number) => {
  notificationManager.show({ type: 'success', title, message, duration })
}

export const showError = (title: string, message: string, duration?: number) => {
  notificationManager.show({ type: 'error', title, message, duration })
}

export const showInfo = (title: string, message: string, duration?: number) => {
  notificationManager.show({ type: 'info', title, message, duration })
}

export const showWarning = (title: string, message: string, duration?: number) => {
  notificationManager.show({ type: 'warning', title, message, duration })
}

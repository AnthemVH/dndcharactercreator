'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Eye, CheckCircle, XCircle, Clock, Star, Filter, Search, Edit3, Trash2, Calendar, User, Mail } from 'lucide-react'
import { showSuccess, showError } from '@/components/FantasyNotification'

interface Feedback {
  id: string
  name: string
  email?: string
  feedbackType: string
  rating?: number
  message: string
  status: string
  adminNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
  updatedAt: string
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [updating, setUpdating] = useState(false)
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadFeedback()
  }, [])

  const loadFeedback = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/feedback')
      if (!response.ok) {
        throw new Error('Failed to load feedback')
      }
      const data = await response.json()
      setFeedback(data)
    } catch (error) {
      console.error('Error loading feedback:', error)
      showError('Error', 'Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  const updateFeedbackStatus = async (feedbackId: string, status: string, notes?: string) => {
    try {
      setUpdating(true)
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          adminNotes: notes || '',
          reviewedBy: 'Admin',
          reviewedAt: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update feedback')
      }

      await loadFeedback()
      setSelectedFeedback(null)
      setAdminNotes('')
      showSuccess('Success', 'Feedback status updated successfully')
    } catch (error) {
      console.error('Error updating feedback:', error)
      showError('Error', 'Failed to update feedback status')
    } finally {
      setUpdating(false)
    }
  }

  const deleteFeedback = async (feedbackId: string) => {
    if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/feedback/${feedbackId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete feedback')
      }

      await loadFeedback()
      showSuccess('Success', 'Feedback deleted successfully')
    } catch (error) {
      console.error('Error deleting feedback:', error)
      showError('Error', 'Failed to delete feedback')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'reviewed':
        return <Eye className="h-4 w-4 text-yellow-500" />
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  // Filter and search feedback
  const filteredFeedback = feedback
    .filter(item => {
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.feedbackType.toLowerCase().includes(searchQuery.toLowerCase())
      
      return matchesStatus && matchesSearch
    })
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen fantasy-main">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-700"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen fantasy-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="fantasy-title text-4xl font-bold mb-4 flex items-center justify-center">
              <MessageSquare className="h-10 w-10 mr-4 text-yellow-600" />
              Feedback Management
            </h1>
            <p className="fantasy-text text-xl">
              Review and manage user feedback submissions
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="fantasy-card text-center">
            <div className="text-3xl font-bold text-blue-600">{feedback.filter(f => f.status === 'new').length}</div>
            <div className="fantasy-text text-sm">New</div>
          </div>
          <div className="fantasy-card text-center">
            <div className="text-3xl font-bold text-yellow-600">{feedback.filter(f => f.status === 'reviewed').length}</div>
            <div className="fantasy-text text-sm">Reviewed</div>
          </div>
          <div className="text-3xl font-bold text-green-600">{feedback.filter(f => f.status === 'resolved').length}</div>
          <div className="fantasy-text text-sm">Resolved</div>
        </div>
        <div className="fantasy-card text-center">
          <div className="text-3xl font-bold text-gray-600">{feedback.filter(f => f.status === 'closed').length}</div>
          <div className="fantasy-text text-sm">Closed</div>
        </div>

        {/* Search and Filters */}
        <div className="fantasy-card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search feedback by name, email, message, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full fantasy-input pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full fantasy-input"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field as 'date' | 'name' | 'status')
                  setSortOrder(order as 'asc' | 'desc')
                }}
                className="w-full fantasy-input"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="status-asc">Status A-Z</option>
                <option value="status-desc">Status Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredFeedback.map((item) => (
            <div key={item.id} className="fantasy-card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusIcon(item.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <h3 className="fantasy-title text-lg font-semibold">{item.name}</h3>
                    </div>
                    {item.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="fantasy-text text-sm text-gray-600">{item.email}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-3">
                    <span className="fantasy-text text-sm bg-gray-100 px-2 py-1 rounded">
                      {item.feedbackType}
                    </span>
                    {item.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="fantasy-text text-sm">{item.rating}/5</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="fantasy-text text-sm mb-3">{item.message}</p>
                  
                  {item.adminNotes && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <div className="fantasy-text text-sm font-medium text-gray-700 mb-1">Admin Notes:</div>
                      <div className="fantasy-text text-sm text-gray-600">{item.adminNotes}</div>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedFeedback(item)
                      setAdminNotes(item.adminNotes || '')
                    }}
                    className="fantasy-button-secondary px-3 py-1 text-sm flex items-center"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Manage
                  </button>
                  <button
                    onClick={() => deleteFeedback(item.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-sm rounded flex items-center transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredFeedback.length === 0 && (
          <div className="fantasy-card text-center py-12">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="fantasy-text text-gray-500">
              {searchQuery || filterStatus !== 'all' 
                ? 'No feedback found with the selected filters.' 
                : 'No feedback found.'}
            </p>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-6 text-center">
          <p className="fantasy-text text-sm text-gray-600">
            Showing {filteredFeedback.length} of {feedback.length} feedback items
          </p>
        </div>
      </div>

      {/* Enhanced Feedback Management Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="fantasy-card max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="fantasy-title text-2xl mb-4">Manage Feedback</h3>
            
            {/* Feedback Details */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="fantasy-title text-lg mb-3">Feedback Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {selectedFeedback.name}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {selectedFeedback.email || 'Not provided'}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {selectedFeedback.feedbackType}
                </div>
                <div>
                  <span className="font-medium">Rating:</span> {selectedFeedback.rating ? `${selectedFeedback.rating}/5` : 'Not rated'}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">Message:</span>
                  <p className="mt-1 text-gray-600">{selectedFeedback.message}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="fantasy-text text-sm font-medium">Status:</label>
                <select
                  value={selectedFeedback.status}
                  onChange={(e) => setSelectedFeedback({...selectedFeedback, status: e.target.value})}
                  className="w-full fantasy-input mt-1"
                >
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              
              <div>
                <label className="fantasy-text text-sm font-medium">Admin Notes:</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this feedback..."
                  className="w-full fantasy-input mt-1 h-24"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => updateFeedbackStatus(selectedFeedback.id, selectedFeedback.status, adminNotes)}
                disabled={updating}
                className="fantasy-button-primary flex-1"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
              <button
                onClick={() => {
                  setSelectedFeedback(null)
                  setAdminNotes('')
                }}
                className="fantasy-button-secondary flex-1"
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

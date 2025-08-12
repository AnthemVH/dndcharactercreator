'use client'

import { useState } from 'react'
import { MessageSquare, Send, Star, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react'
import { showError, showSuccess, notificationManager } from '@/components/FantasyNotification'

interface FeedbackForm {
  name: string
  email: string
  feedbackType: string
  rating: number
  message: string
}

const feedbackTypes = [
  'General Feedback',
  'Bug Report',
  'Feature Request',
  'UI/UX Suggestion',
  'Performance Issue',
  'Other'
]

// Google Forms configuration
const GOOGLE_FORM_ID = '1FAIpQLSf5YEPDlCb-vYlcV-oWLCinu17bhmS6yQLzeI5pWGduTUBYTQ'

// Google Form field IDs from your form
const FORM_FIELDS = {
  NAME: 'entry.1496143859',
  EMAIL: 'entry.1381353611', 
  FEEDBACK_TYPE: 'entry.1665169655',
  RATING: 'entry.776649023',
  MESSAGE: 'entry.776649024'
}

export default function FeedbackPage() {
  const [form, setForm] = useState<FeedbackForm>({
    name: '',
    email: '',
    feedbackType: '',
    rating: 0,
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [validationErrors, setValidationErrors] = useState<Partial<FeedbackForm>>({})
  

  const validateForm = (): boolean => {
    const errors: Partial<FeedbackForm> = {}
    
    if (!form.name.trim()) {
      errors.name = 'Please enter your name'
    }
    
    if (!form.message.trim()) {
      errors.message = 'Please share your feedback or suggestion'
    }
    
    if (!form.feedbackType) {
      errors.feedbackType = 'Please select a feedback type'
    }
    
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof FeedbackForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showError('Validation Error', 'Please fix the errors below and try again.')
      return
    }

    setIsSubmitting(true)

    try {
      // Debug logging
      console.log('Submitting feedback:', form)
      console.log('Form ID:', GOOGLE_FORM_ID)
      console.log('Form Fields:', FORM_FIELDS)
      
      // Submit feedback to our API endpoint
      console.log('Submitting feedback to database...')
      
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          feedbackType: form.feedbackType,
          rating: form.rating || null,
          message: form.message.trim()
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Feedback submission result:', result)
      
      // Show success toast (corner notification)
      showSuccess('Thank you!', 'Your feedback has been submitted successfully.')
      
      // Reset form
      setForm({
        name: '',
        email: '',
        feedbackType: '',
        rating: 0,
        message: ''
      })
      setValidationErrors({})
      console.log('Form reset completed')
      
    } catch (error) {
      console.error('=== FEEDBACK SUBMISSION ERROR ===')
      console.error('Error details:', error)
      showError('Submission Failed', 'There was an error submitting your feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
      console.log('=== FEEDBACK SUBMISSION COMPLETED ===')
    }
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starNumber = index + 1
      const isFilled = starNumber <= (hoveredRating || form.rating)
      
      return (
        <button
          key={starNumber}
          type="button"
          className={`p-1 transition-all duration-200 ${
            isFilled ? 'text-yellow-500 scale-110' : 'text-gray-400 hover:text-yellow-300'
          }`}
          onMouseEnter={() => setHoveredRating(starNumber)}
          onMouseLeave={() => setHoveredRating(0)}
          onClick={() => handleInputChange('rating', starNumber)}
        >
          <Star className={`h-8 w-8 ${isFilled ? 'fill-current' : ''}`} />
        </button>
      )
    })
  }

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'Bug Report':
        return <AlertCircle className="h-4 w-4" />
      case 'Feature Request':
        return <ThumbsUp className="h-4 w-4" />
      case 'UI/UX Suggestion':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen fantasy-main">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="text-center">
            <h1 className="fantasy-title text-4xl font-bold mb-4 flex items-center justify-center">
              <MessageSquare className="h-10 w-10 mr-4 text-yellow-600" />
              Feedback & Suggestions
            </h1>
            <p className="fantasy-text text-xl">
              Help us improve D&D Master Tools! Share your thoughts, report bugs, or suggest new features.
            </p>
          </div>
        </div>

        {/* Custom Form */}
        <div className="fantasy-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name and Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block fantasy-text text-sm font-medium mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Your name"
                  className={`w-full fantasy-input fantasy-text ${
                    validationErrors.name ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
                {validationErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>
              <div>
                <label className="block fantasy-text text-sm font-medium mb-2">
                  Email (Optional)
                </label>
                <input
                  type="text"
                  value={form.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                  className={`w-full fantasy-input fantasy-text ${
                    validationErrors.email ? 'border-red-500 focus:border-red-500' : ''
                  }`}
                />
                {validationErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                )}
              </div>
            </div>

            {/* Feedback Type */}
            <div>
              <label className="block fantasy-text text-sm font-medium mb-2">
                Feedback Type *
              </label>
              <select
                value={form.feedbackType || ''}
                onChange={(e) => handleInputChange('feedbackType', e.target.value)}
                className={`w-full fantasy-input fantasy-text ${
                  validationErrors.feedbackType ? 'border-red-500 focus:border-red-500' : ''
                }`}
              >
                <option value="">Select feedback type</option>
                {feedbackTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {validationErrors.feedbackType && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.feedbackType}</p>
              )}
            </div>

            {/* Rating */}
            <div>
              <label className="block fantasy-text text-sm font-medium mb-2">
                Overall Rating (Optional)
              </label>
              <div className="flex items-center justify-center space-x-2">
                {renderStars()}
              </div>
              <p className="text-center fantasy-text text-sm mt-2">
                {form.rating > 0 ? `You rated us ${form.rating} out of 5 stars` : 'Click to rate'}
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="block fantasy-text text-sm font-medium mb-2">
                Your Feedback *
              </label>
              <textarea
                value={form.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Tell us what you think, what we can improve, or any issues you've encountered..."
                className={`w-full h-32 fantasy-input fantasy-text ${
                  validationErrors.message ? 'border-red-500 focus:border-red-500' : ''
                }`}
              />
              {validationErrors.message && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.message}</p>
              )}
            </div>

            {/* Quick Feedback Buttons */}
            <div className="border-t border-yellow-600 pt-6">
              <h3 className="fantasy-title text-lg font-semibold mb-4 text-center">
                Quick Feedback
              </h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  type="button"
                  onClick={() => handleInputChange('feedbackType', 'Feature Request')}
                  className="flex items-center px-4 py-2 fantasy-button-secondary rounded-lg transition-all hover:scale-105"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Love it!
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('feedbackType', 'Bug Report')}
                  className="flex items-center px-4 py-2 fantasy-button-secondary rounded-lg transition-all hover:scale-105"
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Found an issue
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('feedbackType', 'UI/UX Suggestion')}
                  className="flex items-center px-4 py-2 fantasy-button-secondary rounded-lg transition-all hover:scale-105"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  UI suggestion
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="text-center pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="fantasy-button-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Send className="h-5 w-5 mr-2" />
                    Submit Feedback
                  </div>
                )}
              </button>
              
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="fantasy-card text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <h3 className="fantasy-title text-lg font-semibold mb-2">We Listen</h3>
            <p className="fantasy-text text-sm">
              Every piece of feedback is reviewed and considered for future updates.
            </p>
          </div>
          <div className="fantasy-card text-center">
            <Star className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <h3 className="fantasy-title text-lg font-semibold mb-2">Continuous Improvement</h3>
            <p className="fantasy-text text-sm">
              Your suggestions help shape the future of D&D Master Tools.
            </p>
          </div>
          <div className="fantasy-card text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
            <h3 className="fantasy-title text-lg font-semibold mb-2">Bug Reports</h3>
            <p className="fantasy-text text-sm">
              Help us identify and fix issues to improve the user experience.
            </p>
          </div>
        </div>

        {/* Feedback Status */}
        {form.feedbackType && (
          <div className="mt-8 fantasy-card">
            <div className="flex items-center space-x-3 mb-4">
              {getFeedbackTypeIcon(form.feedbackType)}
              <h3 className="fantasy-title text-lg font-semibold">
                Feedback Preview
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Type:</span> {form.feedbackType}
              </div>
              {form.rating > 0 && (
                <div>
                  <span className="font-medium">Rating:</span> {form.rating}/5 stars
                </div>
              )}
              {form.name && (
                <div>
                  <span className="font-medium">From:</span> {form.name}
                </div>
              )}
              {form.email && (
                <div>
                  <span className="font-medium">Email:</span> {form.email}
                </div>
              )}
            </div>
            {form.message && (
              <div className="mt-3">
                <span className="font-medium">Message:</span>
                <p className="mt-1 fantasy-text text-sm bg-gray-100 dark:bg-gray-800 p-3 rounded">
                  {form.message}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      
    </div>
  )
}

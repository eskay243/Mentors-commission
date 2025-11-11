'use client'

import { useState, useEffect } from 'react'
import { X, User, Search, ArrowRight, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Mentor {
  id: string
  name: string | null
  email: string
  mentorProfile?: {
    expertise: string | null
    experience: string | null
  }
}

interface MentorReassignmentModalProps {
  isOpen: boolean
  onClose: () => void
  assignmentId: string
  currentMentor: {
    id: string
    name: string | null
    email: string
  }
  studentName: string
  courseTitle: string
  onReassignmentComplete: () => void
}

export default function MentorReassignmentModal({
  isOpen,
  onClose,
  assignmentId,
  currentMentor,
  studentName,
  courseTitle,
  onReassignmentComplete
}: MentorReassignmentModalProps) {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([])
  const [selectedMentorId, setSelectedMentorId] = useState('')
  const [action, setAction] = useState<'unassign' | 'reassign'>('reassign')
  const [loading, setLoading] = useState(false)
  const [fetchingMentors, setFetchingMentors] = useState(false)

  // Fetch mentors when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMentors()
    }
  }, [isOpen])

  // Filter mentors based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMentors(mentors.filter(mentor => mentor.id !== currentMentor.id))
    } else {
      const filtered = mentors.filter(mentor => {
        if (mentor.id === currentMentor.id) return false // Exclude current mentor
        
        const name = mentor.name?.toLowerCase() || ''
        const email = mentor.email.toLowerCase()
        const expertise = mentor.mentorProfile?.expertise?.toLowerCase() || ''
        const search = searchTerm.toLowerCase()
        
        return name.includes(search) || email.includes(search) || expertise.includes(search)
      })
      setFilteredMentors(filtered)
    }
  }, [searchTerm, mentors, currentMentor.id])

  const fetchMentors = async () => {
    setFetchingMentors(true)
    try {
      const response = await fetch('/api/users?role=MENTOR')
      if (response.ok) {
        const data = await response.json()
        setMentors(data)
      } else {
        toast.error('Failed to fetch mentors')
      }
    } catch (error) {
      toast.error('Failed to fetch mentors')
    } finally {
      setFetchingMentors(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (action === 'reassign' && !selectedMentorId) {
      toast.error('Please select a mentor to reassign to')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/assignments/${assignmentId}/reassign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          newMentorId: action === 'reassign' ? selectedMentorId : null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update assignment')
      }

      const successMessage = action === 'unassign' 
        ? 'Mentor unassigned successfully!' 
        : 'Mentor reassigned successfully!'
      
      toast.success(successMessage)
      onReassignmentComplete()
      onClose()
      
      // Reset form
      setAction('reassign')
      setSelectedMentorId('')
      setSearchTerm('')
    } catch (error: any) {
      toast.error(error.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const selectedMentor = mentors.find(mentor => mentor.id === selectedMentorId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {action === 'unassign' ? 'Unassign Mentor' : 'Reassign Mentor'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Assignment Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Current Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Student:</span>
                <p className="font-medium text-gray-900">{studentName}</p>
              </div>
              <div>
                <span className="text-gray-500">Course:</span>
                <p className="font-medium text-gray-900">{courseTitle}</p>
              </div>
              <div>
                <span className="text-gray-500">Current Mentor:</span>
                <p className="font-medium text-gray-900">{currentMentor.name}</p>
                <p className="text-gray-500">{currentMentor.email}</p>
              </div>
            </div>
          </div>

          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Action
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setAction('unassign')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  action === 'unassign'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <X className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Unassign Mentor</p>
                    <p className="text-sm text-gray-500">Remove mentor assignment</p>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setAction('reassign')}
                className={`p-4 border rounded-lg text-left transition-colors ${
                  action === 'reassign'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <ArrowRight className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Reassign Mentor</p>
                    <p className="text-sm text-gray-500">Assign to different mentor</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Mentor Selection (only for reassign) */}
          {action === 'reassign' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select New Mentor
              </label>
              
              {/* Search Input */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Search mentors by name, email, or expertise..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Mentor List */}
              <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {fetchingMentors ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading mentors...
                  </div>
                ) : filteredMentors.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? 'No mentors found matching your search' : 'No mentors available'}
                  </div>
                ) : (
                  filteredMentors.map((mentor) => (
                    <div
                      key={mentor.id}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedMentorId === mentor.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedMentorId(mentor.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{mentor.name || 'No Name'}</p>
                          <p className="text-sm text-gray-500">{mentor.email}</p>
                          {mentor.mentorProfile?.expertise && (
                            <p className="text-xs text-gray-400 mt-1">
                              Expertise: {mentor.mentorProfile.expertise}
                            </p>
                          )}
                        </div>
                        {selectedMentorId === mentor.id && (
                          <div className="text-blue-600">
                            <User className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Warning for Unassign */}
          {action === 'unassign' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Warning</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Unassigning this mentor will remove them from this student's course. 
                    This action cannot be undone and the student will need to be reassigned to a new mentor.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Selected Mentor Preview (for reassign) */}
          {action === 'reassign' && selectedMentor && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">New Assignment Preview</h4>
              <div className="flex items-center space-x-3">
                <div className="flex-1">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">{studentName}</span> will be assigned to{' '}
                    <span className="font-medium">{selectedMentor.name}</span> for{' '}
                    <span className="font-medium">{courseTitle}</span>
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (action === 'reassign' && !selectedMentorId)}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                action === 'unassign'
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              } ${loading || (action === 'reassign' && !selectedMentorId) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                'Processing...'
              ) : action === 'unassign' ? (
                'Unassign Mentor'
              ) : (
                'Reassign Mentor'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

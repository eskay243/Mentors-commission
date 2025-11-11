'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { Edit, Save, X, User, Target, BookOpen, Briefcase, Globe, Clock, GraduationCap, Heart } from 'lucide-react'

export default function StudentProfile() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    bio: '',
    goals: '',
    level: '',
    interests: '',
    education: '',
    currentJob: '',
    experience: '',
    timezone: '',
    availability: '',
    learningStyle: '',
    motivation: '',
  })

  useEffect(() => {
    if (session?.user?.role !== 'STUDENT') {
      router.push('/auth/signin')
      return
    }

    fetchProfile()
  }, [session, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/students/profile`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          bio: data.studentProfile?.bio || '',
          goals: data.studentProfile?.goals || '',
          level: data.studentProfile?.level || '',
          interests: data.studentProfile?.interests || '',
          education: data.studentProfile?.education || '',
          currentJob: data.studentProfile?.currentJob || '',
          experience: data.studentProfile?.experience || '',
          timezone: data.studentProfile?.timezone || '',
          availability: data.studentProfile?.availability || '',
          learningStyle: data.studentProfile?.learningStyle || '',
          motivation: data.studentProfile?.motivation || '',
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/students/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchProfile()
        setEditing(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (!session || session.user.role !== 'STUDENT') {
    return null
  }

  if (!profile) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading profile...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600">Tell us about yourself and your learning goals</p>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="btn btn-primary"
          >
            <Edit className="h-4 w-4 mr-2" />
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {editing ? (
          /* Edit Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                About You
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="bio" className="label">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    className="input"
                    placeholder="Tell us about yourself, your background, and what you're passionate about..."
                  />
                </div>

                <div>
                  <label htmlFor="motivation" className="label">
                    Why do you want to learn?
                  </label>
                  <textarea
                    id="motivation"
                    name="motivation"
                    rows={3}
                    value={formData.motivation}
                    onChange={handleChange}
                    className="input"
                    placeholder="What drives you to learn? What are your aspirations?"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="level" className="label">
                      Current Level
                    </label>
                    <select
                      id="level"
                      name="level"
                      value={formData.level}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="">Select your level</option>
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="learningStyle" className="label">
                      Learning Style
                    </label>
                    <select
                      id="learningStyle"
                      name="learningStyle"
                      value={formData.learningStyle}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="">Select your learning style</option>
                      <option value="VISUAL">Visual</option>
                      <option value="AUDITORY">Auditory</option>
                      <option value="KINESTHETIC">Hands-on</option>
                      <option value="READING">Reading</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Goals & Interests */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Goals & Interests
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="goals" className="label">
                    Learning Goals
                  </label>
                  <textarea
                    id="goals"
                    name="goals"
                    rows={3}
                    value={formData.goals}
                    onChange={handleChange}
                    className="input"
                    placeholder="What do you want to achieve? What skills do you want to develop?"
                  />
                </div>

                <div>
                  <label htmlFor="interests" className="label">
                    Areas of Interest
                  </label>
                  <input
                    type="text"
                    id="interests"
                    name="interests"
                    value={formData.interests}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., Web Development, Data Science, Mobile Apps, AI/ML"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Separate multiple interests with commas
                  </p>
                </div>
              </div>
            </div>

            {/* Background */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Background
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="education" className="label">
                    Education
                  </label>
                  <input
                    type="text"
                    id="education"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., BSc Computer Science, High School, Self-taught"
                  />
                </div>

                <div>
                  <label htmlFor="currentJob" className="label">
                    Current Job/Role
                  </label>
                  <input
                    type="text"
                    id="currentJob"
                    name="currentJob"
                    value={formData.currentJob}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., Software Developer, Student, Designer"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="experience" className="label">
                    Previous Experience
                  </label>
                  <textarea
                    id="experience"
                    name="experience"
                    rows={3}
                    value={formData.experience}
                    onChange={handleChange}
                    className="input"
                    placeholder="Tell us about any previous experience in tech or related fields..."
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Learning Preferences
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="availability" className="label">
                    Availability
                  </label>
                  <select
                    id="availability"
                    name="availability"
                    value={formData.availability}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select your availability</option>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="WEEKENDS">Weekends Only</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="timezone" className="label">
                    Timezone
                  </label>
                  <input
                    type="text"
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., GMT+1, EST, PST"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn btn-secondary"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            {/* Profile Summary */}
            <div className="card">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-2xl font-medium text-gray-700">
                      {profile.name?.charAt(0).toUpperCase() || profile.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
                  <p className="text-gray-600">{profile.email}</p>
                  {profile.studentProfile?.level && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 mt-2">
                      {profile.studentProfile.level}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.studentProfile?.bio && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About Me</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{profile.studentProfile.bio}</p>
              </div>
            )}

            {/* Goals & Motivation */}
            {(profile.studentProfile?.goals || profile.studentProfile?.motivation) && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Goals & Motivation
                </h3>
                <div className="space-y-3">
                  {profile.studentProfile?.goals && (
                    <div>
                      <h4 className="font-medium text-gray-900">Learning Goals:</h4>
                      <p className="text-gray-700">{profile.studentProfile.goals}</p>
                    </div>
                  )}
                  {profile.studentProfile?.motivation && (
                    <div>
                      <h4 className="font-medium text-gray-900">Motivation:</h4>
                      <p className="text-gray-700">{profile.studentProfile.motivation}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Interests & Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.studentProfile?.interests && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Heart className="h-5 w-5 mr-2" />
                    Areas of Interest
                  </h3>
                  <p className="text-gray-700">{profile.studentProfile.interests}</p>
                </div>
              )}

              {profile.studentProfile?.learningStyle && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    Learning Style
                  </h3>
                  <p className="text-gray-700">{profile.studentProfile.learningStyle}</p>
                </div>
              )}
            </div>

            {/* Background */}
            {(profile.studentProfile?.education || profile.studentProfile?.currentJob || profile.studentProfile?.experience) && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Background
                </h3>
                <div className="space-y-2">
                  {profile.studentProfile?.education && (
                    <div>
                      <span className="font-medium text-gray-700">Education: </span>
                      <span className="text-gray-600">{profile.studentProfile.education}</span>
                    </div>
                  )}
                  {profile.studentProfile?.currentJob && (
                    <div>
                      <span className="font-medium text-gray-700">Current Role: </span>
                      <span className="text-gray-600">{profile.studentProfile.currentJob}</span>
                    </div>
                  )}
                  {profile.studentProfile?.experience && (
                    <div>
                      <span className="font-medium text-gray-700">Experience: </span>
                      <span className="text-gray-600">{profile.studentProfile.experience}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Preferences */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.studentProfile?.availability && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Availability
                  </h3>
                  <p className="text-gray-700">{profile.studentProfile.availability}</p>
                </div>
              )}

              {profile.studentProfile?.timezone && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Timezone
                  </h3>
                  <p className="text-gray-700">{profile.studentProfile.timezone}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

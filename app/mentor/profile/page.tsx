'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { Edit, Save, X, User, Briefcase, Award, Globe, Link as LinkIcon, Clock, GraduationCap, Star, Languages } from 'lucide-react'

export default function MentorProfile() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    bio: '',
    expertise: '',
    experience: '',
    hourlyRate: '',
    availability: '',
    education: '',
    certifications: '',
    portfolioUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    timezone: '',
    languages: '',
  })

  useEffect(() => {
    if (session?.user?.role !== 'MENTOR') {
      router.push('/auth/signin')
      return
    }

    fetchProfile()
  }, [session, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/mentors/profile`)
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setFormData({
          bio: data.mentorProfile?.bio || '',
          expertise: data.mentorProfile?.expertise || '',
          experience: data.mentorProfile?.experience?.toString() || '',
          hourlyRate: data.mentorProfile?.hourlyRate?.toString() || '',
          availability: data.mentorProfile?.availability || '',
          education: data.mentorProfile?.education || '',
          certifications: data.mentorProfile?.certifications || '',
          portfolioUrl: data.mentorProfile?.portfolioUrl || '',
          linkedinUrl: data.mentorProfile?.linkedinUrl || '',
          githubUrl: data.mentorProfile?.githubUrl || '',
          timezone: data.mentorProfile?.timezone || '',
          languages: data.mentorProfile?.languages || '',
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
      const response = await fetch('/api/mentors/profile', {
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

  if (!session || session.user.role !== 'MENTOR') {
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
            <p className="text-gray-600">Manage your mentor profile and showcase your expertise</p>
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
                Basic Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="bio" className="label">
                    Bio *
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    required
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    className="input"
                    placeholder="Tell us about yourself, your teaching philosophy, and what makes you a great mentor..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="expertise" className="label">
                      Areas of Expertise *
                    </label>
                    <input
                      type="text"
                      id="expertise"
                      name="expertise"
                      required
                      value={formData.expertise}
                      onChange={handleChange}
                      className="input"
                      placeholder="e.g., React, Python, Machine Learning"
                    />
                  </div>

                  <div>
                    <label htmlFor="experience" className="label">
                      Years of Experience *
                    </label>
                    <input
                      type="number"
                      id="experience"
                      name="experience"
                      required
                      min="0"
                      value={formData.experience}
                      onChange={handleChange}
                      className="input"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label htmlFor="hourlyRate" className="label">
                      Hourly Rate (₦)
                    </label>
                    <input
                      type="number"
                      id="hourlyRate"
                      name="hourlyRate"
                      min="0"
                      step="100"
                      value={formData.hourlyRate}
                      onChange={handleChange}
                      className="input"
                      placeholder="5000"
                    />
                  </div>

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
                      <option value="">Select availability</option>
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="FREELANCE">Freelance</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Briefcase className="h-5 w-5 mr-2" />
                Professional Information
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
                    placeholder="e.g., BSc Computer Science, MIT"
                  />
                </div>

                <div>
                  <label htmlFor="certifications" className="label">
                    Certifications
                  </label>
                  <input
                    type="text"
                    id="certifications"
                    name="certifications"
                    value={formData.certifications}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., AWS Certified, Google Cloud Professional"
                  />
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

                <div>
                  <label htmlFor="languages" className="label">
                    Languages
                  </label>
                  <input
                    type="text"
                    id="languages"
                    name="languages"
                    value={formData.languages}
                    onChange={handleChange}
                    className="input"
                    placeholder="e.g., English, Spanish, French"
                  />
                </div>
              </div>
            </div>

            {/* Links */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <LinkIcon className="h-5 w-5 mr-2" />
                Professional Links
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="portfolioUrl" className="label">
                    Portfolio Website
                  </label>
                  <input
                    type="url"
                    id="portfolioUrl"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                    className="input"
                    placeholder="https://yourportfolio.com"
                  />
                </div>

                <div>
                  <label htmlFor="linkedinUrl" className="label">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    id="linkedinUrl"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    className="input"
                    placeholder="https://linkedin.com/in/yourname"
                  />
                </div>

                <div>
                  <label htmlFor="githubUrl" className="label">
                    GitHub Profile
                  </label>
                  <input
                    type="url"
                    id="githubUrl"
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleChange}
                    className="input"
                    placeholder="https://github.com/yourname"
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
                  {profile.mentorProfile?.rating && (
                    <div className="flex items-center mt-2">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-600">
                        {profile.mentorProfile.rating.toFixed(1)} rating
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.mentorProfile?.bio && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About Me</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{profile.mentorProfile.bio}</p>
              </div>
            )}

            {/* Expertise & Experience */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Expertise
                </h3>
                <p className="text-gray-700">{profile.mentorProfile?.expertise || 'Not specified'}</p>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Experience
                </h3>
                <p className="text-gray-700">
                  {profile.mentorProfile?.experience ? `${profile.mentorProfile.experience} years` : 'Not specified'}
                </p>
              </div>
            </div>

            {/* Professional Details */}
            {(profile.mentorProfile?.education || profile.mentorProfile?.certifications) && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Education & Certifications
                </h3>
                <div className="space-y-2">
                  {profile.mentorProfile?.education && (
                    <div>
                      <span className="font-medium text-gray-700">Education: </span>
                      <span className="text-gray-600">{profile.mentorProfile.education}</span>
                    </div>
                  )}
                  {profile.mentorProfile?.certifications && (
                    <div>
                      <span className="font-medium text-gray-700">Certifications: </span>
                      <span className="text-gray-600">{profile.mentorProfile.certifications}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Links */}
            {(profile.mentorProfile?.portfolioUrl || profile.mentorProfile?.linkedinUrl || profile.mentorProfile?.githubUrl) && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <LinkIcon className="h-5 w-5 mr-2" />
                  Professional Links
                </h3>
                <div className="space-y-2">
                  {profile.mentorProfile?.portfolioUrl && (
                    <div>
                      <a href={profile.mentorProfile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                        Portfolio Website
                      </a>
                    </div>
                  )}
                  {profile.mentorProfile?.linkedinUrl && (
                    <div>
                      <a href={profile.mentorProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                        LinkedIn Profile
                      </a>
                    </div>
                  )}
                  {profile.mentorProfile?.githubUrl && (
                    <div>
                      <a href={profile.mentorProfile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-800">
                        GitHub Profile
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Additional Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {profile.mentorProfile?.availability && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Availability
                  </h3>
                  <p className="text-gray-700">{profile.mentorProfile.availability}</p>
                </div>
              )}

              {profile.mentorProfile?.timezone && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Timezone
                  </h3>
                  <p className="text-gray-700">{profile.mentorProfile.timezone}</p>
                </div>
              )}

              {profile.mentorProfile?.languages && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Languages className="h-5 w-5 mr-2" />
                    Languages
                  </h3>
                  <p className="text-gray-700">{profile.mentorProfile.languages}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

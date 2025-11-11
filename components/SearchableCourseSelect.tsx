'use client'

import { useState, useEffect, useRef } from 'react'
import { BookOpen, Search, X, Check } from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string | null
  price: number
  duration: number
  level: string
  category: string
}

interface SearchableCourseSelectProps {
  courses: Course[]
  selectedCourseId: string
  onCourseSelect: (courseId: string) => void
  onCourseChange?: (course: Course | null) => void
  required?: boolean
  placeholder?: string
}

export default function SearchableCourseSelect({
  courses,
  selectedCourseId,
  onCourseSelect,
  onCourseChange,
  required = false,
  placeholder = "Search courses..."
}: SearchableCourseSelectProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(courses)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter courses based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCourses(courses)
    } else {
      const filtered = courses.filter(course => {
        const title = course.title.toLowerCase()
        const description = course.description?.toLowerCase() || ''
        const level = course.level.toLowerCase()
        const category = course.category.toLowerCase()
        const search = searchTerm.toLowerCase()
        
        return title.includes(search) || 
               description.includes(search) || 
               level.includes(search) || 
               category.includes(search)
      })
      setFilteredCourses(filtered)
    }
  }, [searchTerm, courses])

  // Get selected course
  const selectedCourse = courses.find(course => course.id === selectedCourseId)

  // Handle course selection
  const handleCourseSelect = (course: Course) => {
    onCourseSelect(course.id)
    setSearchTerm(selectedCourse ? selectedCourse.title : '')
    setIsOpen(false)
    
    // Call the onCourseChange callback if provided
    if (onCourseChange) {
      onCourseChange(course)
    }
  }

  // Handle clear selection
  const handleClear = () => {
    onCourseSelect('')
    setSearchTerm('')
    setIsOpen(false)
    
    // Call the onCourseChange callback if provided
    if (onCourseChange) {
      onCourseChange(null)
    }
  }

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true)
    if (selectedCourse) {
      setSearchTerm('')
    }
  }

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setIsOpen(true)
  }

  // Handle input key down
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm(selectedCourse ? selectedCourse.title : '')
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm(selectedCourse ? selectedCourse.title : '')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedCourse])

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <BookOpen className="h-4 w-4 inline mr-1" />
        Select Course *
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          required={required}
          className="block w-full pl-10 pr-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleInputKeyDown}
        />
        
        {selectedCourse && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={handleClear}
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {filteredCourses.length === 0 ? (
            <div className="px-4 py-2 text-gray-500 text-center">
              No courses found
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div
                key={course.id}
                className="cursor-pointer select-none relative py-3 px-3 hover:bg-primary-50 hover:text-primary-900"
                onClick={() => handleCourseSelect(course)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {course.title}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                          {course.level}
                        </span>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
                          {course.category}
                        </span>
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-full">
                          {course.duration} days
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        ₦{course.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {selectedCourseId === course.id && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                      <Check className="h-4 w-4 text-primary-600" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <p className="mt-1 text-sm text-gray-500">
        {courses.length} courses available
        {selectedCourse && (
          <span className="ml-2 text-primary-600">
            • {selectedCourse.title} selected
          </span>
        )}
      </p>
    </div>
  )
}

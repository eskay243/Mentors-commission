'use client'

import { useState, useEffect, useRef } from 'react'
import { Users, Search, X, Check } from 'lucide-react'

interface Student {
  id: string
  name: string | null
  email: string
  studentProfile?: {
    level: string | null
    goals: string | null
  }
}

interface SearchableStudentSelectProps {
  students: Student[]
  selectedStudentId: string
  onStudentSelect: (studentId: string) => void
  required?: boolean
  placeholder?: string
}

export default function SearchableStudentSelect({
  students,
  selectedStudentId,
  onStudentSelect,
  required = false,
  placeholder = "Search students..."
}: SearchableStudentSelectProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [filteredStudents, setFilteredStudents] = useState<Student[]>(students)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter students based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStudents(students)
    } else {
      const filtered = students.filter(student => {
        const name = student.name?.toLowerCase() || ''
        const email = student.email.toLowerCase()
        const level = student.studentProfile?.level?.toLowerCase() || ''
        const search = searchTerm.toLowerCase()
        
        return name.includes(search) || email.includes(search) || level.includes(search)
      })
      setFilteredStudents(filtered)
    }
  }, [searchTerm, students])

  // Get selected student
  const selectedStudent = students.find(student => student.id === selectedStudentId)

  // Handle student selection
  const handleStudentSelect = (student: Student) => {
    onStudentSelect(student.id)
    setSearchTerm(selectedStudent ? `${selectedStudent.name || selectedStudent.email}` : '')
    setIsOpen(false)
  }

  // Handle clear selection
  const handleClear = () => {
    onStudentSelect('')
    setSearchTerm('')
    setIsOpen(false)
  }

  // Handle input focus
  const handleInputFocus = () => {
    setIsOpen(true)
    if (selectedStudent) {
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
      setSearchTerm(selectedStudent ? `${selectedStudent.name || selectedStudent.email}` : '')
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm(selectedStudent ? `${selectedStudent.name || selectedStudent.email}` : '')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [selectedStudent])

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <Users className="h-4 w-4 inline mr-1" />
        Select Student *
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
        
        {selectedStudent && (
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
          {filteredStudents.length === 0 ? (
            <div className="px-4 py-2 text-gray-500 text-center">
              No students found
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-primary-50 hover:text-primary-900"
                onClick={() => handleStudentSelect(student)}
              >
                <div className="flex items-center">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {student.name || 'No Name'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {student.email}
                      {student.studentProfile?.level && (
                        <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {student.studentProfile.level}
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedStudentId === student.id && (
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
        {students.length} students available
        {selectedStudent && (
          <span className="ml-2 text-primary-600">
            • {selectedStudent.name || selectedStudent.email} selected
          </span>
        )}
      </p>
    </div>
  )
}

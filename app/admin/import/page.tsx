'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { Upload, FileText, Download, AlertCircle, CheckCircle, X, Users, BookOpen, DollarSign } from 'lucide-react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

interface ImportResult {
  success: boolean
  message: string
  data?: any[]
  errors?: string[]
  duplicates?: number
  duplicateDetails?: string[]
  courseSuggestions?: any[]
}

interface ImportPreview {
  totalRows: number
  validRows: number
  invalidRows: number
  preview: any[]
  errors: string[]
}

export default function AdminImport() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Wait for session to load
  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (status === 'unauthenticated' || !session || session.user.role !== 'ADMIN') {
    router.push('/auth/signin')
    return null
  }

  const parseFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        const data = event.target?.result

        if (file.name.endsWith('.csv')) {
          Papa.parse(data as string, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              resolve(results.data)
            },
            error: (error) => {
              reject(error)
            },
          })
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(worksheet)
          resolve(json)
        } else {
          reject(new Error('Unsupported file type'))
        }
      }

      reader.onerror = (error) => {
        reject(error)
      }

      reader.readAsBinaryString(file)
    })
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setImportResult(null)
      setPreview(null)
      setShowPreview(false)
    }
  }

  const handlePreview = async () => {
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/import/preview', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const result = await response.json()
      
      if (response.ok) {
        setPreview(result)
        setShowPreview(true)
      } else {
        setImportResult({
          success: false,
          message: result.error || 'Failed to preview file',
          errors: result.errors || []
        })
      }
    } catch (error) {
      console.error('Error previewing file:', error)
      setImportResult({
        success: false,
        message: 'Failed to preview file',
        errors: ['Network error occurred']
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    try {
      // Parse the file first to get the data
      const parsedData = await parseFile(file)
      
      const response = await fetch('/api/admin/import/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(parsedData),
      })

      const result = await response.json()
      
      if (response.ok) {
        let message = `Successfully imported ${result.imported} students`
        if (result.duplicates > 0) {
          message += ` (${result.duplicates} duplicates skipped)`
        }
        if (result.errors > 0) {
          message += ` (${result.errors} errors)`
        }
        
        setImportResult({
          success: true,
          message: message,
          data: result.data,
          duplicates: result.duplicates,
          duplicateDetails: result.duplicateDetails || [],
          errors: result.errorDetails || []
        })
        setShowPreview(false)
        setFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setImportResult({
          success: false,
          message: result.error || 'Failed to import students',
          errors: result.errors || []
        })
      }
    } catch (error) {
      console.error('Error importing file:', error)
      setImportResult({
        success: false,
        message: 'Failed to import students',
        errors: ['Network error occurred']
      })
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const templateData = [
      {
        'NAME': 'John Doe',
        'EMAIL': 'john.doe@example.com',
        'PHONE': '+234 800 000 0000',
        'COURSE': 'FRONTEND DEVELOPMENT',
        'ONBOARDING_DATE': '2025-01-15',
        'COURSE_STATUS': 'PENDING',
        'AMOUNT_PAID': '300000',
        'PAYMENT_STATUS': 'PENDING',
        'GOALS': 'Learn React and become a frontend developer',
        'LEVEL': 'BEGINNER',
        'INTERESTS': 'Web Development, UI/UX',
        'EDUCATION': 'Computer Science',
        'CURRENT_JOB': 'Student',
        'EXPERIENCE': 'No previous experience',
        'TIMEZONE': 'GMT+1',
        'AVAILABILITY': 'FULL_TIME',
        'LEARNING_STYLE': 'VISUAL',
        'MOTIVATION': 'Want to start a career in tech'
      }
    ]

    const csvContent = [
      Object.keys(templateData[0]).join(','),
      ...templateData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'student_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'PENDING': 'bg-red-100 text-red-800',
      'ON-GOING': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800'
    }
    return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Import Students</h1>
          <p className="text-gray-600">Bulk import students from CSV or Excel files</p>
        </div>

        {/* Instructions */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Import Instructions
          </h2>
          <div className="space-y-3">
            <p className="text-gray-700">
              You can import students using CSV or Excel files. The file should contain the following columns:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {[
                'NAME', 'EMAIL', 'PHONE', 'COURSE',
                'ONBOARDING_DATE', 'COURSE_STATUS', 'AMOUNT_PAID', 'PAYMENT_STATUS',
                'GOALS', 'LEVEL', 'INTERESTS', 'EDUCATION',
                'CURRENT_JOB', 'EXPERIENCE', 'TIMEZONE', 'AVAILABILITY',
                'LEARNING_STYLE', 'MOTIVATION'
              ].map((column) => (
                <span key={column} className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {column}
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={downloadTemplate}
                className="btn btn-secondary"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </button>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload File
          </h2>
          
          <div className="space-y-4">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="input"
              />
            </div>

            {file && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="h-4 w-4 mr-2" />
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </div>
                <button
                  onClick={handlePreview}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Processing...' : 'Preview Import'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        {showPreview && preview && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Import Preview
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{preview.totalRows}</div>
                <div className="text-sm text-blue-800">Total Rows</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{preview.validRows}</div>
                <div className="text-sm text-green-800">Valid Rows</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{preview.invalidRows}</div>
                <div className="text-sm text-red-800">Invalid Rows</div>
              </div>
            </div>

            {preview.errors.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-red-800 mb-2">Errors Found:</h3>
                <div className="bg-red-50 p-3 rounded-lg">
                  <ul className="text-sm text-red-700 space-y-1">
                    {preview.errors.map((error, index) => (
                      <li key={index} className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.preview.slice(0, 10).map((row, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-sm text-gray-900">{row.NAME}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{row.EMAIL}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">{row.COURSE}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(row.COURSE_STATUS)}`}>
                          {row.COURSE_STATUS}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">₦{parseInt(row.AMOUNT_PAID || '0').toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.preview.length > 10 && (
              <p className="text-sm text-gray-500 mt-2">
                Showing first 10 rows of {preview.preview.length} total rows
              </p>
            )}

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowPreview(false)}
                className="btn btn-secondary"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={loading || preview.validRows === 0}
                className="btn btn-primary"
              >
                <Upload className="h-4 w-4 mr-2" />
                {loading ? 'Importing...' : `Import ${preview.validRows} Students`}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {importResult && (
          <div className="card">
            <div className={`flex items-center ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              <h2 className="text-lg font-semibold">
                {importResult.success ? 'Import Successful' : 'Import Failed'}
              </h2>
            </div>
            
            <div className="mt-4">
              <p className={`${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {importResult.message}
              </p>
              
              {importResult.duplicates && importResult.duplicates > 0 && (
                <div className="mt-3">
                  <h3 className="font-medium text-yellow-800 mb-2">Duplicates Found ({importResult.duplicates}):</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {importResult.duplicateDetails?.slice(0, 10).map((duplicate, index) => (
                      <li key={index} className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {duplicate}
                      </li>
                    ))}
                    {importResult.duplicates > 10 && (
                      <li className="text-yellow-600">• ... and {importResult.duplicates - 10} more duplicates</li>
                    )}
                  </ul>
                </div>
              )}
              
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-3">
                  <h3 className="font-medium text-red-800 mb-2">Errors:</h3>
                  <ul className="text-sm text-red-700 space-y-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {importResult.courseSuggestions && importResult.courseSuggestions.length > 0 && (
                <div className="mt-3">
                  <h3 className="font-medium text-blue-800 mb-2">Course Assignment Suggestions ({importResult.courseSuggestions.length}):</h3>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700 mb-3">
                      The following students have course suggestions from your import data. You can manually assign them to courses later.
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-blue-200">
                        <thead className="bg-blue-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase">Student</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase">Suggested Course</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase">Amount</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-blue-800 uppercase">Payment Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-blue-200">
                          {importResult.courseSuggestions.slice(0, 10).map((suggestion, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 text-sm text-gray-900">
                                <div>{suggestion.studentName}</div>
                                <div className="text-xs text-gray-500">{suggestion.studentEmail}</div>
                              </td>
                              <td className="px-3 py-2 text-sm text-blue-900 font-medium">{suggestion.suggestedCourse}</td>
                              <td className="px-3 py-2 text-sm text-gray-900">₦{suggestion.amountPaid.toLocaleString()}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  suggestion.paymentStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {suggestion.paymentStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importResult.courseSuggestions.length > 10 && (
                      <p className="text-sm text-blue-600 mt-2">
                        Showing first 10 of {importResult.courseSuggestions.length} suggestions
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

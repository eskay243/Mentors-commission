import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    let data: any[] = []
    let errors: string[] = []

    try {
      // Determine file type and parse accordingly
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      
      if (fileExtension === 'csv') {
        // Parse CSV file
        const csvText = new TextDecoder().decode(buffer)
        const result = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim().toUpperCase()
        })
        
        if (result.errors.length > 0) {
          errors.push(...result.errors.map(err => `Row ${err.row}: ${err.message}`))
        }
        
        data = result.data
      } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
        // Parse Excel file
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        
        // Convert to JSON with header transformation
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        if (jsonData.length < 2) {
          errors.push('File must contain at least a header row and one data row')
          return NextResponse.json({ error: 'Invalid file format', errors }, { status: 400 })
        }
        
        const headers = (jsonData[0] as string[]).map(h => h.trim().toUpperCase())
        const rows = jsonData.slice(1) as any[][]
        
        data = rows.map(row => {
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = row[index] || ''
          })
          return obj
        })
      } else {
        return NextResponse.json({ error: 'Unsupported file format. Please use CSV or Excel files.' }, { status: 400 })
      }

      // Validate data structure
      const requiredColumns = ['NAME', 'EMAIL'] // Only NAME and EMAIL are required now
      const allColumns = Object.keys(data[0] || {})
      const missingColumns = requiredColumns.filter(col => !allColumns.includes(col))
      
      if (missingColumns.length > 0) {
        errors.push(`Missing required columns: ${missingColumns.join(', ')}`)
      }

      // Validate each row
      const validRows: any[] = []
      const invalidRows: any[] = []
      
      data.forEach((row, index) => {
        const rowErrors: string[] = []
        
        // Required field validation
        if (!row.NAME || row.NAME.trim() === '') {
          rowErrors.push('Name is required')
        }
        
        if (!row.EMAIL || row.EMAIL.trim() === '') {
          rowErrors.push('Email is required')
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.EMAIL)) {
          rowErrors.push('Invalid email format')
        }
        
        // Course is optional now - just warn if missing
        if (!row.COURSE || row.COURSE.trim() === '') {
          // Don't add as error, just note that course assignment will need to be done manually
        }
        
        // Validate amounts
        if (row.AMOUNT_PAID && isNaN(parseFloat(row.AMOUNT_PAID))) {
          rowErrors.push('Amount paid must be a valid number')
        }
        
        // Validate dates
        if (row.ONBOARDING_DATE && isNaN(Date.parse(row.ONBOARDING_DATE))) {
          rowErrors.push('Invalid onboarding date format')
        }
        
        // Validate status fields
        const validCourseStatuses = ['PENDING', 'ON-GOING', 'COMPLETED']
        if (row.COURSE_STATUS && !validCourseStatuses.includes(row.COURSE_STATUS.toUpperCase())) {
          rowErrors.push('Invalid course status. Must be PENDING, ON-GOING, or COMPLETED')
        }
        
        const validPaymentStatuses = ['PENDING', 'COMPLETED']
        if (row.PAYMENT_STATUS && !validPaymentStatuses.includes(row.PAYMENT_STATUS.toUpperCase())) {
          rowErrors.push('Invalid payment status. Must be PENDING or COMPLETED')
        }
        
        if (rowErrors.length === 0) {
          validRows.push(row)
        } else {
          invalidRows.push({ row: index + 1, data: row, errors: rowErrors })
          errors.push(`Row ${index + 2}: ${rowErrors.join(', ')}`)
        }
      })

      return NextResponse.json({
        totalRows: data.length,
        validRows: validRows.length,
        invalidRows: invalidRows.length,
        preview: validRows.slice(0, 20), // Show first 20 valid rows
        errors: errors.slice(0, 50) // Limit errors to first 50
      })

    } catch (parseError) {
      console.error('Error parsing file:', parseError)
      return NextResponse.json({ 
        error: 'Error parsing file. Please check the file format and try again.',
        errors: ['File parsing failed']
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in import preview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

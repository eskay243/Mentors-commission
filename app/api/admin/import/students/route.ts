import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse JSON data from request body
    const data: any[] = await request.json()

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 })
    }

    try {
      // Get all existing users to avoid duplicates
      const existingUsers = await prisma.user.findMany({
        select: { email: true }
      })
      const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()))

      const importedStudents = []
      const errors = []
      const duplicates = []
      const courseSuggestions = [] // Track course suggestions for admin

      console.log(`Processing ${data.length} rows for import`)

      // Helper function to safely get string value
      const getStringValue = (value: any): string | null => {
        if (value === null || value === undefined) return null
        return String(value).trim() || null
      }

      for (let i = 0; i < data.length; i++) {
        const row = data[i]
        
        try {
          // Validate required fields (only NAME and EMAIL are required now)
          const name = getStringValue(row.NAME)
          const email = getStringValue(row.EMAIL)
          const course = getStringValue(row.COURSE)

          if (!name || !email) {
            errors.push(`Row ${i + 2}: Missing required fields (NAME, EMAIL)`)
            continue
          }

          // Check for duplicate email
          if (existingEmails.has(email.toLowerCase())) {
            duplicates.push(`Row ${i + 2}: Email ${email} already exists`)
            continue
          }

          // Create user (no password field needed with NextAuth.js)
          const user = await prisma.user.create({
            data: {
              name: name,
              email: email.toLowerCase(),
              role: 'STUDENT',
              phone: getStringValue(row.PHONE),
              address: getStringValue(row.ADDRESS),
            }
          })

          // Create student profile (simplified to avoid validation errors)
          try {
            await prisma.studentProfile.create({
              data: {
                userId: user.id,
                bio: getStringValue(row.BIO),
                goals: getStringValue(row.GOALS),
                level: getStringValue(row.LEVEL),
                interests: getStringValue(row.INTERESTS),
                education: getStringValue(row.EDUCATION),
                currentJob: getStringValue(row.CURRENT_JOB),
                experience: getStringValue(row.EXPERIENCE),
                timezone: getStringValue(row.TIMEZONE),
                availability: getStringValue(row.AVAILABILITY),
                learningStyle: getStringValue(row.LEARNING_STYLE),
                motivation: getStringValue(row.MOTIVATION),
              }
            })
            console.log(`✅ Created profile for user ${user.email}`)
          } catch (profileError: any) {
            console.error(`❌ Error creating profile for user ${user.email}:`, profileError.message)
            // Continue even if profile creation fails
          }

          // Track course suggestion for admin if course was provided
          if (course) {
            courseSuggestions.push({
              studentName: user.name,
              studentEmail: user.email,
              suggestedCourse: course,
              amountPaid: parseFloat(getStringValue(row.AMOUNT_PAID) || '0'),
              paymentStatus: getStringValue(row.PAYMENT_STATUS) || 'PENDING',
              onboardingDate: getStringValue(row.ONBOARDING_DATE)
            })
          }

          importedStudents.push({
            name: user.name,
            email: user.email,
            suggestedCourse: course || 'Not specified',
            amountPaid: parseFloat(getStringValue(row.AMOUNT_PAID) || '0'),
            paymentStatus: getStringValue(row.PAYMENT_STATUS) || 'PENDING'
          })

          // Add email to existing set to prevent duplicates in same import
          existingEmails.add(user.email.toLowerCase())

        } catch (error) {
          console.error(`Error importing row ${i + 2}:`, error)
          errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      console.log(`Import completed: ${importedStudents.length} imported, ${duplicates.length} duplicates, ${errors.length} errors`)

      return NextResponse.json({
        success: true,
        imported: importedStudents.length,
        total: data.length,
        duplicates: duplicates.length,
        errors: errors.slice(0, 50), // Limit errors
        duplicateDetails: duplicates.slice(0, 20), // Show first 20 duplicates
        errorDetails: errors.slice(0, 20), // Show first 20 errors
        courseSuggestions: courseSuggestions, // Include course suggestions
        data: importedStudents
      })

    } catch (parseError) {
      console.error('Error parsing file:', parseError)
      return NextResponse.json({ 
        error: 'Error parsing file',
        errors: ['File parsing failed']
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in student import:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
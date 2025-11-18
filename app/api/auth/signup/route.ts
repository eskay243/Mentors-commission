import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { withRateLimit, sanitizeRequestBody } from '@/lib/middleware'
import { strictRateLimit } from '@/lib/rateLimit'
import { sanitizeString, sanitizeEmail, sanitizePhone } from '@/lib/sanitize'

export async function POST(request: NextRequest) {
  return withRateLimit(request, async (req) => {
    try {
      const body = await req.json()
      const sanitizedBody = sanitizeRequestBody(body)
      const { name, email, password, role, phone } = sanitizedBody
      
      // Sanitize inputs
      const sanitizedName = sanitizeString(name)
      const sanitizedEmail = sanitizeEmail(email)
      const sanitizedPhone = phone ? sanitizePhone(phone) : undefined

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: sanitizedEmail }
      })

      if (existingUser) {
        return NextResponse.json(
          { message: 'User already exists' },
          { status: 400 }
        )
      }

      // Validate password
      if (!password || password.length < 6) {
        return NextResponse.json(
          { message: 'Password must be at least 6 characters' },
          { status: 400 }
        )
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user
      const user = await prisma.user.create({
        data: {
          name: sanitizedName,
          email: sanitizedEmail,
          password: hashedPassword,
          role: sanitizeString(role),
          phone: sanitizedPhone,
        }
      })

      // Create profile based on role
      if (user.role === 'MENTOR') {
        await prisma.mentorProfile.create({
          data: {
            userId: user.id,
            bio: '',
            expertise: '',
            experience: 0,
          }
        })
      } else if (user.role === 'STUDENT') {
        await prisma.studentProfile.create({
          data: {
            userId: user.id,
            goals: '',
            level: 'Beginner',
          }
        })
      }

      return NextResponse.json(
        { message: 'User created successfully', user: { id: user.id, email: user.email, role: user.role } },
        { status: 201 }
      )
    } catch (error) {
      console.error('Signup error:', error)
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      )
    }
  }, strictRateLimit)
}

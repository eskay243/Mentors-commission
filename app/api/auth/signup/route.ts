import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, phone } = await request.json()

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        phone,
        // Note: In a real app, you'd store the hashed password
        // For demo purposes, we'll skip password storage
      }
    })

    // Create profile based on role
    if (role === 'MENTOR') {
      await prisma.mentorProfile.create({
        data: {
          userId: user.id,
          bio: '',
          expertise: '',
          experience: 0,
        }
      })
    } else if (role === 'STUDENT') {
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
}

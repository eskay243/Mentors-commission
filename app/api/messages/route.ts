import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withRateLimit, sanitizeRequestBody } from '@/lib/middleware'
import { strictRateLimit } from '@/lib/rateLimit'
import { sanitizeString } from '@/lib/sanitize'
import { sendEmail, emailTemplates } from '@/lib/email'

export async function POST(request: NextRequest) {
  return withRateLimit(request, async (req) => {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const body = await req.json()
      const sanitizedBody = sanitizeRequestBody(body)
      const { receiverId, content } = sanitizedBody
      
      // Additional sanitization for message content
      const sanitizedContent = sanitizeString(content)

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      )
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
    })

    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      )
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: sanitizeString(receiverId),
        content: sanitizedContent,
      },
      include: {
        sender: true,
        receiver: true,
      },
    })

    // Send email notification to receiver
    try {
      if (message.receiver.email) {
        const template = emailTemplates.newMessage(
          message.sender.name || message.sender.email,
          sanitizedContent.substring(0, 100) // First 100 chars as preview
        )
        await sendEmail({
          to: message.receiver.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        })
      }
    } catch (emailError) {
      console.error('Error sending message email:', emailError)
      // Don't fail the message if email fails
    }

      return NextResponse.json(message, { status: 201 })
    } catch (error) {
      console.error('Error creating message:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }, strictRateLimit)
}

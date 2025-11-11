import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all users the current user has messaged with or received messages from
    const conversations = await prisma.$queryRaw`
      SELECT DISTINCT
        CASE 
          WHEN senderId = ${session.user.id} THEN receiverId
          ELSE senderId
        END as userId,
        CASE 
          WHEN senderId = ${session.user.id} THEN receiver.name
          ELSE sender.name
        END as userName,
        CASE 
          WHEN senderId = ${session.user.id} THEN receiver.email
          ELSE sender.email
        END as userEmail
      FROM Message
      JOIN User sender ON Message.senderId = sender.id
      JOIN User receiver ON Message.receiverId = receiver.id
      WHERE senderId = ${session.user.id} OR receiverId = ${session.user.id}
    ` as Array<{ userId: string; userName: string; userEmail: string }>

    // Get last message and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: session.user.id, receiverId: conv.userId },
              { senderId: conv.userId, receiverId: session.user.id },
            ],
          },
          include: {
            sender: true,
            receiver: true,
          },
          orderBy: { createdAt: 'desc' },
        })

        const unreadCount = await prisma.message.count({
          where: {
            senderId: conv.userId,
            receiverId: session.user.id,
            read: false,
          },
        })

        return {
          userId: conv.userId,
          userName: conv.userName,
          userEmail: conv.userEmail,
          lastMessage,
          unreadCount,
        }
      })
    )

    // Sort by last message time
    conversationsWithDetails.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0
      if (!a.lastMessage) return 1
      if (!b.lastMessage) return -1
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    })

    return NextResponse.json(conversationsWithDetails)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

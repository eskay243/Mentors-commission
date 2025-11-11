import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// PUT /api/assignments/[id]/reassign - Reassign or unassign mentor
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  const { action, newMentorId } = await request.json()

  try {
    // Get the current assignment
    const currentAssignment = await prisma.mentorAssignment.findUnique({
      where: { id },
      include: {
        mentor: true,
        student: true,
        course: true,
        enrollment: true,
      },
    })

    if (!currentAssignment) {
      return NextResponse.json({ message: 'Assignment not found' }, { status: 404 })
    }

    // Check if there are any payments associated with this assignment
    const existingPayments = await prisma.payment.count({
      where: { assignmentId: id },
    })

    if (existingPayments > 0 && action === 'unassign') {
      return NextResponse.json(
        { 
          message: 'Cannot unassign mentor with existing payments. Please handle payments first.' 
        },
        { status: 400 }
      )
    }

    if (action === 'unassign') {
      // Delete the assignment
      await prisma.mentorAssignment.delete({
        where: { id },
      })

      return NextResponse.json({ 
        message: 'Mentor unassigned successfully',
        action: 'unassigned'
      })
    } 
    
    if (action === 'reassign') {
      if (!newMentorId) {
        return NextResponse.json({ message: 'New mentor ID is required' }, { status: 400 })
      }

      // Verify the new mentor exists and is a MENTOR
      const newMentor = await prisma.user.findFirst({
        where: { 
          id: newMentorId,
          role: 'MENTOR'
        },
      })

      if (!newMentor) {
        return NextResponse.json({ message: 'Invalid mentor selected' }, { status: 400 })
      }

      // Check if the new mentor is already assigned to this enrollment
      const existingAssignment = await prisma.mentorAssignment.findFirst({
        where: {
          mentorId: newMentorId,
          enrollmentId: currentAssignment.enrollmentId,
        },
      })

      if (existingAssignment) {
        return NextResponse.json(
          { message: 'This mentor is already assigned to this student for this course' },
          { status: 400 }
        )
      }

      // Update the assignment with new mentor
      const updatedAssignment = await prisma.mentorAssignment.update({
        where: { id },
        data: {
          mentorId: newMentorId,
          // Reset status to ACTIVE when reassigning
          status: 'ACTIVE',
        },
        include: {
          mentor: true,
          student: true,
          course: true,
          enrollment: true,
        },
      })

      return NextResponse.json({ 
        message: 'Mentor reassigned successfully',
        assignment: updatedAssignment,
        action: 'reassigned'
      })
    }

    return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

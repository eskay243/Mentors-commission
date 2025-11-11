import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { discountCode, enrollmentId, coursePrice } = body

    if (!discountCode || !enrollmentId || !coursePrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Find the discount
    const discount = await prisma.discount.findUnique({
      where: { code: discountCode.toUpperCase() },
    })

    if (!discount) {
      return NextResponse.json(
        { error: 'Invalid discount code' },
        { status: 404 }
      )
    }

    // Check if discount is active
    const now = new Date()
    
    if (!discount.isActive) {
      return NextResponse.json(
        { error: 'Discount code is not active' },
        { status: 400 }
      )
    }

    // Check if discount has expired
    if (discount.endDate && discount.endDate < now) {
      return NextResponse.json(
        { error: 'Discount code has expired' },
        { status: 400 }
      )
    }

    // Check if discount has started
    if (discount.startDate && discount.startDate > now) {
      return NextResponse.json(
        { error: 'Discount code is not yet active' },
        { status: 400 }
      )
    }

    // Check usage limit
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return NextResponse.json(
        { error: 'Discount code usage limit reached' },
        { status: 400 }
      )
    }

    // Check minimum amount
    if (discount.minAmount && coursePrice < discount.minAmount) {
      return NextResponse.json(
        { error: `Minimum order amount of ₦${discount.minAmount} required` },
        { status: 400 }
      )
    }

    // Check if already applied to this enrollment
    const existingApplication = await prisma.discountApplication.findUnique({
      where: {
        discountId_enrollmentId: {
          discountId: discount.id,
          enrollmentId: enrollmentId,
        },
      },
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: 'Discount code already applied to this enrollment' },
        { status: 400 }
      )
    }

    // Calculate discount amount
    let discountAmount = 0
    
    if (discount.type === 'PERCENTAGE') {
      discountAmount = (coursePrice * discount.value) / 100
      if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
        discountAmount = discount.maxDiscount
      }
    } else {
      discountAmount = discount.value
      if (discountAmount > coursePrice) {
        discountAmount = coursePrice
      }
    }

    const finalAmount = coursePrice - discountAmount

    // Apply discount in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create discount application
      const application = await tx.discountApplication.create({
        data: {
          discountId: discount.id,
          enrollmentId: enrollmentId,
          amount: discountAmount,
          appliedBy: session.user.id,
        },
      })

      // Update discount usage count
      await tx.discount.update({
        where: { id: discount.id },
        data: { usedCount: { increment: 1 } },
      })

      // Update enrollment with discounted amount
      const updatedEnrollment = await tx.enrollment.update({
        where: { id: enrollmentId },
        data: { totalAmount: finalAmount },
      })

      return {
        application,
        updatedEnrollment,
        discountAmount,
        finalAmount,
      }
    })

    return NextResponse.json({
      success: true,
      discountAmount,
      finalAmount,
      discount: {
        code: discount.code,
        name: discount.name,
        termsAndConditions: discount.termsAndConditions,
      },
      enrollment: result.updatedEnrollment,
    })
  } catch (error) {
    console.error('Error applying discount:', error)
    return NextResponse.json(
      { error: 'Failed to apply discount' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { enrollmentId } = body

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'Missing enrollment ID' },
        { status: 400 }
      )
    }

    // Find the discount application
    const application = await prisma.discountApplication.findFirst({
      where: { enrollmentId },
      include: { discount: true, enrollment: true },
    })

    if (!application) {
      return NextResponse.json(
        { error: 'No discount applied to this enrollment' },
        { status: 404 }
      )
    }

    // Remove discount in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete discount application
      await tx.discountApplication.delete({
        where: { id: application.id },
      })

      // Update discount usage count
      await tx.discount.update({
        where: { id: application.discountId },
        data: { usedCount: { decrement: 1 } },
      })

      // Restore original enrollment amount
      const originalAmount = application.enrollment.totalAmount + application.amount
      const updatedEnrollment = await tx.enrollment.update({
        where: { id: enrollmentId },
        data: { totalAmount: originalAmount },
      })

      return updatedEnrollment
    })

    return NextResponse.json({
      success: true,
      enrollment: result,
    })
  } catch (error) {
    console.error('Error removing discount:', error)
    return NextResponse.json(
      { error: 'Failed to remove discount' },
      { status: 500 }
    )
  }
}

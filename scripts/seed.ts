import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seed...')

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@edtech.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@edtech.com',
      role: 'ADMIN',
      phone: '+1-555-0100',
    },
  })

  // Create mentor user
  const mentor = await prisma.user.upsert({
    where: { email: 'mentor@edtech.com' },
    update: {},
    create: {
      name: 'John Mentor',
      email: 'mentor@edtech.com',
      role: 'MENTOR',
      phone: '+1-555-0101',
    },
  })

  // Create mentor profile
  await prisma.mentorProfile.upsert({
    where: { userId: mentor.id },
    update: {},
    create: {
      userId: mentor.id,
      bio: 'Experienced software engineer with 5+ years in web development. Passionate about teaching and mentoring students.',
      expertise: 'JavaScript, React, Node.js, TypeScript',
      experience: 5,
      rating: 4.8,
    },
  })

  // Create student user
  const student = await prisma.user.upsert({
    where: { email: 'student@edtech.com' },
    update: {},
    create: {
      name: 'Jane Student',
      email: 'student@edtech.com',
      role: 'STUDENT',
      phone: '+1-555-0102',
    },
  })

  // Create student profile
  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      goals: 'Learn full-stack web development and build real-world projects',
      level: 'Beginner',
    },
  })

  // Create courses
  const course1 = await prisma.course.upsert({
    where: { id: 'course-1' },
    update: {},
    create: {
      id: 'course-1',
      title: 'Full-Stack Web Development',
      description: 'Learn to build modern web applications with React, Node.js, and databases',
      price: 150000.00,
      duration: 90,
      createdById: admin.id,
    },
  })

  const course2 = await prisma.course.upsert({
    where: { id: 'course-2' },
    update: {},
    create: {
      id: 'course-2',
      title: 'Advanced React Patterns',
      description: 'Master advanced React concepts, hooks, and performance optimization',
      price: 100000.00,
      duration: 60,
      createdById: admin.id,
    },
  })

  // Create enrollment
  const enrollment = await prisma.enrollment.upsert({
    where: { id: 'enrollment-1' },
    update: {},
    create: {
      id: 'enrollment-1',
      studentId: student.id,
      courseId: course1.id,
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      totalAmount: course1.price,
      paidAmount: 0,
    },
  })

  // Create mentor assignment
  await prisma.mentorAssignment.upsert({
    where: { id: 'assignment-1' },
    update: {},
    create: {
      id: 'assignment-1',
      mentorId: mentor.id,
      studentId: student.id,
      courseId: course1.id,
      enrollmentId: enrollment.id,
      commission: 37.0,
      status: 'ACTIVE',
    },
  })

  // Create sample payment
  await prisma.payment.upsert({
    where: { id: 'payment-1' },
    update: {},
    create: {
      id: 'payment-1',
      enrollmentId: enrollment.id,
      assignmentId: 'assignment-1',
      amount: 75000.00,
      mentorCommission: 27750.00, // 37% of 75000
      platformFee: 2250.00, // 3% of 75000
      status: 'COMPLETED',
      stripePaymentId: 'pi_demo_1234567890',
      description: 'First installment for Full-Stack Web Development course',
      payerId: student.id,
      paidAt: new Date(),
    },
  })

  // Create sample messages
  await prisma.message.upsert({
    where: { id: 'message-1' },
    update: {},
    create: {
      id: 'message-1',
      senderId: student.id,
      receiverId: mentor.id,
      content: 'Hello! I\'m excited to start learning with you. When should we schedule our first session?',
      read: false,
    },
  })

  await prisma.message.upsert({
    where: { id: 'message-2' },
    update: {},
    create: {
      id: 'message-2',
      senderId: mentor.id,
      receiverId: student.id,
      content: 'Hi Jane! Great to meet you. Let\'s schedule our first session for this Friday at 2 PM. Does that work for you?',
      read: true,
    },
  })

  console.log('Database seeded successfully!')
  console.log('Created:')
  console.log('- Admin:', admin.email)
  console.log('- Mentor:', mentor.email)
  console.log('- Student:', student.email)
  console.log('- Courses:', course1.title, course2.title)
  console.log('- Enrollment and assignment created')
  console.log('- Sample payment and messages created')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

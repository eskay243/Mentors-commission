import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCourses() {
  try {
    console.log('Seeding courses...')

    const courses = [
      {
        title: 'FRONTEND DEVELOPMENT',
        description: 'Learn modern frontend development with React, HTML, CSS, and JavaScript',
        price: 300000,
        duration: 90,
        level: 'BEGINNER',
        category: 'Web Development',
        isActive: true,
      },
      {
        title: 'DATA ANALYSIS',
        description: 'Master data analysis with Python, SQL, and statistical methods',
        price: 250000,
        duration: 120,
        level: 'INTERMEDIATE',
        category: 'Data Science',
        isActive: true,
      },
      {
        title: 'WEB DESIGN',
        description: 'Learn UI/UX design principles and modern design tools',
        price: 150000,
        duration: 60,
        level: 'BEGINNER',
        category: 'Design',
        isActive: true,
      },
      {
        title: 'DIGITAL MARKETING',
        description: 'Comprehensive digital marketing course covering SEO, social media, and analytics',
        price: 200000,
        duration: 75,
        level: 'BEGINNER',
        category: 'Marketing',
        isActive: true,
      },
      {
        title: 'BACKEND DEVELOPMENT',
        description: 'Learn server-side development with Node.js, Python, and databases',
        price: 350000,
        duration: 120,
        level: 'INTERMEDIATE',
        category: 'Web Development',
        isActive: true,
      },
      {
        title: 'MOBILE APP DEVELOPMENT',
        description: 'Build mobile apps with React Native and Flutter',
        price: 400000,
        duration: 150,
        level: 'INTERMEDIATE',
        category: 'Mobile Development',
        isActive: true,
      },
    ]

    // Get the first admin user to be the creator
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (!admin) {
      console.log('No admin user found. Please create an admin user first.')
      return
    }

    for (const courseData of courses) {
      const existingCourse = await prisma.course.findFirst({
        where: { title: courseData.title }
      })

      if (!existingCourse) {
        await prisma.course.create({
          data: {
            ...courseData,
            createdById: admin.id,
          }
        })
        console.log(`Created course: ${courseData.title}`)
      } else {
        console.log(`Course already exists: ${courseData.title}`)
      }
    }

    console.log('Courses seeded successfully!')
  } catch (error) {
    console.error('Error seeding courses:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCourses()

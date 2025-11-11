import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testEnrollmentFix() {
  console.log('🧪 Testing Enrollment Payment Fix...\n')

  // Test the enrollment that was having issues
  const enrollmentId = 'cmfvovj9v001vifuio58csuch'
  
  console.log('📋 Before Fix:')
  const beforeEnrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { payments: true, student: true, course: true }
  })

  if (!beforeEnrollment) {
    console.log('❌ Enrollment not found')
    return
  }

  const beforePaidAmount = beforeEnrollment.payments.reduce((sum, payment) => sum + payment.amount, 0)
  console.log(`   Enrollment.paidAmount: ₦${beforeEnrollment.paidAmount}`)
  console.log(`   Payment records total: ₦${beforePaidAmount}`)
  console.log(`   Payment records count: ${beforeEnrollment.payments.length}`)
  console.log(`   Consistency: ${Math.abs(beforeEnrollment.paidAmount - beforePaidAmount) < 0.01 ? '✅ CONSISTENT' : '❌ INCONSISTENT'}`)

  console.log('\n🔧 Simulating enrollment update to ₦80,000...')
  
  // Simulate what the API will do when you update the enrollment
  const newPaidAmount = 80000
  const currentPaidAmount = beforePaidAmount
  const difference = newPaidAmount - currentPaidAmount

  console.log(`   Current payment total: ₦${currentPaidAmount}`)
  console.log(`   New paid amount: ₦${newPaidAmount}`)
  console.log(`   Difference: ₦${difference}`)

  if (difference > 0) {
    console.log(`   ✅ Will create payment record for ₦${difference}`)
  } else if (difference < 0) {
    console.log(`   ✅ Will adjust payment records`)
  } else {
    console.log(`   ✅ No payment changes needed`)
  }

  console.log('\n📊 Expected Result After Fix:')
  console.log(`   Enrollment.paidAmount: ₦${newPaidAmount}`)
  console.log(`   Payment records total: ₦${newPaidAmount}`)
  console.log(`   Payment records count: ${difference > 0 ? beforeEnrollment.payments.length + 1 : (difference < 0 ? 1 : beforeEnrollment.payments.length)}`)
  console.log(`   Remaining Amount: ₦${beforeEnrollment.totalAmount - newPaidAmount}`)
  console.log(`   Consistency: ✅ CONSISTENT`)

  console.log('\n🎯 How to Test:')
  console.log('1. Go to the enrollment edit page')
  console.log('2. Change "Amount Paid" to 80000')
  console.log('3. Save the changes')
  console.log('4. Check both the enrollment list and detail views')
  console.log('5. Both should now show ₦80,000 as the paid amount')
  console.log('6. Remaining amount should show ₦70,000')
}

testEnrollmentFix()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

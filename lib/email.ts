/**
 * Email notification service
 * Supports multiple email providers (SendGrid, Resend, Nodemailer)
 */

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

/**
 * Send an email using the configured provider
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_SERVER_HOST || !process.env.EMAIL_FROM) {
      console.warn('Email not configured, skipping email send')
      return false
    }

    // Use Resend if configured
    if (process.env.RESEND_API_KEY) {
      return await sendWithResend(options)
    }

    // Use SendGrid if configured
    if (process.env.SENDGRID_API_KEY) {
      return await sendWithSendGrid(options)
    }

    // Fallback to Nodemailer/SMTP
    return await sendWithSMTP(options)
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

/**
 * Send email using Resend
 */
async function sendWithResend(options: EmailOptions): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Resend error:', error)
    return false
  }
}

/**
 * Send email using SendGrid
 */
async function sendWithSendGrid(options: EmailOptions): Promise<boolean> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        from: { email: process.env.EMAIL_FROM },
        personalizations: [
          {
            to: [{ email: options.to }],
            subject: options.subject,
          },
        ],
        content: [
          {
            type: 'text/html',
            value: options.html,
          },
        ],
      }),
    })

    return response.ok
  } catch (error) {
    console.error('SendGrid error:', error)
    return false
  }
}

/**
 * Send email using SMTP (Nodemailer)
 */
async function sendWithSMTP(options: EmailOptions): Promise<boolean> {
  // This would require nodemailer package
  // For now, just log that it would be sent
  console.log('SMTP email would be sent:', {
    to: options.to,
    subject: options.subject,
  })
  return false
}

/**
 * Email templates
 */
export const emailTemplates = {
  paymentReceived: (studentName: string, amount: number, courseName: string) => ({
    subject: 'Payment Received - Thank You!',
    html: `
      <h2>Payment Received</h2>
      <p>Hello ${studentName},</p>
      <p>We have received your payment of ₦${amount.toLocaleString()} for the course: <strong>${courseName}</strong>.</p>
      <p>Thank you for your payment!</p>
      <p>Best regards,<br>The EdTech Team</p>
    `,
    text: `Payment Received\n\nHello ${studentName},\n\nWe have received your payment of ₦${amount.toLocaleString()} for the course: ${courseName}.\n\nThank you for your payment!\n\nBest regards,\nThe EdTech Team`,
  }),

  enrollmentConfirmed: (studentName: string, courseName: string) => ({
    subject: 'Enrollment Confirmed',
    html: `
      <h2>Enrollment Confirmed</h2>
      <p>Hello ${studentName},</p>
      <p>Your enrollment in <strong>${courseName}</strong> has been confirmed!</p>
      <p>You can now access your course materials and start learning.</p>
      <p>Best regards,<br>The EdTech Team</p>
    `,
    text: `Enrollment Confirmed\n\nHello ${studentName},\n\nYour enrollment in ${courseName} has been confirmed!\n\nYou can now access your course materials and start learning.\n\nBest regards,\nThe EdTech Team`,
  }),

  newMessage: (senderName: string, messagePreview: string) => ({
    subject: `New Message from ${senderName}`,
    html: `
      <h2>New Message</h2>
      <p>You have received a new message from <strong>${senderName}</strong>:</p>
      <p>${messagePreview}</p>
      <p><a href="${process.env.NEXTAUTH_URL}/student/messages">View Message</a></p>
      <p>Best regards,<br>The EdTech Team</p>
    `,
    text: `New Message\n\nYou have received a new message from ${senderName}:\n\n${messagePreview}\n\nView message: ${process.env.NEXTAUTH_URL}/student/messages\n\nBest regards,\nThe EdTech Team`,
  }),

  mentorAssigned: (studentName: string, mentorName: string, courseName: string) => ({
    subject: 'Mentor Assigned',
    html: `
      <h2>Mentor Assigned</h2>
      <p>Hello ${studentName},</p>
      <p>We have assigned <strong>${mentorName}</strong> as your mentor for the course: <strong>${courseName}</strong>.</p>
      <p>You can now start communicating with your mentor through the messaging system.</p>
      <p>Best regards,<br>The EdTech Team</p>
    `,
    text: `Mentor Assigned\n\nHello ${studentName},\n\nWe have assigned ${mentorName} as your mentor for the course: ${courseName}.\n\nYou can now start communicating with your mentor through the messaging system.\n\nBest regards,\nThe EdTech Team`,
  }),
}


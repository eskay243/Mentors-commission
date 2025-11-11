# EdTech Payment Platform

A comprehensive web application for edtech companies to manage student onboarding, mentor assignments, and automated commission tracking with a 37% mentor commission rate.

## Features

### 🎓 Student Module
- Student dashboard with course progress tracking
- Mentor assignment and communication
- Payment history and invoice management
- Real-time messaging with mentors

### 👨‍🏫 Mentor Module
- Mentor dashboard with assigned students
- Payment tracking and commission overview
- Student progress monitoring
- Communication tools

### ⚙️ Admin Module
- Complete user management (students, mentors, admins)
- Course creation and management
- Mentor-student assignment system
- Payment monitoring and reporting
- System-wide analytics

### 💰 Payment System
- Automated 37% mentor commission calculation
- Split payment support
- Payment status tracking
- Invoice generation

### 💬 Messaging System
- Real-time messaging between students and mentors
- Conversation management
- Message read receipts

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (easily switchable to PostgreSQL/MySQL)
- **Authentication**: NextAuth.js with role-based access control
- **UI Components**: Lucide React icons, custom components
- **State Management**: React hooks, server-side rendering

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd codelabpayments
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update the `.env.local` file with your configuration:
   ```env
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Credentials

For testing purposes, you can use these demo credentials:

- **Admin**: admin@edtech.com / password
- **Mentor**: mentor@edtech.com / password  
- **Student**: student@edtech.com / password

## Project Structure

```
codelabpayments/
├── app/                    # Next.js 14 App Router
│   ├── admin/             # Admin module pages
│   ├── mentor/            # Mentor module pages
│   ├── student/           # Student module pages
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/            # Reusable React components
├── lib/                   # Utility functions and configurations
├── prisma/                # Database schema and migrations
└── types/                 # TypeScript type definitions
```

## Key Features Explained

### Role-Based Access Control
- **Students**: Can view courses, communicate with mentors, make payments
- **Mentors**: Can view assigned students, track earnings, communicate
- **Admins**: Full system access, user management, course creation

### Commission System
- Automatic 37% commission calculation for mentors
- Real-time earnings tracking
- Monthly and total earnings reports

### Assignment System
- Admins can assign mentors to students for specific courses
- Automatic commission tracking based on assignments
- Assignment status management

### Payment Processing
- Split payment support for large course fees
- Automatic commission distribution
- Payment status tracking and notifications

## Database Schema

The application uses a comprehensive database schema with the following key entities:

- **Users**: Students, mentors, and admins with role-based access
- **Courses**: Course information and pricing
- **Enrollments**: Student course enrollments
- **MentorAssignments**: Mentor-student-course relationships
- **Payments**: Payment tracking with commission calculations
- **Messages**: Real-time messaging system

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication

### Messaging
- `GET /api/messages/conversations` - Get user conversations
- `GET /api/messages/[userId]` - Get messages with specific user
- `POST /api/messages` - Send a message
- `POST /api/messages/[userId]/read` - Mark messages as read

### Payments
- `POST /api/payments/create` - Create a payment
- `GET /api/payments` - Get payment history

### Assignments
- `POST /api/assignments/create` - Create mentor assignment

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Other Platforms
The application can be deployed to any platform that supports Next.js:
- Railway
- Netlify
- AWS Amplify
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.

## Future Enhancements

- [ ] Stripe integration for real payments
- [ ] Email notifications
- [ ] Mobile app
- [ ] Advanced analytics dashboard
- [ ] Video conferencing integration
- [ ] Course content management
- [ ] Automated mentor matching
- [ ] Multi-language support

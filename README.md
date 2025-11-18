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
- **Stripe integration** for real payment processing
- Payment webhooks for automated status updates

### 💬 Messaging System
- Real-time messaging between students and mentors
- Conversation management
- Message read receipts
- Email notifications for new messages

### 🔒 Security Features
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input sanitization to prevent XSS attacks
- Environment variable validation
- React Error Boundaries for graceful error handling

### 📊 Monitoring & Logging
- Health check endpoint (`/api/health`)
- Audit logging for admin actions
- Comprehensive error tracking

### 📧 Email Notifications
- Payment confirmation emails
- Enrollment confirmation emails
- New message notifications
- Mentor assignment notifications
- Support for Resend, SendGrid, and SMTP

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
   npx prisma migrate dev
   ```
   
   Or if you prefer to use db push (development only):
   ```bash
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
│   │   ├── health/        # Health check endpoint
│   │   ├── payments/      # Payment endpoints (Stripe integration)
│   │   └── ...            # Other API endpoints
│   └── auth/              # Authentication pages
├── components/            # Reusable React components
│   ├── ErrorBoundary.tsx # Error boundary component
│   └── ...                # Other components
├── lib/                   # Utility functions and configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── env.ts            # Environment variable validation
│   ├── sanitize.ts       # Input sanitization utilities
│   ├── rateLimit.ts      # Rate limiting middleware
│   ├── middleware.ts     # API middleware utilities
│   ├── audit.ts          # Audit logging utilities
│   ├── email.ts          # Email service
│   ├── pagination.ts     # Pagination utilities
│   └── ...               # Other utilities
├── prisma/                # Database schema and migrations
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Migration files
├── tests/                 # Test files
│   ├── setup.ts          # Test setup
│   └── lib/              # Library tests
├── .circleci/            # CI/CD configuration
└── types/                # TypeScript type definitions
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

- **Users**: Students, mentors, and admins with role-based access (includes password hashing)
- **Courses**: Course information and pricing
- **Enrollments**: Student course enrollments
- **MentorAssignments**: Mentor-student-course relationships
- **Payments**: Payment tracking with commission calculations
- **Messages**: Real-time messaging system
- **AuditLog**: Audit trail for admin actions
- **Discounts**: Discount code management
- **DiscountApplications**: Applied discount tracking
- **Expenses**: Expense tracking for admins

## API Endpoints

### Health Check
- `GET /api/health` - Application health status and metrics

### Authentication
- `POST /api/auth/signup` - User registration (rate limited, input sanitized)
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication

### Messaging
- `GET /api/messages/conversations` - Get user conversations
- `GET /api/messages/[userId]` - Get messages with specific user
- `POST /api/messages` - Send a message (rate limited, email notifications)
- `POST /api/messages/[userId]/read` - Mark messages as read

### Payments
- `POST /api/payments/create` - Create a payment (Stripe integration)
- `POST /api/payments/webhook` - Stripe webhook handler
- `GET /api/payments` - Get payment history

### Assignments
- `POST /api/assignments/create` - Create mentor assignment

### Users (Admin only)
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/[id]` - Get specific user
- `PUT /api/users/[id]` - Update user (audit logged)
- `DELETE /api/users/[id]` - Delete user (audit logged)

### Courses (Admin only)
- `GET /api/courses` - Get all courses (paginated)
- `POST /api/courses` - Create course
- `GET /api/courses/[id]` - Get specific course
- `PUT /api/courses/[id]` - Update course
- `DELETE /api/courses/[id]` - Delete course

### Enrollments (Admin only)
- `GET /api/enrollments` - Get all enrollments
- `POST /api/enrollments/create` - Create enrollment (email notifications)
- `GET /api/enrollments/[id]` - Get specific enrollment
- `PUT /api/enrollments/[id]` - Update enrollment
- `DELETE /api/enrollments/[id]` - Delete enrollment

### Discounts (Admin only)
- `GET /api/discounts` - Get all discounts
- `POST /api/discounts` - Create discount
- `POST /api/discounts/apply` - Apply discount to enrollment

**Note**: All API endpoints include rate limiting, input sanitization, and proper error handling. See `API_DOCUMENTATION.md` for complete API reference.

## Deployment

### Hostinger VPS with Coolify (Recommended for Production)
See `DEPLOYMENT.md` for complete deployment guide including:
- Coolify setup on Hostinger VPS
- CircleCI CI/CD pipeline configuration
- Environment variable configuration
- Database migration setup
- SSL/HTTPS configuration

### Vercel (Quick Deploy)
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

### Environment Variables
Required environment variables (see `env.example`):
```env
DATABASE_URL="file:./dev.db"  # or PostgreSQL/MySQL URL
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"  # Minimum 32 characters

# Stripe (optional - for real payments)
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (optional - for notifications)
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=""
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM=""
# Or use Resend
RESEND_API_KEY=""
# Or use SendGrid
SENDGRID_API_KEY=""
```

## Testing

The project includes a comprehensive testing setup with Vitest:

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

Test files are located in the `tests/` directory. See `tests/lib/` for example tests.

## Database Migrations

The project uses Prisma migrations for database schema management:

```bash
# Create a new migration
npm run db:migrate

# Apply migrations in production
npm run db:migrate:deploy

# Check migration status
npm run db:migrate:status

# Reset database (development only)
npm run db:reset
```

See `prisma/MIGRATION_GUIDE.md` for detailed migration documentation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run tests: `npm test`
6. Run linter: `npm run lint`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.

## Recent Improvements

The following features have been recently implemented:

- ✅ **Stripe Integration** - Real payment processing with Payment Intents and webhooks
- ✅ **Email Notifications** - Automated emails for payments, enrollments, and messages
- ✅ **Security Hardening** - Password hashing, rate limiting, input sanitization
- ✅ **Error Handling** - React Error Boundaries and improved error messages
- ✅ **Audit Logging** - Complete audit trail for admin actions
- ✅ **Testing Infrastructure** - Vitest setup with test examples
- ✅ **API Documentation** - Complete API reference (see `API_DOCUMENTATION.md`)
- ✅ **Health Monitoring** - Health check endpoint for monitoring
- ✅ **Pagination** - Paginated responses for list endpoints
- ✅ **Database Migrations** - Proper migration workflow setup
- ✅ **CI/CD Pipeline** - CircleCI configuration for automated builds
- ✅ **Type Safety** - Removed all `any` types, proper TypeScript interfaces
- ✅ **Environment Validation** - Zod-based environment variable validation

## Future Enhancements

- [ ] WebSocket-based real-time messaging (currently uses polling)
- [ ] Mobile app (React Native or PWA)
- [ ] Advanced analytics dashboard with charts
- [ ] Video conferencing integration
- [ ] Course content management system
- [ ] Automated mentor matching algorithm
- [ ] Multi-language support (i18n)
- [ ] Redis caching for improved performance
- [ ] Advanced search and filtering
- [ ] Bulk operations for admin tasks

## Documentation

- **API Documentation**: See `API_DOCUMENTATION.md` for complete API reference
- **Deployment Guide**: See `DEPLOYMENT.md` for deployment instructions
- **Migration Guide**: See `prisma/MIGRATION_GUIDE.md` for database migration help
- **Course Assignment Guide**: See `COURSE_ASSIGNMENT_GUIDE.md` for enrollment workflow

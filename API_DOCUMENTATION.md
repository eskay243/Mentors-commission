# API Documentation

This document provides an overview of all API endpoints in the EdTech Payment Platform.

## Base URL

- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

## Authentication

Most endpoints require authentication via NextAuth.js. Include the session cookie in requests.

### Admin Endpoints
Admin endpoints require the user to have the `ADMIN` role.

### Student/Mentor Endpoints
These endpoints require the user to have the appropriate role (`STUDENT` or `MENTOR`).

---

## Health Check

### GET /api/health

Check the health status of the application.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "responseTime": 5
  },
  "memory": {
    "used": 128,
    "total": 256,
    "percentage": 50
  },
  "responseTime": 10
}
```

---

## Authentication

### POST /api/auth/signup

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "STUDENT",
  "phone": "+1234567890"
}
```

**Response:** `201 Created`
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "role": "STUDENT"
  }
}
```

**Rate Limit:** 5 requests per 15 minutes

---

## Users

### GET /api/users

Get all users (Admin only).

**Query Parameters:**
- `role` (optional): Filter by role (STUDENT, MENTOR, ADMIN)

**Response:** `200 OK`
```json
[
  {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STUDENT",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### GET /api/users/[id]

Get a specific user by ID (Admin only).

**Response:** `200 OK`
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "STUDENT",
  "enrollments": [],
  "mentorAssignments": []
}
```

### PUT /api/users/[id]

Update a user (Admin only).

**Request Body:**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "phone": "+1234567890",
  "role": "STUDENT"
}
```

**Response:** `200 OK`

### DELETE /api/users/[id]

Delete a user (Admin only).

**Response:** `200 OK`
```json
{
  "message": "User deleted successfully"
}
```

---

## Courses

### GET /api/courses

Get all courses.

**Response:** `200 OK`
```json
[
  {
    "id": "course_id",
    "title": "Full-Stack Web Development",
    "description": "Learn full-stack development",
    "price": 50000,
    "duration": 12,
    "level": "BEGINNER",
    "category": "Web Development"
  }
]
```

### POST /api/courses

Create a new course (Admin only).

**Request Body:**
```json
{
  "title": "Full-Stack Web Development",
  "description": "Learn full-stack development",
  "price": 50000,
  "duration": 12,
  "level": "BEGINNER",
  "category": "Web Development",
  "isActive": true
}
```

**Response:** `201 Created`

### GET /api/courses/[id]

Get a specific course by ID.

**Response:** `200 OK`

### PUT /api/courses/[id]

Update a course (Admin only).

**Request Body:** Same as POST

**Response:** `200 OK`

### DELETE /api/courses/[id]

Delete a course (Admin only).

**Response:** `200 OK`

---

## Enrollments

### GET /api/enrollments

Get all enrollments (Admin only).

**Response:** `200 OK`
```json
[
  {
    "id": "enrollment_id",
    "studentId": "student_id",
    "courseId": "course_id",
    "status": "ACTIVE",
    "totalAmount": 50000,
    "paidAmount": 25000,
    "startDate": "2024-01-01T00:00:00.000Z"
  }
]
```

### POST /api/enrollments/create

Create a new enrollment (Admin only).

**Request Body:**
```json
{
  "studentId": "student_id",
  "courseId": "course_id",
  "totalAmount": 50000,
  "paidAmount": 0,
  "status": "ACTIVE",
  "discountAdjustment": {
    "type": "none",
    "value": 0
  }
}
```

**Response:** `201 Created`

### GET /api/enrollments/[id]

Get a specific enrollment (Admin only).

**Response:** `200 OK`

### PUT /api/enrollments/[id]

Update an enrollment (Admin only).

**Request Body:**
```json
{
  "totalAmount": 60000,
  "paidAmount": 30000,
  "status": "ACTIVE"
}
```

**Response:** `200 OK`

### DELETE /api/enrollments/[id]

Delete an enrollment (Admin only).

**Response:** `200 OK`

---

## Payments

### POST /api/payments/create

Create a payment (Student only).

**Request Body:**
```json
{
  "enrollmentId": "enrollment_id",
  "amount": 25000,
  "description": "Payment for course"
}
```

**Response:** `201 Created`
```json
{
  "id": "payment_id",
  "enrollmentId": "enrollment_id",
  "amount": 25000,
  "mentorCommission": 9250,
  "platformFee": 750,
  "status": "PENDING",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Note:** Payment processing is simulated. In production, this would integrate with Stripe.

---

## Messages

### GET /api/messages/conversations

Get all conversations for the current user.

**Response:** `200 OK`
```json
[
  {
    "userId": "user_id",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "lastMessage": {
      "content": "Hello!",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "unreadCount": 2
  }
]
```

### GET /api/messages/[userId]

Get messages with a specific user.

**Response:** `200 OK`
```json
[
  {
    "id": "message_id",
    "content": "Hello!",
    "read": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "sender": {
      "id": "sender_id",
      "name": "John Doe"
    }
  }
]
```

### POST /api/messages

Send a message.

**Request Body:**
```json
{
  "receiverId": "receiver_id",
  "content": "Hello!"
}
```

**Response:** `201 Created`

**Rate Limit:** 5 requests per 15 minutes

### POST /api/messages/[userId]/read

Mark messages as read.

**Response:** `200 OK`

---

## Discounts

### GET /api/discounts

Get all discounts (Admin only).

**Response:** `200 OK`
```json
[
  {
    "id": "discount_id",
    "code": "SAVE20",
    "name": "20% Off",
    "type": "PERCENTAGE",
    "value": 20,
    "isActive": true,
    "usageLimit": 100,
    "usedCount": 5
  }
]
```

### POST /api/discounts

Create a discount (Admin only).

**Request Body:**
```json
{
  "code": "SAVE20",
  "name": "20% Off",
  "description": "Get 20% off your enrollment",
  "type": "PERCENTAGE",
  "value": 20,
  "minAmount": 10000,
  "maxDiscount": 5000,
  "usageLimit": 100,
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.000Z",
  "isActive": true
}
```

**Response:** `201 Created`

### POST /api/discounts/apply

Apply a discount to an enrollment.

**Request Body:**
```json
{
  "discountCode": "SAVE20",
  "enrollmentId": "enrollment_id",
  "coursePrice": 50000
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "discountAmount": 10000,
  "finalAmount": 40000,
  "discount": {
    "code": "SAVE20",
    "name": "20% Off"
  }
}
```

---

## Assignments

### POST /api/assignments/create

Create a mentor assignment (Admin only).

**Request Body:**
```json
{
  "mentorId": "mentor_id",
  "enrollmentId": "enrollment_id",
  "commission": 37.0
}
```

**Response:** `201 Created`

---

## Student Profile

### GET /api/students/profile

Get current student's profile (Student only).

**Response:** `200 OK`
```json
{
  "id": "user_id",
  "name": "John Doe",
  "email": "john@example.com",
  "studentProfile": {
    "bio": "I'm a student",
    "goals": "Learn web development",
    "level": "BEGINNER"
  }
}
```

### PUT /api/students/profile

Update student profile (Student only).

**Request Body:**
```json
{
  "bio": "Updated bio",
  "goals": "Updated goals",
  "level": "INTERMEDIATE"
}
```

**Response:** `200 OK`

---

## Mentor Profile

### GET /api/mentors/profile

Get current mentor's profile (Mentor only).

**Response:** `200 OK`

### PUT /api/mentors/profile

Update mentor profile (Mentor only).

**Request Body:**
```json
{
  "bio": "Updated bio",
  "expertise": "React, Node.js",
  "experience": 5
}
```

**Response:** `200 OK`

---

## Expenses

### GET /api/expenses

Get all expenses (Admin only).

**Response:** `200 OK`

### POST /api/expenses

Create an expense (Admin only).

**Request Body:**
```json
{
  "title": "Office Supplies",
  "description": "Purchased office supplies",
  "amount": 5000,
  "category": "Office",
  "receiptUrl": "https://example.com/receipt.pdf"
}
```

**Response:** `201 Created`

---

## Import

### POST /api/admin/import/preview

Preview CSV import (Admin only).

**Request:** Multipart form data with CSV file

**Response:** `200 OK`
```json
{
  "preview": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "course": "Full-Stack Web Development"
    }
  ],
  "errors": []
}
```

### POST /api/admin/import/students

Import students from CSV (Admin only).

**Request:** Multipart form data with CSV file

**Response:** `200 OK`
```json
{
  "success": true,
  "imported": 10,
  "total": 10,
  "duplicates": 0,
  "errors": []
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

- **Strict endpoints** (signup, login, messages): 5 requests per 15 minutes
- **Standard endpoints**: 100 requests per 15 minutes
- **Lenient endpoints** (read-only): 200 requests per 15 minutes

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Timestamp when limit resets
- `Retry-After`: Seconds to wait before retrying (on 429)

---

## Notes

- All timestamps are in ISO 8601 format
- All monetary amounts are in the smallest currency unit (e.g., cents, kobo)
- All string inputs are sanitized to prevent XSS attacks
- All admin actions are logged in the audit log
- Payment processing is currently simulated (Stripe integration pending)


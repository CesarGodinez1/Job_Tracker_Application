# Job Tracker Application - Project Index

## Project Overview
A Next.js-based job application tracking system that allows users to manage their job applications, track application statuses, and maintain contact information with companies.

## Technology Stack
- **Framework**: Next.js 15.5.4 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v4.24.11
- **Styling**: Tailwind CSS v4
- **Password Hashing**: bcryptjs
- **Validation**: Zod

## Project Structure

### Core Application Files
```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/[...nextauth]/   # NextAuth configuration
│   │   └── register/             # User registration endpoint
│   ├── applications/             # Protected applications page
│   ├── signin/                   # Sign-in page
│   ├── signup/                   # Sign-up page
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page (default Next.js template)
├── lib/
│   └── db.ts                     # Prisma client configuration
└── middleware.ts                 # NextAuth middleware for route protection
```

### Database Schema (Prisma)
The application uses a comprehensive database schema with the following models:

#### Core Models
- **User**: User accounts with authentication
- **Account**: OAuth provider accounts
- **Session**: User sessions
- **VerificationToken**: Email verification tokens

#### Business Logic Models
- **Company**: Company information and details
- **Job**: Job postings with salary, location, and company relations
- **Application**: Job applications with status tracking
- **Note**: Notes attached to applications
- **Activity**: Activity log for applications (interviews, etc.)
- **Contact**: Company contacts and networking

#### Enums
- **ApplicationStatus**: SAVED, APPLIED, OA, INTERVIEW, OFFER, REJECTED, WITHDRAWN
- **InterviewType**: PHONE, TECHNICAL, BEHAVIORAL, ONSITE, OTHER

## Key Features

### Authentication System
- **Registration**: Custom signup with email/password validation
- **Login**: Credentials-based authentication
- **Session Management**: Database-backed sessions
- **Route Protection**: Middleware protects `/applications` routes

### User Interface
- **Home Page**: Default Next.js template (needs customization)
- **Sign Up**: Form with name, email, password validation
- **Sign In**: Email/password authentication
- **Applications**: Protected page for job application management

### API Endpoints
- `POST /api/register`: User registration with validation
- `POST /api/auth/[...nextauth]`: NextAuth authentication routes

## Database Configuration
- **Provider**: PostgreSQL
- **ORM**: Prisma with generated client
- **Migrations**: Located in `prisma/migrations/`
- **Connection**: Configured via `DATABASE_URL` environment variable

## Development Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Database operations
npx prisma generate    # Generate Prisma client
npx prisma migrate    # Run migrations
npx prisma studio     # Database GUI
```

## Current Status
The project appears to be in early development with:
- ✅ Basic authentication system implemented
- ✅ Database schema defined
- ✅ User registration and login working
- ⚠️ Applications page is placeholder (needs implementation)
- ⚠️ Home page is default Next.js template (needs customization)
- ⚠️ No job application CRUD operations yet

## Next Development Steps
1. Implement job application management UI
2. Add company and job creation functionality
3. Build application status tracking interface
4. Add contact management features
5. Customize home page for job tracking workflow
6. Add data visualization and analytics

## Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Secret for NextAuth session encryption

## Dependencies Analysis
- **Production**: Next.js, React, Prisma, NextAuth, bcryptjs, Zod
- **Development**: TypeScript, ESLint, Tailwind CSS
- **Database**: PostgreSQL with Prisma adapter for NextAuth

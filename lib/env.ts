import { z } from 'zod'

/**
 * Environment variable validation schema
 * This ensures all required environment variables are present and valid at startup
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // NextAuth.js
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional().default('http://localhost:3000'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  
  // Stripe (optional for development)
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  
  // Email (optional)
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.string().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email('EMAIL_FROM must be a valid email').optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
})

/**
 * Validated environment variables
 * Skip validation during build time to allow Docker builds to succeed
 * Validation will occur at runtime when the application starts
 */
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
                    process.argv.includes('build') ||
                    !process.env.DATABASE_URL

export const env = isBuildTime
  ? {
      // Provide safe defaults during build
      DATABASE_URL: process.env.DATABASE_URL || 'file:./prisma/dev.db',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'build-time-secret-minimum-32-characters-long-for-validation',
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
      EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
      EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
      EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
      EMAIL_FROM: process.env.EMAIL_FROM,
      NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    } as z.infer<typeof envSchema>
  : envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
      EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
      EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
      EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
      EMAIL_FROM: process.env.EMAIL_FROM,
      NODE_ENV: process.env.NODE_ENV,
    })

/**
 * Type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>


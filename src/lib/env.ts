import { z } from 'zod'

/**
 * Environment variables schema with validation
 * This ensures all required environment variables are present and valid
 */
const envSchema = z.object({
    // Database
    MONGODB_URI: z.url().min(1),

    // NextAuth
    NEXTAUTH_URL: z.url().min(1),
    NEXTAUTH_SECRET: z.string().min(32),

    // Optional OAuth providers
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_ID: z.string().optional(),
    GITHUB_SECRET: z.string().optional(),

    // App config
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    NEXT_PUBLIC_APP_URL: z.url().min(1),
    PG_SERVICE_BASE_URL: z.string().min(1),
})

// Validate and parse environment variables
const envParse = envSchema.safeParse({
    MONGODB_URI: process.env.MONGODB_URI,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    PG_SERVICE_BASE_URL: process.env.PG_SERVICE_BASE_URL,
})

if (!envParse.success) {
    console.error('❌ Invalid environment variables:', envParse.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
}

/**
 * Type-safe environment variables
 * Usage: import { env } from '@/lib/env'
 */
export const env = envParse.data

/**
 * Check if we're in development mode
 */
export const isDev = env.NODE_ENV === 'development'

/**
 * Check if we're in production mode
 */
export const isProd = env.NODE_ENV === 'production'

/**
 * Check if we're in test mode
 */
export const isTest = env.NODE_ENV === 'test'
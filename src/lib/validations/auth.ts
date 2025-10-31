import { z } from 'zod'

/**
 * Validation schemas using Zod
 * 
 * Why Zod?
 * - Runtime type checking
 * - TypeScript type inference
 * - Clear error messages
 * - Works on client and server
 */

/**
 * Login validation schema
 */
export const loginSchema = z.object({
    email: z
        .email('Invalid email address')
        .min(1, 'Email is required'),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Register validation schema
 */
export const registerSchema = z
    .object({
        name: z
            .string()
            .min(1, 'Name is required')
            .min(2, 'Name must be at least 2 characters')
            .max(50, 'Name must be less than 50 characters'),
        email: z
            .email('Invalid email address')
            .min(1, 'Email is required'),
        password: z
            .string()
            .min(1, 'Password is required')
            .min(6, 'Password must be at least 6 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            ),
    })

export type RegisterInput = z.infer<typeof registerSchema>

/**
 * Update profile validation schema
 */
export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters')
        .optional(),
    bio: z
        .string()
        .max(500, 'Bio must be less than 500 characters')
        .optional(),
    location: z
        .string()
        .max(100, 'Location must be less than 100 characters')
        .optional(),
    website: z
        .string()
        .url('Invalid URL')
        .optional()
        .or(z.literal('')),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

/**
 * Change password validation schema
 */
export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            ),
        confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: 'Passwords do not match',
        path: ['confirmNewPassword'],
    })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

/**
 * Email verification schema
 */
export const emailVerificationSchema = z.object({
    email: z.string().email('Invalid email address'),
})

export type EmailVerificationInput = z.infer<typeof emailVerificationSchema>

/**
 * Reset password schema
 */
export const resetPasswordSchema = z
    .object({
        token: z.string().min(1, 'Token is required'),
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                'Password must contain at least one uppercase letter, one lowercase letter, and one number'
            ),
        confirmPassword: z.string().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>